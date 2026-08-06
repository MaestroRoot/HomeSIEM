import { useEffect, useState } from 'react'
import { Check, Copy, Globe, Loader2, Trash2 } from 'lucide-react'
import { SectionCard, StatusPill } from '@/components/ui'
import { api, ApiError } from '@/lib/api'
import type { NextDnsConfig } from '@/lib/types'

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

export default function NextDnsCard() {
  const [config, setConfig] = useState<NextDnsConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileId, setProfileId] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
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

  async function save() {
    if (!profileId.trim() || !apiKey.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      const c = await api.put<NextDnsConfig>('/nextdns', { profileId: profileId.trim(), apiKey: apiKey.trim() })
      setConfig(c)
      setEditing(false)
      setApiKey('')
      setProfileId('')
    } catch (err) {
      setError(err instanceof ApiError ? (err.code === 'insufficient_role' ? 'Only the workspace owner can set this up.' : err.message) : 'Could not save.')
    } finally {
      setSaving(false)
    }
  }

  async function disconnect() {
    if (!window.confirm('Disconnect NextDNS? Domains will stop flowing in until you set it up again.')) return
    try {
      await api.del('/nextdns')
      await load()
    } catch {
      /* keep */
    }
  }

  const connected = config?.configured && !editing

  return (
    <SectionCard
      title="3. Monitor phones / whole home (NextDNS)"
      description="See every domain your devices look up — no app to install on the phone, works on mobile data too."
      right={<Globe size={18} className="text-slate-400" />}
    >
      <div className="space-y-4 p-5">
        {loading ? (
          <div className="grid place-items-center py-6 text-slate-400"><Loader2 size={18} className="animate-spin" /></div>
        ) : connected ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone="green">connected</StatusPill>
              <span className="text-sm text-slate-600">Profile <span className="font-mono">{config!.profileId}</span> · key {config!.apiKeyMasked}</span>
            </div>

            <div>
              <p className="mb-1.5 text-sm font-semibold text-slate-700">On each phone, set this as the Private DNS:</p>
              <CopyRow text={config!.dnsHostname ?? ''} />
              <ul className="mt-2 space-y-1 text-xs text-slate-500">
                <li><span className="font-semibold text-slate-600">Android:</span> Settings → Network → Private DNS → “provider hostname” → paste above.</li>
                <li><span className="font-semibold text-slate-600">iPhone / Mac:</span> my.nextdns.io → Setup → Apple → install profile.</li>
                <li>Use the <span className="font-semibold">hostname</span>, not an IP. Every domain the device looks up then appears in HomeSIEM.</li>
              </ul>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
              <span>
                {config!.lastSyncedAt ? `Last sync ${new Date(config!.lastSyncedAt).toLocaleTimeString()}` : 'Not synced yet'}
                {config!.lastStatus ? ` · ${config!.lastStatus}` : ''}
              </span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => { setEditing(true); setProfileId(config!.profileId ?? '') }} className="btn-ghost btn-sm">Reconfigure</button>
                <button type="button" onClick={disconnect} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Disconnect"><Trash2 size={15} /></button>
              </div>
            </div>
          </>
        ) : (
          <>
            <ol className="space-y-1.5 text-sm text-slate-600">
              <li><span className="font-semibold text-slate-800">1.</span> Create a free account at <span className="font-mono text-[12px]">nextdns.io</span>.</li>
              <li><span className="font-semibold text-slate-800">2.</span> Copy your <span className="font-semibold">Profile ID</span> (Setup tab, e.g. <span className="font-mono text-[12px]">a1b2c3</span>) and your <span className="font-semibold">API Key</span> (Account → API section).</li>
              <li><span className="font-semibold text-slate-800">3.</span> Paste both below → Save. We then give you a hostname for the phones.</li>
            </ol>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">NextDNS Profile ID</label>
                <input className="input" placeholder="e.g. a1b2c3" value={profileId} onChange={(e) => setProfileId(e.target.value)} />
              </div>
              <div>
                <label className="label">NextDNS API Key</label>
                <input className="input" type="password" placeholder="from Account → API" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
              </div>
            </div>
            {error && <p className="text-sm text-red-700">{error}</p>}
            <div className="flex items-center gap-2">
              <button type="button" className="btn-primary btn-sm" onClick={save} disabled={saving || !profileId.trim() || !apiKey.trim()}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />} Connect NextDNS
              </button>
              {editing && <button type="button" className="btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>}
            </div>
          </>
        )}
      </div>
    </SectionCard>
  )
}
