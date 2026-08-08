import { initializeApp, getApps, getApp } from 'firebase/app'
import { browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth'
import { firebaseConfig } from './env'

/** getApps() check inazuia HMR ya Vite kuanzisha app mara mbili. */
export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const auth = getAuth(firebaseApp)

/** Session inabaki baada ya refresh. Firebase inarudisha promise, tunaipuuza
 *  kwa sababu default (local) tayari ni hii kwenye browser. */
void setPersistence(auth, browserLocalPersistence)

/** Ujumbe wa Firebase ni wa kiufundi mno kwa mtumiaji, tunautafsiri hapa. */
export function firebaseErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
  switch (code) {
    case 'auth/invalid-email':
      return 'That email address is not valid.'
    case 'auth/user-disabled':
      return 'This account has been disabled.'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Wrong email or password.'
    case 'auth/email-already-in-use':
      return 'That email already has an account. Sign in instead.'
    case 'auth/weak-password':
      return 'That password is too weak. Use 8 characters or more.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment and try again.'
    case 'auth/network-request-failed':
      return 'No network. Check your connection.'
    case 'auth/operation-not-allowed':
      return 'Email and password sign in is switched off in Firebase.'
    default:
      return error instanceof Error && error.message ? error.message : 'Something went wrong. Try again.'
  }
}
