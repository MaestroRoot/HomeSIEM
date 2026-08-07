import { useState } from 'react'
import { Activity, Loader2, Sparkles } from 'lucide-react'
import { AiPanel, EmptyState, PageHeader, SectionCard } from '@/components/ui'
import { api, ApiError } from '@/lib/api'
import type { AiText } from '@/lib/types'

export default function Investigation() {
  const [report, setReport] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await api.post<AiText>('/ai/analyze', { kind: 'investigation', content: '' })
      setReport(res.reply)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not generate the investigation.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Activity}
        title="Investigation"
        subtitle="A written case built from your flagged events, what the devices did, whether it is a real threat, and what to do next."
        actions={
          <button type="button" className="btn-primary btn-sm" onClick={run} disabled={busy}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} {report ? 'Regenerate' : 'Investigate'}
          </button>
        }
      />

      {busy ? (
        <SectionCard><div className="flex items-center gap-2 p-6 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" /> Correlating your flagged events and writing the case…</div></SectionCard>
      ) : report ? (
        <AiPanel title="Investigation summary">
          <p className="whitespace-pre-wrap">{report}</p>
        </AiPanel>
      ) : (
        <SectionCard>
          <EmptyState
            icon={Activity}
            title="No investigation yet"
            message="Click Investigate and your flagged events are analyzed, then a narrative case with a confidence estimate is written."
          />
        </SectionCard>
      )}

      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  )
}
