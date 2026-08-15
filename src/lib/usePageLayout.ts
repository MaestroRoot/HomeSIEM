import { useCallback, useEffect, useState } from 'react'

export interface PageLayout {
  order: string[]
  hidden: string[]
  spans: Record<string, number>
}

const DEFAULTS: PageLayout = { order: [], hidden: [], spans: {} }
const storageKey = (page: string) => `homesiem.layout.${page}`

export function loadLayout(page: string): PageLayout {
  try {
    const raw = localStorage.getItem(storageKey(page))
    if (!raw) return DEFAULTS
    const p = JSON.parse(raw) as Partial<PageLayout>
    return { order: p.order ?? [], hidden: p.hidden ?? [], spans: p.spans ?? {} }
  } catch {
    return DEFAULTS
  }
}

/** Order the visible cards using the saved order (unknown ids keep natural position). */
export function orderCards<T extends { id: string }>(items: T[], order: string[]): T[] {
  if (order.length === 0) return items
  return [...items].sort((a, b) => {
    const ia = order.indexOf(a.id)
    const ib = order.indexOf(b.id)
    if (ia === -1 && ib === -1) return 0
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })
}

/** Per-page, per-user card layout, persisted in localStorage (no backend calls). */
export function usePageLayout(page: string) {
  const [cfg, setCfg] = useState<PageLayout>(() => loadLayout(page))

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(page), JSON.stringify(cfg))
    } catch {
      /* storage full or blocked — ignore */
    }
  }, [page, cfg])

  const reorder = useCallback((activeId: string, overId: string, visibleIds: string[]) => {
    setCfg((c) => {
      const base = c.order.length === visibleIds.length ? c.order : visibleIds
      const from = base.indexOf(activeId)
      const to = base.indexOf(overId)
      if (from === -1 || to === -1 || from === to) return c
      const next = [...base]
      const moved = next.splice(from, 1)[0]
      if (moved === undefined) return c
      next.splice(to, 0, moved)
      return { ...c, order: next }
    })
  }, [])

  const toggleHidden = useCallback((id: string) => {
    setCfg((c) => ({
      ...c,
      hidden: c.hidden.includes(id) ? c.hidden.filter((x) => x !== id) : [...c.hidden, id],
    }))
  }, [])

  const setSpan = useCallback((id: string, span: number) => {
    setCfg((c) => ({ ...c, spans: { ...c.spans, [id]: span } }))
  }, [])

  const reset = useCallback(() => setCfg(DEFAULTS), [])

  return { cfg, reorder, toggleHidden, setSpan, reset }
}
