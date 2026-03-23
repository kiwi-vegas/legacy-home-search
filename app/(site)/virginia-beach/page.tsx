import type { Metadata } from 'next'
import Link from 'next/link'
import CommunityFAQ from '@/components/CommunityFAQ'
import CommunityMapWrapper from '@/components/CommunityMapWrapper'

export const metadata: Metadata = {
  title: 'Virginia Beach Homes For Sale | Legacy Home Team',
  description: 'Search Virginia Beach homes for sale. From oceanfront condos to suburban neighborhoods — Barry Jenkins and the Legacy Home Team know every corner of VB. Call (757) 816-4037.',
}

const stats = [
  ['Population', '459,000+'],
  ['Median Home Price', '$380,000', 'accent'],
  ['Avg. Days on Market', '28'],
  ['Miles of Coastline', '35+'],
  ['School Districts', 'Virginia Beach City Public Schools'],
  ['Military Bases', 'NAS Oceana · JEB Little Creek–Fort Story'],
  ['Parks & Recreation', '200+ parks and rec facilities'],
  ['Distance to Norfolk', '~20 min'],
  ['Distance to Richmond', '~1.5 hrs'],
  ['Distance to DC', '~3.5 hrs'],
]

const neighborhoods = [
  { name: 'Oceanfront / Resort Area', type: 'Beachfront · Condos & Hotels', desc: 'The heart of Virginia Beach tourism — oceanfront condos, vacation rentals, and year-round beach access along Atlantic Avenue.', price: 'From $300K' },
  { name: 'Great Neck', type: 'Upscale · Waterfront', desc: 'One of VB\'s most prestigious areas with waterfront estates, top-rated schools, and easy access to the Lynnhaven Inlet.', price: 'From $600K' },
  { name: 'Kempsville', type: 'Established · Family', desc: 'A large, diverse community in the heart of Virginia Beach with a mix of starter homes, established neighborhoods, and convenient shopping.', price: 'From $280K' },
  { name: 'Sandbridge', type: 'Secluded · Beachfront', desc: 'A quiet barrier island south of the resort strip with private beach access, vacation rentals, and a true escape-from-it-all feel.', price: 'From $500K' },
  { name: 'Princess Anne / Courthouse', type: 'Growing · New Construction', desc: 'The fastest-growing area of Virginia Beach, home to the city\'s municipal center, top schools, and large new-construction subdivisions.', price: 'From $400K' },
  { name: 'Chesapeake Beach', type: 'Waterfront · Suburban', desc: 'Bayside living with easy access to the Chesapeake Bay Bridge-Tunnel, marinas, and a slower pace than the resort corridor.', price: 'From $350K' },
  { name: 'Red Mill / Strawbridge', type: 'Suburban · Family', desc: 'Popular family neighborhoods in the southwestern part of VB, close to the Chesapeake border with newer homes and strong schools.', price: 'From $380K' },
  { name: 'Hilltop', type: 'Central · Walkable', desc: 'A central VB hub with townhomes, condos, and single-family homes walking distance from shopping, dining, and the First Landing State Park trail.', price: 'From $300K' },
  { name: 'North End', type: 'Beach Cottage · Character', desc: 'Quiet beach cottages and newer builds north of the resort strip. Tight-knit community feel with direct beach access and year-round residents.', price: 'From $450K' },
]

const highlights = [
  { icon: '🏖️', title: '35 Miles of Atlantic Coastline', body: 'Virginia Beach offers one of the longest public beaches on the East Coast — from the busy resort strip to the quiet shores of Sandbridge and First Landing State Park.' },
  { icon: '✈️', title: 'Military & Federal Hub', body: 'Home to NAS Oceana, JEB Little Creek–Fort Story, and thousands of civilian contractors. VA/military financing is the norm here — Barry knows how to navigate it.' },
  { icon: '🏫', title: 'Strong Public School System', body: 'Virginia Beach City Public Schools consistently ranks among Virginia\'s top districts. Schools like Princess Anne High and First Colonial High are highly regarded.' },
  { icon: '🌿', title: 'Outdoor Recreation Everywhere', body: 'From First Landing State Park to the Chesapeake Bay to Back Bay National Wildlife Refuge — VB offers kayaking, fishing, hiking, surfing, and wildlife in every direction.' },
  { icon: '📈', title: 'Resilient Real Estate Market', body: 'Military demand creates a consistent, stable housing market. Virginia Beach has outperformed many East Coast metros through multiple market cycles.' },
  { icon: '🌊', title: 'Waterfront Lifestyle', body: 'Whether it\'s the Atlantic Ocean, Chesapeake Bay, or the many tidal creeks and inlets, nearly every neighborhood in VB has water access within minutes.' },
]

