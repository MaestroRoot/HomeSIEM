import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Radar, Wrench } from 'lucide-react'
import { PageHeader, SectionCard, StatCard, StatusPill, TableWrap } from '@/components/ui'
import SortableCardGrid from '@/components/dashboard/SortableCards'
import { api } from '@/lib/api'
import { pollWhenVisible } from '@/lib/usePolling'
import type { DetectionRule } from '@/lib/types'

const sevTone: Record<string, 'red' | 'amber' | 'green' | 'slate'> = {
  critical: 'red',
  high: 'red',
  medium: 'amber',
  low: 'slate',
}

export default function ThreatDetection() {
  const [rules, setRules] = useState<DetectionRule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const r = await api.get<DetectionRule[]>('/rules')
        if (active) setRules(r)
      } catch {
        /* keep */
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    const stop = pollWhenVisible(load, 15000)
    return () => {
      active = false
      stop()
    }
  }, [])

  async function markFp(id: string) {
    setRules((rs) => rs.map((r) => (r.id === id ? { ...r, falsePositives: r.falsePositives + 1 } : r)))
    try { await api.post(`/rules/${id}/false-positive`, {}) } catch { /* refetch corrects */ }
  }

  const enabled = rules.filter((r) => r.enabled)
  const totalHits = rules.reduce((n, r) => n + r.hits, 0)
  const totalFp = rules.reduce((n, r) => n + (r.falsePositives ?? 0), 0)
  const firing = rules.filter((r) => r.hits > 0).length

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Radar}
        title="Threat Detection Engine"
        subtitle="Your detection rules running live over every event. Each hit means a rule matched something a device did."
        actions={
          <>
            <Link to="/dashboard/coverage" className="btn-soft btn-sm">Coverage</Link>
            <Link to="/dashboard/rules" className="btn-primary btn-sm"><Wrench size={14} /> Manage rules</Link>
          </>
        }
      />

      <SortableCardGrid pageKey="threatdetection" cols="sm:grid-cols-2 lg:grid-cols-4" cards={[
        { id: 'active', label: 'Active detectors', node: <StatCard label="Active detectors" value={enabled.length} sub={`${rules.length} defined`} icon={Radar} tone="green" /> },
        { id: 'hits', label: 'Total hits', node: <StatCard label="Total hits" value={totalHits} sub="All time" icon={Radar} tone="amber" /> },
        { id: 'fp', label: 'False positives', node: <StatCard label="False positives" value={totalFp} sub={totalHits ? `${Math.round((totalFp / totalHits) * 100)}% FP rate` : 'none marked'} icon={Radar} tone="slate" /> },
        { id: 'firing', label: 'Firing', node: <StatCard label="Firing" value={firing} sub="Rules with at least one hit" icon={Radar} tone="red" /> },
      ]} />

      <SectionCard title="Detectors" description={loading ? 'loading…' : `${rules.length} rules`}>
        <TableWrap>
          <table className="table-base">
            <thead>
              <tr>
                <th>Detector</th>
                <th>Condition</th>
                <th>Severity</th>
                <th>Hits</th>
                <th>FP</th>
                <th>Last fired</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-400"><Loader2 size={18} className="mx-auto animate-spin" /></td></tr>
              ) : rules.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-400">No detectors yet. Create rules in the Rule Engine, then they run here automatically.</td></tr>
              ) : (
                rules.map((r) => (
                  <tr key={r.id}>
                    <td className="font-semibold text-slate-900">{r.name}</td>
                    <td className="font-mono text-[12px] text-slate-600">{r.conditionType} = {r.value}</td>
                    <td><StatusPill tone={sevTone[r.severity] ?? 'slate'}>{r.severity}</StatusPill></td>
                    <td className="tabular-nums font-semibold">{r.hits}</td>
                    <td className="tabular-nums text-slate-500">{r.falsePositives ?? 0}</td>
                    <td className="whitespace-nowrap text-slate-500">{r.lastHitAt ? new Date(r.lastHitAt).toLocaleString() : '—'}</td>
                    <td><StatusPill tone={r.enabled ? 'green' : 'slate'}>{r.enabled ? 'active' : 'off'}</StatusPill></td>
                    <td><button type="button" onClick={() => markFp(r.id)} className="rounded-md px-2 py-1 text-[11px] font-semibold text-slate-500 hover:bg-amber-50 hover:text-amber-700" title="Mark a hit as a false positive">Mark FP</button></td>
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
