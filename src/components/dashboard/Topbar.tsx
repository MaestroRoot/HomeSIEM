import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, Command, CreditCard, HelpCircle, LogOut, Menu, Moon, Search, Settings, ShieldCheck, Sun } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { alerts } from '@/lib/data'
import { SeverityBadge, cx } from '../ui'
import TrialBadge from './TrialBadge'

export default function Topbar({ onMenu, onCommand, onHelp }: { onMenu: () => void; onCommand: () => void; onHelp: () => void }) {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [q, setQ] = useState('')
  const wrap = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrap.current && !wrap.current.contains(e.target as Node)) {
        setMenuOpen(false)
        setBellOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const open = alerts.filter((a) => a.status === 'open')

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    navigate(`/dashboard/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md sm:px-6">
      <button
        type="button"
        onClick={onMenu}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 lg:hidden"
        aria-label="Open navigation"
      >
        <Menu size={18} />
      </button>

      <form onSubmit={submitSearch} className="relative hidden max-w-md flex-1 sm:block">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-2.5 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
          placeholder="Search IP, user, host, process, hash, domain…"
        />
        <button type="button" onClick={onCommand} className="absolute right-1.5 top-1.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 hover:text-brand-700" aria-label="Open command palette">⌘K</button>
      </form>

      <div className="ml-auto flex items-center gap-2" ref={wrap}>
        <TrialBadge />

        <button type="button" onClick={onCommand} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 sm:hidden" aria-label="Open command palette" title="Command palette">
          <Command size={17} />
        </button>

        <button type="button" onClick={onHelp} className="hidden h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 md:grid" aria-label="Keyboard shortcuts" title="Keyboard shortcuts">
          <HelpCircle size={17} />
        </button>

        {/* theme toggle */}
        <button
          type="button"
          onClick={toggle}
          className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setBellOpen((v) => !v)
              setMenuOpen(false)
            }}
            className="relative grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            aria-label="Notifications"
          >
            <Bell size={17} />
            <span className="absolute -right-1 -top-1 grid h-4.5 min-w-[18px] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-4 text-white">
              {open.length}
            </span>
          </button>

          {bellOpen && (
            <div className="absolute right-0 mt-2 w-[340px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-bold text-slate-900">Open alerts</p>
                <Link
                  to="/dashboard/alerts"
                  onClick={() => setBellOpen(false)}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-800"
                >
                  View all
                </Link>
              </div>
              <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
                {open.map((a) => (
                  <li key={a.id}>
                    <Link
                      to="/dashboard/alerts"
                      onClick={() => setBellOpen(false)}
                      className="block px-4 py-3 hover:bg-brand-50/50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <SeverityBadge severity={a.severity} />
                        <span className="font-mono text-[11px] text-slate-400">{a.time}</span>
                      </div>
                      <p className="mt-1.5 text-sm font-medium leading-snug text-slate-800">{a.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{a.device}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* user menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setMenuOpen((v) => !v)
              setBellOpen(false)
            }}
            className="flex items-center gap-2 rounded-lg border border-slate-200 py-1.5 pl-1.5 pr-2.5 hover:bg-slate-50"
          >
            <span className="grid h-7 w-7 place-items-center rounded-md bg-brand-600 text-xs font-bold text-white">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block max-w-[120px] truncate text-xs font-bold leading-tight text-slate-800">
                {user?.name}
              </span>
              <span className="block text-[10px] capitalize leading-tight text-slate-500">{user?.role}</span>
            </span>
            <ChevronDown size={14} className={cx('text-slate-400 transition-transform', menuOpen && 'rotate-180')} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="truncate text-sm font-bold text-slate-900">{user?.name}</p>
                <p className="truncate text-xs text-slate-500">{user?.email}</p>
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                  <ShieldCheck size={11} /> {user?.plan} plan · MFA {user?.mfaEnabled ? 'on' : 'off'}
                </span>
              </div>
              <div className="p-1.5">
                <Link
                  to="/dashboard/account"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Settings size={15} className="text-slate-400" /> Account & API keys
                </Link>
                <Link
                  to="/dashboard/subscriptions"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <CreditCard size={15} className="text-slate-400" /> Subscription & billing
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    await logout()
                    navigate('/')
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
