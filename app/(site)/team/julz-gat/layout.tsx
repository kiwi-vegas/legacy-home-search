export default function JulzLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: `window.YLOPO_WIDGETS = {"domain": "julz.legacyhomesearch.com"};` }} />
      {children}
    </>
  )
}
