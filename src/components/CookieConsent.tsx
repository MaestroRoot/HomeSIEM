import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Cookie } from 'lucide-react'

const KEY = 'homesiem-cookie-consent'

export default function CookieConsent() {
  const [show, setShow] = useState(() => {
    try {
      return !localStorage.getItem(KEY)
    } catch {
      return false
    }
  })

  if (!show) return null

  function decide(value: 'accepted' | 'essential') {
    try {
      localStorage.setItem(KEY, value)
    } catch {
      /* ignore */
    }
    setShow(false)
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-[90] mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-4 shadow-2xl sm:flex sm:items-center sm:gap-4">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
          <Cookie size={18} />
        </span>
        <p className="text-sm leading-relaxed text-slate-600">
          We use essential cookies to keep you signed in and remember preferences like your theme. No advertising or
          cross-site tracking. See our{' '}
          <Link to="/cookie" className="font-semibold text-brand-700 hover:underline">Cookie Policy</Link>.
        </p>
      </div>
      <div className="mt-3 flex shrink-0 gap-2 sm:mt-0">
        <button type="button" onClick={() => decide('essential')} className="btn-ghost btn-sm">Essential only</button>
        <button type="button" onClick={() => decide('accepted')} className="btn-primary btn-sm">Accept</button>
      </div>
    </div>
  )
}
