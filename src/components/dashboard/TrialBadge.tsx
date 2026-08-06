import { Link } from 'react-router-dom'
import { ShieldCheck, Sparkles } from 'lucide-react'

import { useSubscription } from '@/context/SubscriptionContext'
import { cx } from '../ui'

/**
 * Compact plan pill for the top bar, next to the notifications bell. During the
 * 30 day Business trial it counts down; after that it just names the plan.
 */
export default function TrialBadge({ onNavigate }: { onNavigate?: () => void }) {
  const { state, loading } = useSubscription()

  if (loading || !state) {
    return <div className="hidden h-8 w-24 animate-pulse rounded-lg bg-slate-100 md:block" />
  }

  const { plan, status, trialDaysLeft, trialEndsAt } = state.subscription
  const trialing = status === 'trialing' && trialDaysLeft !== null
  const expired = status === 'expired'

  const endsLabel = trialEndsAt
    ? `Ends ${new Date(trialEndsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
    : 'Choose a plan'

  let tone = 'bg-slate-100 text-slate-600 hover:bg-slate-200'
  let label = `${plan} plan`
  let title = 'Manage subscription'
  let Icon = ShieldCheck

  if (trialing) {
    const days = trialDaysLeft as number
    const urgent = days <= 5
    tone = urgent
      ? 'bg-red-50 text-red-700 hover:bg-red-100'
      : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
    label = `${plan} trial · ${days}d`
    title = endsLabel
    Icon = Sparkles
  } else if (expired) {
    tone = 'bg-amber-50 text-amber-700 hover:bg-amber-100'
    label = 'Trial ended'
    title = 'Upgrade to unlock'
  }

  return (
    <Link
      to="/dashboard/subscriptions"
      onClick={onNavigate}
      title={title}
      className={cx(
        'hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors md:inline-flex',
        tone,
      )}
    >
      <Icon size={13} />
      {label}
    </Link>
  )
}
