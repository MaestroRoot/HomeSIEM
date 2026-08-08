import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Gauge, Loader2 } from 'lucide-react'
import { PageHeader, SectionCard, SeverityBadge } from '@/components/ui'
import { api } from '@/lib/api'
import { pollWhenVisible } from '@/lib/usePolling'
import type { SecurityScore as Score, Severity } from '@/lib/types'

function ring(score: number) {
  if (score >= 90) return '#10b981'
  if (score >= 75) return '#3b82f6'
  if (score >= 60) return '#f59e0b'
  return '#dc2626'
}

export default function SecurityScore() {
  const [data, setData] = useState<Score | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const s = await api.get<Score>('/stats/score')
        if (active) setData(s)
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

  const score = data?.score ?? 0
  const circumference = 2 * Math.PI * 54
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="space-y-6">
      <PageHeader icon={Gauge} title="Home Security Score" subtitle="One number for your whole network, with the exact problems dragging it down and how to fix each one." actions={<Link to="/dashboard/compliance" className="btn-soft btn-sm">Compliance</Link>} />

      {loading && !data ? (
        <div className="grid place-items-center py-20 text-slate-400"><Loader2 size={22} className="animate-spin" /></div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <SectionCard>
            <div className="flex flex-col items-center p-6">
              <div className="relative h-40 w-40">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                  <circle cx="60" cy="60" r="54" fill="none" stroke={ring(score)} strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-700" />
                </svg>
                <div className="absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <div className="text-4xl font-extrabold text-slate-900">{score}</div>
                    <div className="text-xs font-semibold text-slate-400">grade {data?.grade}</div>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-center text-sm text-slate-600">{data?.summary}</p>
            </div>
          </SectionCard>

          <SectionCard title="What is affecting your score" description={`${data?.issues.length ?? 0} issue(s)`}>
            {data && data.issues.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {data.issues.map((iss, i) => (
                  <li key={i} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <SeverityBadge severity={iss.severity as Severity} />
                          <p className="font-semibold text-slate-900">{iss.title}</p>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{iss.detail}</p>
                        <p className="mt-1.5 text-sm text-brand-700"><span className="font-semibold">Fix:</span> {iss.fix}</p>
                      </div>
                      <span className="shrink-0 rounded-lg bg-red-50 px-2 py-1 text-xs font-bold text-red-600">−{iss.impact}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-5 py-10 text-center text-sm text-slate-400">Nothing is pulling your score down. Nice.</div>
            )}
          </SectionCard>
        </div>
      )}
    </div>
  )
}
