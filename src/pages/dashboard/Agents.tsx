import { useEffect, useState } from 'react'
import { Check, Copy, Cpu, Download, KeyRound, Loader2, Monitor, Radio, ShieldCheck, Trash2 } from 'lucide-react'
import { PageHeader, SectionCard, StatCard, StatusPill, TableWrap } from '@/components/ui'
import CloudflareGatewayCard from '@/components/dashboard/CloudflareGatewayCard'
import { api, ApiError } from '@/lib/api'
import { pollWhenVisible } from '@/lib/usePolling'
import type { AgentRecord, SensorTokenCreated } from '@/lib/types'

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '/api/v1') as string
//: Script za sensor zinahudumiwa kutoka origin ile ile ya app (folda ya
//: `public/`), mfano https://home-siem.vercel.app/agent.py
const DOWNLOAD_BASE = typeof window !== 'undefined' ? window.location.origin : ''
//: Agent ni program ya nje (si browser), kwa hiyo HOMESIEM_URL LAZIMA iwe
//: kamili. VITE_API_BASE_URL ikiwa relative (mfano /api/v1), iunganishe na origin.
const API_ABS = API_BASE.startsWith('http') ? API_BASE : `${DOWNLOAD_BASE}${API_BASE}`
//: Releases za desktop agent (HomeSIEM.exe). Pakia faili zilizobuild na
//: uzipaste kwenye GitHub Releases ili links hizi zifanye kazi.
const RELEASES = 'https://github.com/MaestroRoot/homesiem-agent/releases/latest/download'
const AGENT_VERSION = '1.0.0'

const AGENT_DOWNLOADS = [
  { platform: 'Windows', icon: Monitor, ext: 'x64-setup.exe', desc: 'Windows 10 / 11 (64-bit)' },
  { platform: 'macOS', icon: Monitor, ext: 'x64.dmg', desc: 'macOS 12+ (Intel)' },
  { platform: 'Linux', icon: Monitor, ext: 'amd64.deb', desc: 'Debian / Ubuntu' },
]

function agentOnline(a: AgentRecord): boolean {
  return a.lastSeenAt ? Date.now() - new Date(a.lastSeenAt).getTime() < 30000 : false
}

function CopyBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 pr-10 text-[12px] leading-relaxed text-slate-100">{text}</pre>
      <button
        type="button"
        onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
        className="absolute right-2 top-2 rounded-md bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700"
        aria-label="Copy"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
  )
}

