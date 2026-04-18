export default function MattLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: `window.YLOPO_WIDGETS = {"domain": "matt.legacyhomesearch.com"};` }} />
      {children}
    </>
  )
}
