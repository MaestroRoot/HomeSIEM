import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Eye,
  Loader2,
  Minus,
  Shield,
  UserCheck,
} from 'lucide-react'
import { PageHeader, SectionCard, StatCard, StatusPill, TableWrap, cx } from '@/components/ui'
import { api, ApiError } from '@/lib/api'
import { pollWhenVisible } from '@/lib/usePolling'

type Tab = 'overview' | 'users' | 'anomalies'

interface UebaOverview {
  totalUsers: number
  monitoredUsers: number
  totalAnomaliesToday: number
  criticalUsers: number
  highUsers: number
  baselinesReady: number
  baselinesPending: number
}

interface UserRisk {
  ownerName: string
  currentScore: number
  previousScore: number
  trend: 'up' | 'down' | 'stable'
  openAnomalies: number
  totalAnomalies: number
  lastUpdatedAt: string | null
}

interface DeviceUser {
  ownerName: string
  deviceCount: number
  hasBaseline: boolean
  currentScore: number
  previousScore: number
  trend: 'up' | 'down' | 'stable'
  openAnomalies: number
  totalAnomalies: number
  lastUpdatedAt: string | null
}

interface Anomaly {
  id: string
  ownerName: string
  anomalyType: string
  severity: string
  riskScore: number
  description: string
  evidence: Record<string, unknown>
  status: string
  deviceName: string | null
  createdAt: string
}

const severityTone: Record<string, 'red' | 'amber' | 'green' | 'slate'> = {
  critical: 'red',
  high: 'red',
  medium: 'amber',
  low: 'green',
  info: 'slate',
}

function riskTone(score: number): 'green' | 'amber' | 'red' {
  if (score >= 70) return 'red'
  if (score >= 40) return 'amber'
  return 'green'
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'up') return <ArrowUp size={14} className="text-red-500" />
  if (trend === 'down') return <ArrowDown size={14} className="text-emerald-500" />
  return <Minus size={14} className="text-slate-400" />
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'never'
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60) return 'just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

const anomalyLabels: Record<string, string> = {
  unusual_hour: 'Unusual Hour',
  new_domain: 'New Domain',
  suspicious_domain: 'Suspicious Domain',
  data_spike: 'Data Spike',
  unusual_process: 'Unusual Process',
  new_connection: 'New Connection',
  alert_triggered: 'Alert Triggered',
  forensic_suspicious: 'Forensic Finding',
}

