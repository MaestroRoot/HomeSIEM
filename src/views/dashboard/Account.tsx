import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Copy, Eye, EyeOff, KeyRound, Loader2, Phone, Plus, ShieldCheck, Trash2, UserCog } from 'lucide-react'
import { PageHeader, SectionCard, StatCard, StatusPill, TableWrap, cx } from '@/components/ui'
import SortableCardGrid from '@/components/dashboard/SortableCards'
import { useAuth } from '@/context/AuthContext'
import type { Role } from '@/context/AuthContext'
import { api } from '@/lib/api'

const roleMatrix: { role: Role; label: string; can: string[] }[] = [
  {
    role: 'owner',
    label: 'Owner',
    can: ['Full access to every module', 'Add and remove devices', 'Issue and revoke API keys', 'Manage members and roles', 'Isolate hosts and block IPs'],
  },
  {
    role: 'analyst',
    label: 'Analyst',
    can: ['View and triage all alerts', 'Create and update incidents', 'Run scans and captures', 'Generate reports', 'Cannot manage members or billing'],
  },
  {
    role: 'viewer',
    label: 'Viewer',
    can: ['Read-only dashboard access', 'View alerts and reports', 'Cannot take response actions', 'Cannot change configuration'],
  },
]

interface ApiKeyRow {
  id: string
  name: string
  key: string
  scope: string
  created: string
  lastUsed: string
}

const seedKeys: ApiKeyRow[] = []


