import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatCurrency, getInitials } from '../../lib/utils'
import { avatarFor } from '../../lib/avatar'
import { useToast } from '../../hooks/useToast'
import Toast from '../../components/Toast'
import {
  acertoService,
  type AcertoPessoa,
  type AcertoAConfirmar,
  type AcertoResumo,
} from '../../services/acerto.service'

type Action =
  | { kind: 'propor'; pessoa: AcertoPessoa }
  | { kind: 'confirmar'; item: AcertoAConfirmar }
  | { kind: 'rejeitar'; item: AcertoAConfirmar }
  | null

/** Descreve o que sobra após a compensação, dado o saldo líquido e um nome. */
function resultado(saldoCents: number, nome: string): string {
  const first = nome.split(' ')[0]
  if (saldoCents === 0) return 'Fica tudo zerado — ninguém deve nada.'
  if (saldoCents > 0) return `Sobra ${first} te devendo ${formatCurrency(saldoCents)}.`
  return `Sobra você devendo ${formatCurrency(-saldoCents)} a ${first}.`
}

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

  const runAction = async () => {
    if (!action || busy) return
    setBusy(true)
    try {
      if (action.kind === 'propor') {
        await acertoService.propor(action.pessoa.id)
        showToast(`Proposta enviada a ${action.pessoa.name.split(' ')[0]}`)
      } else if (action.kind === 'confirmar') {
        await acertoService.confirmar(action.item.id)
        showToast('Compensação confirmada!')
      } else {
        await acertoService.rejeitar(action.item.id)
        showToast('Proposta recusada.')
      }
      setAction(null)
      await load()
    } catch {
      showToast('Algo deu errado. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  const pessoas = data?.pessoas ?? []
  const compensaveis = pessoas.filter((p) => p.compensavel)
  const outros = pessoas.filter((p) => !p.compensavel && p.saldoCents !== 0)
  const aConfirmar = data?.aConfirmar ?? []
  const vazio = compensaveis.length === 0 && aConfirmar.length === 0 && outros.length === 0

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
          Compense dívidas mútuas: sobra só a diferença.
        </div>
      </div>

      <div style={{ padding: '18px 20px 0' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[0, 1].map((i) => <div key={i} style={{ height: 88, background: '#fff', borderRadius: 16, opacity: .5 }} />)}
          </div>
        ) : error ? (
          <Empty emoji="⚠️" title="Não foi possível carregar" sub="Tente novamente em instantes." />
        ) : vazio ? (
          <Empty emoji="🎉" title="Nada a compensar" sub="Você não tem dívidas mútuas para acertar agora." />
        ) : (
          <>
            {/* PROPOSTAS RECEBIDAS */}
            {aConfirmar.length > 0 && (
              <>
                <SectionTitle>Aguardando sua confirmação</SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {aConfirmar.map((item) => (
                    <ConfirmCard
                      key={item.id}
                      item={item}
                      onConfirm={() => setAction({ kind: 'confirmar', item })}
                      onReject={() => setAction({ kind: 'rejeitar', item })}
                    />
                  ))}
                </div>
              </>
            )}

            {/* COMPENSÁVEIS */}
            {compensaveis.length > 0 && (
              <>
                <SectionTitle>Dá para compensar</SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {compensaveis.map((p) => (
                    <CompensarCard
                      key={p.id}
                      p={p}
                      onAction={() => setAction({ kind: 'propor', pessoa: p })}
                    />
                  ))}
                </div>
              </>
            )}

            {/* OUTROS SALDOS (sem mutualidade, apenas informativo) */}
            {outros.length > 0 && (
              <>
                <SectionTitle>Outros saldos</SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {outros.map((p) => <InfoRow key={p.id} p={p} />)}
                </div>
                <div style={{ fontSize: 12, color: '#6B6B76', margin: '10px 2px 0', lineHeight: 1.5 }}>
                  Sem dívida mútua para compensar. Acerte esses pagamentos pela dívida.
                </div>
              </>
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
            {action.kind === 'propor' ? (
              <>
                <SheetIcon bg="#FFF0ED">🔄</SheetIcon>
                <SheetTitle>Compensar com {action.pessoa.name.split(' ')[0]}?</SheetTitle>
                <SheetText>
                  As dívidas de vocês nos dois sentidos serão quitadas.{' '}
                  <b>{resultado(action.pessoa.saldoCents, action.pessoa.name)}</b>{' '}
                  {action.pessoa.name.split(' ')[0]} precisa confirmar.
                </SheetText>
              </>
            ) : action.kind === 'confirmar' ? (
              <>
                <SheetIcon bg="#E9F9F0">✅</SheetIcon>
                <SheetTitle>Confirmar compensação?</SheetTitle>
                <SheetText>
                  {action.item.de.name} propôs compensar as dívidas de vocês.{' '}
                  <b>{resultado(action.item.saldoCents, action.item.de.name)}</b>
                </SheetText>
              </>
            ) : (
              <>
                <SheetIcon bg="#FDECEC">✕</SheetIcon>
                <SheetTitle>Recusar proposta?</SheetTitle>
                <SheetText>
                  A proposta de {action.item.de.name} será recusada e nada muda nas dívidas de vocês.
                </SheetText>
              </>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setAction(null)} disabled={busy}
                style={{ flex: 1, padding: 14, borderRadius: 14, border: 'none', cursor: 'pointer', background: '#F0F0F4', color: '#3A3A42', fontWeight: 800, fontSize: 14.5 }}>
                Voltar
              </button>
              <button onClick={runAction} disabled={busy}
                style={{
                  flex: 1.4, padding: 14, borderRadius: 14, border: 'none', cursor: 'pointer',
                  background:
                    action.kind === 'confirmar' ? '#11A36B'
                    : action.kind === 'rejeitar' ? '#E5484D'
                    : 'linear-gradient(135deg,#FF5436,#FF8A3D)',
                  color: '#fff', fontWeight: 800, fontSize: 14.5,
                }}>
                {busy ? 'Enviando...'
                  : action.kind === 'confirmar' ? 'Confirmar'
                  : action.kind === 'rejeitar' ? 'Recusar'
                  : 'Enviar proposta'}
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

function Avatar({ id, name }: { id: string; name: string }) {
  const av = avatarFor(id)
  return (
    <div style={{
      width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
      background: av.bg, color: av.fg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: 13,
    }}>
      {getInitials(name)}
    </div>
  )
}

/** Card de par compensável: mostra o resultado líquido e o CTA de propor. */
function CompensarCard({ p, onAction }: { p: AcertoPessoa; onAction: () => void }) {
  const positivo = p.saldoCents > 0
  const zerado = p.saldoCents === 0
  const first = p.name.split(' ')[0]
  const resumo = zerado
    ? 'Zera tudo entre vocês'
    : positivo ? `Sobra ${first} te devendo` : 'Sobra você devendo'
  const cor = zerado ? '#0E8F5C' : positivo ? '#0E8F5C' : '#FF5436'

  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 14, boxShadow: '0 2px 10px rgba(0,0,0,.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar id={p.id} name={p.name} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: '#1A1A1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {p.name}
          </div>
          <div style={{ fontSize: 12, color: '#6B6B76', marginTop: 1 }}>Vocês se devem</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, padding: '10px 12px', background: '#FAFAFC', borderRadius: 12 }}>
        <span style={{ fontSize: 12.5, color: '#6B6B76' }}>{resumo}</span>
        <span style={{ fontWeight: 800, fontSize: 15, color: cor }}>
          {zerado ? formatCurrency(0) : formatCurrency(Math.abs(p.saldoCents))}
        </span>
      </div>

      {p.acertoEnviado ? (
        <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: '#FFF8EE', color: '#8A6D1F', fontWeight: 700, fontSize: 13, textAlign: 'center' }}>
          Proposta enviada · aguardando {first}
        </div>
      ) : (
        <button onClick={onAction}
          style={{
            width: '100%', marginTop: 12, padding: 13, borderRadius: 12, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,#FF5436,#FF8A3D)', color: '#fff', fontWeight: 800, fontSize: 14.5,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          }}>
          🔄 Compensar
        </button>
      )}
    </div>
  )
}

/** Card de proposta recebida: confirmar ou recusar. */
function ConfirmCard({ item, onConfirm, onReject }: { item: AcertoAConfirmar; onConfirm: () => void; onReject: () => void }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 14, boxShadow: '0 2px 10px rgba(0,0,0,.04)', border: '1px solid #E9F9F0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar id={item.de.id} name={item.de.name} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: '#1A1A1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.de.name}
          </div>
          <div style={{ fontSize: 12, color: '#6B6B76', marginTop: 1 }}>Propôs uma compensação</div>
        </div>
      </div>

      <div style={{ marginTop: 12, padding: '10px 12px', background: '#FAFAFC', borderRadius: 12, fontSize: 12.5, color: '#3A3A42' }}>
        {resultado(item.saldoCents, item.de.name)}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <button onClick={onReject}
          style={{ flex: 1, padding: 12, borderRadius: 12, border: 'none', cursor: 'pointer', background: '#FDECEC', color: '#E5484D', fontWeight: 800, fontSize: 13.5 }}>
          Recusar
        </button>
        <button onClick={onConfirm}
          style={{ flex: 1.4, padding: 12, borderRadius: 12, border: 'none', cursor: 'pointer', background: '#11A36B', color: '#fff', fontWeight: 800, fontSize: 13.5 }}>
          Confirmar
        </button>
      </div>
    </div>
  )
}

/** Linha informativa (saldo sem mutualidade). */
function InfoRow({ p }: { p: AcertoPessoa }) {
  const positivo = p.saldoCents > 0
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 14, boxShadow: '0 2px 10px rgba(0,0,0,.04)', display: 'flex', alignItems: 'center', gap: 12 }}>
      <Avatar id={p.id} name={p.name} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14.5, color: '#1A1A1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {p.name}
        </div>
        <div style={{ fontSize: 12, color: '#6B6B76', marginTop: 1 }}>
          {positivo ? 'Te deve' : 'Você deve'}
        </div>
      </div>
      <div style={{ fontWeight: 800, fontSize: 15, color: positivo ? '#0E8F5C' : '#FF5436', flexShrink: 0 }}>
        {formatCurrency(Math.abs(p.saldoCents))}
      </div>
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
