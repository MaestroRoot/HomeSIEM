import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, Download, FolderPlus, Loader2, Siren } from 'lucide-react'
import { AiPanel, EmptyState, PageHeader, SectionCard, StatCard, StatusPill, cx } from '@/components/ui'
import { api } from '@/lib/api'
import { pollWhenVisible } from '@/lib/usePolling'
import type { IncidentRecord, SecurityEventRow, Verdict } from '@/lib/types'

const verdictTone: Record<Verdict, 'red' | 'amber' | 'green' | 'slate'> = {
  malicious: 'red',
  suspicious: 'amber',
  clean: 'green',
  unknown: 'slate',
}

function indicatorOf(e: SecurityEventRow) {
  return e.domain ?? e.dstIp ?? '—'
}
function sourceOf(e: SecurityEventRow) {
  return e.deviceName ?? e.srcIp ?? 'unknown device'
}

function explain(e: SecurityEventRow): string {
  const verb = e.kind === 'dns' ? 'looked up' : 'connected to'
  const loc = [e.country, e.asnOrg].filter(Boolean).join(', ')
  return (
    `${sourceOf(e)} ${verb} ${indicatorOf(e)}${loc ? ` (${loc})` : ''}, which appears in ` +
    `${e.pulseCount} OTX threat report(s) and is not on any allow-list. ` +
    `Being referenced in a report is a strong lead, not definitive proof, corroborate before acting.`
  )
}

