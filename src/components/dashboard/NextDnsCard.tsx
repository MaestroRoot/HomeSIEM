import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Check, Copy, Globe, Loader2, Smartphone, Trash2, Wifi } from 'lucide-react'
import { SectionCard, StatusPill } from '@/components/ui'
import { api, ApiError } from '@/lib/api'
import type { NextDnsConfig } from '@/lib/types'

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '/api/v1').replace(/\/$/, '')

function appleProfileUrl(orgId: string): string {
  const base = API_BASE.startsWith('http') ? API_BASE : `${window.location.origin}${API_BASE}`
  return `${base}/nextdns/apple/${orgId}`
}

function androidLink(profileId: string): string {
  return `https://link.nextdns.io/${profileId}`
}

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

function QrBox({ value, width = 160 }: { value: string | null; width?: number }) {
  const [qr, setQr] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    if (value) {
      QRCode.toDataURL(value, { margin: 1, width })
        .then((url) => alive && setQr(url))
        .catch(() => alive && setQr(null))
    } else {
      setQr(null)
    }
    return () => { alive = false }
  }, [value, width])
  return qr ? (
    <img src={qr} alt="QR" className="mx-auto rounded-lg" style={{ width, height: width }} />
  ) : (
    <div className="mx-auto grid place-items-center text-slate-300" style={{ width, height: width }}>
      <Loader2 size={18} className="animate-spin" />
    </div>
  )
}

export default function NextDnsCard() {
  const [config, setConfig] = useState<NextDnsConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [provisioning, setProvisioning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      setConfig(await api.get<NextDnsConfig>('/nextdns'))
    } catch {
      /* keep */
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  async function provision() {
    setProvisioning(true)
    setError(null)
    try {
      const c = await api.post<NextDnsConfig>('/nextdns/provision', {})
      setConfig(c)
    } catch (err) {
      setError(err instanceof ApiError ? (err.code === 'insufficient_role' ? 'Only the workspace owner can set this up.' : err.message) : 'Could not create the DNS network configuration.')
    } finally {
      setProvisioning(false)
    }
  }

  async function disconnect() {
    if (!window.confirm('Disconnect DNS monitoring? Phone traffic will stop being monitored until you reconnect.')) return
    try {
      await api.del('/nextdns')
      await load()
    } catch {
      /* keep */
    }
  }

  const connected = config?.configured && config.profileId && !provisioning

  return (
    <SectionCard
      title="3. Monitor phones / whole home (DNS Network Configuration)"
      description="One click creates a private DNS network for your devices. You get a domain and QR codes — iPhone and Android are set up by scanning, no account or login needed."
      right={<Wifi size={18} className="text-slate-400" />}
    >
      <div className="space-y-4 p-5">
        {loading ? (
          <div className="grid place-items-center py-6 text-slate-400"><Loader2 size={18} className="animate-spin" /></div>
        ) : connected ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone="green">connected</StatusPill>
              <span className="text-sm text-slate-600">
                Network <span className="font-mono">{config!.profileName ?? config!.profileId}</span>
              </span>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">DNS domain (for manual setup)</p>
              <CopyRow text={config!.dohHostname ?? ''} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* iPhone: scan-to-install */}
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Smartphone size={15} className="text-brand-600" /> iPhone — scan & install
                </div>
                <QrBox value={config!.organizationId ? appleProfileUrl(config!.organizationId) : null} />
                <p className="mt-2 text-xs text-slate-500">Open the iPhone <span className="font-semibold">Camera</span>, point at the QR, tap the link, then <span className="font-semibold">Settings → Install</span> the profile. No app, no login.</p>
              </div>

              {/* Android: scan via link.nextdns.io */}
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Smartphone size={15} className="text-brand-600" /> Android — scan to set up
                </div>
                <QrBox value={config!.profileId ? androidLink(config!.profileId) : null} />
                <p className="mt-2 text-xs text-slate-500">Open the Android <span className="font-semibold">Camera</span>, point at the QR, and tap the link — it configures Private DNS automatically. Or paste the domain above manually.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
              <span>
                {config!.lastSyncedAt ? `Last sync ${new Date(config!.lastSyncedAt).toLocaleTimeString()}` : 'Not synced yet'}
                {config!.lastStatus ? ` · ${config!.lastStatus}` : ''}
              </span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={disconnect} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Disconnect"><Trash2 size={15} /></button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <p className="text-sm text-slate-700">
                <strong>Zero setup required.</strong> We handle everything — you just click. Your workspace gets a private NextDNS network
                (e.g. <code className="font-mono text-[12px]">abc123.dns.nextdns.io</code>) with threat filtering and query logs
                that appear here as security events.
              </p>
            </div>

            {error && <p className="text-sm text-red-700">{error}</p>}

            <div className="flex items-center gap-2">
              <button type="button" className="btn-primary btn-sm" onClick={provision} disabled={provisioning}>
                {provisioning
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Globe size={14} />}
                {provisioning ? 'Creating…' : 'Get DNS Network Configuration'}
              </button>
              {provisioning && <span className="text-xs text-slate-500">Creating your private DNS network…</span>}
            </div>

            <p className="text-xs text-slate-500">
              After enabling, you'll get a <strong>DNS domain</strong> plus <strong>QR codes for iPhone and Android</strong>.
              Works on WiFi and mobile data. No NextDNS account needed on your side.
            </p>
          </>
        )}
      </div>
    </SectionCard>
  )
}
