/* eslint-disable react-refresh/only-export-components -- arquivo de config de rotas, não módulo de componente */
import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import RootLayout from './RootLayout'
import PrivateRoute from './PrivateRoute'
import AppShell from './AppShell'
import AppFrame from './AppFrame'

// Páginas em chunks separados (code-splitting): login e a cobrança pública não
// carregam mais o app autenticado inteiro. Layout/guards ficam eager.
const AuthPage = lazy(() => import('../features/auth/AuthPage'))
const ForgotPasswordPage = lazy(() => import('../features/auth/ForgotPasswordPage'))
const TwoFactorChallengePage = lazy(() => import('../features/auth/TwoFactorChallengePage'))
const VerifyPhonePage = lazy(() => import('../features/auth/VerifyPhonePage'))
const DashboardPage = lazy(() => import('../features/dashboard/DashboardPage'))
const GroupPage = lazy(() => import('../features/groups/GroupPage'))
const GroupsPage = lazy(() => import('../features/groups/GroupsPage'))
const NewDebtPage = lazy(() => import('../features/debts/NewDebtPage'))
const EditDebtPage = lazy(() => import('../features/debts/EditDebtPage'))
const DebtDetailPage = lazy(() => import('../features/debts/DebtDetailPage'))
const SettleUpPage = lazy(() => import('../features/settle/SettleUpPage'))
const PaymentLinkPage = lazy(() => import('../features/payment/PaymentLinkPage'))
const ProfilePage = lazy(() => import('../features/profile/ProfilePage'))
const ActivityPage = lazy(() => import('../features/activity/ActivityPage'))
const NotFoundPage = lazy(() => import('../features/shared/NotFoundPage'))

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <Navigate to="/dashboard" replace /> },
      // Público (largura total)
      { path: '/login', element: <AuthPage /> },
      { path: '/cadastro', element: <AuthPage mode="register" /> },
      { path: '/esqueci-senha', element: <ForgotPasswordPage /> },
      { path: '/verificar-2fa', element: <TwoFactorChallengePage /> },
      { path: '/pagar/:token', element: <PaymentLinkPage /> },

      // App autenticado — dentro da moldura central (responsivo no desktop)
      {
        element: (
          <PrivateRoute>
            <AppFrame />
          </PrivateRoute>
        ),
        children: [
          // Telas com bottom nav
          {
            element: <AppShell />,
            children: [
              { path: '/dashboard', element: <DashboardPage /> },
              { path: '/grupos', element: <GroupsPage /> },
              { path: '/grupos/:id', element: <GroupPage /> },
              { path: '/atividade', element: <ActivityPage /> },
              { path: '/perfil', element: <ProfilePage /> },
            ],
          },
          // Telas sem bottom nav (fluxos)
          { path: '/verificar-telefone', element: <VerifyPhonePage /> },
          { path: '/grupos/:id/nova-divida', element: <NewDebtPage /> },
          { path: '/dividas/:id/editar', element: <EditDebtPage /> },
          { path: '/dividas/:id', element: <DebtDetailPage /> },
          { path: '/acertar', element: <SettleUpPage /> },
        ],
      },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
