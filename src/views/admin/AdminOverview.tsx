import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  Building2,
  CreditCard,
  Hourglass,
  Loader2,
  ShieldCheck,
  UserX,
  Users as UsersIcon,
  Wallet,
} from 'lucide-react'

import { PageHeader, SectionCard, StatCard, cx } from '@/components/ui'
import { api } from '@/lib/api'
import { pollWhenVisible } from '@/lib/usePolling'

interface AdminStats {
  totalUsers: number
  totalOrganizations: number
  activeUsers30d: number
  newUsers30d: number
  suspendedUsers: number
  adminUsers: number
  subscriptionCounts: Record<string, number>
  trialCount: number
  paidSubscriptions: number
}

const PLAN_ORDER = ['Free', 'Home', 'Pro', 'Business']

const fmt = (n: number | undefined | null) => {
  if (n === undefined || n === null) return '—'
  return typeof n === 'number' ? n.toLocaleString() : String(n)
}

export default function AdminOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await api.get<AdminStats>('/admin/stats')
      setStats(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load platform stats.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const stop = pollWhenVisible(load, 30000)
    return () => stop()
  }, [load])

  const totalPlans = stats
    ? PLAN_ORDER.reduce((sum, plan) => sum + (stats.subscriptionCounts[plan] ?? 0), 0)
    : 0

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ShieldCheck}
        title="Platform overview"
        subtitle="Everything happening across every HomeSIEM workspace."
        actions={
          <Link to="/admin/users" className="btn-primary btn-sm whitespace-nowrap">
            <UsersIcon size={14} /> Manage users
          </Link>
        }
      />

      {loading && !stats ? (
        <div className="grid place-items-center py-20 text-slate-400">
          <Loader2 size={22} className="animate-spin" />
        </div>
      ) : error && !stats ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
      ) : stats ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total users" value={fmt(stats.totalUsers)} sub="Across all orgs" icon={UsersIcon} />
            <StatCard label="Organizations" value={fmt(stats.totalOrganizations)} sub="Active workspaces" icon={Building2} tone="green" />
            <StatCard label="Active (30 days)" value={fmt(stats.activeUsers30d)} sub="Logged in recently" icon={Activity} />
            <StatCard label="New (30 days)" value={fmt(stats.newUsers30d)} sub="Signed up recently" icon={Wallet} tone="green" />
            <StatCard label="Suspended" value={fmt(stats.suspendedUsers)} sub="Accounts disabled" icon={UserX} tone="red" />
            <StatCard label="Admins" value={fmt(stats.adminUsers)} sub="Platform admins" icon={ShieldCheck} />
            <StatCard label="On trial" value={fmt(stats.trialCount)} sub="Business trial running" icon={Hourglass} tone="amber" />
            <StatCard label="Paying orgs" value={fmt(stats.paidSubscriptions)} sub="On a paid plan" icon={CreditCard} tone="amber" />
          </div>

          <SectionCard title="Plan distribution" description="How many orgs sit on each plan">
            <div className="space-y-4 p-5">
              {PLAN_ORDER.map((plan) => {
                const count = stats.subscriptionCounts[plan] ?? 0
                const pct = totalPlans > 0 ? Math.round((count / totalPlans) * 100) : 0
                return (
                  <div key={plan}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-700">{plan}</span>
                      <span className="tabular-nums text-slate-500">
                        {fmt(count)} · {pct}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={cx(
                          'h-full rounded-full',
                          plan === 'Free' ? 'bg-slate-300' : plan === 'Home' ? 'bg-emerald-500' : 'bg-brand-600',
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </SectionCard>
        </>
      ) : null}
    </div>
  )
}
