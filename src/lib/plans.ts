import type { Plan } from '@/context/AuthContext'

/**
 * Nakala ya `backend/app/core/plans.py` kwa ajili ya UI pekee.
 *
 * Hii ni ya kuonyesha na kuficha vitu kwenye skrini. Ruhusa halisi
 * inatolewa na backend, ambayo inasoma kifurushi kutoka DB na haiamini
 * chochote kinachotoka hapa. Ukibadilisha upande mmoja, badilisha na mwingine.
 */

export interface PlanLimits {
  devices: number
  retentionDays: number
  aiRequestsPerDay: number
  seats: number
}

export interface PlanSpec {
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

export const PLAN_ORDER: Plan[] = ['Free', 'Home', 'Pro', 'Business']

export const PLAN_RANK: Record<Plan, number> = {
  Free: 0,
  Home: 1,
  Pro: 2,
  Business: 3,
}

const FREE_MODULES = ['account', 'overview', 'agents', 'devices', 'logs', 'alerts', 'score']
const HOME_MODULES = [
  ...FREE_MODULES,
  'capture',
  'detection',
  'ioc',
  'timeline',
  'search',
  'visualization',
  'ai-logs',
]
const PRO_MODULES = [
  ...HOME_MODULES,
  'pcap',
  'ai-packets',
  'assistant',
  'incidents',
  'rules',
  'intel',
  'reports',
]
const BUSINESS_MODULES = [
  ...PRO_MODULES,
  'ai-rules',
  'inventory',
  'vulnerabilities',
  'forensics',
  'investigation',
]

export const PLAN_MODULES: Record<Plan, string[]> = {
  Free: FREE_MODULES,
  Home: HOME_MODULES,
  Pro: PRO_MODULES,
  Business: BUSINESS_MODULES,
}

/** Everyone can reach `subscriptions`, that is where upgrades happen. */
const ALWAYS_ALLOWED = new Set(['subscriptions'])

export function planAllows(plan: Plan | undefined, moduleId: string): boolean {
  if (ALWAYS_ALLOWED.has(moduleId)) return true
  if (!plan) return false
  return PLAN_MODULES[plan].includes(moduleId)
}

/** Kifurushi cha bei ya chini kabisa kinachotoa module hii. */
export function requiredPlanFor(moduleId: string): Plan | null {
  return PLAN_ORDER.find((plan) => PLAN_MODULES[plan].includes(moduleId)) ?? null
}

export function isUpgrade(current: Plan, target: Plan): boolean {
  return PLAN_RANK[target] > PLAN_RANK[current]
}

export function formatTzs(amount: number): string {
  return new Intl.NumberFormat('en-GB').format(amount)
}
