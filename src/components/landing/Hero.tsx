import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function Hero() {
  return (
<section id="home" className="relative isolate overflow-hidden pt-[72px]">
      {/* video + overlay background */}
      <div className="absolute inset-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source
            src="https://videos.pexels.com/video-files/7661517/7661517-hd_1280_720_25fps.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="container-x relative z-10 mx-auto pb-24 pt-10 lg:pb-32 lg:pt-14">
        <div className="animate-fade-up max-w-2xl">
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Your own <span className="text-brand-300">Security Operations Center</span>
            <span className="block">running at home.</span>
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-100/90">
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
