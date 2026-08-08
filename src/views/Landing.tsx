import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import Footer from '@/components/landing/Footer'

const highlights = [
  'Live packet capture with AI verdicts',
  'DNS monitoring across every device',
  'Correlated alerts, not raw log noise',
  'Written investigations in plain English',
  'Runs on a laptop, Raspberry Pi or VPS',
  'Your data never leaves your network',
]

export default function Landing() {
  useEffect(() => {
    document.title = 'HomeSIEM'
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />

        {/* Highlights bridge */}
        <section className="border-b border-slate-100 py-16 lg:py-20">
          <div className="container-x mx-auto max-w-4xl text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Everything you need to secure your home network
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-600">
              One platform combining SIEM, IDS, NDR and AI analysis, built for people who want
              security without the complexity.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {highlights.map((h) => (
                <div key={h} className="flex items-center gap-2.5 text-left">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-600">
                    <Check size={14} strokeWidth={3} />
                  </span>
                  <span className="text-sm font-medium text-slate-700">{h}</span>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Link to="/about" className="text-sm font-semibold text-brand-600 hover:text-brand-800">
                Learn more about HomeSIEM &rarr;
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
