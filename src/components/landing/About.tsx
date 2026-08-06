import { Brain, Home, Lock, MessageSquareText } from 'lucide-react'

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

export default function About() {
  return (
    <section id="about" className="relative border-y border-slate-100 bg-slate-50/60 py-20 lg:py-28">
      <div className="container-x">
        <div className="grid gap-14 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <span className="eyebrow">About the platform</span>
            <h2 className="section-title mt-4">
              A SIEM that talks back
              <span className="block text-brand-600">in a language you understand.</span>
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
                “Between 10:14 and 10:18, host 192.168.1.24 attempted connections to 317 unique ports on
                192.168.1.10. The pattern resembles automated reconnaissance. The activity originated shortly
                after a new device joined the network. Confidence: 91%.”
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
  )
}