export default function Ueba() {
  const [tab, setTab] = useState<Tab>('overview')
  const [overview, setOverview] = useState<UebaOverview | null>(null)
  const [allUsers, setAllUsers] = useState<DeviceUser[]>([])
  const [users, setUsers] = useState<UserRisk[]>([])
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState<string | null>(null)

  async function loadOverview() {
    try {
      const res = await api.get<UebaOverview>('/ueba/overview')
      setOverview(res)
      setError(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load UEBA overview.')
    } finally {
      setLoading(false)
    }
  }

  async function loadAllUsers() {
    try {
      const res = await api.get<{ items: DeviceUser[] }>('/ueba/all-users')
      setAllUsers(res.items)
    } catch { /* keep */ }
  }

  async function loadUsers() {
    try {
      const res = await api.get<{ items: UserRisk[] }>('/ueba/users')
      setUsers(res.items)
    } catch { /* keep */ }
  }

  async function loadAnomalies() {
    try {
      const res = await api.get<{ items: Anomaly[] }>('/ueba/anomalies?limit=200')
      setAnomalies(res.items)
    } catch { /* keep */ }
  }

  useEffect(() => {
    loadOverview()
    loadAllUsers()
    loadUsers()
    loadAnomalies()
  }, [])

  useEffect(() => {
    const stop = pollWhenVisible(() => {
      if (tab === 'overview') { loadOverview(); loadAllUsers(); }
      if (tab === 'users') { loadAllUsers(); loadUsers(); }
      if (tab === 'anomalies') loadAnomalies()
    }, 30000)
    return () => stop()
  }, [tab])

  async function runAnalysis(ownerName: string) {
    setAnalyzing(ownerName)
    try {
      await api.post(`/ueba/analyze/${encodeURIComponent(ownerName)}`)
      await loadAllUsers()
      await loadUsers()
      await loadAnomalies()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Analysis failed.')
    } finally {
      setAnalyzing(null)
    }
  }

  const criticalUsers = useMemo(() => allUsers.filter((u) => u.hasBaseline && u.currentScore >= 70), [allUsers])
  const highUsers = useMemo(() => allUsers.filter((u) => u.hasBaseline && u.currentScore >= 40 && u.currentScore < 70), [allUsers])

  return (
    <div className="space-y-6">
      <PageHeader
        icon={UserCheck}
        title="User Behavior"
        subtitle="Track each user's normal activity and get alerted when something deviates. Detect compromised accounts, insider threats and unusual behavior."
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
        {(['overview', 'users', 'anomalies'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cx(
              'rounded-md px-4 py-2 text-sm font-semibold transition-colors',
              tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900',
            )}
          >
            {t === 'overview' ? 'Overview' : t === 'users' ? 'Users' : 'Anomalies'}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total users"
              value={overview?.totalUsers ?? 0}
              sub="With owner assigned"
              icon={UserCheck}
            />
            <StatCard
              label="Monitored"
              value={overview?.monitoredUsers ?? 0}
              sub="Baselines ready"
              icon={Shield}
              tone="green"
            />
            <StatCard
              label="Anomalies today"
              value={overview?.totalAnomaliesToday ?? 0}
              sub="Across all users"
              icon={AlertTriangle}
              tone="amber"
            />
            <StatCard
              label="Critical users"
              value={overview?.criticalUsers ?? 0}
              sub="Risk score 70+"
              icon={Activity}
              tone="red"
            />
          </div>

          {criticalUsers.length > 0 && (
            <SectionCard title="Critical Users" description="Users with risk score 70 or higher">
              <div className="space-y-3 p-5">
                {criticalUsers.map((u) => (
                  <div
                    key={u.ownerName}
                    className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-red-100 text-red-600">
                        <UserCheck size={18} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{u.ownerName}</p>
                        <p className="text-sm text-slate-500">
                          {u.openAnomalies} open anomalies
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={cx('text-2xl font-bold', riskTone(u.currentScore) === 'red' ? 'text-red-600' : riskTone(u.currentScore) === 'amber' ? 'text-amber-600' : 'text-emerald-600')}>
                          {u.currentScore}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <TrendIcon trend={u.trend} />
                          {u.trend}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => runAnalysis(u.ownerName)}
                        disabled={analyzing === u.ownerName}
                        className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {analyzing === u.ownerName ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {highUsers.length > 0 && (
            <SectionCard title="High Risk Users" description="Users with risk score 40-69">
              <div className="space-y-3 p-5">
                {highUsers.map((u) => (
                  <div
                    key={u.ownerName}
                    className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-amber-100 text-amber-600">
                        <UserCheck size={18} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{u.ownerName}</p>
                        <p className="text-sm text-slate-500">{u.openAnomalies} open anomalies</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-amber-600">{u.currentScore}</p>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <TrendIcon trend={u.trend} />
                          {u.trend}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => runAnalysis(u.ownerName)}
                        disabled={analyzing === u.ownerName}
                        className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                      >
                        {analyzing === u.ownerName ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {allUsers.length === 0 && !loading && (
            <SectionCard title="No users yet">
              <div className="px-5 py-10 text-center text-sm text-slate-400">
                <UserCheck size={32} className="mx-auto mb-3 text-slate-300" />
                <p>No users with assigned devices found.</p>
                <p className="mt-1">Go to Device Management and assign an owner to a device to get started.</p>
              </div>
            </SectionCard>
          )}
        </>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <SectionCard
          title="Device Users"
          description={loading ? 'Loading...' : `${allUsers.length} users tracked`}
        >
          <TableWrap>
            <table className="table-base">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Devices</th>
                  <th>Risk Score</th>
                  <th>Trend</th>
                  <th>Open Anomalies</th>
                  <th>Total Anomalies</th>
                  <th>Last Updated</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                      <Loader2 size={18} className="mx-auto animate-spin" />
                    </td>
                  </tr>
                ) : allUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-400">
                      No users with assigned devices yet. Go to Device Management and assign an owner to a device.
                    </td>
                  </tr>
                ) : (
                  allUsers.map((u) => (
                    <tr key={u.ownerName}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className={cx(
                            'grid h-8 w-8 shrink-0 place-items-center rounded-lg',
                            !u.hasBaseline ? 'bg-slate-100 text-slate-400' :
                            riskTone(u.currentScore) === 'red' ? 'bg-red-50 text-red-600' :
                            riskTone(u.currentScore) === 'amber' ? 'bg-amber-50 text-amber-600' :
                            'bg-emerald-50 text-emerald-600',
                          )}>
                            <UserCheck size={16} />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{u.ownerName}</p>
                            {!u.hasBaseline && <p className="text-xs text-slate-400">Not analyzed yet</p>}
                          </div>
                        </div>
                      </td>
                      <td className="tabular-nums">{u.deviceCount}</td>
                      <td>
                        <StatusPill tone={!u.hasBaseline ? 'slate' : riskTone(u.currentScore)}>
                          {u.hasBaseline ? u.currentScore : '—'}
                        </StatusPill>
                      </td>
                      <td>
                        {u.hasBaseline && (
                          <div className="flex items-center gap-1">
                            <TrendIcon trend={u.trend} />
                            <span className="text-xs text-slate-500">{u.trend}</span>
                          </div>
                        )}
                      </td>
                      <td className="tabular-nums">{u.hasBaseline ? u.openAnomalies : '—'}</td>
                      <td className="tabular-nums">{u.hasBaseline ? u.totalAnomalies : '—'}</td>
                      <td className="whitespace-nowrap text-slate-500">{u.hasBaseline ? timeAgo(u.lastUpdatedAt) : '—'}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => runAnalysis(u.ownerName)}
                          disabled={analyzing === u.ownerName}
                          className="rounded-md bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100 disabled:opacity-50"
                        >
                          {analyzing === u.ownerName ? <Loader2 size={12} className="animate-spin" /> : 'Analyze'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableWrap>
        </SectionCard>
      )}

      {/* Anomalies Tab */}
      {tab === 'anomalies' && (
        <SectionCard
          title="Anomalies"
          description={`${anomalies.length} total anomalies`}
        >
          <TableWrap>
            <table className="table-base">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Score</th>
                  <th>Description</th>
                  <th>Device</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {anomalies.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-400">
                      No anomalies detected yet. Run analysis on a user to start monitoring.
                    </td>
                  </tr>
                ) : (
                  anomalies.map((a) => (
                    <tr key={a.id}>
                      <td className="font-semibold text-slate-900">{a.ownerName}</td>
                      <td>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                          {anomalyLabels[a.anomalyType] ?? a.anomalyType}
                        </span>
                      </td>
                      <td>
                        <StatusPill tone={severityTone[a.severity] ?? 'slate'}>{a.severity}</StatusPill>
                      </td>
                      <td className="tabular-nums font-semibold">{a.riskScore}</td>
                      <td className="max-w-xs truncate text-sm text-slate-600">{a.description}</td>
                      <td className="text-sm text-slate-500">{a.deviceName ?? '-'}</td>
                      <td>
                        <StatusPill tone={a.status === 'open' ? 'amber' : 'green'}>{a.status}</StatusPill>
                      </td>
                      <td className="whitespace-nowrap text-slate-500">{timeAgo(a.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableWrap>
        </SectionCard>
      )}
    </div>
  )
}
