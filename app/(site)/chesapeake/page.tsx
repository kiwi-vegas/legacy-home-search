import type { Metadata } from 'next'
import Link from 'next/link'
import CommunityFAQ from '@/components/CommunityFAQ'
import CommunityMapWrapper from '@/components/CommunityMapWrapper'
import CommunityHOA from '@/components/CommunityHOA'
import CommunityComparisons from '@/components/CommunityComparisons'
import CommunityNewConstruction from '@/components/CommunityNewConstruction'
import { getLatestMarketReport } from '@/sanity/queries'

export const metadata: Metadata = {
  title: 'Chesapeake Homes For Sale | Legacy Home Team',
  description: 'Search Chesapeake VA homes for sale. Top-rated schools, new construction, and established neighborhoods — Barry Jenkins and the Legacy Home Team know every corner of Chesapeake. Call (757) 816-4037.',
}

const stats = [
  ['Population', '260,000+'],
  ['Median Home Price', '$340,000', 'accent'],
  ['Avg. Days on Market', '32'],
  ['Land Area', '353 sq miles'],
  ['School Districts', 'Chesapeake Public Schools'],
  ['Notable Feature', 'Great Dismal Swamp NWR'],
  ['New Construction', 'Grassfield, Hickory, Western Branch'],
  ['Distance to Norfolk', '~20 min'],
  ['Distance to Virginia Beach', '~25 min'],
  ['Distance to Richmond', '~1.5 hrs'],
]

const neighborhoods = [
  { name: 'Greenbrier', type: 'Suburban · Established', desc: 'One of Chesapeake\'s most centrally located and well-established communities, with excellent access to I-64, top-rated schools, and a wide variety of shopping and dining.', price: 'From $300K' },
  { name: 'Great Bridge', type: 'Historic · Family', desc: 'A historic district and one of Chesapeake\'s most sought-after neighborhoods — known for its excellent schools, community events, and walkable charm near the Intracoastal Waterway.', price: 'From $320K' },
  { name: 'Western Branch', type: 'Upscale · Waterfront', desc: 'Premium waterfront living along the Western Branch of the Elizabeth River, with large lots, executive homes, and easy access to downtown Chesapeake.', price: 'From $380K' },
  { name: 'Grassfield', type: 'New Construction · Growing', desc: 'One of Chesapeake\'s fastest-growing areas in the southern part of the city, featuring newer builds, top schools, and a family-friendly atmosphere with community amenities.', price: 'From $370K' },
  { name: 'Deep Creek', type: 'Waterfront · Affordable', desc: 'A waterfront community along the Deep Creek area of the Albemarle & Chesapeake Canal, popular with boating enthusiasts and families who want space at a lower price point.', price: 'From $270K' },
  { name: 'Indian River', type: 'Central · Diverse', desc: 'A diverse, well-established area in the heart of Chesapeake with easy access to both Norfolk and Virginia Beach — solid value with strong neighborhood feel.', price: 'From $285K' },
  { name: 'South Norfolk', type: 'Historic · Revitalizing', desc: 'One of Chesapeake\'s oldest communities undergoing an exciting revitalization. Affordable entry-level homes with walkable commercial corridors and strong community identity.', price: 'From $220K' },
  { name: 'Hickory', type: 'Rural · Spacious', desc: 'A sprawling semi-rural community in western Chesapeake known for large lots, privacy, new construction subdivisions, and a slower pace of life away from the city core.', price: 'From $360K' },
  { name: 'Butts Station', type: 'Rural · Equestrian', desc: 'A quiet, rural area in the western part of the city popular with equestrians and those wanting acreage — offers true country living while still within Chesapeake city limits.', price: 'From $400K' },
]