export default function Alerts() {
  const navigate = useNavigate()
  const [items, setItems] = useState<SecurityEventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<SecurityEventRow | null>(null)
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const res = await api.get<{ items: SecurityEventRow[] }>('/events?onlyFlagged=true&limit=200')
        if (!active) return
        setItems(res.items)
        setSelected((s) => s ?? res.items[0] ?? null)
      } catch {
        /* keep */
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    const stop = pollWhenVisible(load, 15000)
    return () => {
      active = false
      stop()
    }
  }, [])

  const counts = useMemo(
    () => ({
      malicious: items.filter((a) => a.verdict === 'malicious').length,
      suspicious: items.filter((a) => a.verdict === 'suspicious').length,
    }),
    [items],
  )

  const selEvents = useMemo(() => items.filter((e) => sel.has(e.id)), [items, sel])

  function toggle(id: string) {
    setSel((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }
  const allShownSelected = items.length > 0 && items.every((e) => sel.has(e.id))
  function toggleAll() {
    setSel(allShownSelected ? new Set() : new Set(items.map((e) => e.id)))
  }

  function exportSelected() {
    const rows = selEvents.length ? selEvents : items
    const head = ['time', 'verdict', 'source', 'indicator', 'kind', 'otxReports', 'country', 'asnOrg']
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
    const lines = rows.map((e) =>
      [
        new Date(e.createdAt).toISOString(),
        e.verdict,
        sourceOf(e),
        indicatorOf(e),
        e.kind,
        String(e.pulseCount),
        e.country ?? '',
        e.asnOrg ?? '',
      ]
        .map(esc)
        .join(','),
    )
    const csv = [head.join(','), ...lines].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `alerts-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function createIncident() {
    if (selEvents.length === 0) return
    setCreating(true)
    try {
      const worst = selEvents.some((e) => e.verdict === 'malicious') ? 'high' : 'medium'
      const indicators = [...new Set(selEvents.map(indicatorOf))].slice(0, 6)
      const title =
        selEvents.length === 1
          ? `Flagged: ${indicatorOf(selEvents[0]!)}`
          : `${selEvents.length} flagged events across ${new Set(selEvents.map(sourceOf)).size} device(s)`
      const summary =
        `Opened from ${selEvents.length} flagged event(s). Indicators: ${indicators.join(', ')}. ` +
        `Sources: ${[...new Set(selEvents.map(sourceOf))].join(', ')}.`
      await api.post<IncidentRecord>('/incidents', { title, severity: worst, summary })
      setSel(new Set())
      navigate('/dashboard/incidents')
    } catch {
      /* ignore */
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Siren}
        title="Live Alert Center"
        subtitle="Every flagged event, newest first. These are devices that contacted an indicator threat intelligence knows about."
        actions={<Link to="/dashboard/alerts/integrations" className="btn-soft btn-sm">Integrations</Link>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Malicious" value={counts.malicious} sub="Act immediately" icon={Siren} tone="red" />
        <StatCard label="Suspicious" value={counts.suspicious} sub="Review these" icon={Siren} tone="amber" />
        <StatCard label="Total flagged" value={items.length} sub="Across all devices" icon={Siren} />
        <StatCard label="Sources" value={new Set(items.map(sourceOf)).size} sub="Distinct devices" icon={Siren} tone="slate" />
      </div>

      {loading && items.length === 0 ? (
        <div className="grid place-items-center py-20 text-slate-400">
          <Loader2 size={22} className="animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={Siren}
            title="No alerts, and that is good"
            message="Nothing your devices contacted matched threat intelligence. Flagged events appear here the moment a device looks up or connects to a known-bad indicator."
          />
        </SectionCard>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <SectionCard
            title="Flagged events"
            description={sel.size ? `${sel.size} selected` : `${items.length} shown`}
            right={
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={toggleAll} className="btn-ghost btn-sm" title="Select all shown">
                  {allShownSelected ? 'Clear' : 'All'}
                </button>
                <button type="button" onClick={exportSelected} className="btn-ghost btn-sm" title="Export selected (or all) as CSV">
                  <Download size={14} /> CSV
                </button>
                <button
                  type="button"
                  onClick={createIncident}
                  disabled={sel.size === 0 || creating}
                  className="btn-soft btn-sm disabled:cursor-not-allowed disabled:opacity-50"
                  title="Open an incident from the selected events"
                >
                  {creating ? <Loader2 size={14} className="animate-spin" /> : <FolderPlus size={14} />} Incident
                </button>
              </div>
            }
          >
            <ul className="max-h-[720px] divide-y divide-slate-100 overflow-y-auto">
              {items.map((a) => (
                <li key={a.id} className={cx('flex items-start', selected?.id === a.id ? 'bg-brand-50' : sel.has(a.id) ? 'bg-amber-50/50' : 'hover:bg-slate-50')}>
                  <label className="flex cursor-pointer items-center pl-4 pt-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={sel.has(a.id)}
                      onChange={() => toggle(a.id)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setSelected(a)}
                    className="flex w-full items-start gap-2 px-4 py-3.5 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <StatusPill tone={verdictTone[a.verdict]}>{a.verdict}</StatusPill>
                        <span className="font-mono text-[11px] text-slate-400">
                          {new Date(a.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="mt-1.5 truncate font-mono text-sm font-semibold text-slate-900">{indicatorOf(a)}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {sourceOf(a)} · {a.kind}
                      </p>
                    </div>
                    <ChevronRight size={16} className={cx('mt-1 shrink-0', selected?.id === a.id ? 'text-brand-600' : 'text-slate-300')} />
                  </button>
                </li>
              ))}
            </ul>
          </SectionCard>

          {selected && (
            <div className="space-y-6">
              <SectionCard>
                <div className="border-b border-slate-100 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill tone={verdictTone[selected.verdict]}>{selected.verdict}</StatusPill>
                    <span className="chip bg-brand-50 uppercase text-brand-700 ring-1 ring-brand-200">{selected.kind}</span>
                  </div>
                  <h2 className="mt-2 break-all font-mono text-lg font-bold text-slate-900">{indicatorOf(selected)}</h2>

                  <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {[
                      ['Source', sourceOf(selected)],
                      ['OTX reports', String(selected.pulseCount)],
                      ['Location', [selected.country, selected.asnOrg].filter(Boolean).join(', ') || '—'],
                      ['Seen', new Date(selected.createdAt).toLocaleString()],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{k}</dt>
                        <dd className="mt-0.5 break-words font-mono text-sm font-semibold text-slate-800">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div className="p-5">
                  <AiPanel title="What this means">
                    <p>{explain(selected)}</p>
                  </AiPanel>
                </div>
              </SectionCard>

              <SectionCard title="Recommended actions" description="In priority order">
                <ol className="divide-y divide-slate-100">
                  {[
                    `Block ${indicatorOf(selected)} at your gateway or DNS resolver.`,
                    `Check whether other devices also contacted ${indicatorOf(selected)}.`,
                    `Investigate ${sourceOf(selected)} for how it reached this indicator (a link, an app, or an ad).`,
                    'Corroborate with a second source before treating it as confirmed malicious.',
                  ].map((r, i) => (
                    <li key={i} className="flex gap-3 px-5 py-3 text-sm text-slate-700">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-600 text-[11px] font-bold text-white">
                        {i + 1}
                      </span>
                      {r}
                    </li>
                  ))}
                </ol>
              </SectionCard>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
