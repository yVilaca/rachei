import { Outlet } from 'react-router-dom'

/**
 * Foco das telas de fluxo (detalhe de dívida, formulários, acerto, cobrança
 * pública). Estes são fluxos de uma tarefa só — devem ficar num container
 * central legível, não esticados. Mobile: tela cheia.
 */
export default function AppFrame() {
  return (
    <div className="min-h-dvh w-full bg-[#EAEAEF] lg:flex lg:justify-center">
      <div className="relative min-h-dvh w-full bg-[#F5F5F8] lg:max-w-[560px] lg:shadow-[0_0_70px_rgba(30,20,40,0.10)]">
        <Outlet />
      </div>
    </div>
  )
}
