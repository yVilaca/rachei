import api from '../lib/api'

// Página pública de cobrança (GET /api/pagamento/{token}/ — AllowAny no backend).
// Somente leitura: expõe apenas o mínimo para o devedor reconhecer a cobrança.

export interface PublicCharge {
  token: string
  debtorName: string
  creditorName: string
  description: string
  amountCents: number
  status: 'pending' | 'awaiting_confirmation' | 'paid'
  expiresAt: string
  expired: boolean
}

interface ApiPublicCharge {
  token: string
  devedor: { id: number; name: string }
  credor: { id: number; name: string }
  descricao: string
  valor_centavos: number
  status_parcela: string
  expires_at: string
  expirado: boolean
}

export const paymentService = {
  async getCharge(token: string): Promise<PublicCharge> {
    const { data } = await api.get<ApiPublicCharge>(`/api/pagamento/${token}/`)
    return {
      token: data.token,
      debtorName: data.devedor.name,
      creditorName: data.credor.name,
      description: data.descricao,
      amountCents: data.valor_centavos,
      status: data.status_parcela as PublicCharge['status'],
      expiresAt: data.expires_at,
      expired: data.expirado,
    }
  },
}
