import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  experimental: { instrumentationHook: true },
  // Soma env za build na uziweke kama NEXT_PUBLIC_* kwenye bundle za client.
  // Fallback kwa VITE_* zilizopo kwenye Vercel project settings — hivyo
  // hakuna haja ya kubadilisha mazingira ya deploy wakati wa migration.
  env: {
    NEXT_PUBLIC_API_BASE_URL:
      process.env.NEXT_PUBLIC_API_BASE_URL || process.env.VITE_API_BASE_URL || '/api/v1',
    NEXT_PUBLIC_FIREBASE_API_KEY:
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || '',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || '',
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
      process.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
      '',
    NEXT_PUBLIC_FIREBASE_APP_ID:
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID || '',
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ||
      process.env.VITE_FIREBASE_MEASUREMENT_ID ||
      '',
    NEXT_PUBLIC_SENTRY_DSN:
      process.env.NEXT_PUBLIC_SENTRY_DSN ||
      process.env.VITE_SENTRY_DSN ||
      'https://ff3e0eea0b7eee2bdfa26d38ab93b9ec@o4511829146730496.ingest.us.sentry.io/4511875693740032',
    NEXT_PUBLIC_PAYPAL_CLIENT_ID:
      process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
      'BAA7JJhD0oOTHAWkriPxUjljoHK3FxevkvfszZeoqApaghqAsvVyqsVlAeRU71CnKo0-25eE8zKJGnAAUY',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://167.99.134.27:8000/api/:path*',
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  org: 'maestro-69',
  project: 'homesiem',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  telemetry: false,
  silent: !process.env.CI,
  // Usipande source maps kama hakuna auth token — error capture inafanya
  // kazi hata bila token (tu stack trace itakuwa minified). Kama unataka
  // source maps, weka SENTRY_AUTH_TOKEN kwenye Vercel env.
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
})