const highlights = [
  { icon: '🏫', title: 'Top-Ranked Public Schools', body: 'Chesapeake Public Schools consistently ranks as one of Virginia\'s best school systems. Grassfield, Great Bridge, and Oscar Smith High Schools are highly regarded for academics and athletics.' },
  { icon: '🌿', title: 'Great Dismal Swamp', body: 'Chesapeake borders the Great Dismal Swamp National Wildlife Refuge — 112,000 acres of preserved wilderness with hiking, kayaking, and bird watching just minutes from residential neighborhoods.' },
  { icon: '🏗️', title: 'Strong New Construction Market', body: 'Chesapeake offers more new construction options than almost any Hampton Roads city. Communities like Grassfield and Hickory have active builders delivering modern homes with contemporary floor plans.' },
  { icon: '💰', title: 'More Affordable Than VB or Norfolk', body: 'Chesapeake offers comparable school quality and suburban lifestyle to Virginia Beach at generally lower price points. Families consistently find more home for their budget here.' },
  { icon: '🚗', title: 'Excellent Regional Access', body: 'With I-64, I-264, and Route 168 running through the city, Chesapeake provides easy access to Norfolk, Virginia Beach, Suffolk, and North Carolina — making it a strategic hub for commuters.' },
  { icon: '📈', title: 'Consistent Market Appreciation', body: 'Chesapeake\'s diverse economy and strong school reputation keep demand steady. The city has experienced consistent home value appreciation across multiple market cycles.' },
]

const faqs = [
  { q: 'What is the average home price in Chesapeake?', a: 'The median home price in Chesapeake is around $340,000 as of 2025, with a range from affordable South Norfolk entry-level homes starting under $250K to executive waterfront estates in Western Branch exceeding $700K.' },
  { q: 'How are Chesapeake schools rated?', a: 'Chesapeake Public Schools is consistently rated among Virginia\'s top school systems. High schools like Grassfield, Great Bridge, and Indian River are highly regarded for academics, sports, and extracurriculars. School assignment depends on address — always verify before buying.' },
  { q: 'Is Chesapeake a good place to raise a family?', a: 'Absolutely. Chesapeake is consistently ranked one of the best places to live in Virginia and the mid-Atlantic region. The combination of top schools, low crime in most neighborhoods, affordable housing, and access to nature makes it extremely family-friendly.' },
  { q: 'What is the difference between Chesapeake and Virginia Beach?', a: 'Both cities are part of Hampton Roads and have excellent schools and suburban neighborhoods. Virginia Beach has the Atlantic Ocean and resort strip. Chesapeake is generally more affordable, has more new construction options, and offers a quieter, more spacious lifestyle. Many families choose Chesapeake for the school quality at a lower price point.' },
  { q: 'Where is the best area to buy in Chesapeake?', a: 'It depends on your priorities. Greenbrier is ideal for central location and convenience. Great Bridge for top schools and community character. Western Branch for waterfront luxury. Grassfield and Hickory for newer construction and space. South Norfolk for affordability and revitalization upside.' },
  { q: 'How competitive is the Chesapeake real estate market?', a: 'Chesapeake is moderately competitive. Well-priced homes in Great Bridge and Grassfield can move in 2-3 weeks. The market is generally less frenzied than Virginia Beach, giving buyers a bit more time — but pricing right still matters for sellers.' },
  { q: 'Does Chesapeake have good access to nature and outdoors?', a: 'Yes — Chesapeake borders the Great Dismal Swamp (112,000+ acres), has multiple city parks, and is within easy reach of the Albemarle & Chesapeake Canal for boating. The Northwest River Park and Chesapeake Arboretum are popular local spots.' },
]

