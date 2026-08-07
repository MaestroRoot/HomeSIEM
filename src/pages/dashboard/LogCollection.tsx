import { Fragment, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronRight, Loader2, Play, Radio, Repeat, ScrollText, Square } from 'lucide-react'
import { PageHeader, SectionCard, StatCard, StatusPill, TableWrap, cx } from '@/components/ui'
import { api } from '@/lib/api'
import { pollWhenVisible } from '@/lib/usePolling'
import type { AgentJob, AgentRecord, CollectionStream, LogList } from '@/lib/types'

const levelTone: Record<string, 'red' | 'amber' | 'slate' | 'green'> = {
  error: 'red',
  warn: 'amber',
  info: 'slate',
}

function agentOnline(a: AgentRecord): boolean {
  return a.lastSeenAt ? Date.now() - new Date(a.lastSeenAt).getTime() < 30000 : false
}

export default function LogCollection() {
  const [data, setData] = useState<LogList | null>(null)
  const [source, setSource] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [agents, setAgents] = useState<AgentRecord[]>([])
  const [jobs, setJobs] = useState<AgentJob[]>([])
  const [channels, setChannels] = useState<Record<string, string>>({})
  const [streams, setStreams] = useState<CollectionStream[]>([])

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const [ag, jb, st] = await Promise.all([
          api.get<AgentRecord[]>('/agents'),
          api.get<AgentJob[]>('/agents/jobs'),
          api.get<CollectionStream[]>('/collection/streams'),
        ])
        if (!active) return
        setAgents(ag)
        setJobs(jb)
        setStreams(st)
        setChannels((cur) => {
          const next = { ...cur }
          for (const s of st) {
            if (s.kind === 'logs' && !next[s.agentId] && typeof s.params.channel === 'string') {
              next[s.agentId] = s.params.channel
            }
          }
          return next
        })
      } catch {
        /* keep */
      }
    }
    load()
    const stop = pollWhenVisible(load, 12000)
    return () => { active = false; stop() }
  }, [])

  const autoStream = (id: string) => streams.find((s) => s.agentId === id && s.kind === 'logs' && s.enabled)

  async function collect(agent: AgentRecord) {
    const channel = channels[agent.id] || 'System'
    await api.post(`/agents/${agent.id}/jobs`, { kind: 'logs', params: { channel, count: 30 } })
    setJobs(await api.get<AgentJob[]>('/agents/jobs'))
  }
  const collecting = (id: string) =>
    jobs.some((j) => j.agentId === id && j.kind === 'logs' && (j.status === 'pending' || j.status === 'running'))

  // Auto mode ni server-side: inaendelea hata tab ikifungwa, hadi Stop.
  async function toggleAuto(agent: AgentRecord) {
    const existing = autoStream(agent.id)
    try {
      if (existing) {
        await api.del(`/collection/streams/${existing.id}`)
      } else {
        const channel = channels[agent.id] || 'System'
        await api.post('/collection/streams', { agentId: agent.id, kind: 'logs', params: { channel, count: 30 } })
      }
      setStreams(await api.get<CollectionStream[]>('/collection/streams'))
    } catch {
      /* keep */
    }
  }

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const q = source ? `?source=${encodeURIComponent(source)}` : ''
        const res = await api.get<LogList>(`/logs${q}`)
        if (active) setData(res)
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
  }, [source])

  return (
    <div className="space-y-6">
      <PageHeader icon={ScrollText} title="Log Collection" subtitle="Logs shipped by the log agent from your hosts, refreshing every 6 seconds." actions={<Link to="/dashboard/logs/parsers" className="btn-soft btn-sm">Manage parsers</Link>} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Log entries" value={data?.total ?? 0} sub="Total collected" icon={ScrollText} />
        <StatCard label="Sources" value={data?.sources.length ?? 0} sub="Reporting" icon={ScrollText} tone="green" />
        <StatCard label="Errors" value={data?.items.filter((l) => l.level === 'error').length ?? 0} sub="In recent logs" icon={ScrollText} tone="red" />
      </div>

      {agents.length > 0 && (
        <SectionCard title="Collect logs from a host" description="Collect once, or turn on Auto to keep pulling recent logs continuously, it runs on the server and keeps going even if you close this page, until you press Stop.">
          <ul className="divide-y divide-slate-100">
            {agents.map((a) => {
              const isAuto = Boolean(autoStream(a.id))
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
                  <select className="input h-9 w-36 py-1 text-xs" value={channels[a.id] ?? 'System'} onChange={(e) => setChannels((s) => ({ ...s, [a.id]: e.target.value }))} disabled={isAuto}>
                    {['System', 'Application', 'Security'].map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <button type="button" className="btn-soft btn-sm" onClick={() => collect(a)} disabled={isAuto || collecting(a.id)} title="Collect recent logs once">
                    {collecting(a.id) && !isAuto ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                    {collecting(a.id) && !isAuto ? 'Collecting…' : 'Collect once'}
                  </button>
                  <button type="button" className={isAuto ? 'btn-danger btn-sm' : 'btn-primary btn-sm'} onClick={() => toggleAuto(a)} title={isAuto ? 'Stop auto collection' : 'Keep collecting until stopped'}>
                    {isAuto ? <><Square size={13} /> Stop</> : <><Repeat size={14} /> Auto</>}
                  </button>
                </li>
              )
            })}
          </ul>
        </SectionCard>
      )}

      {(!data || data.total === 0) && !loading && agents.length === 0 && (
        <SectionCard>
          <div className="p-5 text-sm text-slate-600">
            <p className="font-semibold text-slate-800">No agents yet.</p>
            <p className="mt-1">Set up a host once on the <Link to="/dashboard/agents" className="font-semibold text-brand-700 hover:text-brand-900">Agents page</Link>, then collect its logs from here by clicking.</p>
          </div>
        </SectionCard>
      )}

      {data && data.sources.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setSource(null)} className={cx('rounded-lg px-3 py-1.5 text-xs font-semibold', !source ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200')}>All</button>
          {data.sources.map((s) => (
            <button key={s} type="button" onClick={() => setSource(s)} className={cx('rounded-lg px-3 py-1.5 text-xs font-semibold', source === s ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200')}>{s}</button>
          ))}
        </div>
      )}

      <SectionCard title="Recent logs" description={loading ? 'loading…' : `${data?.items.length ?? 0} lines`}>
        <TableWrap>
          <table className="table-base">
            <thead><tr><th className="w-6" /><th>Time</th><th>Source</th><th>Host</th><th>Level</th><th>Message</th></tr></thead>
            <tbody>
              {loading && !data ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400"><Loader2 size={18} className="mx-auto animate-spin" /></td></tr>
              ) : !data || data.items.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-400">Waiting for logs from the agent.</td></tr>
              ) : (
                data.items.map((l) => {
                  const open = expanded === l.id
                  return (
                    <Fragment key={l.id}>
                      <tr
                        onClick={() => setExpanded(open ? null : l.id)}
                        className={cx('cursor-pointer transition-colors', open ? 'bg-brand-50' : 'hover:bg-slate-50')}
                      >
                        <td className="pl-4 text-slate-400">{open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</td>
                        <td className="whitespace-nowrap text-slate-500">{new Date(l.createdAt).toLocaleTimeString()}</td>
                        <td className="font-mono text-[12px] text-slate-600">{l.source}</td>
                        <td className="font-mono text-[12px] text-slate-500">{l.host ?? '—'}</td>
                        <td><StatusPill tone={levelTone[l.level] ?? 'slate'}>{l.level}</StatusPill></td>
                        <td className={cx('font-mono text-[12px] text-slate-700', !open && 'max-w-lg truncate')}>{l.message}</td>
                      </tr>
                      {open && (
                        <tr className="bg-slate-50/70">
                          <td />
                          <td colSpan={5} className="px-4 py-4">
                            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                              {[
                                ['Source', l.source],
                                ['Host', l.host ?? '—'],
                                ['Level', l.level],
                                ['Event time', l.occurredAt ? new Date(l.occurredAt).toLocaleString() : '—'],
                                ['Received', new Date(l.createdAt).toLocaleString()],
                              ].map(([k, v]) => (
                                <div key={k}>
                                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{k}</dt>
                                  <dd className="mt-0.5 font-mono text-[12px] font-semibold text-slate-800">{v}</dd>
                                </div>
                              ))}
                            </dl>
                            <div className="mt-3">
                              <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Full message</dt>
                              <pre className="mt-1 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-white p-3 font-mono text-[12px] text-slate-700 ring-1 ring-slate-200">{l.message}</pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </TableWrap>
      </SectionCard>
    </div>
  )
}