export default function Account() {
  const { user, updateUser } = useAuth()
  const [memberCount, setMemberCount] = useState<number | null>(null)
  const [keys, setKeys] = useState(seedKeys)
  const [revealed, setRevealed] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [newKeyName, setNewKeyName] = useState('')

  // Jina na simu huhifadhiwa kwenye state ya ndani; PATCH inapigwa mtu akibonyeza
  // Save, sio kila herufi anayoandika.
  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [saving, setSaving] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [saved, setSaved] = useState(false)

  // MFA state
  const [mfaBusy, setMfaBusy] = useState(false)
  const [mfaOtpSent, setMfaOtpSent] = useState(false)
  const [mfaTempToken, setMfaTempToken] = useState<string | null>(null)
  const [mfaOtpCode, setMfaOtpCode] = useState('')
  const [mfaOtpError, setMfaOtpError] = useState('')
  const [mfaOtpVerifying, setMfaOtpVerifying] = useState(false)
  const [mfaPendingAction, setMfaPendingAction] = useState<'enable' | 'disable' | null>(null)

  useEffect(() => {
    setName(user?.name ?? '')
    setPhone(user?.phone ?? '')
  }, [user?.name, user?.phone])

  async function saveProfile() {
    if (name.trim().length < 2) return setProfileError('A name needs at least 2 characters.')
    setProfileError('')
    setSaving(true)
    try {
      await updateUser({ name: name.trim(), phone: phone.trim() || null })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Could not save that.')
    } finally {
      setSaving(false)
    }
  }

  async function requestMfaOtp(action: 'enable' | 'disable') {
    setProfileError('')
    setMfaOtpError('')
    setMfaPendingAction(action)
    setMfaBusy(true)
    try {
      const result = await api.post<{ tempToken: string; expiresInMinutes: number }>('/auth/mfa/request-otp', { action })
      setMfaTempToken(result.tempToken)
      setMfaOtpSent(true)
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Could not send verification code.')
      setMfaBusy(false)
      setMfaPendingAction(null)
    }
  }

  async function verifyMfaOtp(e: React.FormEvent) {
    e.preventDefault()
    if (mfaOtpCode.length !== 6 || !mfaTempToken) return setMfaOtpError('Enter the 6-digit code.')
    setMfaOtpError('')
    setMfaOtpVerifying(true)
    try {
      await api.post('/auth/mfa/verify-toggle', {
        tempToken: mfaTempToken,
        code: mfaOtpCode,
        action: mfaPendingAction,
      })
      await updateUser({ mfaEnabled: mfaPendingAction === 'enable' })
      setMfaOtpSent(false)
      setMfaOtpCode('')
      setMfaTempToken(null)
      setMfaPendingAction(null)
    } catch (err) {
      setMfaOtpError(err instanceof Error ? err.message : 'Verification failed.')
    } finally {
      setMfaOtpVerifying(false)
      setMfaBusy(false)
    }
  }

  function cancelMfaOtp() {
    setMfaOtpSent(false)
    setMfaOtpCode('')
    setMfaOtpError('')
    setMfaTempToken(null)
    setMfaPendingAction(null)
    setMfaBusy(false)
  }

  function createKey(e: React.FormEvent) {
    e.preventDefault()
    if (!newKeyName.trim()) return
    const rand = Array.from({ length: 24 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')
    setKeys((k) => [
      { id: 'k' + Date.now(), name: newKeyName.trim(), key: 'mdd_live_' + rand, created: new Date().toISOString().slice(0, 10), lastUsed: 'never', scope: 'read:all' },
      ...k,
    ])
    setNewKeyName('')
  }

  function copy(k: string, id: string) {
    navigator.clipboard?.writeText(k)
    setCopied(id)
    setTimeout(() => setCopied(null), 1600)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={KeyRound}
        title="Authentication & Access"
        subtitle="Multi-factor authentication, role management and API keys for your own collectors and integrations."
      />

      <SortableCardGrid
        pageKey="account.kpis"
        cols="sm:grid-cols-2 lg:grid-cols-4"
        maxCols={4}
        cards={[
          { id: 'role', label: 'Account role', node: <StatCard label="Account role" value={user?.role ?? 'owner'} sub="Full platform access" icon={UserCog} /> },
          { id: 'mfa', label: 'MFA', node: <StatCard label="MFA" value={user?.mfaEnabled ? 'Enabled' : 'Disabled'} sub="TOTP authenticator" icon={ShieldCheck} tone={user?.mfaEnabled ? 'green' : 'red'} /> },
          { id: 'api-keys', label: 'API keys', node: <StatCard label="API keys" value={keys.length} sub="Active credentials" icon={KeyRound} /> },
          { id: 'members', label: 'Members', node: <StatCard label="Members" value={memberCount ?? '…'} sub="With platform access" icon={UserCog} tone="slate" /> },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Profile" description="Your account details">
          <div className="space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="p-name">
                  Full name
                </label>
                <input
                  id="p-name"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="label" htmlFor="p-email">
                  Email
                </label>
                <input id="p-email" className="input" value={user?.email ?? ''} readOnly />
                <p className="mt-1 text-[11px] text-slate-400">
                  Your email is managed by Firebase, not here.
                </p>
              </div>
            </div>

            <div>
              <label className="label" htmlFor="p-phone">
                Phone number
              </label>
              <div className="relative">
                <Phone size={16} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  id="p-phone"
                  type="tel"
                  className="input pl-10"
                  placeholder="+255 712 345 678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Used for security notifications and SMS alerts.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={saveProfile}
                disabled={saving || (name.trim() === (user?.name ?? '') && (phone.trim() || '') === (user?.phone ?? ''))}
                className="btn-primary btn-sm"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              {saved && <span className="text-xs font-semibold text-emerald-600">Saved</span>}
              {profileError && <span className="text-xs font-semibold text-red-600">{profileError}</span>}
            </div>
            <div className="rounded-lg border border-slate-200 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Plan</p>
                  <p className="text-xs text-slate-500">
                    Change it on the{' '}
                    <Link to="/dashboard/subscriptions" className="font-semibold text-brand-600">
                      Subscriptions
                    </Link>{' '}
                    page
                  </p>
                </div>
                <StatusPill tone="blue">{user?.plan}</StatusPill>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Multi-factor authentication" description="Email-based verification code at sign-in">
          <div className="p-5">
            {mfaOtpSent ? (
              <form onSubmit={verifyMfaOtp} className="space-y-4">
                <div className="flex items-start gap-2.5 rounded-lg border border-brand-200 bg-brand-50 px-3.5 py-3 text-sm text-brand-700">
                  <ShieldCheck size={16} className="mt-0.5 shrink-0" />
                  <span>
                    A 6-digit code was sent to <strong>{user?.email}</strong>.
                    Enter it below to {mfaPendingAction === 'enable' ? 'enable' : 'disable'} MFA.
                  </span>
                </div>

                {mfaOtpError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
                    {mfaOtpError}
                  </div>
                )}

                <div>
                  <label className="label" htmlFor="mfa-otp-code">
                    Verification code
                  </label>
                  <input
                    id="mfa-otp-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className="input text-center tracking-[0.4em] font-mono text-lg"
                    placeholder="000000"
                    maxLength={6}
                    value={mfaOtpCode}
                    onChange={(e) => setMfaOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    autoFocus
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button type="submit" className="btn-primary btn-sm" disabled={mfaOtpVerifying}>
                    {mfaOtpVerifying && <Loader2 size={14} className="animate-spin" />}
                    {mfaOtpVerifying ? 'Verifying…' : 'Verify & confirm'}
                  </button>
                  <button type="button" onClick={cancelMfaOtp} className="btn-ghost btn-sm">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 px-4 py-3.5">
                <div className="flex gap-3">
                  <span
                    className={cx(
                      'grid h-10 w-10 shrink-0 place-items-center rounded-lg',
                      user?.mfaEnabled ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600',
                    )}
                  >
                    <ShieldCheck size={19} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Email verification code</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {user?.mfaEnabled
                        ? 'Enabled. A 6-digit code is sent to your email at every sign-in.'
                        : 'Disabled. Your account can be accessed with a password alone.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => requestMfaOtp(user?.mfaEnabled ? 'disable' : 'enable')}
                  disabled={mfaBusy}
                  className={cx('btn-sm shrink-0', user?.mfaEnabled ? 'btn-ghost' : 'btn-primary')}
                >
                  {mfaBusy ? 'Sending…' : user?.mfaEnabled ? 'Disable' : 'Enable MFA'}
                </button>
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="API keys" description="For your own collectors, scripts and integrations">
        <form onSubmit={createKey} className="flex flex-col gap-2 border-b border-slate-100 p-5 sm:flex-row">
          <input
            className="input"
            placeholder="Key name, e.g. Raspberry Pi collector"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
          />
          <button type="submit" className="btn-primary shrink-0">
            <Plus size={15} /> Create key
          </button>
        </form>

        <TableWrap>
          <table className="table-base">
            <thead>
              <tr>
                <th>Name</th>
                <th>Key</th>
                <th>Scope</th>
                <th>Created</th>
                <th>Last used</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id}>
                  <td className="font-semibold text-slate-900">{k.name}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[12px] text-slate-600">
                        {revealed === k.id ? k.key : k.key.slice(0, 9) + '•'.repeat(16)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setRevealed(revealed === k.id ? null : k.id)}
                        className="text-slate-400 hover:text-brand-600"
                        aria-label={revealed === k.id ? 'Hide key' : 'Reveal key'}
                      >
                        {revealed === k.id ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => copy(k.key, k.id)}
                        className="text-slate-400 hover:text-brand-600"
                        aria-label="Copy key"
                      >
                        <Copy size={14} />
                      </button>
                      {copied === k.id && <span className="text-[11px] font-semibold text-emerald-600">copied</span>}
                    </div>
                  </td>
                  <td>
                    <span className="rounded bg-brand-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-brand-700">
                      {k.scope}
                    </span>
                  </td>
                  <td className="text-slate-500">{k.created}</td>
                  <td className="text-slate-500">{k.lastUsed}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => setKeys((ks) => ks.filter((x) => x.id !== k.id))}
                      className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
                    >
                      <Trash2 size={12} /> Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <Members onCount={setMemberCount} />

        <SectionCard title="Role permissions" description="What each role can do">
          <div className="space-y-4 p-5">
            {roleMatrix.map((r) => (
              <div key={r.role} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center gap-2">
                  <StatusPill tone={r.role === 'owner' ? 'blue' : r.role === 'analyst' ? 'green' : 'slate'}>
                    {r.label}
                  </StatusPill>
                </div>
                <ul className="mt-2.5 space-y-1.5">
                  {r.can.map((c) => (
                    <li key={c} className="flex gap-2 text-xs text-slate-600">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-500" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  )
}

/* ---------- members and invitations, straight from the API ---------- */

interface ApiMember {
  id: string
  name: string
  email: string
  role: Role
  mfaEnabled: boolean
  createdAt: string
}

interface ApiInvitation {
  id: string
  email: string
  role: Role
  status: 'pending' | 'accepted' | 'revoked' | 'expired'
  emailSent: boolean
  createdAt: string
  invitedByName: string | null
}

function Members({ onCount }: { onCount: (total: number) => void }) {
  const { user } = useAuth()
  const isOwner = user?.role === 'owner'

  const [members, setMembers] = useState<ApiMember[]>([])
  const [invites, setInvites] = useState<ApiInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<Role>('viewer')
  const [inviting, setInviting] = useState(false)
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const [people, pending] = await Promise.all([
        api.get<{ items: ApiMember[]; total: number }>('/users'),
        api.get<{ items: ApiInvitation[]; total: number }>('/invitations'),
      ])
      setMembers(people.items)
      setInvites(pending.items.filter((i) => i.status === 'pending'))
      onCount(people.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the member list.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function sendInvite(event: React.FormEvent) {
    event.preventDefault()
    if (!inviteEmail.includes('@')) return setError('Enter a valid email address.')

    setError('')
    setNotice('')
    setInviting(true)
    try {
      const created = await api.post<ApiInvitation>('/invitations', {
        email: inviteEmail.trim(),
        role: inviteRole,
      })
      setNotice(
        created.emailSent
          ? `Invitation emailed to ${created.email}.`
          : `Invitation created for ${created.email}, but the email did not go out. Check the Brevo settings.`,
      )
      setInviteEmail('')
      setInviteOpen(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send that invitation.')
    } finally {
      setInviting(false)
    }
  }

  async function revoke(id: string) {
    setError('')
    try {
      await api.post(`/invitations/${id}/revoke`)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not cancel that invitation.')
    }
  }

  return (
    <SectionCard title="Members" description="People with access to this workspace">
      {error && (
        <p className="border-b border-red-100 bg-red-50 px-5 py-2.5 text-xs font-semibold text-red-700">
          {error}
        </p>
      )}
      {notice && (
        <p className="border-b border-emerald-100 bg-emerald-50 px-5 py-2.5 text-xs font-semibold text-emerald-700">
          {notice}
        </p>
      )}

      {loading ? (
        <p className="px-5 py-10 text-center text-sm text-slate-500">Loading members…</p>
      ) : (
        <TableWrap>
          <table className="table-base">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>MFA</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>
                    <p className="font-semibold text-slate-900">
                      {m.name}
                      {m.id === user?.id && <span className="ml-1.5 text-xs text-slate-400">(you)</span>}
                    </p>
                    <p className="text-xs text-slate-500">{m.email}</p>
                  </td>
                  <td>
                    <StatusPill tone={m.role === 'owner' ? 'blue' : m.role === 'analyst' ? 'green' : 'slate'}>
                      {m.role}
                    </StatusPill>
                  </td>
                  <td>
                    <StatusPill tone={m.mfaEnabled ? 'green' : 'red'}>
                      {m.mfaEnabled ? 'on' : 'off'}
                    </StatusPill>
                  </td>
                  <td className="text-slate-500">{new Date(m.createdAt).toLocaleDateString('en-GB')}</td>
                </tr>
              ))}

              {invites.map((i) => (
                <tr key={i.id} className="bg-amber-50/40">
                  <td>
                    <p className="font-semibold text-slate-700">{i.email}</p>
                    <p className="text-xs text-slate-500">
                      Invited{i.invitedByName ? ` by ${i.invitedByName}` : ''}
                      {i.emailSent ? '' : ', email not delivered'}
                    </p>
                  </td>
                  <td>
                    <StatusPill tone="slate">{i.role}</StatusPill>
                  </td>
                  <td>
                    <StatusPill tone="amber">invited</StatusPill>
                  </td>
                  <td>
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => void revoke(i.id)}
                        className="text-xs font-semibold text-red-600 hover:text-red-800"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}

      <div className="border-t border-slate-100 p-4">
        {!isOwner ? (
          <p className="text-center text-xs text-slate-500">Only an owner can invite people.</p>
        ) : inviteOpen ? (
          <form onSubmit={sendInvite} className="space-y-2.5">
            <input
              type="email"
              className="input"
              placeholder="teammate@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <select
                className="input"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as Role)}
              >
                <option value="viewer">Viewer</option>
                <option value="analyst">Analyst</option>
                <option value="owner">Owner</option>
              </select>
              <button type="submit" className="btn-primary shrink-0" disabled={inviting}>
                {inviting ? 'Sending…' : 'Send invite'}
              </button>
              <button
                type="button"
                onClick={() => setInviteOpen(false)}
                className="btn-ghost shrink-0"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => {
              setInviteOpen(true)
              setNotice('')
            }}
            className="btn-ghost w-full btn-sm"
          >
            <Plus size={13} /> Invite a member
          </button>
        )}
      </div>
    </SectionCard>
  )
}

