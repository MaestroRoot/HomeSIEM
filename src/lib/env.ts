/** Next.js env vars. Hizi ni literal `process.env.NEXT_PUBLIC_*` ili Next
 *  azi-inline wakati wa build (bracket access kama `process.env[name]` haina
 *  inline kwenye client bundle). Values za `VITE_*` zilizopo kwenye Vercel
 *  zinaongezwa kwenye `NEXT_PUBLIC_*` kupitia `env` block ya next.config.mjs. */

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1').replace(/\/$/, '')

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
}
