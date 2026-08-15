import { useEffect, useMemo, useState } from 'react'
import { FlaskConical, Library, Loader2, Plus, ShieldX, Trash2, Wrench, X } from 'lucide-react'
import { PageHeader, SectionCard, StatCard, StatusPill, TableWrap, cx } from '@/components/ui'
import SortableCardGrid from '@/components/dashboard/SortableCards'
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
    case 'kind_is':
      return e.kind === v
    default:
      return false
  }
}

const CONDITIONS = [
  { value: 'verdict_is', label: 'Verdict is', hint: 'malicious / suspicious / clean / unknown' },
  { value: 'domain_contains', label: 'Domain contains', hint: 'e.g. login, .ru, tunnel' },
  { value: 'country_is', label: 'Country is', hint: 'e.g. Russia, China' },
  { value: 'pulse_count_gte', label: 'OTX reports ≥', hint: 'a number, e.g. 5' },
  { value: 'kind_is', label: 'Event kind is', hint: 'dns | flow' },
] as const

const GROUP_OPTIONS = ['', 'dst_ip', 'src_ip', 'domain', 'account', 'device'] as const

const sevTone: Record<string, 'red' | 'amber' | 'green' | 'slate'> = {
  critical: 'red',
  high: 'red',
  medium: 'amber',
  low: 'slate',
}

const emptyForm = {
  name: '',
  description: '',
  conditionType: 'verdict_is',
  value: 'malicious',
  severity: 'high',
  action: 'alert',
  mitreTactic: '',
  mitreTechnique: '',
  windowSeconds: '',
  groupBy: '',
  threshold: '',
}

