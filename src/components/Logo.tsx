import logoNavy from '../assets/logo-rachei.png'
import logoWhite from '../assets/logo-rachei-white.png'

interface LogoProps {
  /** Altura da logo em px. */
  height?: number
  /** 'ink' = logo navy (fundos claros) · 'light' = logo branca (fundos coral/escuros). */
  tone?: 'ink' | 'light'
  className?: string
}

/** Logo do Rachei — wordmark oficial (PNG transparente), variante por fundo. */
export default function Logo({ height = 40, tone = 'ink', className }: LogoProps) {
  return (
    <img
      src={tone === 'light' ? logoWhite : logoNavy}
      alt="Rachei"
      height={height}
      className={className}
      style={{ height, width: 'auto', display: 'block', userSelect: 'none' }}
      draggable={false}
    />
  )
}
