/** Next.js env vars. Soma NEXT_PUBLIC_* kwanza, kisha VITE_* (zilizopo tayari
 *  kwenye Vercel project settings) kama fallback — hivyo hakuna haja ya
 *  kubadilisha mazingira ya deploy. */

function pick(primary: string, legacy: string, fallback = ''): string {
  const value = process.env[primary] || process.env[legacy]
  return value && value.length > 0 ? value : fallback
}

export const API_BASE_URL = pick('NEXT_PUBLIC_API_BASE_URL', 'VITE_API_BASE_URL', '/api/v1').replace(
  /\/$/,
  '',
)

export const firebaseConfig = {
  apiKey: pick('NEXT_PUBLIC_FIREBASE_API_KEY', 'VITE_FIREBASE_API_KEY'),
  authDomain: pick('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: pick('NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_PROJECT_ID'),
  storageBucket: pick('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', 'VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: pick('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', 'VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: pick('NEXT_PUBLIC_FIREBASE_APP_ID', 'VITE_FIREBASE_APP_ID'),
  measurementId: pick('NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID', 'VITE_FIREBASE_MEASUREMENT_ID'),
}
