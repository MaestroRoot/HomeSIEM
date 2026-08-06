import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, KeyRound, Radio, ShieldCheck, Waves, X } from 'lucide-react'

const STEPS = [
  {
    icon: ShieldCheck,
    title: 'Welcome to HomeSIEM',
    body: 'Your home Security Operations Center. It watches what your devices connect to, enriches it with GeoIP and threat intelligence, and flags anything that looks bad.',
  },
  {
    icon: KeyRound,
    title: 'Connect a sensor',
    body: 'Open the Agents page to generate a token and run one command on a host. It enrolls once and keeps running — after that you trigger scans, forensics, captures and log collection by clicking, no more commands.',
  },
  {
    icon: Waves,
    title: 'Watch the data land',
    body: 'Point a device’s DNS at your resolver, or run the agent, and events start flowing. The Dashboard, Alerts and Live activity fill in on their own. Nothing here is simulated.',
  },
]

export default function Onboarding({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0)
  if (!open) return null
  const s = STEPS[step]!
  const Icon = s.icon
  const last = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-600"><Radio size={13} /> Getting started</span>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Skip"><X size={18} /></button>
        </div>
        <div className="p-6 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white"><Icon size={26} /></span>
          <h2 className="mt-4 text-lg font-bold text-slate-900">{s.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.body}</p>
        </div>
        <div className="flex items-center justify-center gap-1.5 pb-2">
          {STEPS.map((_, i) => (
            <span key={i} className={i === step ? 'h-1.5 w-5 rounded-full bg-brand-600' : 'h-1.5 w-1.5 rounded-full bg-slate-300'} />
          ))}
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-5 py-3">
          <button type="button" onClick={onClose} className="text-sm font-semibold text-slate-500 hover:text-slate-700">Skip</button>
          <div className="flex gap-2">
            {step > 0 && <button type="button" onClick={() => setStep((v) => v - 1)} className="btn-ghost btn-sm">Back</button>}
            {last ? (
              <Link to="/dashboard/agents" onClick={onClose} className="btn-primary btn-sm">Go to Agents <ArrowRight size={14} /></Link>
            ) : (
              <button type="button" onClick={() => setStep((v) => v + 1)} className="btn-primary btn-sm">Next <ArrowRight size={14} /></button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