const faqs = [
  { q: 'What is the average home price in Virginia Beach?', a: 'The median home price in Virginia Beach is around $380,000 as of 2025, with a wide range from $250K condos near the resort area to $1M+ waterfront estates in Great Neck and Sandbridge.' },
  { q: 'Is Virginia Beach a good place to buy a home?', a: 'Yes. Virginia Beach benefits from strong military demand, consistent population growth, excellent beaches and quality of life, and a diverse economy beyond just tourism. Historically, VB homes hold their value well.' },
  { q: 'What neighborhoods are best for families?', a: 'Great Neck, Princess Anne, Red Mill/Strawbridge, and Hilltop are all popular with families. Great Neck and Princess Anne are especially sought-after for school quality and community feel.' },
  { q: 'Can I use VA financing to buy in Virginia Beach?', a: 'Absolutely — and Barry\'s team works VA loans every day. Virginia Beach is one of the most VA-loan-friendly markets in the country given the large active-duty and veteran population.' },
  { q: 'What areas are best for beachfront or waterfront homes?', a: 'The Oceanfront/Resort area and North End for Atlantic beach access. Sandbridge for a quieter, secluded beach experience. Great Neck and Chesapeake Beach for bay and inlet waterfront.' },
  { q: 'How competitive is the Virginia Beach market?', a: 'Moderately competitive. Well-priced homes in desirable neighborhoods (especially near the beach or in top school zones) tend to move within 2–4 weeks. Barry\'s team helps buyers move fast when needed.' },
  { q: 'How long does it take to sell a home in Virginia Beach?', a: 'The average days on market in VB is around 28 days. Homes priced correctly and properly marketed often sell faster — sometimes in under two weeks in peak season (spring/summer).' },
]

