import { useEffect, useState } from 'react'
import { AlertCircle, CalendarClock, CheckCircle2, Download, FileText, Loader2, Send, Trash2 } from 'lucide-react'
import { PageHeader, SectionCard, StatCard, StatusPill, cx } from '@/components/ui'
import { api } from '@/lib/api'
import type { MonitoredDevice, ReportSchedule, SecurityEventRow, SecurityScore, StatsOverview, VulnRecord } from '@/lib/types'

const templates = [
  { id: 'weekly', name: 'Weekly security summary', kind: 'weekly' },
  { id: 'monthly', name: 'Monthly security review', kind: 'monthly' },
  { id: 'exec', name: 'Executive report', kind: 'executive' },
  { id: 'incident', name: 'Incident report', kind: 'incident' },
]

interface Section {
  heading: string
  body: string
}

function buildSections(
  stats: StatsOverview,
  score: SecurityScore,
  events: SecurityEventRow[],
  devices: MonitoredDevice[],
  vulns: VulnRecord[],
): Section[] {
  const sections: Section[] = []

  sections.push({
    heading: 'Executive summary',
    body:
      `Security score: ${score.score}/100 (grade ${score.grade}). ${score.summary}\n` +
      `Total events: ${stats.totalEvents} (${stats.events24h} in the last 24h). ` +
      `Flagged: ${stats.flagged}. Devices: ${stats.activeDevices}/${stats.totalDevices} active. ` +
      `Unique domains: ${stats.uniqueDomains}, external IPs: ${stats.uniqueExternalIps}.`,
  })

  if (score.issues.length) {
    sections.push({
      heading: 'Issues affecting your score',
      body: score.issues.map((i) => `• [${i.severity}] ${i.title} (−${i.impact}). Fix: ${i.fix}`).join('\n'),
    })
  }

  sections.push({
    heading: 'Flagged indicators',
    body: stats.suspicious.length
      ? stats.suspicious.map((s) => `• ${s.indicator} [${s.verdict}] ${s.country ?? ''} — ${s.pulseCount} reports, seen ${s.count}×`).join('\n')
      : 'No indicators were flagged in this period.',
  })

  if (events.length) {
    sections.push({
      heading: 'Recent flagged events',
      body: events.slice(0, 15).map((e) => `• ${new Date(e.createdAt).toLocaleString()} — ${e.deviceName ?? e.srcIp} → ${e.domain ?? e.dstIp} [${e.verdict}]`).join('\n'),
    })
  }

  sections.push({
    heading: 'Devices',
    body: devices.length
      ? devices.map((d) => `• ${d.name} (${d.mac ?? d.lastIp ?? '—'}) — risk ${d.riskScore}, ${d.eventsCount} events`).join('\n')
      : 'No devices are being monitored yet.',
  })

  if (vulns.length) {
    sections.push({
      heading: 'Vulnerabilities',
      body: vulns.slice(0, 30).map((v) => `• [${v.severity}] ${v.target}:${v.port ?? ''} ${v.service ?? ''} — ${v.title}`).join('\n'),
    })
  }

  return sections
}

