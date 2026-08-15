import type { Metadata } from 'next'
import Script from 'next/script'
import '../src/index.css'

export const metadata: Metadata = {
  title: 'HomeSIEM',
  description: 'HomeSIEM watches the logs and network traffic of every device on your home network.',
  icons: { icon: '/shield.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div id="root">
          {children}
        </div>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-5SR74T88SH"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-5SR74T88SH');
          `}
        </Script>
      </body>
    </html>
  )
}
