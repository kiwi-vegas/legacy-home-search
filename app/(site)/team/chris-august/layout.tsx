export default function ChrisLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: `window.YLOPO_WIDGETS = {"domain": "chris.legacyhomesearch.com"};` }} />
      {children}
    </>
  )
}
