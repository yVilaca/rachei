import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth.store'
import GroupHeader from './components/GroupHeader'
import DebtList from './components/DebtList'
import { groupService } from '../../services/group.service'
import { debtService } from '../../services/debt.service'
import { useToast } from '../../hooks/useToast'
import Toast from '../../components/Toast'
import type { Debt, GroupDetail } from '../../types'

export default function GroupPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.currentUser)
  const { message: toastMsg, show: showToast } = useToast()

  const [group, setGroup] = useState<GroupDetail | null>(null)
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal adicionar membro
  const [showAddModal, setShowAddModal] = useState(false)
  const [addPhone, setAddPhone] = useState('')
  const [addName, setAddName] = useState('')
  const [addRole, setAddRole] = useState<'admin' | 'member'>('member')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [phoneStatus, setPhoneStatus] = useState<'idle' | 'checking' | 'exists' | 'not_found'>('idle')
  const phoneDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const [g, d] = await Promise.all([
          groupService.getGroup(id!),
          debtService.getDebtsByGroup(id!),
        ])
        if (!cancelled) { setGroup(g); setDebts(d) }
      } catch {
        if (!cancelled) setError('Grupo não encontrado ou sem acesso.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  const groupBalance = (() => {
    if (!currentUser) return 0
    let net = 0
    for (const debt of debts) {
      for (const inst of debt.installments) {
        if (inst.status === 'paid') continue
        if (debt.paidBy.id === currentUser.id && inst.debtor.id !== currentUser.id) net += inst.amountCents
        if (inst.debtor.id === currentUser.id && debt.paidBy.id !== currentUser.id) net -= inst.amountCents
      }
    }
    return net
  })()

  const E164_RE = /^\+\d{8,15}$/

  function handleAddPhoneChange(value: string) {
    setAddPhone(value)
    setAddError(null)

    if (phoneDebounceRef.current) clearTimeout(phoneDebounceRef.current)

    if (!E164_RE.test(value)) {
      setPhoneStatus('idle')
      return
    }

    setPhoneStatus('checking')
    phoneDebounceRef.current = setTimeout(async () => {
      try {
        const exists = await groupService.checkPhone(value)
        setPhoneStatus(exists ? 'exists' : 'not_found')
        if (exists) setAddName('')
      } catch {
        setPhoneStatus('idle')
      }
    }, 600)
  }

  function openAddModal() {
    setAddPhone('')
    setAddName('')
    setAddRole('member')
    setAddError(null)
    setPhoneStatus('idle')
    if (phoneDebounceRef.current) clearTimeout(phoneDebounceRef.current)
    setShowAddModal(true)
  }

  async function handleAddMember() {
    const phone = addPhone.trim()
    if (!phone) { setAddError('Informe o telefone.'); return }
    if (!E164_RE.test(phone)) {
      setAddError('Use o formato E.164, ex: +5511999999999')
      return
    }
    if (phoneStatus === 'not_found' && !addName.trim()) {
      setAddError('Nome obrigatório para contatos não cadastrados.')
      return
    }
    setAdding(true)
    setAddError(null)
    try {
      const member = await groupService.addMember(id!, { phone, name: addName.trim() || undefined, role: addRole })
      setGroup((prev) => prev ? { ...prev, members: [...prev.members, member] } : prev)
      setShowAddModal(false)
      showToast('Membro adicionado!')
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data
      if (data?.name) {
        setAddError('Nome obrigatório para contatos ainda não cadastrados.')
      } else if (data?.phone) {
        const msg = Array.isArray(data.phone) ? String(data.phone[0]) : String(data.phone)
        setAddError(msg)
      } else {
        setAddError('Erro ao adicionar membro.')
      }
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <div className="no-scrollbar min-h-dvh overflow-auto bg-[#F5F5F8] pb-28">
        <div style={{ padding: '52px 20px 0' }}>
          <div style={{ height: 120, background: '#fff', borderRadius: 18, opacity: 0.5 }} />
        </div>
      </div>
    )
  }

  if (error || !group) {
    return (
      <div style={{ display: 'flex', minHeight: '100dvh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20 }}>
        <p style={{ color: '#6B6B76', fontSize: 14 }}>{error ?? 'Grupo não encontrado'}</p>
        <button
          onClick={() => navigate('/grupos')}
          style={{ color: '#FF5436', fontWeight: 700, fontSize: 14, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Voltar
        </button>
      </div>
    )
  }

  const currentMember = group.members.find((m) => m.user?.id === currentUser?.id)
  const isAdmin = currentMember?.role === 'admin'

  return (
    <div className="no-scrollbar min-h-dvh overflow-auto bg-[#F5F5F8] pb-28">
      <GroupHeader group={group} groupBalance={groupBalance} />
      <DebtList debts={debts} />

      <div style={{ padding: '12px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={() => navigate(`/grupos/${group.id}/nova-divida`)}
          style={{
            width: '100%', padding: '15px', borderRadius: 16,
            background: 'linear-gradient(135deg,#FF5436,#FF8A3D)',
            color: '#fff', fontWeight: 800, fontSize: 15.5,
            border: 'none', cursor: 'pointer',
            boxShadow: '0 8px 18px rgba(255,84,54,.28)',
          }}
        >
          + Registrar dívida
        </button>

        {isAdmin && (
          <button
            onClick={openAddModal}
            style={{
              width: '100%', padding: '13px', borderRadius: 16,
              background: '#fff', color: '#FF5436', fontWeight: 800, fontSize: 14.5,
              border: '2px solid #FFD8D0', cursor: 'pointer',
            }}
          >
            + Adicionar membro
          </button>
        )}
      </div>

      <Toast message={toastMsg} />

      {/* Modal adicionar membro */}
      {showAddModal && (
        <div
          className="rc-overlay"
          onClick={() => { if (!adding) setShowAddModal(false) }}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,.45)', display: 'flex',
            alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '24px 24px 0 0',
              padding: '24px 20px 40px', width: '100%', maxWidth: 480,
            }}
          >
            <div style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 20, color: '#15151A', marginBottom: 20 }}>
              Adicionar membro
            </div>

            <div style={{ fontSize: 12, fontWeight: 700, color: '#6B6B76', marginBottom: 8 }}>TELEFONE (E.164)</div>
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <input
                value={addPhone}
                onChange={(e) => handleAddPhoneChange(e.target.value)}
                placeholder="+5511999999999"
                maxLength={16}
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 14,
                  border: addError ? '2px solid #FF5436' : '2px solid #E8E8EF',
                  fontSize: 15, color: '#1A1A1F', outline: 'none',
                  fontFamily: 'Poppins, sans-serif',
                  boxSizing: 'border-box',
                  paddingRight: phoneStatus !== 'idle' ? 44 : 16,
                }}
              />
              {phoneStatus === 'checking' && (
                <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%',
                    border: '2px solid #E8E8EF', borderTopColor: '#FF5436',
                    animation: 'spin 0.7s linear infinite',
                  }} />
                </div>
              )}
              {phoneStatus === 'exists' && (
                <div style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 16, color: '#11A36B',
                }}>✓</div>
              )}
              {phoneStatus === 'not_found' && (
                <div style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 13, color: '#B0B0BA',
                }}>?</div>
              )}
            </div>

            {phoneStatus === 'not_found' && (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6B6B76', marginBottom: 8 }}>NOME DO CONTATO *</div>
                <input
                  value={addName}
                  onChange={(e) => { setAddName(e.target.value); setAddError(null) }}
                  placeholder="Nome completo"
                  maxLength={150}
                  style={{
                    width: '100%', padding: '14px 16px', borderRadius: 14,
                    border: addError && !addName.trim() ? '2px solid #FF5436' : '2px solid #E8E8EF',
                    fontSize: 15, color: '#1A1A1F', outline: 'none',
                    fontFamily: 'Poppins, sans-serif',
                    boxSizing: 'border-box', marginBottom: 14,
                  }}
                />
              </>
            )}

            <div style={{ fontSize: 12, fontWeight: 700, color: '#6B6B76', marginBottom: 8 }}>PAPEL</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {(['member', 'admin'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setAddRole(r)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 13.5,
                    border: addRole === r ? '2px solid #FF5436' : '2px solid #E8E8EF',
                    background: addRole === r ? '#FFF0ED' : '#F8F8FB',
                    color: addRole === r ? '#FF5436' : '#6B6B76',
                  }}
                >
                  {r === 'member' ? 'Membro' : 'Admin'}
                </button>
              ))}
            </div>

            {addError && (
              <div style={{ color: '#FF5436', fontSize: 12.5, marginBottom: 12 }}>{addError}</div>
            )}

            <button
              onClick={handleAddMember}
              disabled={adding}
              style={{
                width: '100%', padding: '15px', borderRadius: 16, border: 'none', cursor: 'pointer',
                background: adding ? '#E8E8EF' : 'linear-gradient(135deg,#FF5436,#FF8A3D)',
                color: adding ? '#9A9AA4' : '#fff', fontWeight: 800, fontSize: 15.5,
              }}
            >
              {adding ? 'Adicionando...' : 'Adicionar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
