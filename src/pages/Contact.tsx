import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle, Loader2, Mail, MessageSquare, Phone, Send, User } from 'lucide-react'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1').replace(/\/$/, '')

const topics = [
  'General inquiry',
  'Security consultation',
  'Partnership',
  'Bug report',
  'Feature request',
  'Pricing question',
  'Other',
]

export default function ContactPage() {
  useEffect(() => { document.title = 'Contact · HomeSIEM' }, [])

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [topic, setTopic] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) return setError('Please enter your name.')
    if (!email.includes('@')) return setError('Please enter a valid email address.')
    if (!topic) return setError('Please select a topic.')
    if (message.trim().length < 10) return setError('Message must be at least 10 characters.')

    setSending(true)
    try {
      const res = await fetch(`${API_BASE}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.trim() || undefined, topic, message: message.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Failed to send message.')
      }
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4 pt-[72px]">
          <div className="max-w-md text-center">
            <span className="grid mx-auto h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle size={32} />
            </span>
            <h1 className="mt-6 text-2xl font-extrabold text-slate-900">Message sent</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Thank you for reaching out. We will get back to you within 24 hours.
            </p>
            <button
              type="button"
              onClick={() => { setSent(false); setName(''); setEmail(''); setPhone(''); setTopic(''); setMessage('') }}
              className="btn-primary mt-8"
            >
              Send another message
            </button>
          </div>
        </main>
        <Footer showCta={false} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-[72px]">
        {/* Hero */}
        <section className="bg-slate-900 py-16 lg:py-20">
          <div className="container-x">
            <span className="eyebrow text-brand-300">Contact us</span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Let&apos;s talk about your security
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-200/90 sm:text-lg">
              Whether you need help securing your home network, want to discuss a partnership,
              or have a security question, we are here to help.
            </p>
          </div>
        </section>

        {/* Form + info */}
        <section className="py-16 lg:py-20">
          <div className="container-x">
            <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
              {/* Form */}
              <form onSubmit={onSubmit} className="space-y-5" noValidate>
                {error && (
                  <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="c-name">Full name</label>
                    <div className="relative">
                      <User size={16} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" />
                      <input id="c-name" className="input pl-10" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="label" htmlFor="c-email">Email address</label>
                    <div className="relative">
                      <Mail size={16} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" />
                      <input id="c-email" type="email" className="input pl-10" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="c-phone">Phone number <span className="text-slate-400">(optional)</span></label>
                    <div className="relative">
                      <Phone size={16} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" />
                      <input id="c-phone" type="tel" className="input pl-10" placeholder="+255 712 345 678" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="label" htmlFor="c-topic">Topic</label>
                    <select id="c-topic" className="input" value={topic} onChange={(e) => setTopic(e.target.value)}>
                      <option value="">Select a topic</option>
                      {topics.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label" htmlFor="c-message">Message</label>
                  <div className="relative">
                    <MessageSquare size={16} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" />
                    <textarea id="c-message" rows={6} className="input pl-10 resize-none" placeholder="Tell us about your security needs, questions or how we can help..." value={message} onChange={(e) => setMessage(e.target.value)} />
                  </div>
                </div>

                <button type="submit" className="btn-primary w-full sm:w-auto" disabled={sending}>
                  {sending && <Loader2 size={16} className="animate-spin" />}
                  {sending ? 'Sending...' : <>Send message <Send size={16} /></>}
                </button>
              </form>

              {/* Sidebar info */}
              <div className="space-y-6">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                  <h3 className="text-sm font-bold text-slate-900">Security consultations</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Need help setting up HomeSIEM for your network? We offer free consultations
                    to help you get started with monitoring your home or small business.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                  <h3 className="text-sm font-bold text-slate-900">Bug reports</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Found a security issue or a bug? We take security seriously. Report it here
                    and we will respond within 24 hours.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                  <h3 className="text-sm font-bold text-slate-900">Partnerships</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Interested in integrating HomeSIEM with your product or offering it to your
                    clients? Let us know about your use case.
                  </p>
                </div>

                <div className="rounded-xl border border-brand-200 bg-brand-50 p-6">
                  <p className="text-sm font-semibold text-brand-800">
                    Response time: We typically respond within 24 hours on business days.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-slate-50 py-16">
          <div className="container-x">
            <h2 className="section-title text-center text-3xl">Frequently asked questions</h2>
            <div className="mx-auto mt-10 max-w-2xl space-y-6">
              {[
                { q: 'Can I switch plans later?', a: 'Yes. Upgrade or downgrade from the Subscriptions page inside the dashboard. Changes take effect immediately and billing is prorated.' },
                { q: 'What happens when my trial ends?', a: 'You drop to the Free plan automatically. No payment is taken. Your data stays and you can upgrade any time.' },
                { q: 'How do I pay?', a: 'Mobile money via Yas Mix, Airtel Money or HaloPesa. Bank card support is coming soon. All payments are processed securely, we never store your card number.' },
                { q: 'What is a device?', a: 'Any phone, laptop, desktop, router, server or IoT gadget that the sensor monitors. Each device is identified by its MAC address.' },
                { q: 'Is there a limit on data?', a: 'No. We do not charge per event or per GB. All plans include unlimited log and event ingestion, the limits are on device count, retention and seat count.' },
              ].map((item) => (
                <div key={item.q} className="rounded-xl border border-slate-200 bg-white p-5">
                  <h3 className="text-sm font-bold text-slate-900">{item.q}</h3>
                  <p className="mt-2 text-sm text-slate-600">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer showCta={false} />
    </div>
  )
}
