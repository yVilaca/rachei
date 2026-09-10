interface LogoProps {
  /** Altura do símbolo em px (o texto acompanha). */
  height?: number
  /** 'ink' = texto escuro (fundos claros) · 'light' = tudo branco (fundos coral/escuros). */
  tone?: 'ink' | 'light'
  /** Só o símbolo (wing), sem o texto. */
  markOnly?: boolean
}

/**
 * Logo do Rachei — vetor, cor adaptável ao fundo e coeso com a fonte Poppins.
 * Recriado como SVG (escala perfeita, transparente, sem depender de imagem).
 */
export default function Logo({ height = 34, tone = 'ink', markOnly = false }: LogoProps) {
  const textColor = tone === 'light' ? '#FFFFFF' : '#15151A'
  const markColor = tone === 'light' ? '#FFFFFF' : '#FF5436'

  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: height * 0.18,
        lineHeight: 1, userSelect: 'none', whiteSpace: 'nowrap',
      }}
      aria-label="Rachei"
    >
      <svg viewBox="0 0 44 44" width={height} height={height} aria-hidden="true" style={{ flexShrink: 0 }}>
        <path d="M4 14 Q 22 11 40 14 Q 26 20 13 33 Q 11 22 4 14 Z" fill={markColor} />
      </svg>
      {!markOnly && (
        <span style={{
          fontFamily: 'Poppins, sans-serif', fontWeight: 800,
          fontSize: height * 0.84, letterSpacing: '-0.04em', color: textColor,
        }}>
          Rachei
        </span>
      )}
    </span>
  )
}
