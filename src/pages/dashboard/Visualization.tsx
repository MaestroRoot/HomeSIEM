import { useEffect, useState } from 'react'
import { BarChart3, Loader2 } from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { EmptyState, PageHeader, SectionCard } from '@/components/ui'
import { api } from '@/lib/api'
import { pollWhenVisible } from '@/lib/usePolling'
import type { StatsOverview } from '@/lib/types'

const VERDICT_COLORS: Record<string, string> = {
  malicious: '#dc2626',
  suspicious: '#f59e0b',
  clean: '#10b981',
  unknown: '#94a3b8',
}

export default function Visualization() {
  const [stats, setStats] = useState<StatsOverview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const s = await api.get<StatsOverview>('/stats/overview')
        if (active) setStats(s)
      } catch {
        /* keep */
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    const stop = pollWhenVisible(load, 20000)
    return () => {
      active = false
      stop()
    }
  }, [])

  const verdictPie = stats
    ? (['malicious', 'suspicious', 'clean', 'unknown'] as const)
        .map((k) => ({ name: k, value: stats.byVerdict[k] }))
        .filter((d) => d.value > 0)
    : []

  const hasData = stats && stats.totalEvents > 0

  return (
    <div className="space-y-6">
      <PageHeader icon={BarChart3} title="Packet Visualization" subtitle="The shape of your traffic, from the events your sensors report." />

      {loading && !stats ? (
        <div className="grid place-items-center py-20 text-slate-400"><Loader2 size={22} className="animate-spin" /></div>
      ) : !hasData ? (
        <SectionCard><EmptyState icon={BarChart3} title="No data to chart yet" message="Once your sensor reports events, the charts fill in here." /></SectionCard>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            <SectionCard title="Events over time" description="Per hour, last 24h" className="lg:col-span-2">
              <div className="h-72 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats!.overTime} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="t" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13 }} />
                    <Area type="monotone" dataKey="events" stroke="#2563eb" strokeWidth={2} fill="url(#gv)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard title="Verdict split" description="Share of events">
              <div className="h-72 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={verdictPie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={84} paddingAngle={2}>
                      {verdictPie.map((d) => <Cell key={d.name} fill={VERDICT_COLORS[d.name]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard title="Top domains" description="Most looked-up">
              <div className="h-[320px] p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats!.topDomains.slice(0, 10)} layout="vertical" margin={{ left: 40, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13 }} cursor={{ fill: '#eff6ff' }} />
                    <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard title="By country" description="Where destinations are located">
              <div className="h-[320px] p-4">
                {stats!.byCountry.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats!.byCountry} layout="vertical" margin={{ left: 40, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13 }} cursor={{ fill: '#eff6ff' }} />
                      <Bar dataKey="count" fill="#60a5fa" radius={[0, 4, 4, 0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="grid h-full place-items-center text-sm text-slate-400">No location data yet</div>
                )}
              </div>
            </SectionCard>
          </div>
        </>
      )}
    </div>
  )
}
