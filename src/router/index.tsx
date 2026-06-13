import { createBrowserRouter, Navigate } from 'react-router-dom'
import PrivateRoute from './PrivateRoute'
import AuthPage from '../features/auth/AuthPage'
import DashboardPage from '../features/dashboard/DashboardPage'
import GroupPage from '../features/groups/GroupPage'
import NewDebtPage from '../features/debts/NewDebtPage'
import DebtDetailPage from '../features/debts/DebtDetailPage'
import PaymentLinkPage from '../features/payment/PaymentLinkPage'
import ProfilePage from '../features/profile/ProfilePage'
import NotFoundPage from '../features/shared/NotFoundPage'

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '/login', element: <AuthPage /> },
  { path: '/cadastro', element: <AuthPage mode="register" /> },
  {
    path: '/dashboard',
    element: <PrivateRoute><DashboardPage /></PrivateRoute>,
  },
  {
    path: '/grupos/:id',
    element: <PrivateRoute><GroupPage /></PrivateRoute>,
  },
  {
    path: '/grupos/:id/nova-divida',
    element: <PrivateRoute><NewDebtPage /></PrivateRoute>,
  },
  {
    path: '/dividas/:id',
    element: <PrivateRoute><DebtDetailPage /></PrivateRoute>,
  },
  { path: '/pagar/:token', element: <PaymentLinkPage /> },
  {
    path: '/perfil',
    element: <PrivateRoute><ProfilePage /></PrivateRoute>,
  },
  { path: '*', element: <NotFoundPage /> },
])
