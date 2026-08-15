import { Clock } from 'lucide-react'

import { useIdleLogout } from '@/hooks/useIdleLogout'

/**
 * Onyo la auto-logout: linaonyeshwa sekunde 60 kabla ya kuondolewa kwa
 * kutofanya kitu kwa muda mrefu (dakika 30). "Bado nipo" linarudisha muda.
 */
export default function IdleLogout() {
  const { warningSeconds, stayLoggedIn } = useIdleLogout()

  if (warningSeconds === null) return null

  const minutes = Math.floor(warningSeconds / 60)
  const seconds = warningSeconds % 60

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="idle-logout-title"
    >
      <div className="card w-full max-w-sm p-6 text-center">
        <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-amber-100 text-amber-600">
          <Clock size={22} />
        </span>
        <h3 id="idle-logout-title" className="text-base font-bold text-slate-900">
          You will be signed out soon
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          For your security, you will be logged out in{' '}
          <span className="font-mono font-semibold text-slate-900">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>{' '}
          because of inactivity.
        </p>
        <div className="mt-6">
          <button type="button" className="btn-primary w-full" onClick={stayLoggedIn}>
            I&apos;m still here
          </button>
        </div>
      </div>
    </div>
  )
}
