export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export type DeviceType =
  | 'Phone'
  | 'Laptop'
  | 'Desktop'
  | 'Raspberry Pi'
  | 'Router'
  | 'Server'
  | 'VM'
  | 'IoT'

export interface Device {
  id: string
  name: string
  type: DeviceType
  os: string
  ip: string
  mac: string
  hostname: string
  status: 'online' | 'offline' | 'quarantined'
  agent: 'installed' | 'agentless'
  lastSeen: string
  riskScore: number
  eventsToday: number
}

export interface Alert {
  id: string
  title: string
  severity: Severity
  category: string
  device: string
  sourceIp: string
  destIp: string
  time: string
  confidence: number
  status: 'open' | 'investigating' | 'resolved'
  aiExplanation: string
  evidence: string[]
  recommendations: string[]
  mitre: string
}

export interface LogSource {
  id: string
  name: string
  platform: string
  type: string
  device: string
  status: 'healthy' | 'degraded' | 'stopped'
  eventsPerMin: number
  lastEvent: string
  volume24h: string
}

export interface PacketRow {
  id: number
  time: string
  source: string
  destination: string
  protocol: string
  length: number
  info: string
  verdict: 'clean' | 'suspicious' | 'malicious'
}

export interface Incident {
  id: string
  title: string
  severity: Severity
  status: 'new' | 'triage' | 'containment' | 'eradication' | 'closed'
  assignee: string
  opened: string
  updated: string
  alerts: number
  summary: string
  notes: { author: string; time: string; body: string }[]
}


export interface Ioc {
  id: string
  value: string
  type: 'ip' | 'domain' | 'url' | 'sha256' | 'md5'
  verdict: 'malicious' | 'suspicious' | 'clean' | 'unknown'
  sources: number
  firstSeen: string
  tags: string[]
}

// --- Threat intel + enrichment (backend: /intel, /capture) ---------------

export type Verdict = 'malicious' | 'suspicious' | 'clean' | 'unknown'

export interface GeoLocation {
  ip: string
  isPrivate: boolean
  country: string | null
  countryCode: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
  asn: number | null
  asnOrg: string | null
}

export interface IntelResult {
  indicator: string
  type: 'ip' | 'domain' | 'url' | 'sha256' | 'md5' | 'sha1'
  verdict: Verdict
  pulseCount: number
  tags: string[]
  firstSeen: string | null
  geo: GeoLocation | null
  rationale: string | null
}

export interface DnsQuery {
  time: number | null
  src: string
  domain: string
  qtype: string
  verdict: Verdict | null
  pulseCount: number
}

export interface Flow {
  src: string
  dst: string
  dstPort: number | null
  protocol: string
  packets: number
  bytes: number
  geo: GeoLocation | null
  verdict: Verdict | null
  pulseCount: number
}

export interface PcapFinding {
  title: string
  severity: Verdict
  detail: string
  indicator: string | null
}

export interface MonitoredDevice {
  id: string
  name: string
  mac: string | null
  deviceType: string
  lastIp: string | null
  hostname: string | null
  status: string
  discovered: boolean
  tags: string[]
  riskScore: number
  eventsCount: number
  lastSeenAt: string | null
  createdAt: string
}

export interface SecurityEventRow {
  id: string
  deviceId: string | null
  deviceName: string | null
  kind: 'dns' | 'flow'
  srcIp: string | null
  srcMac: string | null
  domain: string | null
  dstIp: string | null
  dstPort: number | null
  protocol: string | null
  verdict: Verdict
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  pulseCount: number
  country: string | null
  asn: number | null
  asnOrg: string | null
  occurredAt: string | null
  createdAt: string
}

export interface SensorToken {
  id: string
  label: string
  lastUsedAt: string | null
  revokedAt: string | null
  createdAt: string
}

export interface SensorTokenCreated extends SensorToken {
  token: string
}

export interface StatsOverview {
  totalEvents: number
  events24h: number
  flagged: number
  uniqueDomains: number
  uniqueExternalIps: number
  totalDevices: number
  activeDevices: number
  byVerdict: { malicious: number; suspicious: number; clean: number; unknown: number }
  topDomains: { name: string; count: number; flagged: boolean }[]
  topTalkers: { label: string; count: number }[]
  suspicious: {
    indicator: string
    verdict: Verdict
    country: string | null
    pulseCount: number
    count: number
  }[]
  overTime: { t: string; events: number; flagged: number }[]
  byCountry: { name: string; count: number }[]
}

