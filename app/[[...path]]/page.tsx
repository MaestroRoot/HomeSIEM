import ClientGate from '@/next/ClientGate'

// Usiprerender page hii wakati wa build — inaruhusu ClientGate ku-load SPA
// browser-side pekee, na firebase haitawahi ku-ekelezwa kwenye server.
export const dynamic = 'force-dynamic'

export default function Page() {
  return <ClientGate />
}