function reportHtml(title: string, period: string, sections: Section[]): string {
  const body = sections
    .map((s) => `<h2>${s.heading}</h2><pre style="white-space:pre-wrap;font-family:inherit">${s.body}</pre>`)
    .join('')
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
    <style>body{font-family:Segoe UI,Arial,sans-serif;max-width:820px;margin:40px auto;color:#0f172a;padding:0 20px}
    h1{font-size:22px}h2{font-size:15px;margin-top:24px;border-bottom:1px solid #e2e8f0;padding-bottom:4px}
    pre{font-size:13px;line-height:1.6;color:#334155}</style></head>
    <body><h1>${title}</h1><p style="color:#64748b">${period} · generated ${new Date().toLocaleString()}</p>${body}</body></html>`
}

function download(name: string, mime: string, content: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

function downloadHtml(title: string, period: string, sections: Section[]) {
  download(`${title.replace(/\s+/g, '-').toLowerCase()}.html`, 'text/html', reportHtml(title, period, sections))
}

function downloadCsv(title: string, sections: Section[]) {
  const rows = ['Section,Line']
  for (const s of sections) {
    for (const line of s.body.split('\n')) {
      rows.push(`"${s.heading.replace(/"/g, '""')}","${line.replace(/"/g, '""')}"`)
    }
  }
  download(`${title.replace(/\s+/g, '-').toLowerCase()}.csv`, 'text/csv', rows.join('\n'))
}

function printPdf(title: string, period: string, sections: Section[]) {
  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(reportHtml(title, period, sections))
  w.document.close()
  w.focus()
  setTimeout(() => w.print(), 300)
}

const RANGE_LABEL: Record<string, string> = { '24h': 'Last 24 hours', '7d': 'Last 7 days', '30d': 'Last 30 days', '90d': 'Last 90 days' }

export default function Reports() {
  const [template, setTemplate] = useState(templates[0]!.id)
  const [range, setRange] = useState('7d')
  const [toTeam, setToTeam] = useState(false)
  const [busy, setBusy] = useState(false)
  const [emailing, setEmailing] = useState(false)
  const [sections, setSections] = useState<Section[] | null>(null)
  const [result, setResult] = useState<{ sentTo: string[]; failed: string[] } | null>(null)
  const [error, setError] = useState('')

  const [schedules, setSchedules] = useState<ReportSchedule[]>([])
  const [schedFreq, setSchedFreq] = useState('weekly')
  const [schedTeam, setSchedTeam] = useState(false)

  async function loadSchedules() {
    try { setSchedules(await api.get<ReportSchedule[]>('/reports/schedules')) } catch { /* keep */ }
  }
  useEffect(() => { loadSchedules() }, [])

  async function addSchedule() {
    try {
      await api.post('/reports/schedules', { kind: chosen.kind, frequency: schedFreq, toWholeTeam: schedTeam, recipients: [] })
      await loadSchedules()
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not schedule.') }
  }
  async function removeSchedule(id: string) {
    await api.del(`/reports/schedules/${id}`)
    loadSchedules()
  }

  const chosen = templates.find((t) => t.id === template)!
  const period = RANGE_LABEL[range] ?? range

  async function generate(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const [stats, score, ev, devices, vulns] = await Promise.all([
        api.get<StatsOverview>('/stats/overview'),
        api.get<SecurityScore>('/stats/score'),
        api.get<{ items: SecurityEventRow[] }>('/events?onlyFlagged=true&limit=20'),
        api.get<{ items: MonitoredDevice[] }>('/devices'),
        api.get<VulnRecord[]>('/vulnerabilities'),
      ])
      setSections(buildSections(stats, score, ev.items, devices.items, vulns))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not build the report.')
    } finally {
      setBusy(false)
    }
  }

  async function email() {
    if (!sections) return
    setEmailing(true)
    setError('')
    try {
      const sent = await api.post<{ sentTo: string[]; failed: string[] }>('/reports/email', {
        kind: chosen.kind,
        period,
        toWholeTeam: toTeam,
        sections,
      })
      setResult({ sentTo: sent.sentTo, failed: sent.failed })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The report could not be emailed.')
    } finally {
      setEmailing(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={FileText} title="Reports" subtitle="Build a report from your real data, preview it, then download or email it." />

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <SectionCard title="Build a report" description="Pick a template and window">
          <form onSubmit={generate} className="space-y-5 p-5">
            <div>
              <span className="label">Template</span>
              <div className="grid gap-2">
                {templates.map((t) => (
                  <button key={t.id} type="button" onClick={() => setTemplate(t.id)} className={cx('rounded-lg border px-4 py-2.5 text-left text-sm font-semibold transition-all', template === t.id ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-700 hover:border-brand-300')}>
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label" htmlFor="range">Time range</label>
              <select id="range" className="input" value={range} onChange={(e) => setRange(e.target.value)}>
                {Object.entries(RANGE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600">
              <input type="checkbox" checked={toTeam} onChange={(e) => setToTeam(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
              Email to everyone in this workspace
            </label>
            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />} {busy ? 'Building…' : 'Generate preview'}
            </button>
            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle size={16} className="mt-0.5 shrink-0" /><span>{error}</span>
              </div>
            )}
          </form>
        </SectionCard>

        <SectionCard
          title={`${chosen.name} — preview`}
          description={period}
          right={sections && (
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-ghost btn-sm" onClick={() => printPdf(chosen.name, period, sections)}><Download size={13} /> PDF</button>
              <button type="button" className="btn-ghost btn-sm" onClick={() => downloadCsv(chosen.name, sections)}>CSV</button>
              <button type="button" className="btn-ghost btn-sm" onClick={() => downloadHtml(chosen.name, period, sections)}>HTML</button>
              <button type="button" className="btn-primary btn-sm" onClick={email} disabled={emailing}>
                {emailing ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Email
              </button>
            </div>
          )}
        >
          {!sections ? (
            <div className="grid place-items-center py-16 text-center text-sm text-slate-400">
              <div><FileText size={22} className="mx-auto mb-2 text-slate-300" />Click “Generate preview” to build the report from your data.</div>
            </div>
          ) : (
            <div className="space-y-5 p-5">
              {result && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  <p className="flex items-center gap-2 font-semibold"><CheckCircle2 size={16} /> Emailed to {result.sentTo.length} recipient(s)</p>
                  <p className="mt-1 text-xs text-emerald-700">{result.sentTo.join(', ')}</p>
                  {result.failed.length > 0 && <p className="mt-1 text-xs font-semibold text-red-600">Failed: {result.failed.join(', ')}</p>}
                </div>
              )}
              {sections.map((s) => (
                <div key={s.heading}>
                  <h3 className="border-b border-slate-100 pb-1 text-sm font-bold text-slate-900">{s.heading}</h3>
                  <pre className="mt-2 whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-slate-600">{s.body}</pre>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Scheduled reports"
        description="The server builds and emails these automatically on a recurring basis."
        right={<CalendarClock size={18} className="text-slate-400" />}
      >
        <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 p-5">
          <div>
            <label className="label">Template</label>
            <select className="input h-9 py-1 text-sm" value={template} onChange={(e) => setTemplate(e.target.value)}>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Every</label>
            <select className="input h-9 py-1 text-sm" value={schedFreq} onChange={(e) => setSchedFreq(e.target.value)}>
              {['daily', 'weekly', 'monthly'].map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 pb-2 text-sm text-slate-600">
            <input type="checkbox" checked={schedTeam} onChange={(e) => setSchedTeam(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
            Whole team
          </label>
          <button type="button" className="btn-primary btn-sm" onClick={addSchedule}><CalendarClock size={14} /> Schedule</button>
        </div>
        {schedules.length === 0 ? (
          <div className="px-5 py-6 text-center text-sm text-slate-400">No scheduled reports yet.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {schedules.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900 capitalize">{s.kind} · {s.frequency}</p>
                  <p className="text-xs text-slate-500">{s.toWholeTeam ? 'Whole team' : `${s.recipients.length} recipient(s)`} · next {new Date(s.nextRunAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill tone={s.enabled ? 'green' : 'slate'}>{s.enabled ? 'active' : 'off'}</StatusPill>
                  <button type="button" onClick={() => removeSchedule(s.id)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Templates" value={templates.length} sub="Ready to build" icon={FileText} />
        <StatCard label="Download" value="PDF/CSV/HTML" sub="Export formats" icon={Download} tone="green" />
        <StatCard label="Scheduled" value={schedules.length} sub="Auto-delivered" icon={CalendarClock} />
      </div>
    </div>
  )
}
