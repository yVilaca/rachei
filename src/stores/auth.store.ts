import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { User } from '../types'

interface AuthStore {
  accessToken: string | null
  currentUser: User | null
  pendingToken: string | null
  isAuthenticated: boolean
  isInitializing: boolean
  setAccessToken: (access: string) => void
  setUser: (user: User) => void
  clearAuth: () => void
  setInitializing: (v: boolean) => void
  setPendingToken: (token: string | null) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      accessToken: null,
      currentUser: null,
      pendingToken: null,
      isAuthenticated: false,
      isInitializing: true,
      setAccessToken: (access) =>
        set({ accessToken: access, isAuthenticated: true }),
      setUser: (user) => set({ currentUser: user, isAuthenticated: true }),
      clearAuth: () =>
        set({
          accessToken: null,
          currentUser: null,
          pendingToken: null,
          isAuthenticated: false,
        }),
      setInitializing: (v) => set({ isInitializing: v }),
      setPendingToken: (token) => set({ pendingToken: token }),
    }),
    {
      name: 'rachei-auth',
      storage: createJSONStorage(() => localStorage),
      // Refresh token não persiste — vive apenas no cookie HttpOnly
      partialize: (state) => ({ currentUser: state.currentUser }),
    }
  )
)