const hoaData = {
  intro: "Chesapeake's HOA landscape reflects its mix of older established neighborhoods and newer master-planned communities. Many traditional areas were built without HOAs, while newer subdivisions in Grassfield and Hickory carry modest community fees that fund shared amenities and common area maintenance.",
  fees: [
    { neighborhood: 'Great Bridge (historic areas)', monthly: 'None / Voluntary' },
    { neighborhood: 'South Norfolk', monthly: 'None' },
    { neighborhood: 'Greenbrier (established areas)', monthly: 'None / Minimal' },
    { neighborhood: 'Deep Creek waterfront communities', monthly: '$30–$60/mo' },
    { neighborhood: 'Western Branch', monthly: '$25–$75/mo', highlight: true },
    { neighborhood: 'Hickory (newer construction)', monthly: '$35–$80/mo', highlight: true },
    { neighborhood: 'Grassfield (newer subdivisions)', monthly: '$40–$90/mo', highlight: true },
  ],
  covers: [
    'Common area landscaping and upkeep',
    'Community pond and stormwater basin maintenance',
    'Neighborhood entrance monuments and signage',
    'Street lighting in shared community areas',
    'Architectural review and covenant enforcement',
    'Reserve fund contributions for long-term repairs',
  ],
  note: 'HOA fees vary by subdivision within each neighborhood. Some areas of Chesapeake have no HOA whatsoever. Always verify current fees directly with the management company or HOA board before purchasing any property.',
}

const nearbyData = {
  subtitle: 'How Chesapeake compares to neighboring Hampton Roads communities.',
  nearby: [
    { name: 'Virginia Beach', slug: 'virginia-beach', startingPrice: 'From $280K', why: 'Atlantic beach access, resort amenities, and a highly diversified housing market ranging from oceanfront condos to large suburban estates with excellent schools.' },
    { name: 'Suffolk', slug: 'suffolk', startingPrice: 'From $260K', why: "Adjacent city with similar suburban space and generally lower price points. Large lots, rural character, and master-planned communities for buyers who want more land." },
    { name: 'Norfolk', slug: 'norfolk', startingPrice: 'From $185K', why: "Urban core of Hampton Roads — compact, walkable, and the most affordable homeownership entry point in the region with strong investment upside." },
  ],
}

const newConstructionData = {
  subtitle: 'Chesapeake is the most active new construction market in Hampton Roads — with multiple builders delivering product across Grassfield, Hickory, and Western Branch.',
  builders: [
    {
      name: 'Ryan Homes',
      communities: 'Grassfield · Hickory · Western Branch',
      sqftRange: '1,800–3,600 sq ft',
      startingPrice: 'From $370K',
      desc: "Hampton Roads' most active production builder. Family-focused floor plans in Chesapeake's fastest-growing communities with quick-move-in inventory and flexible options.",
      searchUrl: 'https://search.buyingva.com/search?s[locations][0][city]=Chesapeake&s[locations][0][state]=VA',
    },
    {
      name: 'Lennar',
      communities: 'West Landing · Hickory',
      sqftRange: '2,000–4,000 sq ft',
      startingPrice: 'From $420K',
      desc: "Everything's Included® model delivers smart home technology and premium finishes as standard. Active in Chesapeake's western growth areas with larger lot configurations.",
      searchUrl: 'https://search.buyingva.com/search?s[locations][0][city]=Chesapeake&s[locations][0][state]=VA',
    },
    {
      name: 'D.R. Horton',
      communities: 'Western Branch Area',
      sqftRange: '1,600–2,800 sq ft',
      startingPrice: 'From $340K',
      desc: "America's largest builder delivers entry-level and first move-up product in Western Branch. The Express Homes line offers the most accessible new construction price points in Chesapeake.",
      searchUrl: 'https://search.buyingva.com/search?s[locations][0][city]=Chesapeake&s[locations][0][state]=VA',
    },
    {
      name: 'Stanley Martin Homes',
      communities: 'Premium Chesapeake Communities',
      sqftRange: '2,200–4,200 sq ft',
      startingPrice: 'From $480K',
      desc: 'Move-up and luxury product with flexible floor plans and full design center customization. Strong presence in Chesapeake\'s premium communities with excellent resale performance.',
      searchUrl: 'https://search.buyingva.com/search?s[locations][0][city]=Chesapeake&s[locations][0][state]=VA',
    },
    {
      name: 'HHHunt Homes',
      communities: 'North & Central Chesapeake',
      sqftRange: '1,800–3,200 sq ft',
      startingPrice: 'From $390K',
      desc: 'Regional builder known for quality construction and strong community amenity packages. Communities across Chesapeake with a reputation for delivering well-built, well-designed homes.',
      searchUrl: 'https://search.buyingva.com/search?s[locations][0][city]=Chesapeake&s[locations][0][state]=VA',
    },
  ],
}

