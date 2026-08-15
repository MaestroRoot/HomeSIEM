import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2, RefreshCw, Search, ShieldCheck, Users as UsersIcon } from 'lucide-react'

import { PageHeader, SectionCard, StatusPill, TableWrap, cx } from '@/components/ui'
import { api } from '@/lib/api'
import type { Plan, Role } from '@/context/AuthContext'

interface AdminSubscription {
  plan: string
  status: string
  priceTzs: number
  currentPeriodEnd: string | null
  trialEndsAt: string | null
}

interface AdminUser {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  plan: string
  mfaEnabled: boolean
  emailVerified: boolean
  isActive: boolean
  avatarUrl: string | null
  createdAt: string
  lastLoginAt: string | null
  organizationId: string
  organizationName: string | null
  subscription: AdminSubscription | null
}

interface AdminUserList {
  items: AdminUser[]
  total: number
}

const ROLES: Role[] = ['owner', 'analyst', 'viewer', 'admin']
const PLANS: Plan[] = ['Free', 'Home', 'Pro', 'Business']
const SUB_STATUSES = ['trialing', 'active', 'pending', 'past_due', 'expired', 'cancelled']

const statusTone: Record<string, 'green' | 'amber' | 'red' | 'slate'> = {
  trialing: 'amber',
  active: 'green',
  pending: 'amber',
  past_due: 'red',
  expired: 'slate',
  cancelled: 'slate',
}

const PAGE_SIZE = 25

function initials(name: string) {
  return (name || '?').split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase() || '?'
}

