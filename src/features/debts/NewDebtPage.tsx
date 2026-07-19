import { useParams, useNavigate } from 'react-router-dom'
import DebtForm from './components/DebtForm'

export default function NewDebtPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  if (!id) return null

  return (
    <div className="min-h-dvh bg-white">
      {/* Sticky header */}
      <div
        style={{
          position: 'sticky', top: 0, background: '#fff', zIndex: 5,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px 8px',
        }}
      >
        <button
          onClick={() => navigate(`/grupos/${id}`)}
          style={{ fontWeight: 700, fontSize: 14.5, color: '#8A8A93', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Cancelar
        </button>
        <span style={{ fontFamily: '"Bricolage Grotesque"', fontWeight: 800, fontSize: 16, color: '#15151A' }}>
          Nova dívida
        </span>
        <span style={{ width: 54 }} />
      </div>

      <DebtForm groupId={id} />
    </div>
  )
}
