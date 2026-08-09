import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CalendarClock,
  Check,
  CreditCard,
  Loader2,
  Lock,
  Phone,
  Receipt,
  Smartphone,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react'

import { PageHeader, SectionCard, StatCard, StatusPill, TableWrap, cx } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import type { Plan } from '@/context/AuthContext'
import { useSubscription } from '@/context/SubscriptionContext'
import type {
  PaymentChannel,
  PaymentMethod,
  PaymentRead,
  PlanRead,
  SubscriptionRead,
} from '@/context/SubscriptionContext'
import { ApiError, api } from '@/lib/api'
import { PLAN_RANK, PLAN_MODULES, formatTzs } from '@/lib/plans'
import { modules } from '@/lib/modules'

/* ---------- shapes the backend returns ---------- */

interface CheckoutResponse {
  payment: PaymentRead
  subscription: SubscriptionRead
  instruction: string
  redirectUrl?: string | null
}

/* ---------- watoa huduma wa malipo ---------- */

const MOBILE_CHANNELS: { id: PaymentChannel; label: string; hint: string; soon?: boolean }[] = [
  { id: 'yas_mix', label: 'Yas Mix', hint: 'Mixx by Yas' },
  { id: 'airtel_money', label: 'Airtel Money', hint: 'Airtel' },
  { id: 'halopesa', label: 'HaloPesa', hint: 'Halotel' },
  { id: 'mpesa', label: 'M-Pesa', hint: 'Vodacom', soon: true },
]

//: Channel ya kwanza inayofanya kazi (si "coming soon"), kama chaguo-msingi.
const DEFAULT_CHANNEL: PaymentChannel = 'airtel_money'

const CHANNEL_LABEL: Record<PaymentChannel, string> = {
  yas_mix: 'Yas Mix',
  mpesa: 'M-Pesa',
  halopesa: 'HaloPesa',
  airtel_money: 'Airtel Money',
  card: 'Bank card',
  paypal: 'PayPal',
}

const STATUS_TONE: Record<PaymentRead['status'], 'green' | 'amber' | 'red' | 'slate'> = {
  succeeded: 'green',
  processing: 'amber',
  pending: 'amber',
  failed: 'red',
  cancelled: 'slate',
}

const STATUS_TEXT: Record<string, string> = {
  trialing: 'Free trial',
  active: 'Active',
  pending: 'Pending',
  past_due: 'Past due',
  expired: 'Trial ended',
  cancelled: 'Cancelled',
}

const STATUS_SUB: Record<string, string> = {
  trialing: 'No payment taken yet',
  active: 'Your plan is live',
  pending: 'Payment not confirmed yet',
  past_due: 'A payment did not go through',
  expired: 'You are back on Free',
  cancelled: 'This plan was cancelled',
}

function limitText(value: number, unit: string): string {
  return value === 0 ? `Unlimited ${unit.toLowerCase()}` : `${value} ${unit.toLowerCase()}`
}

function moduleName(id: string): string {
  return modules.find((m) => m.id === id)?.name ?? id
}

