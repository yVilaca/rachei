import { AxiosError } from 'axios'
import api from '../lib/api'

/** Lançado quando já existe uma proposta da outra pessoa para você (HTTP 409). */
export class NegociacaoExistenteError extends Error {
  acertoId: string
  constructor(acertoId: string) {
    super('Já existe uma negociação para esta dívida.')
    this.name = 'NegociacaoExistenteError'
    this.acertoId = acertoId
  }
}

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

export interface AcertoItem {
  id: string
  descricao: string
  grupo: string
  valorCents: number
}

export interface AcertoDetalhe {
  pessoa: { id: string; name: string }
  /** Dívidas que a pessoa tem com você. */
  voceRecebe: AcertoItem[]
  /** Dívidas que você tem com a pessoa. */
  vocePaga: AcertoItem[]
  totalRecebeCents: number
  totalPagaCents: number
  saldoCents: number
  compensavel: boolean
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

interface ApiItem {
  id: string
  descricao: string
  grupo: string
  valor_cents: number
}

interface ApiDetalhe {
  pessoa: { id: number; name: string }
  voce_recebe: ApiItem[]
  voce_paga: ApiItem[]
  total_recebe: number
  total_paga: number
  saldo_cents: number
  compensavel: boolean
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

function toItem(i: ApiItem): AcertoItem {
  return { id: i.id, descricao: i.descricao, grupo: i.grupo, valorCents: i.valor_cents }
}

function mapDetalhe(data: ApiDetalhe): AcertoDetalhe {
  return {
    pessoa: { id: String(data.pessoa.id), name: data.pessoa.name },
    voceRecebe: data.voce_recebe.map(toItem),
    vocePaga: data.voce_paga.map(toItem),
    totalRecebeCents: data.total_recebe,
    totalPagaCents: data.total_paga,
    saldoCents: data.saldo_cents,
    compensavel: data.compensavel,
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

  /** Itemiza as dívidas candidatas com uma pessoa (as dívidas dos dois sentidos). */
  async getDetalhe(pessoaId: string): Promise<AcertoDetalhe> {
    const { data } = await api.get<ApiDetalhe>('/api/acertar/detalhe/', {
      params: { pessoa: Number(pessoaId) },
    })
    return mapDetalhe(data)
  },

  /** Itemiza as dívidas selecionadas numa proposta específica. */
  async getDetalheAcerto(acertoId: string): Promise<AcertoDetalhe> {
    const { data } = await api.get<ApiDetalhe>('/api/acertar/detalhe/', {
      params: { acerto: acertoId },
    })
    return mapDetalhe(data)
  },

  /**
   * Propõe uma compensação com `paraId`, abatendo as parcelas `parcelaIds`
   * (omitido = todas as candidatas). Retorna o id da proposta criada.
   */
  async propor(paraId: string, parcelaIds?: string[]): Promise<string> {
    const body: Record<string, unknown> = { para_id: Number(paraId) }
    if (parcelaIds) body.parcela_ids = parcelaIds
    try {
      const { data } = await api.post<{ id: string }>('/api/acertar/', body)
      return data.id
    } catch (e) {
      const err = e as AxiosError<{ acerto_id?: string }>
      if (err.response?.status === 409 && err.response.data?.acerto_id) {
        throw new NegociacaoExistenteError(err.response.data.acerto_id)
      }
      throw e
    }
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
