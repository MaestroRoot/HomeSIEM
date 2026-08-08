'use client'

import dynamic from 'next/dynamic'

// App nzima ya sasa (react-router + Firebase) ni SPA ya kawaida. Tunaiingiza
// kwa dynamic(ssr:false) ili Next isiiendeshe server-side kabisa — kwa hiyo
// hakuna hydration matatizo, localStorage/Firebase zinabaki za browser pekee.
const ClientApp = dynamic(() => import('@/next/ClientApp'), { ssr: false })

export default function ClientGate() {
  return <ClientApp />
}
