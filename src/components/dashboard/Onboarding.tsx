import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, ChevronRight, Radio, ShieldCheck, X } from 'lucide-react'
import { Link } from 'react-router-dom'

const STEPS = 4

export default function Onboarding({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0)
  const last = step === STEPS - 1

  function goNext() {
    setStep((current) => Math.min(STEPS - 1, current + 1))
  }

  function goBack() {
    setStep((current) => Math.max(0, current - 1))
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-600">
            <Radio size={13} /> Getting started
          </span>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {step === 0 && (
            <div className="text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white">
                <ShieldCheck size={26} />
              </span>
              <h2 className="mt-4 text-lg font-bold text-slate-900">Welcome to HomeSIEM</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                HomeSIEM begins collecting data after you connect an agent on a computer in your network.
              </p>
              <p className="mt-3 text-xs text-slate-400">This guide shows you where to set it up and where to view the results.</p>
            </div>
          )}

          {step === 1 && (
            <div className="text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white">
                <Radio size={26} />
              </span>
              <h2 className="mt-4 text-lg font-bold text-slate-900">Set up an agent</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Go to the Agents page to download the app, generate a token, and connect the computer you want HomeSIEM to monitor.
              </p>
              <Link to="/dashboard/agents" onClick={onClose} className="btn-primary btn-sm mt-5 inline-flex">
                Open Agents page
              </Link>
              <p className="mt-4 text-xs text-slate-400">
                In the app, paste the token and choose the collection features you need, such as event logs, network activity, software inventory, or forensics.
              </p>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white">
                  <ChevronRight size={26} />
                </span>
                <h2 className="mt-4 text-lg font-bold text-slate-900">Find your data</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Once an agent is online, open the relevant dashboard page to review or collect each type of data.
                </p>
              </div>
              <div className="mt-5 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p><strong>Devices</strong> — connected hosts and their network activity.</p>
                <p><strong>Log Collection</strong> — collect and examine Windows or system logs.</p>
                <p><strong>Live Capture</strong> and <strong>Packet Analysis</strong> — capture and investigate network packets.</p>
                <p><strong>Network Inventory</strong> — discovered devices and installed software.</p>
                <p><strong>Forensics</strong> and <strong>Vulnerabilities</strong> — run deeper checks on an enrolled agent.</p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500 text-white">
                <Check size={26} />
              </span>
              <h2 className="mt-4 text-lg font-bold text-slate-900">You are ready to begin</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Connect your first agent from the Agents page. Data will appear as the agent reports and as you start collections from the dashboard.
              </p>
              <Link to="/dashboard/agents" onClick={onClose} className="btn-primary btn-sm mt-5 inline-flex">
                Go to Agents
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-5 py-3">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            aria-label="Previous step"
            className="btn-ghost btn-sm grid h-9 w-9 place-items-center !p-0 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: STEPS }, (_, index) => (
              <span key={index} className={index === step ? 'h-1.5 w-5 rounded-full bg-brand-600' : 'h-1.5 w-1.5 rounded-full bg-slate-300'} />
            ))}
          </div>

          <button
            type="button"
            onClick={goNext}
            disabled={last}
            aria-label="Next step"
            className="btn-primary btn-sm grid h-9 w-9 place-items-center !p-0 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
