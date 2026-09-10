import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DebtForm from './components/DebtForm'
import { debtService } from '../../services/debt.service'
import type { Debt } from '../../types'

export default function EditDebtPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [debt, setDebt] = useState<Debt | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    debtService.getDebt(id)
      .then((d) => { if (!cancelled) setDebt(d) })
      .catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [id])

  if (!id) return null

  return (
    <div className="min-h-dvh bg-white">
      <div style={{
        position: 'sticky', top: 0, background: '#fff', zIndex: 5,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 20px 8px',
      }}>
        <button
          onClick={() => navigate(`/dividas/${id}`)}
          style={{ fontWeight: 700, fontSize: 14.5, color: '#8A8A93', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Cancelar
        </button>
        <span style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 16, color: '#15151A' }}>
          Editar dívida
        </span>
        <span style={{ width: 54 }} />
      </div>

      {error ? (
        <div style={{ padding: 24, textAlign: 'center', color: '#6B6B76', fontSize: 14 }}>
          Dívida não encontrada.
        </div>
      ) : debt ? (
        <DebtForm groupId={debt.groupId} debt={debt} />
      ) : (
        <div style={{ padding: 24 }}>
          <div style={{ height: 60, background: '#F0F0F4', borderRadius: 16, opacity: 0.5 }} />
        </div>
      )}
    </div>
  )
}
