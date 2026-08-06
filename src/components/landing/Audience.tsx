import { Briefcase, GraduationCap, Home, Microscope, Store, Terminal } from 'lucide-react'

const audiences = [
  {
    icon: Home,
    title: 'Home users',
    body: 'See exactly which devices are on your WiFi, what they are talking to, and whether anything on the network is behaving badly, without needing to know what a SIEM is.',
  },
  {
    icon: GraduationCap,
    title: 'Students learning cybersecurity',
    body: 'A safe lab that shows real detections with the reasoning attached. Every alert doubles as a lesson in why the traffic looked wrong.',
  },
  {
    icon: Store,
    title: 'Small businesses',
    body: 'Enterprise-grade monitoring for a shop, clinic or agency network, no SOC team, no per-seat licensing, no consultant required to read the output.',
  },
  {
    icon: Briefcase,
    title: 'Freelancers',
    body: 'Protect client work and your own machines, then hand over a clean PDF report showing exactly what was monitored and what was found.',
  },
  {
    icon: Terminal,
    title: 'Penetration testers',
    body: 'Upload engagement captures, replay attacks against your own lab, and use the detection engine to validate whether your activity is visible from the blue side.',
  },
  {
    icon: Microscope,
    title: 'Security researchers',
    body: 'Full packet access, entropy and timing analysis, custom rules and threat feed integration, with the AI investigation write-up as a starting hypothesis.',
  },
]

export default function Audience() {
  return (
    <section id="audience" className="py-20 lg:py-28">
      <div className="container-x">
        <div className="mx-auto max-w-3xl text-center">
          <span className="eyebrow">Who it is for</span>
          <h2 className="section-title mt-4">Built for six kinds of people</h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            The same engine, presented at the depth each person needs.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {audiences.map((a) => (
            <article
              key={a.title}
              className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-lift"
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand-50 transition-transform duration-500 group-hover:scale-150" />
              <div className="relative">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-600 text-white">
                  <a.icon size={20} />
                </span>
                <h3 className="mt-4 text-base font-bold text-slate-900">{a.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{a.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
