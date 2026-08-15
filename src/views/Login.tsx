import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react'
import AuthLayout from '@/components/auth/AuthLayout'
import GoogleButton, { AuthDivider } from '@/components/auth/GoogleButton'
import { useAuth } from '@/context/AuthContext'
import type { User } from '@/context/AuthContext'

/** Admins wanaenda kwenye admin console, wengine kwenye dashboard yao. */
function afterLoginPath(user: User) {
  return user.role === 'admin' ? '/admin' : '/dashboard'
}

export default function Login() {
  const { login, loginWithGoogle, verifyMfa, mfaRequired, clearMfa } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)

  // MFA OTP state
  const [mfaCode, setMfaCode] = useState('')
  const [mfaBusy, setMfaBusy] = useState(false)
  const [mfaError, setMfaError] = useState('')

  useEffect(() => {
    document.title = 'Login, HomeSIEM'
  }, [])

  // Cleanup MFA state on unmount
  useEffect(() => {
    return () => {
      if (mfaRequired) clearMfa()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function onGoogle() {
    setError('')
    setGoogleBusy(true)
    try {
      const user = await loginWithGoogle()
      navigate(afterLoginPath(user), { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign in failed.')
      setGoogleBusy(false)
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!email.includes('@')) return setError('Please enter a valid email address.')
    if (password.length < 6) return setError('Password must be at least 6 characters.')

    setBusy(true)
    try {
      const result = await login(email, password)
      if (!result.mfaRequired) {
        navigate(afterLoginPath(result.user), { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.')
      setBusy(false)
    }
  }

  async function onMfaVerify(e: React.FormEvent) {
    e.preventDefault()
    setMfaError('')
    if (mfaCode.length !== 6) return setMfaError('Enter the 6-digit code.')

    setMfaBusy(true)
    try {
      const verified = await verifyMfa(mfaCode)
      navigate(afterLoginPath(verified), { replace: true })
    } catch (err) {
      setMfaError(err instanceof Error ? err.message : 'Verification failed.')
      setMfaBusy(false)
    }
  }

  function onMfaCancel() {
    clearMfa()
    setMfaCode('')
    setMfaError('')
    setBusy(false)
  }

  // --- MFA OTP screen ---
  if (mfaRequired) {
    return (
      <AuthLayout
        title="Verify your identity"
        subtitle="A 6-digit code was sent to your email. Enter it below to complete sign in."
        footer={
          <button
            type="button"
            onClick={onMfaCancel}
            className="font-semibold text-brand-600 hover:text-brand-800"
          >
            ← Back to sign in
          </button>
        }
      >
        <form onSubmit={onMfaVerify} className="space-y-4" noValidate>
          {mfaError && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{mfaError}</span>
            </div>
          )}

          <div className="flex items-center gap-3 rounded-lg border border-brand-200 bg-brand-50 px-3.5 py-3 text-sm text-brand-700">
            <ShieldCheck size={16} className="shrink-0" />
            <span>Multi-factor authentication is enabled on this account.</span>
          </div>

          <div>
            <label className="label" htmlFor="mfa-code">
              Verification code
            </label>
            <div className="relative">
              <ShieldCheck size={16} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" />
              <input
                id="mfa-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                className="input pl-10 text-center tracking-[0.4em] font-mono text-lg"
                placeholder="000000"
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                autoFocus
              />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full py-3" disabled={mfaBusy}>
            {mfaBusy && <Loader2 size={16} className="animate-spin" />}
            {mfaBusy ? 'Verifying…' : 'Verify & sign in'}
          </button>
        </form>
      </AuthLayout>
    )
  }

  // --- Normal login screen ---
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your Home SOC and pick up where you left off."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="font-semibold text-brand-600 hover:text-brand-800">
            Sign up free
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-3" noValidate>
        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <GoogleButton label="Sign in with Google" busy={googleBusy} disabled={busy} onClick={onGoogle} />

        <AuthDivider label="or sign in with email" />

        <div>
          <label className="label" htmlFor="email">
            Email address
          </label>
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="input pl-10"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="label" htmlFor="password">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="mb-1.5 text-xs font-semibold text-brand-600 hover:text-brand-800"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" />
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              className="input pl-10 pr-10"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        <button type="submit" className="btn-primary w-full py-3" disabled={busy || googleBusy}>
          {busy && <Loader2 size={16} className="animate-spin" />}
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  )
}
