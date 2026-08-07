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
  phone: string | null
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
  mfaRequired?: boolean
  mfaTempToken?: string
}

/** Return type for login — tells caller whether MFA is required. */
export interface LoginResult {
  user: User
  mfaRequired: boolean
}

interface AuthState {
  user: User | null
  loading: boolean
  /** MFA state: temp token when MFA is required during login */
  mfaRequired: boolean
  mfaTempToken: string | null
  login: (email: string, password: string) => Promise<LoginResult>
  /** Complete MFA verification after login */
  verifyMfa: (code: string) => Promise<User>
  signup: (payload: { name: string; email: string; password: string }) => Promise<User>
  /** Works for both signing in and signing up: Firebase creates the account
   *  on first use, and our backend provisions it the same way either way. */
  loginWithGoogle: () => Promise<User>
  logout: () => Promise<void>
  updateUser: (patch: Partial<Pick<User, 'name' | 'phone' | 'avatarUrl' | 'mfaEnabled'>>) => Promise<User>
  /** Baada ya kubadilisha kifurushi, ukurasa wa subscriptions unaitumia. */
  refreshUser: () => Promise<User | null>
  /** Clear MFA state (e.g. on cancel) */
  clearMfa: () => void
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
  const [mfaRequired, setMfaRequired] = useState(false)
  const [mfaTempToken, setMfaTempToken] = useState<string | null>(null)

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

      if (session.mfaRequired && session.mfaTempToken) {
        setMfaRequired(true)
        setMfaTempToken(session.mfaTempToken)
        return { user: session.user, mfaRequired: true }
      }

      setUser(session.user)
      return { user: session.user, mfaRequired: false }
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new Error(firebaseErrorMessage(error))
    } finally {
      signingIn.current = false
      setLoading(false)
    }
  }, [])

  const verifyMfa = useCallback<AuthState['verifyMfa']>(async (code) => {
    if (!mfaTempToken) throw new Error('No MFA session in progress.')

    const result = await api.post<{ user: User }>('/auth/mfa/verify', {
      tempToken: mfaTempToken,
      code,
    })
    setUser(result.user)
    setMfaRequired(false)
    setMfaTempToken(null)
    return result.user
  }, [mfaTempToken])

  const clearMfa = useCallback(() => {
    setMfaRequired(false)
    setMfaTempToken(null)
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

      if (session.mfaRequired && session.mfaTempToken) {
        setMfaRequired(true)
        setMfaTempToken(session.mfaTempToken)
        return session.user
      }

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
    setMfaRequired(false)
    setMfaTempToken(null)
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
    () => ({
      user, loading, mfaRequired, mfaTempToken,
      login, verifyMfa, signup, loginWithGoogle, logout, updateUser, refreshUser, clearMfa,
    }),
    [user, loading, mfaRequired, mfaTempToken, login, verifyMfa, signup, loginWithGoogle, logout, updateUser, refreshUser, clearMfa],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
