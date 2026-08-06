import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Logo from '@/components/Logo'

const UPDATED = '4 August 2026'
const CONTACT = 'maestrobusiness@aol.com'

interface Section {
  heading: string
  body: string[]
}

function LegalLayout({ title, sections }: { title: string; sections: Section[] }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="container-x flex h-16 items-center justify-between">
          <Link to="/"><Logo /></Link>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-brand-700">
            <ArrowLeft size={15} /> Back to home
          </Link>
        </div>
      </header>

      <main className="container-x max-w-3xl py-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {UPDATED}</p>

        <div className="mt-8 space-y-8">
          {sections.map((s) => (
            <section key={s.heading}>
              <h2 className="text-lg font-bold text-slate-900">{s.heading}</h2>
              {s.body.map((p, i) => (
                <p key={i} className="mt-2 text-[15px] leading-relaxed text-slate-600">{p}</p>
              ))}
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
          Questions about this policy? Contact us at{' '}
          <a href={`mailto:${CONTACT}`} className="font-semibold text-brand-700">{CONTACT}</a>.
        </div>

        <div className="mt-8 flex flex-wrap gap-4 text-sm text-slate-500">
          <Link to="/terms" className="hover:text-brand-700">Terms of Service</Link>
          <Link to="/privacy" className="hover:text-brand-700">Privacy Policy</Link>
          <Link to="/cookie" className="hover:text-brand-700">Cookie Policy</Link>
        </div>
      </main>
    </div>
  )
}

export function Terms() {
  return (
    <LegalLayout
      title="Terms of Service"
      sections={[
        { heading: '1. Acceptance of these terms', body: ['By creating an account or using HomeSIEM ("the Service"), you agree to these Terms of Service. If you do not agree, do not use the Service.'] },
        { heading: '2. What the Service is', body: ['HomeSIEM is a personal security monitoring platform (a home SIEM/SOC). It collects security telemetry from devices and sensors you set up — such as DNS lookups, network flows, logs and scan results — enriches it with geolocation and threat intelligence, and presents alerts and reports.'] },
        { heading: '3. Authorised use only', body: ['You may only monitor, capture traffic from, scan or collect data from networks, devices and systems that you own or are explicitly authorised to test. You are solely responsible for ensuring you have the legal right to monitor any device or network you connect to HomeSIEM. Using the Service to monitor or attack systems without authorisation is strictly prohibited and may be illegal.'] },
        { heading: '4. Your account', body: ['You are responsible for keeping your credentials and sensor tokens secure and for all activity under your account. Notify us immediately of any unauthorised use. Authentication is handled by Firebase Authentication.'] },
        { heading: '5. Acceptable use', body: ['You agree not to: use the Service to break into, disrupt or scan systems you do not control; interfere with the Service or its infrastructure; resell or misrepresent the Service; or use it to violate any applicable law.'] },
        { heading: '6. Plans, trials and payments', body: ['HomeSIEM offers a Free plan and paid plans (Home, Pro, Business). New accounts may receive a time-limited trial of a higher plan; when it ends without payment the account moves to the Free plan. Paid plans are billed in Tanzanian Shillings via the payment methods offered at checkout. Prices and features may change with notice.'] },
        { heading: '7. Data and privacy', body: ['Your use of the Service is also governed by our Privacy Policy and Cookie Policy, which explain what we collect and why.'] },
        { heading: '8. Disclaimers', body: ['The Service is provided "as is" without warranties of any kind. HomeSIEM is a monitoring aid, not a guarantee of security, and does not replace professional security assessment. Threat-intelligence verdicts are leads, not proof. Nothing in the Service constitutes legal or professional advice.'] },
        { heading: '9. Limitation of liability', body: ['To the maximum extent permitted by law, HomeSIEM and its operators are not liable for any indirect, incidental or consequential damages, or for any loss arising from your use of, or inability to use, the Service.'] },
        { heading: '10. Termination', body: ['You may stop using the Service and delete your account at any time. We may suspend or terminate access for breach of these terms.'] },
        { heading: '11. Changes', body: ['We may update these terms. Material changes will be communicated through the Service. Continued use after changes means you accept them.'] },
      ]}
    />
  )
}

export function Privacy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      sections={[
        { heading: '1. Overview', body: ['This policy explains what data HomeSIEM collects, how it is used, and who it is shared with. We collect only what is needed to provide the monitoring service.'] },
        { heading: '2. Information we collect', body: [
          'Account information: your name, email and authentication identifiers, handled through Firebase Authentication. We never store your password.',
          'Security telemetry from your sensors and agents: DNS lookups, network flow summaries, log entries, device identifiers (name, MAC, IP), vulnerability scan results and forensic snapshots (process and connection lists).',
          'Usage information needed to operate the platform, such as which workspace an event belongs to.',
        ] },
        { heading: '3. How we use your data', body: ['We use it to run the monitoring service: to detect and enrich events, generate alerts and reports, locate external IP addresses and check indicators against threat intelligence, and to secure and support your account.'] },
        { heading: '4. Third-party processors', body: [
          'To provide the Service we rely on: Firebase (authentication), Brevo (transactional email), AlienVault OTX (threat-intelligence lookups), MaxMind GeoLite2 (offline IP geolocation), and Groq (AI analysis of content you submit). Data shared with these providers is limited to what each function requires.',
          'We do not sell your data, and we do not use it for advertising.',
        ] },
        { heading: '5. Data retention', body: ['Event and log retention depends on your plan (Free: 1 day, Home: 7 days, Pro: 30 days, Business: 365 days). You can delete devices, findings and your account at any time.'] },
        { heading: '6. Your rights', body: ['You can access, export or delete your data through the dashboard, or by contacting us. Deleting your account removes your workspace data.'] },
        { heading: '7. Security', body: ['We use industry-standard measures to protect your data. Sensor tokens are stored only as hashes. However, no system is perfectly secure, and you are responsible for keeping your credentials and tokens safe.'] },
        { heading: '8. Children', body: ['The Service is not directed to children under 13, and we do not knowingly collect their data.'] },
        { heading: '9. Changes', body: ['We may update this policy and will communicate material changes through the Service.'] },
      ]}
    />
  )
}

export function Cookie() {
  return (
    <LegalLayout
      title="Cookie Policy"
      sections={[
        { heading: '1. About cookies and local storage', body: ['HomeSIEM uses a small number of cookies and browser local-storage entries. We do not use advertising or cross-site tracking cookies.'] },
        { heading: '2. Essential', body: ['Authentication and session data required to keep you signed in (managed by Firebase Authentication). Without these the Service cannot function.'] },
        { heading: '3. Preferences', body: ['We store some choices locally in your browser to improve your experience: your light/dark theme, whether you have seen the onboarding wizard, your saved and recent searches, and locally configured alert-routing preferences. These stay in your browser.'] },
        { heading: '4. Managing cookies', body: ['You can clear cookies and local storage through your browser settings. Clearing essential items will sign you out; clearing preferences will reset choices like your theme.'] },
        { heading: '5. Changes', body: ['We may update this policy and will communicate material changes through the Service.'] },
      ]}
    />
  )
}
