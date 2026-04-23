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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap" rel="stylesheet" />
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
        <Script id="clarity-init" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "we7087qh1c");`}
        </Script>
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  )
}
