import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { Severity } from '@/lib/types'

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ')
}

/* ---------- severity ---------- */

const severityStyles: Record<Severity, string> = {
  critical: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  high: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  medium: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  low: 'bg-brand-50 text-brand-700 ring-1 ring-brand-200',
  info: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
}

const severityDot: Record<Severity, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-500',
  low: 'bg-brand-500',
  info: 'bg-slate-400',
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={cx('chip capitalize', severityStyles[severity])}>
      <span className={cx('h-1.5 w-1.5 rounded-full', severityDot[severity])} />
      {severity}
    </span>
  )
}

export function StatusPill({
  tone,
  children,
}: {
  tone: 'green' | 'blue' | 'amber' | 'red' | 'slate'
  children: ReactNode
}) {
  const tones = {
    green: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    blue: 'bg-brand-50 text-brand-700 ring-1 ring-brand-200',
    amber: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    red: 'bg-red-50 text-red-700 ring-1 ring-red-200',
    slate: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  }
  return <span className={cx('chip', tones[tone])}>{children}</span>
}

/* ---------- layout helpers ---------- */

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
}: {
  title: string
  subtitle: string
  icon: LucideIcon
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex gap-3.5">
        <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-600 text-white shadow-lift">
          <Icon className="h-5.5 w-5.5" size={22} />
        </span>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
          <p className="mt-0.5 max-w-2xl text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function SectionCard({
  title,
  description,
  right,
  children,
  className,
}: {
  title?: string
  description?: string
  right?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cx('card overflow-hidden', className)}>
      {(title || right) && (
        <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            {title && <h2 className="text-sm font-bold text-slate-900">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
          </div>
          {right}
        </header>
      )}
      {children}
    </section>
  )
}

function Sparkline({ data, tone }: { data: number[]; tone: string }) {
  if (data.length < 2) return null
  const max = Math.max(...data, 1)
  const w = 72
  const h = 22
  const step = w / (data.length - 1)
  const points = data.map((v, i) => `${(i * step).toFixed(1)},${(h - (v / max) * h).toFixed(1)}`).join(' ')
  const stroke = tone === 'red' ? '#dc2626' : tone === 'amber' ? '#f59e0b' : tone === 'green' ? '#10b981' : '#2563eb'
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="mt-2 overflow-visible">
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = 'blue',
  spark,
}: {
  label: string
  value: string | number
  sub?: string
  icon: LucideIcon
  tone?: 'blue' | 'red' | 'amber' | 'green' | 'slate'
  spark?: number[]
}) {
  const tones = {
    blue: 'bg-brand-50 text-brand-600',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-emerald-50 text-emerald-600',
    slate: 'bg-slate-100 text-slate-600',
  }
  return (
    <div className="card group p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
          {sub && <p className="mt-1 truncate text-xs text-slate-500">{sub}</p>}
          {spark && <Sparkline data={spark} tone={tone} />}
        </div>
        <span className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-lg', tones[tone])}>
          <Icon size={19} />
        </span>
      </div>
    </div>
  )
}

export function AiPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-brand-200 bg-brand-50 p-5 dark:border-[#2a2a2a] dark:bg-[#111318]">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-600 text-xs font-bold text-white">
          ✦
        </span>
        <h3 className="text-sm font-bold text-brand-900">{title}</h3>
      </div>
      <div className="space-y-2 text-sm leading-relaxed text-slate-700">{children}</div>
    </div>
  )
}

export function ConfidenceBar({ value }: { value: number }) {
  const tone = value >= 85 ? 'bg-red-500' : value >= 65 ? 'bg-amber-500' : 'bg-brand-500'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
        <div className={cx('h-full rounded-full transition-all', tone)} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-semibold tabular-nums text-slate-600">{value}%</span>
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  message,
}: {
  icon: LucideIcon
  title: string
  message: string
}) {
  return (
    <div className="grid place-items-center px-6 py-16 text-center">
      <span className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-600">
        <Icon size={22} />
      </span>
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>
    </div>
  )
}

export function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-3">
      {children}
    </div>
  )
}

export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>
}

export function Mono({ children }: { children: ReactNode }) {
  return <span className="font-mono text-[13px] text-slate-700">{children}</span>
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  requireType,
  busy = false,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  /** Ikiwa imewekwa, mtumiaji anatakiwa kuandika neno hili kabla ya kuthibitisha. */
  requireType?: string
  busy?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  const [typed, setTyped] = useState('')
  const matched = !requireType || typed === requireType

  useEffect(() => {
    if (!open) setTyped('')
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4"
      onClick={busy ? undefined : onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <div className="mt-2 space-y-2 text-sm leading-relaxed text-slate-600">{message}</div>
        {requireType && (
          <div className="mt-4">
            <label className="label" htmlFor="confirm-type">
              Type{' '}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-red-600">
                {requireType}
              </code>{' '}
              to confirm
            </label>
            <input
              id="confirm-type"
              className="input"
              value={typed}
              autoFocus
              disabled={busy}
              onChange={(e) => setTyped(e.target.value)}
            />
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn-danger" onClick={onConfirm} disabled={!matched || busy}>
            {busy ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
