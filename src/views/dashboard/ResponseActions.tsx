import { useEffect, useState } from 'react'
import { CheckCircle2, Loader2, Play, Plus, RefreshCw, Workflow, XCircle } from 'lucide-react'
import { EmptyState, PageHeader, SectionCard, StatCard, StatusPill, TableWrap, cx } from '@/components/ui'
import SortableCardGrid from '@/components/dashboard/SortableCards'
import { api, ApiError } from '@/lib/api'
import type { AlertRecord, IncidentRecord, ResponseAction, ResponseActionList } from '@/lib/types'

const KINDS = ['isolate', 'block', 'disable', 'snapshot', 'notify'] as const

const statusTone: Record<ResponseAction['status'], 'amber' | 'blue' | 'green' | 'red' | 'slate'> = {
  pending: 'amber',
  running: 'blue',
  succeeded: 'green',
  failed: 'red',
  manual: 'slate',
}

const kindIcon: Record<string, string> = {
  isolate: 'Isolate the host from the network',
  block: 'Block the indicator at gateway / DNS',
  disable: 'Disable a user account',
  snapshot: 'Take a forensic snapshot of a host',
  notify: 'Notify a channel about this case',
}

function timeAgo(iso: string | null): string {
  if (!iso) return '—'
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60) return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

export default function ResponseActions() {
  const [items, setItems] = useState<ResponseAction[]>([])
  const [incidents, setIncidents] = useState<IncidentRecord[]>([])
  const [alerts, setAlerts] = useState<AlertRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ kind: 'isolate', targetType: 'device', target: '', incidentId: '', alertId: '' })

  async function load() {
    try {
      const res = await api.get<ResponseActionList>('/actions?limit=200')
      setItems(res.items)
      setError(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load actions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    api.get<IncidentRecord[]>('/incidents').then(setIncidents).catch(() => {})
    api.get<{ items: AlertRecord[] }>('/alerts?limit=300').then((r) => setAlerts(r.items)).catch(() => {})
  }, [])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (!form.target.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      await api.post<ResponseAction>('/actions', {
        kind: form.kind,
        targetType: form.targetType,
        target: form.target.trim(),
        incidentId: form.incidentId || null,
        alertId: form.alertId || null,
        params: {},
      })
      setForm({ kind: 'isolate', targetType: 'device', target: '', incidentId: '', alertId: '' })
      setShow(false)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the action.')
    } finally {
      setSaving(false)
    }
  }

  async function rerun(action: ResponseAction) {
    await api.patch<ResponseAction>(`/actions/${action.id}/status`, { status: 'running' })
    await load()
  }

  const counts = {
    pending: items.filter((a) => a.status === 'pending' || a.status === 'running').length,
    succeeded: items.filter((a) => a.status === 'succeeded').length,
    failed: items.filter((a) => a.status === 'failed').length,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Workflow}
        title="Response Actions"
        subtitle="SOAR-lite: raise containment and response actions from your cases — isolate, block, disable, snapshot, notify — and track them to completion."
        actions={
          <button type="button" onClick={() => setShow((v) => !v)} className="btn-primary btn-sm">
            {show ? <RefreshCw size={14} className="rotate-90" /> : <Plus size={14} />} {show ? 'Cancel' : 'New action'}
          </button>
        }
      />

      <SortableCardGrid
        pageKey="actions.kpis"
        cols="sm:grid-cols-3"
        maxCols={3}
        cards={[
          { id: 'inflight', label: 'In flight', node: <StatCard label="In flight" value={counts.pending} sub="Pending or running" icon={Play} tone="amber" /> },
          { id: 'succeeded', label: 'Succeeded', node: <StatCard label="Succeeded" value={counts.succeeded} sub="Completed" icon={CheckCircle2} tone="green" /> },
          { id: 'failed', label: 'Failed', node: <StatCard label="Failed" value={counts.failed} sub="Needs attention" icon={XCircle} tone="red" /> },
        ]}
      />

      {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      {show && (
        <SectionCard title="Raise a response action" description="The platform records the action and its target. Executions against real infrastructure can be wired in later.">
          <form onSubmit={create} className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="label">Kind</label>
              <select className="input" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
              <p className="mt-1 text-xs text-slate-400">{kindIcon[form.kind]}</p>
            </div>
            <div>
              <label className="label">Target type</label>
              <select className="input" value={form.targetType} onChange={(e) => setForm({ ...form, targetType: e.target.value })}>
                <option value="device">device</option>
                <option value="indicator">indicator</option>
                <option value="account">account</option>
                <option value="host">host</option>
                <option value="channel">channel</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Target</label>
              <input className="input font-mono" placeholder="192.168.1.24 · evil.com · samson" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} />
            </div>
            <div>
              <label className="label">Incident (optional)</label>
              <select className="input" value={form.incidentId} onChange={(e) => setForm({ ...form, incidentId: e.target.value })}>
                <option value="">— none —</option>
                {incidents.map((i) => <option key={i.id} value={i.id}>{i.title}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Alert (optional)</label>
              <select className="input" value={form.alertId} onChange={(e) => setForm({ ...form, alertId: e.target.value })}>
                <option value="">— none —</option>
                {alerts.slice(0, 200).map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
              </select>
            </div>
            <div className="flex items-end lg:col-span-2">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Create action
              </button>
            </div>
          </form>
        </SectionCard>
      )}

      <SectionCard title="Actions" description={loading ? 'loading…' : `${items.length} total`}>
        <TableWrap>
          <table className="table-base">
            <thead>
              <tr>
                <th>Action</th><th>Target</th><th>Case / Alert</th><th>Status</th><th>Created</th><th>Result</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400"><Loader2 size={18} className="mx-auto animate-spin" /></td></tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState icon={Workflow} title="No actions yet" message="Raise an action to contain or respond to a case. Actions can also be triggered from alerts in the future." />
                  </td>
                </tr>
              ) : (
                items.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <p className="font-semibold capitalize text-slate-900">{a.kind}</p>
                      <p className="text-xs text-slate-400">{a.targetType}</p>
                    </td>
                    <td className="font-mono text-[13px] text-slate-700">{a.target}</td>
                    <td className="text-xs text-slate-500">
                      {a.incidentId ? `case ${a.incidentId.slice(0, 8)}` : a.alertId ? `alert ${a.alertId.slice(0, 8)}` : '—'}
                    </td>
                    <td><StatusPill tone={statusTone[a.status]}>{a.status}</StatusPill></td>
                    <td className="whitespace-nowrap text-slate-500">{timeAgo(a.createdAt)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        {a.status === 'failed' && a.error ? (
                          <span className="max-w-[160px] truncate text-xs text-red-600" title={a.error}>{a.error}</span>
                        ) : a.result ? (
                          <span className="max-w-[160px] truncate font-mono text-xs text-emerald-700" title={JSON.stringify(a.result)}>{JSON.stringify(a.result).slice(0, 60)}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                        {(a.status === 'pending' || a.status === 'failed' || a.status === 'manual') && (
                          <button type="button" onClick={() => rerun(a)} className={cx('rounded-md p-1.5 text-slate-400 hover:bg-brand-50 hover:text-brand-600')} title="Mark as running">
                            <Play size={13} />
                          </button>
                        )}
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
