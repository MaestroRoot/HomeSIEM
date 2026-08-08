import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'

import Landing from './views/Landing'
import AboutPage from './views/About'
import ServicesPage from './views/Services'
import PricingPage from './views/Pricing'
import HowItWorksPage from './views/HowItWorks'
import AudiencePage from './views/Audience'
import ContactPage from './views/Contact'
import Login from './views/Login'
import Signup from './views/Signup'
import ForgotPassword from './views/ForgotPassword'
import NotFound from './views/NotFound'
import { Terms, Privacy, Cookie } from './views/Legal'
import CookieConsent from './components/CookieConsent'

import DashboardLayout from './components/dashboard/DashboardLayout'
import Overview from './views/dashboard/Overview'
import Agents from './views/dashboard/Agents'
import Devices from './views/dashboard/Devices'
import LogCollection from './views/dashboard/LogCollection'
import LiveCapture from './views/dashboard/LiveCapture'
import PcapUpload from './views/dashboard/PcapUpload'
import ThreatDetection from './views/dashboard/ThreatDetection'
import AiLogAnalyzer from './views/dashboard/AiLogAnalyzer'
import IocScanner from './views/dashboard/IocScanner'
import Alerts from './views/dashboard/Alerts'
import Timeline from './views/dashboard/Timeline'
import SearchModule from './views/dashboard/SearchModule'
import Incidents from './views/dashboard/Incidents'
import Assistant from './views/dashboard/Assistant'
import Reports from './views/dashboard/Reports'
import ThreatIntel from './views/dashboard/ThreatIntel'
import RuleEngine from './views/dashboard/RuleEngine'
import AiRuleGenerator from './views/dashboard/AiRuleGenerator'
import Visualization from './views/dashboard/Visualization'
import Inventory from './views/dashboard/Inventory'
import Vulnerabilities from './views/dashboard/Vulnerabilities'
import Forensics from './views/dashboard/Forensics'
import Investigation from './views/dashboard/Investigation'
import SecurityScore from './views/dashboard/SecurityScore'
import Ueba from './views/dashboard/Ueba'
import Account from './views/dashboard/Account'
import Subscriptions from './views/dashboard/Subscriptions'
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
} from './views/dashboard/AdvancedViews'

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
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/who-it-is-for" element={<AudiencePage />} />
        <Route path="/contact" element={<ContactPage />} />
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
          <Route path="ueba" element={<Ueba />} />
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
