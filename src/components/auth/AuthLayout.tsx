import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Logo from '../Logo'

export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50/80 via-slate-50 to-slate-100 px-4 py-8">
      <Link
        to="/"
        className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-white/60 hover:text-brand-600"
      >
        <ArrowLeft size={15} /> Back to site
      </Link>

      <div className="w-full max-w-[400px]">
        <div className="mb-6 flex justify-center">
          <Link to="/">
            <Logo />
          </Link>
        </div>

        <h1 className="text-center text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-1.5 text-center text-sm text-slate-500">{subtitle}</p>
        <div className="mt-6">{children}</div>
        <div className="mt-5 text-center text-sm text-slate-600">{footer}</div>

        <p className="mt-4 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} HomeSIEM · Personal SIEM &amp; Home SOC
        </p>
      </div>
    </div>
  )
}
