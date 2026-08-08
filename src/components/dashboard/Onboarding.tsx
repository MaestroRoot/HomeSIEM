import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Copy,
  Globe,
  Loader2,
  Radio,
  ShieldCheck,
  Smartphone,
  X,
} from 'lucide-react'
import QRCode from 'qrcode'
import { api, ApiError } from '@/lib/api'
import type { NextDnsConfig } from '@/lib/types'

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '/api/v1').replace(/\/$/, '')

function CopyRow({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2.5">
      <code className="flex-1 overflow-x-auto font-mono text-[13px] text-slate-100">{text}</code>
      <button
        type="button"
        onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
        className="shrink-0 rounded-md bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700"
        aria-label="Copy"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
  )
}

export default function Onboarding({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0)

  // Step 1 state: sensor token
  const [token, setToken] = useState<string | null>(null)
  const [tokenLoading, setTokenLoading] = useState(false)

  // Step 2 state: nextdns
  const [ndConfig, setNdConfig] = useState<NextDnsConfig | null>(null)
  const [ndProvisioning, setNdProvisioning] = useState(false)
  const [ndError, setNdError] = useState<string | null>(null)
  const [iosQr, setIosQr] = useState<string | null>(null)
  const [androidQr, setAndroidQr] = useState<string | null>(null)

  if (!open) return null

  // Step 0: Welcome
  // Step 1: Install sensor (token)
  // Step 2: Phone DNS (NextDNS)
  // Step 3: All done
  const last = step === 3

  async function fetchToken() {
    if (token) return
    setTokenLoading(true)
    try {
      const res = await api.post<{ token: string }>('/sensors/tokens', { label: 'my-device' })
      setToken(res.token)
    } catch {
      // fallback: user can go to the Sensors page manually
    } finally {
      setTokenLoading(false)
    }
  }

  async function fetchNdConfig() {
    try {
      setNdConfig(await api.get<NextDnsConfig>('/nextdns'))
    } catch {
      /* keep */
    }
  }

  async function provisionNd() {
    setNdProvisioning(true)
    setNdError(null)
    try {
      const c = await api.post<NextDnsConfig>('/nextdns/provision', {})
      setNdConfig(c)
    } catch (err) {
      setNdError(err instanceof ApiError ? err.message : 'Could not create the DNS network configuration.')
    } finally {
      setNdProvisioning(false)
    }
  }

  // Generate QRs when config changes
  useEffect(() => {
    if (ndConfig?.configured && ndConfig.profileId) {
      const base = API_BASE.startsWith('http') ? API_BASE : `${window.location.origin}${API_BASE}`
      QRCode.toDataURL(ndConfig.organizationId ? `${base}/nextdns/apple/${ndConfig.organizationId}` : '', { margin: 1, width: 180 })
        .then(setIosQr)
        .catch(() => setIosQr(null))
      QRCode.toDataURL(`https://link.nextdns.io/${ndConfig.profileId}`, { margin: 1, width: 180 })
        .then(setAndroidQr)
        .catch(() => setAndroidQr(null))
    } else {
      setIosQr(null)
      setAndroidQr(null)
    }
  }, [ndConfig?.configured, ndConfig?.profileId, ndConfig?.organizationId])

  function goNext() {
    const next = Math.min(3, step + 1)
    setStep(next)
    if (next === 1) fetchToken()
    if (next === 2) fetchNdConfig()
  }

  function goBack() {
    setStep((v) => Math.max(0, v - 1))
  }

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-600">
            <Radio size={13} /> Getting started
          </span>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Step content */}
        <div className="p-6">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white">
                <ShieldCheck size={26} />
              </span>
              <h2 className="mt-4 text-lg font-bold text-slate-900">Welcome to HomeSIEM</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Your home Security Operations Center. It watches what your devices connect to, checks it against threat intelligence, and flags anything suspicious.
              </p>
              <p className="mt-3 text-xs text-slate-400">Takes about 2 minutes.</p>
            </div>
          )}

          {/* Step 1: Install sensor */}
          {step === 1 && (
            <div>
              <div className="text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white">
                  <Radio size={26} />
                </span>
                <h2 className="mt-4 text-lg font-bold text-slate-900">Install the sensor</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Run one command on a computer or phone to start monitoring. The sensor stays running and reports back automatically.
                </p>
              </div>

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Your sensor token</p>
                {tokenLoading ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 size={14} className="animate-spin" /> Generating token…
                  </div>
                ) : token ? (
                  <CopyRow text={token} />
                ) : (
                  <p className="text-sm text-slate-500">Could not generate a token. You can do this later from the Sensor page.</p>
                )}

                {token && (
                  <div className="mt-3 rounded-lg bg-slate-900 p-3">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Run this on your device</p>
                    <code className="block font-mono text-[12px] text-green-400">
                      pip install homesiem &amp;&amp; homesiem start --token {token}
                    </code>
                  </div>
                )}
              </div>

              <p className="mt-3 text-xs text-slate-400">
                The sensor monitors DNS and network connections. It does not read passwords or personal files.
              </p>
            </div>
          )}

          {/* Step 2: Phone DNS */}
          {step === 2 && (
            <div>
              <div className="text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white">
                  <Smartphone size={26} />
                </span>
                <h2 className="mt-4 text-lg font-bold text-slate-900">Monitor your phone</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Point your phone's DNS at our server to monitor all its traffic — works on WiFi and mobile data.
                </p>
              </div>

              <div className="mt-5 space-y-3">
                {!ndConfig && !ndError ? (
                  <div className="grid place-items-center py-6 text-slate-400">
                    <Loader2 size={18} className="animate-spin" />
                  </div>
                ) : ndConfig?.configured && ndConfig.dohHostname ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-sm font-semibold text-slate-700">DNS monitoring is active</span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {/* iPhone */}
                      <div className="rounded-xl border border-slate-200 p-3">
                        <p className="mb-2 text-xs font-semibold text-slate-700">
                          <Smartphone size={12} className="mr-1 inline text-brand-600" /> iPhone
                        </p>
                        {iosQr ? (
                          <img src={iosQr} alt="QR" className="mx-auto h-32 w-32 rounded-lg" />
                        ) : (
                          <div className="mx-auto grid h-32 w-32 place-items-center text-slate-300">
                            <Loader2 size={16} className="animate-spin" />
                          </div>
                        )}
                        <p className="mt-1.5 text-[10px] text-slate-500">Camera → scan → tap link → Install</p>
                      </div>

                      {/* Android */}
                      <div className="rounded-xl border border-slate-200 p-3">
                        <p className="mb-2 text-xs font-semibold text-slate-700">
                          <Smartphone size={12} className="mr-1 inline text-brand-600" /> Android
                        </p>
                        {androidQr ? (
                          <img src={androidQr} alt="QR" className="mx-auto h-32 w-32 rounded-lg" />
                        ) : (
                          <div className="mx-auto grid h-32 w-32 place-items-center text-slate-300">
                            <Loader2 size={16} className="animate-spin" />
                          </div>
                        )}
                        <p className="mt-1.5 text-[10px] text-slate-500">Camera → scan → set up Private DNS</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                      <p className="text-sm text-slate-700">
                        <strong>One-click setup.</strong> We create a private DNS network for your devices with threat filtering
                        and query logs that show up here as security events.
                      </p>
                    </div>

                    {ndError && <p className="text-sm text-red-700">{ndError}</p>}

                    <button
                      type="button"
                      className="btn-primary btn-sm w-full"
                      onClick={provisionNd}
                      disabled={ndProvisioning}
                    >
                      {ndProvisioning ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
                      {ndProvisioning ? 'Creating…' : 'Get DNS Network Configuration'}
                    </button>

                    <p className="text-[11px] text-slate-400">
                      No NextDNS account needed. Works on WiFi and mobile data.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Done */}
          {step === 3 && (
            <div className="text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500 text-white">
                <Check size={26} />
              </span>
              <h2 className="mt-4 text-lg font-bold text-slate-900">You're all set!</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Browse a few websites on your phone. Within a few seconds, events will start appearing in your dashboard.
              </p>

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">What happens next</p>
                <ul className="mt-2 space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <ChevronRight size={14} className="mt-0.5 shrink-0 text-brand-600" />
                    DNS queries from your phone are checked against threat intelligence
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight size={14} className="mt-0.5 shrink-0 text-brand-600" />
                    Suspicious activity appears in <strong>Alerts</strong> automatically
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight size={14} className="mt-0.5 shrink-0 text-brand-600" />
                    See all devices and their activity on the <strong>Devices</strong> page
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer: prev / dots / next */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-5 py-3">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            aria-label="Previous step"
            className="btn-ghost btn-sm grid h-9 w-9 place-items-center !p-0 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="flex items-center gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={i === step ? 'h-1.5 w-5 rounded-full bg-brand-600' : 'h-1.5 w-1.5 rounded-full bg-slate-300'} />
            ))}
          </div>

          <button
            type="button"
            onClick={goNext}
            disabled={last}
            aria-label="Next step"
            className="btn-primary btn-sm grid h-9 w-9 place-items-center !p-0 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
