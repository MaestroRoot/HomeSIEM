import { Fragment, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Activity,
  BellRing,
  Boxes,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FileCode2,
  Globe2,
  Loader2,
  Network,
  Pencil,
  Plus,
  Route as RouteIcon,
  Save,
  Server,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import {
  EmptyState,
  PageHeader,
  SectionCard,
  StatCard,
  StatusPill,
  TableWrap,
  cx,
} from '@/components/ui'
import { api, ApiError } from '@/lib/api'
import { pollWhenVisible } from '@/lib/usePolling'
import type {
  DetectionRule,
  MonitoredDevice,
  NotificationChannel,
  SecurityEventRow,
  StatsOverview,
  Verdict,
  VulnRecord,
} from '@/lib/types'

const verdictTone: Record<Verdict, 'red' | 'amber' | 'green' | 'slate'> = {
  malicious: 'red',
  suspicious: 'amber',
  clean: 'green',
  unknown: 'slate',
}

/* ============================ Compliance ============================ */

const FRAMEWORKS = ['CIS', 'PCI DSS', 'GDPR', 'HIPAA'] as const

interface Control {
  id: string
  title: string
  pass: boolean
  detail: string
}

function buildControls(vulns: VulnRecord[], stats: StatsOverview, devices: MonitoredDevice[]): Control[] {
  const hasService = (s: string) => vulns.some((v) => (v.service ?? '').toLowerCase() === s.toLowerCase())
  const dbExposed = ['MSSQL', 'MySQL', 'PostgreSQL'].some(hasService)
  const riskyDevice = devices.some((d) => d.riskScore >= 70)
  return [
    { id: 'no-telnet', title: 'No plaintext remote access (Telnet) exposed', pass: !hasService('Telnet'), detail: 'Telnet sends credentials in clear text.' },
    { id: 'no-smb', title: 'SMB file sharing not exposed to the network', pass: !hasService('SMB') && !hasService('NetBIOS'), detail: 'Exposed SMB is a common ransomware entry point.' },
    { id: 'no-rdp', title: 'Remote Desktop (RDP) not openly exposed', pass: !hasService('RDP'), detail: 'RDP should require NLA + MFA and be restricted.' },
    { id: 'no-db', title: 'Databases not exposed to the network', pass: !dbExposed, detail: 'Databases must bind to localhost or be firewalled.' },
    { id: 'devices-monitored', title: 'At least one device is monitored', pass: devices.length > 0, detail: 'A collector must be connected to have visibility.' },
    { id: 'no-malicious', title: 'No contact with malicious indicators', pass: stats.byVerdict.malicious === 0, detail: 'No device reached a known-malicious indicator.' },
    { id: 'low-risk', title: 'No device at high risk (score ≥ 70)', pass: !riskyDevice, detail: 'High-risk devices need investigation.' },
    { id: 'few-suspicious', title: 'Suspicious activity under control', pass: stats.byVerdict.suspicious < 5, detail: 'A spike in suspicious lookups warrants review.' },
  ]
}

export function Compliance() {
  const [framework, setFramework] = useState<(typeof FRAMEWORKS)[number]>('CIS')
  const [controls, setControls] = useState<Control[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const [vulns, stats, devices] = await Promise.all([
          api.get<VulnRecord[]>('/vulnerabilities'),
          api.get<StatsOverview>('/stats/overview'),
          api.get<{ items: MonitoredDevice[] }>('/devices'),
        ])
        if (active) setControls(buildControls(vulns, stats, devices.items))
      } catch {
        /* keep */
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    const stop = pollWhenVisible(load, 20000)
    return () => {
      active = false
      stop()
    }
  }, [])

  const passing = controls.filter((c) => c.pass).length
  const pct = controls.length ? Math.round((passing / controls.length) * 100) : 0

  return (
    <div className="space-y-6">
      <PageHeader icon={ClipboardCheck} title="Compliance Center" subtitle="Security controls evaluated from your real posture and mapped to common frameworks." />
      <div className="flex flex-wrap gap-2">
        {FRAMEWORKS.map((f) => (
          <button key={f} type="button" onClick={() => setFramework(f)} className={cx('rounded-lg px-3.5 py-1.5 text-sm font-semibold', framework === f ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200')}>{f}</button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Controls" value={controls.length} sub={framework} icon={ClipboardCheck} />
        <StatCard label="Passing" value={passing} sub={`${pct}%`} icon={ShieldCheck} tone="green" />
        <StatCard label="Needs attention" value={controls.length - passing} sub="Failing controls" icon={ClipboardCheck} tone="red" />
        <StatCard label="Posture" value={`${pct}%`} sub="Overall compliance" icon={Activity} tone={pct >= 80 ? 'green' : pct >= 50 ? 'amber' : 'red'} />
      </div>
      <SectionCard title={`${framework} controls`} description="Derived from your scans, events and devices">
        {loading && controls.length === 0 ? (
          <div className="grid place-items-center py-10 text-slate-400"><Loader2 size={20} className="animate-spin" /></div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {controls.map((c) => (
              <li key={c.id} className="flex items-start gap-3 px-5 py-3.5">
                <StatusPill tone={c.pass ? 'green' : 'red'}>{c.pass ? 'pass' : 'fail'}</StatusPill>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{c.title}</p>
                  <p className="text-xs text-slate-500">{c.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  )
}

/* ============================ Coverage (MITRE) ============================ */

const TACTICS = ['Reconnaissance', 'Initial Access', 'Execution', 'Persistence', 'Command & Control', 'Exfiltration', 'Impact']

function tacticFor(rule: DetectionRule): string {
  if (rule.conditionType === 'country_is') return 'Reconnaissance'
  if (rule.conditionType === 'domain_contains') return 'Command & Control'
  if (rule.conditionType === 'pulse_count_gte') return 'Initial Access'
  return 'Command & Control'
}

export function Coverage() {
  const [rules, setRules] = useState<DetectionRule[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    api.get<DetectionRule[]>('/rules').then((r) => active && setRules(r)).catch(() => {}).finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  const byTactic = useMemo(() => {
    const m = new Map<string, { rules: number; hits: number }>()
    for (const t of TACTICS) m.set(t, { rules: 0, hits: 0 })
    for (const r of rules) {
      const t = tacticFor(r)
      const cur = m.get(t)!
      cur.rules += 1
      cur.hits += r.hits
    }
    return m
  }, [rules])

  const covered = TACTICS.filter((t) => (byTactic.get(t)?.rules ?? 0) > 0).length

  return (
    <div className="space-y-6">
      <PageHeader icon={ShieldCheck} title="Detection Coverage" subtitle="Which MITRE ATT&CK tactics your active rules cover, and where the gaps are." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tactics covered" value={`${covered}/${TACTICS.length}`} sub="Have at least one rule" icon={ShieldCheck} tone="green" />
        <StatCard label="Rules" value={rules.length} sub="Total detections" icon={ShieldCheck} />
        <StatCard label="Enabled" value={rules.filter((r) => r.enabled).length} sub="Currently active" icon={ShieldCheck} tone="green" />
        <StatCard label="Gaps" value={TACTICS.length - covered} sub="Tactics with no rule" icon={ShieldCheck} tone="red" />
      </div>
      <SectionCard title="Coverage heatmap" description="Tactics with more rules and hits are darker">
        {loading ? (
          <div className="grid place-items-center py-10 text-slate-400"><Loader2 size={20} className="animate-spin" /></div>
        ) : (
          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
            {TACTICS.map((t) => {
              const d = byTactic.get(t)!
              const has = d.rules > 0
              return (
                <div key={t} className={cx('rounded-xl border p-4', has ? 'border-brand-300 bg-brand-50' : 'border-slate-200 bg-slate-50')}>
                  <p className="text-sm font-bold text-slate-900">{t}</p>
                  <p className="mt-1 text-xs text-slate-500">{d.rules} rule(s) · {d.hits} hits</p>
                  <div className="mt-2"><StatusPill tone={has ? 'green' : 'slate'}>{has ? 'covered' : 'gap'}</StatusPill></div>
                </div>
              )
            })}
          </div>
        )}
      </SectionCard>
      <SectionCard><div className="px-5 py-4 text-sm text-slate-600">Rules are mapped to tactics by their condition type. Add rules in the <Link to="/dashboard/rules" className="font-semibold text-brand-700">Rule Engine</Link> to close gaps.</div></SectionCard>
    </div>
  )
}

/* ============================ Geo Map ============================ */

export function GeoMap() {
  const [stats, setStats] = useState<StatsOverview | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    api.get<StatsOverview>('/stats/overview').then((s) => active && setStats(s)).catch(() => {}).finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])
  const max = stats ? Math.max(1, ...stats.byCountry.map((c) => c.count)) : 1
  return (
    <div className="space-y-6">
      <PageHeader icon={Globe2} title="Geographic Threat Map" subtitle="Where the external destinations your devices contacted are located (GeoIP context, not attribution)." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Countries" value={stats?.byCountry.length ?? 0} sub="Observed" icon={Globe2} />
        <StatCard label="External IPs" value={stats?.uniqueExternalIps ?? 0} sub="Destinations" icon={Globe2} />
        <StatCard label="Flagged" value={stats?.flagged ?? 0} sub="Suspicious or worse" icon={Globe2} tone="red" />
      </div>
      <SectionCard title="Destinations by country" description="Ranked by number of events">
        {loading ? (
          <div className="grid place-items-center py-10 text-slate-400"><Loader2 size={20} className="animate-spin" /></div>
        ) : !stats || stats.byCountry.length === 0 ? (
          <EmptyState icon={Globe2} title="No location data yet" message="As your devices contact external services, their countries appear here." />
        ) : (
          <ul className="space-y-2 p-5">
            {stats.byCountry.map((c) => (
              <li key={c.name} className="flex items-center gap-3">
                <span className="w-40 shrink-0 truncate text-sm font-semibold text-slate-700">{c.name}</span>
                <div className="h-4 flex-1 overflow-hidden rounded bg-slate-100">
                  <div className="h-full rounded bg-brand-500" style={{ width: `${(c.count / max) * 100}%` }} />
                </div>
                <span className="w-10 text-right text-sm tabular-nums text-slate-500">{c.count}</span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
      <SectionCard><div className="px-5 py-4 text-xs text-slate-500">Location is where the network is registered, not where a person is. VPNs, mobile carriers and cloud IPs distort this, use it as context only.</div></SectionCard>
    </div>
  )
}

/* ============================ Network Graph ============================ */

export function NetworkGraph() {
  const [events, setEvents] = useState<SecurityEventRow[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    async function load() {
      try {
        const r = await api.get<{ items: SecurityEventRow[] }>('/events?limit=200')
        if (active) setEvents(r.items)
      } catch {
        /* keep */
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    const stop = pollWhenVisible(load, 15000)
    return () => { active = false; stop() }
  }, [])

  const graph = useMemo(() => {
    const edges = new Map<string, { src: string; dst: string; flagged: boolean; count: number }>()
    for (const e of events) {
      const src = e.deviceName ?? e.srcIp ?? '?'
      const dst = e.domain ?? e.dstIp ?? '?'
      if (src === '?' || dst === '?') continue
      const key = `${src}→${dst}`
      const cur = edges.get(key)
      const flagged = e.verdict === 'malicious' || e.verdict === 'suspicious'
      if (cur) { cur.count += 1; cur.flagged = cur.flagged || flagged }
      else edges.set(key, { src, dst, flagged, count: 1 })
    }
    const list = [...edges.values()].sort((a, b) => b.count - a.count).slice(0, 40)
    const nodes = [...new Set(list.flatMap((e) => [e.src, e.dst]))]
    const pos = new Map<string, { x: number; y: number }>()
    const R = 220
    nodes.forEach((n, i) => {
      const ang = (i / nodes.length) * Math.PI * 2
      pos.set(n, { x: 300 + R * Math.cos(ang), y: 260 + R * Math.sin(ang) })
    })
    return { edges: list, nodes, pos }
  }, [events])

  return (
    <div className="space-y-6">
      <PageHeader icon={Network} title="Network Graph" subtitle="Who talked to what. Red links are flagged by threat intelligence." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Nodes" value={graph.nodes.length} sub="Devices + destinations" icon={Network} />
        <StatCard label="Connections" value={graph.edges.length} sub="Distinct paths" icon={Network} />
        <StatCard label="Flagged paths" value={graph.edges.filter((e) => e.flagged).length} sub="Suspicious or worse" icon={Network} tone="red" />
      </div>
      <SectionCard title="Communication topology" description="Newest 40 connections">
        {loading && events.length === 0 ? (
          <div className="grid place-items-center py-10 text-slate-400"><Loader2 size={20} className="animate-spin" /></div>
        ) : graph.nodes.length === 0 ? (
          <EmptyState icon={Network} title="No traffic yet" message="Connect a collector and connections will map out here." />
        ) : (
          <div className="overflow-x-auto p-4">
            <svg viewBox="0 0 600 520" className="mx-auto w-full max-w-3xl">
              {graph.edges.map((e, i) => {
                const a = graph.pos.get(e.src)!
                const b = graph.pos.get(e.dst)!
                return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={e.flagged ? '#dc2626' : '#cbd5e1'} strokeWidth={e.flagged ? 2 : 1} opacity={0.7} />
              })}
              {graph.nodes.map((n) => {
                const p = graph.pos.get(n)!
                const isDevice = events.some((e) => (e.deviceName ?? e.srcIp) === n)
                return (
                  <g key={n}>
                    <circle cx={p.x} cy={p.y} r={isDevice ? 7 : 5} fill={isDevice ? '#2563eb' : '#64748b'} />
                    <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="9" fill="#64748b">{n.length > 22 ? n.slice(0, 22) + '…' : n}</text>
                  </g>
                )
              })}
            </svg>
          </div>
        )}
      </SectionCard>
    </div>
  )
}

/* ============================ Attack Chain ============================ */

export function AttackChain() {
  const [events, setEvents] = useState<SecurityEventRow[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    api.get<{ items: SecurityEventRow[] }>('/events?onlyFlagged=true&limit=50').then((r) => active && setEvents(r.items)).catch(() => {}).finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader icon={RouteIcon} title="Attack Chain" subtitle="Flagged events in sequence, mapped to the stage of an attack they resemble." />
      {loading ? (
        <div className="grid place-items-center py-16 text-slate-400"><Loader2 size={22} className="animate-spin" /></div>
      ) : events.length === 0 ? (
        <SectionCard><EmptyState icon={RouteIcon} title="No attack chain yet" message="When devices contact flagged indicators, the sequence builds here." /></SectionCard>
      ) : (
        <SectionCard title="Chronological chain" description={`${events.length} flagged events`}>
          <ol className="relative ml-4 border-l border-slate-200">
            {events.map((e) => {
              const stage = e.kind === 'dns' ? 'Command & Control (DNS resolution of flagged domain)' : 'Command & Control (connection to flagged host)'
              return (
                <li key={e.id} className="relative py-3 pl-6">
                  <span className="absolute -left-[5px] top-4 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] text-slate-400">{new Date(e.createdAt).toLocaleString()}</span>
                    <StatusPill tone={verdictTone[e.verdict]}>{e.verdict}</StatusPill>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-700"><span className="font-semibold">{stage}</span></p>
                  <p className="text-xs text-slate-500">{e.deviceName ?? e.srcIp} → <span className="font-mono">{e.domain ?? e.dstIp}</span> {e.country ? `· ${e.country}` : ''}</p>
                </li>
              )
            })}
          </ol>
        </SectionCard>
      )}
    </div>
  )
}

/* ============================ Runbooks (static playbooks) ============================ */

const RUNBOOKS = [
  { id: 'phishing', title: 'Phishing / malicious link clicked', steps: ['Identify the device and the flagged domain from Alerts.', 'Block the domain at your DNS resolver or gateway.', 'Check whether other devices contacted the same indicator.', 'Reset credentials that may have been entered.', 'Open an incident and record the timeline.'] },
  { id: 'malware', title: 'Malware / C2 beaconing', steps: ['Isolate the affected device from the network.', 'Run a forensic snapshot (Forensics page) to capture processes and connections.', 'Identify the C2 indicator and block it everywhere.', 'Scan the host for open services (Vulnerability Scanner).', 'Rebuild or clean the host, then monitor.'] },
  { id: 'creds', title: 'Credential compromise', steps: ['Force a password reset for the affected account.', 'Revoke active sessions and API keys (Account page).', 'Review logs for logins from unusual locations.', 'Enable MFA if not already on.', 'Document the incident.'] },
  { id: 'unauth', title: 'Unauthorised access / new device', steps: ['Confirm whether the device is expected (Devices page).', 'If not, quarantine it and change the Wi-Fi password.', 'Review what it contacted (Timeline / Network Graph).', 'Add a detection rule for the pattern.', 'Close the incident with notes.'] },
]

export function Runbooks() {
  const [open, setOpen] = useState<string | null>(RUNBOOKS[0]!.id)
  return (
    <div className="space-y-6">
      <PageHeader icon={Boxes} title="Incident Runbooks" subtitle="Step-by-step response playbooks for the incidents a home network faces most." actions={<Link to="/dashboard/incidents" className="btn-soft btn-sm">Incidents</Link>} />
      <div className="space-y-3">
        {RUNBOOKS.map((rb) => {
          const isOpen = open === rb.id
          return (
            <SectionCard key={rb.id}>
              <button type="button" onClick={() => setOpen(isOpen ? null : rb.id)} className="flex w-full items-center justify-between px-5 py-4 text-left">
                <span className="font-semibold text-slate-900">{rb.title}</span>
                {isOpen ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
              </button>
              {isOpen && (
                <ol className="divide-y divide-slate-100 border-t border-slate-100">
                  {rb.steps.map((s, i) => (
                    <li key={i} className="flex gap-3 px-5 py-3 text-sm text-slate-700">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-600 text-[11px] font-bold text-white">{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
              )}
            </SectionCard>
          )
        })}
      </div>
    </div>
  )
}

/* ============================ Log Parsers (regex tester) ============================ */

export function LogParsers() {
  const [sample, setSample] = useState('Aug 04 13:22:01 host sshd[2211]: Failed password for root from 192.168.1.9 port 55344 ssh2')
  const [pattern, setPattern] = useState('Failed password for (?<user>\\w+) from (?<ip>[\\d.]+)')
  const [error, setError] = useState<string | null>(null)

  const result = useMemo(() => {
    setError(null)
    try {
      const re = new RegExp(pattern)
      const m = re.exec(sample)
      if (!m) return null
      return { match: m[0], groups: m.groups ?? {}, indexed: m.slice(1) }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid regex')
      return null
    }
  }, [sample, pattern])

  return (
    <div className="space-y-6">
      <PageHeader icon={FileCode2} title="Log Parser Management" subtitle="Test a regular expression against a sample log line before using it in your pipeline." />
      <SectionCard title="Parser tester">
        <div className="space-y-4 p-5">
          <div>
            <label className="label">Sample log line</label>
            <textarea className="input min-h-[70px] font-mono text-[12px]" value={sample} onChange={(e) => setSample(e.target.value)} />
          </div>
          <div>
            <label className="label">Regular expression (named groups supported)</label>
            <input className="input font-mono text-[12px]" value={pattern} onChange={(e) => setPattern(e.target.value)} />
          </div>
          {error ? (
            <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
          ) : result ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-800">Match: <span className="font-mono">{result.match}</span></p>
              {Object.keys(result.groups).length > 0 && (
                <dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {Object.entries(result.groups).map(([k, v]) => (
                    <div key={k}><dt className="text-[11px] font-semibold uppercase text-slate-400">{k}</dt><dd className="font-mono text-sm text-slate-800">{String(v)}</dd></div>
                  ))}
                </dl>
              )}
            </div>
          ) : (
            <div className="rounded-lg bg-slate-50 px-4 py-2 text-sm text-slate-500">No match. Adjust the pattern.</div>
          )}
        </div>
      </SectionCard>
    </div>
  )
}

/* ============================ Alert Integrations (backend) ============================ */

export function AlertIntegrations() {
  const [dests, setDests] = useState<NotificationChannel[]>([])
  const [form, setForm] = useState({ type: 'slack', name: '', target: '', minSeverity: 'high' })
  const [msg, setMsg] = useState<string | null>(null)

  async function load() {
    try { setDests(await api.get<NotificationChannel[]>('/notifications/channels')) } catch { /* keep */ }
  }
  useEffect(() => { load() }, [])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.target.trim()) return
    try {
      await api.post('/notifications/channels', form)
      setForm({ type: 'slack', name: '', target: '', minSeverity: 'high' })
      await load()
    } catch (err) { setMsg(err instanceof ApiError ? err.message : 'Could not add.') }
  }
  async function remove(id: string) {
    await api.del(`/notifications/channels/${id}`)
    load()
  }
  async function test(id: string) {
    setMsg(null)
    try { await api.post(`/notifications/channels/${id}/test`, {}); setMsg('Test sent. Check the destination.') }
    catch (err) { setMsg(err instanceof ApiError ? err.message : 'Test failed.') }
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={BellRing} title="Alert Integrations" subtitle="Where flagged alerts are sent. The server delivers to these when a flagged event fires." />
      <SectionCard title="Add a destination">
        <form onSubmit={add} className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <div><label className="label">Type</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {['slack', 'discord', 'email', 'pagerduty', 'webhook'].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div><label className="label">Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Team channel" /></div>
          <div><label className="label">Webhook URL / email / routing key</label><input className="input font-mono text-xs" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} placeholder="https://hooks.slack.com/…" /></div>
          <div className="flex items-end gap-2">
            <div className="flex-1"><label className="label">Min severity</label>
              <select className="input" value={form.minSeverity} onChange={(e) => setForm({ ...form, minSeverity: e.target.value })}>
                {['critical', 'high', 'medium', 'low'].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <button type="submit" className="btn-primary"><Plus size={15} /></button>
          </div>
        </form>
        {msg && <div className="px-5 pb-4 text-sm text-slate-600">{msg}</div>}
      </SectionCard>
      <SectionCard title="Destinations" description={`${dests.length} configured`}>
        {dests.length === 0 ? (
          <EmptyState icon={BellRing} title="No destinations yet" message="Add Slack, Discord, email, PagerDuty or a generic webhook above." />
        ) : (
          <TableWrap>
            <table className="table-base">
              <thead><tr><th>Type</th><th>Name</th><th>Target</th><th>Min severity</th><th>Last sent</th><th /></tr></thead>
              <tbody>
                {dests.map((d) => (
                  <tr key={d.id}>
                    <td className="uppercase text-xs font-semibold text-slate-500">{d.type}</td>
                    <td className="font-semibold text-slate-900">{d.name}</td>
                    <td className="max-w-xs truncate font-mono text-[12px] text-slate-500">{d.target}</td>
                    <td>{d.minSeverity}</td>
                    <td className="text-slate-500">{d.lastSentAt ? new Date(d.lastSentAt).toLocaleString() : '—'}</td>
                    <td className="whitespace-nowrap">
                      <button type="button" onClick={() => test(d.id)} className="mr-1 rounded-md px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50">Test</button>
                      <button type="button" onClick={() => remove(d.id)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </SectionCard>
    </div>
  )
}

/* ============================ Device Detail ============================ */

export function DeviceDetail() {
  const { id } = useParams()
  const [device, setDevice] = useState<MonitoredDevice | null>(null)
  const [events, setEvents] = useState<SecurityEventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [newTag, setNewTag] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [typeInput, setTypeInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function saveTags(tags: string[]) {
    setDevice((d) => (d ? { ...d, tags } : d))
    try { await api.patch(`/devices/${id}`, { tags }) } catch { /* keep */ }
  }

  async function saveIdentity() {
    if (!nameInput.trim() || saving) return
    setSaving(true)
    setSaved(false)
    try {
      const updated = await api.patch<MonitoredDevice>(`/devices/${id}`, { name: nameInput.trim(), deviceType: typeInput })
      setDevice(updated)
      setNameInput(updated.name)
      setTypeInput(updated.deviceType)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      /* keep */
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const [devs, evs] = await Promise.all([
          api.get<{ items: MonitoredDevice[] }>('/devices'),
          api.get<{ items: SecurityEventRow[] }>('/events?limit=300'),
        ])
        if (!active) return
        const d = devs.items.find((x) => x.id === id) ?? null
        setDevice(d)
        setEvents(evs.items.filter((e) => e.deviceId === id || (d && e.srcIp === d.lastIp)))
      } catch {
        /* keep */
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    const stop = pollWhenVisible(load, 15000)
    return () => { active = false; stop() }
  }, [id])

  // Weka thamani za fomu mara moja device inapopatikana (bila kufuta maandishi
  // ya mtumiaji kwenye poll zinazofuata, id haibadiliki).
  useEffect(() => {
    if (device) {
      setNameInput(device.name)
      setTypeInput(device.deviceType)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device?.id])

  const flagged = events.filter((e) => e.verdict === 'malicious' || e.verdict === 'suspicious').length
  const DEVICE_TYPES = ['Phone', 'Laptop', 'Desktop', 'Raspberry Pi', 'Router', 'Server', 'VM', 'IoT', 'Unknown']

  return (
    <div className="space-y-6">
      <PageHeader icon={Server} title={device?.name ?? 'Device'} subtitle={device ? `${device.mac ?? '—'} · ${device.lastIp ?? '—'} · ${device.deviceType}` : 'Device detail'} actions={<Link to="/dashboard/devices" className="btn-soft btn-sm">All devices</Link>} />
      {loading && !device ? (
        <div className="grid place-items-center py-16 text-slate-400"><Loader2 size={22} className="animate-spin" /></div>
      ) : !device ? (
        <SectionCard><EmptyState icon={Server} title="Device not found" message="This device is not in your workspace." /></SectionCard>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Risk score" value={device.riskScore} sub={device.riskScore >= 70 ? 'high' : device.riskScore >= 30 ? 'medium' : 'low'} icon={Activity} tone={device.riskScore >= 70 ? 'red' : device.riskScore >= 30 ? 'amber' : 'green'} />
            <StatCard label="Events" value={device.eventsCount} sub="Total observed" icon={Activity} />
            <StatCard label="Flagged" value={flagged} sub="Suspicious or worse" icon={Activity} tone="red" />
            <StatCard label="Last seen" value={device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleTimeString() : '—'} sub={device.status} icon={Server} />
          </div>

          <SectionCard title="Identity" description="Give this device a friendly name and type" right={<Pencil size={16} className="text-slate-400" />}>
            {device.discovered && (
              <div className="mx-5 mt-5 flex items-start gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <Server size={16} className="mt-0.5 shrink-0" />
                <span>This device was auto-discovered, so its name defaults to its IP or MAC. Give it a friendly name below.</span>
              </div>
            )}
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <div>
                <label className="label">Device name</label>
                <input
                  className="input"
                  placeholder="e.g. Living room TV"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveIdentity() }}
                />
              </div>
              <div>
                <label className="label">Device type</label>
                <select className="input" value={typeInput} onChange={(e) => setTypeInput(e.target.value)}>
                  {DEVICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2 flex items-center gap-3">
                <button
                  type="button"
                  className="btn-primary btn-sm"
                  onClick={saveIdentity}
                  disabled={saving || !nameInput.trim() || (nameInput.trim() === device.name && typeInput === device.deviceType)}
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
                  {saved ? 'Saved' : 'Save'}
                </button>
                {device.discovered && <span className="text-xs text-slate-400">Naming a discovered device keeps it (it won’t be shown as “discovered” anymore).</span>}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Tags" description="Group this device by site, team or criticality">
            <div className="flex flex-wrap items-center gap-2 p-5">
              {(device.tags ?? []).map((t) => (
                <span key={t} className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
                  {t}
                  <button type="button" onClick={() => saveTags((device.tags ?? []).filter((x) => x !== t))} aria-label="Remove tag">×</button>
                </span>
              ))}
              <input
                className="input h-8 w-32 py-1 text-sm"
                placeholder="add tag…"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTag.trim()) {
                    saveTags([...new Set([...(device.tags ?? []), newTag.trim()])])
                    setNewTag('')
                  }
                }}
              />
            </div>
          </SectionCard>

          <SectionCard title="Recent activity" description={`${events.length} events for this device`}>
            <TableWrap>
              <table className="table-base">
                <thead><tr><th>Time</th><th>Kind</th><th>Domain / Destination</th><th>Verdict</th><th>Location</th></tr></thead>
                <tbody>
                  {events.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-400">No events attributed to this device yet.</td></tr>
                  ) : (
                    events.slice(0, 100).map((e) => (
                      <Fragment key={e.id}>
                        <tr>
                          <td className="whitespace-nowrap text-slate-500">{new Date(e.createdAt).toLocaleTimeString()}</td>
                          <td className="uppercase text-[11px] text-slate-500">{e.kind}</td>
                          <td className="max-w-xs truncate font-mono text-[12px] font-semibold text-slate-900">{e.domain ?? e.dstIp ?? '—'}</td>
                          <td><StatusPill tone={verdictTone[e.verdict]}>{e.verdict}</StatusPill></td>
                          <td className="whitespace-nowrap text-slate-500">{[e.country, e.asnOrg].filter(Boolean).join(' · ') || '—'}</td>
                        </tr>
                      </Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </TableWrap>
          </SectionCard>
        </>
      )}
    </div>
  )
}
