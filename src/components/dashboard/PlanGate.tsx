import { Link, useLocation } from 'react-router-dom'
import { Lock, Sparkles } from 'lucide-react'

import { useAuth } from '@/context/AuthContext'
import { modules } from '@/lib/modules'
import { planAllows, requiredPlanFor } from '@/lib/plans'

/**
 * Inazuia mtu kufungua module isiyo kwenye kifurushi chake kwa kuandika URL.
 *
 * Hii ni kizuizi cha UI pekee. Endpoints za backend zina ukaguzi wake, na ndizo
 * zenye neno la mwisho, hapa ni kumweleza mtumiaji tu.
 */
export default function PlanGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { pathname } = useLocation()

  const module = modules.find((m) => m.path === pathname)
  if (!module || planAllows(user?.plan, module.id)) return <>{children}</>

  const needed = requiredPlanFor(module.id)

  return (
    <div className="grid place-items-center py-20 text-center">
      <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
        <Lock size={24} />
      </span>
      <h1 className="text-xl font-bold tracking-tight text-slate-900">{module.name}</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        {module.tagline}. This module is available from the{' '}
        <strong className="font-semibold text-slate-700">{needed}</strong> plan up, and you are on{' '}
        <strong className="font-semibold text-slate-700">{user?.plan}</strong>.
      </p>
      <Link to="/dashboard/subscriptions" className="btn-primary mt-6 px-5 py-2.5">
        <Sparkles size={16} /> See the plans
      </Link>
    </div>
  )
}
