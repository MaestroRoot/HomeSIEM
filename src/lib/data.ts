/**
 * Live datasets for the dashboard.
 *
 * These are deliberately empty. The demo fixtures that used to live here have
 * been removed so nothing on screen is invented: every number the dashboard
 * shows should come from a real collector.
 *
 * As each backend module lands (devices, alerts, log sources, captures and so
 * on), replace the matching constant below with a fetch through
 * `@/lib/api`, and the pages will fill in on their own. Until then the UI
 * renders its empty states, which is the truthful thing to show.
 */

import type {
  Alert,
  Device,
  DetectionRule,
  Incident,
  Ioc,
  LogSource,
  PacketRow,
  TimelineEvent,
  Vulnerability,
} from './types'

/** Flip to true once a collector is actually feeding the platform. */
export const hasLiveData = false

/* ---------- collections ---------- */

export const devices: Device[] = []
export const alerts: Alert[] = []
export const logSources: LogSource[] = []
export const packets: PacketRow[] = []
export const incidents: Incident[] = []
export const detectionRules: DetectionRule[] = []
export const iocs: Ioc[] = []
export const timelineEvents: TimelineEvent[] = []
export const vulnerabilities: Vulnerability[] = []

/* ---------- chart series ---------- */

export const eventsOverTime: { t: string; events: number; alerts: number }[] = []
export const protocolBreakdown: { name: string; value: number }[] = []
export const bandwidthSeries: { t: string; in: number; out: number }[] = []

export const topTalkers: {
  ip: string
  host: string
  packets: number
  bytes: string
  pct: number
}[] = []

export const suspiciousIps: {
  ip: string
  country: string
  hits: number
  reason: string
  severity: 'critical' | 'high' | 'medium' | 'low'
}[] = []

export const threatFeeds: {
  name: string
  type: string
  entries: number
  updated: string
  status: string
}[] = []

export const securityScoreIssues: {
  title: string
  impact: number
  severity: 'critical' | 'high' | 'medium' | 'low'
  detail: string
  fix: string
}[] = []

export const inventoryHosts: {
  ip: string
  host: string
  os: string
  ports: string
  services: string
  risk: 'high' | 'medium' | 'low'
}[] = []

export const forensicArtifacts: {
  files: { path: string; sha256: string; size: string; created: string; verdict: string }[]
  processes: {
    pid: number
    name: string
    parent: string
    cmd: string
    user: string
    verdict: string
  }[]
  registry: { key: string; value: string; data: string; verdict: string }[]
  connections: {
    local: string
    remote: string
    state: string
    process: string
    verdict: string
  }[]
} = {
  files: [],
  processes: [],
  registry: [],
  connections: [],
}

/* ---------- headline counters ---------- */

export const dashboardStats = {
  totalEvents: 0,
  alerts: 0,
  criticalAlerts: 0,
  activeDevices: 0,
  totalDevices: 0,
  liveThroughput: '0 Mbps',
  suspiciousIps: 0,
  malwareDetections: 0,
  packetsCaptured: 0,
  aiThreatScore: 0,
  riskLevel: 'Unknown' as const,
  securityScore: 0,
}
