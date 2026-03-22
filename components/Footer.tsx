import Link from 'next/link'

export default function Footer() {
  return (
    <footer id="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div style={{ marginBottom: '12px' }}>
              <img src="/legacy-home-team-logo.png" alt="Legacy Home Team" style={{ height: 36, width: 'auto', filter: 'brightness(0) invert(1)' }} />
            </div>
            <p>Barry Jenkins and the Legacy Home Team help families buy and sell across Virginia Beach, Chesapeake, Norfolk, and all of Hampton Roads.</p>
          </div>
          <div className="footer-col">
            <h4>Navigate</h4>
            <Link href="/">Home</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/#contact">Contact</Link>
          </div>
          <div className="footer-col">
            <h4>Resources</h4>
            <Link href="/blog">Market Updates</Link>
            <Link href="/blog">Buying Tips</Link>
            <Link href="/blog">Selling Tips</Link>
          </div>
          <div className="footer-col">
            <h4>Connect</h4>
            <a href="tel:+17578164037">(757) 816-4037</a>
            <a href="mailto:barry@yourfriendlyagent.net">barry@yourfriendlyagent.net</a>
            <a href="https://maps.google.com/?q=1545+Crossways+Blvd+Suite+250+Chesapeake+VA+23320" target="_blank" rel="noopener noreferrer">1545 Crossways Blvd, Ste 250<br />Chesapeake, VA 23320</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} Legacy Home Team. All rights reserved.</span>
          <span>Virginia Beach &amp; Hampton Roads Real Estate</span>
        </div>
      </div>
    </footer>
  )
}
