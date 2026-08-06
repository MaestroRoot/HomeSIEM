import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import { api } from '@/lib/api'
import type { SecurityEventRow } from '@/lib/types'

interface CollectorState {
  /** A collector has reported at least once (there is real data). */
  connected: boolean
  /** A collector reported within the last few minutes (currently active). */
  live: boolean
  latestAt: string | null
}

const LIVE_WINDOW_MS = 10 * 60 * 1000

const CollectorContext = createContext<CollectorState>({
  connected: false,
  live: false,
  latestAt: null,
})

export function useCollector(): CollectorState {
  return useContext(CollectorContext)
}

/**
 * Tells the rest of the dashboard whether a collector is actually feeding data,
 * by looking at the real event stream instead of a hard-coded flag. Polls a
 * single most-recent event every 15s, which is cheap.
 */
export function CollectorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CollectorState>({ connected: false, live: false, latestAt: null })

  useEffect(() => {
    let active = true

    async function check() {
      try {
        const res = await api.get<{ items: SecurityEventRow[]; total: number }>('/events?limit=1')
        if (!active) return
        const latest = res.items[0]?.createdAt ?? null
        const live = latest ? Date.now() - new Date(latest).getTime() < LIVE_WINDOW_MS : false
        setState({ connected: res.total > 0, live, latestAt: latest })
      } catch {
        /* keep previous state on a transient failure */
      }
    }

    check()
    const timer = setInterval(check, 15000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [])

  return <CollectorContext.Provider value={state}>{children}</CollectorContext.Provider>
}
