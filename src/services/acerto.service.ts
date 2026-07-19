import api from '../lib/api'

// ── Tipos ──────────────────────────────────────────────────────────────────────

export interface AcertoPessoa {
  id: string
  name: string
  /** Saldo líquido: positivo = te devem; negativo = você deve. */
  saldoCents: number
  /** Há dívida mútua compensável com esta pessoa. */
  compensavel: boolean
  /** Você já enviou uma proposta pendente para esta pessoa. */
  acertoEnviado: boolean
}

export interface AcertoAConfirmar {
  /** Id da proposta (Acerto). */
  id: string
  /** Quem propôs a compensação. */
  de: { id: string; name: string }
  /** Saldo líquido seu com essa pessoa (negativo = você deve). */
  saldoCents: number
}

export interface AcertoResumo {
  /** Contrapartes com saldo em aberto (ordenadas: quem você mais deve primeiro). */
  pessoas: AcertoPessoa[]
  /** Propostas recebidas aguardando sua confirmação. */
  aConfirmar: AcertoAConfirmar[]
}

// ── Brutos (snake_case) ────────────────────────────────────────────────────────

interface ApiPessoa {
  pessoa: { id: number; name: string }
  saldo_cents: number
  compensavel: boolean
  acerto_enviado: boolean
}

interface ApiAConfirmar {
  id: string
  de: { id: number; name: string }
  saldo_cents: number
}

interface ApiResumo {
  pessoas: ApiPessoa[]
  a_confirmar: ApiAConfirmar[]
}

function toPessoa(i: ApiPessoa): AcertoPessoa {
  return {
    id: String(i.pessoa.id),
    name: i.pessoa.name,
    saldoCents: i.saldo_cents,
    compensavel: i.compensavel,
    acertoEnviado: i.acerto_enviado,
  }
}

function toAConfirmar(i: ApiAConfirmar): AcertoAConfirmar {
  return {
    id: i.id,
    de: { id: String(i.de.id), name: i.de.name },
    saldoCents: i.saldo_cents,
  }
}

// ── Service ─────────────────────────────────────────────────────────────────────

export const acertoService = {
  async getResumo(): Promise<AcertoResumo> {
    const { data } = await api.get<ApiResumo>('/api/acertar/')
    return {
      pessoas: data.pessoas.map(toPessoa),
      aConfirmar: data.a_confirmar.map(toAConfirmar),
    }
  },

  /** Propõe uma compensação com `paraId`. Retorna o id da proposta criada. */
  async propor(paraId: string): Promise<string> {
    const { data } = await api.post<{ id: string }>('/api/acertar/', {
      para_id: Number(paraId),
    })
    return data.id
  },

  /** Confirma uma proposta recebida — compensa as dívidas. */
  async confirmar(acertoId: string): Promise<void> {
    await api.post(`/api/acertar/${acertoId}/confirmar/`, {})
  },

  /** Rejeita uma proposta recebida. */
  async rejeitar(acertoId: string): Promise<void> {
    await api.post(`/api/acertar/${acertoId}/rejeitar/`, {})
  },
}
