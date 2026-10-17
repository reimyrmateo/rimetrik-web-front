import { create } from 'zustand'
import type { CurrentUser } from '@/core/auth/authTypes'

export type SessionStatus = 'checking' | 'authenticated' | 'anonymous'

interface SessionState {
  status: SessionStatus
  user: CurrentUser | null
  notice: string | null
  signIn: (user: CurrentUser) => void
  signOut: (notice?: string) => void
  clearNotice: () => void
}

export const useSessionStore = create<SessionState>()((set) => ({
  status: 'checking',
  user: null,
  notice: null,
  signIn: (user) => set({ status: 'authenticated', user, notice: null }),
  signOut: (notice) => set({ status: 'anonymous', user: null, notice: notice ?? null }),
  clearNotice: () => set({ notice: null }),
}))
