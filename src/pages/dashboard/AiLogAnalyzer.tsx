import { useRef, useState } from 'react'
import { FileSearch, Loader2, UploadCloud } from 'lucide-react'
import { AiPanel, PageHeader, SectionCard } from '@/components/ui'
import { api, ApiError } from '@/lib/api'
import type { AiText } from '@/lib/types'

const TEMPLATES: { name: string; sample: string }[] = [
  {
    name: 'SSH auth.log',
    sample: `Aug 04 13:20:11 host sshd[2211]: Failed password for root from 185.234.218.44 port 55344 ssh2
Aug 04 13:20:14 host sshd[2211]: Failed password for root from 185.234.218.44 port 55350 ssh2
Aug 04 13:20:19 host sshd[2213]: Accepted password for admin from 192.168.1.9 port 55402 ssh2`,
  },
  {
    name: 'nginx access',
    sample: `192.168.1.9 - - [04/Aug/2026:13:22:01 +0000] "GET /admin HTTP/1.1" 401 172 "-" "curl/8.0"
45.83.12.9 - - [04/Aug/2026:13:22:03 +0000] "GET /.env HTTP/1.1" 404 152 "-" "python-requests/2.31"
45.83.12.9 - - [04/Aug/2026:13:22:04 +0000] "POST /wp-login.php HTTP/1.1" 200 512 "-" "python-requests/2.31"`,
  },
  {
    name: 'Windows Security',
    sample: `[Microsoft-Windows-Security-Auditing #4625] An account failed to log on. Account: administrator. Source: 192.168.1.50. Logon type: 3.
[Microsoft-Windows-Security-Auditing #4625] An account failed to log on. Account: administrator. Source: 192.168.1.50.
[Microsoft-Windows-Security-Auditing #4624] An account was successfully logged on. Account: hans.`,
  },
  {
    name: 'firewall/UFW',
    sample: `[UFW BLOCK] IN=eth0 SRC=185.234.218.44 DST=192.168.1.10 PROTO=TCP SPT=44321 DPT=3389
[UFW BLOCK] IN=eth0 SRC=185.234.218.44 DST=192.168.1.10 PROTO=TCP SPT=44322 DPT=445
[UFW ALLOW] IN=eth0 SRC=192.168.1.9 DST=142.250.1.1 PROTO=TCP DPT=443`,
  },
]

export default function AiLogAnalyzer() {
  const [text, setText] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function analyze() {
    if (!text.trim() || busy) return
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const res = await api.post<AiText>('/ai/analyze', { kind: 'log', content: text.slice(0, 20000) })
      setResult(res.reply)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Analysis failed.')
    } finally {
      setBusy(false)
    }
  }

  function onFile(f: File | undefined) {
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => setText(String(reader.result).slice(0, 20000))
    reader.readAsText(f)
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={FileSearch} title="AI Log Analyzer" subtitle="Paste or upload log lines (syslog, auth.log, nginx, Windows events) and the AI explains what happened." />

      <SectionCard title="Log input" description="Up to ~20,000 characters">
        <div className="p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Templates:</span>
            {TEMPLATES.map((t) => (
              <button key={t.name} type="button" onClick={() => { setText(t.sample); setResult(null) }} className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-brand-100 hover:text-brand-700">{t.name}</button>
            ))}
          </div>
          <textarea
            className="input min-h-[200px] w-full font-mono text-[12px]"
            placeholder="Paste log lines here, or upload a file below…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input ref={inputRef} type="file" accept=".log,.txt,.out,.syslog" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn-primary" onClick={analyze} disabled={busy || !text.trim()}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : <FileSearch size={15} />} Analyze
            </button>
            <button type="button" className="btn-ghost" onClick={() => inputRef.current?.click()}>
              <UploadCloud size={15} /> Upload a log file
            </button>
            {text && <button type="button" className="btn-ghost" onClick={() => { setText(''); setResult(null) }}>Clear</button>}
          </div>
          {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
        </div>
      </SectionCard>

      {busy && (
        <SectionCard><div className="flex items-center gap-2 p-5 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" /> The AI is reading your log…</div></SectionCard>
      )}

      {result && (
        <AiPanel title="What the AI found">
          <p className="whitespace-pre-wrap">{result}</p>
        </AiPanel>
      )}
    </div>
  )
}