export default function AdminUsers() {
  const [items, setItems] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  const [plan, setPlan] = useState('')
  const [status, setStatus] = useState('')
  const [offset, setOffset] = useState(0)

  const load = useCallback(async (search = q, r = role, p = plan, s = status, off = offset) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(off) })
      if (search.trim()) params.set('q', search.trim())
      if (r) params.set('role', r)
      if (p) params.set('plan', p)
      if (s) params.set('subscription_status', s)
      const data = await api.get<AdminUserList>(`/admin/users?${params.toString()}`)
      setItems(data.items)
      setTotal(data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users.')
    } finally {
      setLoading(false)
    }
  }, [q, role, plan, status, offset])

  useEffect(() => {
    load()
  }, [load])

  function resetAndLoad(extra: Partial<{ q: string; role: string; plan: string; status: string; offset: number }> = {}) {
    const next = { q, role, plan, status, offset: 0, ...extra }
    if ('q' in extra || 'role' in extra || 'plan' in extra || 'status' in extra) next.offset = 0
    setQ(next.q ?? '')
    setRole(next.role ?? '')
    setPlan(next.plan ?? '')
    setStatus(next.status ?? '')
    setOffset(next.offset ?? 0)
  }

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    resetAndLoad({ q })
  }

  function applyPatch(updated: AdminUser) {
    setItems((rows) => rows.map((r) => (r.id === updated.id ? updated : r)))
  }

  async function changePlan(row: AdminUser, next: Plan) {
    if (next === row.plan) return
    if (!window.confirm(`Change ${row.email}'s workspace plan to ${next}?`)) return
    setSavingId(row.id)
    try {
      const updated = await api.patch<AdminUser>(`/admin/users/${row.id}/plan`, { plan: next })
      applyPatch(updated)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to change plan.')
    } finally {
      setSavingId(null)
    }
  }

  async function changeRole(row: AdminUser, next: Role) {
    if (next === row.role) return
    setSavingId(row.id)
    try {
      const updated = await api.patch<AdminUser>(`/admin/users/${row.id}/role`, { role: next })
      applyPatch(updated)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to change role.')
    } finally {
      setSavingId(null)
    }
  }

  async function toggleStatus(row: AdminUser) {
    const suspending = row.isActive
    if (suspending && !window.confirm(`Suspend ${row.email}? They will be signed out everywhere.`)) return
    setSavingId(row.id)
    try {
      const updated = await api.patch<AdminUser>(`/admin/users/${row.id}/status`, { isActive: !row.isActive })
      applyPatch(updated)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to update status.')
    } finally {
      setSavingId(null)
    }
  }

  const filtersActive = Boolean(q || role || plan || status)

  return (
    <div className="space-y-6">
      <PageHeader
        icon={UsersIcon}
        title="Users"
        subtitle="Every account on the platform. Manage plans, roles and account status."
        actions={
          <button type="button" onClick={() => load()} className="btn-ghost btn-sm whitespace-nowrap">
            <RefreshCw size={14} /> Refresh
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <form onSubmit={onSearchSubmit} className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search size={15} className="pointer-events-none absolute left-3 top-2.5 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or email…"
            className="input pl-9"
          />
        </form>

        <select
          value={role}
          onChange={(e) => resetAndLoad({ role: e.target.value })}
          className="input w-auto"
          aria-label="Filter by role"
        >
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <select
          value={plan}
          onChange={(e) => resetAndLoad({ plan: e.target.value })}
          className="input w-auto"
          aria-label="Filter by plan"
        >
          <option value="">All plans</option>
          {PLANS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => resetAndLoad({ status: e.target.value })}
          className="input w-auto"
          aria-label="Filter by subscription status"
        >
          <option value="">All statuses</option>
          {SUB_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {filtersActive && (
          <button type="button" onClick={() => resetAndLoad({ q: '', role: '', plan: '', status: '' })} className="btn-ghost btn-sm">
            Clear filters
          </button>
        )}
      </div>

      <SectionCard
        title="All users"
        description={`${total.toLocaleString()} total`}
        right={
          <span className="text-xs text-slate-400">
            Showing {items.length ? offset + 1 : 0}–{offset + items.length}
          </span>
        }
      >
        <TableWrap>
          <table className="table-base">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Plan</th>
                <th>Subscription</th>
                <th>Organization</th>
                <th>Last login</th>
                <th className="text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">
                    <Loader2 size={20} className="mx-auto animate-spin" />
                  </td>
                </tr>
              ) : error && items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-red-600">
                    {error}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-400">
                    No users match these filters.
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id} className={cx(!row.isActive && 'opacity-60')}>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-100 text-xs font-bold text-brand-700">
                          {row.avatarUrl ? (
                            <img src={row.avatarUrl} alt="" className="h-9 w-9 rounded-lg object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            initials(row.name)
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-slate-900">
                            {row.name}
                            {row.role === 'admin' && <ShieldCheck size={12} className="ml-1.5 inline text-brand-600" />}
                          </p>
                          <p className="truncate text-xs text-slate-500">{row.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <select
                        value={row.role}
                        disabled={savingId === row.id}
                        onChange={(e) => changeRole(row, e.target.value as Role)}
                        className="input w-auto capitalize"
                        aria-label={`Role for ${row.email}`}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r} className="normal-case">
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        value={row.plan}
                        disabled={savingId === row.id}
                        onChange={(e) => changePlan(row, e.target.value as Plan)}
                        className="input w-auto"
                        aria-label={`Plan for ${row.email}`}
                      >
                        {PLANS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {row.subscription ? (
                        <span className="inline-flex items-center gap-2">
                          <StatusPill tone={statusTone[row.subscription.status] ?? 'slate'}>
                            {row.subscription.status}
                          </StatusPill>
                          {row.subscription.plan && (
                            <span className="text-xs text-slate-500">{row.subscription.plan}</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="text-xs text-slate-600">{row.organizationName ?? '—'}</td>
                    <td className="whitespace-nowrap text-xs text-slate-500">
                      {row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleString() : '—'}
                    </td>
                    <td className="text-right">
                      {savingId === row.id ? (
                        <Loader2 size={15} className="ml-auto animate-spin text-brand-600" />
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleStatus(row)}
                          className={cx(
                            'rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors',
                            row.isActive
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100',
                          )}
                        >
                          {row.isActive ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableWrap>

        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
          <p className="text-xs text-slate-400">{total.toLocaleString()} users</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={offset === 0}
              onClick={() => resetAndLoad({ offset: Math.max(0, offset - PAGE_SIZE) })}
              className="btn-ghost btn-sm"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <button
              type="button"
              disabled={offset + PAGE_SIZE >= total}
              onClick={() => resetAndLoad({ offset: offset + PAGE_SIZE })}
              className="btn-ghost btn-sm"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
