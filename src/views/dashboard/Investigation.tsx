import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, Boxes, Loader2, Network } from 'lucide-react'
import { EmptyState, PageHeader, SectionCard, SeverityBadge, StatusPill, cx } from '@/components/ui'
import { api } from '@/lib/api'
import type { IncidentEntity, IncidentRecord } from '@/lib/types'

const W = 760
const H = 480
const CX = W / 2
const CY = H / 2

const entityColor: Record<string, string> = {
  device: '#2563eb',
  ip: '#dc2626',
  domain: '#f59e0b',
  account: '#10b981',
  file: '#8b5cf6',
  process: '#06b6d4',
  hash: '#ec4899',
}

const statusTone: Record<string, 'red' | 'amber' | 'green' | 'slate' | 'blue'> = {
  new: 'red',
  triage: 'amber',
  containment: 'blue',
  eradication: 'blue',
  closed: 'green',
}

interface GraphNode {
  id: string
  label: string
  kind: 'incident' | 'entity' | 'alert'
  color: string
  x: number
  y: number
}

function layout(incident: IncidentRecord): { nodes: GraphNode[]; edges: [string, string][] } {
  const nodes: GraphNode[] = [
    { id: 'incident', label: incident.title, kind: 'incident', color: '#111827', x: CX, y: CY },
  ]
  const edges: [string, string][] = []

  const entities: IncidentEntity[] = incident.entities ?? []
  const alertCount = incident.alertIds.length
  const total = entities.length + alertCount
  if (total === 0) return { nodes, edges }

  const angleStep = (2 * Math.PI) / Math.max(total, 1)
  let i = 0
  for (const en of entities) {
    const angle = -Math.PI / 2 + i * angleStep
    nodes.push({
      id: `e:${en.type}:${en.value}`,
      label: en.value,
      kind: 'entity',
      color: entityColor[en.type] ?? '#64748b',
      x: CX + Math.cos(angle) * 210,
      y: CY + Math.sin(angle) * 180,
    })
    edges.push(['incident', `e:${en.type}:${en.value}`])
    i += 1
  }
  for (let k = 0; k < alertCount; k += 1) {
    const angle = -Math.PI / 2 + i * angleStep
    const id = `a:${incident.alertIds[k]}`
    nodes.push({
      id,
      label: `alert ${k + 1}`,
      kind: 'alert',
      color: '#ef4444',
      x: CX + Math.cos(angle) * 300,
      y: CY + Math.sin(angle) * 250,
    })
    edges.push(['incident', id])
    i += 1
  }
  return { nodes, edges }
}

