import type { Metadata } from 'next'
import Link from 'next/link'
import CommunityFAQ from '@/components/CommunityFAQ'
import CommunityMapWrapper from '@/components/CommunityMapWrapper'

export const metadata: Metadata = {
  title: 'Hampton Homes For Sale | Legacy Home Team',
  description: 'Search Hampton VA homes for sale. Langley Air Force Base, NASA Langley, Buckroe Beach, and historic waterfront living — Barry Jenkins and the Legacy Home Team. Call (757) 816-4037.',
}

const stats = [
  ['Population', '137,000+'],
  ['Median Home Price', '$265,000', 'accent'],
  ['Avg. Days on Market', '28'],
  ['Major Employer', 'Langley AFB · NASA Langley'],
  ['School Districts', 'Hampton City Schools'],
  ['Coastline', 'Chesapeake Bay · Back River'],
  ['Year Founded', '1610 (One of America\'s Oldest Cities)'],
  ['Distance to Newport News', '~15 min'],
  ['Distance to Norfolk', '~20 min via HRBT'],
  ['Distance to Virginia Beach', '~45 min'],
]

const neighborhoods = [
  { name: 'Buckroe Beach', type: 'Waterfront · Beach Community', desc: 'Hampton\'s crown jewel — a revitalized bayside beach community with direct Chesapeake Bay access, the popular Buckroe Beach Park, and a mix of historic cottages and new construction townhomes.', price: 'From $280K' },
  { name: 'Phoebus', type: 'Historic · Arts District', desc: 'A charming, walkable historic district with Victorian and Colonial Revival architecture, thriving independent restaurants and galleries, and a genuine small-town character just minutes from Fort Monroe.', price: 'From $220K' },
  { name: 'Wythe', type: 'Established · Waterfront', desc: 'An established residential neighborhood with waterfront access along Hampton Roads harbor — featuring classic mid-century homes, water views, and a strong community identity.', price: 'From $240K' },
  { name: 'Fox Hill', type: 'Peninsula · Waterfront', desc: 'A tight-knit community at the tip of the Hampton Peninsula with Back River access — known for its working waterfront character, crabbing traditions, and affordable waterfront options.', price: 'From $200K' },
  { name: 'Coliseum Central', type: 'Central · Convenient', desc: 'The commercial and residential heart of Hampton, with easy access to I-64, Hampton Coliseum, shopping centers, and a variety of affordable housing options close to major employment centers.', price: 'From $180K' },
  { name: 'Aberdeen Gardens', type: 'Historic · Community', desc: 'A nationally designated historic district — one of only three Depression-era communities built for African Americans still intact. Beautiful brick homes with architectural character and strong community roots.', price: 'From $200K' },
  { name: 'Hampton Roads Center', type: 'Growing · Professional', desc: 'A developing district near major employment centers with new construction townhomes and condos — popular with military families and young professionals working at Langley AFB or NASA.', price: 'From $250K' },
  { name: 'Chesapeake Avenue', type: 'Waterfront · Executive', desc: 'The most prestigious residential corridor in Hampton — historic estates and executive homes lining the Chesapeake Bay waterfront, many with private docks and sweeping water views.', price: 'From $500K' },
  { name: 'Newmarket', type: 'Suburban · Family', desc: 'A solid, family-oriented neighborhood in central Hampton with good school access, established homes, and convenient proximity to both the city\'s commercial centers and I-64 interchanges.', price: 'From $225K' },
]

