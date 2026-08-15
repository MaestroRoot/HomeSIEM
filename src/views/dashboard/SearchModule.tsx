import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BarChart3, Clock, Loader2, Search as SearchIcon, Star, X } from 'lucide-react'
import { EmptyState, PageHeader, SectionCard, StatusPill, TableWrap } from '@/components/ui'
import SortableCardGrid from '@/components/dashboard/SortableCards'
import { api } from '@/lib/api'
import type { SearchResults, SecurityEventRow, Verdict } from '@/lib/types'

const verdictTone: Record<Verdict, 'red' | 'amber' | 'green' | 'slate'> = {
  malicious: 'red',
  suspicious: 'amber',
  clean: 'green',
  unknown: 'slate',
}

const RECENT_KEY = 'homesiem-search-recent'
const SAVED_KEY = 'homesiem-search-saved'
const readList = (k: string): string[] => { try { return JSON.parse(localStorage.getItem(k) ?? '[]') } catch { return [] } }

const EXAMPLES = [
  'verdict:malicious',
  'severity:high',
  'domain:evil.com',
  'src_ip:192.168.1.5',
  'country:RU',
  'user:samson',
  'process:powershell',
  'after:2026-08-01 has:process',
  'domain:evil.com severity:high -verdict:unknown',
]

const FIELDS: { key: string; label: string; hint: string }[] = [
  { key: 'ip', label: 'IP', hint: 'src_ip au dst_ip' },
  { key: 'src_ip', label: 'Source IP', hint: '192.168.1.5' },
  { key: 'dst_ip', label: 'Dest IP', hint: '185.220.101.4' },
  { key: 'host', label: 'Device', hint: 'hans-laptop' },
  { key: 'domain', label: 'Domain', hint: 'evil.com' },
  { key: 'verdict', label: 'Verdict', hint: 'malicious / suspicious / clean' },
  { key: 'severity', label: 'Severity', hint: 'critical / high / medium / low / info' },
  { key: 'kind', label: 'Kind', hint: 'dns | flow' },
  { key: 'user', label: 'Account', hint: 'samson' },
  { key: 'process', label: 'Process', hint: 'powershell' },
  { key: 'after', label: 'After', hint: '2026-08-01 au epoch' },
  { key: 'before', label: 'Before', hint: 'ISO date au epoch' },
  { key: 'has', label: 'Has raw field', hint: 'process | file | command | geo' },
]

function target(e: SecurityEventRow): string {
  return e.domain ?? e.dstIp ?? '—'
}

