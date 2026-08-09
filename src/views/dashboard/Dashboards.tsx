import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  BarChart3,
  GripVertical,
  LayoutDashboard,
  Loader2,
  Plus,
  Trash2,
  X,
} from 'lucide-react'

import { PageHeader, SectionCard, cx } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { ApiError, api } from '@/lib/api'

/* ---------- types ---------- */

interface Widget {
  id: string
  dashboardId: string
  widgetType: 'chart' | 'table' | 'single_value' | 'map' | 'alert_feed' | 'metric_card'
  title: string
  query: string | null
  config: Record<string, unknown>
  position: { x: number; y: number; w: number; h: number }
  sortOrder: number
  isVisible: boolean
  createdAt: string
  updatedAt: string
}

interface Dashboard {
  id: string
  organizationId: string
  createdBy: string | null
  title: string
  description: string | null
  template: string | null
  visibility: string
  sortOrder: number
  isDefault: boolean
  config: Record<string, unknown>
  widgets: Widget[]
  createdAt: string
  updatedAt: string
}

/* ---------- widget type labels ---------- */

const WIDGET_TYPES = [
  { type: 'chart', label: 'Chart', icon: BarChart3, desc: 'Bar, line, or pie chart' },
  { type: 'table', label: 'Table', icon: BarChart3, desc: 'Tabular data view' },
  { type: 'single_value', label: 'Single Value', icon: BarChart3, desc: 'Big number KPI' },
  { type: 'alert_feed', label: 'Alert Feed', icon: BarChart3, desc: 'Recent alerts list' },
  { type: 'metric_card', label: 'Metric Card', icon: BarChart3, desc: 'Count or stat card' },
] as const

const TEMPLATES = [
  { id: 'executive', label: 'Executive', desc: 'High-level KPIs for management' },
  { id: 'soc', label: 'SOC Overview', desc: 'Alerts, incidents, detection stats' },
  { id: 'network', label: 'Network', desc: 'Traffic, connections, DNS' },
  { id: 'endpoint', label: 'Endpoint', desc: 'Devices, agents, vulnerabilities' },
] as const

/* ---------- main component ---------- */

