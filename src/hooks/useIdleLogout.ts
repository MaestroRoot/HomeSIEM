import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '@/context/AuthContext'

/** User anaondolewa baada ya dakika 30 bila shughuli yoyote. */
export const IDLE_LIMIT_MS = 30 * 60 * 1000
/** Onyo linajitokeza sekunde 60 kabla ya kuondolewa. */
export const WARN_BEFORE_MS = 60 * 1000

const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart', 'scroll'] as const

/**
 * Inasimamia auto-logout ya muda mrefu wa kutofanya kitu.
 *
 * Wakati wowote `user` yuko na hakuna shughuli (mouse, keyboard, scroll…) kwa
 * zaidi ya `IDLE_LIMIT_MS`, inamtoa nje. Sekunde 60 kabla inarudisha onyo
 * (`warningSeconds`) ili UI ionyeshe countdown yenye kitufe cha "Bado nipo".
 */
export function useIdleLogout(): { warningSeconds: number | null; stayLoggedIn: () => void } {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const lastActivity = useRef(Date.now())
  const signedOut = useRef(false)
  const [warningSeconds, setWarningSeconds] = useState<number | null>(null)

  const touch = useCallback(() => {
    lastActivity.current = Date.now()
    setWarningSeconds(null)
  }, [])

  useEffect(() => {
    if (!user) {
      signedOut.current = false
      return
    }

    touch()
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, touch, { passive: true })
    }

    const interval = window.setInterval(async () => {
      const elapsed = Date.now() - lastActivity.current
      const remaining = IDLE_LIMIT_MS - elapsed

      if (remaining > WARN_BEFORE_MS) {
        setWarningSeconds(null)
        return
      }

      if (remaining <= 0) {
        window.clearInterval(interval)
        if (!signedOut.current) {
          signedOut.current = true
          await logout()
          navigate('/login', { replace: true })
        }
        return
      }

      setWarningSeconds(Math.ceil(remaining / 1000))
    }, 1000)

    return () => {
      window.clearInterval(interval)
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, touch)
      }
    }
  }, [user, logout, navigate, touch])

  return { warningSeconds, stayLoggedIn: touch }
}
