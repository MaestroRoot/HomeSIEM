import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { ChevronDown, Lock, ShieldCheck, X } from 'lucide-react'

import Logo from '../Logo'
import { navGroups, moduleCategories } from '@/lib/modules'
import { useAuth } from '@/context/AuthContext'
import { planAllows, requiredPlanFor } from '@/lib/plans'
import { cx } from '../ui'
import { alerts } from '@/lib/data'

const COLLAPSE_KEY = 'homesiem.sidebar.collapsed'

function readCollapsed(): Set<string> {
  try {
    const raw = localStorage.getItem(COLLAPSE_KEY)
    if (raw) return new Set(JSON.parse(raw))
  } catch { /* */ }
  return new Set(moduleCategories)
}

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth()
  const openAlerts = alerts.filter((a) => a.status === 'open').length
  const [collapsed, setCollapsed] = useState<Set<string>>(readCollapsed)

  function toggle(cat: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      try { localStorage.setItem(COLLAPSE_KEY, JSON.stringify([...next])) } catch { /* */ }
      return next
    })
  }

  function isCollapsed(cat: string): boolean {
    return collapsed.has(cat)
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-100 px-4">
          <Link to="/" onClick={onClose}>
            <Logo />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 lg:hidden"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-1.5">
          {user?.role === 'admin' && (
            <div className="mb-2">
              <p className="px-2 pb-0.5 pt-1.5 text-[9px] font-bold uppercase tracking-[.12em] text-slate-400">
                Platform admin
              </p>
              <NavLink
                to="/admin"
                end
                onClick={onClose}
                className={({ isActive }) =>
                  cx(
                    'group flex items-center gap-2 rounded-md border px-2 py-1 text-[12px] font-semibold transition-colors',
                    isActive
                      ? 'border-brand-200 bg-brand-600 text-white shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700',
                  )
                }
              >
                <ShieldCheck size={14} className="text-brand-500 group-hover:text-brand-600" />
                Admin console
              </NavLink>
            </div>
          )}
          {navGroups.map((group) => {
            if (group.items.length === 0) return null
            const collapsed_ = isCollapsed(group.category)
            return (
              <div key={group.category} className="mb-0.5">
                <button
                  type="button"
                  onClick={() => toggle(group.category)}
                  className="flex w-full items-center justify-between px-2 pb-0.5 pt-1.5 text-left"
                >
                  <span className="text-[9px] font-bold uppercase tracking-[.12em] text-slate-400">
                    {group.category}
                  </span>
                  <ChevronDown
                    size={12}
                    className={cx('text-slate-400 transition-transform', collapsed_ && '-rotate-90')}
                  />
                </button>
                {!collapsed_ && (
                  <ul className="space-y-px">
                    {group.items.map((m) => {
                      const locked = !planAllows(user?.plan, m.id)

                      if (locked) {
                        return (
                          <li key={m.id}>
                            <Link
                              to="/dashboard/subscriptions"
                              onClick={onClose}
                              title={`Available on the ${requiredPlanFor(m.id) ?? 'higher'} plan`}
                              className="group flex items-center gap-2 rounded-md px-2 py-0.5 text-[12px] font-medium leading-tight text-slate-400 transition-colors hover:bg-slate-50"
                            >
                              <m.icon size={14} className="shrink-0 text-slate-300" />
                              <span className="truncate">{m.name}</span>
                              <Lock size={10} className="ml-auto shrink-0 text-slate-300" />
                            </Link>
                          </li>
                        )
                      }

                      return (
                        <li key={m.id}>
                          <NavLink
                            to={m.path}
                            end={m.path === '/dashboard'}
                            onClick={onClose}
                            className={({ isActive }) =>
                              cx(
                                'group flex items-center gap-2 rounded-md px-2 py-0.5 text-[12px] font-medium leading-tight transition-colors',
                                isActive
                                  ? 'bg-brand-600 text-white shadow-sm'
                                  : 'text-slate-600 hover:bg-brand-50 hover:text-brand-700',
                              )
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <m.icon
                                  size={14}
                                  className={cx(
                                    'shrink-0',
                                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-600',
                                  )}
                                />
                                <span className="truncate">{m.name}</span>
                                {m.id === 'alerts' && openAlerts > 0 && (
                                  <span
                                    className={cx(
                                      'ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                                      isActive ? 'bg-white/25 text-white' : 'bg-red-100 text-red-600',
                                    )}
                                  >
                                    {openAlerts}
                                  </span>
                                )}
                              </>
                            )}
                          </NavLink>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
