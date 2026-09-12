import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import BottomNav from '../components/BottomNav'

/**
 * Shell das telas principais.
 * - Desktop: sidebar fixa à esquerda + conteúdo fluido que usa a largura.
 * - Mobile: conteúdo em tela cheia + bottom nav (inalterado).
 */
export default function AppShell() {
  return (
    <div className="min-h-dvh bg-[#EAEAEF] lg:flex">
      <Sidebar />
      <main className="min-h-dvh w-full flex-1 overflow-x-hidden">
        <Outlet />
      </main>
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  )
}