export default async function ChesapeakePage() {
  const latestReport = await getLatestMarketReport('chesapeake')

  return (
    <main>
      {/* BREADCRUMB */}
      <div className="breadcrumb">
        <div className="breadcrumb-inner">
          <Link href="/">Home</Link>
          <span className="breadcrumb-sep">›</span>
          <span>Communities</span>
          <span className="breadcrumb-sep">›</span>
          <span>Chesapeake</span>
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
        background: '#0a1628',
      }}>
        <img
          src="/Cheseapeak.jpg"
          alt="Chesapeake Virginia neighborhood"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 100%)' }} />
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            Hampton Roads, Virginia
          </p>
          <h1 style={{ color: '#fff', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16 }}>
            Chesapeake<br />Homes For Sale
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 17, maxWidth: 560, marginBottom: 40, lineHeight: 1.7 }}>
            Virginia&apos;s top-rated school systems, room to breathe, and a quality of life that keeps families planting roots for generations.
          </p>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            {[['800+', 'Active Listings'], ['$340K', 'Median Price'], ['32', 'Avg. Days on Market'], ['353', 'Square Miles']].map(([num, lbl]) => (
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
            <h2>Where is Chesapeake?</h2>
            <p>Located south of Norfolk and west of Virginia Beach — Chesapeake is the geographic heart of Hampton Roads, connecting all major cities in the region.</p>
          </div>
          <div style={{ height: 420, borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
            <CommunityMapWrapper
              id="chesapeake"
              name="Chesapeake, VA"
              subtitle="Hampton Roads · South Hampton Roads"
              center={[-76.29, 36.77]}
              zoom={10}
              boundary={[
                [-76.55, 36.90], [-76.02, 36.90], [-76.02, 36.67],
                [-76.15, 36.55], [-76.55, 36.55], [-76.55, 36.90],
              ]}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginTop: 24 }}>
            {[
              { time: '~20 min', dest: 'to Norfolk', route: 'via I-64 E' },
              { time: '~25 min', dest: 'to Virginia Beach', route: 'via I-64 E' },
              { time: '~35 min', dest: 'to Suffolk', route: 'via US-13 W' },
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
            <h2>New Chesapeake Listings</h2>
            <p>The latest homes for sale in Chesapeake — houses, townhomes, and new construction updated daily from the MLS.</p>
          </div>
          <div className="ylopo-wrap">
            <div className="YLOPO_resultsWidget" data-search='{"locations":[{"city":"Chesapeake","state":"VA"}],"propertyTypes":["house","condo","townhouse"],"minPrice":200000,"limit":12,"sortBy":"listDate","sortOrder":"desc"}' />
          </div>
          <p className="ylopo-note">Listing data sourced from regional MLS. Information deemed reliable but not guaranteed. Updated daily.</p>
          <div className="listings-actions">
            <a href="https://search.buyingva.com/search?s[orderBy]=sourceCreationDate%2Cdesc&s[page]=1&s[locations][0][city]=Chesapeake&s[locations][0][state]=VA" target="_blank" rel="noopener noreferrer" className="btn-primary">
              View All Chesapeake Listings →
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
              <h2 style={{ marginBottom: 24 }}>Chesapeake: Virginia&apos;s Most Underrated City</h2>
              <p style={{ marginBottom: 16 }}>Chesapeake doesn&apos;t get the headlines that Virginia Beach does — and that&apos;s exactly why so many savvy buyers end up here. This is a city that consistently ranks among Virginia&apos;s best for quality of life, school performance, and livability, yet home prices remain notably lower than its coastal neighbor to the east.</p>
              <p style={{ marginBottom: 16 }}>Barry Jenkins has helped dozens of families make the move to Chesapeake — and the story is almost always the same. They started looking at Virginia Beach, discovered they could get more square footage, a larger lot, and just as good (or better) schools in Chesapeake, and never looked back.</p>
              <p style={{ marginBottom: 16 }}>The city&apos;s character varies dramatically by area. The Greenbrier corridor is bustling and convenient. Great Bridge feels like a small town with big-city schools. Hickory and the western sections offer semi-rural privacy. Deep Creek has a waterfront lifestyle without the resort-strip price tag.</p>
              <p>Whatever your priorities — schools, space, community, nature, or value — Chesapeake has a neighborhood that fits.</p>
            </div>
            <div>
              <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '28px 32px', marginBottom: 20 }}>
                <h3 style={{ marginBottom: 20 }}>Chesapeake At a Glance</h3>
                {stats.map(([label, value, cls]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: cls === 'accent' ? 'var(--accent)' : 'var(--text)' }}>{value}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: 'var(--accent)', borderRadius: 'var(--radius-xl)', padding: '28px 32px' }}>
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15, marginBottom: 20, lineHeight: 1.7 }}>
                  Ready to explore Chesapeake? Barry will help you find the right neighborhood for your family and budget.
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
            <span className="section-label">Why Chesapeake</span>
            <h2>Why Families Choose Chesapeake</h2>
            <p>Top schools, affordable prices, and room to grow — here&apos;s what drives consistent demand in this market.</p>
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
            <h2>Find Your Chesapeake Neighborhood</h2>
            <p>From waterfront communities to new construction — Chesapeake has a neighborhood for every lifestyle and budget.</p>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }}>
            <div>
              <img
                src="/Cheseapeak.jpg"
                alt="Chesapeake outdoor lifestyle"
                style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 'var(--radius-xl)' }}
              />
            </div>
            <div>
              <span className="section-label">Nature & Community</span>
              <div style={{ width: 40, height: 3, background: 'var(--accent)', margin: '12px 0 24px', borderRadius: 2 }} />
              <h2 style={{ marginBottom: 20 }}>Where Suburbs Meet Southern Nature</h2>
              <p style={{ marginBottom: 16 }}>Chesapeake is unique in Hampton Roads — it&apos;s a city that feels like a collection of small towns, each with its own character, surrounded by remarkable natural assets you won&apos;t find in its more urbanized neighbors.</p>
              <p style={{ marginBottom: 24 }}>The Great Dismal Swamp alone is extraordinary — 112,000 acres of federally protected wilderness right in the city&apos;s backyard. Add in the Albemarle & Chesapeake Canal, multiple city parks, and proximity to North Carolina&apos;s Outer Banks, and outdoor enthusiasts are very well served.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  'Great Dismal Swamp NWR — 112,000 acres of hiking, kayaking, and wildlife watching',
                  'Northwest River Park — 763-acre park with camping, canoe trails, and natural playgrounds',
                  'Chesapeake Arboretum — 48 acres of botanical gardens and peaceful walking paths',
                  'Albemarle & Chesapeake Canal — historic waterway for kayaking and boating',
                  'Outer Banks proximity — NC beaches within 90 minutes via Route 168',
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
            <h2>Chesapeake Public Schools</h2>
            <p>One of Virginia&apos;s highest-ranked school systems — consistently earning top marks for academics, athletics, and student outcomes.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            {[
              {
                group: 'Notable High Schools',
                schools: [
                  ['Grassfield High School', '9–12 · Top-Ranked Academics'],
                  ['Great Bridge High School', '9–12 · Strong Athletics'],
                  ['Indian River High School', '9–12 · IB Programme'],
                  ['Oscar Smith High School', '9–12 · Large Diverse Campus'],
                  ['Western Branch High School', '9–12 · STEM Focus'],
                ],
              },
              {
                group: 'Private & Independent',
                schools: [
                  ['Norfolk Academy', '1–12 · Top-Ranked Private'],
                  ['Cape Henry Collegiate', 'PreK–12 · College Prep'],
                  ['Chesapeake Christian School', 'K–12 · Faith-Based'],
                  ['Bishop Sullivan Catholic', '9–12 · Catholic'],
                  ['Norfolk Christian School', 'K–12 · Christian'],
                ],
              },
              {
                group: 'Higher Education',
                schools: [
                  ['Old Dominion University', 'Major Research University · Norfolk'],
                  ['Tidewater Community College', 'Multi-Campus · Chesapeake Campus'],
                  ['Regent University', 'Private Christian University · VB'],
                  ['Norfolk State University', 'HBCU · Norfolk'],
                  ['Virginia Wesleyan University', 'Liberal Arts · Norfolk'],
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
            <strong style={{ color: 'var(--text)' }}>School Assignment Note:</strong> School zones vary by address. Always confirm your specific zoning with Chesapeake Public Schools before purchasing.
          </div>
        </div>
      </section>

      {/* HOA */}
      <CommunityHOA city="Chesapeake" {...hoaData} />

      {/* NEW CONSTRUCTION */}
      <CommunityNewConstruction city="Chesapeake" {...newConstructionData} />

      {/* COMPARISONS */}
      <CommunityComparisons city="Chesapeake" {...nearbyData} />

      {/* MARKET TRENDS */}
      <section id="market">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Market Data</span>
            <h2>Chesapeake Market Trends</h2>
            <p>Live market data updated weekly — median prices, inventory levels, and market conditions in real time.</p>
          </div>
          {latestReport && (
            <div style={{ marginBottom: 24, padding: '20px 24px', background: '#f0f4ff', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2563eb', marginBottom: 6 }}>Latest Market Report</div>
                <div style={{ fontWeight: 700, fontSize: 17, color: '#1a1a1a', marginBottom: 4 }}>{latestReport.communityName} — {latestReport.reportPeriod}</div>
                {latestReport.medianListPrice && <div style={{ fontSize: 14, fontWeight: 600, color: '#2563eb', marginBottom: 4 }}>{latestReport.medianListPrice}</div>}
                {latestReport.marketSummary && <p style={{ fontSize: 14, color: '#555550', margin: 0 }}>{latestReport.marketSummary.slice(0, 120)}…</p>}
              </div>
              <a href={`/market-reports/${latestReport.slug}`} style={{ display: 'inline-block', background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 14, padding: '10px 20px', borderRadius: 8, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                Read Full Report →
              </a>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <iframe
              src="https://altos.re/html/s-html/d0698a30-2b4f-41d2-be37-018147dd9d8c?scale=1&marketNarrative=true&houses=true&weeklyChange=true&branding=true&size=medium"
              style={{ border: 0, display: 'block', width: 480, maxWidth: '100%', height: 600 }}
              scrolling="auto"
              loading="lazy"
              title="Chesapeake Market Trends"
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <CommunityFAQ
        title="Chesapeake Real Estate FAQs"
        subtitle="Common questions from buyers and sellers navigating the Chesapeake market."
        faqs={faqs}
      />

      {/* CTA */}
      <section id="cta" style={{ background: 'var(--accent)', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: 640 }}>
          <h2 style={{ color: '#fff', marginBottom: 16 }}>Ready to Find Your Chesapeake Home?</h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 17, marginBottom: 36 }}>
            Barry Jenkins and the Legacy Home Team have over a decade of Hampton Roads market experience. Let&apos;s find the right Chesapeake neighborhood for your goals.
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
