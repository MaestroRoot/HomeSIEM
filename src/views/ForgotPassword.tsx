import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MailCheck,
} from 'lucide-react'

import AuthLayout from '@/components/auth/AuthLayout'
import { cx } from '@/components/ui'
import { ApiError, api } from '@/lib/api'

type Step = 'email' | 'code' | 'password' | 'done'

interface Ticket {
  resetToken: string
  expiresInMinutes: number
}

const STEP_LABEL: Record<Step, string> = {
  email: 'Reset your password',
  code: 'Check your inbox',
  password: 'Choose a new password',
  done: 'Password changed',
}

const STEP_SUB: Record<Step, string> = {
  email: 'Enter the email on your account and we will send a six digit code.',
  code: 'Enter the six digit code we emailed you. It is valid for a few minutes.',
  password: 'Pick something you have not used here before.',
  done: 'You can sign in with your new password now.',
}

export default function ForgotPassword() {
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [ticket, setTicket] = useState<Ticket | null>(null)

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)

  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    document.title = 'Reset password, HomeSIEM'
  }, [])

  const canSubmit = useMemo(() => {
    if (step === 'email') return email.includes('@')
    if (step === 'code') return code.length === 6
    if (step === 'password') return password.length >= 8 && password === confirm
    return false
  }, [step, email, code, password, confirm])

  async function requestCode(resend = false) {
    setError('')
    setBusy(true)
    try {
      await api.post('/auth/password-reset/request', { email: email.trim() }, { auth: false })
      setStep('code')
      setNotice(
        resend
          ? 'A new code is on its way.'
          : 'A six digit code is on its way.',
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not send the code.')
    } finally {
      setBusy(false)
    }
  }

  async function verifyCode() {
    setError('')
    setNotice('')
    setBusy(true)
    try {
      const result = await api.post<Ticket>(
        '/auth/password-reset/verify',
        { email: email.trim(), code },
        { auth: false },
      )
      setTicket(result)
      setStep('password')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That code did not work.')
    } finally {
      setBusy(false)
    }
  }

  async function savePassword() {
    if (!ticket) return
    setError('')
    setBusy(true)
    try {
      await api.post(
        '/auth/password-reset/confirm',
        { email: email.trim(), resetToken: ticket.resetToken, newPassword: password },
        { auth: false },
      )
      setStep('done')
    } catch (err) {
      // Reset token ni ya matumizi moja: ikishafeli, lazima aanze upya.
      const message = err instanceof Error ? err.message : 'We could not change the password.'
      setError(message)
      if (err instanceof ApiError && err.code === 'reset_token_invalid') {
        setTicket(null)
        setCode('')
        setStep('email')
      }
    } finally {
      setBusy(false)
    }
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!canSubmit || busy) return
    if (step === 'email') void requestCode()
    else if (step === 'code') void verifyCode()
    else if (step === 'password') void savePassword()
  }

  return (
    <AuthLayout
      title={STEP_LABEL[step]}
      subtitle={STEP_SUB[step]}
      footer={
        <>
          Remembered it?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-800">
            Back to sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Steps current={step} />

        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {notice && !error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-brand-200 bg-brand-50 px-3.5 py-3 text-sm text-brand-800">
            <MailCheck size={16} className="mt-0.5 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {step === 'email' && (
          <div>
            <label className="label" htmlFor="fp-email">
              Email address
            </label>
            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" />
              <input
                id="fp-email"
                type="email"
                autoComplete="email"
                className="input pl-10"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>
          </div>
        )}

        {step === 'code' && (
          <div className="animate-fade-up">
            <label className="label" htmlFor="fp-code">
              Six digit code
            </label>
            <div className="relative">
              <KeyRound size={16} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" />
              <input
                id="fp-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                className="input pl-10 text-center font-mono text-lg tracking-[.5em]"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                autoFocus
              />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setStep('email')
                  setCode('')
                  setNotice('')
                  setError('')
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-brand-600"
              >
                <ArrowLeft size={13} /> Use a different email
              </button>
              <button
                type="button"
                onClick={() => void requestCode(true)}
                disabled={busy}
                className="text-xs font-semibold text-brand-600 hover:text-brand-800 disabled:opacity-50"
              >
                Send a new code
              </button>
            </div>
          </div>
        )}

        {step === 'password' && (
          <div className="animate-fade-up space-y-4">
            <div>
              <label className="label" htmlFor="fp-password">
                New password
              </label>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  id="fp-password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="input pl-10 pr-10"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
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
              <p className="mt-1 text-xs text-slate-500">
                Mix letters and numbers. All letters or all digits will be rejected.
              </p>
            </div>

            <div>
              <label className="label" htmlFor="fp-confirm">
                Confirm new password
              </label>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  id="fp-confirm"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="input pl-10"
                  placeholder="Repeat it"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              {confirm.length > 0 && confirm !== password && (
                <p className="mt-1 text-xs font-semibold text-red-600">
                  The two passwords do not match.
                </p>
              )}
            </div>
          </div>
        )}

        {step === 'done' ? (
          <div className="animate-fade-up space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800">
              <Check size={17} className="mt-0.5 shrink-0" />
              <span>Your password has been changed and every other session was signed out.</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/login', { replace: true })}
              className="btn-primary w-full py-3"
            >
              Go to sign in
            </button>
          </div>
        ) : (
          <button type="submit" className="btn-primary w-full py-3" disabled={!canSubmit || busy}>
            {busy && <Loader2 size={16} className="animate-spin" />}
            {busy
              ? 'Working…'
              : step === 'email'
                ? 'Send the code'
                : step === 'code'
                  ? 'Verify code'
                  : 'Change password'}
          </button>
        )}
      </form>
    </AuthLayout>
  )
}

function Steps({ current }: { current: Step }) {
  const order: Step[] = ['email', 'code', 'password']
  const index = current === 'done' ? order.length : order.indexOf(current)

  return (
    <ol className="flex items-center gap-2">
      {order.map((step, i) => (
        <li key={step} className="flex flex-1 items-center gap-2">
          <span
            className={cx(
              'grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold',
              i < index
                ? 'bg-emerald-500 text-white'
                : i === index
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-200 text-slate-500',
            )}
          >
            {i < index ? <Check size={12} /> : i + 1}
          </span>
          {i < order.length - 1 && (
            <span className={cx('h-px flex-1', i < index ? 'bg-emerald-400' : 'bg-slate-200')} />
          )}
        </li>
      ))}
    </ol>
  )
}
