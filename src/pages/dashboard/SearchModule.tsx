import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Clock, Loader2, Search as SearchIcon, Star, X } from 'lucide-react'
import { EmptyState, PageHeader, SectionCard, StatusPill, TableWrap } from '@/components/ui'
import { api } from '@/lib/api'
import type { SearchResults, Verdict } from '@/lib/types'

const verdictTone: Record<Verdict, 'red' | 'amber' | 'green' | 'slate'> = {
  malicious: 'red',
  suspicious: 'amber',
  clean: 'green',
  unknown: 'slate',
}

const RECENT_KEY = 'homesiem-search-recent'
const SAVED_KEY = 'homesiem-search-saved'
const readList = (k: string): string[] => { try { return JSON.parse(localStorage.getItem(k) ?? '[]') } catch { return [] } }

export default function SearchModule() {
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [busy, setBusy] = useState(false)
  const [recent, setRecent] = useState<string[]>(() => readList(RECENT_KEY))
  const [saved, setSaved] = useState<string[]>(() => readList(SAVED_KEY))

  async function run(query: string) {
    const v = query.trim()
    if (!v) return
    setBusy(true)
    setRecent((r) => {
      const next = [v, ...r.filter((x) => x !== v)].slice(0, 10)
      localStorage.setItem(RECENT_KEY, JSON.stringify(next))
      return next
    })
    try {
      setResults(await api.get<SearchResults>(`/search?q=${encodeURIComponent(v)}`))
    } catch {
      setResults(null)
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

  return (
    <div className="space-y-6">
      <PageHeader icon={SearchIcon} title="Search" subtitle="Search across every event and device, by domain, IP, MAC or device name." />

      <SectionCard>
        <form onSubmit={submit} className="flex flex-col gap-3 p-5 sm:flex-row">
          <div className="relative flex-1">
            <SearchIcon size={16} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" />
            <input className="input pl-10 font-mono" placeholder="github.com · 192.168.1.4 · Samson" value={q} onChange={(e) => setQ(e.target.value)} />
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

        {(saved.length > 0 || recent.length > 0) && (
          <div className="space-y-2 border-t border-slate-100 px-5 py-3">
            {saved.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500"><Star size={12} /> Saved:</span>
                {saved.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-mono text-amber-700 ring-1 ring-amber-200">
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

      {results && (
        <>
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
              <EmptyState icon={SearchIcon} title="No matches" message={`Nothing matched “${results.query}”. Try a domain, an IP, or a device name.`} />
            ) : (
              <TableWrap>
                <table className="table-base">
                  <thead><tr><th>Time</th><th>Source</th><th>Domain / Destination</th><th>Verdict</th><th>Location</th></tr></thead>
                  <tbody>
                    {results.events.map((e) => (
                      <tr key={e.id}>
                        <td className="whitespace-nowrap text-slate-500">{new Date(e.createdAt).toLocaleString()}</td>
                        <td className="font-mono text-[12px] text-slate-600">{e.deviceName ?? e.srcIp ?? '—'}</td>
                        <td className="max-w-xs truncate font-mono text-[12px] font-semibold text-slate-900">{e.domain ?? e.dstIp ?? '—'}</td>
                        <td><StatusPill tone={verdictTone[e.verdict]}>{e.verdict}</StatusPill></td>
                        <td className="whitespace-nowrap text-slate-500">{[e.country, e.asnOrg].filter(Boolean).join(' · ') || '—'}</td>
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
