import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function Hero() {
  return (
    <section id="home" className="relative isolate overflow-hidden min-h-screen pt-[72px] bg-slate-900 flex flex-col justify-center">
      {/* video + overlay background */}
      <div className="absolute inset-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/hero-poster.svg"
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="container-x relative z-10 mx-auto w-full pb-16 pt-10 sm:pb-20 lg:pb-32 lg:pt-14">
        <div className="animate-fade-up max-w-2xl px-4 sm:px-6">
          <h1 className="mt-5 text-3xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Your own <span className="text-brand-300">Security Operations Center</span>
            <span className="block">running at home.</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-100/90 sm:text-lg">
            HomeSIEM collects logs and live packets from every device you own, runs them through an AI
            threat engine, and explains what is happening in plain language, not just another wall of alerts.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/signup" className="btn-primary px-6 py-3 text-base">
              Get Started Free <ArrowRight size={18} />
            </Link>
            <a href="#services" className="btn-ghost px-6 py-3 text-base">
              Explore the Platform
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
