import { useEffect } from 'react'
import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
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
      </main>
      <Footer />
    </div>
  )
}
