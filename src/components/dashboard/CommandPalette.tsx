import { useEffect, useMemo, useState } from 'react'
import { Command, HelpCircle, Search, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { modules } from '@/lib/modules'
import { cx } from '@/components/ui'

const shortcuts = [
  ['⌘ / Ctrl + K', 'Open command palette'],
  ['?', 'Show keyboard shortcuts'],
  ['Esc', 'Close dialogs'],
]

export function CommandPalette({ open, onClose, onHelp }: { open: boolean; onClose: () => void; onHelp: () => void }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!open) return
    setQuery('')
    const timer = window.setTimeout(() => document.getElementById('command-search')?.focus(), 0)
    return () => window.clearTimeout(timer)
  }, [open])

  const results = useMemo(() => {
    const text = query.toLowerCase().trim()
    return modules.filter((module) => !text || `${module.name} ${module.category} ${module.tagline}`.toLowerCase().includes(text)).slice(0, 8)
  }, [query])

  if (!open) return null

  function go(path: string) {
    navigate(path)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-start bg-slate-950/45 px-4 pt-[12vh] backdrop-blur-sm" onMouseDown={onClose} role="presentation">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="flex items-center gap-3 border-b border-slate-100 px-4">
          <Search size={18} className="text-slate-400" />
          <input id="command-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Jump to a module…" className="h-14 min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400" />
          <kbd className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">ESC</kbd>
        </div>
        <div className="p-2">
          <p className="px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Modules</p>
          {results.map((module) => (
            <button key={module.id} type="button" onClick={() => go(module.path)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-brand-50">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500"><module.icon size={16} /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-800">{module.name}</span><span className="block truncate text-xs text-slate-500">{module.tagline}</span></span>
              <span className="text-xs text-slate-400">{module.category}</span>
            </button>
          ))}
          {results.length === 0 && <p className="px-3 py-8 text-center text-sm text-slate-400">No modules match “{query}”.</p>}
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5"><Command size={13} /> Search and navigate</span>
          <button type="button" onClick={onHelp} className="inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:text-brand-900"><HelpCircle size={14} /> Shortcuts</button>
        </div>
      </div>
    </div>
  )
}

export function KeyboardHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm" onMouseDown={onClose} role="presentation">
    <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
      <div className="flex items-center justify-between"><div><h2 className="text-base font-bold text-slate-900">Keyboard shortcuts</h2><p className="mt-0.5 text-sm text-slate-500">Move through HomeSIEM faster.</p></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Close shortcuts"><X size={18} /></button></div>
      <dl className="mt-5 space-y-3">{shortcuts.map(([keys, label]) => <div key={keys} className="flex items-center justify-between gap-4"><dt className="text-sm text-slate-600">{label}</dt><dd className={cx('rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs font-semibold text-slate-600')}>{keys}</dd></div>)}</dl>
    </div>
  </div>
}
