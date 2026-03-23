import type { Metadata } from 'next'
import Link from 'next/link'
import CommunityFAQ from '@/components/CommunityFAQ'
import CommunityMapWrapper from '@/components/CommunityMapWrapper'

export const metadata: Metadata = {
  title: 'Newport News Homes For Sale | Legacy Home Team',
  description: 'Search Newport News VA homes for sale. Diverse housing, strong value, Port Warwick, and Peninsula living — Barry Jenkins and the Legacy Home Team. Call (757) 816-4037.',
}

const stats = [
  ['Population', '185,000+'],
  ['Median Home Price', '$255,000', 'accent'],
  ['Avg. Days on Market', '30'],
  ['Major Employer', 'Newport News Shipbuilding'],
  ['School Districts', 'Newport News Public Schools'],
  ['Notable Area', 'Port Warwick Village'],
  ['Military Bases', 'Fort Eustis · Langley AFB (Hampton)'],
  ['Distance to Hampton', '~15 min'],
  ['Distance to Norfolk', '~35 min via HRBT'],
  ['Distance to Williamsburg', '~30 min'],
]

const neighborhoods = [
  { name: 'Port Warwick', type: 'Walkable · New Urbanism', desc: 'Newport News\'s most distinctive neighborhood — a new urbanist development with walkable streets, independent restaurants, townhomes, condos, and single-family homes centered around a town square with arts programming.', price: 'From $350K' },
  { name: 'Kiln Creek', type: 'Suburban · Golf Course', desc: 'A well-established planned community in the northern part of Newport News with a golf course, neighborhood pools, and a variety of single-family homes popular with families and professionals.', price: 'From $300K' },
  { name: 'Hilton Village', type: 'Historic · Walkable', desc: 'A National Historic Landmark — one of the first planned industrial communities in America, built in 1918 for shipyard workers. Charming English cottage-style homes on tree-lined streets with a lively village commercial district.', price: 'From $280K' },
  { name: 'Denbigh', type: 'Suburban · Central', desc: 'The most populous area of Newport News — a diverse, well-established suburban community with a wide range of housing types, excellent access to I-64, and strong community services and schools.', price: 'From $220K' },
  { name: 'Oyster Point', type: 'Commercial · Professional', desc: 'The commercial heart of northern Newport News, with major office parks, medical facilities, retail centers, and nearby residential neighborhoods popular with professionals who want to minimize their commute.', price: 'From $260K' },
  { name: 'Morrison / Lake Kiln', type: 'Established · Waterfront', desc: 'Established neighborhoods near Lake Kiln offering solid value, mature landscaping, and a quiet suburban feel in the heart of Newport News. Popular with military families stationed at Fort Eustis.', price: 'From $235K' },
  { name: 'Beechwood', type: 'Affordable · Diverse', desc: 'An affordable, diverse neighborhood in central Newport News close to Riverside Regional Medical Center and Christopher Newport University — good entry-level value with convenient city access.', price: 'From $185K' },
  { name: 'Richneck', type: 'Central · Value', desc: 'A centrally located neighborhood offering affordable entry-level homes and easy access to major employers. Popular with first-time buyers and military families seeking maximum purchasing power on the Peninsula.', price: 'From $180K' },
  { name: 'Warwick', type: 'Established · Mixed', desc: 'The historic core of the original City of Warwick (merged with Newport News in 1958) — a mix of mid-century homes, small businesses, and community character with easy Warwick Boulevard corridor access.', price: 'From $210K' },
]

