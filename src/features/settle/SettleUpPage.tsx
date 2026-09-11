import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatCurrency, getInitials } from '../../lib/utils'
import { avatarFor } from '../../lib/avatar'
import { useToast } from '../../hooks/useToast'
import Toast from '../../components/Toast'
import {
  acertoService,
  NegociacaoExistenteError,
  type AcertoPessoa,
  type AcertoAConfirmar,
  type AcertoResumo,
  type AcertoDetalhe,
  type AcertoItem,
} from '../../services/acerto.service'

type Action =
  | { kind: 'confirmar'; item: AcertoAConfirmar }
  | { kind: 'rejeitar'; item: AcertoAConfirmar }
  | null

/** Descreve o que sobra após a compensação, dado o saldo líquido e um nome. */
function resultado(saldoCents: number, nome: string): string {
  const first = nome.split(' ')[0]
  if (saldoCents === 0) return 'Fica tudo zerado — ninguém deve nada.'
  if (saldoCents > 0) return `${first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()} ainda te deverá ${formatCurrency(saldoCents)}.`
  return `Você ainda deverá ${formatCurrency(-saldoCents)} a ${first}.`
}

export default function SettleUpPage() {
  const navigate = useNavigate()
  const { message: toastMsg, show: showToast } = useToast()
  const [data, setData] = useState<AcertoResumo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [action, setAction] = useState<Action>(null)
  const [busy, setBusy] = useState(false)
  const [detalhe, setDetalhe] = useState<AcertoDetalhe | null>(null)
  const [detalheLoading, setDetalheLoading] = useState(false)
  // Seleção de dívidas a abater (fluxo de propor)
  const [selPessoa, setSelPessoa] = useState<AcertoPessoa | null>(null)
  const [selDet, setSelDet] = useState<AcertoDetalhe | null>(null)
  const [selLoading, setSelLoading] = useState(false)
  const [marcadas, setMarcadas] = useState<Set<string>>(new Set())

  // Revisão da seleção de uma proposta recebida (read-only)
  const openRevisao = async (acertoId: string) => {
    setDetalheLoading(true)
    try {
      setDetalhe(await acertoService.getDetalheAcerto(acertoId))
    } catch {
      showToast('Não foi possível carregar o detalhamento.')
    } finally {
      setDetalheLoading(false)
    }
  }

  const openSelecao = async (pessoa: AcertoPessoa) => {
    setSelPessoa(pessoa)
    setSelDet(null)
    setSelLoading(true)
    try {
      const det = await acertoService.getDetalhe(pessoa.id)
      setSelDet(det)
      setMarcadas(new Set([...det.voceRecebe, ...det.vocePaga].map((i) => i.id)))
    } catch {
      showToast('Não foi possível carregar as dívidas.')
      setSelPessoa(null)
    } finally {
      setSelLoading(false)
    }
  }

  const closeSelecao = () => {
    setSelPessoa(null)
    setSelDet(null)
    setMarcadas(new Set())
  }

  const toggleMarcada = (id: string) => {
    setMarcadas((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Refresh reativo: handlers chamam reload() e o efeito refaz o fetch.
  const [reloadKey, setReloadKey] = useState(0)
  const reload = () => setReloadKey((k) => k + 1)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const resumo = await acertoService.getResumo()
        if (!cancelled) { setError(false); setData(resumo) }
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [reloadKey])

  const runAction = async () => {
    if (!action || busy) return
    setBusy(true)
    try {
      if (action.kind === 'confirmar') {
        await acertoService.confirmar(action.item.id)
        showToast('Compensação confirmada!')
      } else {
        await acertoService.rejeitar(action.item.id)
        showToast('Proposta recusada.')
      }
      setAction(null)
      reload()
    } catch {
      showToast('Algo deu errado. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  const enviarProposta = async () => {
    if (!selPessoa || busy) return
    const first = selPessoa.name.split(' ')[0]
    setBusy(true)
    try {
      await acertoService.propor(selPessoa.id, [...marcadas])
      showToast(`Proposta enviada a ${first}`)
      closeSelecao()
      reload()
    } catch (e) {
      if (e instanceof NegociacaoExistenteError) {
        // A outra pessoa já propôs — leva para revisar (aceitar/recusar) a existente.
        closeSelecao()
        showToast(`${first} já propôs uma compensação — confirme ou recuse acima.`)
        reload()
      } else {
        showToast('Algo deu errado. Tente novamente.')
      }
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
    <div style={{ minHeight: '100dvh', background: '#F5F5F8', fontFamily: 'Poppins, sans-serif', paddingBottom: 40 }}>
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
        <div style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 26, letterSpacing: '-.02em' }}>
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
                      onDetalhe={() => openRevisao(item.id)}
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
                      onAction={() => openSelecao(p)}
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

      {/* Sheet de detalhamento */}
      {(detalhe || detalheLoading) && (
        <div
          onClick={() => { setDetalhe(null) }}
          className="rc-overlay"
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: 480, maxHeight: '82dvh', overflowY: 'auto' }}>
            {detalheLoading || !detalhe ? (
              <div style={{ padding: '30px 0', textAlign: 'center', color: '#6B6B76', fontSize: 14 }}>Carregando…</div>
            ) : (
              <>
                <SheetTitle>Detalhes da compensação</SheetTitle>
                <SheetText>Dívidas entre você e {detalhe.pessoa.name.split(' ')[0]} que entram no acerto.</SheetText>

                <DetalheGrupo
                  titulo={`${detalhe.pessoa.name.split(' ')[0]} deve a você`}
                  itens={detalhe.voceRecebe}
                  total={detalhe.totalRecebeCents}
                  cor="#0E8F5C"
                />
                <DetalheGrupo
                  titulo={`Você deve a ${detalhe.pessoa.name.split(' ')[0]}`}
                  itens={detalhe.vocePaga}
                  total={detalhe.totalPagaCents}
                  cor="#FF5436"
                />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, padding: '14px 16px', background: '#FAFAFC', borderRadius: 14 }}>
                  <span style={{ fontWeight: 800, fontSize: 14, color: '#15151A' }}>Depois de compensar</span>
                  <span style={{ fontWeight: 800, fontSize: 16, color: detalhe.saldoCents === 0 ? '#0E8F5C' : detalhe.saldoCents > 0 ? '#0E8F5C' : '#FF5436' }}>
                    {formatCurrency(Math.abs(detalhe.saldoCents))}
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: '#6B6B76', marginTop: 8, lineHeight: 1.5, textAlign: 'center' }}>
                  {resultado(detalhe.saldoCents, detalhe.pessoa.name)}
                </div>

                <button onClick={() => setDetalhe(null)}
                  style={{ width: '100%', marginTop: 18, padding: 14, borderRadius: 14, border: 'none', cursor: 'pointer', background: '#F0F0F4', color: '#3A3A42', fontWeight: 800, fontSize: 14.5 }}>
                  Fechar
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Sheet de seleção (propor compensação) */}
      {selPessoa && (
        <div
          onClick={() => { if (!busy) closeSelecao() }}
          className="rc-overlay"
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: 480, maxHeight: '88dvh', overflowY: 'auto' }}>
            {selLoading || !selDet ? (
              <div style={{ padding: '30px 0', textAlign: 'center', color: '#6B6B76', fontSize: 14 }}>Carregando…</div>
            ) : (() => {
              const first = selPessoa.name.split(' ')[0]
              const recebeSel = selDet.voceRecebe.filter((i) => marcadas.has(i.id)).reduce((a, i) => a + i.valorCents, 0)
              const pagaSel = selDet.vocePaga.filter((i) => marcadas.has(i.id)).reduce((a, i) => a + i.valorCents, 0)
              const netSel = recebeSel - pagaSel
              const podeCompensar = recebeSel > 0 && pagaSel > 0
              return (
                <>
                  <SheetTitle>Compensar com {first}</SheetTitle>
                  <SheetText>Escolha as dívidas a abater — todas já vêm marcadas.</SheetText>

                  <SelecaoGrupo
                    titulo={`${first} deve a você`}
                    itens={selDet.voceRecebe}
                    cor="#0E8F5C"
                    marcadas={marcadas}
                    onToggle={toggleMarcada}
                  />
                  <SelecaoGrupo
                    titulo={`Você deve a ${first}`}
                    itens={selDet.vocePaga}
                    cor="#FF5436"
                    marcadas={marcadas}
                    onToggle={toggleMarcada}
                  />

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, padding: '14px 16px', background: '#FAFAFC', borderRadius: 14 }}>
                    <span style={{ fontWeight: 800, fontSize: 14, color: '#15151A' }}>Depois de compensar</span>
                    <span style={{ fontWeight: 800, fontSize: 16, color: netSel < 0 ? '#FF5436' : '#0E8F5C' }}>
                      {formatCurrency(Math.abs(netSel))}
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, color: podeCompensar ? '#6B6B76' : '#B57400', marginTop: 8, lineHeight: 1.5, textAlign: 'center' }}>
                    {podeCompensar
                      ? resultado(netSel, selPessoa.name)
                      : 'Selecione ao menos uma dívida em cada sentido para compensar.'}
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                    <button onClick={closeSelecao} disabled={busy}
                      style={{ flex: 1, padding: 14, borderRadius: 14, border: 'none', cursor: 'pointer', background: '#F0F0F4', color: '#3A3A42', fontWeight: 800, fontSize: 14.5 }}>
                      Voltar
                    </button>
                    <button onClick={enviarProposta} disabled={busy || !podeCompensar}
                      style={{
                        flex: 1.4, padding: 14, borderRadius: 14, border: 'none',
                        cursor: busy || !podeCompensar ? 'default' : 'pointer',
                        opacity: podeCompensar ? 1 : .5,
                        background: 'linear-gradient(135deg,#FF5436,#FF8A3D)', color: '#fff', fontWeight: 800, fontSize: 14.5,
                      }}>
                      {busy ? 'Enviando...' : 'Enviar proposta'}
                    </button>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* Sheet de confirmação */}
      {action && (
        <div
          onClick={() => { if (!busy) setAction(null) }}
          className="rc-overlay"
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: 480 }}>
            {action.kind === 'confirmar' ? (
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
                  background: action.kind === 'confirmar' ? '#11A36B' : '#E5484D',
                  color: '#fff', fontWeight: 800, fontSize: 14.5,
                }}>
                {busy ? 'Enviando...' : action.kind === 'confirmar' ? 'Confirmar' : 'Recusar'}
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
    <div style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 15, color: '#15151A', margin: '18px 2px 12px' }}>
      {children}
    </div>
  )
}