function formatDate(value: string | null): string {
  if (!value) return 'not set'
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/* ---------- ukurasa ---------- */

export default function Subscriptions() {
  const { user, refreshUser } = useAuth()
  const { state, loading, error: subError, reload } = useSubscription()

  const [payments, setPayments] = useState<PaymentRead[]>([])
  const [loadError, setLoadError] = useState('')

  const [selected, setSelected] = useState<PlanRead | null>(null)
  const [receipt, setReceipt] = useState<CheckoutResponse | null>(null)

  const isOwner = user?.role === 'owner'

  const load = useCallback(async () => {
    setLoadError('')
    try {
      const [, history] = await Promise.all([
        reload(),
        api.get<{ items: PaymentRead[]; total: number }>('/subscriptions/payments'),
      ])
      setPayments(history.items)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not load your payments.')
    }
  }, [reload])

  useEffect(() => {
    document.title = 'Subscriptions, HomeSIEM'
    void load()
  }, [load])

  async function onPaid(response: CheckoutResponse) {
    setSelected(null)
    setReceipt(response)
    await load()
    await refreshUser()
  }

  const current = state?.subscription
  const plans = state?.catalogue.plans ?? []
  const currentSpec = useMemo(
    () => plans.find((p) => p.plan === current?.plan),
    [plans, current?.plan],
  )
  /** Jumla ya huduma = zile za kifurushi kikubwa kabisa, sio `modules.length`
   *  (orodha ile inajumuisha ukurasa huu wenyewe). */
  const totalModules = useMemo(
    () => Math.max(...plans.map((p) => p.modules.length), 0),
    [plans],
  )

  async function cancelPending(reference: string) {
    try {
      await api.post(`/subscriptions/payments/${reference}/cancel`)
      setReceipt(null)
      await load()
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not cancel that payment.')
    }
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 size={26} className="animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={CreditCard}
        title="Subscriptions"
        subtitle="Pick the plan that fits. Pay by phone or card, and the modules unlock as soon as the payment is confirmed."
      />

      {(loadError || subError) && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{loadError || subError}</span>
        </div>
      )}

      {current?.status === 'trialing' && current.trialDaysLeft !== null && (
        <TrialCountdown
          days={current.trialDaysLeft}
          endsAt={current.trialEndsAt}
          plan={current.plan}
        />
      )}

      {current?.status === 'expired' && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-900">
          <CalendarClock size={17} className="mt-0.5 shrink-0" />
          <span>
            Your free trial has ended and the workspace is on the Free plan. Choose a paid plan
            below to unlock the modules again.
          </span>
        </div>
      )}

      {current && currentSpec && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Current plan"
            value={currentSpec.label}
            sub={
              current.status === 'trialing'
                ? 'Free trial'
                : current.priceTzs === 0
                  ? 'Free'
                  : `TSh ${formatTzs(current.priceTzs)} / month`
            }
            icon={Sparkles}
          />
          <StatCard
            label="Status"
            value={STATUS_TEXT[current.status] ?? current.status}
            sub={STATUS_SUB[current.status] ?? 'Your plan is live'}
            icon={CalendarClock}
            tone={
              current.status === 'active'
                ? 'green'
                : current.status === 'trialing'
                  ? 'blue'
                  : 'amber'
            }
          />
          <StatCard
            label="Modules"
            value={`${currentSpec.modules.length} / ${totalModules}`}
            sub="Unlocked on this plan"
            icon={Check}
            tone="blue"
          />
          <StatCard
            label={current.status === 'trialing' ? 'Trial ends' : 'Renews'}
            value={formatDate(current.trialEndsAt ?? current.currentPeriodEnd)}
            sub={
              current.status === 'trialing'
                ? 'Then it drops to Free'
                : current.autoRenew
                  ? 'Renews automatically'
                  : 'Does not renew'
            }
            icon={Receipt}
            tone="slate"
          />
        </div>
      )}

      {state?.pendingPayment && (
        <PendingBanner payment={state.pendingPayment} onCancel={cancelPending} isOwner={isOwner} />
      )}

      {receipt && !state?.pendingPayment && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800">
          <Check size={17} className="mt-0.5 shrink-0" />
          <span>{receipt.instruction}</span>
        </div>
      )}

      {!isOwner && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>
            Only an owner can change the plan. You can see the prices and what each one
            includes, but the pay button is disabled for your role ({user?.role}).
          </span>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => (
          <PlanCard
            key={plan.plan}
            plan={plan}
            currentPlan={current?.plan ?? 'Free'}
            disabled={!isOwner || Boolean(state?.pendingPayment)}
            onChoose={() => setSelected(plan)}
          />
        ))}
      </div>

      <SectionCard
        title="Payment history"
        description="Every payment attempt in this workspace"
      >
        {payments.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            No payments yet. Once you upgrade, they will show up here.
          </p>
        ) : (
          <TableWrap>
            <table className="table-base">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="text-slate-500">{formatDate(p.createdAt)}</td>
                    <td className="font-semibold text-slate-900">{p.plan}</td>
                    <td className="tabular-nums text-slate-700">TSh {formatTzs(p.amountTzs)}</td>
                    <td className="text-slate-600">
                      {CHANNEL_LABEL[p.channel]}
                      <span className="block text-xs text-slate-400">
                        {p.msisdn ?? (p.cardLast4 ? `${p.cardBrand} ••••${p.cardLast4}` : '')}
                      </span>
                    </td>
                    <td className="font-mono text-[12px] text-slate-500">{p.reference}</td>
                    <td>
                      <StatusPill tone={STATUS_TONE[p.status]}>{p.status}</StatusPill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </SectionCard>

      {selected && (
        <CheckoutDialog
          plan={selected}
          currentPlan={current?.plan ?? 'Free'}
          onClose={() => setSelected(null)}
          onPaid={onPaid}
        />
      )}
    </div>
  )
}

/* ---------- trial countdown ---------- */

