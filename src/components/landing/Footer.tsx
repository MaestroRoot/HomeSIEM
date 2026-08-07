import { Link } from 'react-router-dom'
import { ArrowRight, Brain, Eye, Globe, Mail, MessageCircle, Shield, Zap } from 'lucide-react'
import Logo from '../Logo'

const features = [
  { icon: Shield, title: 'Protect every device', desc: 'Windows, Linux, macOS, Android, iOS and routers, one dashboard watches them all.' },
  { icon: Eye, title: 'See what others miss', desc: 'Live packet capture, DNS monitoring and log analysis running 24/7 on your network.' },
  { icon: Brain, title: 'AI that explains, not just alerts', desc: 'Plain-English investigations telling you what happened, why it matters, and what to do next.' },
  { icon: Zap, title: 'Up and running in minutes', desc: 'No enterprise hardware, no consultants. Install on a spare laptop or a Raspberry Pi.' },
]

export default function Footer({ showCta = true }: { showCta?: boolean }) {
  const year = new Date().getFullYear()

  return (
    <>
      {/* CTA with video */}
      {showCta && (
      <section className="relative overflow-hidden py-20 lg:py-28">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/home-features.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-slate-900/50" />

        <div className="container-x relative z-10">
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/15"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500 text-white">
                  <f.icon size={20} />
                </span>
                <h3 className="mt-3 text-sm font-bold text-white">{f.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-300">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              to="/signup"
              className="btn bg-white px-6 py-3 text-base font-semibold text-slate-900 shadow-lg hover:bg-slate-100"
            >
              Create free account <ArrowRight size={18} />
            </Link>
            <Link
              to="/login"
              className="btn border border-white/30 px-6 py-3 text-base font-semibold text-white hover:bg-white/10"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </section>
      )}

      <footer className="border-t border-slate-200 bg-white">
        <div className="container-x grid gap-10 py-14 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-600">
              A next-generation AI-powered personal SIEM and home SOC platform. SIEM, IDS, NDR and AI
              investigation in one place.
            </p>
            <div className="mt-5 flex gap-2">
              {[
                { Icon: MessageCircle, href: 'https://wa.me/255757502743', label: 'WhatsApp' },
                { Icon: Globe, href: 'https://maestrotechnologies.com', label: 'Website' },
                { Icon: Mail, href: 'mailto:samsonbudigila6@gmail.com', label: 'Email' },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900">Navigate</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
              {[
                { l: 'Home', h: '/' },
                { l: 'About', h: '/about' },
                { l: 'Services', h: '/services' },
                { l: 'Pricing', h: '/pricing' },
                { l: 'How it works', h: '/how-it-works' },
                { l: 'Who it is for', h: '/who-it-is-for' },
                { l: 'Contact', h: '/contact' },
              ].map((i) => (
                <li key={i.h}>
                  <Link to={i.h} className="hover:text-brand-600">
                    {i.l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900">Legal</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
              <li>
                <Link to="/terms" className="hover:text-brand-600">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-brand-600">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/cookie" className="hover:text-brand-600">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-100">
          <div className="container-x flex flex-col items-center justify-between gap-3 py-5 text-xs text-slate-500 sm:flex-row">
            <p>&copy; {year} HomeSIEM. Monitor only networks and systems you are authorised to test.</p>
            <p className="font-mono">v1.0.0 &middot; Personal SIEM &amp; Home SOC</p>
          </div>
        </div>
      </footer>
    </>
  )
}
