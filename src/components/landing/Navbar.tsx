import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Menu, X } from 'lucide-react'
import Logo from '../Logo'
import { cx } from '../ui'
import { useAuth } from '@/context/AuthContext'

const links = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Services', path: '/services' },
  { label: 'Pricing', path: '/pricing' },
  { label: 'How it works', path: '/how-it-works' },
  { label: 'Who it is for', path: '/who-it-is-for' },
  { label: 'Contact', path: '/contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const { pathname } = useLocation()

  const transparentPages = ['/', '/pricing']
  const isTransparent = !scrolled && transparentPages.includes(pathname)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cx(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        isTransparent
          ? 'bg-transparent'
          : 'border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-md',
      )}
    >
      <nav className="container-x flex h-[72px] items-center justify-between gap-6">
        <Link to="/" className="shrink-0" aria-label="HomeSIEM home">
          <Logo variant={isTransparent ? 'light' : 'dark'} />
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <li key={l.path}>
              <Link
                to={l.path}
                className={cx(
                  'rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors',
                  pathname === l.path
                    ? isTransparent
                      ? 'bg-white/15 text-white'
                      : 'bg-brand-50 text-brand-700'
                    : isTransparent
                      ? 'text-white/80 hover:bg-white/10 hover:text-white'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-brand-700',
                )}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* top-right auth actions */}
        <div className="hidden items-center gap-2.5 md:flex">
          {user ? (
            <Link to="/dashboard" className={isTransparent ? 'btn-primary border border-white/20 bg-white/10 text-white hover:bg-white/20' : 'btn-primary'}>
              <LayoutDashboard size={16} /> Open Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className={isTransparent ? 'rounded-lg px-4 py-2 text-sm font-semibold text-white/80 hover:text-white' : 'btn-ghost'}>
                Login
              </Link>
              <Link to="/signup" className={isTransparent ? 'btn-primary border border-white/20 bg-white/10 text-white hover:bg-white/20' : 'btn-primary'}>
                Sign Up Free
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cx(
            'grid h-10 w-10 place-items-center rounded-lg border md:hidden',
            isTransparent
              ? 'border-white/20 text-white'
              : 'border-slate-200 text-slate-700',
          )}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-slate-200 bg-white px-5 pb-5 pt-3 shadow-lg md:hidden">
          <ul className="space-y-1">
            {links.map((l) => (
              <li key={l.path}>
                <Link
                  to={l.path}
                  onClick={() => setOpen(false)}
                  className={cx(
                    'block rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-brand-50 hover:text-brand-700',
                    pathname === l.path ? 'bg-brand-50 text-brand-700' : 'text-slate-700',
                  )}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {user ? (
              <Link to="/dashboard" className="btn-primary col-span-2" onClick={() => setOpen(false)}>
                Open Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-ghost" onClick={() => setOpen(false)}>
                  Login
                </Link>
                <Link to="/signup" className="btn-primary" onClick={() => setOpen(false)}>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
