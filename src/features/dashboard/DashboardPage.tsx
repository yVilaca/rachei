import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth.store'
import { formatCurrency, getInitials } from '../../lib/utils'
import { avatarFor } from '../../lib/avatar'
import { useToast } from '../../hooks/useToast'
import Toast from '../../components/Toast'
import { dashboardService, type BalanceEntry, type CreditItem, type DashboardData, type OwedItem } from '../../services/dashboard.service'
import { debtService } from '../../services/debt.service'

const EMOJI_BG: Record<string, string> = {
  '🏖️': '#FFF0ED', '🏠': '#EDF4FF', '🍕': '#FFF8EC', '🎮': '#F0EDFF', '✈️': '#EDF4FF',
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.currentUser)
  const [debtTab, setDebtTab] = useState<0 | 1>(0)
  const { message: toastMsg, show: showToast } = useToast()

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    dashboardService.get()
      .then((d) => { if (!cancelled) { setData(d); setLoading(false) } })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const handleCharge = async (installmentId: string) => {
    try {
      const token = await debtService.generateChargeLink(installmentId)
      const url = `${window.location.origin}/pagar/${token}`
      await navigator.clipboard.writeText(url)
      showToast('Link copiado!')
    } catch {
      showToast('Erro ao gerar link.')
    }
  }

  if (!currentUser) return null

  const totalAReceber = data?.totalAReceber ?? 0
  const totalAPagar = data?.totalAPagar ?? 0
  const net = totalAReceber - totalAPagar
  const netText = (net >= 0 ? '+' : '') + formatCurrency(net)
  const netSub = net > 0
    ? 'Te devem mais do que você deve'
    : net < 0
    ? 'Você deve mais do que te devem'
    : 'Tudo quitado!'

  const aReceber = data?.aReceber ?? []
  const aPagar = data?.aPagar ?? []
  const activeList = debtTab === 0 ? aReceber : aPagar
  const totalItems = aReceber.length + aPagar.length

  return (
    <div
      className="no-scrollbar min-h-dvh overflow-auto"
      style={{ background: '#F5F5F8', fontFamily: '"Plus Jakarta Sans", sans-serif', paddingBottom: 110 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '52px 20px 14px' }}>
        <div>
          <div style={{ fontSize: 13, color: '#6B6B76', fontWeight: 600 }}>Olá, {currentUser.name.split(' ')[0]} 👋</div>
          <div style={{ fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 800, fontSize: 24, color: '#15151A', letterSpacing: '-.02em' }}>
            Seu saldo
          </div>
        </div>
        <button
          onClick={() => navigate('/perfil')}
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'linear-gradient(135deg,#FFB199,#FF7A59)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 15,
            border: '2px solid #fff', boxShadow: '0 3px 10px rgba(255,90,60,.3)',
            cursor: 'pointer',
          }}
        >
          {getInitials(currentUser.name)}
        </button>
      </div>

      <div style={{ padding: '0 20px' }}>
        <div style={{
          borderRadius: 28, padding: '24px 22px',
          background: 'linear-gradient(140deg,#FF5436 0%,#FF8A3D 100%)',
          color: '#fff', boxShadow: '0 18px 34px rgba(255,84,54,.32)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: -34, top: -34, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,.12)' }} />
          <div style={{ position: 'absolute', right: 30, bottom: -50, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,.08)' }} />
          {loading ? (
            <div style={{ height: 72, opacity: .4 }} />
          ) : (
            <>
              <div style={{ fontSize: 12.5, opacity: .92, fontWeight: 600, position: 'relative' }}>Saldo geral consolidado</div>
              <div style={{ fontFamily: '"Bricolage Grotesque"', fontWeight: 800, fontSize: 40, lineHeight: 1.05, margin: '6px 0 4px', letterSpacing: '-.02em', position: 'relative' }}>
                {netText}
              </div>
              <div style={{ fontSize: 12.5, opacity: .94, position: 'relative' }}>{netSub}</div>
            </>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 18, position: 'relative' }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,.18)', borderRadius: 15, padding: '11px 13px' }}>
              <div style={{ fontSize: 10.5, opacity: .9, fontWeight: 700 }}>↗ TE DEVEM</div>
              <div style={{ fontWeight: 800, fontSize: 16, marginTop: 3, whiteSpace: 'nowrap' }}>
                {loading ? '—' : formatCurrency(totalAReceber)}
              </div>
            </div>
            <div style={{ flex: 1, background: 'rgba(0,0,0,.16)', borderRadius: 15, padding: '11px 13px' }}>
              <div style={{ fontSize: 10.5, opacity: .9, fontWeight: 700 }}>↙ VOCÊ DEVE</div>
              <div style={{ fontWeight: 800, fontSize: 16, marginTop: 3, whiteSpace: 'nowrap' }}>
                {loading ? '—' : formatCurrency(totalAPagar)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Acertar contas — atalho para quitar o que você deve */}
      {!loading && (
        <div style={{ padding: '14px 20px 0' }}>
          <button
            onClick={() => navigate('/acertar')}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              background: '#fff', borderRadius: 16, padding: '14px 16px',
              boxShadow: '0 2px 10px rgba(0,0,0,.04)', border: 'none', cursor: 'pointer', textAlign: 'left',
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background: '#FFF0ED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>🤝</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5, color: '#1A1A1F' }}>Acertar contas</div>
              <div style={{ fontSize: 12, color: '#6B6B76', marginTop: 1 }}>
                {totalAPagar > 0 ? `Você deve ${formatCurrency(totalAPagar)} no total` : 'Quite dívidas de uma vez'}
              </div>
            </div>
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
              <path d="M1 1l6 6-6 6" stroke="#C0C0C8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}

      {!loading && totalItems > 0 && (
        <div style={{ padding: '24px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontFamily: '"Bricolage Grotesque"', fontWeight: 700, fontSize: 16, color: '#15151A' }}>
              Minhas dívidas
            </span>
            <span style={{ fontSize: 12, color: '#6B6B76', fontWeight: 600 }}>
              {totalItems} ativa{totalItems !== 1 ? 's' : ''}
            </span>
          </div>

          <div style={{ display: 'flex', background: '#EBEBEF', borderRadius: 14, padding: 4, marginBottom: 12 }}>
            {(['Me devem', 'Preciso pagar'] as const).map((label, idx) => {
              const count = idx === 0 ? aReceber.length : aPagar.length
              const active = debtTab === idx
              return (
                <button key={label} type="button"
                  onClick={() => setDebtTab(idx as 0 | 1)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    padding: '9px 8px', borderRadius: 11, fontWeight: 700, fontSize: 13,
                    cursor: 'pointer', border: 'none',
                    background: active ? '#fff' : 'transparent',
                    color: active ? '#15151A' : '#6B6B76',
                    boxShadow: active ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
                  }}
                >
                  {label}
                  {count > 0 && (
                    <span style={{
                      background: active ? '#FF5436' : '#C8C8D0',
                      color: '#fff', fontSize: 10, fontWeight: 800,
                      padding: '1px 6px', borderRadius: 999,
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeList.length === 0 ? (
              <div style={{
                background: '#fff', borderRadius: 18, padding: '20px 16px',
                textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,.04)',
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#15151A' }}>
                  {debtTab === 0 ? 'Nenhuma cobrança pendente' : 'Você não deve nada!'}
                </div>
                <div style={{ fontSize: 12, color: '#6B6B76', marginTop: 3 }}>
                  {debtTab === 0 ? 'Quando alguém te dever, aparece aqui.' : 'Todas as suas parcelas estão quitadas.'}
                </div>
              </div>
            ) : (
              activeList.map((item) =>
                debtTab === 1
                  ? <OwedCard key={item.installmentId} item={item as OwedItem} onOpen={() => navigate(`/dividas/${item.debtId}`)} />
                  : <CreditCard key={item.installmentId} item={item as CreditItem}
                      onCharge={() => handleCharge(item.installmentId)}
                      onOpen={() => navigate(`/dividas/${item.debtId}`)} />
              )
            )}
          </div>
        </div>
      )}

      {!loading && (data?.saldoPorPessoa ?? []).length > 0 && (
        <div style={{ padding: '24px 20px 0' }}>
          <div style={{ fontFamily: '"Bricolage Grotesque"', fontWeight: 700, fontSize: 16, color: '#15151A', marginBottom: 12 }}>
            Por amigo
          </div>
          <div style={{ background: '#fff', borderRadius: 22, padding: 4, boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>
            {(data?.saldoPorPessoa ?? []).map((entry: BalanceEntry, i, arr) => {
              const av = avatarFor(entry.userId)
              const isPos = entry.balanceCents > 0
              return (
                <div key={entry.userId} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px',
                  borderBottom: i < arr.length - 1 ? '1px solid #F0F0F3' : 'none',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: av.bg, color: av.fg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 13,
                  }}>
                    {getInitials(entry.userName)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14.5, color: '#1A1A1F' }}>{entry.userName}</div>
                    <div style={{ fontSize: 11.5, color: '#6B6B76' }}>{isPos ? 'te deve' : 'você deve'}</div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 14.5, color: isPos ? '#0E8F5C' : '#FF5436', whiteSpace: 'nowrap' }}>
                    {isPos ? '+' : '−'}{formatCurrency(Math.abs(entry.balanceCents))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <Toast message={toastMsg} />

      <div style={{ padding: '24px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontFamily: '"Bricolage Grotesque"', fontWeight: 700, fontSize: 16, color: '#15151A' }}>
            Seus grupos
          </span>
          <button
            onClick={() => navigate('/grupos')}
            style={{ fontSize: 12.5, color: '#FF5436', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Ver tudo
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {!loading && (data?.grupos ?? []).length === 0 && (
            <div style={{ textAlign: 'center', color: '#6B6B76', fontSize: 13, padding: '12px 0' }}>
              Nenhum grupo ainda.
            </div>
          )}
          {(data?.grupos ?? []).map((group) => {
            const iconBg = group.emoji ? (EMOJI_BG[group.emoji] ?? '#FFF0ED') : '#F0F0F4'
            return (
              <button key={group.id} onClick={() => navigate(`/grupos/${group.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 13,
                  background: '#fff', borderRadius: 18, padding: 14,
                  boxShadow: '0 2px 10px rgba(0,0,0,.04)',
                  cursor: 'pointer', border: 'none', textAlign: 'left', width: '100%',
                }}
              >
                <div style={{
                  width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                  background: iconBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                }}>
                  {group.emoji ?? group.name[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1A1A1F' }}>{group.name}</div>
                  <div style={{ fontSize: 12, color: '#6B6B76', marginTop: 2 }}>
                    {group.memberCount} membro{group.memberCount !== 1 ? 's' : ''}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── OwedCard ──────────────────────────────────────────────────────────────────

function OwedCard({ item, onOpen }: { item: OwedItem; onOpen: () => void }) {
  const av = avatarFor(item.creditorId)
  const isAwaiting = item.status === 'awaiting_confirmation'

  return (
    <div style={{ background: '#fff', borderRadius: 18, padding: 15, boxShadow: '0 2px 10px rgba(0,0,0,.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
          background: av.bg, color: av.fg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 13,
        }}>
          {getInitials(item.creditorName)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: '#1A1A1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.description}
          </div>
          <div style={{ fontSize: 11.5, color: '#6B6B76', marginTop: 1 }}>
            {item.groupName} · você deve a {item.creditorName}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#FF5436' }}>{formatCurrency(item.amountCents)}</div>
          <div style={{ fontSize: 11, fontWeight: 800, marginTop: 1, color: isAwaiting ? '#B57400' : '#FF5436' }}>
            {isAwaiting ? 'Aguardando' : 'Pendente'}
          </div>
        </div>
      </div>
      <button onClick={onOpen} style={{
        marginTop: 12, width: '100%', padding: '10px',
        borderRadius: 11, fontWeight: 800, fontSize: 13.5,
        background: isAwaiting ? '#F5F5F8' : '#FFF0ED',
        color: isAwaiting ? '#6B6B76' : '#FF5436',
        border: 'none', cursor: 'pointer',
      }}>
        {isAwaiting ? 'Acompanhar' : 'Ver detalhes e pagar'}
      </button>
    </div>
  )
}

// ── CreditCard ────────────────────────────────────────────────────────────────

function CreditCard({ item, onCharge, onOpen }: { item: CreditItem; onCharge: () => void; onOpen: () => void }) {
  const av = avatarFor(item.debtorId)
  const isAwaiting = item.status === 'awaiting_confirmation'

  return (
    <div style={{ background: '#fff', borderRadius: 18, padding: 15, boxShadow: '0 2px 10px rgba(0,0,0,.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
          background: av.bg, color: av.fg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 13,
        }}>
          {getInitials(item.debtorName)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: '#1A1A1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.description}
          </div>
          <div style={{ fontSize: 11.5, color: '#6B6B76', marginTop: 1 }}>
            {item.groupName} · {item.debtorName} te deve
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#0E8F5C' }}>{formatCurrency(item.amountCents)}</div>
          <div style={{ fontSize: 11, fontWeight: 800, marginTop: 1, color: isAwaiting ? '#B57400' : '#6B6B76' }}>
            {isAwaiting ? 'Revisão' : 'Pendente'}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        {isAwaiting ? (
          <button onClick={onOpen} style={{
            flex: 1, padding: '10px', borderRadius: 11,
            fontWeight: 800, fontSize: 13, background: '#11A36B', color: '#fff',
            border: 'none', cursor: 'pointer',
          }}>
            Revisar
          </button>
        ) : (
          <>
            <button onClick={onCharge} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px', borderRadius: 11,
              fontWeight: 800, fontSize: 13, background: '#E9F9F0', color: '#0E8F5C',
              border: 'none', cursor: 'pointer',
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#0E8F5C">
                <path d="M12 2a10 10 0 00-8.6 15l-1.3 4.8 4.9-1.3A10 10 0 1012 2zm5.5 14.3c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.2-.7-2.7-1.1-4.4-3.9-4.5-4-.1-.2-1-1.4-1-2.6s.6-1.8.9-2.1c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.1.1.3 0 .5l-.4.5c-.1.2-.3.3-.1.6.1.2.6 1 1.3 1.6.9.8 1.6 1 1.9 1.2.2.1.4.1.5-.1l.6-.8c.2-.2.4-.2.6-.1l1.9.9c.2.1.4.2.4.3.1.1.1.6-.1 1.2z"/>
              </svg>
              Cobrar
            </button>
            <button onClick={onOpen} style={{
              padding: '10px 14px', borderRadius: 11,
              fontWeight: 700, fontSize: 13, background: '#F5F5F8', color: '#6B6B76',
              border: 'none', cursor: 'pointer',
            }}>
              Ver
            </button>
          </>
        )}
      </div>
    </div>
  )
}
