import { useAuthStore } from '../stores/auth.store'
import type { User } from '../types'

export const authService = {
  login: (email: string, password: string): Promise<User> => {
    // TODO: replace with fetch POST /api/auth/login → returns { user, token }
    useAuthStore.getState().login(email, password)
    const user = useAuthStore.getState().currentUser
    if (!user) return Promise.reject(new Error('Login failed'))
    return Promise.resolve(user)
  },

  register: (name: string, email: string, password: string): Promise<User> => {
    // TODO: replace with fetch POST /api/auth/register → returns { user, token }
    useAuthStore.getState().register(name, email, password)
    const user = useAuthStore.getState().currentUser
    if (!user) return Promise.reject(new Error('Registration failed'))
    return Promise.resolve(user)
  },

  logout: (): Promise<void> => {
    // TODO: replace with fetch POST /api/auth/logout (invalidate token server-side)
    useAuthStore.getState().logout()
    return Promise.resolve()
  },
}
