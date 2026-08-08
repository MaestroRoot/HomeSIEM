import { useEffect } from 'react'
import { Brain, Home, Lock, MessageSquareText, Shield, Zap } from 'lucide-react'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'

const pillars = [
  {
    icon: Brain,
    title: 'It explains, it does not just alert',
    body: 'Traditional SIEMs hand you a rule name and a raw log. HomeSIEM tells you what the traffic is, why it looks wrong, how confident it is, and what to do next.',
  },
  {
    icon: Home,
    title: 'Built for one network, not a data centre',
    body: 'No Kubernetes cluster, no six-figure licence, no dedicated SOC team. It runs on a spare machine or a Raspberry Pi and watches the network you actually live on.',
  },
  {
    icon: Lock,
    title: 'Your packets stay yours',
    body: 'Run analysis against a local LLM if you would rather nothing leaves the building, or point it at a cloud model when you want more depth. That choice is a setting, not a plan tier.',
  },
  {
    icon: MessageSquareText,
    title: 'Understandable at any skill level',
    body: 'A student learning security and a freelancer protecting client work get the same clarity, findings written in sentences, with the evidence attached underneath.',
  },
]

const milestones = [
  { year: '2023', label: 'Started building', desc: 'Began as a personal project to monitor my own home network without enterprise tooling.' },
  { year: '2024', label: 'AI integration', desc: 'Added LLM-powered analysis to turn raw alerts into plain-English investigations.' },
  { year: '2025', label: 'Open launch', desc: 'Made HomeSIEM available to home users, students and small businesses worldwide.' },
  { year: '2026', label: 'Full platform', desc: 'SIEM, IDS, NDR, packet analysis and threat intelligence in one unified dashboard.' },
]

export default function AboutPage() {
  useEffect(() => { document.title = 'About · HomeSIEM' }, [])

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-[72px]">
        {/* Founder */}
        <section className="py-20 lg:py-28">
          <div className="container-x">
            <div className="mx-auto max-w-4xl">
              <span className="eyebrow">The founder</span>
              <h1 className="section-title mt-4">Built by <span className="text-brand-600">Samson Budigila</span></h1>

              <div className="mt-10 grid gap-10 lg:grid-cols-[280px_1fr]">
                {/* Photo placeholder */}
                <div className="flex flex-col items-center">
                  <div className="relative h-[320px] w-full max-w-[280px] overflow-hidden rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-brand-100 to-slate-100">
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                      <Shield size={48} className="mb-3 text-brand-300" />
                      <span className="text-sm font-semibold">Photo coming soon</span>
                    </div>
                  </div>
                  <p className="mt-3 text-center text-xs text-slate-400">Founder &amp; Lead Developer</p>
                </div>

                {/* Bio */}
                <div className="space-y-5 text-base leading-relaxed text-slate-600">
                  <p>
                    Samson Budigila is a cybersecurity enthusiast and software developer with a passion for
                    making enterprise-grade security tools accessible to everyone. Based in Tanzania, he
                    built HomeSIEM out of a personal need, monitoring his own home network without paying
                    enterprise prices or juggling half a dozen separate tools.
                  </p>
                  <p>
                    With a background in software engineering and a deep interest in network security,
                    Samson designed HomeSIEM to sit at the intersection of power and simplicity. The
                    platform combines log analysis, live packet capture, intrusion detection and AI-powered
                    threat investigation into a single dashboard that anyone can set up on a spare laptop
                    or Raspberry Pi.
                  </p>
                  <p>
                    His philosophy is straightforward: security tools should explain what they find in
                    plain language, not drown you in raw alerts. Every feature in HomeSIEM is built with
                    that principle in mind.
                  </p>

                  <div className="flex flex-wrap gap-3 pt-2">
                    {[
                      { icon: Shield, label: 'Cybersecurity' },
                      { icon: Zap, label: 'Full-Stack Development' },
                      { icon: Brain, label: 'AI & Machine Learning' },
                    ].map((t) => (
                      <span
                        key={t.label}
                        className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-xs font-semibold text-brand-700"
                      >
                        <t.icon size={13} />
                        {t.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What we do */}
        <section className="border-t border-slate-100 bg-slate-50/60 py-20 lg:py-28">
          <div className="container-x">
            <div className="grid gap-14 lg:grid-cols-[.9fr_1.1fr]">
              <div>
                <h2 className="section-title">
                  What is HomeSIEM
                </h2>
                <p className="mt-5 text-base leading-relaxed text-slate-600">
                  HomeSIEM combines the capabilities you would normally find spread across a SIEM, an IDS,
                  an NDR platform and a threat intelligence service, and folds an AI analyst on top of all of it.
                </p>
                <p className="mt-4 text-base leading-relaxed text-slate-600">
                  It ingests logs from Windows, Linux and macOS, captures live packets straight off the wire,
                  correlates the two, and produces written investigations instead of raw detections. The result is
                  a platform serious enough for a penetration tester and approachable enough for someone securing
                  their first home network.
                </p>

                <div className="mt-8 rounded-xl border border-brand-200 bg-white p-5 shadow-card">
                  <p className="text-sm font-semibold text-slate-900">Instead of this:</p>
                  <p className="mt-1.5 font-mono text-sm text-slate-500">Alert: Port Scan, 192.168.1.24</p>
                  <p className="mt-4 text-sm font-semibold text-brand-700">You get this:</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
                    &ldquo;Between 10:14 and 10:18, host 192.168.1.24 attempted connections to 317 unique ports on
                    192.168.1.10. The pattern resembles automated reconnaissance. The activity originated shortly
                    after a new device joined the network. Confidence: 91%.&rdquo;
                  </p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                {pillars.map((p) => (
                  <article
                    key={p.title}
                    className="card group p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-lift"
                  >
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                      <p.icon size={21} />
                    </span>
                    <h3 className="mt-4 text-base font-bold text-slate-900">{p.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-20 lg:py-28">
          <div className="container-x">
            <div className="mx-auto max-w-3xl text-center">
              <span className="eyebrow">Our journey</span>
              <h2 className="section-title mt-4">From idea to platform</h2>
            </div>
            <ol className="mx-auto mt-12 max-w-2xl">
              {milestones.map((m, i) => (
                <li key={m.year} className="relative flex gap-6 pb-10 last:pb-0">
                  {i < milestones.length - 1 && (
                    <div className="absolute left-[19px] top-10 h-full w-px bg-brand-200" />
                  )}
                  <span className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">
                    {m.year.slice(2)}
                  </span>
                  <div className="pt-1.5">
                    <h3 className="text-base font-bold text-slate-900">{m.label}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{m.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
