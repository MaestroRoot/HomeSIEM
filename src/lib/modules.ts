import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  Boxes,
  ClipboardCheck,
  Clock,
  Cpu,
  CreditCard,
  FileCode2,
  FileSearch,
  FileText,
  FileUp,
  Fingerprint,
  Globe2,
  Gauge,
  KeyRound,
  LayoutDashboard,
  Laptop,
  Microscope,
  Network,
  Radar,
  Route as RouteIcon,
  ScrollText,
  Search,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Sparkles,
  UserCheck,
  Workflow,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type ModuleCategory =
  | 'Core'
  | 'Collection'
  | 'Tools'
  | 'Detection'
  | 'Response'
  | 'Posture'
  | 'Advanced'

export interface AppModule {
  id: string
  no: number
  name: string
  path: string
  icon: LucideIcon
  category: ModuleCategory
  tagline: string
  description: string
  bullets: string[]
  featured?: boolean
  /** Iko kwenye sidebar lakini si moduli ya usalama, haionyeshwi kwenye
   *  ukurasa wa mbele (billing na mfano wake). */
  internal?: boolean
}

export const modules: AppModule[] = [
  {
    id: 'overview',
    no: 1,
    name: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    category: 'Core',
    tagline: 'Your whole network at a glance',
    description:
      'Total events, active alerts, live traffic, suspicious IPs, malware detections, packet statistics, threat score and overall risk level, on one screen that updates in real time.',
    bullets: ['Live event & alert counters', 'Threat score + risk level', 'Traffic and protocol charts'],
    featured: true,
  },
  {
    id: 'devices',
    no: 3,
    name: 'Device Management',
    path: '/dashboard/devices',
    icon: Laptop,
    category: 'Core',
    tagline: 'Every device you own, tracked',
    description:
      'Register phones, laptops, desktops, Raspberry Pis, routers, servers and VMs. Each device reports its OS, IP, MAC, hostname and live status back to the platform.',
    bullets: ['Phone, Laptop, Desktop, Pi, Router, Server, VM', 'OS · IP · MAC · hostname · status', 'Per-device risk scoring'],
    featured: true,
  },
  {
    id: 'agents',
    no: 3,
    name: 'Install Sensor',
    path: '/dashboard/agents',
    icon: Cpu,
    category: 'Collection',
    tagline: 'Set up a host once, run everything from here',
    description:
      'Generate a token and run one command on a host. The sensor enrolls and stays running, then scans, forensics, live capture and log collection are triggered from the dashboard, no repeated commands.',
    bullets: ['One-time setup per host', 'scan · forensics · capture · logs', 'Trigger by clicking, not commands'],
    featured: true,
  },
  {
    id: 'logs',
    no: 4,
    name: 'Log Collection',
    path: '/dashboard/logs',
    icon: ScrollText,
    category: 'Collection',
    tagline: 'Collect from everything you run',
    description:
      'Ship logs from Windows, Linux and macOS endpoints plus browser, firewall, web server, application, cloud and authentication sources into one normalised pipeline.',
    bullets: ['Windows · Linux · macOS agents', 'Firewall, web server & cloud logs', 'Live ingest health monitoring'],
  },
  {
    id: 'sources',
    no: 7,
    name: 'Data Source Health',
    path: '/dashboard/sources',
    icon: Activity,
    category: 'Collection',
    tagline: 'Is every feed still alive?',
    description:
      'Every channel feeding events into your SIEM — sensors, NextDNS, log uploads — with live health: healthy, degraded or offline, plus event rates per source.',
    bullets: ['Live per-source health', 'Events 24h / 1h and rate', 'Auto-registration on ingest'],
  },
  {
    id: 'pcap',
    no: 6,
    name: 'Packet Inspector',
    path: '/dashboard/pcap',
    icon: FileUp,
    category: 'Collection',
    tagline: 'Drop a capture, get an answer',
    description:
      'Upload attack.pcap or network.pcapng and let the engine dissect it offline, surfacing DNS tunneling, data exfiltration, SQL injection traffic, port scans, SMB enumeration and beaconing.',
    bullets: ['.pcap / .pcapng offline analysis', 'Automatic finding extraction', 'Exportable analysis report'],
    featured: true,
  },
  {
    id: 'detection',
    no: 8,
    name: 'Threat Detection Engine',
    path: '/dashboard/detection',
    icon: Radar,
    category: 'Detection',
    tagline: 'Twelve attack classes, always watching',
    description:
      'Detects port scans, brute force, ARP spoofing, DNS tunneling, MITM, malware, botnets, beaconing, data exfiltration, lateral movement, reverse shells and crypto mining.',
    bullets: ['12 built-in detection classes', 'MITRE ATT&CK mapped', 'Correlation across devices'],
  },
  {
    id: 'ai-logs',
    no: 9,
    name: 'Log Explorer',
    path: '/dashboard/ai-logs',
    icon: FileSearch,
    category: 'Tools',
    tagline: 'Upload a log, read a story',
    description:
      'Feed it Windows.evtx, syslog, apache.log or nginx.log and it explains what happened, builds a timeline, flags suspicious accounts and failed logins, and recommends next steps.',
    bullets: ['.evtx · syslog · apache · nginx', 'Auto-built incident timeline', 'Suspicious account detection'],
  },
  {
    id: 'ioc',
    no: 10,
    name: 'IOC Scanner',
    path: '/dashboard/ioc',
    icon: Fingerprint,
    category: 'Detection',
    tagline: 'Check any indicator instantly',
    description:
      'Search IPs, domains, URLs, SHA256 and MD5 hashes against live threat intelligence feeds and get a consolidated verdict with source attribution.',
    bullets: ['IP · domain · URL · SHA256 · MD5', 'Multi-feed correlation', 'Verdict with source count'],
  },
  {
    id: 'alerts',
    no: 11,
    name: 'Live Alert Center',
    path: '/dashboard/alerts',
    icon: Siren,
    category: 'Detection',
    tagline: 'Critical, High, Medium, Low',
    description:
      'Every detection lands here. Open one and you get the timeline, the evidence, the explanation of why it fired, and the recommended actions to take right now.',
    bullets: ['Severity-ranked live feed', 'Evidence + explanation per alert', 'One-click actions'],
    featured: true,
  },
  {
    id: 'timeline',
    no: 12,
    name: 'Timeline',
    path: '/dashboard/timeline',
    icon: Clock,
    category: 'Detection',
    tagline: 'Attacks, in the order they happened',
    description:
      'A chronological reconstruction, login, failed login, SMB scan, PowerShell launch, reverse shell, data upload, so the sequence of an intrusion becomes obvious at a glance.',
    bullets: ['Chronological attack reconstruction', 'Severity-coded events', 'Filter by actor or window'],
  },
  {
    id: 'search',
    no: 13,
    name: 'Search',
    path: '/dashboard/search',
    icon: Search,
    category: 'Core',
    tagline: 'Pivot on anything',
    description:
      'Search across IPs, usernames, hostnames, processes, hashes, domains and alerts, every record in the platform is reachable from a single query bar.',
    bullets: ['Unified cross-module search', 'Pivot from any result', 'Saved queries'],
  },
  {
    id: 'incidents',
    no: 14,
    name: 'Incident Management',
    path: '/dashboard/incidents',
    icon: Boxes,
    category: 'Response',
    tagline: 'From alert to resolution',
    description:
      'Create incidents, assign severity, attach evidence, keep investigation notes, track status through containment and eradication, and record the final resolution.',
    bullets: ['Severity, status & assignee tracking', 'Evidence and note trail', 'Alert-to-incident correlation'],
  },
  {
    id: 'actions',
    no: 15,
    name: 'Response Actions',
    path: '/dashboard/actions',
    icon: Workflow,
    category: 'Response',
    tagline: 'Contain, block, isolate, notify',
    description:
      'SOAR-lite response actions raised from alerts and incidents — isolate a host, block an indicator, disable an account, take a snapshot or notify a channel — with status tracking.',
    bullets: ['isolate · block · disable · snapshot · notify', 'Raised from an alert or incident', 'Status: pending → running → done'],
  },
  {
    id: 'assistant',
    no: 15,
    name: 'Security Assistant',
    path: '/dashboard/assistant',
    icon: Bot,
    category: 'Tools',
    tagline: 'Ask your SOC anything',
    description:
      '"Explain this alert." "Why is this suspicious?" "Summarize today\'s attacks." "What should I do?" a security analyst that has already read all of your data.',
    bullets: ['Context-aware over your own events', 'Plain-language explanations', 'Actionable next steps'],
    featured: true,
  },
  {
    id: 'reports',
    no: 16,
    name: 'Reports',
    path: '/dashboard/reports',
    icon: FileText,
    category: 'Response',
    tagline: 'PDF, Excel, CSV',
    description:
      'Generate weekly, monthly and executive reports covering alerts, incidents, device posture and traffic, ready to hand to a client, a manager or your future self.',
    bullets: ['PDF · Excel · CSV export', 'Weekly / monthly / executive', 'Scheduled delivery'],
  },
  {
    id: 'intel',
    no: 17,
    name: 'Threat Intelligence',
    path: '/dashboard/intel',
    icon: ShieldAlert,
    category: 'Detection',
    tagline: 'Feeds that update themselves',
    description:
      'Subscribe to feeds of known malware IPs, domains and hashes. They refresh automatically and enrich every detection the moment new intelligence lands.',
    bullets: ['Auto-updating feeds', 'Malware IPs, domains & hashes', 'Custom blocklist support'],
  },
  {
    id: 'rules',
    no: 18,
    name: 'Rule Engine',
    path: '/dashboard/rules',
    icon: Wrench,
    category: 'Detection',
    tagline: 'IF this THEN alert',
    description:
      'Build your own detection logic: IF failed logins exceed 20 within 5 minutes THEN raise a critical alert. No query language degree required.',
    bullets: ['Visual IF/THEN rule builder', 'Thresholds and time windows', 'Enable/disable per rule'],
  },
  {
    id: 'ueba',
    no: 19,
    name: 'User Behavior',
    path: '/dashboard/ueba',
    icon: UserCheck,
    category: 'Detection',
    tagline: 'Who is doing what, and when is it weird',
    description:
      'Track each user\'s normal behavior — login times, visited domains, running processes — and get alerted when something deviates. Detect compromised accounts, insider threats and unusual activity.',
    bullets: ['Per-user behavior baselines', 'Anomaly detection and risk scoring', 'Activity timeline per user'],
    featured: true,
  },
  {
    id: 'ai-rules',
    no: 19,
    name: 'Custom Rules',
    path: '/dashboard/ai-rules',
    icon: Sparkles,
    category: 'Tools',
    tagline: 'Describe it, get the rule',
    description:
      'Type "Detect SSH brute force" and get the complete detection rule, condition, window, threshold, severity and action, ready to deploy.',
    bullets: ['Natural language to detection rule', 'Editable before deployment', 'Tuning suggestions included'],
  },
  {
    id: 'visualization',
    no: 20,
    name: 'Packet Visualization',
    path: '/dashboard/visualization',
    icon: BarChart3,
    category: 'Collection',
    tagline: 'See the shape of your traffic',
    description:
      'Network graphs, conversation graphs, protocol distribution, bandwidth over time and top IPs, the patterns a table of packets will never show you.',
    bullets: ['Network & conversation graphs', 'Protocol and bandwidth charts', 'Top talker ranking'],
  },
  {
    id: 'inventory',
    no: 21,
    name: 'Network Inventory',
    path: '/dashboard/inventory',
    icon: Network,
    category: 'Posture',
    tagline: 'Discover what is actually there',
    description:
      'Active and passive discovery of every device, open port, running service and operating system on your network, including the things you forgot you plugged in.',
    bullets: ['Device & service discovery', 'Open port enumeration', 'OS fingerprinting'],
  },
  {
    id: 'vulnerabilities',
    no: 22,
    name: 'Vulnerability Scanner',
    path: '/dashboard/vulnerabilities',
    icon: ShieldCheck,
    category: 'Posture',
    tagline: 'Find the holes before they do',
    description:
      'Scan for open ports, weak services, known CVEs, weak TLS configuration and default passwords across the hosts you are authorised to test.',
    bullets: ['CVE matching with CVSS scores', 'Weak TLS & service checks', 'Remediation guidance'],
  },
  {
    id: 'forensics',
    no: 23,
    name: 'Forensics',
    path: '/dashboard/forensics',
    icon: Microscope,
    category: 'Response',
    tagline: 'The artifacts left behind',
    description:
      'Examine files, processes, registry keys, network connections, memory indicators and hashes collected from a compromised host.',
    bullets: ['File, process & registry artifacts', 'Live connection snapshots', 'Hash verdicts'],
  },
  {
    id: 'investigation',
    no: 24,
    name: 'Investigation',
    path: '/dashboard/investigation',
    icon: Activity,
    category: 'Tools',
    tagline: 'A written case, not a raw alert',
    description:
      'Instead of "Alert: Port Scan", you get: "Between 10:14 and 10:18, host 192.168.1.24 attempted connections to 317 unique ports on 192.168.1.10. The pattern resembles automated reconnaissance. Confidence: 91%."',
    bullets: ['Narrative investigation write-ups', 'Automatic evidence correlation', 'Confidence estimates'],
    featured: true,
  },
  {
    id: 'score',
    no: 25,
    name: 'Home Security Score',
    path: '/dashboard/score',
    icon: Gauge,
    category: 'Posture',
    tagline: 'One number for your whole network',
    description:
      'A single 0 to 100 posture score with the exact problems dragging it down, weak WiFi password, open Telnet, outdated router, disabled firewall, exposed printer, and how to fix each one.',
    bullets: ['0 to 100 posture score', 'Ranked list of problems', 'Concrete fix for every issue'],
    featured: true,
  },
  {
    id: 'compliance',
    no: 21,
    name: 'Compliance Center',
    path: '/dashboard/compliance',
    icon: ClipboardCheck,
    category: 'Posture',
    tagline: 'Framework-specific security controls',
    description:
      'Evaluate your real security posture against CIS, PCI DSS, GDPR and HIPAA frameworks. Each control is checked against your actual devices, events and configuration.',
    bullets: ['CIS, PCI DSS, GDPR, HIPAA controls', 'Pass/fail per control', 'Overall compliance posture score'],
  },
  {
    id: 'runbooks',
    no: 30,
    name: 'Runbooks',
    path: '/dashboard/runbooks',
    icon: Workflow,
    category: 'Advanced',
    tagline: 'Step-by-step response playbooks',
    description:
      'Pre-built incident response playbooks for phishing, malware, credential compromise and unauthorised access. Follow the steps to contain and resolve each scenario.',
    bullets: ['Phishing response steps', 'Malware containment', 'Credential compromise playbook'],
  },
  {
    id: 'log-parsers',
    no: 31,
    name: 'Log Parsers',
    path: '/dashboard/logs/parsers',
    icon: FileCode2,
    category: 'Advanced',
    tagline: 'Regex pattern tester for log lines',
    description:
      'Test and refine regular expressions against sample log lines before using them in your collection pipeline. Supports named capture groups.',
    bullets: ['Live regex tester', 'Named groups', 'Sample log input'],
  },
  {
    id: 'alert-integrations',
    no: 32,
    name: 'Alert Integrations',
    path: '/dashboard/alerts/integrations',
    icon: Workflow,
    category: 'Advanced',
    tagline: 'Forward alerts to Slack, email and more',
    description:
      'Connect flagged alerts to Slack, Discord, email, PagerDuty or a generic webhook. The server delivers automatically when a flagged event fires.',
    bullets: ['Slack, Discord, email, PagerDuty', 'Generic webhook support', 'Per-destination severity filter'],
  },
  {
    id: 'network-graph',
    no: 33,
    name: 'Network Graph',
    path: '/dashboard/network-graph',
    icon: Network,
    category: 'Advanced',
    tagline: 'Visual communication topology',
    description:
      'See who talked to what. A visual graph of device-to-destination connections with flagged paths highlighted in red.',
    bullets: ['Device-to-destination map', 'Flagged paths in red', 'Top 40 connections'],
  },
  {
    id: 'attack-chain',
    no: 34,
    name: 'Attack Chain',
    path: '/dashboard/attack-chain',
    icon: RouteIcon,
    category: 'Advanced',
    tagline: 'Flagged events in attack sequence',
    description:
      'Flagged events plotted chronologically and mapped to stages of an attack. See the progression from initial contact to exfiltration.',
    bullets: ['Chronological event chain', 'Attack stage mapping', 'Severity timeline'],
  },
  {
    id: 'geo-map',
    no: 35,
    name: 'Geo Threat Map',
    path: '/dashboard/geo-map',
    icon: Globe2,
    category: 'Advanced',
    tagline: 'Where external destinations are located',
    description:
      'Geographic context for the external IPs your devices contacted. Ranked by country with event counts. Context, not attribution.',
    bullets: ['Country ranking', 'External IP count', 'Event breakdown by country'],
  },
  {
    id: 'coverage',
    no: 36,
    name: 'Detection Coverage',
    path: '/dashboard/coverage',
    icon: ShieldCheck,
    category: 'Advanced',
    tagline: 'MITRE ATT&CK tactic coverage',
    description:
      'Which MITRE ATT&CK tactics your active detection rules cover, and where the gaps are. Close gaps by adding rules in the Rule Engine.',
    bullets: ['Tactic coverage heatmap', 'Gap identification', 'Rule-to-tactic mapping'],
  },
  {
    id: 'subscriptions',
    no: 26,
    name: 'Subscriptions',
    path: '/dashboard/subscriptions',
    icon: CreditCard,
    category: 'Core',
    tagline: 'Your plan and your payments',
    description:
      'Four plans: Free, Home, Pro and Business. Each one unlocks more of the platform. Pay with Yas Mix, M-Pesa, HaloPesa, Airtel Money or a bank card.',
    bullets: ['Free through to Business', 'Mobile money or card', 'Full payment history'],
    internal: true,
  },
  {
    id: 'custom-dashboards',
    no: 27,
    name: 'Custom Dashboards',
    path: '/dashboard/custom-dashboards',
    icon: LayoutDashboard,
    category: 'Core',
    tagline: 'Build your own views',
    description:
      'Create dashboards with custom widgets — charts, tables, single values, alert feeds. Choose from templates or build from scratch.',
    bullets: ['Drag & drop widgets', 'Executive, SOC, Network templates', 'Share with your team'],
  },
  {
    id: 'account',
    no: 2,
    name: 'Account',
    path: '/dashboard/account',
    icon: KeyRound,
    category: 'Core',
    tagline: 'MFA, roles and API keys',
    description:
      'User registration, login, multi-factor authentication, role management (owner, analyst, viewer) and API keys for your own collectors and integrations.',
    bullets: ['MFA enrolment', 'Owner / analyst / viewer roles', 'API key issuance & rotation'],
  },
]

export const featuredModules = modules.filter((m) => m.featured)

/** Moduli za usalama pekee, ndizo zinazoonyeshwa kwenye ukurasa wa mbele. */
export const publicModules = modules.filter((m) => !m.internal)

export const moduleCategories: ModuleCategory[] = [
  'Core',
  'Collection',
  'Tools',
  'Detection',
  'Response',
  'Posture',
  'Advanced',
]

/** Sidebar order: grouped by category, numbered by the spec. */
export const navGroups = moduleCategories.map((category) => ({
  category,
  items: modules.filter((m) => m.category === category).sort((a, b) => a.no - b.no),
}))

export { AlertTriangle }
