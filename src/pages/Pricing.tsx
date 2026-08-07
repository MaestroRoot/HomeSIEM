import { useEffect } from 'react'
import { Check, Zap } from 'lucide-react'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { formatTzs } from '@/lib/plans'

const plans = [
  {
    id: 'Free',
    price: 0,
    tagline: 'Basic visibility for your home network.',
    limits: { devices: 2, retention: '24 hours', seats: 1 },
    modules: [
      'Dashboard overview',
      'Device tracking (2 devices)',
      'Search',
      'Alerts',
      'Security Score',
      'Behavior Analytics (UEBA)',
      'Compliance Center',
      'Account & MFA',
    ],
  },
  {
    id: 'Home',
    price: 15_000,
    tagline: 'Full monitoring for your household.',
    limits: { devices: 5, retention: '7 days', seats: 2 },
    highlight: true,
    modules: [
      'Everything in Free, plus:',
      'Agents & sensor management',
      'Log collection',
      'Threat Detection engine',
      'IOC Scanner',
      'Timeline',
      'Visualization & charts',
      'Alert Integrations (Slack, email, webhook)',
    ],
  },
  {
    id: 'Pro',
    price: 50_000,
    tagline: 'Advanced investigation and response tools.',
    limits: { devices: 25, retention: '30 days', seats: 5 },
    modules: [
      'Everything in Home, plus:',
      'PCAP upload & offline analysis',
      'AI Log Explorer',
      'AI Packet Analysis',
      'Incident Assistant',
      'Incidents tracking',
      'Rule Engine & custom detections',
      'Threat Intelligence feeds',
      'Network Graph, Attack Chain, Geo Map',
      'Detection Coverage (MITRE)',
      'Runbooks & Log Parsers',
      'PDF, Excel & CSV reports',
    ],
  },
  {
    id: 'Business',
    price: 150_000,
    tagline: 'Enterprise forensics, vulnerabilities and inventory.',
    limits: { devices: 'Unlimited', retention: '365 days', seats: 25 },
    modules: [
      'Everything in Pro, plus:',
      'Forensics deep-dive',
      'Vulnerability Scanner',
      'Network Inventory',
      'AI Investigation',
      'Unlimited devices',
      '25 seats',
    ],
  },
]

export default function PricingPage() {
  useEffect(() => { document.title = 'Pricing · HomeSIEM' }, [])

  return (
    <div className="relative min-h-screen text-white">
      {/* Video background */}
      <video
        className="pointer-events-none fixed inset-0 -z-20 h-full w-full object-cover"
        src="/hero-bg.mp4"
        autoPlay
        loop
        muted
        playsInline
      />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-black/40" />

      <Navbar />
      <main className="relative pt-[72px]">
        {/* Hero + cards — single continuous section */}
        <section className="py-20 lg:py-28">
          <div className="container-x">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              One plan for every network.
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-300">
              Start free, upgrade when you need more devices, longer retention or advanced investigation tools. Pay monthly with mobile money or card.
            </p>

            {/* Plan cards */}
            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`flex flex-col rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur-md transition-all ${
                    plan.highlight
                      ? 'ring-2 ring-brand-400/60 shadow-lg shadow-brand-500/10'
                      : ''
                  }`}
                >
                  {plan.highlight && (
                    <span className="mb-3 inline-flex w-fit items-center gap-1 rounded-full bg-brand-500/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand-300">
                      <Zap size={11} /> Most popular
                    </span>
                  )}

                  <h2 className="text-lg font-bold text-white">{plan.id}</h2>
                  <p className="mt-1 text-sm text-slate-300">{plan.tagline}</p>

                  <p className="mt-4 text-3xl font-extrabold tracking-tight text-white">
                    {plan.price === 0 ? (
                      'Free'
                    ) : (
                      <>
                        <span className="text-sm font-bold text-slate-400">TSh </span>
                        {formatTzs(plan.price)}
                        <span className="text-sm font-semibold text-slate-400"> / month</span>
                      </>
                    )}
                  </p>

                  <dl className="mt-4 grid grid-cols-3 gap-2 py-3 text-xs">
                    <div>
                      <dt className="text-slate-400">Devices</dt>
                      <dd className="font-semibold text-white">{plan.limits.devices}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Retention</dt>
                      <dd className="font-semibold text-white">{plan.limits.retention}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Seats</dt>
                      <dd className="font-semibold text-white">{plan.limits.seats}</dd>
                    </div>
                  </dl>

                  <ul className="mt-4 flex-1 space-y-2">
                    {plan.modules.map((m) => (
                      <li key={m} className="flex gap-2 text-sm text-slate-200">
                        <Check size={15} className="mt-0.5 shrink-0 text-emerald-400" />
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href="/signup"
                    className={`mt-6 block rounded-lg py-2.5 text-center text-sm font-semibold transition-colors ${
                      plan.highlight
                        ? 'bg-brand-600 text-white hover:bg-brand-700'
                        : 'border border-white/20 text-white hover:bg-white/10'
                    }`}
                  >
                    {plan.price === 0 ? 'Start for free' : `Choose ${plan.id}`}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
      <Footer showCta={false} />
    </div>
  )
}
