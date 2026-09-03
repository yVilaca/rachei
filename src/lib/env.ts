// Origem da API, centralizada. Em desenvolvimento cai para o backend local;
// em PRODUÇÃO, a ausência de VITE_API_URL é um erro fatal e explícito — sem isto
// o build apontaria silenciosamente para localhost e quebraria 100% das chamadas.
function resolveApiBaseUrl(): string {
  const url = import.meta.env.VITE_API_URL?.trim()
  if (url) return url.replace(/\/+$/, '') // sem barra final
  if (import.meta.env.DEV) return 'http://localhost:8000'
  throw new Error(
    'VITE_API_URL não definida no build de produção. Configure a URL da API antes de publicar.',
  )
}

export const API_BASE_URL = resolveApiBaseUrl()
