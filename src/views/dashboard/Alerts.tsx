import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCheck, FolderPlus, Loader2, Siren, Timer } from 'lucide-react'
import { EmptyState, PageHeader, SectionCard, SeverityBadge, StatCard, StatusPill, TableWrap, cx } from '@/components/ui'
import SortableCardGrid from '@/components/dashboard/SortableCards'
import { api, ApiError } from '@/lib/api'
import { pollWhenVisible } from '@/lib/usePolling'
import type { AlertCounts, AlertRecord } from '@/lib/types'

const STATUSES = ['new', 'acknowledged', 'assigned', 'snoozed', 'resolved'] as const
const SEVERITIES = ['critical', 'high', 'medium', 'low', 'info'] as const

const statusTone: Record<AlertRecord['status'], 'red' | 'amber' | 'blue' | 'slate' | 'green'> = {
  new: 'red',
  acknowledged: 'amber',
  assigned: 'blue',
  snoozed: 'slate',
  resolved: 'green',
}

const slaMinutes: Record<string, number> = { critical: 15, high: 30, medium: 60, low: 120, info: 180 }

function timeAgo(iso: string | null): string {
  if (!iso) return '—'
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60) return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

function slaState(alert: AlertRecord): { label: string; tone: 'green' | 'amber' | 'red' | 'slate' } {
  if (alert.status === 'resolved') return { label: 'resolved', tone: 'green' }
  if (alert.slaDueAt) {
    const mins = (new Date(alert.slaDueAt).getTime() - Date.now()) / 60000
    const budget = slaMinutes[alert.severity] ?? 60
    if (mins < 0) return { label: `overdue by ${Math.abs(Math.floor(mins))}m`, tone: 'red' }
    if (mins <= budget * 0.5) return { label: `${Math.ceil(mins)}m left`, tone: 'amber' }
    return { label: `${Math.ceil(mins)}m left`, tone: 'green' }
  }
  return { label: `SLA ${slaMinutes[alert.severity] ?? 60}m`, tone: 'slate' }
}

