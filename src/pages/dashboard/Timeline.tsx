import { useEffect, useMemo, useState } from 'react'
import { Clock, Download, Loader2 } from 'lucide-react'
import { EmptyState, PageHeader, SectionCard, StatusPill, cx } from '@/components/ui'
import { api } from '@/lib/api'
import type { SecurityEventRow, Verdict } from '@/lib/types'

function exportCsv(events: SecurityEventRow[]) {
  const rows = ['Time,Source,Kind,Indicator,Verdict,Country,ASN']
  for (const e of events) {
    const cells = [
      new Date(e.createdAt).toISOString(),
      e.deviceName ?? e.srcIp ?? '',
      e.kind,
      e.domain ?? e.dstIp ?? '',
      e.verdict,
      e.country ?? '',
      e.asnOrg ?? '',
    ].map((c) => `"${String(c).replace(/"/g, '""')}"`)
    rows.push(cells.join(','))
  }
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `timeline-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const verdictTone: Record<Verdict, 'red' | 'amber' | 'green' | 'slate'> = {
  malicious: 'red',
  suspicious: 'amber',
  clean: 'green',
  unknown: 'slate',
}
const dotColor: Record<Verdict, string> = {
  malicious: 'bg-red-500',
  suspicious: 'bg-amber-500',
  clean: 'bg-emerald-500',
  unknown: 'bg-slate-300',
}

export default function Timeline() {
  const [events, setEvents] = useState<SecurityEventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [onlyFlagged, setOnlyFlagged] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const q = onlyFlagged ? '?onlyFlagged=true&limit=200' : '?limit=200'
        const res = await api.get<{ items: SecurityEventRow[] }>(`/events${q}`)
        if (active) setEvents(res.items)
      } catch {
        /* keep */
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    const t = setInterval(load, 8000)
    return () => {
      active = false
      clearInterval(t)
    }
  }, [onlyFlagged])

  // Group by day so a long feed stays readable.
  const groups = useMemo(() => {
    const map = new Map<string, SecurityEventRow[]>()
    for (const e of events) {
      const day = new Date(e.createdAt).toLocaleDateString()
      const arr = map.get(day) ?? []
      arr.push(e)
      map.set(day, arr)
    }
    return [...map.entries()]
  }, [events])

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Clock}
        title="Timeline"
        subtitle="Every event your collectors reported, in the order it happened, newest first."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOnlyFlagged(false)}
              className={cx('rounded-md px-2.5 py-1 text-xs font-semibold', !onlyFlagged ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600')}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setOnlyFlagged(true)}
              className={cx('rounded-md px-2.5 py-1 text-xs font-semibold', onlyFlagged ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600')}
            >
              Flagged
            </button>
            <button type="button" onClick={() => exportCsv(events)} disabled={events.length === 0} className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 disabled:opacity-50">
              <Download size={13} /> CSV
            </button>
          </div>
        }
      />

      {loading && events.length === 0 ? (
        <div className="grid place-items-center py-20 text-slate-400">
          <Loader2 size={22} className="animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={Clock}
            title="Nothing on the timeline yet"
            message="As your sensor reports DNS lookups and connections, they appear here chronologically."
          />
        </SectionCard>
      ) : (
        groups.map(([day, rows]) => (
          <SectionCard key={day} title={day} description={`${rows.length} events`}>
            <ol className="relative ml-4 border-l border-slate-200">
              {rows.map((e) => (
                <li key={e.id} className="relative py-2.5 pl-6">
                  <span className={cx('absolute -left-[5px] top-4 h-2.5 w-2.5 rounded-full ring-2 ring-white', dotColor[e.verdict])} />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] text-slate-400">{new Date(e.createdAt).toLocaleTimeString()}</span>
                    <StatusPill tone={verdictTone[e.verdict]}>{e.verdict}</StatusPill>
                    <span className="text-[11px] uppercase text-slate-400">{e.kind}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-700">
                    <span className="font-mono font-semibold text-slate-600">{e.deviceName ?? e.srcIp ?? 'device'}</span>
                    {e.kind === 'dns' ? ' looked up ' : ' connected to '}
                    <span className="font-mono font-semibold text-slate-900">{e.domain ?? e.dstIp}</span>
                    {(e.country || e.asnOrg) && (
                      <span className="text-slate-400"> · {[e.country, e.asnOrg].filter(Boolean).join(', ')}</span>
                    )}
                  </p>
                </li>
              ))}
            </ol>
          </SectionCard>
        ))
      )}
    </div>
  )
}
