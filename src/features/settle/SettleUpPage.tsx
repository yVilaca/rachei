import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatCurrency, getInitials } from '../../lib/utils'
import { avatarFor } from '../../lib/avatar'
import { useToast } from '../../hooks/useToast'
import Toast from '../../components/Toast'
import { acertoService, type AcertoPessoa, type AcertoResumo } from '../../services/acerto.service'

type Action =
  | { kind: 'settle-one'; pessoa: AcertoPessoa }
  | { kind: 'settle-all'; total: number; count: number }
  | { kind: 'confirm'; pessoa: AcertoPessoa }
  | null

export default function SettleUpPage() {
  const navigate = useNavigate()
  const { message: toastMsg, show: showToast } = useToast()
  const [data, setData] = useState<AcertoResumo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [action, setAction] = useState<Action>(null)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    try {
      setError(false)
      setData(await acertoService.getResumo())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const totalDeve = (data?.voceDeve ?? []).reduce((a, p) => a + p.amountCents, 0)

  const runAction = async () => {
    if (!action || busy) return
    setBusy(true)
    try {
      if (action.kind === 'settle-one') {
        await acertoService.declarar(action.pessoa.id)
        showToast(`Acerto enviado a ${action.pessoa.name.split(' ')[0]}`)
      } else if (action.kind === 'settle-all') {
        await acertoService.declarar()
        showToast('Acertos enviados!')
      } else {
        await acertoService.confirmar(action.pessoa.id)
        showToast('Recebimento confirmado!')
      }
      setAction(null)
      await load()
    } catch {
      showToast('Algo deu errado. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#F5F5F8', fontFamily: '"Plus Jakarta Sans", sans-serif', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(150deg,#FF5436,#FF8A3D)', padding: '52px 20px 24px', color: '#fff' }}>
        <button onClick={() => navigate('/dashboard')} style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 700, fontSize: 14,
          color: '#fff', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16, opacity: .95,
        }}>
          <svg width="9" height="15" viewBox="0 0 9 15" fill="none">
            <path d="M7.5 1L1.5 7.5l6 6.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Voltar
        </button>
        <div style={{ fontFamily: '"Bricolage Grotesque"', fontWeight: 800, fontSize: 26, letterSpacing: '-.02em' }}>
          Acertar contas
        </div>
        <div style={{ fontSize: 13, opacity: .92, marginTop: 3 }}>
          Quite o que você deve — de uma vez ou pessoa a pessoa.
        </div>
      </div>

      <div style={{ padding: '18px 20px 0' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[0, 1].map((i) => <div key={i} style={{ height: 72, background: '#fff', borderRadius: 16, opacity: .5 }} />)}
          </div>
        ) : error ? (
          <Empty emoji="⚠️" title="Não foi possível carregar" sub="Tente novamente em instantes." />
        ) : (
          <>
            {/* VOCÊ DEVE */}
            {(data?.voceDeve.length ?? 0) > 0 && (
              <>
                <SectionTitle>Você deve</SectionTitle>

                {data!.voceDeve.length > 1 && (
                  <button
                    onClick={() => setAction({ kind: 'settle-all', total: totalDeve, count: data!.voceDeve.length })}
                    style={{
                      width: '100%', marginBottom: 12, padding: 15, borderRadius: 16, border: 'none', cursor: 'pointer',
                      background: 'linear-gradient(135deg,#FF5436,#FF8A3D)', color: '#fff',
                      fontWeight: 800, fontSize: 15.5, boxShadow: '0 8px 18px rgba(255,84,54,.28)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    Acertar tudo · {formatCurrency(totalDeve)}
                  </button>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 8 }}>
                  {data!.voceDeve.map((p) => (
                    <PersonRow key={p.id} p={p} tone="owe" actionLabel="Acertar"
                      onAction={() => setAction({ kind: 'settle-one', pessoa: p })} />
                  ))}
                </div>
              </>
            )}

            {/* AGUARDANDO SUA CONFIRMAÇÃO */}
            {(data?.aConfirmar.length ?? 0) > 0 && (
              <>
                <SectionTitle>Aguardando sua confirmação</SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {data!.aConfirmar.map((p) => (
                    <PersonRow key={p.id} p={p} tone="receive" actionLabel="Confirmar"
                      onAction={() => setAction({ kind: 'confirm', pessoa: p })} />
                  ))}
                </div>
              </>
            )}

            {/* VAZIO */}
            {(data?.voceDeve.length ?? 0) === 0 && (data?.aConfirmar.length ?? 0) === 0 && (
              <Empty emoji="🎉" title="Tudo acertado!" sub="Você não tem contas pendentes para acertar." />
            )}
          </>
        )}
      </div>

      <Toast message={toastMsg} />

      {/* Sheet de confirmação */}
      {action && (
        <div
          onClick={() => { if (!busy) setAction(null) }}
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: 480 }}>
            {action.kind === 'confirm' ? (
              <>
                <SheetIcon bg="#E9F9F0">✅</SheetIcon>
                <SheetTitle>Confirmar recebimento?</SheetTitle>
                <SheetText>
                  Você confirma que recebeu <b>{formatCurrency(action.pessoa.amountCents)}</b> de {action.pessoa.name}?
                  As parcelas dele com você serão quitadas.
                </SheetText>
              </>
            ) : action.kind === 'settle-all' ? (
              <>
                <SheetIcon bg="#FFF0ED">🤝</SheetIcon>
                <SheetTitle>Acertar tudo?</SheetTitle>
                <SheetText>
                  Vamos declarar <b>{formatCurrency(action.total)}</b> como pago com {action.count} pessoas.
                  Cada uma confirma o recebimento.
                </SheetText>
              </>
            ) : (
              <>
                <SheetIcon bg="#FFF0ED">🤝</SheetIcon>
                <SheetTitle>Acertar com {action.pessoa.name.split(' ')[0]}?</SheetTitle>
                <SheetText>
                  Vamos declarar <b>{formatCurrency(action.pessoa.amountCents)}</b> como pago.
                  {action.pessoa.name.split(' ')[0]} confirma o recebimento.
                </SheetText>
              </>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setAction(null)} disabled={busy}
                style={{ flex: 1, padding: 14, borderRadius: 14, border: 'none', cursor: 'pointer', background: '#F0F0F4', color: '#3A3A42', fontWeight: 800, fontSize: 14.5 }}>
                Cancelar
              </button>
              <button onClick={runAction} disabled={busy}
                style={{
                  flex: 1.4, padding: 14, borderRadius: 14, border: 'none', cursor: 'pointer',
                  background: action.kind === 'confirm' ? '#11A36B' : 'linear-gradient(135deg,#FF5436,#FF8A3D)',
                  color: '#fff', fontWeight: 800, fontSize: 14.5,
                }}>
                {busy ? 'Enviando...' : action.kind === 'confirm' ? 'Confirmar' : 'Acertar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Subcomponentes ──────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: '"Bricolage Grotesque"', fontWeight: 700, fontSize: 15, color: '#15151A', margin: '18px 2px 12px' }}>
      {children}
    </div>
  )
}

function PersonRow({ p, tone, actionLabel, onAction }: { p: AcertoPessoa; tone: 'owe' | 'receive'; actionLabel: string; onAction: () => void }) {
  const av = avatarFor(p.id)
  const amountColor = tone === 'owe' ? '#FF5436' : '#0E8F5C'
  const btnBg = tone === 'owe' ? '#FFF0ED' : '#E9F9F0'
  const btnFg = tone === 'owe' ? '#FF5436' : '#0E8F5C'
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 14, boxShadow: '0 2px 10px rgba(0,0,0,.04)', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
        background: av.bg, color: av.fg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: 13,
      }}>
        {getInitials(p.name)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14.5, color: '#1A1A1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {p.name}
        </div>
        <div style={{ fontWeight: 800, fontSize: 15, color: amountColor, marginTop: 1 }}>
          {formatCurrency(p.amountCents)}
        </div>
      </div>
      <button onClick={onAction}
        style={{ background: btnBg, color: btnFg, border: 'none', borderRadius: 12, padding: '10px 16px', fontWeight: 800, fontSize: 13.5, cursor: 'pointer', flexShrink: 0 }}>
        {actionLabel}
      </button>
    </div>
  )
}

function Empty({ emoji, title, sub }: { emoji: string; title: string; sub: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: '32px 20px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,.04)' }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>{emoji}</div>
      <div style={{ fontWeight: 700, fontSize: 15, color: '#15151A' }}>{title}</div>
      <div style={{ fontSize: 12.5, color: '#6B6B76', marginTop: 4 }}>{sub}</div>
    </div>
  )
}

function SheetIcon({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <div style={{ width: 44, height: 44, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 14 }}>
      {children}
    </div>
  )
}

function SheetTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: '"Bricolage Grotesque"', fontWeight: 800, fontSize: 19, color: '#15151A', marginBottom: 6 }}>{children}</div>
}

function SheetText({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 13.5, color: '#6B6B76', lineHeight: 1.5 }}>{children}</div>
}
