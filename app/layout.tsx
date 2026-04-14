import type { Metadata } from 'next'
import Script from 'next/script'
import YlopoInit from '@/components/YlopoInit'
import LocomotiveScrollInit from '@/components/LocomotiveScrollInit'
import './globals.css'

export const metadata: Metadata = {
  title: 'Legacy Home Search | Real Estate',
  description: 'Legacy Home Search — your trusted partner for buying and selling real estate. Expert guidance, local market knowledge, and dedicated service.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
        <LocomotiveScrollInit />
        <YlopoInit />
        <Script id="ylopo-config" strategy="beforeInteractive">
          {`window.YLOPO_WIDGETS = {"domain": "search.buyingva.com"}`}
        </Script>
        <Script
          src="https://search.buyingva.com/build/js/widgets-1.0.0.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
