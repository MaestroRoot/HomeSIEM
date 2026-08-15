'use client'

import dynamic from 'next/dynamic'

// App nzima ya sasa (react-router + Firebase) ni SPA ya kawaida. Tunaiingiza
// kwa dynamic(ssr:false) ili Next isiiendeshe server-side kabisa — kwa hiyo
// hakuna hydration matatizo, localStorage/Firebase zinabaki za browser pekee.
const ClientApp = dynamic(() => import('@/next/ClientApp'), { 
  ssr: false,
  loading: () => (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          height: '32px',
          width: '32px',
          borderRadius: '50%',
          border: '2px solid #e2e8f0',
          borderTopColor: '#2563eb',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 12px',
        }} />
        <p style={{ fontSize: '14px', color: '#64748b' }}>Loading application…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
})

export default function ClientGate() {
  return <ClientApp />
}
