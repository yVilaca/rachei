const ACTIVITY_ITEMS = [
  {
    bg: '#E9F9F0', icon: '✅',
    title: 'Lucas confirmou seu pagamento',
    sub: 'Rodízio japonês · agora há pouco',
  },
  {
    bg: '#FFF0ED', icon: '🔔',
    title: 'Sofia cobrou Bruno R$ 80,00',
    sub: 'Conta de luz · 1 hora atrás',
  },
  {
    bg: '#EDF4FF', icon: '🧾',
    title: 'Carol enviou comprovante',
    sub: 'Supermercado · 2 horas atrás',
  },
  {
    bg: '#FFF8EC', icon: '🏖️',
    title: 'Nova dívida no grupo Viagem Floripa',
    sub: 'Passeio de barco · ontem',
  },
  {
    bg: '#F0EDFF', icon: '💸',
    title: 'Você foi adicionado a uma cobrança',
    sub: 'República 2026 · 2 dias atrás',
  },
  {
    bg: '#E9F9F0', icon: '🎉',
    title: 'Dívida totalmente quitada!',
    sub: 'Hotel em Floripa · 3 dias atrás',
  },
  {
    bg: '#FFF0ED', icon: '⏳',
    title: 'Lembrete: Ana ainda deve R$ 120,00',
    sub: 'República 2026 · 4 dias atrás',
  },
  {
    bg: '#EDF4FF', icon: '👥',
    title: 'Bruno entrou no grupo Viagem Floripa',
    sub: '5 dias atrás',
  },
]

export default function ActivityPage() {
  return (
    <div
      className="no-scrollbar min-h-dvh overflow-auto"
      style={{ background: '#F5F5F8', padding: '22px 20px 110px', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      <div style={{ fontFamily: '"Bricolage Grotesque"', fontWeight: 800, fontSize: 28, color: '#15151A', letterSpacing: '-0.02em', marginBottom: 20 }}>
        Atividade
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ACTIVITY_ITEMS.map((a, i) => (
          <div
            key={i}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 13,
              background: '#fff', borderRadius: 16, padding: 14,
              boxShadow: '0 2px 10px rgba(0,0,0,.04)',
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: a.bg, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>
              {a.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1A1A1F', lineHeight: 1.35 }}>
                {a.title}
              </div>
              <div style={{ fontSize: 12, color: '#9A9AA4', marginTop: 2 }}>
                {a.sub}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
