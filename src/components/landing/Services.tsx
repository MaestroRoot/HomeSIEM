import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Check } from 'lucide-react'
import { moduleCategories, publicModules } from '@/lib/modules'
import type { ModuleCategory } from '@/lib/modules'
import { cx } from '../ui'

type Filter = 'All' | ModuleCategory

const filters: Filter[] = ['All', ...moduleCategories]

const categoryTone: Record<ModuleCategory, string> = {
  Core: 'bg-brand-50 text-brand-700 ring-brand-200',
  Collection: 'bg-sky-50 text-sky-700 ring-sky-200',
  Tools: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  Detection: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  Response: 'bg-blue-50 text-blue-700 ring-blue-200',
  Posture: 'bg-slate-100 text-slate-600 ring-slate-200',
}

export default function Services() {
  const [filter, setFilter] = useState<Filter>('All')
  const shown =
    filter === 'All' ? publicModules : publicModules.filter((m) => m.category === filter)
  const ordered = [...shown].sort((a, b) => a.no - b.no)

  return (
    <section id="services" className="py-20 lg:py-28">
      <div className="container-x">
        <div className="mx-auto max-w-3xl text-center">
          <span className="eyebrow">Services</span>
          <h2 className="section-title mt-4">Everything inside the dashboard</h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            Twenty-five modules covering collection, detection, AI analysis, response and posture. Every card
            below is a live section of the platform, sign in and each one opens on a working screen.
          </p>
        </div>

        {/* category filter */}
        <div className="mt-9 flex flex-wrap items-center justify-center gap-2">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cx(
                'rounded-full px-4 py-2 text-sm font-semibold transition-all',
                filter === f
                  ? 'bg-brand-600 text-white shadow-lift'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-700',
              )}
            >
              {f}
              {f !== 'All' && (
                <span className="ml-1.5 text-xs opacity-70">
                  {publicModules.filter((m) => m.category === f).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* cards */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((m) => (
            <article
              key={m.id}
              className="card group relative flex flex-col p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-300 hover:shadow-lift"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 transition-all duration-300 group-hover:from-brand-600 group-hover:to-brand-700 group-hover:text-white">
                  <m.icon size={22} />
                </span>
                <span
                  className={cx(
                    'chip whitespace-nowrap ring-1',
                    categoryTone[m.category],
                  )}
                >
                  {m.category}
                </span>
              </div>

              <h3 className="mt-4 text-base font-bold text-slate-900">
                <span className="mr-1.5 font-mono text-xs font-semibold text-slate-300">
                  {String(m.no).padStart(2, '0')}
                </span>
                {m.name}
              </h3>
              <p className="mt-1 text-sm font-semibold text-brand-600">{m.tagline}</p>
              <p className="mt-2.5 flex-1 text-sm leading-relaxed text-slate-600">{m.description}</p>

              <ul className="mt-4 space-y-1.5 border-t border-slate-100 pt-4">
                {m.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-xs text-slate-600">
                    <Check size={14} className="mt-px shrink-0 text-brand-500" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <Link
                to={m.path}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-800"
              >
                Open module <ArrowUpRight size={15} />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