function DetalheLink({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{
        background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0,
        color: '#FF5436', fontWeight: 700, fontSize: 12.5, padding: '4px 2px',
      }}>
      Detalhes
    </button>
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
    : positivo ? `${first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()} ainda te deverá` : 'Você ficará devendo'
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
          }}>
          Compensar
        </button>
      )}
    </div>
  )
}

/** Card de proposta recebida: confirmar ou recusar. */
function ConfirmCard({ item, onConfirm, onReject, onDetalhe }: { item: AcertoAConfirmar; onConfirm: () => void; onReject: () => void; onDetalhe: () => void }) {
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
        <DetalheLink onClick={onDetalhe} />
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

function DetalheGrupo({ titulo, itens, total, cor }: { titulo: string; itens: AcertoItem[]; total: number; cor: string }) {
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: '#15151A' }}>{titulo}</span>
        <span style={{ fontWeight: 800, fontSize: 13.5, color: cor }}>{formatCurrency(total)}</span>
      </div>
      {itens.length === 0 ? (
        <div style={{ fontSize: 12.5, color: '#9A9AA4', padding: '8px 0' }}>Nada neste sentido.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {itens.map((i) => (
            <div key={i.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#FAFAFC', borderRadius: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5, color: '#1A1A1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.descricao}</div>
                <div style={{ fontSize: 11.5, color: '#6B6B76', marginTop: 1 }}>{i.grupo}</div>
              </div>
              <span style={{ fontWeight: 700, fontSize: 13.5, color: '#3A3A42', flexShrink: 0, marginLeft: 10 }}>{formatCurrency(i.valorCents)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SelecaoGrupo({ titulo, itens, cor, marcadas, onToggle }: {
  titulo: string; itens: AcertoItem[]; cor: string; marcadas: Set<string>; onToggle: (id: string) => void
}) {
  if (itens.length === 0) return null
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: '#15151A', marginBottom: 8 }}>{titulo}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {itens.map((i) => {
          const on = marcadas.has(i.id)
          return (
            <button key={i.id} type="button" onClick={() => onToggle(i.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left',
                padding: '10px 12px', background: on ? '#FAFAFC' : '#fff', borderRadius: 10, cursor: 'pointer',
                border: `1px solid ${on ? '#ECECF0' : '#F0F0F3'}`,
              }}>
              <span style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: on ? cor : '#fff', border: `2px solid ${on ? cor : '#D0D0D8'}`,
              }}>
                {on && (
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6.5l2.5 2.5L10 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 600, fontSize: 13.5, color: on ? '#1A1A1F' : '#9A9AA4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.descricao}</span>
                <span style={{ display: 'block', fontSize: 11.5, color: '#6B6B76', marginTop: 1 }}>{i.grupo}</span>
              </span>
              <span style={{ fontWeight: 700, fontSize: 13.5, color: on ? '#3A3A42' : '#B8B8C0', flexShrink: 0 }}>{formatCurrency(i.valorCents)}</span>
            </button>
          )
        })}
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
  return <div style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 19, color: '#15151A', marginBottom: 6 }}>{children}</div>
}

function SheetText({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 13.5, color: '#6B6B76', lineHeight: 1.5 }}>{children}</div>
}
