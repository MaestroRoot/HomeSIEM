import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Check, Copy, Globe, Loader2, Smartphone, Trash2, Wifi } from 'lucide-react'
import { SectionCard, StatusPill } from '@/components/ui'
import { api, ApiError } from '@/lib/api'
import type { CloudflareGatewayConfig } from '@/lib/types'

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '/api/v1').replace(/\/$/, '')

function appleProfileUrl(orgId: string): string {
  const base = API_BASE.startsWith('http') ? API_BASE : `${window.location.origin}${API_BASE}`
  return `${base}/cloudflare-gateway/apple/${orgId}`
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

export default function CloudflareGatewayCard() {
  const [config, setConfig] = useState<CloudflareGatewayConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [provisioning, setProvisioning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [qr, setQr] = useState<string | null>(null)

  useEffect(() => {
    if (config?.configured && config.dohHostname) {
      QRCode.toDataURL(appleProfileUrl(config.organizationId ?? ''), { margin: 1, width: 200 })
        .then(setQr)
        .catch(() => setQr(null))
    } else {
      setQr(null)
    }
  }, [config?.configured, config?.dohHostname, config?.organizationId])

  async function load() {
    try {
      setConfig(await api.get<CloudflareGatewayConfig>('/cloudflare-gateway'))
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
      const c = await api.post<CloudflareGatewayConfig>('/cloudflare-gateway/provision', {})
      setConfig(c)
    } catch (err) {
      setError(err instanceof ApiError ? (err.code === 'insufficient_role' ? 'Only the workspace owner can set this up.' : err.message) : 'Could not provision Cloudflare Gateway location.')
    } finally {
      setProvisioning(false)
    }
  }

  async function disconnect() {
    if (!window.confirm('Disconnect DNS monitoring? Phone traffic will stop being monitored until you reconnect.')) return
    try {
      await api.del('/cloudflare-gateway')
      await load()
    } catch {
      /* keep */
    }
  }

  const connected = config?.configured && config.locationId && !provisioning

  return (
    <SectionCard
      title="3. Monitor phones / whole home (DNS Setup)"
      description="One-click setup — we create a private DNS location for your account. Free: 1M queries/mo, 7-day logs. Works on mobile data too."
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
                Location <span className="font-mono">{config!.locationName ?? config!.locationId}</span>
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* iPhone: scan-to-install */}
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Smartphone size={15} className="text-brand-600" /> iPhone — scan & install
                </div>
                {qr ? (
                  <img src={qr} alt="Install QR" className="mx-auto h-40 w-40 rounded-lg" />
                ) : (
                  <div className="mx-auto grid h-40 w-40 place-items-center text-slate-300"><Loader2 size={18} className="animate-spin" /></div>
                )}
                <p className="mt-2 text-xs text-slate-500">Open the iPhone <span className="font-semibold">Camera</span>, point at the QR, tap the link, then <span className="font-semibold">Settings → Install</span> the profile. No app, no login.</p>
              </div>

              {/* Android: Private DNS hostname */}
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Smartphone size={15} className="text-brand-600" /> Android — Private DNS
                </div>
                <CopyRow text={config!.dohHostname ?? ''} />
                <p className="mt-2 text-xs text-slate-500">Settings → Network → <span className="font-semibold">Private DNS</span> → "provider hostname" → paste the above. Use the hostname, not an IP.</p>
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
                <strong>Zero setup required.</strong> We handle everything — you just click Enable. Your account gets a private DNS location
                (e.g. <code className="font-mono text-[12px]">org-abc123.dns.cloudflare-gateway.com</code>)
                with 1M free queries/month and 7-day log retention.
              </p>
            </div>

            {error && <p className="text-sm text-red-700">{error}</p>}

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn-primary btn-sm"
                onClick={provision}
                disabled={provisioning || !settings.cloudflare_gateway_ready}
              >
                {provisioning
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Globe size={14} />}
                {provisioning ? 'Provisioning…' : 'Enable phone monitoring'}
              </button>
              {provisioning && <span className="text-xs text-slate-500">Creating your private DNS location…</span>}
            </div>

            <p className="text-xs text-slate-500">
              After enabling, you'll get a <strong>DoH hostname</strong> for iPhone (QR) and Android (Private DNS).
              Works on WiFi and mobile data. No account needed on your side.
            </p>
          </>
        )}
      </div>
    </SectionCard>
  )
}

// We need to access settings.cloudflare_gateway_ready from frontend
// For now, assume it's configured on backend
const settings = { cloudflare_gateway_ready: true }