import { useEffect } from 'react'
import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import About from '@/components/landing/About'
import Services from '@/components/landing/Services'
import HowItWorks from '@/components/landing/HowItWorks'
import Audience from '@/components/landing/Audience'
import Footer from '@/components/landing/Footer'

export default function Landing() {
  useEffect(() => {
    document.title = 'HomeSIEM'
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <About />
        <Services />
        <HowItWorks />
        <Audience />
      </main>
      <Footer />
    </div>
  )
}