const highlights = [
  { icon: '⚓', title: 'Newport News Shipbuilding', body: "Huntington Ingalls Industries' Newport News Shipbuilding is one of the largest employers in Virginia — building nuclear aircraft carriers and submarines. Its economic gravity keeps the entire Peninsula market stable and demand consistent." },
  { icon: '🏘️', title: 'Most Affordable Peninsula Market', body: 'Newport News consistently offers the most affordable home prices on the Virginia Peninsula, with entry-level homes starting under $200K. For buyers who want Peninsula access without Hampton or Williamsburg prices, this is the value play.' },
  { icon: '🏛️', title: 'Hilton Village — National Historic Landmark', body: 'Hilton Village is one of only a handful of planned worker communities in America designated as a National Historic Landmark. The English cottage-style architecture, walkable streets, and village commercial area make it genuinely special.' },
  { icon: '🏌️', title: 'Port Warwick New Urbanism', body: 'Port Warwick is unlike any other neighborhood in Hampton Roads — a true new urbanist community with walkable streets, a town square, independent restaurants, arts programming, and residential types from studios to single-family homes.' },
  { icon: '🎓', title: 'Christopher Newport University', body: 'CNU brings a significant university presence to Newport News, supporting local restaurants, arts programming (Ferguson Center for the Arts), and consistent housing demand in the neighborhoods surrounding campus.' },
  { icon: '🚗', title: 'I-64 Peninsula Gateway', body: 'Newport News sits at the I-64 crossroads connecting Hampton Roads to Richmond, Williamsburg, and Northern Virginia — making it ideal for professionals who commute to multiple locations or want easy regional access.' },
]

const faqs = [
  { q: 'What is the average home price in Newport News?', a: 'The median home price in Newport News is around $255,000 as of 2025 — the most affordable major city on the Virginia Peninsula. Prices range from under $180K in entry-level areas to $400K+ in Port Warwick and Kiln Creek.' },
  { q: 'Is Newport News a good place to live?', a: 'Newport News offers solid value, diverse neighborhood options, and strong employment fundamentals driven by Newport News Shipbuilding and military bases. It\'s especially well-suited for working families, military households, and buyers who want Peninsula access at affordable prices.' },
  { q: 'What makes Port Warwick special?', a: 'Port Warwick is genuinely unlike anything else in Hampton Roads — it\'s a new urbanist community built around walkability, arts, and community life in a way that most Hampton Roads neighborhoods aren\'t. It has independent restaurants, a farmers\' market, arts events, and a genuine village feel that attracts buyers who want more than just a house.' },
  { q: 'Is Newport News good for military families?', a: 'Yes — Fort Eustis (now Joint Base Langley-Eustis) is one of the major installations in the area, and the city has a deep military culture with VA loan expertise, relocation resources, and communities that understand the military lifestyle. Barry\'s team works with military buyers constantly.' },
  { q: 'How does Newport News compare to Hampton for buyers?', a: 'Newport News and Hampton are closely linked Peninsula cities with similar price points. Newport News has more housing variety, larger neighborhoods like Denbigh, the unique Port Warwick community, and proximity to CNU and Fort Eustis. Hampton has better direct waterfront access (Buckroe Beach) and Fort Monroe. Both are excellent value markets.' },
  { q: 'What is Hilton Village like?', a: 'Hilton Village is a National Historic Landmark built in 1918 — one of America\'s first planned communities. The English cottage-style homes on tree-lined streets are architecturally unique in Hampton Roads. The village commercial strip has independent shops and cafes. It has strong community identity and consistently holds its value well.' },
  { q: 'Are schools good in Newport News?', a: 'Newport News Public Schools is a diverse urban school system with a range of outcomes by school. It has strong magnet program options and some highly regarded individual campuses. Christopher Newport University provides higher education options right in the city. Families focused primarily on K-12 school rankings sometimes prefer Williamsburg or York County nearby.' },
]

