import { Outlet } from 'react-router-dom'

/**
 * Moldura do app autenticado. No mobile ocupa a tela inteira (mobile-first,
 * intacto). No desktop, centraliza o app numa coluna de largura fixa sobre um
 * fundo neutro — em vez de esticar a interface por telas largas.
 */
export default function AppFrame() {
  return (
    <div className="min-h-dvh w-full bg-[#E6E6EC] lg:flex lg:justify-center">
      <div className="relative min-h-dvh w-full bg-[#F5F5F8] lg:max-w-[480px] lg:shadow-[0_0_70px_rgba(30,20,40,0.13)]">
        <Outlet />
      </div>
    </div>
  )
}
