export default function BarryLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: `window.YLOPO_WIDGETS = {"domain": "listings.legacyhomesearch.com"};` }} />
      {children}
    </>
  )
}
