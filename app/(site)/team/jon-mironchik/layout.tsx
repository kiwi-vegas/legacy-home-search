export default function JonLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: `window.YLOPO_WIDGETS = {"domain": "jon.legacyhomesearch.com"};` }} />
      {children}
    </>
  )
}
