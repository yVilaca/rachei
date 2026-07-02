import { createBrowserRouter, Navigate } from 'react-router-dom'
import RootLayout from './RootLayout'
import PrivateRoute from './PrivateRoute'
import AppShell from './AppShell'
import AuthPage from '../features/auth/AuthPage'
import ForgotPasswordPage from '../features/auth/ForgotPasswordPage'
import DashboardPage from '../features/dashboard/DashboardPage'
import GroupPage from '../features/groups/GroupPage'
import GroupsPage from '../features/groups/GroupsPage'
import NewDebtPage from '../features/debts/NewDebtPage'
import DebtDetailPage from '../features/debts/DebtDetailPage'
import PaymentLinkPage from '../features/payment/PaymentLinkPage'
import ProfilePage from '../features/profile/ProfilePage'
import ActivityPage from '../features/activity/ActivityPage'
import NotFoundPage from '../features/shared/NotFoundPage'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <Navigate to="/dashboard" replace /> },
      { path: '/login', element: <AuthPage /> },
      { path: '/cadastro', element: <AuthPage mode="register" /> },
      { path: '/esqueci-senha', element: <ForgotPasswordPage /> },
      // Pages with bottom nav
      {
        element: <PrivateRoute><AppShell /></PrivateRoute>,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/grupos', element: <GroupsPage /> },
          { path: '/grupos/:id', element: <GroupPage /> },
          { path: '/atividade', element: <ActivityPage /> },
          { path: '/perfil', element: <ProfilePage /> },
        ],
      },
      // Pages without bottom nav
      { path: '/grupos/:id/nova-divida', element: <PrivateRoute><NewDebtPage /></PrivateRoute> },
      { path: '/dividas/:id', element: <PrivateRoute><DebtDetailPage /></PrivateRoute> },
      { path: '/pagar/:token', element: <PaymentLinkPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
