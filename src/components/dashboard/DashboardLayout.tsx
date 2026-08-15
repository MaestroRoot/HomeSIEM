import { Component, useEffect, useState } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import PlanGate from './PlanGate'
import { useAuth } from '@/context/AuthContext'
import { SubscriptionProvider } from '@/context/SubscriptionContext'
import { CollectorProvider } from '@/context/CollectorContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { CustomizeProvider } from '@/context/CustomizeContext'
import { CommandPalette, KeyboardHelp } from './CommandPalette'
import Onboarding from './Onboarding'

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/agents': 'Install Sensor',
  '/dashboard/devices': 'Devices',
  '/dashboard/logs': 'Log Collection',
  '/dashboard/capture': 'Live Capture',
  '/dashboard/pcap': 'Packet Inspector',
  '/dashboard/ai-packets': 'Packet Analysis',
  '/dashboard/detection': 'Threat Detection',
  '/dashboard/ai-logs': 'Log Explorer',
  '/dashboard/ioc': 'IOC Scanner',
  '/dashboard/alerts': 'Alerts',
  '/dashboard/timeline': 'Timeline',
  '/dashboard/search': 'Search',
  '/dashboard/incidents': 'Incidents',
  '/dashboard/assistant': 'Assistant',
  '/dashboard/reports': 'Reports',
  '/dashboard/intel': 'Threat Intelligence',
  '/dashboard/rules': 'Rule Engine',
  '/dashboard/ai-rules': 'Custom Rules',
  '/dashboard/visualization': 'Visualization',
  '/dashboard/inventory': 'Network Inventory',
  '/dashboard/vulnerabilities': 'Vulnerabilities',
  '/dashboard/forensics': 'Forensics',
  '/dashboard/investigation': 'Investigation',
  '/dashboard/score': 'Security Score',
  '/dashboard/compliance': 'Compliance Center',
  '/dashboard/runbooks': 'Runbooks',
  '/dashboard/logs/parsers': 'Log Parsers',
  '/dashboard/alerts/integrations': 'Alert Integrations',
  '/dashboard/network-graph': 'Network Graph',
  '/dashboard/attack-chain': 'Attack Chain',
  '/dashboard/geo-map': 'Geo Threat Map',
  '/dashboard/coverage': 'Detection Coverage',
  '/dashboard/account': 'Account',
  '/dashboard/subscriptions': 'Subscriptions',
}

class PageErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('[PageErrorBoundary]', error, info.componentStack) }
  render() {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <div className="grid place-items-center rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/40 dark:bg-red-950/30">
            <AlertTriangle size={28} className="mb-3 text-red-500" />
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">Something went wrong</p>
            <p className="mt-1 text-xs text-red-500 dark:text-red-400/70">{this.state.error.message}</p>
            <button
              type="button"
              onClick={() => { this.setState({ error: null }); window.location.reload() }}
              className="btn-soft btn-sm mt-4"
            >
              <RefreshCw size={14} /> Reload page
            </button>
          </div>
        )
      )
    }
    return this.props.children
  }
}

class WizardBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false }
  static getDerivedStateFromError() { return { error: true } }
  componentDidCatch(error: Error) { console.error('[WizardBoundary]', error) }
  render() {
    if (this.state.error) return null
    return this.props.children
  }
}

function TitleUpdater() {
  const { pathname } = useLocation()
  useEffect(() => {
    // Check exact match first, then prefix match for sub-routes
    const title = routeTitles[pathname]
      || Object.entries(routeTitles).find(([k]) => pathname.startsWith(k + '/'))?.[1]
      || 'HomeSIEM'
    document.title = `${title} · HomeSIEM`
  }, [pathname])
  return null
}

export default function DashboardLayout() {
  const { user, loading } = useAuth()
  const [navOpen, setNavOpen] = useState(false)
  const location = useLocation()

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-white dark:bg-[#0e0e0e]">
        <div className="flex flex-col items-center gap-3">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
          <p className="text-sm text-slate-500">Loading your Home SOC…</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />

  return (
    <ThemeProvider>
      <SubscriptionProvider>
        <CollectorProvider>
          <TitleUpdater />
          <DashboardShell navOpen={navOpen} setNavOpen={setNavOpen} />
        </CollectorProvider>
      </SubscriptionProvider>
    </ThemeProvider>
  )
}

function DashboardShell({
  navOpen,
  setNavOpen,
}: {
  navOpen: boolean
  setNavOpen: (open: boolean) => void
}) {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [onboard, setOnboard] = useState(() => !localStorage.getItem('homesiem-onboarded'))

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen(true)
      }
      if (event.key === '?' && !(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)) setHelpOpen(true)
      if (event.key === 'Escape') {
        setPaletteOpen(false)
        setHelpOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="lg:pl-[248px]">
        <Topbar onMenu={() => setNavOpen(true)} onCommand={() => setPaletteOpen(true)} onHelp={() => setHelpOpen(true)} />
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <PageErrorBoundary>
            <PlanGate>
              <CustomizeProvider>
                <Outlet />
              </CustomizeProvider>
            </PlanGate>
          </PageErrorBoundary>
        </main>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onHelp={() => { setPaletteOpen(false); setHelpOpen(true) }} />
      <KeyboardHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
      <WizardBoundary>
        <Onboarding open={onboard} onClose={() => { localStorage.setItem('homesiem-onboarded', '1'); setOnboard(false) }} />
      </WizardBoundary>
    </div>
  )
}
