import { Link } from 'react-router-dom'
import { ArrowRight, Github, Globe, Mail } from 'lucide-react'
import Logo from '../Logo'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <>
      {/* CTA */}
      <section className="relative overflow-hidden bg-brand-700 py-16 lg:py-20">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-brand-500/40 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-brand-400/30 blur-3xl" />
        <div className="container-x relative text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Start watching your own network tonight
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-brand-100">
            Create an account, add your first device, and have live packet capture with AI analysis running in
            under ten minutes.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/signup"
              className="btn bg-white px-6 py-3 text-base text-brand-700 shadow-lg hover:bg-brand-50"
            >
              Create free account <ArrowRight size={18} />
            </Link>
            <Link
              to="/login"
              className="btn border border-white/40 px-6 py-3 text-base text-white hover:bg-white/10"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="container-x grid gap-10 py-14 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-600">
              A next-generation AI-powered personal SIEM and home SOC platform. SIEM, IDS, NDR and AI
              investigation in one place.
            </p>
            <div className="mt-5 flex gap-2">
              {[Github, Globe, Mail].map((Icon, i) => (
                <span
                  key={i}
                  className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600"
                >
                  <Icon size={16} />
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900">Navigate</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
              {[
                { l: 'Home', h: '#home' },
                { l: 'About', h: '#about' },
                { l: 'Services', h: '#services' },
                { l: 'How it works', h: '#how' },
                { l: 'Who it is for', h: '#audience' },
              ].map((i) => (
                <li key={i.h}>
                  <a href={i.h} className="hover:text-brand-600">
                    {i.l}
                  </a>
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
            <p>© {year} HomeSIEM. Monitor only networks and systems you are authorised to test.</p>
            <p className="font-mono">v1.0.0 · Personal SIEM &amp; Home SOC</p>
          </div>
        </div>
      </footer>
    </>
  )
}
