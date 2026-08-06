import { useEffect, useMemo, useState } from 'react'
import { FlaskConical, Loader2, Plus, Trash2, Wrench, X } from 'lucide-react'
import { PageHeader, SectionCard, StatCard, StatusPill, TableWrap, cx } from '@/components/ui'
import { api, ApiError } from '@/lib/api'
import type { DetectionRule, SecurityEventRow } from '@/lib/types'

function ruleMatches(e: SecurityEventRow, conditionType: string, value: string): boolean {
  const v = value.trim().toLowerCase()
  if (!v) return false
  switch (conditionType) {
    case 'verdict_is':
      return e.verdict === v
    case 'domain_contains':
      return (e.domain ?? '').toLowerCase().includes(v)
    case 'country_is':
      return (e.country ?? '').toLowerCase() === v
    case 'pulse_count_gte':
      return Number.isFinite(Number(v)) && e.pulseCount >= Number(v)
    default:
      return false
  }
}

const CONDITIONS = [
  { value: 'verdict_is', label: 'Verdict is', hint: 'malicious / suspicious / clean / unknown' },
  { value: 'domain_contains', label: 'Domain contains', hint: 'e.g. login, .ru, tunnel' },
  { value: 'country_is', label: 'Country is', hint: 'e.g. Russia, China' },
  { value: 'pulse_count_gte', label: 'OTX reports ≥', hint: 'a number, e.g. 5' },
] as const

const sevTone: Record<string, 'red' | 'amber' | 'green' | 'slate'> = {
  critical: 'red',
  high: 'red',
  medium: 'amber',
  low: 'slate',
}

export default function RuleEngine() {
  const [rules, setRules] = useState<DetectionRule[]>([])
  const [loading, setLoading] = useState(true)
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', conditionType: 'verdict_is', value: 'malicious', severity: 'high', action: 'alert' })
  const [sample, setSample] = useState<SecurityEventRow[] | null>(null)

  const testMatches = useMemo(
    () => (sample ? sample.filter((e) => ruleMatches(e, form.conditionType, form.value)) : []),
    [sample, form.conditionType, form.value],
  )

  async function load() {
    try {
      setRules(await api.get<DetectionRule[]>('/rules'))
    } catch {
      /* keep */
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!show || sample !== null) return
    api
      .get<{ items: SecurityEventRow[] }>('/events?limit=300')
      .then((r) => setSample(r.items))
      .catch(() => setSample([]))
  }, [show, sample])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      await api.post<DetectionRule>('/rules', form)
      setForm({ name: '', conditionType: 'verdict_is', value: 'malicious', severity: 'high', action: 'alert' })
      setShow(false)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the rule.')
    } finally {
      setSaving(false)
    }
  }

  async function toggle(r: DetectionRule) {
    await api.patch(`/rules/${r.id}`, { enabled: !r.enabled })
    load()
  }
  async function remove(r: DetectionRule) {
    await api.del(`/rules/${r.id}`)
    load()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Wrench}
        title="Rule Engine"
        subtitle="IF a condition matches THEN raise an alert. Rules run on every event your sensors report."
        actions={
          <button type="button" onClick={() => setShow((v) => !v)} className="btn-primary btn-sm">
            {show ? <X size={14} /> : <Plus size={14} />} {show ? 'Cancel' : 'New rule'}
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Rules" value={rules.length} sub="Total defined" icon={Wrench} />
        <StatCard label="Enabled" value={rules.filter((r) => r.enabled).length} sub="Currently active" icon={Wrench} tone="green" />
        <StatCard label="Total hits" value={rules.reduce((n, r) => n + r.hits, 0)} sub="Across all rules" icon={Wrench} tone="amber" />
      </div>

      {show && (
        <SectionCard title="New rule" description="IF this condition matches, THEN act">
          <form onSubmit={create} className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-3">
              <label className="label">Rule name</label>
              <input className="input" placeholder="Block malicious contacts" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">IF condition</label>
              <select className="input" value={form.conditionType} onChange={(e) => setForm({ ...form, conditionType: e.target.value })}>
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Value</label>
              <input className="input" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder={CONDITIONS.find((c) => c.value === form.conditionType)?.hint} />
            </div>
            <div>
              <label className="label">Severity</label>
              <select className="input" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                {['critical', 'high', 'medium', 'low'].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="lg:col-span-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <FlaskConical size={15} className="text-brand-600" />
                  Test sandbox
                  {sample === null ? (
                    <span className="text-xs font-normal text-slate-400">loading recent events…</span>
                  ) : (
                    <span className="text-xs font-normal text-slate-400">against {sample.length} recent events</span>
                  )}
                </div>
                {sample !== null && (
                  <>
                    <p className="mt-2 text-sm text-slate-600">
                      This rule would have matched{' '}
                      <span className={cx('font-bold', testMatches.length ? 'text-amber-700' : 'text-emerald-700')}>
                        {testMatches.length}
                      </span>{' '}
                      of the last {sample.length} events
                      {sample.length ? ` (${Math.round((testMatches.length / sample.length) * 100)}%)` : ''}.
                    </p>
                    {testMatches.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {testMatches.slice(0, 5).map((e) => (
                          <li key={e.id} className="flex items-center gap-2 text-xs">
                            <StatusPill tone={e.verdict === 'malicious' ? 'red' : e.verdict === 'suspicious' ? 'amber' : 'slate'}>{e.verdict}</StatusPill>
                            <span className="truncate font-mono text-slate-600">{e.domain ?? e.dstIp ?? '—'}</span>
                            <span className="text-slate-400">· {e.deviceName ?? e.srcIp ?? 'unknown'}</span>
                          </li>
                        ))}
                        {testMatches.length > 5 && <li className="text-xs text-slate-400">+{testMatches.length - 5} more</li>}
                      </ul>
                    )}
                    {testMatches.length === 0 && (
                      <p className="mt-1 text-xs text-slate-400">No recent events match — either the condition is very specific, or you have no matching traffic yet.</p>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="lg:col-span-3">
              {error && <p className="mb-2 text-sm text-red-700">{error}</p>}
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Create rule
              </button>
            </div>
          </form>
        </SectionCard>
      )}

      <SectionCard title="Rules" description={loading ? 'loading…' : `${rules.length} defined`}>
        <TableWrap>
          <table className="table-base">
            <thead>
              <tr>
                <th>Rule</th><th>Condition</th><th>Severity</th><th>Hits</th><th>Status</th><th />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400"><Loader2 size={18} className="mx-auto animate-spin" /></td></tr>
              ) : rules.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">No rules yet. Create one above, or generate one with AI in the AI Rule Generator.</td></tr>
              ) : (
                rules.map((r) => (
                  <tr key={r.id}>
                    <td className="font-semibold text-slate-900">{r.name}{r.source === 'ai-generated' && <span className="ml-1.5 text-[10px] text-brand-600">AI</span>}</td>
                    <td className="font-mono text-[12px] text-slate-600">{r.conditionType} = {r.value}</td>
                    <td><StatusPill tone={sevTone[r.severity] ?? 'slate'}>{r.severity}</StatusPill></td>
                    <td className="tabular-nums font-semibold">{r.hits}</td>
                    <td>
                      <button type="button" onClick={() => toggle(r)} className={cx('rounded-md px-2 py-1 text-xs font-semibold', r.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                        {r.enabled ? 'enabled' : 'disabled'}
                      </button>
                    </td>
                    <td>
                      <button type="button" onClick={() => remove(r)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete rule">
                        <Trash2 size={15} />
                      </button>
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
