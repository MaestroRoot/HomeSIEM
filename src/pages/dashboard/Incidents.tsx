import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Boxes, Loader2, Plus, Send, X } from 'lucide-react'
import { EmptyState, PageHeader, SectionCard, SeverityBadge, StatCard, StatusPill, cx } from '@/components/ui'
import { api, ApiError } from '@/lib/api'
import type { IncidentRecord } from '@/lib/types'

const STATUSES = ['new', 'triage', 'containment', 'eradication', 'closed'] as const

const statusTone: Record<string, 'red' | 'amber' | 'green' | 'slate' | 'blue'> = {
  new: 'red',
  triage: 'amber',
  containment: 'blue',
  eradication: 'blue',
  closed: 'green',
}

export default function Incidents() {
  const [items, setItems] = useState<IncidentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<IncidentRecord | null>(null)
  const [show, setShow] = useState(false)
  const [note, setNote] = useState('')
  const [form, setForm] = useState({ title: '', severity: 'medium', summary: '' })

  async function load() {
    try {
      const res = await api.get<IncidentRecord[]>('/incidents')
      setItems(res)
      setSelected((s) => (s ? res.find((i) => i.id === s.id) ?? res[0] ?? null : res[0] ?? null))
    } catch {
      /* keep */
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
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
      alert(err instanceof ApiError ? err.message : 'Could not create incident.')
    }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    await api.patch(`/incidents/${id}`, body)
    if (body.note) setNote('')
    await load()
  }

  const open = items.filter((i) => i.status !== 'closed').length

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Boxes}
        title="Incident Management"
        subtitle="From alert to resolution. Open incidents, assign them, track status and keep an investigation trail."
        actions={<>
          <Link to="/dashboard/runbooks" className="btn-soft btn-sm">Runbooks</Link>
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
                {['critical', 'high', 'medium', 'low', 'info'].map((s) => <option key={s}>{s}</option>)}
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
        <SectionCard><EmptyState icon={Boxes} title="No incidents" message="Open one manually to track an investigation from start to resolution." /></SectionCard>
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
                    <p className="mt-0.5 text-xs text-slate-500">{i.assignee ? `@${i.assignee}` : 'unassigned'} · {new Date(i.createdAt).toLocaleDateString()}</p>
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
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Assignee:</span>
                    <input className="input h-8 max-w-[200px] py-1 text-sm" defaultValue={selected.assignee ?? ''} placeholder="name" onBlur={(e) => e.target.value !== (selected.assignee ?? '') && patch(selected.id, { assignee: e.target.value })} />
                  </div>
                </div>
              </SectionCard>

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
