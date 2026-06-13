import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'
import { MOCK_CURRENT_USER } from '../lib/mock-data'

interface AuthStore {
  currentUser: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => void
  register: (name: string, email: string, password: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      currentUser: null,
      isAuthenticated: false,
      login: (_email: string, _password: string) => {
        // Mock: any credentials authenticate as Sofia
        set({ currentUser: MOCK_CURRENT_USER, isAuthenticated: true })
      },
      register: (name: string, email: string, _password: string) => {
        set({
          currentUser: { ...MOCK_CURRENT_USER, name, email },
          isAuthenticated: true,
        })
      },
      logout: () => set({ currentUser: null, isAuthenticated: false }),
    }),
    { name: 'rachei-auth' }
  )
)