export default function RuleEngine() {
  const [rules, setRules] = useState<DetectionRule[]>([])
  const [loading, setLoading] = useState(true)
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [sample, setSample] = useState<SecurityEventRow[] | null>(null)

  const isCorrelation = form.windowSeconds !== '' && Number(form.windowSeconds) > 0

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
      await api.post<DetectionRule>('/rules', {
        name: form.name.trim(),
        description: form.description.trim(),
        conditionType: form.conditionType,
        value: form.value.trim(),
        severity: form.severity,
        action: form.action,
        mitreTactic: form.mitreTactic.trim() || null,
        mitreTechnique: form.mitreTechnique.trim() || null,
        windowSeconds: isCorrelation ? Number(form.windowSeconds) : 0,
        groupBy: isCorrelation ? form.groupBy : '',
        threshold: isCorrelation && form.threshold ? Number(form.threshold) : 1,
      })
      setForm(emptyForm)
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
    if (!window.confirm(`Delete rule “${r.name}”?`)) return
    await api.del(`/rules/${r.id}`)
    load()
  }
  async function markFalsePositive(r: DetectionRule) {
    await api.post(`/rules/${r.id}/false-positive`)
    load()
  }
  async function seedLibrary() {
    if (seeding) return
    setSeeding(true)
    setError(null)
    try {
      await api.post('/rules/library/seed')
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not seed the library.')
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Wrench}
        title="Rule Engine"
        subtitle="IF a condition matches THEN raise an alert. Simple rules fire on a single event; correlation rules count matching events inside a time window."
        actions={<>
          <button type="button" onClick={seedLibrary} disabled={seeding} className="btn-soft btn-sm">
            {seeding ? <Loader2 size={14} className="animate-spin" /> : <Library size={14} />} Install library
          </button>
          <button type="button" onClick={() => setShow((v) => !v)} className="btn-primary btn-sm">
            {show ? <X size={14} /> : <Plus size={14} />} {show ? 'Cancel' : 'New rule'}
          </button>
        </>}
      />

      <SortableCardGrid pageKey="ruleengine" cols="sm:grid-cols-4" maxCols={4} cards={[
        { id: 'rules', label: 'Rules', node: <StatCard label="Rules" value={rules.length} sub="Total defined" icon={Wrench} /> },
        { id: 'enabled', label: 'Enabled', node: <StatCard label="Enabled" value={rules.filter((r) => r.enabled).length} sub="Currently active" icon={Wrench} tone="green" /> },
        { id: 'correlation', label: 'Correlation', node: <StatCard label="Correlation" value={rules.filter((r) => r.windowSeconds > 0).length} sub="Window + threshold rules" icon={Wrench} tone="amber" /> },
        { id: 'hits', label: 'Total hits', node: <StatCard label="Total hits" value={rules.reduce((n, r) => n + r.hits, 0)} sub="Across all rules" icon={Wrench} tone="red" /> },
      ]} />

      {show && (
        <SectionCard title="New rule" description="Simple: IF condition THEN act · Correlation: IF condition matches N times within W seconds grouped by field">
          <form onSubmit={create} className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-4">
              <label className="label">Rule name</label>
              <input className="input" placeholder="Block malicious contacts" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="lg:col-span-4">
              <label className="label">Description</label>
              <input className="input" placeholder="What this rule looks for and why it matters" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
            <div>
              <label className="label">Action</label>
              <select className="input" value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })}>
                <option value="alert">alert</option>
                <option value="log">log</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="label">MITRE tactic</label>
              <input className="input" placeholder="e.g. Exfiltration" value={form.mitreTactic} onChange={(e) => setForm({ ...form, mitreTactic: e.target.value })} />
            </div>
            <div className="lg:col-span-2">
              <label className="label">MITRE technique</label>
              <input className="input" placeholder="e.g. T1048.003" value={form.mitreTechnique} onChange={(e) => setForm({ ...form, mitreTechnique: e.target.value })} />
            </div>

            <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-4 lg:col-span-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                Correlation (optional)
                {isCorrelation ? (
                  <span className="chip bg-brand-600 text-white">enabled</span>
                ) : (
                  <span className="text-xs font-normal text-slate-400">leave window empty for a single-event rule</span>
                )}
              </div>
              <div className="mt-3 grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="label">Window (seconds)</label>
                  <input type="number" min={0} max={86400} className="input" placeholder="300" value={form.windowSeconds} onChange={(e) => setForm({ ...form, windowSeconds: e.target.value })} />
                </div>
                <div>
                  <label className="label">Group by</label>
                  <select className="input" value={form.groupBy} onChange={(e) => setForm({ ...form, groupBy: e.target.value })}>
                    {GROUP_OPTIONS.map((g) => <option key={g} value={g}>{g || '— none —'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Threshold (≥ matches)</label>
                  <input type="number" min={1} className="input" placeholder="20" value={form.threshold} onChange={(e) => setForm({ ...form, threshold: e.target.value })} />
                </div>
              </div>
              {isCorrelation && (
                <p className="mt-2 text-xs text-slate-600">
                  Alerts when {form.conditionType} = “{form.value}” matches ≥ {form.threshold || 1} times
                  within {form.windowSeconds}s, grouped by {form.groupBy || 'event'}.
                </p>
              )}
            </div>

            <div className="lg:col-span-4">
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
                      <p className="mt-1 text-xs text-slate-400">No recent events match, either the condition is very specific, or you have no matching traffic yet.</p>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="lg:col-span-4">
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
                <th>Rule</th><th>Condition</th><th>MITRE</th><th>Correlation</th><th>Severity</th><th>Hits</th><th>Status</th><th />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-400"><Loader2 size={18} className="mx-auto animate-spin" /></td></tr>
              ) : rules.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-400">No rules yet. Create one above, or install the built-in MITRE-mapped library.</td></tr>
              ) : (
                rules.map((r) => (
                  <tr key={r.id}>
                    <td className="font-semibold text-slate-900">
                      {r.name}
                      {r.source === 'ai-generated' && <span className="ml-1.5 text-[10px] text-brand-600">auto</span>}
                      {r.description && <p className="max-w-[240px] truncate text-xs font-normal text-slate-400" title={r.description}>{r.description}</p>}
                    </td>
                    <td className="font-mono text-[12px] text-slate-600">{r.conditionType} = {r.value}</td>
                    <td className="text-[12px] text-slate-600">
                      {r.mitreTactic || r.mitreTechnique ? (
                        <>
                          <span className="font-semibold text-slate-700">{r.mitreTactic ?? '—'}</span>
                          {r.mitreTechnique && <span className="ml-1 font-mono text-[11px] text-brand-600">{r.mitreTechnique}</span>}
                        </>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="text-[12px] text-slate-600">
                      {r.windowSeconds > 0 ? (
                        <span className="font-mono text-[11px]">≥{r.threshold} in {r.windowSeconds}s{r.groupBy ? ` · ${r.groupBy}` : ''}</span>
                      ) : (
                        <span className="text-slate-300">single</span>
                      )}
                    </td>
                    <td><StatusPill tone={sevTone[r.severity] ?? 'slate'}>{r.severity}</StatusPill></td>
                    <td className="tabular-nums font-semibold">{r.hits}<span className="ml-1 text-[10px] font-normal text-slate-400">({r.falsePositives} fp)</span></td>
                    <td>
                      <button type="button" onClick={() => toggle(r)} className={cx('rounded-md px-2 py-1 text-xs font-semibold', r.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                        {r.enabled ? 'enabled' : 'disabled'}
                      </button>
                    </td>
                    <td>
                      <div className="flex items-center gap-0.5">
                        <button type="button" onClick={() => markFalsePositive(r)} className="rounded-md p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-600" aria-label="Mark false positive" title="Mark last hit as a false positive">
                          <ShieldX size={14} />
                        </button>
                        <button type="button" onClick={() => remove(r)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete rule">
                          <Trash2 size={15} />
                        </button>
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
