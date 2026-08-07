import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Play, Radio, Repeat, Square, Waves } from 'lucide-react'
import { PageHeader, SectionCard, StatCard, StatusPill, TableWrap } from '@/components/ui'
import { api } from '@/lib/api'
import { pollWhenVisible } from '@/lib/usePolling'
import type { AgentJob, AgentRecord, CollectionStream, SecurityEventRow, Verdict } from '@/lib/types'

const verdictTone: Record<Verdict, 'red' | 'amber' | 'green' | 'slate'> = {
  malicious: 'red',
  suspicious: 'amber',
  clean: 'green',
  unknown: 'slate',
}

function agentOnline(a: AgentRecord): boolean {
  return a.lastSeenAt ? Date.now() - new Date(a.lastSeenAt).getTime() < 30000 : false
}

export default function LiveCapture() {
  const [flows, setFlows] = useState<SecurityEventRow[]>([])
  const [agents, setAgents] = useState<AgentRecord[]>([])
  const [jobs, setJobs] = useState<AgentJob[]>([])
  const [ifaces, setIfaces] = useState<Record<string, string>>({})
  const [streams, setStreams] = useState<CollectionStream[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const [res, ag, jb, st] = await Promise.all([
          api.get<{ items: SecurityEventRow[] }>('/events?kind=flow&limit=200'),
          api.get<AgentRecord[]>('/agents'),
          api.get<AgentJob[]>('/agents/jobs'),
          api.get<CollectionStream[]>('/collection/streams'),
        ])
        if (!active) return
        setFlows(res.items)
        setAgents(ag)
        setJobs(jb)
        setStreams(st)
        // Kama stream ina iface iliyohifadhiwa, ionyeshe kwenye input.
        setIfaces((cur) => {
          const next = { ...cur }
          for (const s of st) {
            if (s.kind === 'capture' && !next[s.agentId] && typeof s.params.iface === 'string') {
              next[s.agentId] = s.params.iface
            }
          }
          return next
        })
      } catch {
        /* keep */
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    const stop = pollWhenVisible(load, 12000)
    return () => {
      active = false
      stop()
    }
  }, [])

  const autoStream = (id: string) => streams.find((s) => s.agentId === id && s.kind === 'capture' && s.enabled)

  async function capture(agent: AgentRecord) {
    const iface = (ifaces[agent.id] || '').trim()
    if (!iface) return
    await api.post(`/agents/${agent.id}/jobs`, { kind: 'capture', params: { iface, duration: 30 } })
    setJobs(await api.get<AgentJob[]>('/agents/jobs'))
  }
  const capturing = (id: string) =>
    jobs.some((j) => j.agentId === id && j.kind === 'capture' && (j.status === 'pending' || j.status === 'running'))

  // Auto mode ni server-side: inaendelea hata tab ikifungwa, hadi Stop.
  async function toggleAuto(agent: AgentRecord) {
    const existing = autoStream(agent.id)
    try {
      if (existing) {
        await api.del(`/collection/streams/${existing.id}`)
      } else {
        const iface = (ifaces[agent.id] || '').trim()
        if (!iface) return
        await api.post('/collection/streams', { agentId: agent.id, kind: 'capture', params: { iface, duration: 30 } })
      }
      setStreams(await api.get<CollectionStream[]>('/collection/streams'))
    } catch {
      /* keep */
    }
  }

  const live = flows[0] ? Date.now() - new Date(flows[0].createdAt).getTime() < 60000 : false

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Waves}
        title="Live Network Capture"
        subtitle="Flows captured by the packet sensor, refreshing every 5 seconds."
        actions={
          live ? (
            <StatusPill tone="green"><Radio size={12} /> Capturing</StatusPill>
          ) : (
            <StatusPill tone="slate"><Radio size={12} /> Idle</StatusPill>
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Flows" value={flows.length} sub="Recent captures" icon={Waves} />
        <StatCard label="Flagged" value={flows.filter((f) => f.verdict === 'malicious' || f.verdict === 'suspicious').length} sub="Suspicious or worse" icon={Waves} tone="red" />
        <StatCard label="Destinations" value={new Set(flows.map((f) => f.dstIp)).size} sub="Distinct external IPs" icon={Waves} />
      </div>

      {agents.length > 0 && (
        <SectionCard title="Capture from a host" description="Capture once (a single 30-second run), or turn on Auto to keep capturing continuously, it runs on the server and keeps going even if you close this page, until you press Stop. Enter the interface number from tshark -D on that host.">
          <ul className="divide-y divide-slate-100">
            {agents.map((a) => {
              const isAuto = Boolean(autoStream(a.id))
              const iface = (ifaces[a.id] || '').trim()
              return (
                <li key={a.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">{a.hostname}</p>
                      <StatusPill tone={agentOnline(a) ? 'green' : 'slate'}>{agentOnline(a) ? 'online' : 'offline'}</StatusPill>
                      {isAuto && <StatusPill tone="green"><Radio size={11} /> auto</StatusPill>}
                    </div>
                    <p className="text-xs text-slate-500">{a.lastIp ?? '—'}</p>
                  </div>
                  <input className="input h-9 w-24 py-1 text-xs" placeholder="iface #" value={ifaces[a.id] ?? ''} onChange={(e) => setIfaces((s) => ({ ...s, [a.id]: e.target.value }))} disabled={isAuto} />
                  <button type="button" className="btn-soft btn-sm" onClick={() => capture(a)} disabled={isAuto || capturing(a.id) || !iface} title="One 30-second capture">
                    {capturing(a.id) && !isAuto ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                    {capturing(a.id) && !isAuto ? 'Capturing…' : 'Capture once'}
                  </button>
                  <button type="button" className={isAuto ? 'btn-danger btn-sm' : 'btn-primary btn-sm'} onClick={() => toggleAuto(a)} disabled={!iface} title={isAuto ? 'Stop auto capture' : 'Keep capturing until stopped'}>
                    {isAuto ? <><Square size={13} /> Stop</> : <><Repeat size={14} /> Auto</>}
                  </button>
                </li>
              )
            })}
          </ul>
        </SectionCard>
      )}

      {flows.length === 0 && !loading && agents.length === 0 && (
        <SectionCard>
          <div className="p-5 text-sm text-slate-600">
            <p className="font-semibold text-slate-800">No agents yet.</p>
            <p className="mt-1">Set up a host once on the <Link to="/dashboard/agents" className="font-semibold text-brand-700 hover:text-brand-900">Agents page</Link>, then trigger a capture from here.</p>
          </div>
        </SectionCard>
      )}

      <SectionCard title="Live flows" description={loading ? 'loading…' : `${flows.length} flows`}>
        <TableWrap>
          <table className="table-base">
            <thead>
              <tr><th>Time</th><th>Source</th><th>Destination</th><th>Port</th><th>Proto</th><th>Verdict</th><th>Location</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400"><Loader2 size={18} className="mx-auto animate-spin" /></td></tr>
              ) : flows.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-slate-400">Waiting for flows from the capture sensor.</td></tr>
              ) : (
                flows.map((f) => (
                  <tr key={f.id}>
                    <td className="whitespace-nowrap text-slate-500">{new Date(f.createdAt).toLocaleTimeString()}</td>
                    <td className="font-mono text-[12px] text-slate-600">{f.deviceName ?? f.srcIp ?? '—'}</td>
                    <td className="font-mono text-[12px] font-semibold text-slate-900">{f.dstIp ?? '—'}</td>
                    <td className="tabular-nums text-slate-500">{f.dstPort ?? '—'}</td>
                    <td className="text-slate-500">{f.protocol ?? '—'}</td>
                    <td><StatusPill tone={verdictTone[f.verdict]}>{f.verdict}</StatusPill></td>
                    <td className="whitespace-nowrap text-slate-500">{[f.country, f.asnOrg].filter(Boolean).join(' · ') || '—'}</td>
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
