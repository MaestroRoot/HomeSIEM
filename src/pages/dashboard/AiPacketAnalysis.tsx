import { useRef, useState } from 'react'
import { Brain, Download, Loader2, UploadCloud } from 'lucide-react'
import { AiPanel, PageHeader, SectionCard, StatCard, StatusPill, TableWrap } from '@/components/ui'
import { api, ApiError } from '@/lib/api'
import type { AiText, PcapAnalysis, Verdict } from '@/lib/types'

function exportJson(a: PcapAnalysis, ai: string | null) {
  // Rahisi, umbo linalofanana na STIX kwa SOAR: orodha ya observations + findings.
  const doc = {
    tool: 'HomeSIEM',
    file: a.fileName,
    generated: new Date().toISOString(),
    summary: ai ?? undefined,
    stats: { packets: a.packetsRead, dnsQueries: a.dnsQueries.length, flows: a.flows.length, externalIps: a.uniqueExternalIps },
    findings: a.findings,
    indicators: [
      ...a.dnsQueries.filter((q) => q.verdict === 'malicious' || q.verdict === 'suspicious').map((q) => ({ type: 'domain', value: q.domain, verdict: q.verdict })),
      ...a.flows.filter((f) => f.verdict === 'malicious' || f.verdict === 'suspicious').map((f) => ({ type: 'ipv4', value: f.dst, verdict: f.verdict, country: f.geo?.country })),
    ],
  }
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const el = document.createElement('a')
  el.href = url
  el.download = `${a.fileName.replace(/\W+/g, '-')}-findings.json`
  el.click()
  URL.revokeObjectURL(url)
}

const verdictTone: Record<Verdict, 'red' | 'amber' | 'green' | 'slate'> = {
  malicious: 'red',
  suspicious: 'amber',
  clean: 'green',
  unknown: 'slate',
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

export default function AiPacketAnalysis() {
  const [analysis, setAnalysis] = useState<PcapAnalysis | null>(null)
  const [ai, setAi] = useState<string | null>(null)
  const [stage, setStage] = useState<'idle' | 'parsing' | 'thinking'>('idle')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function onFile(f: File | undefined) {
    if (!f) return
    setError(null)
    setAnalysis(null)
    setAi(null)
    setStage('parsing')
    try {
      const form = new FormData()
      form.append('file', f)
      const data = await api.upload<PcapAnalysis>('/capture/pcap', form)
      setAnalysis(data)
      setStage('thinking')
      const res = await api.post<AiText>('/ai/analyze', { kind: 'capture', content: summarise(data) })
      setAi(res.reply)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Analysis failed.')
    } finally {
      setStage('idle')
    }
  }

  const flagged = analysis?.findings.filter((f) => f.severity === 'malicious' || f.severity === 'suspicious') ?? []

  return (
    <div className="space-y-6">
      <PageHeader icon={Brain} title="AI Packet Analysis" subtitle="Upload a capture. It is dissected with tshark, enriched with GeoIP and threat intel, then the AI explains what the traffic is." />

      <SectionCard>
        <div className="m-5 grid place-items-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 px-6 py-12 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white"><UploadCloud size={26} /></span>
          <p className="mt-4 font-bold text-slate-900">Drop or choose a .pcap file</p>
          <p className="mt-1 text-sm text-slate-500">Up to 200 MB. The AI reads the enriched summary, not raw packets.</p>
          <input ref={inputRef} type="file" accept=".pcap,.pcapng,.cap" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          <button type="button" className="btn-primary mt-4" onClick={() => inputRef.current?.click()} disabled={stage !== 'idle'}>
            {stage === 'idle' ? 'Choose file' : <Loader2 size={15} className="animate-spin" />}
          </button>
          {stage === 'parsing' && <p className="mt-3 text-xs text-slate-500">Dissecting capture with tshark…</p>}
          {stage === 'thinking' && <p className="mt-3 text-xs text-slate-500">AI is analysing the traffic…</p>}
          {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
        </div>
      </SectionCard>

      {ai && (
        <AiPanel title="What the AI found in this capture">
          <p className="whitespace-pre-wrap">{ai}</p>
        </AiPanel>
      )}

      {analysis && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Packets" value={analysis.packetsRead.toLocaleString()} sub={analysis.truncated ? 'truncated' : 'whole file'} icon={Brain} />
            <StatCard label="DNS queries" value={analysis.dnsQueries.length} sub={`${analysis.uniqueDomains} domains`} icon={Brain} />
            <StatCard label="External IPs" value={analysis.uniqueExternalIps} sub="Destinations" icon={Brain} />
            <StatCard label="Flagged" value={flagged.length} sub="Suspicious or worse" icon={Brain} tone="red" />
          </div>

          <SectionCard title="Findings" description={`${analysis.findings.length} detections`} right={<button type="button" className="btn-ghost btn-sm" onClick={() => exportJson(analysis, ai)}><Download size={13} /> Export JSON</button>}>
            <TableWrap>
              <table className="table-base">
                <thead><tr><th>Finding</th><th>Severity</th><th>Indicator</th><th>Detail</th></tr></thead>
                <tbody>
                  {analysis.findings.length === 0 ? (
                    <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-400">Nothing matched threat intelligence, the expected result for clean traffic.</td></tr>
                  ) : (
                    analysis.findings.map((f, i) => (
                      <tr key={i}>
                        <td className="whitespace-nowrap font-semibold text-slate-900">{f.title}</td>
                        <td><StatusPill tone={verdictTone[f.severity]}>{f.severity}</StatusPill></td>
                        <td className="max-w-[180px] truncate font-mono text-[12px]">{f.indicator ?? '—'}</td>
                        <td className="max-w-md text-slate-600">{f.detail}</td>
                      </tr>
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
