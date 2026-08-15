import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HardDrive, Loader2, Microscope, Play, Radio } from 'lucide-react'
import { PageHeader, SectionCard, StatCard, StatusPill, TableWrap } from '@/components/ui'
import SortableCardGrid from '@/components/dashboard/SortableCards'
import { api, ApiError } from '@/lib/api'
import { pollWhenVisible } from '@/lib/usePolling'
import type { AgentJob, AgentRecord, ForensicSnapshotRecord } from '@/lib/types'

function online(a: AgentRecord): boolean {
  return a.lastSeenAt ? Date.now() - new Date(a.lastSeenAt).getTime() < 30000 : false
}

export default function Forensics() {
  const [agents, setAgents] = useState<AgentRecord[]>([])
  const [snaps, setSnaps] = useState<ForensicSnapshotRecord[]>([])
  const [jobs, setJobs] = useState<AgentJob[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      const [a, s, j] = await Promise.all([
        api.get<AgentRecord[]>('/agents'),
        api.get<ForensicSnapshotRecord[]>('/forensics'),
        api.get<AgentJob[]>('/agents/jobs'),
      ])
      setAgents(a)
      setSnaps(s)
      setJobs(j)
      setSelected((cur) => cur ?? s[0]?.id ?? null)
    } catch {
      /* keep */
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
    const stop = pollWhenVisible(load, 8000)
    return () => stop()
  }, [])

  async function run(agent: AgentRecord) {
    setError(null)
    try {
      await api.post(`/agents/${agent.id}/jobs`, { kind: 'forensics', params: {} })
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not queue forensics.')
    }
  }
  async function runAll() {
    for (const a of agents) await run(a)
  }

  const running = (agentId: string) =>
    jobs.some((j) => j.agentId === agentId && j.kind === 'forensics' && (j.status === 'pending' || j.status === 'running'))

  const snap = snaps.find((s) => s.id === selected) ?? snaps[0] ?? null

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Microscope}
        title="Forensics"
        subtitle="Pick a connected host and capture a live snapshot of its processes and connections."
        actions={agents.length > 1 ? <button type="button" className="btn-soft btn-sm" onClick={runAll}><Play size={14} /> Run all</button> : undefined}
      />

      {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      <SectionCard title="Hosts" description="Connected agents. Click to capture a forensic snapshot.">
        {loading && agents.length === 0 ? (
          <div className="grid place-items-center py-10 text-slate-400"><Loader2 size={20} className="animate-spin" /></div>
        ) : agents.length === 0 ? (
          <div className="p-5 text-sm text-slate-600">
            <p className="font-semibold text-slate-800">No agents yet.</p>
            <p className="mt-1">Set up a host once on the <Link to="/dashboard/agents" className="font-semibold text-brand-700 hover:text-brand-900">Agents page</Link>, then it appears here to run forensics by clicking.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {agents.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{a.hostname}</p>
                    <StatusPill tone={online(a) ? 'green' : 'slate'}>{online(a) ? 'online' : 'offline'}</StatusPill>
                  </div>
                  <p className="text-xs text-slate-500">{a.lastIp ?? '—'}</p>
                </div>
                <button type="button" className="btn-primary btn-sm" onClick={() => run(a)} disabled={running(a.id)}>
                  {running(a.id) ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                  {running(a.id) ? 'Collecting…' : 'Run forensics'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {snap && (
        <>
          {snaps.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {snaps.map((s) => (
                <button key={s.id} type="button" onClick={() => setSelected(s.id)} className={selected === s.id ? 'rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white' : 'rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200'}>
                  {s.host} · {new Date(s.createdAt).toLocaleTimeString()}
                </button>
              ))}
            </div>
          )}

          <SortableCardGrid
            pageKey="forensics.kpis"
            cols="sm:grid-cols-4"
            maxCols={4}
            cards={[
              { id: 'host', label: 'Host', node: <StatCard label="Host" value={snap.host} sub="Snapshot" icon={Microscope} /> },
              { id: 'processes', label: 'Processes', node: <StatCard label="Processes" value={snap.processes.length} sub="Running" icon={Microscope} /> },
              { id: 'connections', label: 'Connections', node: <StatCard label="Connections" value={snap.connections.length} sub="Active" icon={Microscope} /> },
              { id: 'agents', label: 'Agents', node: <StatCard label="Agents" value={agents.length} sub="Connected" icon={Radio} /> },
            ]}
          />

          <SectionCard title="Network connections">
            <TableWrap>
              <table className="table-base">
                <thead><tr><th>Process</th><th>Local</th><th>Remote</th><th>State</th></tr></thead>
                <tbody>
                  {snap.connections.length === 0 ? (
                    <tr><td colSpan={4} className="px-5 py-6 text-center text-sm text-slate-400">No connections (some need admin).</td></tr>
                  ) : (
                    snap.connections.map((c, i) => (
                      <tr key={i}>
                        <td className="font-semibold text-slate-800">{c.process}</td>
                        <td className="font-mono text-[12px] text-slate-500">{c.local}</td>
                        <td className="font-mono text-[12px] font-semibold text-slate-900">{c.remote}</td>
                        <td className="text-slate-500">{c.state}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </TableWrap>
          </SectionCard>

          <SectionCard title="Processes" description={`${snap.processes.length} running`} right={<HardDrive size={16} className="text-slate-400" />}>
            <TableWrap>
              <table className="table-base">
                <thead><tr><th>PID</th><th>Name</th><th>User</th><th>Command</th></tr></thead>
                <tbody>
                  {snap.processes.slice(0, 120).map((p, i) => (
                    <tr key={i}>
                      <td className="tabular-nums text-slate-500">{p.pid}</td>
                      <td className="font-semibold text-slate-800">{p.name}</td>
                      <td className="text-slate-500">{p.user}</td>
                      <td className="max-w-md truncate font-mono text-[11px] text-slate-500">{p.cmd || p.exe}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </SectionCard>
        </>
      )}
    </div>
  )
}
