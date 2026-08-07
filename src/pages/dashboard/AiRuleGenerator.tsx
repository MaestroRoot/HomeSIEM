import { useEffect, useState } from 'react'
import { CheckCircle2, Lightbulb, Loader2, Sparkles, Wand2 } from 'lucide-react'
import { PageHeader, SectionCard, StatusPill } from '@/components/ui'
import { api, ApiError } from '@/lib/api'
import type { AiText, DetectionRule } from '@/lib/types'

interface Tip {
  ruleId: string
  ruleName: string
  tone: 'red' | 'amber' | 'slate'
  message: string
  fix?: { label: string; patch: Record<string, unknown> }
}

// Ushauri wa ku-tune rules unaotokana na takwimu halisi za hits na false positives.
function tuningTips(rules: DetectionRule[]): Tip[] {
  const tips: Tip[] = []
  for (const r of rules) {
    const fp = r.falsePositives ?? 0
    if (r.enabled && fp >= 3 && r.hits > 0 && fp / r.hits >= 0.3) {
      tips.push({
        ruleId: r.id,
        ruleName: r.name,
        tone: 'red',
        message: `“${r.name}” looks noisy: ${fp} of ${r.hits} hits (${Math.round((fp / r.hits) * 100)}%) were marked as false positives. Consider tightening or disabling it.`,
        fix: { label: 'Disable rule', patch: { enabled: false } },
      })
    }
    if (r.conditionType === 'pulse_count_gte' && Number(r.value) < 3) {
      tips.push({
        ruleId: r.id,
        ruleName: r.name,
        tone: 'amber',
        message: `“${r.name}” fires on just ${r.value}+ OTX reports, which is a low bar and can be noisy. Raising it to 5 keeps only stronger leads.`,
        fix: { label: 'Raise to 5', patch: { value: '5' } },
      })
    }
    if (r.enabled && r.hits === 0) {
      tips.push({
        ruleId: r.id,
        ruleName: r.name,
        tone: 'slate',
        message: `“${r.name}” has never matched an event. Verify its condition (${r.conditionType} = ${r.value}) is correct, or retire it if it is no longer needed.`,
      })
    }
  }
  return tips
}

interface Draft {
  name: string
  conditionType: string
  value: string
  severity: string
  action: string
}

const EXAMPLES = [
  'Alert when any device contacts a malicious indicator',
  'Flag lookups of domains that contain the word login',
  'Warn me about connections to Russia',
  'Alert when an indicator appears in 5 or more threat reports',
]

function parseDraft(raw: string): Draft | null {
  const cleaned = raw.replace(/```json|```/g, '').trim()
  try {
    const o = JSON.parse(cleaned)
    if (o && o.conditionType && o.value) {
      return {
        name: String(o.name ?? 'AI rule'),
        conditionType: String(o.conditionType),
        value: String(o.value),
        severity: String(o.severity ?? 'medium'),
        action: String(o.action ?? 'alert'),
      }
    }
  } catch {
    /* not JSON */
  }
  return null
}

export default function AiRuleGenerator() {
  const [desc, setDesc] = useState('')
  const [draft, setDraft] = useState<Draft | null>(null)
  const [raw, setRaw] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rules, setRules] = useState<DetectionRule[]>([])
  const [applying, setApplying] = useState<string | null>(null)

  async function loadRules() {
    try {
      setRules(await api.get<DetectionRule[]>('/rules'))
    } catch {
      /* keep */
    }
  }
  useEffect(() => {
    loadRules()
  }, [])

  const tips = tuningTips(rules)

  async function applyFix(tip: Tip) {
    if (!tip.fix) return
    setApplying(tip.ruleId + JSON.stringify(tip.fix.patch))
    try {
      await api.patch(`/rules/${tip.ruleId}`, tip.fix.patch)
      await loadRules()
    } catch {
      /* keep */
    } finally {
      setApplying(null)
    }
  }

  async function generate(text: string) {
    const d = text.trim()
    if (!d || busy) return
    setBusy(true)
    setError(null)
    setDraft(null)
    setRaw(null)
    setSaved(false)
    try {
      const res = await api.post<AiText>('/ai/generate-rule', { description: d })
      const parsed = parseDraft(res.reply)
      if (parsed) setDraft(parsed)
      else setRaw(res.reply)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Generation failed.')
    } finally {
      setBusy(false)
    }
  }

  async function save() {
    if (!draft) return
    try {
      await api.post<DetectionRule>('/rules', draft)
      setSaved(true)
      loadRules()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the rule.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={Sparkles} title="Custom Rules" subtitle="Describe a detection in plain language and get a rule ready to review and deploy." />

      <SectionCard title="Describe the detection" description="Plain English, we turn it into a rule">
        <div className="p-5">
          <textarea className="input min-h-[90px] w-full" placeholder="e.g. Alert when a device connects to a domain in Russia" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn-primary" onClick={() => generate(desc)} disabled={busy || !desc.trim()}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />} Generate rule
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs font-semibold text-slate-500">Try:</span>
            {EXAMPLES.map((ex) => (
              <button key={ex} type="button" onClick={() => { setDesc(ex); generate(ex) }} className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-600 hover:bg-brand-100 hover:text-brand-700">
                {ex}
              </button>
            ))}
          </div>
          {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
        </div>
      </SectionCard>

      {draft && (
        <SectionCard title="Generated rule" description="Review, then deploy">
          <div className="p-5">
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                ['Name', draft.name],
                ['Condition', `${draft.conditionType} = ${draft.value}`],
                ['Severity', draft.severity],
                ['Action', draft.action],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{k}</dt>
                  <dd className="mt-0.5 font-mono text-sm font-semibold text-slate-800">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex items-center gap-3">
              {saved ? (
                <StatusPill tone="green"><CheckCircle2 size={12} /> Saved to Rule Engine</StatusPill>
              ) : (
                <button type="button" className="btn-primary" onClick={save}>Deploy this rule</button>
              )}
            </div>
          </div>
        </SectionCard>
      )}

      {raw && (
        <SectionCard title="Generated rule">
          <pre className="overflow-x-auto p-5 text-xs text-slate-600">{raw}</pre>
        </SectionCard>
      )}

      <SectionCard
        title="Tuning suggestions"
        description={tips.length ? `${tips.length} recommendation(s) from your rule stats` : 'Based on how your rules are firing'}
      >
        {tips.length === 0 ? (
          <div className="flex items-center gap-2 px-5 py-8 text-sm text-slate-500">
            <CheckCircle2 size={16} className="text-emerald-600" />
            Your rules look well tuned — no noisy, dormant, or over-broad detectors right now.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {tips.map((tip, i) => (
              <li key={tip.ruleId + i} className="flex items-start gap-3 px-5 py-4">
                <span
                  className={
                    'mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg ' +
                    (tip.tone === 'red' ? 'bg-red-50 text-red-600' : tip.tone === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500')
                  }
                >
                  <Lightbulb size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-700">{tip.message}</p>
                </div>
                {tip.fix && (
                  <button
                    type="button"
                    onClick={() => applyFix(tip)}
                    disabled={applying === tip.ruleId + JSON.stringify(tip.fix.patch)}
                    className="btn-soft btn-sm shrink-0 disabled:opacity-50"
                  >
                    {applying === tip.ruleId + JSON.stringify(tip.fix.patch) ? <Loader2 size={13} className="animate-spin" /> : null}
                    {tip.fix.label}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  )
}