export default function VirginiaBeachPage() {
  return (
    <main>
      {/* BREADCRUMB */}
      <div className="breadcrumb">
        <div className="breadcrumb-inner">
          <Link href="/">Home</Link>
          <span className="breadcrumb-sep">›</span>
          <span>Communities</span>
          <span className="breadcrumb-sep">›</span>
          <span>Virginia Beach</span>
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
        background: '#0f1a2e',
      }}>
        <img
          src="/virginia%20beach.jpg"
          alt="Virginia Beach coastline"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 100%)' }} />
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            Hampton Roads, Virginia
          </p>
          <h1 style={{ color: '#fff', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16 }}>
            Virginia Beach<br />Homes For Sale
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 17, maxWidth: 560, marginBottom: 40, lineHeight: 1.7 }}>
            35 miles of Atlantic coastline, a thriving military community, top-rated schools, and one of the East Coast&apos;s most livable cities.
          </p>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            {[['1,200+', 'Active Listings'], ['$380K', 'Median Price'], ['28', 'Avg. Days on Market'], ['35+', 'Miles of Beach']].map(([num, lbl]) => (
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
            <h2>Where is Virginia Beach?</h2>
            <p>Located at the southeastern tip of Virginia — where the Chesapeake Bay meets the Atlantic Ocean. Part of the Hampton Roads metropolitan area.</p>
          </div>
          <div style={{ height: 420, borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
            <CommunityMapWrapper
              id="virginia-beach"
              name="Virginia Beach, VA"
              subtitle="Hampton Roads · Atlantic Coast"
              center={[-76.0, 36.85]}
              zoom={10}
              boundary={[
                [-76.27, 36.98], [-75.97, 36.98], [-75.9, 36.92],
                [-75.9, 36.66], [-76.0, 36.55], [-76.2, 36.55],
                [-76.27, 36.72], [-76.27, 36.98],
              ]}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginTop: 24 }}>
            {[
              { time: '~20 min', dest: 'to Norfolk', route: 'via I-264 W' },
              { time: '~25 min', dest: 'to Chesapeake', route: 'via I-64 W' },
              { time: '~45 min', dest: 'to Hampton', route: 'via I-64 N' },
              { time: '~1.5 hrs', dest: 'to Richmond', route: 'via I-64 W' },
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
            <h2>New Virginia Beach Listings</h2>
            <p>The latest homes for sale in Virginia Beach — houses, condos, and townhomes updated daily from the MLS.</p>
          </div>
          <div className="ylopo-wrap">
            <div className="YLOPO_resultsWidget" data-search='{"locations":[{"city":"Virginia Beach","state":"VA"}],"propertyTypes":["house","condo","townhouse"],"minPrice":250000,"limit":12,"sortBy":"listDate","sortOrder":"desc"}' />
          </div>
          <p className="ylopo-note">Listing data sourced from regional MLS. Information deemed reliable but not guaranteed. Updated daily.</p>
          <div className="listings-actions">
            <a href="https://search.buyingva.com/search?s[orderBy]=sourceCreationDate%2Cdesc&s[page]=1&s[locations][0][city]=Virginia+Beach&s[locations][0][state]=VA" target="_blank" rel="noopener noreferrer" className="btn-primary">
              View All Virginia Beach Listings →
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
              <h2 style={{ marginBottom: 24 }}>Virginia Beach: More Than Just a Beach Town</h2>
              <p style={{ marginBottom: 16 }}>When most people hear &quot;Virginia Beach,&quot; they picture the resort strip — the boardwalk, the hotels, the summer crowds. And yes, that&apos;s part of it. But the families who live here year-round know a very different city: one of the largest in America by land area, with 35 miles of coastline, a massive military presence, excellent schools, and a quality of life that keeps people from leaving.</p>
              <p style={{ marginBottom: 16 }}>Barry Jenkins has spent over a decade helping families navigate the Virginia Beach market. What he&apos;ll tell you is that VB is one of the most misunderstood real estate markets on the East Coast. People assume it&apos;s all tourist condos and vacation rentals — but the majority of Virginia Beach is suburban, family-oriented neighborhoods with strong schools and stable home values.</p>
              <p style={{ marginBottom: 16 }}>The military component shapes everything about this market. With NAS Oceana and JEB Little Creek–Fort Story driving constant relocation demand, Virginia Beach rarely sees the dramatic downturns that hit other coastal markets. There&apos;s always a new wave of buyers — active duty, veterans, and civilian contractors — keeping the market liquid.</p>
              <p>Whether you&apos;re looking for an oceanfront condo, a quiet neighborhood near the bay, or a large home in a top school district, Virginia Beach has more variety than most buyers expect.</p>
            </div>
            <div>
              <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '28px 32px', marginBottom: 20 }}>
                <h3 style={{ marginBottom: 20 }}>Virginia Beach At a Glance</h3>
                {stats.map(([label, value, cls]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: cls === 'accent' ? 'var(--accent)' : 'var(--text)' }}>{value}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: 'var(--accent)', borderRadius: 'var(--radius-xl)', padding: '28px 32px' }}>
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15, marginBottom: 20, lineHeight: 1.7 }}>
                  Ready to explore Virginia Beach? Barry will help you find the right neighborhood for your lifestyle and budget.
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
            <span className="section-label">Why Virginia Beach</span>
            <h2>Why People Choose Virginia Beach</h2>
            <p>From world-class beaches to military stability — here&apos;s what drives consistent demand in this market.</p>
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
            <h2>Find Your Virginia Beach Neighborhood</h2>
            <p>From oceanfront condos to quiet suburban streets — Virginia Beach has a neighborhood for every lifestyle and budget.</p>
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
                src="/virginia%20beach.jpg"
                alt="Virginia Beach outdoor lifestyle"
                style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 'var(--radius-xl)' }}
              />
            </div>
            <div>
              <span className="section-label">Outdoor Living</span>
              <div style={{ width: 40, height: 3, background: 'var(--accent)', margin: '12px 0 24px', borderRadius: 2 }} />
              <h2 style={{ marginBottom: 20 }}>35 Miles of Beach. One Extraordinary Backyard.</h2>
              <p style={{ marginBottom: 16 }}>People in Virginia Beach live outside. The beach is not a destination — it&apos;s a ten-minute drive from almost anywhere in the city, year-round.</p>
              <p style={{ marginBottom: 24 }}>Beyond the ocean, the natural variety is remarkable: the Chesapeake Bay, Back Bay National Wildlife Refuge, First Landing State Park, and dozens of tidal creeks and kayaking routes scattered throughout the city.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  'First Landing State Park — 3,000 acres of maritime forest and beach with 20 miles of trails',
                  'Back Bay National Wildlife Refuge — migratory birds, kayaking, and wild beach access',
                  'The Chesapeake Bay Bridge-Tunnel — fishing, crabbing, and waterfront dining',
                  'Atlantic Ave Boardwalk — 3-mile oceanfront path with biking, running, and dining',
                  'Mount Trashmore Park — 165-acre urban park with skate park, two lakes, and playgrounds',
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
            <h2>Virginia Beach City Public Schools</h2>
            <p>One of Virginia&apos;s largest and most respected public school systems — serving 67,000+ students across 86 schools.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            {[
              {
                group: 'Notable High Schools',
                schools: [
                  ['Princess Anne High School', '9–12 · IB Programme'],
                  ['First Colonial High School', '9–12 · Strong Academics'],
                  ['Ocean Lakes High School', '9–12 · STEM Focus'],
                  ['Tallwood High School', '9–12 · Diverse Programs'],
                  ['Kellam High School', '9–12 · Oceanfront District'],
                ],
              },
              {
                group: 'Private & Independent',
                schools: [
                  ['Cape Henry Collegiate', 'PreK–12 · College Prep'],
                  ['Norfolk Academy', '1–12 · Top-Ranked Private'],
                  ['Bishop Sullivan Catholic', '9–12 · Catholic'],
                  ['Regent University School of Law', 'Graduate Level'],
                  ['Virginia Wesleyan University', 'Liberal Arts'],
                ],
              },
              {
                group: 'Higher Education',
                schools: [
                  ['Old Dominion University', 'Major Research University'],
                  ['Regent University', 'Private Christian University'],
                  ['Virginia Beach City College', 'Community College'],
                  ['Norfolk State University', 'HBCU · Norfolk'],
                  ['Tidewater Community College', 'Multi-Campus'],
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
          <div style={{ marginTop: 20, padding: '16px 20px', background: 'var(--accent-light)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 'var(--radius-lg)', fontSize: 13, color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text)' }}>School Assignment Note:</strong> School zones vary by address. Always confirm your specific zoning with Virginia Beach City Public Schools before purchasing.
          </div>
        </div>
      </section>

      {/* MARKET TRENDS */}
      <section id="market">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Market Data</span>
            <h2>Virginia Beach Market Trends</h2>
            <p>Live market data updated weekly — median prices, inventory levels, and market conditions in real time.</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <iframe
              src="https://altos.re/html/s-html/8d125160-7a8d-4cb3-b0a0-c95d4cde0961?scale=1&marketNarrative=true&houses=true&weeklyChange=true&branding=true&size=large"
              style={{ border: 0, display: 'block', width: 640, maxWidth: '100%', height: 800 }}
              scrolling="auto"
              loading="lazy"
              title="Virginia Beach Market Trends"
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <CommunityFAQ
        title="Virginia Beach Real Estate FAQs"
        subtitle="Common questions from buyers and sellers navigating the Virginia Beach market."
        faqs={faqs}
      />

      {/* CTA */}
      <section id="cta" style={{ background: 'var(--accent)', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: 640 }}>
          <h2 style={{ color: '#fff', marginBottom: 16 }}>Ready to Find Your Virginia Beach Home?</h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 17, marginBottom: 36 }}>
            Barry Jenkins and the Legacy Home Team have over a decade of Virginia Beach market experience. Let&apos;s find the right neighborhood and home for your goals.
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