export default function Agents() {
  const [agents, setAgents] = useState<AgentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [label, setLabel] = useState('')
  const [token, setToken] = useState<SensorTokenCreated | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      setAgents(await api.get<AgentRecord[]>('/agents'))
    } catch {
      /* keep */
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
    const stop = pollWhenVisible(load, 12000)
    return () => stop()
  }, [])

  async function generate(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      setToken(await api.post<SensorTokenCreated>('/sensors/tokens', { label: label.trim() }))
      setLabel('')
    } catch (err) {
      setError(err instanceof ApiError ? (err.code === 'insufficient_role' ? 'Only the workspace owner can generate tokens.' : err.message) : 'Could not generate a token.')
    } finally {
      setBusy(false)
    }
  }

  async function removeAgent(a: AgentRecord) {
    if (!window.confirm(`Delete agent “${a.hostname}”? Its jobs, auto-collection streams and discovery schedules will be removed too. If the agent is still running on the host, stop it there as well.`)) return
    setAgents((rs) => rs.filter((x) => x.id !== a.id))
    try {
      await api.del(`/agents/${a.id}`)
    } catch (err) {
      setError(err instanceof ApiError ? (err.code === 'insufficient_role' ? 'Only an analyst or owner can delete agents.' : err.message) : 'Could not delete the agent.')
      load()
    }
  }

  const tok = token?.token ?? '<paste your token>'
  const agentCmd = `$env:HOMESIEM_URL="${API_ABS}"\n$env:HOMESIEM_SENSOR_TOKEN="${tok}"\n$env:PYTHONHTTPSVERIFY="0"\nirm ${DOWNLOAD_BASE}/agent.py -OutFile agent.py\npython agent.py`
  const resolverCmd = `$env:HOMESIEM_URL="${API_ABS}"\n$env:HOMESIEM_SENSOR_TOKEN="${tok}"\n$env:PYTHONHTTPSVERIFY="0"\nirm ${DOWNLOAD_BASE}/resolver.py -OutFile resolver.py\npython resolver.py`

  return (
    <div className="space-y-6">
      <PageHeader icon={Cpu} title="Agents" subtitle="Set up a host once. The agent enrolls and stays running, then you trigger scans, forensics, captures and log collection by clicking, no commands to repeat." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Agents" value={agents.length} sub="Enrolled hosts" icon={Cpu} />
        <StatCard label="Online" value={agents.filter(agentOnline).length} sub="Reporting now" icon={Radio} tone="green" />
        <StatCard label="Capabilities" value="6" sub="scan · forensics · logs · software · discovery" icon={ShieldCheck} />
      </div>

      {/* Step 0: download desktop app */}
      <SectionCard
        title="Download HomeSIEM Agent"
        description={`Desktop app (v${AGENT_VERSION}) for Windows, macOS and Linux. Install, paste your token, pick features, and it runs in the background automatically.`}
        right={<span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand-700">New</span>}
      >
        <div className="p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {AGENT_DOWNLOADS.map((d) => (
              <a
                key={d.platform}
                href={`${RELEASES}/HomeSIEM_${AGENT_VERSION}_${d.ext}`}
                target="_blank"
                rel="noreferrer"
                className="group flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-brand-400 hover:bg-brand-50/50"
              >
                <div className="flex items-center gap-2.5">
                  <d.icon size={20} className="text-brand-600" />
                  <span className="font-semibold text-slate-900">{d.platform}</span>
                </div>
                <span className="text-xs text-slate-500">{d.desc}</span>
                <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 group-hover:underline">
                  <Download size={13} /> Download .exe
                </span>
              </a>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            No Python needed — the app is a standalone installer. After installing, open it, paste the token from step 1 below, choose features (DNS, Forensics, Event Logs, Network, Software), and it will start with Windows.
          </p>
        </div>
      </SectionCard>

      {/* Step 1: token */}
      <SectionCard title="1. Generate a token" description="Create a token, then paste it into the setup command below." right={<KeyRound size={18} className="text-slate-400" />}>
        <form onSubmit={generate} className="flex flex-col gap-3 p-5 sm:flex-row">
          <input className="input flex-1" placeholder="Sensor name, e.g. Home Pi" value={label} onChange={(e) => setLabel(e.target.value)} />
          <button type="submit" className="btn-primary sm:w-48" disabled={busy}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />} Generate token
          </button>
        </form>
        {error && <div className="px-5 pb-4 text-sm text-red-700">{error}</div>}
        {token && (
          <div className="mx-5 mb-5 rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
            <p className="text-sm font-semibold text-emerald-800">✓ Token for “{token.label}” created, it is already filled into the command below. Just copy and run it on the host:</p>
            <div className="mt-3"><CopyBlock text={agentCmd} /></div>
            <p className="mt-2 text-xs text-emerald-700">The token is shown only once. It is also filled into the commands in steps 2 and 3 below.</p>
          </div>
        )}
      </SectionCard>

      {/* Step 2: install agent */}
      <SectionCard title="2. Use the desktop app" description="Run HomeSIEM Agent. It enrolls once and keeps running in the background.">
        <div className="space-y-3 p-5">
          <p className="text-sm text-slate-600"><span className="font-semibold">Recommended:</span> Download the app above, install it, open it, and paste your token. Choose the features you want and it will start with Windows automatically.</p>
          <p className="text-sm text-slate-600">For advanced users (or Linux servers), you can use the Python agent instead. You need <span className="font-semibold">Python 3</span> (python.org → “Add to PATH”). Then, for forensics, one dependency:</p>
          <CopyBlock text={`python -m pip install psutil`} />
          <p className="text-sm text-slate-600">Open <span className="font-semibold">PowerShell</span> (as administrator for full access) and paste this, it downloads the agent and runs it:</p>
          <CopyBlock text={agentCmd} />
          <p className="text-xs text-slate-500">It enrolls once and keeps running. After this, use the Vulnerability Scanner, Forensics, Live Capture and Log Collection pages to trigger work on this host by clicking, no more commands.</p>
        </div>
      </SectionCard>

      {/* Step 3: Cloudflare Gateway integration (per-org, set up in the app) */}
      <CloudflareGatewayCard />

      {/* Step 4: DNS resolver (advanced / self-hosted) */}
      <SectionCard title="4. Self-hosted DNS resolver (advanced, optional)" description="Alternative to NextDNS: run your own resolver on a host and point devices' DNS at it.">
        <div className="space-y-3 p-5">
          <CopyBlock text={resolverCmd} />
          <p className="text-xs text-slate-500">Then set the host's IP as the DNS server on the devices you want to monitor. Only works on your own LAN.</p>
        </div>
      </SectionCard>

      {/* enrolled agents */}
      <SectionCard title="Enrolled hosts" description={loading ? 'loading…' : `${agents.length} agent(s)`}>
        {loading && agents.length === 0 ? (
          <div className="grid place-items-center py-8 text-slate-400"><Loader2 size={18} className="animate-spin" /></div>
        ) : agents.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-400">No agents yet. Generate a token and run the command above on a host.</div>
        ) : (
          <TableWrap>
            <table className="table-base">
              <thead><tr><th>Host</th><th>IP</th><th>OS</th><th>Capabilities</th><th>Status</th><th>Last seen</th><th /></tr></thead>
              <tbody>
                {agents.map((a) => (
                  <tr key={a.id}>
                    <td className="font-semibold text-slate-900">{a.hostname}</td>
                    <td className="font-mono text-[12px] text-slate-500">{a.lastIp ?? '—'}</td>
                    <td className="text-slate-500">{a.os ?? '—'}</td>
                    <td className="text-xs text-slate-500">{a.capabilities.join(', ')}</td>
                    <td><StatusPill tone={agentOnline(a) ? 'green' : 'slate'}>{agentOnline(a) ? 'online' : 'offline'}</StatusPill></td>
                    <td className="whitespace-nowrap text-slate-500">{a.lastSeenAt ? new Date(a.lastSeenAt).toLocaleString() : '—'}</td>
                    <td>
                      <button type="button" onClick={() => removeAgent(a)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Delete agent ${a.hostname}`} title="Delete agent">
                        <Trash2 size={15} />
                      </button>
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