const highlights = [
  { icon: '✈️', title: 'Langley AFB & NASA Langley', body: 'Langley Air Force Base and NASA Langley Research Center are Hampton\'s twin economic engines — driving constant relocation demand, strong rental market depth, and one of the region\'s most stable employment bases.' },
  { icon: '🏖️', title: 'Buckroe Beach on the Chesapeake Bay', body: 'Buckroe Beach offers one of Hampton Roads\'s best free public beaches — right on the Chesapeake Bay with a revitalized pier, park, and year-round community that gives Hampton genuine beach-town character.' },
  { icon: '🏛️', title: 'Fort Monroe National Monument', body: 'Fort Monroe — a stunning 19th-century military fortification on the Chesapeake Bay — has been transformed into a national monument, arts community, and one of the region\'s most unique residential addresses.' },
  { icon: '💰', title: "Hampton Roads' Most Affordable Market", body: 'Hampton consistently offers the lowest median home prices in Hampton Roads, making it the best entry point for first-time buyers and military families who want waterfront access without resort-strip prices.' },
  { icon: '🌊', title: 'Surrounded by Water', body: 'Hampton is a true peninsula city — bordered by the Chesapeake Bay, Hampton Roads harbor, Back River, and multiple tidal creeks. Water access is embedded in the city\'s DNA in ways unique even for coastal Virginia.' },
  { icon: '🚀', title: 'Historic & Scientific Legacy', body: 'Hampton is one of the oldest English-speaking settlements in America (1610) and home to NASA Langley, which pioneered American aviation and space research. Few cities combine this much history and innovation.' },
]

const faqs = [
  { q: 'What is the average home price in Hampton?', a: 'The median home price in Hampton is around $265,000 as of 2025 — the most affordable major city in Hampton Roads. Prices range from under $180K for entry-level homes in Coliseum Central to $700K+ for executive waterfront properties along Chesapeake Avenue.' },
  { q: 'Is Hampton good for military families?', a: 'Absolutely — Hampton is one of the most military-friendly communities in Virginia. Langley AFB is one of the region\'s largest installations, VA loans are standard, and the community deeply understands military life including frequent moves, deployments, and the importance of stable schools.' },
  { q: 'Is Buckroe Beach worth buying near?', a: 'For many buyers, yes. The Buckroe area has undergone significant revitalization with new mixed-use development near the beach and park. Properties near the water offer lifestyle value that the price points don\'t fully reflect — and continued development investment suggests ongoing appreciation.' },
  { q: 'How are Hampton City Schools rated?', a: 'Hampton City Schools is a mid-tier school system that has been improving. It\'s not at the top tier of Chesapeake or Virginia Beach schools, but the city has strong magnet program options and some highly regarded individual schools. Many military families appreciate the consistency and support systems for transient populations.' },
  { q: 'What is Fort Monroe like to live in or near?', a: 'Fort Monroe is genuinely unique — a 19th-century stone fort on a peninsula in the Chesapeake Bay that now houses a national monument, residential community, restaurants, and arts organizations. Living on or near Fort Monroe offers historical character and water views that are truly one-of-a-kind in Hampton Roads.' },
  { q: 'How does Hampton compare to Newport News for buyers?', a: 'Hampton and Newport News are closely linked Peninsula cities with similar price points. Hampton has better water access and beach character (Buckroe Beach, Fort Monroe). Newport News has more housing variety, the Port Warwick walkable community, and slightly larger neighborhoods. Both are excellent value markets.' },
  { q: 'Is Hampton a good rental market?', a: 'Yes — Langley AFB and NASA Langley create consistent rental demand that keeps vacancy rates low. Military families on orders frequently need rental housing, and proximity to these installations makes Hampton\'s rental market more resilient than many comparable cities.' },
]

