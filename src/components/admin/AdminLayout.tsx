import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, LogOut, ShieldCheck, Users } from 'lucide-react'

import Logo from '../Logo'
import IdleLogout from '../dashboard/IdleLogout'
import { useAuth } from '@/context/AuthContext'
import { cx } from '../ui'

const adminNav = [
  { to: '/admin', end: true, label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/users', end: false, label: 'Users', icon: Users },
]

function AdminLayoutInner() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-slate-200 bg-white">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-100 px-4">
          <Link to="/admin">
            <Logo />
          </Link>
        </div>

        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
            <ShieldCheck size={16} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-slate-900">{user.name}</p>
            <p className="truncate text-[10px] text-slate-500">{user.email}</p>
          </div>
        </div>

        <nav className="min-h-0 flex-1 space-y-px overflow-y-auto p-2">
          <p className="px-2 pb-0.5 pt-1.5 text-[9px] font-bold uppercase tracking-[.12em] text-slate-400">
            Platform admin
          </p>
          {adminNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cx(
                  'flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors',
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-brand-50 hover:text-brand-700',
                )
              }
            >
              <item.icon size={15} />
              {item.label}
            </NavLink>
          ))}
          <div className="pt-3">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] font-medium text-slate-600 hover:bg-slate-50"
            >
              <LayoutDashboard size={15} className="text-slate-400" />
              Your dashboard
            </Link>
          </div>
        </nav>

        <div className="border-t border-slate-100 p-2">
          <button
            type="button"
            onClick={async () => {
              await logout()
              navigate('/login', { replace: true })
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <p className="text-sm font-bold text-slate-900">Admin console</p>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
            <ShieldCheck size={11} /> admin
          </span>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>

      <IdleLogout />
    </div>
  )
}

export default function AdminLayout() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
          <p className="text-sm text-slate-500">Loading admin…</p>
        </div>
      </div>
    )
  }

  return <AdminLayoutInner />
}
