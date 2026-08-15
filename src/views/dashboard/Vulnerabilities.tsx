import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Radio, ShieldCheck, Play } from 'lucide-react'
import { EmptyState, PageHeader, SectionCard, SeverityBadge, StatCard, StatusPill, TableWrap } from '@/components/ui'
import SortableCardGrid from '@/components/dashboard/SortableCards'
import { api, ApiError } from '@/lib/api'
import { pollWhenVisible } from '@/lib/usePolling'
import type { AgentJob, AgentRecord, Severity, VulnRecord } from '@/lib/types'

function online(a: AgentRecord): boolean {
  return a.lastSeenAt ? Date.now() - new Date(a.lastSeenAt).getTime() < 30000 : false
}

export default function Vulnerabilities() {
  const [agents, setAgents] = useState<AgentRecord[]>([])
  const [vulns, setVulns] = useState<VulnRecord[]>([])
  const [jobs, setJobs] = useState<AgentJob[]>([])
  const [loading, setLoading] = useState(true)
  const [targets, setTargets] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      const [a, v, j] = await Promise.all([
        api.get<AgentRecord[]>('/agents'),
        api.get<VulnRecord[]>('/vulnerabilities'),
        api.get<AgentJob[]>('/agents/jobs'),
      ])
      setAgents(a)
      setVulns(v)
      setJobs(j)
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

  async function scan(agent: AgentRecord) {
    const target = (targets[agent.id] || agent.lastIp || '127.0.0.1').trim()
    setError(null)
    try {
      await api.post(`/agents/${agent.id}/jobs`, { kind: 'scan', params: { target } })
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not queue the scan.')
    }
  }

  const scanning = (agentId: string) =>
    jobs.some((j) => j.agentId === agentId && j.kind === 'scan' && (j.status === 'pending' || j.status === 'running'))

  async function setStatus(id: string, status: string) {
    setVulns((vs) => vs.map((v) => (v.id === id ? { ...v, status } : v)))
    try { await api.patch(`/vulnerabilities/${id}`, { status }) } catch { /* revert on next poll */ }
  }

  const bySev = (s: string) => vulns.filter((v) => v.severity === s).length

  return (
    <div className="space-y-6">
      <PageHeader icon={ShieldCheck} title="Vulnerability Scanner" subtitle="Pick a connected host and scan it, or scan any IP on its network. No commands to re-run, the agent does it." />

      <SortableCardGrid pageKey="vulnerabilities" cols="sm:grid-cols-2 lg:grid-cols-4" cards={[
        { id: 'findings', label: 'Findings', node: <StatCard label="Findings" value={vulns.length} sub="Across all scans" icon={ShieldCheck} /> },
        { id: 'crit', label: 'Critical / High', node: <StatCard label="Critical / High" value={bySev('critical') + bySev('high')} sub="Fix first" icon={ShieldCheck} tone="red" /> },
        { id: 'medium', label: 'Medium', node: <StatCard label="Medium" value={bySev('medium')} sub="Review" icon={ShieldCheck} tone="amber" /> },
        { id: 'agents', label: 'Agents', node: <StatCard label="Agents" value={agents.length} sub="Can run scans" icon={Radio} /> },
      ]} />

      {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      <SectionCard title="Hosts" description="Connected agents. Scan the host itself or any IP on its LAN.">
        {loading && agents.length === 0 ? (
          <div className="grid place-items-center py-10 text-slate-400"><Loader2 size={20} className="animate-spin" /></div>
        ) : agents.length === 0 ? (
          <div className="p-5 text-sm text-slate-600">
            <p className="font-semibold text-slate-800">No agents yet.</p>
            <p className="mt-1">Set up a host once on the <Link to="/dashboard/agents" className="font-semibold text-brand-700 hover:text-brand-900">Agents page</Link>, then it appears here to scan by clicking.</p>
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
                  <p className="text-xs text-slate-500">{a.lastIp ?? '—'} · {a.capabilities.join(', ')}</p>
                </div>
                <input
                  className="input h-9 w-44 py-1 font-mono text-xs"
                  placeholder={a.lastIp ?? 'target IP'}
                  value={targets[a.id] ?? ''}
                  onChange={(e) => setTargets((t) => ({ ...t, [a.id]: e.target.value }))}
                />
                <button type="button" className="btn-primary btn-sm" onClick={() => scan(a)} disabled={scanning(a.id)}>
                  {scanning(a.id) ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                  {scanning(a.id) ? 'Scanning…' : 'Scan'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {vulns.length > 0 ? (
        <SectionCard title="Findings" description={`${vulns.length}, most severe first`}>
          <TableWrap>
            <table className="table-base">
              <thead><tr><th>Target</th><th>Port</th><th>Service</th><th>Severity</th><th>Finding</th><th>Status</th></tr></thead>
              <tbody>
                {vulns.map((v) => (
                  <tr key={v.id} className={v.status !== 'open' ? 'opacity-60' : ''}>
                    <td className="font-mono text-[13px] font-semibold text-slate-800">{v.target}</td>
                    <td className="tabular-nums text-slate-500">{v.port ?? '—'}</td>
                    <td className="text-slate-600">{v.service ?? '—'}</td>
                    <td><SeverityBadge severity={v.severity as Severity} /></td>
                    <td className="max-w-xs text-slate-700">{v.detail || v.title}<span className="mt-0.5 block text-xs text-brand-700">{v.fix}</span></td>
                    <td>
                      <div className="flex gap-1">
                        {['open', 'fixed', 'accepted'].map((s) => (
                          <button key={s} type="button" onClick={() => setStatus(v.id, s)} className={`rounded px-1.5 py-0.5 text-[10px] font-semibold capitalize ${v.status === s ? (s === 'open' ? 'bg-red-100 text-red-700' : s === 'fixed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700') : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>{s}</button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </SectionCard>
      ) : (
        !loading && agents.length > 0 && <SectionCard><EmptyState icon={ShieldCheck} title="No findings yet" message="Click Scan on a host above. Results appear here in a few seconds." /></SectionCard>
      )}
    </div>
  )
}