export default function Dashboards() {
  const { user } = useAuth()
  const isAnalyst = user?.role === 'owner' || user?.role === 'analyst'

  const [dashboards, setDashboards] = useState<Dashboard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<Dashboard | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showAddWidget, setShowAddWidget] = useState(false)

  const load = useCallback(async () => {
    setError('')
    try {
      const res = await api.get<{ items: Dashboard[]; total: number }>('/dashboards')
      setDashboards(res.items)
      // Auto-select first dashboard
      if (res.items.length > 0 && !selected) {
        setSelected(res.items[0] ?? null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load dashboards.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    document.title = 'Dashboards, HomeSIEM'
    void load()
  }, [load])

  async function handleDelete(id: string) {
    if (!confirm('Delete this dashboard?')) return
    try {
      await api.del(`/dashboards/${id}`)
      setDashboards((prev) => prev.filter((d) => d.id !== id))
      if (selected?.id === id) setSelected(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete.')
    }
  }

  async function handleCreateDashboard(data: {
    title: string
    description?: string
    template?: string
  }) {
    try {
      const created = await api.post<Dashboard>('/dashboards', {
        title: data.title,
        description: data.description || null,
        template: data.template || null,
        visibility: 'org',
      })
      setDashboards((prev) => [...prev, created])
      setSelected(created)
      setShowCreate(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create dashboard.')
    }
  }

  async function handleAddWidget(dashboardId: string, data: {
    widgetType: string
    title: string
    query?: string
  }) {
    try {
      await api.post<Widget>(`/dashboards/${dashboardId}/widgets`, {
        widgetType: data.widgetType,
        title: data.title,
        query: data.query || null,
        config: {},
        position: { x: 0, y: 0, w: 6, h: 4 },
      })
      // Reload selected dashboard
      const updated = await api.get<Dashboard>(`/dashboards/${dashboardId}`)
      setSelected(updated)
      setDashboards((prev) => prev.map((d) => (d.id === dashboardId ? updated : d)))
      setShowAddWidget(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add widget.')
    }
  }

  async function handleDeleteWidget(dashboardId: string, widgetId: string) {
    try {
      await api.del(`/dashboards/${dashboardId}/widgets/${widgetId}`)
      const updated = await api.get<Dashboard>(`/dashboards/${dashboardId}`)
      setSelected(updated)
      setDashboards((prev) => prev.map((d) => (d.id === dashboardId ? updated : d)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete widget.')
    }
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 size={26} className="animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={LayoutDashboard}
        title="Custom Dashboards"
        subtitle="Create and manage your own dashboards with custom widgets."
        actions={
          isAnalyst ? (
            <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 px-4 py-2">
              <Plus size={16} />
              New Dashboard
            </button>
          ) : undefined
        }
      />

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sidebar — list of dashboards */}
        <div className="lg:col-span-1">
          <SectionCard title="Dashboards">
            <div className="space-y-1">
              {dashboards.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelected(d)}
                  className={cx(
                    'flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-all',
                    selected?.id === d.id
                      ? 'bg-brand-50 font-semibold text-brand-700'
                      : 'text-slate-600 hover:bg-slate-50',
                  )}
                >
                  <LayoutDashboard size={15} className="shrink-0" />
                  <span className="flex-1 truncate">{d.title}</span>
                  {isAnalyst && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(d.id) }}
                      className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </button>
              ))}
              {dashboards.length === 0 && (
                <p className="px-3 py-6 text-center text-xs text-slate-400">
                  No dashboards yet. Create one to get started.
                </p>
              )}
            </div>
          </SectionCard>
        </div>

        {/* Main — selected dashboard */}
        <div className="lg:col-span-3">
          {selected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selected.title}</h2>
                  {selected.description && (
                    <p className="mt-0.5 text-sm text-slate-500">{selected.description}</p>
                  )}
                </div>
                {isAnalyst && (
                  <button
                    onClick={() => setShowAddWidget(true)}
                    className="btn-primary flex items-center gap-2 px-4 py-2"
                  >
                    <Plus size={16} />
                    Add Widget
                  </button>
                )}
              </div>

              {/* Widgets grid */}
              {selected.widgets.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {selected.widgets
                    .filter((w) => w.isVisible)
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((widget) => (
                      <WidgetCard
                        key={widget.id}
                        widget={widget}
                        dashboardId={selected.id}
                        isAnalyst={isAnalyst}
                        onDelete={handleDeleteWidget}
                      />
                    ))}
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
                  <BarChart3 size={32} className="mx-auto text-slate-300" />
                  <p className="mt-3 text-sm text-slate-500">No widgets yet. Add one to build your dashboard.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-slate-200 py-24 text-center">
              <LayoutDashboard size={40} className="mx-auto text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">
                {dashboards.length === 0
                  ? 'Create your first dashboard to get started.'
                  : 'Select a dashboard from the sidebar.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Dashboard Dialog */}
      {showCreate && (
        <CreateDashboardDialog
          onClose={() => setShowCreate(false)}
          onCreate={handleCreateDashboard}
        />
      )}

      {/* Add Widget Dialog */}
      {showAddWidget && selected && (
        <AddWidgetDialog
          onClose={() => setShowAddWidget(false)}
          onAdd={(data) => handleAddWidget(selected.id, data)}
        />
      )}
    </div>
  )
}

/* ---------- Widget Card ---------- */

function WidgetCard({
  widget,
  dashboardId,
  isAnalyst,
  onDelete,
}: {
  widget: Widget
  dashboardId: string
  isAnalyst: boolean
  onDelete: (dashboardId: string, widgetId: string) => void
}) {
  return (
    <div className="card group relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <GripVertical size={14} className="text-slate-300" />
          <span className="text-sm font-semibold text-slate-800">{widget.title}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
            {widget.widgetType.replace('_', ' ')}
          </span>
          {isAnalyst && (
            <button
              onClick={() => onDelete(dashboardId, widget.id)}
              className="rounded p-1 text-slate-300 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
      <div className="flex h-48 items-center justify-center bg-slate-50/50 p-4">
        {widget.query ? (
          <div className="text-center">
            <p className="text-xs text-slate-400">Query:</p>
            <code className="mt-1 block rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">
              {widget.query.length > 60 ? widget.query.slice(0, 60) + '...' : widget.query}
            </code>
          </div>
        ) : (
          <p className="text-xs text-slate-400">Configure this widget</p>
        )}
      </div>
    </div>
  )
}

/* ---------- Create Dashboard Dialog ---------- */

function CreateDashboardDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (data: { title: string; description?: string; template?: string }) => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [template, setTemplate] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setBusy(true)
    await onCreate({ title: title.trim(), description: description.trim() || undefined, template: template || undefined })
    setBusy(false)
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="card w-full max-w-md">
        <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-900">New Dashboard</h2>
          <button onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100">
            <X size={17} />
          </button>
        </header>
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label className="label" htmlFor="dash-title">Title</label>
            <input
              id="dash-title"
              className="input"
              placeholder="My Dashboard"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="label" htmlFor="dash-desc">Description (optional)</label>
            <textarea
              id="dash-desc"
              className="input"
              rows={2}
              placeholder="What is this dashboard for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <span className="label">Template (optional)</span>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplate(template === t.id ? null : t.id)}
                  className={cx(
                    'rounded-lg border px-3 py-2 text-left text-xs transition-all',
                    template === t.id
                      ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-200'
                      : 'border-slate-200 hover:border-brand-300',
                  )}
                >
                  <span className="block font-semibold text-slate-800">{t.label}</span>
                  <span className="block text-slate-500">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end border-t border-slate-100 pt-4">
            <button type="submit" className="btn-primary px-6 py-2.5" disabled={busy || !title.trim()}>
              {busy && <Loader2 size={15} className="animate-spin" />}
              {busy ? 'Creating...' : 'Create Dashboard'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ---------- Add Widget Dialog ---------- */

function AddWidgetDialog({
  onClose,
  onAdd,
}: {
  onClose: () => void
  onAdd: (data: { widgetType: string; title: string; query?: string }) => void
}) {
  const [widgetType, setWidgetType] = useState('chart')
  const [title, setTitle] = useState('')
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setBusy(true)
    await onAdd({ widgetType, title: title.trim(), query: query.trim() || undefined })
    setBusy(false)
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="card w-full max-w-md">
        <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-900">Add Widget</h2>
          <button onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100">
            <X size={17} />
          </button>
        </header>
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <span className="label">Widget Type</span>
            <div className="grid grid-cols-2 gap-2">
              {WIDGET_TYPES.map((wt) => (
                <button
                  key={wt.type}
                  type="button"
                  onClick={() => setWidgetType(wt.type)}
                  className={cx(
                    'rounded-lg border px-3 py-2.5 text-left transition-all',
                    widgetType === wt.type
                      ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-200'
                      : 'border-slate-200 hover:border-brand-300',
                  )}
                >
                  <span className="block text-sm font-semibold text-slate-800">{wt.label}</span>
                  <span className="block text-xs text-slate-500">{wt.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label" htmlFor="widget-title">Title</label>
            <input
              id="widget-title"
              className="input"
              placeholder="Widget title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="label" htmlFor="widget-query">Query (optional)</label>
            <textarea
              id="widget-query"
              className="input font-mono text-xs"
              rows={3}
              placeholder="e.g. event_type=login | stats count by user"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex justify-end border-t border-slate-100 pt-4">
            <button type="submit" className="btn-primary px-6 py-2.5" disabled={busy || !title.trim()}>
              {busy && <Loader2 size={15} className="animate-spin" />}
              {busy ? 'Adding...' : 'Add Widget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