export default function Alerts() {
  const [items, setItems] = useState<AlertRecord[]>([])
  const [counts, setCounts] = useState<AlertCounts | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [severityFilter, setSeverityFilter] = useState<string>('')
  const [selected, setSelected] = useState<AlertRecord | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function loadCounts() {
    try {
      setCounts(await api.get<AlertCounts>('/alerts/counts'))
    } catch {
      /* keep */
    }
  }

  async function load() {
    try {
      const params = new URLSearchParams({ limit: '200' })
      if (statusFilter) params.set('status', statusFilter)
      if (severityFilter) params.set('severity', severityFilter)
      const res = await api.get<{ items: AlertRecord[]; total: number }>(`/alerts?${params}`)
      setItems(res.items)
      setSelected((s) => (s ? res.items.find((i) => i.id === s.id) ?? res.items[0] ?? null : res.items[0] ?? null))
      setError(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load alerts.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    loadCounts()
    const stop = pollWhenVisible(() => { load(); loadCounts() }, 20000)
    return () => stop()
  }, [statusFilter, severityFilter])

  async function patch(alert: AlertRecord, body: Record<string, unknown>) {
    try {
      const updated = await api.patch<AlertRecord>(`/alerts/${alert.id}`, body)
      setItems((rs) => rs.map((a) => (a.id === updated.id ? updated : a)))
      setSelected((s) => (s?.id === updated.id ? updated : s))
      loadCounts()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Update failed.')
    }
  }

  async function promote(alert: AlertRecord) {
    try {
      await api.post<{ id: string }>('/incidents', {
        title: `Alert: ${alert.title}`,
        severity: alert.severity,
        summary: alert.description || alert.title,
        alertIds: [alert.id],
      })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not open an incident.')
    }
  }

  const openCount = useMemo(() => items.filter((a) => a.status !== 'resolved').length, [items])
  const overdue = useMemo(
    () => items.filter((a) => a.status !== 'resolved' && a.slaDueAt && new Date(a.slaDueAt).getTime() < Date.now()).length,
    [items],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Siren}
        title="Alert Center"
        subtitle="Detections with a full lifecycle — acknowledge, assign, snooze, resolve — and an SLA per severity."
        actions={<Link to="/dashboard/alerts/integrations" className="btn-soft btn-sm">Integrations</Link>}
      />

      <SortableCardGrid pageKey="alerts" cols="sm:grid-cols-2 lg:grid-cols-4" cards={[
        { id: 'open', label: 'Open', node: <StatCard label="Open" value={counts?.open ?? openCount} sub="new + acknowledged + assigned + snoozed" icon={Siren} tone="red" /> },
        { id: 'overdue', label: 'Overdue', node: <StatCard label="Overdue" value={counts?.overdue ?? overdue} sub="Past the SLA due time" icon={Timer} tone="amber" /> },
        { id: 'resolved', label: 'Resolved 24h', node: <StatCard label="Resolved 24h" value={counts?.resolved24h ?? 0} sub="Closed in the last day" icon={CheckCheck} tone="green" /> },
        { id: 'rules', label: 'Active rules', node: <StatCard label="Active rules" value={counts?.new ?? 0} sub="Brand-new detections" icon={AlertTriangle} tone="blue" /> },
      ]} />

      {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      <SectionCard
        title="Alerts"
        description={loading ? 'loading…' : `${items.length} shown`}
        right={
          <div className="flex flex-wrap items-center gap-1.5">
            <select className="input h-8 w-auto py-1 text-xs" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">all statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="input h-8 w-auto py-1 text-xs" value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
              <option value="">all severities</option>
              {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        }
      >
        {loading && items.length === 0 ? (
          <div className="grid place-items-center py-20 text-slate-400"><Loader2 size={22} className="animate-spin" /></div>
        ) : items.length === 0 ? (
          <EmptyState icon={Siren} title="No alerts" message="Nothing matched your filters. Resolved alerts are kept for reference." />
        ) : (
          <div className="grid gap-6 p-4 lg:grid-cols-[420px_1fr]">
            <TableWrap>
              <table className="table-base">
                <thead>
                  <tr><th>Alert</th><th>Status</th><th>SLA</th><th>Events</th></tr>
                </thead>
                <tbody>
                  {items.map((a) => {
                    const sla = slaState(a)
                    return (
                      <tr
                        key={a.id}
                        onClick={() => setSelected(a)}
                        className={cx('cursor-pointer', selected?.id === a.id && 'bg-brand-50')}
                      >
                        <td>
                          <div className="flex items-center gap-2">
                            <SeverityBadge severity={a.severity} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">{a.title}</p>
                              <p className="truncate text-xs text-slate-500">{a.ruleId ? `rule ${a.ruleId.slice(0, 8)}` : 'correlation'} · {timeAgo(a.lastSeenAt)}</p>
                            </div>
                          </div>
                        </td>
                        <td><StatusPill tone={statusTone[a.status]}>{a.status}</StatusPill></td>
                        <td><StatusPill tone={sla.tone}>{sla.label}</StatusPill></td>
                        <td className="tabular-nums text-slate-600">{a.eventCount}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </TableWrap>

            {selected && (
              <div className="space-y-6">
                <SectionCard>
                  <div className="border-b border-slate-100 p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <SeverityBadge severity={selected.severity} />
                      <StatusPill tone={statusTone[selected.status]}>{selected.status}</StatusPill>
                      {selected.isFalsePositive && <StatusPill tone="slate">false positive</StatusPill>}
                    </div>
                    <h2 className="mt-2 text-lg font-bold text-slate-900">{selected.title}</h2>
                    {selected.description && <p className="mt-1 text-sm text-slate-600">{selected.description}</p>}

                    <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                      {[
                        ['First seen', new Date(selected.firstSeenAt).toLocaleString()],
                        ['Last seen', new Date(selected.lastSeenAt).toLocaleString()],
                        ['Assignee', selected.assignee ?? 'unassigned'],
                        ['SLA due', selected.slaDueAt ? new Date(selected.slaDueAt).toLocaleString() : '—'],
                        ['Events', String(selected.eventCount)],
                        ['Resolved', selected.resolvedAt ? new Date(selected.resolvedAt).toLocaleString() : '—'],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{k}</dt>
                          <dd className="mt-0.5 break-words text-sm font-semibold text-slate-800">{v}</dd>
                        </div>
                      ))}
                    </dl>

                    {selected.snoozedUntil && (
                      <p className="mt-3 rounded-md bg-slate-100 px-3 py-1.5 text-xs text-slate-600">
                        Snoozed until {new Date(selected.snoozedUntil).toLocaleString()}.
                      </p>
                    )}
                    {selected.resolutionNote && (
                      <p className="mt-3 rounded-md bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700">
                        Resolution: {selected.resolutionNote}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 p-5">
                    <button
                      type="button"
                      className="btn-soft btn-sm"
                      onClick={() => patch(selected, { status: 'acknowledged' })}
                      disabled={selected.status === 'acknowledged' || selected.status === 'resolved'}
                    >
                      Acknowledge
                    </button>
                    <input
                      className="input h-8 w-40 py-1 text-xs"
                      placeholder="assign to…"
                      defaultValue={selected.assignee ?? ''}
                      onBlur={(e) => e.target.value.trim() && e.target.value !== selected.assignee && patch(selected, { status: 'assigned', assignee: e.target.value.trim() })}
                    />
                    <select
                      className="input h-8 w-auto py-1 text-xs"
                      defaultValue=""
                      onChange={(e) => e.target.value && patch(selected, { snoozeMinutes: Number(e.target.value) })}
                    >
                      <option value="">snooze…</option>
                      <option value="60">1 hour</option>
                      <option value="1440">24 hours</option>
                      <option value="10080">1 week</option>
                    </select>
                    <button
                      type="button"
                      className="btn-ghost btn-sm"
                      onClick={() => { const note = window.prompt('Resolution note (optional)') ?? ''; patch(selected, { status: 'resolved', resolutionNote: note || null }) }}
                      disabled={selected.status === 'resolved'}
                    >
                      <CheckCheck size={14} /> Resolve
                    </button>
                    <Link
                      to="/dashboard/incidents"
                      className="btn-primary btn-sm"
                      onClick={() => promote(selected)}
                      title="Open an incident from this alert"
                    >
                      <FolderPlus size={14} /> Promote to incident
                    </Link>
                  </div>
                </SectionCard>

                {selected.entities.length > 0 && (
                  <SectionCard title="Entities" description="Indicators and hosts involved">
                    <ul className="divide-y divide-slate-100">
                      {selected.entities.map((en, i) => (
                        <li key={i} className="flex items-center justify-between px-5 py-2.5 text-sm">
                          <span className="flex items-center gap-2">
                            <span className="chip bg-slate-100 uppercase text-slate-500">{en.type}</span>
                            <span className="font-mono text-slate-800">{en.value}</span>
                          </span>
                          {en.label && <span className="text-xs text-slate-400">{en.label}</span>}
                        </li>
                      ))}
                    </ul>
                  </SectionCard>
                )}
              </div>
            )}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
