import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'

import { ApiError, api } from '@/lib/api'
import { auth, firebaseErrorMessage } from '@/lib/firebase'

export type Role = 'owner' | 'analyst' | 'viewer'
export type Plan = 'Free' | 'Home' | 'Pro' | 'Business'

/** Inalingana na `UserRead` ya backend (app/schemas/user.py). */
export interface User {
  /** UUID, sio `usr_xxx` ya zamani. */
  id: string
  name: string
  email: string
  role: Role
  plan: Plan
  mfaEnabled: boolean
  emailVerified: boolean
  avatarUrl: string | null
  createdAt: string
  lastLoginAt: string | null
  organizationId: string
}

interface SessionResponse {
  user: User
  isNewUser: boolean
}

interface AuthState {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  signup: (payload: { name: string; email: string; password: string }) => Promise<User>
  /** Works for both signing in and signing up: Firebase creates the account
   *  on first use, and our backend provisions it the same way either way. */
  loginWithGoogle: () => Promise<User>
  logout: () => Promise<void>
  updateUser: (patch: Partial<Pick<User, 'name' | 'avatarUrl' | 'mfaEnabled'>>) => Promise<User>
  /** Baada ya kubadilisha kifurushi, ukurasa wa subscriptions unaitumia. */
  refreshUser: () => Promise<User | null>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

/**
 * Firebase inashikilia credentials, backend yetu inashikilia profile.
 *
 *   React, Firebase (email/password), ID token
 *        -> POST /auth/session  na  Authorization: Bearer <token>
 *        -> row ya `users` yenye role, plan na organization
 *
 * Hakuna kitu tunachohifadhi kwenye localStorage. Firebase SDK yenyewe ndiyo
 * inakumbuka session, na `onAuthStateChanged` ndiyo inatuambia.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  /** Login/signup zinaita `/auth/session` zenyewe. Bila bendera hii,
   *  `onAuthStateChanged` ingeipiga `/auth/me` tena mara moja baada yake. */
  const signingIn = useRef(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null)
        setLoading(false)
        return
      }
      if (signingIn.current) return

      try {
        setUser(await api.get<User>('/auth/me'))
      } catch (error) {
        // Token ni halali kwa Firebase lakini backend imekataa au haipatikani.
        // Tunamtoa nje badala ya kumwacha kwenye hali isiyoeleweka.
        if (error instanceof ApiError && error.status === 401) await signOut(auth)
        setUser(null)
      } finally {
        setLoading(false)
      }
    })

    return unsubscribe
  }, [])

  const login = useCallback<AuthState['login']>(async (email, password) => {
    signingIn.current = true
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
      const session = await api.post<SessionResponse>('/auth/session', {})
      setUser(session.user)
      return session.user
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new Error(firebaseErrorMessage(error))
    } finally {
      signingIn.current = false
      setLoading(false)
    }
  }, [])

  const signup = useCallback<AuthState['signup']>(async ({ name, email, password }) => {
    const trimmed = name.trim()
    if (trimmed.length < 2) throw new Error('Enter your full name.')

    signingIn.current = true
    setLoading(true)
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password)
      // Firebase inashikilia displayName, backend inalitumia kama jina la kuanzia.
      await updateProfile(credential.user, { displayName: trimmed })
      const session = await api.post<SessionResponse>('/auth/session', { name: trimmed })
      setUser(session.user)
      return session.user
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new Error(firebaseErrorMessage(error))
    } finally {
      signingIn.current = false
      setLoading(false)
    }
  }, [])

  const loginWithGoogle = useCallback<AuthState['loginWithGoogle']>(async () => {
    signingIn.current = true
    setLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      // Bila hii, Google inamrudisha akaunti ile ile kila mara bila kuuliza.
      provider.setCustomParameters({ prompt: 'select_account' })

      const credential = await signInWithPopup(auth, provider)
      const session = await api.post<SessionResponse>('/auth/session', {
        name: credential.user.displayName ?? undefined,
      })
      setUser(session.user)
      return session.user
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new Error(firebaseErrorMessage(error))
    } finally {
      signingIn.current = false
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      // Inafuta refresh tokens upande wa Firebase. Ikishindwa hatuzuii logout.
      await api.post('/auth/logout')
    } catch {
      /* hakuna kitu, tunatoka hata hivyo */
    }
    await signOut(auth)
    setUser(null)
  }, [])

  const updateUser = useCallback<AuthState['updateUser']>(async (patch) => {
    const updated = await api.patch<User>('/users/me', patch)
    setUser(updated)
    return updated
  }, [])

  const refreshUser = useCallback<AuthState['refreshUser']>(async () => {
    if (!auth.currentUser) return null
    const fresh = await api.get<User>('/auth/me')
    setUser(fresh)
    return fresh
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, signup, loginWithGoogle, logout, updateUser, refreshUser }),
    [user, loading, login, signup, loginWithGoogle, logout, updateUser, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