function TrialCountdown({
  days,
  endsAt,
  plan,
}: {
  days: number
  endsAt: string | null
  plan: Plan
}) {
  const [now, setNow] = useState(() => Date.now())

  // A minute is fine: the smallest unit shown is minutes, so ticking faster
  // would just re-render for nothing.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const remaining = endsAt ? Math.max(0, new Date(endsAt).getTime() - now) : 0
  const d = Math.floor(remaining / 86_400_000)
  const h = Math.floor((remaining % 86_400_000) / 3_600_000)
  const m = Math.floor((remaining % 3_600_000) / 60_000)

  const urgent = days <= 5

  return (
    <div
      className={cx(
        'flex flex-col gap-4 rounded-2xl p-5 text-white sm:flex-row sm:items-center sm:justify-between',
        urgent
          ? 'bg-gradient-to-br from-red-500 to-red-700'
          : 'bg-gradient-to-br from-brand-600 to-brand-800',
      )}
    >
      <div>
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.14em] text-white/70">
          <Sparkles size={12} /> {plan} trial
        </p>
        <p className="mt-1.5 text-lg font-bold">
          {urgent ? 'Your trial is almost over' : 'Every module is unlocked right now'}
        </p>
        <p className="mt-0.5 text-sm text-white/80">
          {endsAt
            ? `Full access until ${new Date(endsAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}. After that the workspace drops to Free.`
            : 'After the trial the workspace drops to Free.'}
        </p>
      </div>

      <div className="flex shrink-0 gap-2">
        {[
          { value: d, label: d === 1 ? 'day' : 'days' },
          { value: h, label: h === 1 ? 'hour' : 'hours' },
          { value: m, label: m === 1 ? 'min' : 'mins' },
        ].map((part) => (
          <div
            key={part.label}
            className="min-w-[62px] rounded-xl bg-white/15 px-3 py-2 text-center backdrop-blur-sm"
          >
            <p className="text-2xl font-extrabold leading-none tabular-nums">{part.value}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-white/70">
              {part.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- kadi ya kifurushi ---------- */

function PlanCard({
  plan,
  currentPlan,
  disabled,
  onChoose,
}: {
  plan: PlanRead
  currentPlan: Plan
  disabled: boolean
  onChoose: () => void
}) {
  const isCurrent = plan.plan === currentPlan
  const isDowngrade = PLAN_RANK[plan.plan] < PLAN_RANK[currentPlan]
  const [showAll, setShowAll] = useState(false)

  const planOrder: Plan[] = ['Free', 'Home', 'Pro', 'Business']
  const planIdx = planOrder.indexOf(plan.plan)
  const prevPlanModules = planIdx > 0 ? PLAN_MODULES[planOrder[planIdx - 1]!] ?? [] : []
  const newModules = plan.modules.filter((id) => !prevPlanModules.includes(id))

  const shown = showAll ? newModules : newModules.slice(0, 7)

  return (
    <div
      className={cx(
        'card flex flex-col p-5 transition-all',
        plan.recommended && !isCurrent && 'border-brand-300 ring-1 ring-brand-200',
        isCurrent && 'border-emerald-300 ring-1 ring-emerald-200',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-slate-900">{plan.label}</p>
          <p className="mt-0.5 text-xs text-slate-500">{plan.tagline}</p>
        </div>
        {isCurrent ? (
          <StatusPill tone="green">Current</StatusPill>
        ) : plan.recommended ? (
          <StatusPill tone="blue">Most popular</StatusPill>
        ) : null}
      </div>

      <p className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">
        {plan.priceTzs === 0 ? (
          'Free'
        ) : (
          <>
            <span className="text-base font-bold text-slate-400">TSh </span>
            {formatTzs(plan.priceTzs)}
            <span className="text-sm font-semibold text-slate-400"> / month</span>
          </>
        )}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-2 border-y border-slate-100 py-3 text-xs">
        <div>
          <dt className="text-slate-400">Devices</dt>
          <dd className="font-semibold text-slate-700">
            {plan.limits.devices === 0 ? 'Unlimited' : plan.limits.devices}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">Retention</dt>
          <dd className="font-semibold text-slate-700">{plan.limits.retentionDays} days</dd>
        </div>
        <div>
          <dt className="text-slate-400">Analysis per day</dt>
          <dd className="font-semibold text-slate-700">
            {plan.limits.aiRequestsPerDay === 0
              ? plan.plan === 'Free'
                ? 'None'
                : 'Unlimited'
              : plan.limits.aiRequestsPerDay}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">Seats</dt>
          <dd className="font-semibold text-slate-700">{limitText(plan.limits.seats, 'Seats')}</dd>
        </div>
      </dl>

      <ul className="mt-3 flex-1 space-y-1.5">
        {planIdx > 0 && (
          <li className="pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Everything in {planOrder[planIdx - 1]}, plus:
          </li>
        )}
        {planIdx === 0 && (
          <li className="pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            What you get for free:
          </li>
        )}
        {shown.map((id) => (
          <li key={id} className="flex gap-2 text-xs text-slate-600">
            <Check size={13} className="mt-0.5 shrink-0 text-emerald-500" />
            {moduleName(id)}
          </li>
        ))}
        {newModules.length > 7 && (
          <li>
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="text-xs font-semibold text-brand-600 hover:text-brand-800"
            >
              {showAll ? 'Show fewer' : `+ ${newModules.length - 7} more`}
            </button>
          </li>
        )}
      </ul>

      <button
        type="button"
        onClick={onChoose}
        disabled={isCurrent || plan.priceTzs === 0 || isDowngrade || disabled}
        className={cx(
          'mt-5 w-full py-2.5',
          isCurrent || plan.priceTzs === 0 || isDowngrade || disabled ? 'btn-ghost' : 'btn-primary',
        )}
      >
        {isCurrent
          ? 'Your current plan'
          : plan.priceTzs === 0
            ? 'No payment needed'
            : isDowngrade
              ? 'Contact us to downgrade'
              : (
                  <>
                    Choose {plan.label} <ArrowRight size={15} />
                  </>
                )}
      </button>
    </div>
  )
}

/* ---------- bango la malipo yanayosubiri ---------- */

function PendingBanner({
  payment,
  onCancel,
  isOwner,
}: {
  payment: PaymentRead
  onCancel: (reference: string) => void
  isOwner: boolean
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3 text-sm text-amber-900">
        <Loader2 size={17} className="mt-0.5 shrink-0 animate-spin" />
        <div>
          <p className="font-semibold">
            {payment.plan} payment of TSh {formatTzs(payment.amountTzs)} is waiting to be confirmed
          </p>
          <p className="mt-0.5 text-xs">
            {CHANNEL_LABEL[payment.channel]}
            {payment.msisdn ? ` · ${payment.msisdn}` : ''}
            {payment.cardLast4 ? ` · ••••${payment.cardLast4}` : ''} · reference{' '}
            <span className="font-mono">{payment.reference}</span>
          </p>
        </div>
      </div>
      {isOwner && (
        <button
          type="button"
          onClick={() => onCancel(payment.reference)}
          className="btn-ghost btn-sm shrink-0"
        >
          <X size={14} /> Cancel
        </button>
      )}
    </div>
  )
}

/* ---------- dirisha la malipo ---------- */

function CheckoutDialog({
  plan,
  currentPlan,
  onClose,
  onPaid,
}: {
  plan: PlanRead
  currentPlan: Plan
  onClose: () => void
  onPaid: (response: CheckoutResponse) => Promise<void>
}) {
  const [method, setMethod] = useState<PaymentMethod>('mobile_money')
  const [channel, setChannel] = useState<PaymentChannel>(DEFAULT_CHANNEL)
  const [msisdn, setMsisdn] = useState('')

  const [cardNumber, setCardNumber] = useState('')
  const [holder, setHolder] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')

    let body: Record<string, unknown>

    if (method === 'mobile_money') {
      if (msisdn.replace(/\D/g, '').length < 9) {
        return setError('Enter a phone number, for example 0712345678.')
      }
      body = { plan: plan.plan, method, channel, msisdn }
    } else {
      const [mm, yy] = expiry.split('/')
      if (!mm || !yy) return setError('Enter the expiry date as MM/YY.')
      const digits = cardNumber.replace(/\D/g, '')
      if (digits.length < 12) return setError('That card number is incomplete.')
      if (holder.trim().length < 2) return setError('Enter the name printed on the card.')
      if (cvv.length < 3) return setError('The CVV is 3 or 4 digits.')

      body = {
        plan: plan.plan,
        method,
        channel: 'card',
        card: {
          number: digits,
          holder: holder.trim(),
          expiryMonth: Number(mm),
          expiryYear: 2000 + Number(yy),
          cvv,
        },
      }
    }

    setBusy(true)
    try {
      const response = await api.post<CheckoutResponse>('/subscriptions/checkout', body)
      if (response.redirectUrl) {
        window.location.href = response.redirectUrl
        return
      }
      await onPaid(response)
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof Error ? err.message : 'The payment could not be started.',
      )
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="card w-full max-w-lg">
        <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Upgrade to {plan.label}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Moving from {currentPlan} to {plan.label}. TSh {formatTzs(plan.priceTzs)} per month.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </header>

        <form onSubmit={submit} className="space-y-4 p-5" noValidate>
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <span className="label">How would you like to pay?</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMethod('mobile_money')}
                className={cx(
                  'flex items-center gap-2.5 rounded-lg border px-3.5 py-3 text-left transition-all',
                  method === 'mobile_money'
                    ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-200'
                    : 'border-slate-200 hover:border-brand-300',
                )}
              >
                <Smartphone size={18} className="shrink-0 text-brand-600" />
                <span>
                  <span className="block text-sm font-semibold text-slate-800">Phone</span>
                  <span className="block text-xs text-slate-500">Mobile money</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setMethod('bank_card')}
                className={cx(
                  'flex items-center gap-2.5 rounded-lg border px-3.5 py-3 text-left transition-all',
                  method === 'bank_card'
                    ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-200'
                    : 'border-slate-200 hover:border-brand-300',
                )}
              >
                <Wallet size={18} className="shrink-0 text-blue-600" />
                <span>
                  <span className="block text-sm font-semibold text-slate-800">Bank & PayPal</span>
                  <span className="block text-xs text-slate-500">Card or PayPal</span>
                </span>
              </button>
            </div>
          </div>

          {method === 'mobile_money' && (
            <>
              <div>
                <span className="label">Provider</span>
                <div className="grid grid-cols-2 gap-2">
                  {MOBILE_CHANNELS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      disabled={c.soon}
                      title={c.soon ? `${c.label} is coming soon` : undefined}
                      onClick={() => !c.soon && setChannel(c.id)}
                      className={cx(
                        'relative rounded-lg border px-3 py-2.5 text-left transition-all',
                        c.soon
                          ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-70'
                          : channel === c.id
                            ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-200'
                            : 'border-slate-200 hover:border-brand-300',
                      )}
                    >
                      <span className={cx('block text-sm font-semibold', c.soon ? 'text-slate-500' : 'text-slate-800')}>{c.label}</span>
                      <span className="block text-xs text-slate-400">{c.hint}</span>
                      {c.soon && (
                        <span className="absolute right-1.5 top-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700">
                          soon
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label" htmlFor="msisdn">
                  Phone number
                </label>
                <div className="relative">
                  <Phone size={16} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    id="msisdn"
                    inputMode="tel"
                    autoComplete="tel"
                    className="input pl-10"
                    placeholder="0712345678"
                    value={msisdn}
                    onChange={(e) => setMsisdn(e.target.value)}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  You will get a confirmation prompt on this number.
                </p>
              </div>
            </>
          )}

          {method === 'bank_card' && (
            <>
              <div>
                <label className="label" htmlFor="card-number">
                  Card number
                </label>
                <div className="relative">
                  <CreditCard size={16} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    id="card-number"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    className="input pl-10 font-mono"
                    placeholder="4242 4242 4242 4242"
                    value={cardNumber}
                    onChange={(e) =>
                      setCardNumber(
                        e.target.value
                          .replace(/\D/g, '')
                          .slice(0, 19)
                          .replace(/(.{4})/g, '$1 ')
                          .trim(),
                      )
                    }
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="card-holder">
                  Name on card
                </label>
                <div className="relative">
                  <Building2 size={16} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    id="card-holder"
                    autoComplete="cc-name"
                    className="input pl-10"
                    placeholder="HANS RICHARD"
                    value={holder}
                    onChange={(e) => setHolder(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="card-expiry">
                    Expiry (MM/YY)
                  </label>
                  <input
                    id="card-expiry"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    className="input font-mono"
                    placeholder="11/29"
                    maxLength={5}
                    value={expiry}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 4)
                      setExpiry(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits)
                    }}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="card-cvv">
                    CVV
                  </label>
                  <input
                    id="card-cvv"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    className="input font-mono"
                    placeholder="123"
                    maxLength={4}
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>

              <p className="flex items-start gap-2 rounded-lg bg-slate-50 px-3.5 py-2.5 text-xs text-slate-500">
                <Lock size={13} className="mt-0.5 shrink-0" />
                We never store your full card number. It goes straight to the payment
                gateway, and we keep only the last four digits.
              </p>
            </>
          )}

          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <div>
              <p className="text-xs text-slate-500">Total</p>
              <p className="text-xl font-extrabold text-slate-900">
                TSh {formatTzs(plan.priceTzs)}
              </p>
            </div>
            <button type="submit" className="btn-primary px-6 py-2.5" disabled={busy}>
              {busy && <Loader2 size={15} className="animate-spin" />}
              {busy ? 'Sending…' : 'Pay now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
