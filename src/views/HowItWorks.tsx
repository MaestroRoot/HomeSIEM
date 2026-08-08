import { useEffect } from 'react'
import { ChevronDown, Cpu, Database, Globe, HardDrive, LayoutDashboard, Radar, Router, Shield, Waves, Zap } from 'lucide-react'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'

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

const systemHighlights = [
  {
    icon: Zap,
    title: 'Real-time analysis',
    body: 'Packets and logs are processed as they arrive. Alerts surface within seconds, not minutes.',
  },
  {
    icon: Shield,
    title: 'Local-first by default',
    body: 'All analysis runs on your own hardware. Cloud AI is an option, never a requirement.',
  },
  {
    icon: Globe,
    title: 'Multi-device coverage',
    body: 'Windows, Linux, macOS, Android, iOS and routers, one dashboard watches them all.',
  },
  {
    icon: HardDrive,
    title: 'Lightweight footprint',
    body: 'Runs on a Raspberry Pi or any 512 MB VPS. No Kubernetes, no Docker swarm, no database cluster.',
  },
]

export default function HowItWorksPage() {
  useEffect(() => { document.title = 'How it works · HomeSIEM' }, [])

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-[72px]">
        {/* Hero */}
        <section className="bg-slate-900 py-20 lg:py-28">
          <div className="container-x">
            <span className="eyebrow text-brand-300">How it works</span>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              From packet to plain English
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-200/90">
              Six stages sit between the wire and your screen. Each one is a component you can run on a single
              machine or spread across a collector and a server.
            </p>
          </div>
        </section>

        {/* Pipeline */}
        <section className="py-20 lg:py-28">
          <div className="container-x">
            <ol className="mx-auto max-w-3xl">
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
          </div>
        </section>

        {/* System highlights */}
        <section className="border-t border-slate-100 bg-slate-50/60 py-20 lg:py-28">
          <div className="container-x">
            <div className="mx-auto max-w-3xl text-center">
              <span className="eyebrow">Why it matters</span>
              <h2 className="section-title mt-4">Built for how people actually use it</h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                Every design choice serves one goal: security you can run yourself, without a team or a budget.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {systemHighlights.map((h) => (
                <article
                  key={h.title}
                  className="card group p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-lift"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                    <h.icon size={21} />
                  </span>
                  <h3 className="mt-4 text-base font-bold text-slate-900">{h.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{h.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
