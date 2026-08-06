import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import Logo from '../Logo'

export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  highlights,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
  highlights: string[]
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* form side */}
      <div className="flex flex-col px-6 py-8 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between">
          <Link to="/">
            <Logo />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-brand-600"
          >
            <ArrowLeft size={15} /> Back to site
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
            <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <div className="mt-6 text-center text-sm text-slate-600">{footer}</div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400">
          © {new Date().getFullYear()} HomeSIEM · Personal SIEM &amp; Home SOC
        </p>
      </div>

      {/* brand side */}
      <div className="relative hidden overflow-hidden bg-brand-700 lg:block">
        <div className="absolute inset-0 grid-bg opacity-25" />
        <div className="absolute -left-20 top-10 h-96 w-96 rounded-full bg-brand-500/40 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 h-96 w-96 rounded-full bg-brand-400/30 blur-3xl" />

        <div className="relative flex h-full flex-col justify-center px-14 xl:px-20">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-100">
            Home SOC Platform
          </span>
          <h2 className="mt-6 text-3xl font-extrabold leading-tight tracking-tight text-white xl:text-4xl">
            Twenty-five security modules.
            <span className="block text-brand-200">One dashboard you actually understand.</span>
          </h2>

          <ul className="mt-8 space-y-3.5">
            {highlights.map((h) => (
              <li key={h} className="flex items-start gap-3 text-sm text-brand-50">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/20">
                  <Check size={12} className="text-white" />
                </span>
                {h}
              </li>
            ))}
          </ul>

          <div className="mt-10 rounded-xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
            <p className="flex items-start gap-2.5 text-sm leading-relaxed text-white">
              <span className="mt-px grid h-6 w-6 shrink-0 place-items-center rounded bg-white text-[10px] font-bold text-brand-700">
                AI
              </span>
              <span>
                “Five devices are communicating with the same suspicious IP, suggesting a possible shared
                compromise. Confidence: 87%.”
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
