import { ChevronDown, Cpu, Database, LayoutDashboard, Radar, Router, Waves } from 'lucide-react'

const pipeline = [
  {
    icon: Router,
    title: 'Devices',
    body: 'Phones, laptops, desktops, routers, servers, VMs and IoT devices report in, with an agent, or passively through the gateway.',
  },
  {
    icon: Database,
    title: 'Log Collector',
    body: 'Windows, Linux, macOS, browser, firewall, web server, application, cloud and authentication logs are normalised into one schema.',
  },
  {
    icon: Waves,
    title: 'Packet Collector',
    body: 'libpcap, Npcap and WinPcap capture live traffic. TCP, UDP, DNS, HTTP, TLS metadata, ICMP and ARP are parsed on the fly.',
  },
  {
    icon: Cpu,
    title: 'AI Analysis + Threat Engine',
    body: 'Flows, headers, payloads, timing, sequence and entropy are scored by ML anomaly models and explained by an LLM.',
  },
  {
    icon: Radar,
    title: 'Detection & Correlation',
    body: 'Rules and AI findings are correlated across devices and time into a single narrative rather than a hundred separate events.',
  },
  {
    icon: LayoutDashboard,
    title: 'Dashboard & Alerts',
    body: 'Everything surfaces as ranked alerts, written investigations, timelines and a live posture score you can act on.',
  },
]

const stack = [
  { group: 'Frontend', items: ['React', 'TypeScript', 'Tailwind CSS', 'Recharts / ECharts'] },
  { group: 'Backend', items: ['FastAPI or NestJS', 'REST + WebSockets', 'Celery workers'] },
  { group: 'Storage', items: ['PostgreSQL', 'ClickHouse / OpenSearch', 'Redis'] },
  { group: 'Capture', items: ['Npcap · WinPcap', 'libpcap', 'Scapy · PyShark'] },
  { group: 'AI', items: ['Local or cloud LLM', 'Vector DB retrieval', 'Flow anomaly models'] },
]

export default function HowItWorks() {
  return (
    <section id="how" className="border-y border-slate-100 bg-slate-50/60 py-20 lg:py-28">
      <div className="container-x">
        <div className="mx-auto max-w-3xl text-center">
          <span className="eyebrow">How it works</span>
          <h2 className="section-title mt-4">From packet to plain English</h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            Six stages sit between the wire and your screen. Each one is a component you can run on a single
            machine or spread across a collector and a server.
          </p>
        </div>

        <ol className="mx-auto mt-12 max-w-3xl">
          {pipeline.map((s, i) => (
            <li key={s.title}>
              <div className="card flex items-start gap-4 p-5 transition-all duration-300 hover:border-brand-300 hover:shadow-lift">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-600 text-white">
                  <s.icon size={20} />
                </span>
                <div>
                  <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                    <span className="font-mono text-xs text-brand-400">{i + 1}</span>
                    {s.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{s.body}</p>
                </div>
              </div>
              {i < pipeline.length - 1 && (
                <div className="flex justify-center py-2" aria-hidden="true">
                  <ChevronDown size={20} className="text-brand-300" />
                </div>
              )}
            </li>
          ))}
        </ol>

        <div className="mt-16">
          <h3 className="text-center text-sm font-bold uppercase tracking-widest text-slate-500">
            Technology stack
          </h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {stack.map((s) => (
              <div key={s.group} className="card p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-600">{s.group}</p>
                <ul className="mt-3 space-y-1.5">
                  {s.items.map((i) => (
                    <li key={i} className="text-sm text-slate-600">
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
