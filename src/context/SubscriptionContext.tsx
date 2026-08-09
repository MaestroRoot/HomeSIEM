import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { useAuth } from '@/context/AuthContext'
import type { Plan } from '@/context/AuthContext'
import { api } from '@/lib/api'

export interface PlanLimits {
  devices: number
  retentionDays: number
  aiRequestsPerDay: number
  seats: number
}

export interface PlanRead {
  plan: Plan
  label: string
  tagline: string
  priceTzs: number
  currency: string
  limits: PlanLimits
  modules: string[]
  highlights: string[]
  recommended: boolean
}

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'pending'
  | 'past_due'
  | 'expired'
  | 'cancelled'

export interface SubscriptionRead {
  id: string
  plan: Plan
  status: SubscriptionStatus
  priceTzs: number
  currency: string
  startedAt: string | null
  currentPeriodEnd: string | null
  trialEndsAt: string | null
  cancelledAt: string | null
  autoRenew: boolean
  trialDaysLeft: number | null
}

export type PaymentMethod = 'mobile_money' | 'bank_card' | 'paypal'
export type PaymentChannel = 'yas_mix' | 'mpesa' | 'halopesa' | 'airtel_money' | 'card' | 'paypal' | 'pesapal'

export interface PaymentRead {
  id: string
  plan: Plan
  amountTzs: number
  currency: string
  method: PaymentMethod
  channel: PaymentChannel
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled'
  msisdn: string | null
  cardLast4: string | null
  cardBrand: string | null
  reference: string
  providerReference: string | null
  failureReason: string | null
  paidAt: string | null
  createdAt: string
}

export interface SubscriptionState {
  subscription: SubscriptionRead
  catalogue: { currency: string; plans: PlanRead[] }
  modules: string[]
  limits: PlanLimits
  pendingPayment: PaymentRead | null
}

interface Value {
  state: SubscriptionState | null
  loading: boolean
  error: string
  reload: () => Promise<void>
}

const SubscriptionContext = createContext<Value | undefined>(undefined)

/**
 * One fetch of `/subscriptions/me` shared by everything that needs it: the
 * trial countdown in the sidebar, the module gate, and the Subscriptions page.
 * Without this each of them would hit the API separately on every navigation.
 */
export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, refreshUser } = useAuth()
  const [state, setState] = useState<SubscriptionState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    if (!user) {
      setState(null)
      setLoading(false)
      return
    }
    setError('')
    try {
      setState(await api.get<SubscriptionState>('/subscriptions/me'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your plan.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void reload()
  }, [reload])

  // Reading the subscription is what expires a finished trial server side, so
  // the plan on the user record can change underneath us. Pull the fresh one
  // in, otherwise the sidebar keeps unlocking modules the plan no longer has.
  useEffect(() => {
    if (state && user && state.subscription.plan !== user.plan) void refreshUser()
  }, [state, user, refreshUser])

  const value = useMemo(
    () => ({ state, loading, error, reload }),
    [state, loading, error, reload],
  )

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext)
  if (!ctx) throw new Error('useSubscription must be used inside <SubscriptionProvider>')
  return ctx
}
