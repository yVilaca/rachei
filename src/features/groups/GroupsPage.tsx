import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth.store'
import { formatCurrency } from '../../lib/utils'
import { useToast } from '../../hooks/useToast'
import Toast from '../../components/Toast'
import { groupService, type PendingGroup } from '../../services/group.service'
import { debtService } from '../../services/debt.service'
import type { GroupSummary } from '../../types'

const EMOJI_BG: Record<string, string> = {
  '🏖️': '#FFF0ED',
  '🏠': '#EDF4FF',
  '🍕': '#FFF8EC',
  '🎮': '#F0EDFF',
  '✈️': '#EDF4FF',
}

const EMOJI_OPTIONS = ['👥', '🏖️', '🏠', '🍕', '🎮', '✈️', '🎉', '💪', '🌍', '🎵']

export default function GroupsPage() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.currentUser)
  const { message: toastMsg, show: showToast } = useToast()

  const [groups, setGroups] = useState<GroupSummary[]>([])
  const [pendingGroups, setPendingGroups] = useState<PendingGroup[]>([])
  const [balances, setBalances] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal criar grupo
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupEmoji, setNewGroupEmoji] = useState('👥')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Modal confirmar participação
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const [gs, pg] = await Promise.all([
          groupService.getGroups(),
          groupService.getPendingGroups(),
        ])
        if (!cancelled) {
          setGroups(gs)
          setPendingGroups(pg)
        }

        // Saldo por grupo a partir das dívidas reais (mesma regra do GroupPage)
        if (currentUser) {
          const perGroup = await Promise.all(
            gs.map((g) => debtService.getDebtsByGroup(g.id).catch(() => [])),
          )
          if (!cancelled) {
            const map: Record<string, number> = {}
            gs.forEach((g, i) => {
              let net = 0
              for (const debt of perGroup[i]) {
                for (const inst of debt.installments) {
                  if (inst.status === 'paid') continue
                  if (debt.paidBy.id === currentUser.id && inst.debtor.id !== currentUser.id) net += inst.amountCents
                  if (inst.debtor.id === currentUser.id && debt.paidBy.id !== currentUser.id) net -= inst.amountCents
                }
              }
              map[g.id] = net
            })
            setBalances(map)
          }
        }
      } catch {
        if (!cancelled) setError('Erro ao carregar grupos. Tente novamente.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [currentUser])

  async function handleCreate() {
    const name = newGroupName.trim()
    if (!name) { setCreateError('Nome obrigatório.'); return }
    setCreating(true)
    setCreateError(null)
    try {
      const created = await groupService.createGroup(name, newGroupEmoji !== '👥' ? newGroupEmoji : undefined)
      setGroups((prev) => [created, ...prev])
      setShowCreateModal(false)
      setNewGroupName('')
      setNewGroupEmoji('👥')
      showToast('Grupo criado!')
    } catch {
      setCreateError('Não foi possível criar o grupo.')
    } finally {
      setCreating(false)
    }
  }

  async function handleConfirm(pg: PendingGroup, aceitar: boolean) {
    setConfirmingId(pg.group.id)
    try {
      await groupService.confirmGroup(pg.group.id, aceitar)
      setPendingGroups((prev) => prev.filter((p) => p.membershipId !== pg.membershipId))
      if (aceitar) {
        const updated = await groupService.getGroups()
        setGroups(updated)
        showToast('Participação confirmada!')
      } else {
        showToast('Participação recusada.')
      }
    } catch {
      showToast('Erro ao responder convite.')
    } finally {
      setConfirmingId(null)
    }
  }

  if (!currentUser) return null

  const isFree = currentUser.plan === 'free'

  return (
    <div
      className="no-scrollbar min-h-dvh overflow-auto px-5 pb-28 pt-14 lg:px-10 lg:pb-10 lg:pt-9"
      style={{ background: '#F5F5F8', fontFamily: 'Poppins, sans-serif' }}
    >
      {/* Title */}
      <div style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 28, color: '#15151A', letterSpacing: '-0.02em', marginBottom: 4 }}>
        Grupos
      </div>
      <div style={{ fontSize: 13.5, color: '#6B6B76', marginBottom: 20 }}>
        {loading ? 'Carregando...' : `${groups.length} grupo${groups.length !== 1 ? 's' : ''} ativo${groups.length !== 1 ? 's' : ''}`}
      </div>

      {/* Pendentes de confirmação */}
      {pendingGroups.length > 0 && (
        <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pendingGroups.map((pg) => (
            <div key={pg.membershipId} style={{
              background: '#FFF8EC', border: '1px solid #FFE0A0', borderRadius: 18, padding: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 24 }}>{pg.group.emoji ?? '👥'}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1A1A1F' }}>{pg.group.name}</div>
                  <div style={{ fontSize: 12, color: '#8A6A00' }}>
                    Convite de {pg.adicionadoPor?.name ?? 'alguém'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleConfirm(pg, true)}
                  disabled={confirmingId === pg.group.id}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 12,
                    background: 'linear-gradient(135deg,#11A36B,#0E8F5C)',
                    color: '#fff', fontWeight: 800, fontSize: 13.5,
                    border: 'none', cursor: 'pointer', opacity: confirmingId === pg.group.id ? 0.6 : 1,
                  }}
                >
                  Aceitar
                </button>
                <button
                  onClick={() => handleConfirm(pg, false)}
                  disabled={confirmingId === pg.group.id}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 12,
                    background: '#F0F0F4', color: '#6B6B76', fontWeight: 800, fontSize: 13.5,
                    border: 'none', cursor: 'pointer', opacity: confirmingId === pg.group.id ? 0.6 : 1,
                  }}
                >
                  Recusar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Erro */}
      {error && (
        <div style={{ background: '#FFF0ED', border: '1px solid #FFD8D0', borderRadius: 16, padding: '14px 16px', marginBottom: 16, fontSize: 13.5, color: '#C0392B' }}>
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 20, padding: 16, height: 82, opacity: 0.5 }} />
          ))}
        </div>
      )}

      {/* Group cards */}
      {!loading && (
        <div className="grid grid-cols-1 gap-3 lg:gap-4 lg:[grid-template-columns:repeat(auto-fill,minmax(340px,1fr))]">
          {groups.length === 0 && !error && (
            <p className="lg:col-span-2" style={{ textAlign: 'center', color: '#6B6B76', fontSize: 13.5, padding: '24px 0' }}>
              Nenhum grupo ainda. Crie o primeiro!
            </p>
          )}
          {groups.map((group) => {
            const balance = balances[group.id] ?? 0
            const balanceColor = balance >= 0 ? '#11A36B' : '#FF5436'
            const balanceText = balance === 0 ? 'R$ 0,00' : formatCurrency(Math.abs(balance))
            const iconBg = group.emoji ? (EMOJI_BG[group.emoji] ?? '#FFF0ED') : '#F0F0F4'

            return (
              <button
                key={group.id}
                onClick={() => navigate(`/grupos/${group.id}`)}
                style={{
                  background: '#fff', borderRadius: 20, padding: 16,
                  boxShadow: '0 2px 10px rgba(0,0,0,.04)',
                  cursor: 'pointer', border: 'none', textAlign: 'left', width: '100%',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                  <div style={{
                    width: 50, height: 50, borderRadius: 15, background: iconBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24, flexShrink: 0,
                  }}>
                    {group.emoji ?? '👥'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#1A1A1F' }}>{group.name}</div>
                    <div style={{ fontSize: 12.5, color: '#6B6B76', marginTop: 2 }}>
                      {group.memberCount} membro{group.memberCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 10.5, color: '#6B6B76', fontWeight: 600 }}>seu saldo</div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: balanceColor, whiteSpace: 'nowrap', marginTop: 2 }}>
                      {balanceText}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <Toast message={toastMsg} />

      {/* Botão criar grupo */}
      <button
        onClick={() => setShowCreateModal(true)}
        style={{
          marginTop: 16, width: '100%',
          border: '2px dashed #D8D8DF', borderRadius: 20,
          padding: 18, textAlign: 'center',
          color: '#8A8A93', fontWeight: 700, fontSize: 14.5,
          background: 'transparent', cursor: 'pointer',
        }}
      >
        + Criar novo grupo
      </button>

      {/* Free plan banner */}
      {isFree && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginTop: 14, background: '#FFF4EF',
          border: '1px solid #FFE0D2', borderRadius: 16,
          padding: '13px 15px',
        }}>
          <span style={{ fontSize: 18 }}>✦</span>
          <div style={{ flex: 1, fontSize: 12.5, color: '#9A5A3E', lineHeight: 1.4 }}>
            <strong>Plano Free:</strong> 1 grupo próprio. Assine o Pro pra criar grupos ilimitados.
          </div>
        </div>
      )}

      {/* Modal criar grupo */}
      {showCreateModal && (
        <div
          className="rc-overlay"
          onClick={() => { if (!creating) setShowCreateModal(false) }}
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
              Novo grupo
            </div>

            {/* Emoji picker */}
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6B6B76', marginBottom: 8 }}>EMOJI</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => setNewGroupEmoji(e)}
                  style={{
                    width: 44, height: 44, borderRadius: 12, fontSize: 22,
                    border: newGroupEmoji === e ? '2.5px solid #FF5436' : '2px solid #E8E8EF',
                    background: newGroupEmoji === e ? '#FFF0ED' : '#F8F8FB',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {e}
                </button>
              ))}
            </div>

            {/* Nome */}
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6B6B76', marginBottom: 8 }}>NOME DO GRUPO</div>
            <input
              value={newGroupName}
              onChange={(e) => { setNewGroupName(e.target.value); setCreateError(null) }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
              placeholder="Ex: Viagem Floripa, República..."
              maxLength={80}
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 14,
                border: createError ? '2px solid #FF5436' : '2px solid #E8E8EF',
                fontSize: 15, color: '#1A1A1F', outline: 'none',
                fontFamily: 'Poppins, sans-serif',
                boxSizing: 'border-box',
              }}
            />
            {createError && (
              <div style={{ color: '#FF5436', fontSize: 12.5, marginTop: 6 }}>{createError}</div>
            )}

            <button
              onClick={handleCreate}
              disabled={creating || !newGroupName.trim()}
              style={{
                marginTop: 20, width: '100%', padding: '15px',
                borderRadius: 16, border: 'none', cursor: 'pointer',
                background: creating || !newGroupName.trim()
                  ? '#E8E8EF'
                  : 'linear-gradient(135deg,#FF5436,#FF8A3D)',
                color: creating || !newGroupName.trim() ? '#9A9AA4' : '#fff',
                fontWeight: 800, fontSize: 15.5,
                transition: 'background 0.2s',
              }}
            >
              {creating ? 'Criando...' : 'Criar grupo'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
