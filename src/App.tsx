import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import NotFound from './pages/NotFound'
import { Terms, Privacy, Cookie } from './pages/Legal'
import CookieConsent from './components/CookieConsent'

import DashboardLayout from './components/dashboard/DashboardLayout'
import Overview from './pages/dashboard/Overview'
import Agents from './pages/dashboard/Agents'
import Devices from './pages/dashboard/Devices'
import LogCollection from './pages/dashboard/LogCollection'
import LiveCapture from './pages/dashboard/LiveCapture'
import PcapUpload from './pages/dashboard/PcapUpload'
import AiPacketAnalysis from './pages/dashboard/AiPacketAnalysis'
import ThreatDetection from './pages/dashboard/ThreatDetection'
import AiLogAnalyzer from './pages/dashboard/AiLogAnalyzer'
import IocScanner from './pages/dashboard/IocScanner'
import Alerts from './pages/dashboard/Alerts'
import Timeline from './pages/dashboard/Timeline'
import SearchModule from './pages/dashboard/SearchModule'
import Incidents from './pages/dashboard/Incidents'
import Assistant from './pages/dashboard/Assistant'
import Reports from './pages/dashboard/Reports'
import ThreatIntel from './pages/dashboard/ThreatIntel'
import RuleEngine from './pages/dashboard/RuleEngine'
import AiRuleGenerator from './pages/dashboard/AiRuleGenerator'
import Visualization from './pages/dashboard/Visualization'
import Inventory from './pages/dashboard/Inventory'
import Vulnerabilities from './pages/dashboard/Vulnerabilities'
import Forensics from './pages/dashboard/Forensics'
import Investigation from './pages/dashboard/Investigation'
import SecurityScore from './pages/dashboard/SecurityScore'
import Account from './pages/dashboard/Account'
import Subscriptions from './pages/dashboard/Subscriptions'
import {
  AlertIntegrations,
  AttackChain,
  Compliance,
  Coverage,
  DeviceDetail,
  GeoMap,
  LogParsers,
  NetworkGraph,
  Runbooks,
} from './pages/dashboard/AdvancedViews'

/** Scroll to top on navigation, but leave in-page hash links alone. */
function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/cookie" element={<Cookie />} />

        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Overview />} />
          <Route path="agents" element={<Agents />} />
          <Route path="devices" element={<Devices />} />
          <Route path="devices/:id" element={<DeviceDetail />} />
          <Route path="logs" element={<LogCollection />} />
          <Route path="logs/parsers" element={<LogParsers />} />
          <Route path="capture" element={<LiveCapture />} />
          <Route path="pcap" element={<PcapUpload />} />
          <Route path="ai-packets" element={<AiPacketAnalysis />} />
          <Route path="detection" element={<ThreatDetection />} />
          <Route path="ai-logs" element={<AiLogAnalyzer />} />
          <Route path="ioc" element={<IocScanner />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="alerts/integrations" element={<AlertIntegrations />} />
          <Route path="timeline" element={<Timeline />} />
          <Route path="search" element={<SearchModule />} />
          <Route path="incidents" element={<Incidents />} />
          <Route path="runbooks" element={<Runbooks />} />
          <Route path="assistant" element={<Assistant />} />
          <Route path="reports" element={<Reports />} />
          <Route path="intel" element={<ThreatIntel />} />
          <Route path="rules" element={<RuleEngine />} />
          <Route path="ai-rules" element={<AiRuleGenerator />} />
          <Route path="visualization" element={<Visualization />} />
          <Route path="network-graph" element={<NetworkGraph />} />
          <Route path="attack-chain" element={<AttackChain />} />
          <Route path="geo-map" element={<GeoMap />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="vulnerabilities" element={<Vulnerabilities />} />
          <Route path="forensics" element={<Forensics />} />
          <Route path="investigation" element={<Investigation />} />
          <Route path="score" element={<SecurityScore />} />
          <Route path="compliance" element={<Compliance />} />
          <Route path="coverage" element={<Coverage />} />
          <Route path="account" element={<Account />} />
          <Route path="subscriptions" element={<Subscriptions />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      <CookieConsent />
    </>
  )
}
