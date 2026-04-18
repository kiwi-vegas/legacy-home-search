/**
 * Layout for Tanya Thompson's agent page.
 *
 * Why the inline <script> instead of next/script beforeInteractive:
 *   The root layout sets window.YLOPO_WIDGETS.domain = "search.buyingva.com"
 *   via a beforeInteractive Script (runs before body parsing).
 *   A page-level beforeInteractive Script does NOT reliably override it in
 *   Next.js App Router. An inline <script> in the <body> runs synchronously
 *   during HTML parsing — AFTER the head beforeInteractive scripts but
 *   BEFORE the afterInteractive YLOPO widget JS loads and reads the domain.
 *   This guarantees every YLOPO widget on this page points to Tanya's subdomain.
 */
export default function TanyaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Override YLOPO domain synchronously so widget JS picks up the correct value */}
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script
        dangerouslySetInnerHTML={{
          __html: `window.YLOPO_WIDGETS = {"domain": "tanya.legacyhomesearch.com"};`,
        }}
      />
      {children}
    </>
  )
}
