import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { User } from '../types'

interface AuthStore {
  accessToken: string | null
  refreshToken: string | null
  currentUser: User | null
  pendingToken: string | null
  isAuthenticated: boolean
  isInitializing: boolean
  setTokens: (access: string, refresh: string) => void
  setUser: (user: User) => void
  clearAuth: () => void
  setInitializing: (v: boolean) => void
  setPendingToken: (token: string | null) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      currentUser: null,
      pendingToken: null,
      isAuthenticated: false,
      isInitializing: true,
      setTokens: (access, refresh) =>
        set({ accessToken: access, refreshToken: refresh, isAuthenticated: true }),
      setUser: (user) => set({ currentUser: user, isAuthenticated: true }),
      clearAuth: () =>
        set({
          accessToken: null,
          refreshToken: null,
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
      // Only persist tokens and user — access token lives in memory only
      partialize: (state) => ({
        refreshToken: state.refreshToken,
        currentUser: state.currentUser,
      }),
    }
  )
)
