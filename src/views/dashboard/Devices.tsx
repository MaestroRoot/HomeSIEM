import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Cpu,
  HardDrive,
  Laptop,
  Loader2,
  Monitor,
  Plus,
  Printer,
  Radio,
  Router,
  Server,
  Smartphone,
  Trash2,
  Waves,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PageHeader, SectionCard, StatCard, StatusPill, TableWrap, cx } from '@/components/ui'
import SortableCardGrid from '@/components/dashboard/SortableCards'
import { api, ApiError } from '@/lib/api'
import { pollWhenVisible } from '@/lib/usePolling'
import type { MonitoredDevice, SecurityEventRow, Verdict } from '@/lib/types'

const verdictTone: Record<Verdict, 'red' | 'amber' | 'green' | 'slate'> = {
  malicious: 'red',
  suspicious: 'amber',
  clean: 'green',
  unknown: 'slate',
}

const deviceIcons: Record<string, LucideIcon> = {
  Phone: Smartphone,
  Laptop: Laptop,
  Desktop: Monitor,
  'Raspberry Pi': Cpu,
  Router: Router,
  Server: Server,
  VM: HardDrive,
  IoT: Printer,
  Unknown: Radio,
}

const addableTypes = ['Phone', 'Laptop', 'Desktop', 'Raspberry Pi', 'Router', 'Server', 'VM', 'IoT']

function timeAgo(iso: string | null): string {
  if (!iso) return 'never'
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60) return 'just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

function riskTone(score: number): 'green' | 'amber' | 'red' {
  if (score >= 70) return 'red'
  if (score >= 30) return 'amber'
  return 'green'
}

