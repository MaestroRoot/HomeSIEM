import { useEffect, useMemo, useState } from 'react'
import { Boxes, Loader2, Plus, Send, Unlink, X } from 'lucide-react'
import { EmptyState, PageHeader, SectionCard, SeverityBadge, StatCard, StatusPill, cx } from '@/components/ui'
import { api, ApiError } from '@/lib/api'
import type { AlertRecord, IncidentRecord } from '@/lib/types'

const STATUSES = ['new', 'triage', 'containment', 'eradication', 'closed'] as const
const SEVERITIES = ['critical', 'high', 'medium', 'low', 'info'] as const

const statusTone: Record<string, 'red' | 'amber' | 'green' | 'slate' | 'blue'> = {
  new: 'red',
  triage: 'amber',
  containment: 'blue',
  eradication: 'blue',
  closed: 'green',
}

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60) return 'just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

export default function Incidents() {
  const [items, setItems] = useState<IncidentRecord[]>([])
  const [alerts, setAlerts] = useState<AlertRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<IncidentRecord | null>(null)
  const [show, setShow] = useState(false)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', severity: 'medium', summary: '' })

  async function loadAlerts() {
    try {
      const res = await api.get<{ items: AlertRecord[] }>('/alerts?limit=300')
      setAlerts(res.items)
    } catch {
      /* keep */
    }
  }

  async function load() {
    try {
      const res = await api.get<IncidentRecord[]>('/incidents')
      setItems(res)
      setSelected((s) => (s ? res.find((i) => i.id === s.id) ?? res[0] ?? null : res[0] ?? null))
      setError(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load incidents.')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
    loadAlerts()
  }, [])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    try {
      await api.post<IncidentRecord>('/incidents', form)
      setForm({ title: '', severity: 'medium', summary: '' })
      setShow(false)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create incident.')
    }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    try {
      await api.patch(`/incidents/${id}`, body)
      if (body.note) setNote('')
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Update failed.')
    }
  }

  async function linkAlert(incident: IncidentRecord, alertId: string) {
    await patch(incident.id, { alert: { alertId, action: 'link' } })
  }
  async function unlinkAlert(incident: IncidentRecord, alertId: string) {
    await patch(incident.id, { alert: { alertId, action: 'unlink' } })
  }

  const open = items.filter((i) => i.status !== 'closed').length
  const linkedAlertTitles = useMemo(() => {
    const map = new Map(alerts.map((a) => [a.id, a.title]))
    return map
  }, [alerts])

  const unlinked = useMemo(
    () => alerts.filter((a) => a.status !== 'resolved' && selected && !selected.alertIds.includes(a.id)),
    [alerts, selected],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Boxes}
        title="Incident Management"
        subtitle="A case workspace: status, assignee, linked alerts, entities and a full investigation trail from triage to closure."
        actions={<>
          <button type="button" onClick={() => setShow((v) => !v)} className="btn-primary btn-sm">
            {show ? <X size={14} /> : <Plus size={14} />} {show ? 'Cancel' : 'New incident'}
          </button>
        </>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Open" value={open} sub="Not yet closed" icon={Boxes} tone="red" />
        <StatCard label="Closed" value={items.length - open} sub="Resolved" icon={Boxes} tone="green" />
        <StatCard label="Total" value={items.length} sub="All incidents" icon={Boxes} />
      </div>

      {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      {show && (
        <SectionCard title="Open an incident">
          <form onSubmit={create} className="grid gap-4 p-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Title</label>
              <input className="input" placeholder="Suspicious beaconing from a device" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="label">Severity</label>
              <select className="input" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Summary</label>
              <textarea className="input min-h-[80px]" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
            </div>
            <div><button type="submit" className="btn-primary"><Plus size={15} /> Create</button></div>
          </form>
        </SectionCard>
      )}

      {loading ? (
        <div className="grid place-items-center py-20 text-slate-400"><Loader2 size={22} className="animate-spin" /></div>
      ) : items.length === 0 ? (
        <SectionCard><EmptyState icon={Boxes} title="No incidents" message="Open one manually to track an investigation from start to resolution, or promote one from the Alert Center." /></SectionCard>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <SectionCard title="Incidents" description={`${items.length}`}>
            <ul className="max-h-[640px] divide-y divide-slate-100 overflow-y-auto">
              {items.map((i) => (
                <li key={i.id}>
                  <button type="button" onClick={() => setSelected(i)} className={cx('w-full px-4 py-3 text-left', selected?.id === i.id ? 'bg-brand-50' : 'hover:bg-slate-50')}>
                    <div className="flex items-center justify-between gap-2">
                      <SeverityBadge severity={i.severity} />
                      <StatusPill tone={statusTone[i.status] ?? 'slate'}>{i.status}</StatusPill>
                    </div>
                    <p className="mt-1.5 text-sm font-semibold text-slate-900">{i.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {i.assignee ? `@${i.assignee}` : 'unassigned'} · {i.alertIds.length} alert(s) · {timeAgo(i.updatedAt)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </SectionCard>

          {selected && (
            <div className="space-y-6">
              <SectionCard>
                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={selected.severity} />
                    <StatusPill tone={statusTone[selected.status] ?? 'slate'}>{selected.status}</StatusPill>
                    <span className="ml-auto text-xs text-slate-400">opened {timeAgo(selected.createdAt)}</span>
                  </div>
                  <h2 className="mt-2 text-lg font-bold text-slate-900">{selected.title}</h2>
                  {selected.summary && <p className="mt-1 text-sm text-slate-600">{selected.summary}</p>}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Status:</span>
                    {STATUSES.map((s) => (
                      <button key={s} type="button" onClick={() => patch(selected.id, { status: s })} className={cx('rounded-md px-2 py-1 text-xs font-semibold capitalize', selected.status === s ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
                        {s}
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Severity:</span>
                    {SEVERITIES.map((s) => (
                      <button key={s} type="button" onClick={() => patch(selected.id, { severity: s })} className={cx('rounded-md px-2 py-1 text-xs font-semibold capitalize', selected.severity === s ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
                        {s}
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Assignee:</span>
                    <input className="input h-8 max-w-[200px] py-1 text-sm" defaultValue={selected.assignee ?? ''} placeholder="name" onBlur={(e) => e.target.value.trim() !== (selected.assignee ?? '') && patch(selected.id, { assignee: e.target.value.trim() || null })} />
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="Linked alerts"
                description={`${selected.alertIds.length} attached`}
                right={
                  unlinked.length > 0 ? (
                    <select className="input h-8 w-auto py-1 text-xs" value="" onChange={(e) => e.target.value && linkAlert(selected, e.target.value)}>
                      <option value="">link an alert…</option>
                      {unlinked.map((a) => (
                        <option key={a.id} value={a.id}>{a.title}</option>
                      ))}
                    </select>
                  ) : undefined
                }
              >
                {selected.alertIds.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-slate-400">No alerts attached. Link one from the dropdown, or promote from the Alert Center.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {selected.alertIds.map((id) => (
                      <li key={id} className="flex items-center justify-between gap-2 px-5 py-2.5 text-sm">
                        <span className="flex min-w-0 items-center gap-2">
                          <SeverityBadge severity="medium" />
                          <span className="truncate text-slate-800">{linkedAlertTitles.get(id) ?? id.slice(0, 8)}</span>
                        </span>
                        <button type="button" onClick={() => unlinkAlert(selected, id)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Unlink alert">
                          <Unlink size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>

              <div className="grid gap-6 xl:grid-cols-2">
                <SectionCard title="Entities" description="Hosts, indicators and accounts involved">
                  {selected.entities.length === 0 ? (
                    <p className="px-5 py-4 text-sm text-slate-400">No entities recorded yet.</p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {selected.entities.map((en, i) => (
                        <li key={i} className="flex items-center justify-between px-5 py-2.5 text-sm">
                          <span className="flex items-center gap-2">
                            <span className="chip bg-slate-100 uppercase text-slate-500">{en.type}</span>
                            <span className="font-mono text-slate-800">{en.value}</span>
                          </span>
                          {en.count > 1 && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">×{en.count}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </SectionCard>

                <SectionCard title="Timeline" description="Status changes, alerts and notes, in order">
                  {selected.timeline.length === 0 ? (
                    <p className="px-5 py-4 text-sm text-slate-400">No timeline events yet.</p>
                  ) : (
                    <ol className="relative ml-4 space-y-4 border-l border-slate-200 py-4 pl-5 pr-4">
                      {selected.timeline.map((t, i) => (
                        <li key={i} className="relative">
                          <span className={cx('absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-2 ring-white', t.type === 'status' ? 'bg-brand-500' : t.type === 'alert' ? 'bg-red-500' : 'bg-slate-300')} />
                          <p className="text-xs text-slate-400">{t.actor} · {new Date(t.time).toLocaleString()}</p>
                          <p className="mt-0.5 text-sm text-slate-700">{t.message}</p>
                        </li>
                      ))}
                    </ol>
                  )}
                </SectionCard>
              </div>

              <SectionCard title="Investigation notes">
                <ul className="divide-y divide-slate-100">
                  {selected.notes.length === 0 ? (
                    <li className="px-5 py-4 text-sm text-slate-400">No notes yet.</li>
                  ) : (
                    selected.notes.map((n, i) => (
                      <li key={i} className="px-5 py-3">
                        <p className="text-xs text-slate-400">{n.author} · {new Date(n.time).toLocaleString()}</p>
                        <p className="mt-0.5 text-sm text-slate-700">{n.body}</p>
                      </li>
                    ))
                  )}
                </ul>
                <div className="flex gap-2 border-t border-slate-100 p-4">
                  <input className="input flex-1" placeholder="Add a note…" value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && note.trim() && patch(selected.id, { note })} />
                  <button type="button" className="btn-primary" onClick={() => note.trim() && patch(selected.id, { note })}><Send size={15} /></button>
                </div>
              </SectionCard>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
