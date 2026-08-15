import { useRef, useState } from 'react'
import { AlertTriangle, Brain, CheckCircle2, FileUp, Globe2, Loader2, UploadCloud } from 'lucide-react'
import { AiPanel, PageHeader, SectionCard, StatCard, StatusPill, TableWrap, cx } from '@/components/ui'
import SortableCardGrid from '@/components/dashboard/SortableCards'
import { api, ApiError } from '@/lib/api'
import type { AiText, PcapAnalysis, Verdict } from '@/lib/types'

const verdictTone: Record<Verdict, 'red' | 'amber' | 'green' | 'slate'> = {
  malicious: 'red',
  suspicious: 'amber',
  clean: 'green',
  unknown: 'slate',
}

function geoLabel(geo: { isPrivate: boolean; country: string | null; asn: number | null; asnOrg: string | null } | null) {
  if (!geo) return '—'
  if (geo.isPrivate) return 'local'
  return [geo.country, geo.asnOrg].filter(Boolean).join(' · ') || '—'
}

function summarise(a: PcapAnalysis): string {
  const flagged = a.findings.filter((f) => f.severity === 'malicious' || f.severity === 'suspicious')
  const domains = a.dnsQueries.slice(0, 30).map((q) => `${q.src} -> ${q.domain} [${q.verdict ?? 'unknown'}]`).join('\n')
  const flows = a.flows.slice(0, 20).map((f) => `${f.src} -> ${f.dst}:${f.dstPort ?? ''} ${f.protocol} pkts=${f.packets} [${f.verdict ?? 'unknown'}] ${f.geo?.country ?? ''}`).join('\n')
  return (
    `Capture ${a.fileName}: ${a.packetsRead} packets, ${a.dnsQueries.length} DNS queries, ` +
    `${a.flows.length} flows, ${a.uniqueExternalIps} external IPs, ${flagged.length} flagged findings.\n\n` +
    `DNS:\n${domains}\n\nFlows:\n${flows}`
  )
}

