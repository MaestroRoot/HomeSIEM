import { useEffect, useRef } from 'react'

/**
 * Drop-in badala ya `setInterval(fn, ms)` kwa polling: inaruka fetch tab ikiwa
 * haionekani (hidden), na inafetch mara moja tab inaporejea. Inarudisha cleanup
 * (iite kwenye return ya useEffect badala ya `clearInterval`).
 *
 *   const stop = pollWhenVisible(load, 15000)
 *   return () => { active = false; stop() }
 */
export function pollWhenVisible(fn: () => void, intervalMs: number): () => void {
  const tick = () => {
    if (document.visibilityState === 'visible') fn()
  }
  const timer = window.setInterval(tick, intervalMs)
  document.addEventListener('visibilitychange', tick)
  return () => {
    window.clearInterval(timer)
    document.removeEventListener('visibilitychange', tick)
  }
}

/**
 * Endesha `fn` mara moja, kisha kila `intervalMs`.
 *
 * Muhimu kwa mtandao wa polepole: **inasimama tab ikiwa haionekani** (hidden) na
 * **inaendesha mara moja tab inaporejea**. Hii inakata maombi mengi bure (tab
 * nyingi zipo nyuma), inapunguza mzigo kwenye server ndogo na latency kubwa.
 *
 * `fn` ya mwisho ndiyo hutumika kila mara (kupitia ref), kwa hiyo `deps` inaweza
 * kubaki `[]` hata kama `fn` inatengenezwa upya kila render. Tumia `deps` pale
 * tu unapotaka interval ianze upya (mfano param imebadilika).
 */
export function usePolling(
  fn: () => void | Promise<void>,
  intervalMs: number,
  deps: unknown[] = [],
): void {
  const saved = useRef(fn)
  saved.current = fn

  useEffect(() => {
    let stopped = false
    const run = () => {
      if (!stopped && document.visibilityState === 'visible') void saved.current()
    }

    run() // ya kwanza mara moja
    const timer = window.setInterval(run, intervalMs)
    const onVisible = () => {
      if (document.visibilityState === 'visible') run() // refresh mara moja tab inaporejea
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      stopped = true
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, ...deps])
}
