import { useEffect, useMemo, useState } from 'react'
import { Calendar, Loader2, Network, Package, Play, ScanSearch, Search, Trash2 } from 'lucide-react'
import { EmptyState, PageHeader, SectionCard, StatCard, StatusPill, TableWrap } from '@/components/ui'
import { api, ApiError } from '@/lib/api'
import { pollWhenVisible } from '@/lib/usePolling'
import type { AgentJob, AgentRecord, DiscoverySchedule, MonitoredDevice, SoftwarePackage, StatsOverview } from '@/lib/types'

function agentOnline(a: AgentRecord): boolean {
  return a.lastSeenAt ? Date.now() - new Date(a.lastSeenAt).getTime() < 30000 : false
}

const FREQS: DiscoverySchedule['frequency'][] = ['hourly', 'daily', 'weekly']

export default function Inventory() {
  const [devices, setDevices] = useState<MonitoredDevice[]>([])
  const [stats, setStats] = useState<StatsOverview | null>(null)
  const [agents, setAgents] = useState<AgentRecord[]>([])
  const [schedules, setSchedules] = useState<DiscoverySchedule[]>([])
  const [software, setSoftware] = useState<SoftwarePackage[]>([])
  const [jobs, setJobs] = useState<AgentJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [agentId, setAgentId] = useState('')
  const [subnet, setSubnet] = useState('')
  const [freq, setFreq] = useState<DiscoverySchedule['frequency']>('daily')
  const [swQuery, setSwQuery] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    try {
      const [d, s, a, sc, sw, j] = await Promise.all([
        api.get<{ items: MonitoredDevice[] }>('/devices'),
        api.get<StatsOverview>('/stats/overview'),
        api.get<AgentRecord[]>('/agents'),
        api.get<DiscoverySchedule[]>('/discovery/schedules'),
        api.get<SoftwarePackage[]>('/software'),
        api.get<AgentJob[]>('/agents/jobs'),
      ])
      setDevices(d.items)
      setStats(s)
      setAgents(a)
      setSchedules(sc)
      setSoftware(sw)
      setJobs(j)
      setAgentId((cur) => cur || a.find(agentOnline)?.id || a[0]?.id || '')
    } catch {
      /* keep */
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
    const stop = pollWhenVisible(load, 20000)
    return () => stop()
  }, [])

  const discovering = jobs.some((j) => j.kind === 'discovery' && (j.status === 'pending' || j.status === 'running'))
  const enumeratingSw = jobs.some((j) => j.kind === 'software' && (j.status === 'pending' || j.status === 'running'))

  async function queue(kind: 'discovery' | 'software') {
    if (!agentId || busy) return
    setBusy(true)
    setError(null)
    try {
      const params = kind === 'discovery' && subnet.trim() ? { subnet: subnet.trim() } : {}
      await api.post(`/agents/${agentId}/jobs`, { kind, params })
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not queue the job.')
    } finally {
      setBusy(false)
    }
  }

  async function createSchedule() {
    if (!agentId || busy) return
    setBusy(true)
    setError(null)
    try {
      await api.post('/discovery/schedules', { agentId, subnet: subnet.trim(), frequency: freq })
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the schedule.')
    } finally {
      setBusy(false)
    }
  }

  async function deleteSchedule(id: string) {
    setSchedules((ss) => ss.filter((s) => s.id !== id))
    try {
      await api.del(`/discovery/schedules/${id}`)
    } catch {
      load()
    }
  }

  const agentName = (id: string) => agents.find((a) => a.id === id)?.hostname ?? 'agent'

  const swByHost = useMemo(() => {
    const q = swQuery.trim().toLowerCase()
    const filtered = q
      ? software.filter((p) => p.name.toLowerCase().includes(q) || p.publisher.toLowerCase().includes(q) || p.host.toLowerCase().includes(q))
      : software
    const groups = new Map<string, SoftwarePackage[]>()
    for (const p of filtered) {
      const arr = groups.get(p.host) ?? []
      arr.push(p)
      groups.set(p.host, arr)
    }
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [software, swQuery])

  const noAgents = agents.length === 0

  return (
    <div className="space-y-6">
      <PageHeader icon={Network} title="Network Inventory" subtitle="Every device seen on your network, the software they run, and every external destination they reached." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Devices" value={devices.length} sub="Discovered + registered" icon={Network} />
        <StatCard label="Software packages" value={software.length} sub={`${swByHost.length} host(s)`} icon={Package} />
        <StatCard label="External IPs" value={stats?.uniqueExternalIps ?? 0} sub="Distinct destinations" icon={Network} />
        <StatCard label="Domains" value={stats?.uniqueDomains ?? 0} sub="Looked up" icon={Network} />
      </div>

      {/* --- Discovery --- */}
      <SectionCard title="Network discovery" description="Actively sweep a subnet to find devices, and schedule it to run on its own">
        <div className="p-5">
          {noAgents ? (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <ScanSearch size={16} className="mt-0.5 shrink-0" />
              <span>No agent enrolled yet. Install the agent on a host (see the Agents page) and it will be able to sweep your network and collect software.</span>
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="label">Agent</label>
                  <select className="input" value={agentId} onChange={(e) => setAgentId(e.target.value)}>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.hostname} {agentOnline(a) ? '· online' : '· offline'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Subnet (optional)</label>
                  <input className="input" placeholder="auto-detect · e.g. 192.168.1.0/24" value={subnet} onChange={(e) => setSubnet(e.target.value)} />
                </div>
                <div>
                  <label className="label">Schedule every</label>
                  <select className="input" value={freq} onChange={(e) => setFreq(e.target.value as DiscoverySchedule['frequency'])}>
                    {FREQS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <button type="button" className="btn-primary flex-1" onClick={() => queue('discovery')} disabled={busy || !agentId}>
                    {discovering ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />} {discovering ? 'Scanning…' : 'Run now'}
                  </button>
                  <button type="button" className="btn-soft" onClick={createSchedule} disabled={busy || !agentId} title="Save a recurring discovery schedule">
                    <Calendar size={15} />
                  </button>
                </div>
              </div>
              {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button type="button" className="btn-ghost btn-sm" onClick={() => queue('software')} disabled={busy || !agentId}>
                  {enumeratingSw ? <Loader2 size={14} className="animate-spin" /> : <Package size={14} />} Collect software from {agentName(agentId)}
                </button>
              </div>

              {schedules.length > 0 && (
                <div className="mt-4 rounded-xl border border-slate-200">
                  <div className="border-b border-slate-100 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Scheduled sweeps</div>
                  <ul className="divide-y divide-slate-100">
                    {schedules.map((s) => (
                      <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-800">{agentName(s.agentId)}</span>
                          <span className="ml-2 font-mono text-xs text-slate-500">{s.subnet || 'auto-detect'}</span>
                          <span className="ml-2 text-xs text-slate-400">· every {s.frequency}</span>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className="text-xs text-slate-400">next {new Date(s.nextRunAt).toLocaleString()}</span>
                          <button type="button" onClick={() => deleteSchedule(s.id)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete schedule">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </SectionCard>

      {loading && devices.length === 0 ? (
        <div className="grid place-items-center py-20 text-slate-400"><Loader2 size={22} className="animate-spin" /></div>
      ) : (
        <>
          <SectionCard title="Devices on the network" description={`${devices.length} seen`}>
            {devices.length === 0 ? (
              <EmptyState icon={Network} title="No devices discovered" message="Run a discovery sweep above, or connect a sensor and devices show up here as they are seen." />
            ) : (
              <TableWrap>
                <table className="table-base">
                  <thead><tr><th>Name</th><th>MAC</th><th>IP</th><th>Events</th><th>Risk</th><th>Status</th></tr></thead>
                  <tbody>
                    {devices.map((d) => (
                      <tr key={d.id}>
                        <td className="font-semibold text-slate-900">{d.name}{d.discovered && <span className="ml-1.5 text-[10px] text-amber-600">discovered</span>}</td>
                        <td className="font-mono text-[12px] text-slate-500">{d.mac ?? '—'}</td>
                        <td className="font-mono text-[12px]">{d.lastIp ?? '—'}</td>
                        <td className="tabular-nums">{d.eventsCount}</td>
                        <td className="tabular-nums">{d.riskScore}</td>
                        <td><StatusPill tone={d.status === 'active' ? 'green' : 'slate'}>{d.status}</StatusPill></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            )}
          </SectionCard>

          {/* --- Software inventory --- */}
          <SectionCard
            title="Software inventory"
            description={software.length ? `${software.length} package(s) across ${swByHost.length} host(s)` : 'Installed software collected from your agents'}
            right={
              software.length > 0 ? (
                <div className="relative">
                  <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input className="input h-8 w-48 pl-8 text-sm" placeholder="Filter software…" value={swQuery} onChange={(e) => setSwQuery(e.target.value)} />
                </div>
              ) : undefined
            }
          >
            {software.length === 0 ? (
              <EmptyState icon={Package} title="No software collected yet" message="Click “Collect software” above to pull the list of installed programs from an agent. Handy for spotting outdated or risky apps." />
            ) : swByHost.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-400">Nothing matches “{swQuery}”.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {swByHost.map(([host, pkgs]) => (
                  <div key={host}>
                    <div className="flex items-center justify-between bg-slate-50/70 px-5 py-2">
                      <span className="font-mono text-sm font-semibold text-slate-700">{host}</span>
                      <span className="text-xs text-slate-400">{pkgs.length} package(s)</span>
                    </div>
                    <TableWrap>
                      <table className="table-base">
                        <thead><tr><th>Program</th><th>Version</th><th>Publisher</th></tr></thead>
                        <tbody>
                          {pkgs.map((p) => (
                            <tr key={p.id}>
                              <td className="font-medium text-slate-800">{p.name}</td>
                              <td className="font-mono text-[12px] text-slate-500">{p.version || '—'}</td>
                              <td className="text-slate-500">{p.publisher || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </TableWrap>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Observed destinations" description="Domains contacted, most frequent first">
            {stats && stats.topDomains.length > 0 ? (
              <TableWrap>
                <table className="table-base">
                  <thead><tr><th>Destination</th><th>Lookups</th><th>Status</th></tr></thead>
                  <tbody>
                    {stats.topDomains.map((d) => (
                      <tr key={d.name}>
                        <td className="font-mono text-[13px] text-slate-800">{d.name}</td>
                        <td className="tabular-nums">{d.count}</td>
                        <td>{d.flagged ? <StatusPill tone="amber">flagged</StatusPill> : <StatusPill tone="green">ok</StatusPill>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            ) : (
              <div className="px-5 py-8 text-center text-sm text-slate-400">No destinations observed yet.</div>
            )}
          </SectionCard>
        </>
      )}
    </div>
  )
}
