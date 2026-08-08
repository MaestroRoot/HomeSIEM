import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, AlertTriangle, Bot, Clock, Cpu, FileText, Fingerprint, Globe2, Laptop, LayoutDashboard, Loader2, Pin, PinOff, Radio, ShieldAlert, ShieldCheck, Siren, Trash2 } from 'lucide-react'
import {
  Area,
  AreaChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PageHeader, SectionCard, StatCard, StatusPill, TableWrap, ConfirmModal, cx } from '@/components/ui'
import { api } from '@/lib/api'
import { pollWhenVisible } from '@/lib/usePolling'
import type { SecurityEventRow, StatsOverview, Verdict } from '@/lib/types'

const fmt = (n: number) => n.toLocaleString()

const verdictTone: Record<Verdict, 'red' | 'amber' | 'green' | 'slate'> = {
  malicious: 'red',
  suspicious: 'amber',
  clean: 'green',
  unknown: 'slate',
}

const VERDICT_COLORS: Record<string, string> = {
  malicious: '#dc2626',
  suspicious: '#f59e0b',
  clean: '#10b981',
  unknown: '#94a3b8',
}

const PIN_KEY = 'homesiem.overview.pinnedKpis'

export default function Overview() {
  const [stats, setStats] = useState<StatsOverview | null>(null)
  const [events, setEvents] = useState<SecurityEventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [wipeOpen, setWipeOpen] = useState(false)
  const [wiping, setWiping] = useState(false)
  const [wipeError, setWipeError] = useState<string | null>(null)
  const [pinned, setPinned] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(PIN_KEY)
      return raw ? (JSON.parse(raw) as string[]) : []
    } catch {
      return []
    }
  })

  function togglePin(id: string) {
    setPinned((p) => {
      const next = p.includes(id) ? p.filter((x) => x !== id) : [...p, id]
      try {
        localStorage.setItem(PIN_KEY, JSON.stringify(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }

  const load = useCallback(async () => {
    try {
      const [s, e] = await Promise.all([
        api.get<StatsOverview>('/stats/overview'),
        api.get<{ items: SecurityEventRow[] }>('/events?limit=12'),
      ])
      setStats(s)
      setEvents(e.items)
    } catch {
      /* keep last state */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const stop = pollWhenVisible(load, 20000)
    return () => stop()
  }, [load])

  async function handleWipe() {
    setWiping(true)
    setWipeError(null)
    try {
      await api.del('/organization/data')
      setWipeOpen(false)
      setStats(null)
      setEvents([])
      setLoading(true)
      load()
    } catch (error) {
      setWipeError(error instanceof Error ? error.message : 'Something went wrong.')
    } finally {
      setWiping(false)
    }
  }

  const verdictPie = stats
    ? (['malicious', 'suspicious', 'clean', 'unknown'] as const)
        .map((k) => ({ name: k, value: stats.byVerdict[k] }))
        .filter((d) => d.value > 0)
    : []

  const kpis = useMemo(() => {
    const eventsSpark = stats?.overTime.map((o) => o.events)
    const flaggedSpark = stats?.overTime.map((o) => o.flagged)
    return [
      { id: 'total', node: <StatCard label="Total events" value={fmt(stats?.totalEvents ?? 0)} sub="All time" icon={Activity} spark={eventsSpark} /> },
      { id: 'last24', node: <StatCard label="Last 24 hours" value={fmt(stats?.events24h ?? 0)} sub="Recent activity" icon={Activity} tone="green" spark={eventsSpark} /> },
      { id: 'flagged', node: <StatCard label="Flagged" value={fmt(stats?.flagged ?? 0)} sub="Suspicious or worse" icon={ShieldAlert} tone="red" spark={flaggedSpark} /> },
      { id: 'devices', node: <StatCard label="Devices" value={`${stats?.activeDevices ?? 0}/${stats?.totalDevices ?? 0}`} sub="Active / total" icon={Laptop} /> },
      { id: 'domains', node: <StatCard label="Unique domains" value={fmt(stats?.uniqueDomains ?? 0)} sub="Looked up" icon={Globe2} /> },
      { id: 'extips', node: <StatCard label="External IPs" value={fmt(stats?.uniqueExternalIps ?? 0)} sub="Contacted" icon={Globe2} /> },
      { id: 'clean', node: <StatCard label="Clean" value={fmt(stats?.byVerdict.clean ?? 0)} sub="On allow-lists" icon={Activity} tone="green" /> },
      { id: 'suspicious', node: <StatCard label="Suspicious" value={fmt(stats?.byVerdict.suspicious ?? 0)} sub="Need review" icon={AlertTriangle} tone="amber" /> },
    ]
  }, [stats])

  const orderedKpis = useMemo(() => {
    const pinnedFirst = pinned.map((id) => kpis.find((k) => k.id === id)).filter((k): k is (typeof kpis)[number] => Boolean(k))
    const rest = kpis.filter((k) => !pinned.includes(k.id))
    return [...pinnedFirst, ...rest]
  }, [kpis, pinned])

  return (
    <div className="space-y-6">
      <PageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        subtitle="Live view of what your collectors are seeing, enriched with GeoIP and threat intelligence."
        actions={
          <>
            <button
              type="button"
              onClick={() => setWipeOpen(true)}
              className="btn-danger btn-sm whitespace-nowrap"
            >
              <Trash2 size={14} /> Delete all
            </button>
            <div className="grid grid-cols-4 gap-2">
              {[
                { to: '/dashboard/agents', label: 'Run a scan', icon: Cpu },
              { to: '/dashboard/score', label: 'Score', icon: ShieldCheck },
              { to: '/dashboard/reports', label: 'Report', icon: FileText },
              { to: '/dashboard/ioc', label: 'Check IOC', icon: Fingerprint },
              { to: '/dashboard/devices', label: 'Devices', icon: Laptop },
              { to: '/dashboard/timeline', label: 'Timeline', icon: Clock },
              { to: '/dashboard/assistant', label: 'Assistant', icon: Bot },
              { to: '/dashboard/alerts', label: 'Alerts', icon: Siren },
            ].map((a) => (
              <Link key={a.to} to={a.to} className="btn-ghost btn-sm justify-start whitespace-nowrap">
                <a.icon size={14} /> {a.label}
              </Link>
            ))}
            </div>
          </>
        }
      />

      {loading && !stats ? (
        <div className="grid place-items-center py-20 text-slate-400">
          <Loader2 size={22} className="animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {orderedKpis.map((k) => {
              const isPinned = pinned.includes(k.id)
              return (
                <div key={k.id} className="group/kpi relative">
                  {k.node}
                  <button
                    type="button"
                    onClick={() => togglePin(k.id)}
                    title={isPinned ? 'Unpin' : 'Pin to top'}
                    className={cx(
                      'absolute bottom-2 right-2 grid h-6 w-6 place-items-center rounded-md transition-opacity',
                      isPinned ? 'text-brand-600 opacity-100' : 'text-slate-300 opacity-0 hover:text-slate-500 group-hover/kpi:opacity-100',
                    )}
                  >
                    {isPinned ? <Pin size={13} className="fill-current" /> : <PinOff size={13} />}
                  </button>
                </div>
              )
            })}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <SectionCard title="Events over time" description="Per hour, last 24 hours" className="lg:col-span-2">
              <div className="h-72 p-4">
                {stats && stats.overTime.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.overTime} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gEvents" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="t" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Area type="monotone" dataKey="events" name="Events" stroke="#2563eb" strokeWidth={2} fill="url(#gEvents)" />
                      <Area type="monotone" dataKey="flagged" name="Flagged" stroke="#f97316" strokeWidth={2} fill="transparent" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart />
                )}
              </div>
            </SectionCard>

            <SectionCard title="Verdict distribution" description="Share of all events">
              <div className="h-72 p-4">
                {verdictPie.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={verdictPie} dataKey="value" nameKey="name" innerRadius={52} outerRadius={86} paddingAngle={2}>
                        {verdictPie.map((d) => (
                          <Cell key={d.name} fill={VERDICT_COLORS[d.name]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart />
                )}
              </div>
            </SectionCard>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard title="Top domains" description="Most looked-up destinations">
              {stats && stats.topDomains.length > 0 ? (
                <ul className="divide-y divide-slate-100">
                  {stats.topDomains.slice(0, 8).map((d) => (
                    <li key={d.name} className="flex items-center justify-between gap-2 px-5 py-2.5">
                      <span className="truncate font-mono text-[13px] text-slate-700">{d.name}</span>
                      <span className="flex items-center gap-2">
                        {d.flagged && <StatusPill tone="amber">flagged</StatusPill>}
                        <span className="tabular-nums text-sm font-semibold text-slate-500">{d.count}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyRow />
              )}
            </SectionCard>

            <SectionCard title="Suspicious indicators" description="Flagged by threat intelligence">
              {stats && stats.suspicious.length > 0 ? (
                <ul className="divide-y divide-slate-100">
                  {stats.suspicious.map((ip) => (
                    <li key={ip.indicator} className="px-5 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-mono text-[13px] font-semibold text-slate-800">{ip.indicator}</span>
                        <StatusPill tone={verdictTone[ip.verdict]}>{ip.verdict}</StatusPill>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {[ip.country, `${ip.pulseCount} reports`, `seen ${ip.count}×`].filter(Boolean).join(' · ')}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyRow message="Nothing flagged yet, that is the good case." />
              )}
            </SectionCard>
          </div>

          <SectionCard
            title="Recent activity"
            description="Latest events across your devices"
            right={
              <Link to="/dashboard/devices" className="btn-soft btn-sm">
                All events
              </Link>
            }
          >
            <TableWrap>
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Source</th>
                    <th>Domain / Destination</th>
                    <th>Verdict</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {events.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-400">
                        No events yet. Connect a sensor on the Devices page.
                      </td>
                    </tr>
                  ) : (
                    events.map((e) => (
                      <tr key={e.id}>
                        <td className="whitespace-nowrap text-slate-500">{new Date(e.createdAt).toLocaleTimeString()}</td>
                        <td className="font-mono text-[12px] text-slate-600">{e.deviceName ?? e.srcIp ?? '—'}</td>
                        <td className="max-w-xs truncate font-mono text-[12px] font-semibold text-slate-900">
                          {e.domain ?? e.dstIp ?? '—'}
                        </td>
                        <td>
                          <StatusPill tone={verdictTone[e.verdict]}>{e.verdict}</StatusPill>
                        </td>
                        <td className="whitespace-nowrap text-slate-500">
                          {[e.country, e.asnOrg].filter(Boolean).join(' · ') || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </TableWrap>
          </SectionCard>
        </>
      )}

      <ConfirmModal
        open={wipeOpen}
        title="Delete all SIEM data"
        confirmLabel="Delete everything"
        requireType="DELETE"
        busy={wiping}
        onConfirm={handleWipe}
        onClose={() => setWipeOpen(false)}
        message={
          <>
            <p>
              This will permanently delete <strong>all</strong> data of this workspace: events,
              devices, agents, scans, findings, detection rules, reports and settings.
            </p>
            <p>
              Your account and workspace stay, but every sensor must be re-registered before it can
              send data again.
            </p>
            <p className="font-semibold text-red-600">This action cannot be undone.</p>
            {wipeError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{wipeError}</p>}
          </>
        }
      />
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="grid h-full place-items-center text-center text-sm text-slate-400">
      <span>
        <Radio size={20} className="mx-auto mb-2 text-slate-300" />
        No data yet
      </span>
    </div>
  )
}

function EmptyRow({ message = 'No data yet.' }: { message?: string }) {
  return <div className={cx('px-5 py-8 text-center text-sm text-slate-400')}>{message}</div>
}
