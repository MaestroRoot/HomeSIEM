import { useEffect, useMemo, useRef, useState } from 'react'
import { Bot, Loader2, Mic, Send, Sparkles, User, Volume2, VolumeX } from 'lucide-react'
import { PageHeader, SectionCard, cx } from '@/components/ui'
import { api, ApiError } from '@/lib/api'
import type { AiText, StatsOverview } from '@/lib/types'

interface Msg {
  role: 'user' | 'assistant'
  content: string
}

// Web Speech API haipo kwenye TS lib za kawaida.
const SpeechRecognitionCtor: any =
  typeof window !== 'undefined' ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : undefined

const SUGGESTIONS = [
  'What are the biggest risks on my network right now?',
  'Summarise the flagged events for me.',
  'Which device should I look at first?',
  'Is contacting a domain in a threat report always dangerous?',
]

// Ushauri wa haraka unaotokana na data halisi ya mtandao wa mtumiaji.
function buildProactive(stats: StatsOverview | null): { insight: string | null; suggestions: string[] } {
  if (!stats) return { insight: null, suggestions: SUGGESTIONS }
  const suggestions: string[] = []
  const worst = stats.suspicious[0]
  if (stats.byVerdict.malicious > 0) {
    suggestions.push(`I have ${stats.byVerdict.malicious} malicious event(s) — what should I do first?`)
  }
  if (stats.flagged > 0) {
    suggestions.push(`Summarise my ${stats.flagged} flagged event(s) and group them by device.`)
  }
  if (worst) {
    suggestions.push(`Explain why ${worst.indicator} is flagged and whether I should block it.`)
  }
  if (stats.topDomains.some((d) => d.flagged)) {
    const d = stats.topDomains.find((x) => x.flagged)!
    suggestions.push(`Is it safe that my devices keep contacting ${d.name}?`)
  }
  while (suggestions.length < 4) {
    const next = SUGGESTIONS.find((s) => !suggestions.includes(s))
    if (!next) break
    suggestions.push(next)
  }

  let insight: string | null = null
  if (stats.byVerdict.malicious > 0) {
    insight = `Heads up: ${stats.byVerdict.malicious} malicious and ${stats.byVerdict.suspicious} suspicious event(s) are on record. ${worst ? `The strongest lead is ${worst.indicator}${worst.country ? ` (${worst.country})` : ''}.` : ''}`
  } else if (stats.flagged > 0) {
    insight = `${stats.flagged} event(s) are flagged for review across ${stats.activeDevices} active device(s). Nothing confirmed malicious yet — worth a look.`
  } else if (stats.totalEvents > 0) {
    insight = `All quiet: ${stats.totalEvents.toLocaleString()} events processed and nothing flagged. Ask me anything to double-check.`
  }
  return { insight, suggestions: suggestions.slice(0, 4) }
}

export default function Assistant() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [listening, setListening] = useState(false)
  const [speak, setSpeak] = useState(false)
  const [stats, setStats] = useState<StatsOverview | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  useEffect(() => {
    api.get<StatsOverview>('/stats/overview').then(setStats).catch(() => {})
  }, [])

  const proactive = useMemo(() => buildProactive(stats), [stats])

  function toggleMic() {
    if (!SpeechRecognitionCtor) return
    if (listening) {
      recognitionRef.current?.stop()
      return
    }
    const rec = new SpeechRecognitionCtor()
    rec.lang = 'en-US'
    rec.interimResults = true
    rec.continuous = false
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join('')
      setInput(transcript)
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recognitionRef.current = rec
    rec.start()
    setListening(true)
  }

  function speakText(text: string) {
    if (!speak || typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))
  }

  async function send(text: string) {
    const content = text.trim()
    if (!content || busy) return
    const next: Msg[] = [...messages, { role: 'user', content }]
    setMessages(next)
    setInput('')
    setBusy(true)
    try {
      const res = await api.post<AiText>('/ai/chat', { messages: next })
      setMessages((m) => [...m, { role: 'assistant', content: res.reply }])
      speakText(res.reply)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'The assistant is unavailable.'
      setMessages((m) => [...m, { role: 'assistant', content: `⚠️ ${msg}` }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={Bot} title="AI Chat Assistant" subtitle="Ask about your network. The assistant can see your live events, devices and threat-intel verdicts." />

      <SectionCard>
        <div className="flex h-[560px] flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.length === 0 ? (
              <div className="grid h-full place-items-center">
                <div className="max-w-md text-center">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-600 text-white"><Bot size={22} /></span>
                  <p className="mt-3 font-semibold text-slate-800">Ask your SOC anything</p>
                  <p className="mt-1 text-sm text-slate-500">The assistant answers from your own data. Try one of these:</p>
                  {proactive.insight && (
                    <div className="mt-4 flex items-start gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-3 text-left">
                      <Sparkles size={16} className="mt-0.5 shrink-0 text-brand-600" />
                      <p className="text-sm text-slate-700">{proactive.insight}</p>
                    </div>
                  )}
                  <div className="mt-4 flex flex-col gap-2">
                    {proactive.suggestions.map((s) => (
                      <button key={s} type="button" onClick={() => send(s)} className="rounded-lg border border-slate-200 px-3 py-2 text-left text-sm text-slate-600 hover:border-brand-300 hover:bg-brand-50">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={cx('flex gap-3', m.role === 'user' && 'flex-row-reverse')}>
                  <span className={cx('grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white', m.role === 'user' ? 'bg-slate-600' : 'bg-brand-600')}>
                    {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </span>
                  <div className={cx('max-w-[75%] whitespace-pre-wrap rounded-xl px-4 py-2.5 text-sm leading-relaxed', m.role === 'user' ? 'bg-slate-100 text-slate-800' : 'bg-brand-50 text-slate-700')}>
                    {m.content}
                  </div>
                </div>
              ))
            )}
            {busy && (
              <div className="flex gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-600 text-white"><Bot size={16} /></span>
                <div className="rounded-xl bg-brand-50 px-4 py-2.5"><Loader2 size={16} className="animate-spin text-brand-600" /></div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); send(input) }} className="flex gap-2 border-t border-slate-100 p-4">
            {SpeechRecognitionCtor && (
              <button type="button" onClick={toggleMic} title={listening ? 'Stop listening' : 'Speak'} className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-lg border', listening ? 'border-red-300 bg-red-50 text-red-600 animate-pulse' : 'border-slate-200 text-slate-500 hover:bg-slate-50')}>
                <Mic size={16} />
              </button>
            )}
            <button type="button" onClick={() => setSpeak((v) => !v)} title={speak ? 'Mute responses' : 'Speak responses'} className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-lg border', speak ? 'border-brand-300 bg-brand-50 text-brand-600' : 'border-slate-200 text-slate-500 hover:bg-slate-50')}>
              {speak ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <input className="input flex-1" placeholder={listening ? 'Listening…' : 'Ask about your network…'} value={input} onChange={(e) => setInput(e.target.value)} disabled={busy} />
            <button type="submit" className="btn-primary" disabled={busy || !input.trim()}>
              <Send size={15} /> Send
            </button>
          </form>
        </div>
      </SectionCard>
    </div>
  )
}