export default function Devices() {
  const [devices, setDevices] = useState<MonitoredDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({ name: '', deviceType: 'Laptop', mac: '', lastIp: '', hostname: '', ownerName: '' })

  // Live events feed
  const [events, setEvents] = useState<SecurityEventRow[]>([])
  const [onlyFlagged, setOnlyFlagged] = useState(false)
  const [tagFilter, setTagFilter] = useState<string | null>(null)

  async function load() {
    try {
      const res = await api.get<{ items: MonitoredDevice[]; total: number }>('/devices')
      setDevices(res.items)
      setError(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load devices.')
    } finally {
      setLoading(false)
    }
  }

  async function loadEvents(flaggedOnly: boolean) {
    try {
      const q = flaggedOnly ? '?onlyFlagged=true&limit=150' : '?limit=150'
      const res = await api.get<{ items: SecurityEventRow[]; total: number }>(`/events${q}`)
      setEvents(res.items)
    } catch {
      /* feed ni ya ziada, isivunje ukurasa */
    }
  }

  useEffect(() => {
    load()
  }, [])

  // Feed ya live: inaonyesha events zinapoingia kutoka sensor.
  useEffect(() => {
    loadEvents(onlyFlagged)
    const stop = pollWhenVisible(() => loadEvents(onlyFlagged), 15000)
    return () => stop()
  }, [onlyFlagged])

  async function addDevice(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || saving) return
    setSaving(true)
    try {
      await api.post<MonitoredDevice>('/devices', {
        name: form.name.trim(),
        deviceType: form.deviceType,
        mac: form.mac.trim() || null,
        lastIp: form.lastIp.trim() || null,
        hostname: form.hostname.trim() || null,
        ownerName: form.ownerName.trim() || null,
      })
      setForm({ name: '', deviceType: 'Laptop', mac: '', lastIp: '', hostname: '', ownerName: '' })
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not register the device.')
    } finally {
      setSaving(false)
    }
  }

  const counts = useMemo(() => {
    const active = devices.filter((d) => d.status === 'active').length
    const discovered = devices.filter((d) => d.discovered).length
    const atRisk = devices.filter((d) => d.riskScore >= 70).length
    return { active, discovered, atRisk }
  }, [devices])

  const allTags = useMemo(() => [...new Set(devices.flatMap((d) => d.tags ?? []))].sort(), [devices])
  const shown = tagFilter ? devices.filter((d) => (d.tags ?? []).includes(tagFilter)) : devices

  async function removeDevice(d: MonitoredDevice) {
    if (!window.confirm(`Delete device “${d.name}”? Its past events stay but are unlinked from any device. A discovered device may reappear if it is seen again.`)) return
    setDevices((rs) => rs.filter((x) => x.id !== d.id))
    try {
      await api.del(`/devices/${d.id}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete the device.')
      load()
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Laptop}
        title="Device Management"
        subtitle="Register the phones, laptops and other devices you want monitored. Devices a sensor sees for the first time show up here automatically."
        actions={
          <div className="flex items-center gap-2">
            <Link to="/dashboard/capture" className="btn-ghost btn-sm">
              <Waves size={14} /> Live Capture
            </Link>
            <button type="button" onClick={() => setShowForm((v) => !v)} className="btn-primary btn-sm">
              {showForm ? <X size={14} /> : <Plus size={14} />}
              {showForm ? 'Cancel' : 'Add device'}
            </button>
          </div>
        }
      />

      <SortableCardGrid pageKey="devices" cols="sm:grid-cols-2 lg:grid-cols-4" cards={[
        { id: 'total', label: 'Total devices', node: <StatCard label="Total devices" value={devices.length} sub="Registered and discovered" icon={Laptop} /> },
        { id: 'active', label: 'Active', node: <StatCard label="Active" value={counts.active} sub="Currently tracked" icon={Server} tone="green" /> },
        { id: 'discovered', label: 'Auto-discovered', node: <StatCard label="Auto-discovered" value={counts.discovered} sub="Seen by a sensor, unnamed" icon={Radio} tone="amber" /> },
        { id: 'risk', label: 'High risk', node: <StatCard label="High risk" value={counts.atRisk} sub="Risk score 70+" icon={Cpu} tone="red" /> },
      ]} />

      {showForm && (
        <SectionCard title="Add a device" description="Identify by MAC address, it stays constant even when the IP changes.">
          <form onSubmit={addDevice} className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="label" htmlFor="d-name">Device name</label>
              <input id="d-name" className="input" placeholder="Hans laptop" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="d-type">Device type</label>
              <select id="d-type" className="input" value={form.deviceType} onChange={(e) => setForm({ ...form, deviceType: e.target.value })}>
                {addableTypes.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="d-mac">MAC address</label>
              <input id="d-mac" className="input font-mono" placeholder="AA:BB:CC:DD:EE:FF" value={form.mac} onChange={(e) => setForm({ ...form, mac: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="d-ip">IP address</label>
              <input id="d-ip" className="input font-mono" placeholder="192.168.1.50" value={form.lastIp} onChange={(e) => setForm({ ...form, lastIp: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="d-host">Hostname</label>
              <input id="d-host" className="input font-mono" placeholder="hans-laptop" value={form.hostname} onChange={(e) => setForm({ ...form, hostname: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="d-owner">Owner</label>
              <input id="d-owner" className="input" placeholder="e.g. Samson" value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Add device
              </button>
            </div>
          </form>
        </SectionCard>
      )}

      <SectionCard
        title="Devices"
        description={loading ? 'loading…' : tagFilter ? `${shown.length} of ${devices.length} · tag “${tagFilter}”` : `${devices.length} total`}
        right={
          allTags.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setTagFilter(null)}
                className={cx('rounded-full px-2.5 py-1 text-[11px] font-semibold', !tagFilter ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
              >
                All
              </button>
              {allTags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTagFilter(t)}
                  className={cx('rounded-full px-2.5 py-1 text-[11px] font-semibold', tagFilter === t ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
                >
                  {t}
                </button>
              ))}
            </div>
          ) : undefined
        }
      >
        {error && <div className="px-5 py-3 text-sm text-red-700">{error}</div>}
        <TableWrap>
          <table className="table-base">
            <thead>
              <tr>
                <th>Device</th>
                <th>Owner</th>
                <th>MAC</th>
                <th>IP</th>
                <th>Status</th>
                <th>Risk</th>
                <th>Events</th>
                <th>Last seen</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-slate-400">
                    <Loader2 size={18} className="mx-auto animate-spin" />
                  </td>
                </tr>
              ) : shown.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-sm text-slate-400">
                    {tagFilter ? `No devices tagged “${tagFilter}”.` : 'No devices yet. Add one above, or connect a sensor and devices will appear as they are seen.'}
                  </td>
                </tr>
              ) : (
                shown.map((d) => {
                  const Icon = deviceIcons[d.deviceType] ?? Radio
                  return (
                    <tr key={d.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                            <Icon size={16} />
                          </span>
                          <div>
                            <Link to={`/dashboard/devices/${d.id}`} className="font-semibold text-slate-900 hover:text-brand-700">{d.name}</Link>
                            <p className="text-xs text-slate-500">
                              {d.deviceType}
                              {d.discovered && <span className="ml-1 text-amber-600">. discovered</span>}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="text-[13px] text-slate-600">{d.ownerName ?? <span className="text-slate-300">-</span>}</td>
                      <td className="font-mono text-[13px] text-slate-500">{d.mac ?? '—'}</td>
                      <td className="font-mono text-[13px]">{d.lastIp ?? '—'}</td>
                      <td>
                        <StatusPill tone={d.status === 'active' ? 'green' : 'slate'}>{d.status}</StatusPill>
                      </td>
                      <td>
                        <StatusPill tone={riskTone(d.riskScore)}>{d.riskScore}</StatusPill>
                      </td>
                      <td className="tabular-nums">{d.eventsCount.toLocaleString()}</td>
                      <td className="whitespace-nowrap text-slate-500">{timeAgo(d.lastSeenAt)}</td>
                      <td>
                        <button type="button" onClick={() => removeDevice(d)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Delete device ${d.name}`} title="Delete device">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </TableWrap>
      </SectionCard>

      <SectionCard
        title="Live activity"
        description="DNS lookups and connections your sensor reports, newest first, refreshing every 5s"
        right={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOnlyFlagged(false)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold ${!onlyFlagged ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setOnlyFlagged(true)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold ${onlyFlagged ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              Flagged
            </button>
          </div>
        }
      >
        <TableWrap>
          <table className="table-base">
            <thead>
              <tr>
                <th>Time</th>
                <th>Source</th>
                <th>Kind</th>
                <th>Domain / Destination</th>
                <th>Verdict</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">
                    No events yet. Run the sensor (resolver) with your token and browse on a device pointed at it, they
                    appear here within a few seconds.
                  </td>
                </tr>
              ) : (
                events.map((e) => (
                  <tr key={e.id}>
                    <td className="whitespace-nowrap text-slate-500">
                      {new Date(e.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="font-mono text-[12px] text-slate-600">
                      {e.deviceName ?? e.srcIp ?? '—'}
                    </td>
                    <td className="uppercase text-[11px] text-slate-500">{e.kind}</td>
                    <td className="max-w-xs truncate font-mono text-[12px] font-semibold text-slate-900">
                      {e.domain ?? e.dstIp ?? '—'}
                    </td>
                    <td>
                      <StatusPill tone={verdictTone[e.verdict]}>{e.verdict}</StatusPill>
                    </td>
                    <td className="whitespace-nowrap text-slate-500">
                      {[e.country, e.asnOrg].filter(Boolean).join(' · ') || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableWrap>
      </SectionCard>
    </div>
  )
}
