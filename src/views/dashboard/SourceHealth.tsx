import { useEffect, useMemo, useState } from 'react'
import { Activity, AlertTriangle, Database, Gauge, Loader2, Radio, ShieldCheck } from 'lucide-react'
import { PageHeader, SectionCard, StatCard, StatusPill, TableWrap, EmptyState } from '@/components/ui'
import { api, ApiError } from '@/lib/api'
import { pollWhenVisible } from '@/lib/usePolling'
import type { DataSourceList, DataSourceRecord } from '@/lib/types'

const statusTone: Record<DataSourceRecord['status'], 'green' | 'amber' | 'red' | 'slate'> = {
  healthy: 'green',
  degraded: 'amber',
  offline: 'red',
  inactive: 'slate',
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'never'
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60) return 'just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

export default function SourceHealth() {
  const [sources, setSources] = useState<DataSourceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      const res = await api.get<DataSourceList>('/sources')
      setSources(res.items)
      setError(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load data sources.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const stop = pollWhenVisible(() => load(), 30000)
    return () => stop()
  }, [])

  async function toggle(row: DataSourceRecord) {
    setSources((rs) => rs.map((s) => (s.id === row.id ? { ...s, enabled: !s.enabled } : s)))
    try {
      await api.patch(`/sources/${row.id}`, { enabled: !row.enabled })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update the source.')
      load()
    }
  }

  const totals = useMemo(() => {
    const healthy = sources.filter((s) => s.status === 'healthy').length
    const degraded = sources.filter((s) => s.status === 'degraded').length
    const offline = sources.filter((s) => s.status === 'offline').length
    const eps = sources.reduce((sum, s) => sum + (s.eps || 0), 0)
    return { healthy, degraded, offline, eps }
  }, [sources])

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Activity}
        title="Data Source Health"
        subtitle="Every channel feeding events into your SIEM — sensors, NextDNS, uploads — and whether it is alive, degraded or silent."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Data sources" value={sources.length} sub="Registered with the platform" icon={Database} />
        <StatCard label="Healthy" value={totals.healthy} sub="Reporting within 5 minutes" icon={ShieldCheck} tone="green" />
        <StatCard label="Degraded" value={totals.degraded} sub="Quiet for up to an hour" icon={Gauge} tone="amber" />
        <StatCard label="Event rate" value={`${totals.eps.toFixed(2)}/s`} sub="Across all sources, last hour" icon={Radio} tone="blue" />
      </div>

      <SectionCard
        title="Sources"
        description={loading ? 'loading…' : `${sources.length} total · refreshed live every 30s`}
      >
        {error && <div className="px-5 py-3 text-sm text-red-700">{error}</div>}
        <TableWrap>
          <table className="table-base">
            <thead>
              <tr>
                <th>Source</th>
                <th>Status</th>
                <th>Events 24h</th>
                <th>Events 1h</th>
                <th>Rate</th>
                <th>Last event</th>
                <th>Enabled</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    <Loader2 size={18} className="mx-auto animate-spin" />
                  </td>
                </tr>
              ) : sources.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={Radio}
                      title="No data sources yet"
                      message="When a sensor, the NextDNS poller or a log upload first delivers events, its source appears here automatically."
                    />
                  </td>
                </tr>
              ) : (
                sources.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                          <Radio size={16} />
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900">{s.name}</p>
                          <p className="text-xs text-slate-500">{s.type}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <StatusPill tone={statusTone[s.status]}>{s.status}</StatusPill>
                      {s.lastError && (
                        <p className="mt-1 flex max-w-[200px] items-start gap-1 text-[11px] text-red-600">
                          <AlertTriangle size={11} className="mt-0.5 shrink-0" />
                          <span className="truncate" title={s.lastError}>{s.lastError}</span>
                        </p>
                      )}
                    </td>
                    <td className="tabular-nums text-slate-600">{s.events24h.toLocaleString()}</td>
                    <td className="tabular-nums text-slate-600">{s.events1h.toLocaleString()}</td>
                    <td className="font-mono text-[12px] text-slate-600">{s.eps.toFixed(2)}/s</td>
                    <td className="whitespace-nowrap text-slate-500">{timeAgo(s.lastEventAt)}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => toggle(s)}
                        className={`relative h-5 w-9 rounded-full transition-colors ${s.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        aria-label={`Toggle ${s.name}`}
                        title={s.enabled ? 'Disable source' : 'Enable source'}
                      >
                        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${s.enabled ? 'left-4.5' : 'left-0.5'}`} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableWrap>
      </SectionCard>
    </div>
  )
}
