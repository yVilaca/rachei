import api from '../lib/api'

// ── Tipos ──────────────────────────────────────────────────────────────────────

export interface AcertoPessoa {
  id: string
  name: string
  amountCents: number
}

export interface AcertoResumo {
  /** Pessoas a quem você deve (pode acertar). */
  voceDeve: AcertoPessoa[]
  /** Pessoas que declararam acerto e aguardam sua confirmação. */
  aConfirmar: AcertoPessoa[]
}

// ── Brutos (snake_case) ────────────────────────────────────────────────────────

interface ApiItem {
  pessoa: { id: number; name: string }
  valor_cents: number
}

interface ApiResumo {
  voce_deve: ApiItem[]
  a_confirmar: ApiItem[]
}

function toPessoa(i: ApiItem): AcertoPessoa {
  return { id: String(i.pessoa.id), name: i.pessoa.name, amountCents: i.valor_cents }
}

// ── Service ─────────────────────────────────────────────────────────────────────

export const acertoService = {
  async getResumo(): Promise<AcertoResumo> {
    const { data } = await api.get<ApiResumo>('/api/acertar/')
    return {
      voceDeve: data.voce_deve.map(toPessoa),
      aConfirmar: data.a_confirmar.map(toPessoa),
    }
  },

  /** Declara acerto. Sem `paraId` = com todos que você deve. */
  async declarar(paraId?: string, grupoId?: string): Promise<void> {
    const body: Record<string, unknown> = {}
    if (paraId) body.para_id = Number(paraId)
    if (grupoId) body.grupo_id = grupoId
    await api.post('/api/acertar/', body)
  },

  /** Credor confirma o acerto declarado por `deId`. */
  async confirmar(deId: string, grupoId?: string): Promise<void> {
    const body: Record<string, unknown> = { de_id: Number(deId) }
    if (grupoId) body.grupo_id = grupoId
    await api.post('/api/acertar/confirmar/', body)
  },
}
