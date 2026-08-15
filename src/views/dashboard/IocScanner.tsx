import { useRef, useState } from 'react'
import { Fingerprint, Globe2, Layers, Loader2, Search, UploadCloud } from 'lucide-react'
import { PageHeader, SectionCard, StatCard, StatusPill, TableWrap, cx } from '@/components/ui'
import SortableCardGrid from '@/components/dashboard/SortableCards'
import { api, ApiError } from '@/lib/api'
import type { IntelResult, Verdict } from '@/lib/types'

const verdictTone: Record<Verdict, 'red' | 'amber' | 'green' | 'slate'> = {
  malicious: 'red',
  suspicious: 'amber',
  clean: 'green',
  unknown: 'slate',
}

export default function IocScanner() {
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<IntelResult | null>(null)
  const [history, setHistory] = useState<IntelResult[]>([])
  const [bulkText, setBulkText] = useState('')
  const [bulkBusy, setBulkBusy] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const fileRef = useRef<HTMLInputElement>(null)

  async function bulkScan() {
    const items = [...new Set(
      bulkText.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean),
    )].slice(0, 200)
    if (items.length === 0 || bulkBusy) return
    setBulkBusy(true)
    setProgress({ done: 0, total: items.length })
    let done = 0
    // Concurrency ya 3 ili tusizidishe OTX.
    const queue = [...items]
    async function worker() {
      while (queue.length) {
        const v = queue.shift()!
        try {
          const found = await api.get<IntelResult>(`/intel/lookup?value=${encodeURIComponent(v)}`)
          setHistory((h) => [found, ...h.filter((x) => x.indicator !== found.indicator)].slice(0, 300))
        } catch { /* skip one */ }
        done += 1
        setProgress({ done, total: items.length })
      }
    }
    await Promise.all([worker(), worker(), worker()])
    setBulkBusy(false)
    setBulkText('')
  }

  function onFile(f: File | undefined) {
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => setBulkText((t) => (t ? t + '\n' : '') + String(reader.result))
    reader.readAsText(f)
  }

  async function scan(e: React.FormEvent) {
    e.preventDefault()
    const v = query.trim()
    if (!v || busy) return
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const found = await api.get<IntelResult>(`/intel/lookup?value=${encodeURIComponent(v)}`)
      setResult(found)
      setHistory((h) => [found, ...h.filter((x) => x.indicator !== found.indicator)].slice(0, 50))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'The lookup failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const geoLine = (r: IntelResult) => {
    const g = r.geo
    if (!g) return null
    if (g.isPrivate) return 'Private / local address'
    return [g.city, g.country, g.asn ? `AS${g.asn} ${g.asnOrg ?? ''}`.trim() : null]
      .filter(Boolean)
      .join(' · ')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Fingerprint}
        title="IOC Scanner"
        subtitle="Check an IP, domain, URL or file hash against AlienVault OTX threat intelligence, IPs are also located with MaxMind GeoIP."
      />

      <SortableCardGrid
        pageKey="ioc.kpis"
        cols="sm:grid-cols-2 lg:grid-cols-4"
        maxCols={4}
        cards={[
          { id: 'lookups', label: 'Lookups this session', node: <StatCard label="Lookups this session" value={history.length} sub="IPs, domains, URLs, hashes" icon={Search} /> },
          { id: 'flagged', label: 'Flagged', node: <StatCard label="Flagged" value={history.filter((h) => h.verdict === 'malicious' || h.verdict === 'suspicious').length} sub="Suspicious or worse" icon={Fingerprint} tone="red" /> },
          { id: 'clean', label: 'On allow-lists', node: <StatCard label="On allow-lists" value={history.filter((h) => h.verdict === 'clean').length} sub="Known-legitimate" icon={Fingerprint} tone="green" /> },
          { id: 'located', label: 'Located', node: <StatCard label="Located" value={history.filter((h) => h.geo && !h.geo.isPrivate).length} sub="With a country / ASN" icon={Globe2} /> },
        ]}
      />

      <SectionCard title="Scan an indicator" description="Paste an IP, domain, URL, SHA256 or MD5, the type is detected automatically">
        <form onSubmit={scan} className="flex flex-col gap-3 p-5 sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" />
            <input
              className="input pl-10 font-mono"
              placeholder="185.234.218.44 · example.com · e3b0c442…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary sm:w-40" disabled={busy}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            {busy ? 'Scanning…' : 'Scan'}
          </button>
        </form>

        <div className="flex flex-wrap gap-2 border-t border-slate-100 px-5 py-3">
          <span className="text-xs font-semibold text-slate-500">Try:</span>
          {['185.234.218.44', '8.8.8.8', 'example.com', 'github.com'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setQuery(s)}
              className="max-w-[220px] truncate rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-600 hover:bg-brand-100 hover:text-brand-700"
            >
              {s}
            </button>
          ))}
        </div>

        {error && (
          <div className="border-t border-red-200 bg-red-50/60 px-5 py-3 text-sm text-red-700">{error}</div>
        )}

        {result && (
          <div
            className={cx(
              'animate-fade-up border-t px-5 py-5',
              result.verdict === 'malicious'
                ? 'border-red-200 bg-red-50/50'
                : result.verdict === 'suspicious'
                  ? 'border-amber-200 bg-amber-50/50'
                  : result.verdict === 'clean'
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : 'border-slate-200 bg-slate-50/50',
            )}
          >
            <div className="flex flex-wrap items-center gap-3">
              <StatusPill tone={verdictTone[result.verdict]}>{result.verdict}</StatusPill>
              <span className="chip bg-brand-50 uppercase text-brand-700 ring-1 ring-brand-200">{result.type}</span>
              <span className="break-all font-mono text-sm font-semibold text-slate-800">{result.indicator}</span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                ['OTX reports', String(result.pulseCount)],
                ['First seen', result.firstSeen ? result.firstSeen.slice(0, 10) : '—'],
                ['Location', geoLine(result) ?? '—'],
                ['Tags', result.tags.length ? result.tags.slice(0, 3).join(', ') : 'none'],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{k}</dt>
                  <dd className="mt-0.5 break-words text-sm font-semibold text-slate-800">{v}</dd>
                </div>
              ))}
            </dl>
            {result.rationale && (
              <p className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                {result.rationale}
              </p>
            )}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Bulk check" description="Paste a list (one per line, or comma-separated) or upload a CSV. Up to 200 at a time." right={<Layers size={18} className="text-slate-400" />}>
        <div className="space-y-3 p-5">
          <textarea
            className="input min-h-[110px] font-mono text-[12px]"
            placeholder={'185.234.218.44\nexample.com\n5d41402abc4b2a76b9719d911017c592'}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
          />
          <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn-primary" onClick={bulkScan} disabled={bulkBusy || !bulkText.trim()}>
              {bulkBusy ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
              {bulkBusy ? `Checking ${progress.done}/${progress.total}…` : 'Check all'}
            </button>
            <button type="button" className="btn-ghost" onClick={() => fileRef.current?.click()}>
              <UploadCloud size={15} /> Upload CSV
            </button>
            {bulkText && !bulkBusy && <button type="button" className="btn-ghost" onClick={() => setBulkText('')}>Clear</button>}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Lookup history" description="Indicators checked in this session">
        <TableWrap>
          <table className="table-base">
            <thead>
              <tr>
                <th>Indicator</th>
                <th>Type</th>
                <th>Verdict</th>
                <th>OTX reports</th>
                <th>Location</th>
                <th>Tags</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-400">
                    No lookups yet. Scan an indicator above to begin.
                  </td>
                </tr>
              ) : (
                history.map((i) => (
                  <tr key={i.indicator}>
                    <td className="max-w-xs truncate font-mono text-[12px] font-semibold">{i.indicator}</td>
                    <td className="uppercase text-slate-500">{i.type}</td>
                    <td>
                      <StatusPill tone={verdictTone[i.verdict]}>{i.verdict}</StatusPill>
                    </td>
                    <td className="tabular-nums">{i.pulseCount}</td>
                    <td className="text-slate-500">{geoLine(i) ?? '—'}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {i.tags.slice(0, 3).map((t) => (
                          <span key={t} className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
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
