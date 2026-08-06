import { useEffect, useState } from 'react'
import { Loader2, ShieldAlert } from 'lucide-react'
import { PageHeader, SectionCard, StatCard, StatusPill, TableWrap } from '@/components/ui'
import { api } from '@/lib/api'
import type { FeedsResponse, StatsOverview, Verdict } from '@/lib/types'

const verdictTone: Record<Verdict, 'red' | 'amber' | 'green' | 'slate'> = {
  malicious: 'red',
  suspicious: 'amber',
  clean: 'green',
  unknown: 'slate',
}

export default function ThreatIntel() {
  const [feeds, setFeeds] = useState<FeedsResponse | null>(null)
  const [stats, setStats] = useState<StatsOverview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const [f, s] = await Promise.all([
          api.get<FeedsResponse>('/intel/feeds'),
          api.get<StatsOverview>('/stats/overview'),
        ])
        if (!active) return
        setFeeds(f)
        setStats(s)
      } catch {
        /* keep */
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    const t = setInterval(load, 12000)
    return () => {
      active = false
      clearInterval(t)
    }
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader icon={ShieldAlert} title="Threat Intelligence" subtitle="The feeds enriching every event, and the indicators they have flagged on your network." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active feeds" value={feeds?.feeds.filter((f) => f.status === 'active').length ?? 0} sub="Enriching events" icon={ShieldAlert} tone="green" />
        <StatCard label="Flagged on your network" value={feeds?.flaggedSeen ?? 0} sub="Suspicious or worse" icon={ShieldAlert} tone="red" />
        <StatCard label="Unique indicators" value={stats?.suspicious.length ?? 0} sub="Distinct flagged" icon={ShieldAlert} tone="amber" />
      </div>

      {loading && !feeds ? (
        <div className="grid place-items-center py-20 text-slate-400"><Loader2 size={22} className="animate-spin" /></div>
      ) : (
        <>
          <SectionCard title="Connected feeds" description="What each feed contributes">
            <ul className="divide-y divide-slate-100">
              {feeds?.feeds.map((f) => (
                <li key={f.name} className="flex items-start justify-between gap-3 px-5 py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">{f.name}</p>
                      <StatusPill tone={f.status === 'active' ? 'green' : 'slate'}>{f.status}</StatusPill>
                    </div>
                    <p className="mt-0.5 text-xs font-semibold text-slate-500">{f.type}</p>
                    <p className="mt-1 text-sm text-slate-600">{f.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Flagged indicators seen" description="Indicators from your traffic that a feed knows about">
            {stats && stats.suspicious.length > 0 ? (
              <TableWrap>
                <table className="table-base">
                  <thead><tr><th>Indicator</th><th>Verdict</th><th>Country</th><th>OTX reports</th><th>Seen</th></tr></thead>
                  <tbody>
                    {stats.suspicious.map((s) => (
                      <tr key={s.indicator}>
                        <td className="font-mono text-[13px] font-semibold text-slate-800">{s.indicator}</td>
                        <td><StatusPill tone={verdictTone[s.verdict]}>{s.verdict}</StatusPill></td>
                        <td className="text-slate-500">{s.country ?? '—'}</td>
                        <td className="tabular-nums">{s.pulseCount}</td>
                        <td className="tabular-nums">{s.count}×</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            ) : (
              <div className="px-5 py-8 text-center text-sm text-slate-400">Nothing flagged yet, that is the good case.</div>
            )}
          </SectionCard>
        </>
      )}
    </div>
  )
}
