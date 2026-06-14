import { Outlet } from 'react-router-dom'
import BottomNav from '../components/BottomNav'

export default function AppShell() {
  return (
    <>
      <Outlet />
      <BottomNav />
    </>
  )
}