export default function HamptonPage() {
  return (
    <main>
      {/* BREADCRUMB */}
      <div className="breadcrumb">
        <div className="breadcrumb-inner">
          <Link href="/">Home</Link>
          <span className="breadcrumb-sep">›</span>
          <span>Communities</span>
          <span className="breadcrumb-sep">›</span>
          <span>Hampton</span>
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
        background: '#0a1820',
      }}>
        <img
          src="/Hampton.jpg"
          alt="Hampton Virginia waterfront"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 100%)' }} />
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            Hampton Roads, Virginia · The Peninsula
          </p>
          <h1 style={{ color: '#fff', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16 }}>
            Hampton<br />Homes For Sale
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 17, maxWidth: 560, marginBottom: 40, lineHeight: 1.7 }}>
            America&apos;s oldest English-speaking city — with Chesapeake Bay beaches, NASA history, and Hampton Roads&apos;s best-value waterfront homes.
          </p>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            {[['600+', 'Active Listings'], ['$265K', 'Median Price'], ['28', 'Avg. Days on Market'], ['1610', 'Founded']].map(([num, lbl]) => (
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
            <h2>Where is Hampton?</h2>
            <p>Hampton sits at the tip of the Virginia Peninsula — bordered by the Chesapeake Bay, Hampton Roads harbor, and Back River, connected to the Southside via the Hampton Roads Bridge-Tunnel.</p>
          </div>
          <div style={{ height: 420, borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
            <CommunityMapWrapper
              id="hampton"
              name="Hampton, VA"
              subtitle="Hampton Roads · Virginia Peninsula"
              center={[-76.34, 37.03]}
              zoom={11}
              boundary={[
                [-76.45, 37.12], [-76.21, 37.12], [-76.21, 36.97],
                [-76.45, 36.97], [-76.45, 37.12],
              ]}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginTop: 24 }}>
            {[
              { time: '~15 min', dest: 'to Newport News', route: 'via I-64 W' },
              { time: '~20 min', dest: 'to Norfolk', route: 'via Hampton Roads Bridge-Tunnel' },
              { time: '~35 min', dest: 'to Williamsburg', route: 'via I-64 NW' },
              { time: '~45 min', dest: 'to Virginia Beach', route: 'via I-64 E / I-264 E' },
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
            <h2>New Hampton Listings</h2>
            <p>The latest homes for sale in Hampton — waterfront cottages, historic homes, and military-friendly neighborhoods updated daily from the MLS.</p>
          </div>
          <div className="ylopo-wrap">
            <div className="YLOPO_resultsWidget" data-search='{"locations":[{"city":"Hampton","state":"VA"}],"propertyTypes":["house","condo","townhouse"],"minPrice":150000,"limit":12,"sortBy":"listDate","sortOrder":"desc"}' />
          </div>
          <p className="ylopo-note">Listing data sourced from regional MLS. Information deemed reliable but not guaranteed. Updated daily.</p>
          <div className="listings-actions">
            <a href="https://search.buyingva.com/search?s[orderBy]=sourceCreationDate%2Cdesc&s[page]=1&s[locations][0][city]=Hampton&s[locations][0][state]=VA" target="_blank" rel="noopener noreferrer" className="btn-primary">
              View All Hampton Listings →
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
              <h2 style={{ marginBottom: 24 }}>Hampton: Value, Water, and American History</h2>
              <p style={{ marginBottom: 16 }}>Hampton doesn&apos;t get the same attention as Virginia Beach or Chesapeake in conversations about Hampton Roads real estate — and that&apos;s exactly what makes it compelling for savvy buyers. This is a city where you can still find waterfront access, Chesapeake Bay beach character, and military-grade community infrastructure at price points that would be laughable on the Southside.</p>
              <p style={{ marginBottom: 16 }}>Barry Jenkins has helped military families find their footing in Hampton since the beginning — and the story repeats itself. Buyers on Langley AFB orders discover Buckroe Beach, realize they can afford a home with water views for under $300K, and stop looking at everything else.</p>
              <p style={{ marginBottom: 16 }}>The city&apos;s history also matters. Hampton is one of the oldest continuously occupied English settlements in America, and that historical depth gives it an architectural and cultural character that newer suburbs simply can&apos;t replicate. From the Victorian streets of Phoebus to the extraordinary Fort Monroe National Monument, Hampton wears its history well.</p>
              <p>For first-time buyers, military families, and investors looking for value and rental demand, Hampton consistently delivers more than its price tag suggests.</p>
            </div>
            <div>
              <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '28px 32px', marginBottom: 20 }}>
                <h3 style={{ marginBottom: 20 }}>Hampton At a Glance</h3>
                {stats.map(([label, value, cls]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: cls === 'accent' ? 'var(--accent)' : 'var(--text)' }}>{value}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: 'var(--accent)', borderRadius: 'var(--radius-xl)', padding: '28px 32px' }}>
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15, marginBottom: 20, lineHeight: 1.7 }}>
                  Ready to explore Hampton? Barry will help you find the right neighborhood for your goals and budget.
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
            <span className="section-label">Why Hampton</span>
            <h2>Why People Choose Hampton</h2>
            <p>Affordable waterfront living, military community, and genuine American history — here&apos;s what makes Hampton unique.</p>
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
            <h2>Find Your Hampton Neighborhood</h2>
            <p>From Buckroe Beach to historic Phoebus — Hampton has a neighborhood for every lifestyle and budget.</p>
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
                src="/Hampton.jpg"
                alt="Hampton waterfront and beaches"
                style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 'var(--radius-xl)' }}
              />
            </div>
            <div>
              <span className="section-label">Beach, History & Community</span>
              <div style={{ width: 40, height: 3, background: 'var(--accent)', margin: '12px 0 24px', borderRadius: 2 }} />
              <h2 style={{ marginBottom: 20 }}>History, Beaches, and NASA All in One City</h2>
              <p style={{ marginBottom: 16 }}>Hampton is a city where American history is literally embedded in the streets. From the nation&apos;s oldest English-speaking settlement to the birthplace of American aviation science at NASA Langley, few cities pack this much historical significance into a community of this size.</p>
              <p style={{ marginBottom: 24 }}>That history coexists beautifully with modern waterfront living — Buckroe Beach, Fort Monroe, the revitalized Phoebus arts district, and a growing kayak/paddleboard culture along the city&apos;s many waterways.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  'Buckroe Beach Park — free Chesapeake Bay beach with pier, pavilion, and seasonal events',
                  'Fort Monroe National Monument — 19th-century fortress, national park, and residential community',
                  'Virginia Air & Space Science Center — NASA-affiliated science museum and IMAX',
                  'Phoebus Arts District — walkable historic district with galleries, dining, and weekend markets',
                  'Mill Creek/Back River kayaking — miles of quiet tidal water for paddling and nature observation',
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
            <h2>Hampton City Schools</h2>
            <p>Hampton City Schools serves a diverse urban population with strong magnet programs, NASA-affiliated STEM initiatives, and improving academic outcomes.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            {[
              {
                group: 'Notable High Schools',
                schools: [
                  ['Phoebus High School', '9–12 · Historic District Campus'],
                  ['Hampton High School', '9–12 · Largest HS in the City'],
                  ['Kecoughtan High School', '9–12 · IB Programme'],
                  ['Bethel High School', '9–12 · Coliseum Area'],
                  ['Hampton Roads Academy', 'K–12 · Private College Prep'],
                ],
              },
              {
                group: 'Private & Independent',
                schools: [
                  ['Hampton Roads Academy', 'K–12 · College Prep · Private'],
                  ['Walsingham Academy', 'PreK–12 · Catholic · Williamsburg'],
                  ['Cape Henry Collegiate', 'PreK–12 · Virginia Beach'],
                  ['Norfolk Academy', '1–12 · Top-Ranked · Norfolk'],
                  ['Tidewater Christian', 'K–12 · Faith-Based'],
                ],
              },
              {
                group: 'Higher Education',
                schools: [
                  ['Hampton University', 'Prestigious HBCU · On Campus in Hampton'],
                  ['Thomas Nelson Community College', 'Hampton Campus'],
                  ['Old Dominion University', 'Research University · Norfolk'],
                  ['Christopher Newport University', 'Liberal Arts · Newport News'],
                  ['William & Mary', 'Top Public University · Williamsburg'],
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
            <h2>Hampton Market Trends</h2>
            <p>Live market data updated weekly — median prices, inventory levels, and market conditions in real time.</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <iframe
              src="https://altos.re/html/s-html/6b44c4c3-b3d7-4545-b13b-8684f644895a?scale=1&marketNarrative=true&houses=true&weeklyChange=true&branding=true&size=large"
              style={{ border: 0, display: 'block', width: 640, maxWidth: '100%', height: 800 }}
              scrolling="auto"
              loading="lazy"
              title="Hampton Market Trends"
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <CommunityFAQ
        title="Hampton Real Estate FAQs"
        subtitle="Common questions from buyers and sellers navigating the Hampton market."
        faqs={faqs}
      />

      {/* CTA */}
      <section id="cta" style={{ background: 'var(--accent)', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: 640 }}>
          <h2 style={{ color: '#fff', marginBottom: 16 }}>Ready to Find Your Hampton Home?</h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 17, marginBottom: 36 }}>
            Barry Jenkins and the Legacy Home Team know Hampton inside and out — from Buckroe Beach waterfront to military-friendly Coliseum Central. Let&apos;s find the right fit.
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