export default function Investigation() {
  const [items, setItems] = useState<IncidentRecord[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hover, setHover] = useState<GraphNode | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    api
      .get<IncidentRecord[]>('/incidents')
      .then((res) => {
        if (!active) return
        setItems(res)
        if (!selectedId) setSelectedId(res[0]?.id ?? null)
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selected = useMemo(() => items.find((i) => i.id === selectedId) ?? null, [items, selectedId])
  const graph = useMemo(() => (selected ? layout(selected) : null), [selected])

  const entitySummary = useMemo(() => {
    if (!selected) return []
    const groups = new Map<string, IncidentEntity[]>()
    for (const en of selected.entities ?? []) {
      const list = groups.get(en.type) ?? []
      list.push(en)
      groups.set(en.type, list)
    }
    return [...groups.entries()].sort((a, b) => b[1].length - a[1].length)
  }, [selected])

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Network}
        title="Investigation Graph"
        subtitle="A visual map of a case: the incident at the centre, its entities and linked alerts around it."
        actions={<Link to="/dashboard/incidents" className="btn-soft btn-sm"><Boxes size={14} /> Open case workspace</Link>}
      />

      {loading ? (
        <div className="grid place-items-center py-20 text-slate-400"><Loader2 size={22} className="animate-spin" /></div>
      ) : items.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={Activity}
            title="No cases to map"
            message="Open an incident (or promote one from the Alert Center), then come back here to see its investigation graph."
          />
        </SectionCard>
      ) : (
        <>
          <SectionCard
            title="Case"
            right={
              <select className="input h-8 w-auto py-1 text-xs" value={selectedId ?? ''} onChange={(e) => setSelectedId(e.target.value)}>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>{i.title}</option>
                ))}
              </select>
            }
          >
            {selected && (
              <div className="grid gap-6 p-5 lg:grid-cols-[1fr_280px]">
                <div className="overflow-x-auto">
                  {graph && (
                    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto min-w-[560px]">
                      <defs>
                        {graph.nodes.map((n) => (
                          <marker key={n.id} id={`arrow-${n.id}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0 0 L 10 5 L 0 10 z" fill="#cbd5e1" />
                          </marker>
                        ))}
                      </defs>
                      {graph.edges.map(([a, b]) => {
                        const from = graph.nodes.find((n) => n.id === a)!
                        const to = graph.nodes.find((n) => n.id === b)!
                        return (
                          <line key={`${a}->${b}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#cbd5e1" strokeWidth="1" markerEnd={`url(#arrow-${from.id})`} />
                        )
                      })}
                      {graph.nodes.map((n) => {
                        const r = n.kind === 'incident' ? 46 : n.kind === 'alert' ? 18 : 22
                        const hovered = hover?.id === n.id
                        return (
                          <g
                            key={n.id}
                            transform={`translate(${n.x},${n.y})`}
                            className="cursor-pointer"
                            onMouseEnter={() => setHover(n)}
                            onMouseLeave={() => setHover(null)}
                          >
                            {hovered && <circle r={r + 7} fill="none" stroke={n.color} strokeWidth="2" strokeDasharray="4 3" />}
                            <circle r={r} fill={n.color} opacity={0.92} stroke="white" strokeWidth="2" />
                            <text textAnchor="middle" dy="0.35em" fill="white" fontSize={n.kind === 'incident' ? 13 : 10} fontWeight="bold">
                              {n.kind === 'incident' ? 'CASE' : n.kind === 'alert' ? '!' : (n.label.slice(0, 6).toUpperCase())}
                            </text>
                          </g>
                        )
                      })}
                    </svg>
                  )}
                </div>

                <div className="space-y-4">
                  {selected && (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <SeverityBadge severity={selected.severity} />
                        <StatusPill tone={statusTone[selected.status] ?? 'slate'}>{selected.status}</StatusPill>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{selected.title}</p>
                      <p className="text-sm text-slate-600">{selected.summary}</p>
                      <dl className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <dt className="text-slate-400">Linked alerts</dt>
                          <dd className="mt-0.5 font-semibold text-slate-800">{selected.alertIds.length}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-400">Entities</dt>
                          <dd className="mt-0.5 font-semibold text-slate-800">{selected.entities.length}</dd>
                        </div>
                      </dl>
                    </>
                  )}

                  {entitySummary.length > 0 && (
                    <div>
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Entities by type</p>
                      <ul className="space-y-1.5">
                        {entitySummary.map(([type, list]) => (
                          <li key={type} className="flex items-center gap-2 text-xs">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entityColor[type] ?? '#64748b' }} />
                            <span className="font-semibold capitalize text-slate-700">{type}</span>
                            <span className="text-slate-400">×{list.length}</span>
                            <span className="truncate font-mono text-slate-500" title={list.map((l) => l.value).join(', ')}>
                              {list[0]?.value}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className={cx('rounded-lg border p-3 text-sm', hover ? 'border-brand-200 bg-brand-50' : 'border-slate-100 bg-slate-50')}>
                    {hover ? (
                      <p className="text-slate-700">
                        <span className="font-semibold capitalize">{hover.kind}:</span> {hover.label}
                      </p>
                    ) : (
                      <p className="text-slate-400">Hover a node to inspect it.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </SectionCard>

          {selected && selected.timeline.length > 0 && (
            <SectionCard title="Case timeline" description="How the case evolved">
              <ol className="relative ml-4 space-y-4 border-l border-slate-200 py-4 pl-5 pr-4">
                {selected.timeline.map((t, i) => (
                  <li key={i} className="relative">
                    <span className={cx('absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-2 ring-white', t.type === 'status' ? 'bg-brand-500' : t.type === 'alert' ? 'bg-red-500' : 'bg-slate-300')} />
                    <p className="text-xs text-slate-400">{t.actor} · {new Date(t.time).toLocaleString()}</p>
                    <p className="mt-0.5 text-sm text-slate-700">{t.message}</p>
                  </li>
                ))}
              </ol>
            </SectionCard>
          )}
        </>
      )}
    </div>
  )
}