export default function SearchModule() {
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [busy, setBusy] = useState(false)
  const [recent, setRecent] = useState<string[]>(() => readList(RECENT_KEY))
  const [saved, setSaved] = useState<string[]>(() => readList(SAVED_KEY))
  const [error, setError] = useState<string | null>(null)

  async function run(query: string) {
    const v = query.trim()
    if (!v) return
    setBusy(true)
    setError(null)
    setRecent((r) => {
      const next = [v, ...r.filter((x) => x !== v)].slice(0, 10)
      localStorage.setItem(RECENT_KEY, JSON.stringify(next))
      return next
    })
    try {
      setResults(await api.get<SearchResults>(`/search?q=${encodeURIComponent(v)}`))
    } catch {
      setResults(null)
      setError('Search failed. Check that the backend is reachable.')
    } finally {
      setBusy(false)
    }
  }

  function toggleSaved(query: string) {
    setSaved((s) => {
      const next = s.includes(query) ? s.filter((x) => x !== query) : [query, ...s].slice(0, 20)
      localStorage.setItem(SAVED_KEY, JSON.stringify(next))
      return next
    })
  }

  useEffect(() => {
    const initial = params.get('q')
    if (initial) run(initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setParams(q.trim() ? { q: q.trim() } : {})
    run(q)
  }

  const breakdown = useMemo(() => {
    if (!results || !results.breakdown) return []
    return Object.entries(results.breakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
  }, [results])
  const maxBreakdown = Math.max(...breakdown.map(([, n]) => n), 1)

  return (
    <div className="space-y-6">
      <PageHeader icon={SearchIcon} title="Search" subtitle="Query across every event and device using the SIEM query language — field filters, negation and time windows." />

      <SectionCard>
        <form onSubmit={submit} className="flex flex-col gap-3 p-5 sm:flex-row">
          <div className="relative flex-1">
            <SearchIcon size={16} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" />
            <input className="input pl-10 font-mono" placeholder='domain:evil.com severity:high src_ip:192.168.1.5 after:2026-08-01' value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary sm:w-32" disabled={busy}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : <SearchIcon size={15} />} Search
          </button>
          {q.trim() && (
            <button type="button" onClick={() => toggleSaved(q.trim())} className="btn-ghost sm:w-auto" title={saved.includes(q.trim()) ? 'Unsave' : 'Save search'}>
              <Star size={15} className={saved.includes(q.trim()) ? 'fill-amber-400 text-amber-400' : ''} />
            </button>
          )}
        </form>

        <div className="border-t border-slate-100 px-5 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Examples</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {EXAMPLES.map((ex) => (
              <button key={ex} type="button" onClick={() => { setQ(ex); setParams({ q: ex }); run(ex) }} className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-600 hover:bg-brand-100 hover:text-brand-700">
                {ex}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-x-6 gap-y-1.5 border-t border-slate-100 px-5 py-3 sm:grid-cols-2 lg:grid-cols-3">
          {FIELDS.map((f) => (
            <div key={f.key} className="flex items-center gap-2 text-xs">
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono font-semibold text-brand-700">{f.key}:</code>
              <span className="text-slate-500">{f.hint}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 text-xs">
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono font-semibold text-brand-700">-field:value</code>
            <span className="text-slate-500">exclude (e.g. -verdict:unknown)</span>
          </div>
        </div>

        {(saved.length > 0 || recent.length > 0) && (
          <div className="space-y-2 border-t border-slate-100 px-5 py-3">
            {saved.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500"><Star size={12} /> Saved:</span>
                {saved.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 font-mono text-[11px] text-amber-700 ring-1 ring-amber-200">
                    <button type="button" onClick={() => { setQ(s); setParams({ q: s }); run(s) }} className="hover:underline">{s}</button>
                    <button type="button" onClick={() => toggleSaved(s)} aria-label="Unsave"><X size={11} /></button>
                  </span>
                ))}
              </div>
            )}
            {recent.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500"><Clock size={12} /> Recent:</span>
                {recent.map((s) => (
                  <button key={s} type="button" onClick={() => { setQ(s); setParams({ q: s }); run(s) }} className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-600 hover:bg-brand-100 hover:text-brand-700">{s}</button>
                ))}
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {error && <p className="text-sm text-red-700">{error}</p>}

      {results && (
        <>
          <SortableCardGrid
            pageKey="search.kpis"
            cols="sm:grid-cols-3"
            maxCols={3}
            cards={[
              { id: 'events', label: 'Events', node: <StatCardMini label="Events" value={results.events.length} /> },
              { id: 'devices', label: 'Devices', node: <StatCardMini label="Devices" value={results.devices.length} /> },
              { id: 'took', label: 'Took', node: <StatCardMini label="Took" value={`${results.tookMs} ms`} /> },
            ]}
          />

          {breakdown.length > 0 && (
            <SectionCard title="Breakdown" description="Matches by verdict / severity, top categories first">
              <div className="space-y-2.5 p-5">
                {breakdown.map(([label, count]) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="w-32 truncate text-sm capitalize text-slate-600">{label.replace(/_/g, ' ')}</span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${(count / maxBreakdown) * 100}%` }} />
                    </div>
                    <span className="w-12 text-right font-mono text-xs text-slate-500">{count}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {results.devices.length > 0 && (
            <SectionCard title="Devices" description={`${results.devices.length} matched`}>
              <TableWrap>
                <table className="table-base">
                  <thead><tr><th>Name</th><th>MAC</th><th>IP</th><th>Events</th><th>Risk</th></tr></thead>
                  <tbody>
                    {results.devices.map((d) => (
                      <tr key={d.id}>
                        <td className="font-semibold text-slate-900">{d.name}</td>
                        <td className="font-mono text-[12px] text-slate-500">{d.mac ?? '—'}</td>
                        <td className="font-mono text-[12px]">{d.lastIp ?? '—'}</td>
                        <td className="tabular-nums">{d.eventsCount}</td>
                        <td className="tabular-nums">{d.riskScore}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            </SectionCard>
          )}

          <SectionCard title="Events" description={`${results.events.length} matched`}>
            {results.events.length === 0 && results.devices.length === 0 ? (
              <EmptyState icon={BarChart3} title="No matches" message={`Nothing matched “${results.query}”. Try a field filter or a broader free-text term.`} />
            ) : (
              <TableWrap>
                <table className="table-base">
                  <thead><tr><th>Time</th><th>Device / Source</th><th>Type</th><th>Domain / Destination</th><th>Account</th><th>Process</th><th>Verdict</th></tr></thead>
                  <tbody>
                    {results.events.map((e) => (
                      <tr key={e.id}>
                        <td className="whitespace-nowrap text-slate-500">{new Date(e.createdAt).toLocaleString()}</td>
                        <td className="font-mono text-[12px] text-slate-600">{e.deviceName ?? e.srcIp ?? '—'}</td>
                        <td className="text-[11px] uppercase text-slate-500">{e.eventType ?? e.kind}</td>
                        <td className="max-w-xs truncate font-mono text-[12px] font-semibold text-slate-900">{target(e)}</td>
                        <td className="font-mono text-[12px] text-slate-600">{e.account ?? '—'}</td>
                        <td className="max-w-[180px] truncate font-mono text-[12px] text-slate-600">{e.processName ?? '—'}</td>
                        <td><StatusPill tone={verdictTone[e.verdict]}>{e.verdict}</StatusPill></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            )}
          </SectionCard>
        </>
      )}
    </div>
  )
}

function StatCardMini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-4">
      <p className="truncate text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
    </div>
  )
}
