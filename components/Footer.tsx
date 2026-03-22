import Link from 'next/link'

export default function Footer() {
  return (
    <footer id="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
              Legacy Home Search
            </div>
            <p>Your trusted real estate partner. We help buyers and sellers navigate the market with confidence.</p>
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
            <a href="mailto:hello@legacyhomesearch.com">Email Us</a>
            <a href="tel:+15551234567">Call Us</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} Legacy Home Search. All rights reserved.</span>
          <span>Real Estate Services</span>
        </div>
      </div>
    </footer>
  )
}
