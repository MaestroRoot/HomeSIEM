import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react'
import AuthLayout from '@/components/auth/AuthLayout'
import GoogleButton, { AuthDivider } from '@/components/auth/GoogleButton'
import { useAuth } from '@/context/AuthContext'
import { cx } from '@/components/ui'

const profiles = [
  { id: 'home', label: 'Home user', hint: 'Protect my own network' },
  { id: 'student', label: 'Student', hint: 'Learning cybersecurity' },
  { id: 'business', label: 'Small business', hint: 'Office / shop network' },
  { id: 'pro', label: 'Security pro', hint: 'Pentester or researcher' },
]

function strengthOf(pw: string) {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return Math.min(score, 4)
}

const strengthMeta = [
  { label: 'Very weak', bar: 'bg-red-500', text: 'text-red-600' },
  { label: 'Weak', bar: 'bg-orange-500', text: 'text-orange-600' },
  { label: 'Fair', bar: 'bg-amber-500', text: 'text-amber-600' },
  { label: 'Strong', bar: 'bg-brand-500', text: 'text-brand-600' },
  { label: 'Very strong', bar: 'bg-emerald-500', text: 'text-emerald-600' },
]

export default function Signup() {
  const { signup, loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [profile, setProfile] = useState('home')
  const [showPw, setShowPw] = useState(false)
  const [agree, setAgree] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)

  useEffect(() => {
    document.title = 'Create account, HomeSIEM'
  }, [])

  async function onGoogle() {
    setError('')
    setGoogleBusy(true)
    try {
      await loginWithGoogle()
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign up failed.')
      setGoogleBusy(false)
    }
  }

  const strength = useMemo(() => strengthOf(password), [password])
  const meta = strengthMeta[strength] ?? strengthMeta[0]!

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (name.trim().length < 2) return setError('Please enter your full name.')
    if (!email.includes('@')) return setError('Please enter a valid email address.')
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    if (password !== confirm) return setError('The two passwords do not match.')
    if (!agree) return setError('Please accept the terms and the authorised-use policy.')

    setBusy(true)
    try {
      await signup({ name: name.trim(), email, password })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed.')
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title="Create your Home SOC"
      subtitle="Free to start. Add your first device and be capturing traffic in minutes."
      highlights={[
        'Free plan, no card needed to start',
        'Two devices and core alerting at no cost',
        'Upgrade any time with M-Pesa, Airtel, Yas or a bank card',
        'AI packet and log analysis from the Home plan up',
      ]}
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-800">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <GoogleButton label="Sign up with Google" busy={googleBusy} disabled={busy} onClick={onGoogle} />

        <AuthDivider label="or use your email" />

        <div>
          <label className="label" htmlFor="name">
            Full name
          </label>
          <div className="relative">
            <User size={16} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" />
            <input
              id="name"
              className="input pl-10"
              autoComplete="name"
              placeholder="Jane Mwangi"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="email">
            Email address
          </label>
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" />
            <input
              id="email"
              type="email"
              className="input pl-10"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <span className="label">What describes you best?</span>
          <div className="grid grid-cols-2 gap-2">
            {profiles.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProfile(p.id)}
                className={cx(
                  'rounded-lg border px-3 py-2.5 text-left transition-all',
                  profile === p.id
                    ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-200'
                    : 'border-slate-200 bg-white hover:border-brand-300',
                )}
              >
                <span className="block text-sm font-semibold text-slate-800">{p.label}</span>
                <span className="block text-xs text-slate-500">{p.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" />
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              className="input pl-10 pr-10"
              autoComplete="new-password"
              placeholder="At least 8 characters"
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

          {password && (
            <div className="mt-2 flex items-center gap-3">
              <div className="flex flex-1 gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={cx(
                      'h-1.5 flex-1 rounded-full transition-colors',
                      i < strength ? meta.bar : 'bg-slate-200',
                    )}
                  />
                ))}
              </div>
              <span className={cx('text-xs font-semibold', meta.text)}>{meta.label}</span>
            </div>
          )}
        </div>

        <div>
          <label className="label" htmlFor="confirm">
            Confirm password
          </label>
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" />
            <input
              id="confirm"
              type={showPw ? 'text' : 'password'}
              className="input pl-10"
              autoComplete="new-password"
              placeholder="Repeat your password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          <span>
            I accept the{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="font-semibold text-brand-700 hover:underline">Terms of Service</a>{' '}
            and{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="font-semibold text-brand-700 hover:underline">Privacy Policy</a>, and confirm I will only monitor networks and systems I am{' '}
            <strong className="font-semibold text-slate-800">authorised to test</strong>.
          </span>
        </label>

        <button type="submit" className="btn-primary w-full py-3" disabled={busy || googleBusy}>
          {busy && <Loader2 size={16} className="animate-spin" />}
          {busy ? 'Creating your SOC…' : 'Create free account'}
        </button>
      </form>
    </AuthLayout>
  )
}
