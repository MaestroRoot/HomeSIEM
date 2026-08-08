import { Link } from 'react-router-dom'
import { Home, ShieldAlert } from 'lucide-react'
import Logo from '@/components/Logo'

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-white px-6">
      <div className="text-center">
        <Link to="/" className="inline-block">
          <Logo />
        </Link>
        <span className="mx-auto mt-10 grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <ShieldAlert size={30} />
        </span>
        <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-slate-900">404</h1>
        <p className="mt-2 text-base text-slate-600">
          That route is not part of the platform. Nothing suspicious, just a wrong turn.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/" className="btn-primary">
            <Home size={16} /> Back to home
          </Link>
          <Link to="/dashboard" className="btn-ghost">
            Open dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