export default function PcapUpload() {
  const [file, setFile] = useState<{ name: string; size: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PcapAnalysis | null>(null)
  const [dragging, setDragging] = useState(false)
  const [aiEnabled, setAiEnabled] = useState(true)
  const [aiBusy, setAiBusy] = useState(false)
  const [aiResult, setAiResult] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function analyze(f: File) {
    setFile({ name: f.name, size: (f.size / 1024 / 1024).toFixed(1) + ' MB' })
    setResult(null)
    setError(null)
    setAiResult(null)
    setBusy(true)
    try {
      const form = new FormData()
      form.append('file', f)
      const data = await api.upload<PcapAnalysis>('/capture/pcap', form)
      setResult(data)

      // Auto-run AI summary if enabled
      if (aiEnabled) {
        setAiBusy(true)
        try {
          const res = await api.post<AiText>('/ai/analyze', { kind: 'capture', content: summarise(data) })
          setAiResult(res.reply)
        } catch {
          // AI failure is non-critical
        } finally {
          setAiBusy(false)
        }
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'The capture could not be analysed.')
    } finally {
      setBusy(false)
    }
  }

  function onFiles(list: FileList | null) {
    const f = list?.[0]
    if (f) analyze(f)
  }

  const flagged = result?.findings.filter((x) => x.severity === 'malicious' || x.severity === 'suspicious') ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FileUp}
        title="Packet Inspector"
        subtitle="Drop a .pcap capture. The server extracts every DNS lookup and connection, locates each destination with GeoIP, and checks it against threat intelligence."
      />

      <SectionCard>
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            onFiles(e.dataTransfer.files)
          }}
          className={cx(
            'm-5 grid place-items-center rounded-xl border-2 border-dashed px-6 py-14 text-center transition-colors',
            dragging ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-slate-50/60',
          )}
        >
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white shadow-lift">
            <UploadCloud size={26} />
          </span>
          <p className="mt-4 text-base font-bold text-slate-900">Drop a capture file here</p>
          <p className="mt-1 text-sm text-slate-500">
            Supports <span className="font-mono">.pcap</span>, <span className="font-mono">.pcapng</span> and{' '}
            <span className="font-mono">.cap</span> up to 200 MB
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".pcap,.pcapng,.cap"
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button type="button" className="btn-primary" onClick={() => inputRef.current?.click()} disabled={busy}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : 'Browse files'}
            </button>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={aiEnabled}
                onChange={(e) => setAiEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <Brain size={14} className="text-brand-600" />
              Auto-analyze with summary
            </label>
          </div>
          <p className="mt-4 max-w-md text-xs text-slate-400">
            Capture on your own network with Wireshark (File → Save As → .pcap), then upload it here. Only analyse
            traffic you are authorised to monitor.
          </p>
        </div>
      </SectionCard>

      {file && (
        <SectionCard
          title={file.name}
          description={`${file.size} · ${busy ? 'analysing…' : aiBusy ? 'generating summary…' : 'processed on the server'}`}
          right={
            busy ? (
              <StatusPill tone="blue">
                <Loader2 size={12} className="animate-spin" /> Analyzing
              </StatusPill>
            ) : error ? (
              <StatusPill tone="red">
                <AlertTriangle size={12} /> Failed
              </StatusPill>
            ) : (
              <StatusPill tone="green">
                <CheckCircle2 size={12} /> Complete
              </StatusPill>
            )
          }
        >
          {error && <div className="px-5 py-4 text-sm text-red-700">{error}</div>}
        </SectionCard>
      )}

      {aiBusy && (
        <SectionCard>
          <div className="flex items-center gap-2 p-5 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin" /> Analyzing traffic patterns…
          </div>
        </SectionCard>
      )}

      {aiResult && (
        <AiPanel title="Summary">
          <p className="whitespace-pre-wrap">{aiResult}</p>
        </AiPanel>
      )}

      {result && (
        <>
          <SortableCardGrid
            pageKey="pcapupload.kpis"
            cols="sm:grid-cols-2 lg:grid-cols-4"
            maxCols={4}
            cards={[
              { id: 'packets', label: 'Packets read', node: <StatCard label="Packets read" value={result.packetsRead.toLocaleString()} sub={result.truncated ? 'truncated at limit' : 'whole capture'} icon={FileUp} /> },
              { id: 'dns', label: 'DNS lookups', node: <StatCard label="DNS lookups" value={result.dnsQueries.length} sub={`${result.uniqueDomains} unique domains`} icon={Globe2} /> },
              { id: 'ips', label: 'External IPs', node: <StatCard label="External IPs" value={result.uniqueExternalIps} sub="Contacted destinations" icon={Globe2} /> },
              { id: 'flagged', label: 'Flagged', node: <StatCard label="Flagged" value={flagged.length} sub="Suspicious or worse" icon={AlertTriangle} tone="red" /> },
            ]}
          />

          <SectionCard title="Findings" description={`${result.findings.length} enriched detections from this capture`}>
            <TableWrap>
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Finding</th>
                    <th>Severity</th>
                    <th>Indicator</th>
                    <th>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {result.findings.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-400">
                        Nothing in this capture matched threat intelligence. That is the expected result for clean
                        traffic.
                      </td>
                    </tr>
                  ) : (
                    result.findings.map((f, i) => (
                      <tr key={i}>
                        <td className="whitespace-nowrap font-semibold text-slate-900">{f.title}</td>
                        <td>
                          <StatusPill tone={verdictTone[f.severity]}>{f.severity}</StatusPill>
                        </td>
                        <td className="max-w-[180px] truncate font-mono text-[12px]">{f.indicator ?? '—'}</td>
                        <td className="max-w-md text-slate-600">{f.detail}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </TableWrap>
          </SectionCard>

          <SectionCard title="DNS lookups" description="Every domain a device on the capture tried to resolve">
            <TableWrap>
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Domain</th>
                    <th>Type</th>
                    <th>Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  {result.dnsQueries.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-400">
                        No DNS queries in this capture.
                      </td>
                    </tr>
                  ) : (
                    result.dnsQueries.map((q, i) => (
                      <tr key={i}>
                        <td className="font-mono text-[12px] text-slate-600">{q.src}</td>
                        <td className="font-mono text-[12px] font-semibold text-slate-900">{q.domain}</td>
                        <td className="text-slate-500">{q.qtype}</td>
                        <td>{q.verdict ? <StatusPill tone={verdictTone[q.verdict]}>{q.verdict}</StatusPill> : <span className="text-slate-400">—</span>}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </TableWrap>
          </SectionCard>

          <SectionCard title="Top connections" description="Aggregated flows, largest first, located with GeoIP">
            <TableWrap>
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Destination</th>
                    <th>Port</th>
                    <th>Proto</th>
                    <th>Packets</th>
                    <th>Location</th>
                    <th>Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  {result.flows.slice(0, 40).map((f, i) => (
                    <tr key={i}>
                      <td className="font-mono text-[12px] text-slate-600">{f.src}</td>
                      <td className="font-mono text-[12px] font-semibold text-slate-900">{f.dst}</td>
                      <td className="tabular-nums text-slate-500">{f.dstPort ?? '—'}</td>
                      <td className="text-slate-500">{f.protocol}</td>
                      <td className="tabular-nums">{f.packets.toLocaleString()}</td>
                      <td className="text-slate-500">{geoLabel(f.geo)}</td>
                      <td>{f.verdict ? <StatusPill tone={verdictTone[f.verdict]}>{f.verdict}</StatusPill> : <span className="text-slate-400">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </SectionCard>
        </>
      )}
    </div>
  )
}