export interface SecurityScore {
  score: number
  grade: string
  summary: string
  issues: { title: string; impact: number; severity: string; detail: string; fix: string }[]
}

export interface DetectionRule {
  id: string
  name: string
  enabled: boolean
  conditionType: 'verdict_is' | 'domain_contains' | 'country_is' | 'pulse_count_gte'
  value: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  action: 'alert' | 'log'
  source: string
  hits: number
  falsePositives: number
  lastHitAt: string | null
  createdAt: string
}

export interface AiText {
  reply: string
}

export interface IncidentNote {
  author: string
  time: string
  body: string
}

export interface IncidentRecord {
  id: string
  title: string
  severity: Severity
  status: 'new' | 'triage' | 'containment' | 'eradication' | 'closed'
  assignee: string | null
  summary: string
  notes: IncidentNote[]
  createdAt: string
  updatedAt: string
}

export interface LogRecord {
  id: string
  source: string
  host: string | null
  level: string
  message: string
  occurredAt: string | null
  createdAt: string
}

export interface LogList {
  items: LogRecord[]
  sources: string[]
  total: number
}

export interface VulnRecord {
  id: string
  target: string
  port: number | null
  service: string | null
  severity: string
  title: string
  detail: string
  fix: string
  status: string
  createdAt: string
}

export interface ForensicSnapshotRecord {
  id: string
  host: string
  processes: { pid: number; name: string; user: string; exe: string; cmd: string }[]
  connections: { local: string; remote: string; state: string; process: string }[]
  createdAt: string
}

export interface AgentRecord {
  id: string
  hostname: string
  os: string | null
  lastIp: string | null
  capabilities: string[]
  lastSeenAt: string | null
  createdAt: string
}

export interface AgentJob {
  id: string
  agentId: string
  kind: 'scan' | 'forensics' | 'logs' | 'capture' | 'discovery' | 'software'
  status: 'pending' | 'running' | 'done' | 'error'
  params: Record<string, unknown>
  result: Record<string, unknown> | null
  error: string | null
  createdAt: string
  updatedAt: string
}

export interface NotificationChannel {
  id: string
  type: 'slack' | 'discord' | 'email' | 'webhook' | 'pagerduty'
  name: string
  target: string
  minSeverity: string
  enabled: boolean
  lastSentAt: string | null
  createdAt: string
}

export interface ReportSchedule {
  id: string
  kind: string
  frequency: string
  toWholeTeam: boolean
  recipients: string[]
  enabled: boolean
  nextRunAt: string
  lastRunAt: string | null
}

export interface SoftwarePackage {
  id: string
  host: string
  name: string
  version: string
  publisher: string
  createdAt: string
}

export interface DiscoverySchedule {
  id: string
  agentId: string
  subnet: string
  frequency: 'hourly' | 'daily' | 'weekly'
  enabled: boolean
  nextRunAt: string
  lastRunAt: string | null
}

export interface CollectionStream {
  id: string
  agentId: string
  kind: 'capture' | 'logs'
  params: Record<string, unknown>
  enabled: boolean
  createdAt: string
}

export interface NextDnsConfig {
  configured: boolean
  profileId: string | null
  apiKeyMasked: string | null
  enabled: boolean
  dnsHostname: string | null
  lastSyncedAt: string | null
  lastStatus: string | null
}

export interface Feed {
  name: string
  type: string
  status: string
  detail: string
}

export interface FeedsResponse {
  feeds: Feed[]
  flaggedSeen: number
}

export interface SearchResults {
  query: string
  events: SecurityEventRow[]
  devices: MonitoredDevice[]
}

export interface PcapAnalysis {
  fileName: string
  packetsRead: number
  truncated: boolean
  durationSeconds: number | null
  dnsQueries: DnsQuery[]
  flows: Flow[]
  findings: PcapFinding[]
  uniqueDomains: number
  uniqueExternalIps: number
}

export interface TimelineEvent {
  id: string
  time: string
  title: string
  detail: string
  severity: Severity
  actor: string
}

export interface Vulnerability {
  id: string
  cve: string
  title: string
  host: string
  port: number
  service: string
  cvss: number
  severity: Severity
  status: 'open' | 'fixed' | 'accepted'
  fix: string
}