export default function NewportNewsPage() {
  return (
    <main>
      {/* BREADCRUMB */}
      <div className="breadcrumb">
        <div className="breadcrumb-inner">
          <Link href="/">Home</Link>
          <span className="breadcrumb-sep">›</span>
          <span>Communities</span>
          <span className="breadcrumb-sep">›</span>
          <span>Newport News</span>
        </div>
      </div>

      {/* HERO */}
      <header style={{
        position: 'relative',
        minHeight: 560,
        display: 'flex',
        alignItems: 'flex-end',
        paddingBottom: 64,
        overflow: 'hidden',
        background: '#101820',
      }}>
        <img
          src="/NewportNews.jpg"
          alt="Newport News Virginia neighborhood"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 100%)' }} />
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            Hampton Roads, Virginia · The Peninsula
          </p>
          <h1 style={{ color: '#fff', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16 }}>
            Newport News<br />Homes For Sale
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 17, maxWidth: 560, marginBottom: 40, lineHeight: 1.7 }}>
            Diverse housing stock, strong value, unique neighborhoods like Port Warwick and Hilton Village, and Hampton Roads&apos;s most affordable Peninsula access.
          </p>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            {[['700+', 'Active Listings'], ['$255K', 'Median Price'], ['30', 'Avg. Days on Market'], ['185K', 'Population']].map(([num, lbl]) => (
              <div key={lbl}>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{num}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* MAP */}
      <section id="map" style={{ padding: '64px 0', background: 'var(--off-white)' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-label">Location</span>
            <h2>Where is Newport News?</h2>
            <p>Newport News occupies the southern tip of the Virginia Peninsula — bordered by the James River to the south, Hampton to the east, and York County to the north, with I-64 as its spine.</p>
          </div>
          <div style={{ height: 420, borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
            <CommunityMapWrapper
              id="newport-news"
              name="Newport News, VA"
              subtitle="Hampton Roads · Virginia Peninsula"
              center={[-76.52, 37.07]}
              zoom={11}
              boundary={[
                [-76.62, 37.18], [-76.43, 37.18], [-76.43, 36.97],
                [-76.62, 36.97], [-76.62, 37.18],
              ]}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginTop: 24 }}>
            {[
              { time: '~15 min', dest: 'to Hampton', route: 'via I-64 E' },
              { time: '~30 min', dest: 'to Williamsburg', route: 'via I-64 NW' },
              { time: '~35 min', dest: 'to Norfolk', route: 'via Monitor-Merrimac Bridge-Tunnel' },
              { time: '~1 hr', dest: 'to Richmond', route: 'via I-64 NW' },
            ].map(d => (
              <div key={d.dest} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 20px' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent)' }}>{d.time}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginTop: 4 }}>{d.dest}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{d.route}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LISTINGS */}
      <section id="listings">
        <div className="container">
          <div className="section-header">
            <span className="section-label">New Listings · Updated Daily</span>
            <h2>New Newport News Listings</h2>
            <p>The latest homes for sale in Newport News — diverse housing across historic, suburban, and new development neighborhoods, updated daily from the MLS.</p>
          </div>
          <div className="ylopo-wrap">
            <div className="YLOPO_resultsWidget" data-search='{"locations":[{"city":"Newport News","state":"VA"}],"propertyTypes":["house","condo","townhouse"],"minPrice":150000,"limit":12,"sortBy":"listDate","sortOrder":"desc"}' />
          </div>
          <p className="ylopo-note">Listing data sourced from regional MLS. Information deemed reliable but not guaranteed. Updated daily.</p>
          <div className="listings-actions">
            <a href="https://search.buyingva.com/search?s[orderBy]=sourceCreationDate%2Cdesc&s[page]=1&s[locations][0][city]=Newport+News&s[locations][0][state]=VA" target="_blank" rel="noopener noreferrer" className="btn-primary">
              View All Newport News Listings →
            </a>
            <Link href="/#listings" className="btn-outline">← Back to All Listings</Link>
          </div>
        </div>
      </section>

      {/* OVERVIEW */}
      <section id="overview" style={{ background: 'var(--off-white)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 64, alignItems: 'start' }}>
            <div>
              <span className="section-label">A Local&apos;s Perspective</span>
              <div style={{ width: 40, height: 3, background: 'var(--accent)', margin: '12px 0 24px', borderRadius: 2 }} />
              <h2 style={{ marginBottom: 24 }}>Newport News: The Peninsula&apos;s Best Value</h2>
              <p style={{ marginBottom: 16 }}>Newport News doesn&apos;t get the same headlines as Virginia Beach or Williamsburg — but for buyers who want Peninsula access, solid employment fundamentals, and genuine neighborhood character at prices that don&apos;t require stretching, it&apos;s one of the best markets in Hampton Roads.</p>
              <p style={{ marginBottom: 16 }}>Barry Jenkins has helped families across Newport News — from first-time buyers in Denbigh and Richneck to professionals looking for the Port Warwick lifestyle. What makes Newport News work is its diversity: you can spend $185K on an entry-level home or $400K on a Port Warwick townhome with walkable amenities, and both buyers get real value for their money.</p>
              <p style={{ marginBottom: 16 }}>Newport News Shipbuilding is the city&apos;s economic anchor — one of the few places in America that still builds nuclear-powered aircraft carriers. That means consistent employment, stable income levels, and housing demand that doesn&apos;t evaporate when broader economic cycles soften.</p>
              <p>Add Christopher Newport University, Fort Eustis, I-64 access, and neighborhoods like Hilton Village and Port Warwick that genuinely can&apos;t be found anywhere else in Hampton Roads, and the case for Newport News gets compelling fast.</p>
            </div>
            <div>
              <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '28px 32px', marginBottom: 20 }}>
                <h3 style={{ marginBottom: 20 }}>Newport News At a Glance</h3>
                {stats.map(([label, value, cls]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: cls === 'accent' ? 'var(--accent)' : 'var(--text)' }}>{value}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: 'var(--accent)', borderRadius: 'var(--radius-xl)', padding: '28px 32px' }}>
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15, marginBottom: 20, lineHeight: 1.7 }}>
                  Ready to explore Newport News? Barry will help you find the right neighborhood for your budget and lifestyle.
                </p>
                <a href="tel:+17578164037" className="btn-primary" style={{ background: '#fff', color: 'var(--accent)', width: '100%', justifyContent: 'center' }}>
                  Call (757) 816-4037
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HIGHLIGHTS */}
      <section id="highlights">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Why Newport News</span>
            <h2>Why People Choose Newport News</h2>
            <p>Value, diversity, and unique neighborhoods — here&apos;s what makes Newport News stand out on the Peninsula.</p>
          </div>
          <div className="cards-grid">
            {highlights.map(h => (
              <div key={h.title} className="card">
                <div className="card-icon">{h.icon}</div>
                <h3>{h.title}</h3>
                <p>{h.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEIGHBORHOODS */}
      <section id="neighborhoods" style={{ background: 'var(--off-white)' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-label">Neighborhoods</span>
            <h2>Find Your Newport News Neighborhood</h2>
            <p>From the historic lanes of Hilton Village to the walkable village of Port Warwick — Newport News has a neighborhood for every taste and budget.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {neighborhoods.map(n => (
              <div key={n.name} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px 28px' }}>
                <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--text)', marginBottom: 4 }}>{n.name}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>{n.type}</div>
                <p style={{ fontSize: 14, marginBottom: 14 }}>{n.desc}</p>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{n.price}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LIFESTYLE */}
      <section id="lifestyle">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
            <div>
              <img
                src="/NewportNews.jpg"
                alt="Newport News parks and outdoor lifestyle"
                style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 'var(--radius-xl)' }}
              />
            </div>
            <div>
              <span className="section-label">Parks, Culture & Community</span>
              <div style={{ width: 40, height: 3, background: 'var(--accent)', margin: '12px 0 24px', borderRadius: 2 }} />
              <h2 style={{ marginBottom: 20 }}>More Park Land Per Capita Than Almost Any Virginia City</h2>
              <p style={{ marginBottom: 16 }}>Newport News has quietly assembled one of the most impressive park systems in Virginia. Newport News Park alone — at 8,000 acres — is one of the largest municipal parks in the eastern United States, offering everything from camping to archery ranges to miles of hiking and biking trails.</p>
              <p style={{ marginBottom: 24 }}>Add the Ferguson Center for the Arts (a world-class performing arts venue at CNU), the Virginia Living Museum, Huntington Park&apos;s James River beach, and the unique community life of Port Warwick, and Newport News offers cultural depth that surprises most newcomers.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  'Newport News Park — 8,000 acres with camping, disc golf, archery, and 30+ miles of trails',
                  'Virginia Living Museum — natural history museum with wildlife habitats and planetarium',
                  'Huntington Park — James River beach, boat launch, and recreational facilities',
                  'Ferguson Center for the Arts — world-class performing arts center at CNU',
                  'Port Warwick Village Green — weekly farmers\' market, outdoor concerts, and community events',
                ].map((b, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 6, height: 6, background: 'var(--accent)', borderRadius: '50%', marginTop: 7, flexShrink: 0 }} />
                    <p style={{ fontSize: 14 }}>{b}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SCHOOLS */}
      <section id="schools" style={{ background: 'var(--off-white)' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-label">Education</span>
            <h2>Newport News Public Schools & Universities</h2>
            <p>Newport News is home to Christopher Newport University and a public school system with strong magnet program options.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            {[
              {
                group: 'Notable High Schools',
                schools: [
                  ['Menchville High School', '9–12 · Strong Academics'],
                  ['Warwick High School', '9–12 · Performing Arts Magnet'],
                  ['Denbigh High School', '9–12 · STEM Focus'],
                  ['Heritage High School', '9–12 · Northern Newport News'],
                  ['Woodside High School', '9–12 · IB Programme'],
                ],
              },
              {
                group: 'Private & Independent',
                schools: [
                  ['Hampton Roads Academy', 'K–12 · College Prep'],
                  ['Walsingham Academy', 'PreK–12 · Catholic · Williamsburg'],
                  ['Norfolk Academy', '1–12 · Top-Ranked · Norfolk'],
                  ['Cape Henry Collegiate', 'PreK–12 · VB'],
                  ['Tidewater Christian', 'K–12 · Faith-Based'],
                ],
              },
              {
                group: 'Higher Education',
                schools: [
                  ['Christopher Newport University', 'Liberal Arts · 5K Students · On Campus'],
                  ['Thomas Nelson Community College', 'Hampton Campus · Accessible'],
                  ['Old Dominion University', 'Research University · Norfolk'],
                  ['Hampton University', 'HBCU · Hampton'],
                  ['William & Mary', 'Top Public University · Williamsburg (30 min)'],
                ],
              },
            ].map(({ group, schools }) => (
              <div key={group} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px 28px' }}>
                <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>{group}</h3>
                {schools.map(([name, grade]) => (
                  <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)', gap: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{name}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{grade}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MARKET TRENDS */}
      <section id="market">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Market Data</span>
            <h2>Newport News Market Trends</h2>
            <p>Live market data updated weekly — median prices, inventory levels, and market conditions in real time.</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <iframe
              src="https://altos.re/html/s-html/ec050d5c-5c80-45ae-820e-9212a2963ad5?scale=1&marketNarrative=true&houses=true&weeklyChange=true&branding=true&size=large"
              style={{ border: 0, display: 'block', width: 640, maxWidth: '100%', height: 800 }}
              scrolling="auto"
              loading="lazy"
              title="Newport News Market Trends"
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <CommunityFAQ
        title="Newport News Real Estate FAQs"
        subtitle="Common questions from buyers and sellers navigating the Newport News market."
        faqs={faqs}
      />

      {/* CTA */}
      <section id="cta" style={{ background: 'var(--accent)', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: 640 }}>
          <h2 style={{ color: '#fff', marginBottom: 16 }}>Ready to Find Your Newport News Home?</h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 17, marginBottom: 36 }}>
            Barry Jenkins and the Legacy Home Team know Newport News well — from Port Warwick&apos;s village life to the solid value of Denbigh and Kiln Creek. Let&apos;s find the right fit.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="tel:+17578164037" style={{ background: '#fff', color: 'var(--accent)', padding: '14px 32px', borderRadius: 'var(--radius)', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
              Call (757) 816-4037
            </a>
            <a href="#listings" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '14px 32px', borderRadius: 'var(--radius)', fontWeight: 700, fontSize: 15, textDecoration: 'none', border: '1.5px solid rgba(255,255,255,0.4)' }}>
              Browse Listings
            </a>
          </div>
          <p style={{ marginTop: 24, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Licensed in Virginia · Legacy Home Team · (757) 816-4037</p>
        </div>
      </section>
    </main>
  )
}
