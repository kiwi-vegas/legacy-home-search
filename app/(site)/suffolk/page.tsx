import type { Metadata } from 'next'
import Link from 'next/link'
import CommunityFAQ from '@/components/CommunityFAQ'
import CommunityMapWrapper from '@/components/CommunityMapWrapper'
import CommunityHOA from '@/components/CommunityHOA'
import CommunityComparisons from '@/components/CommunityComparisons'
import CommunityNewConstruction from '@/components/CommunityNewConstruction'
import { getLatestMarketReport } from '@/sanity/queries'

export const metadata: Metadata = {
  title: 'Suffolk Homes For Sale | Legacy Home Team',
  description: "Search Suffolk VA homes for sale. Virginia's fastest-growing city — country estates, waterfront living, and room to grow. Barry Jenkins and the Legacy Home Team. Call (757) 816-4037.",
}

const stats = [
  ['Population', '95,000+'],
  ['Median Home Price', '$340,000', 'accent'],
  ['Avg. Days on Market', '35'],
  ['Land Area', "Virginia's Largest City by Area"],
  ['School Districts', 'Suffolk Public Schools'],
  ['Notable Area', 'Harbour View Waterfront District'],
  ['Growth', 'Among VA\'s Fastest-Growing Cities'],
  ['Distance to Norfolk', '~35 min'],
  ['Distance to Chesapeake', '~30 min'],
  ['Distance to Richmond', '~1.5 hrs'],
]

const neighborhoods = [
  { name: 'Harbour View', type: 'Waterfront · Master-Planned', desc: 'The crown jewel of Suffolk real estate — a master-planned waterfront community along the Nansemond River with upscale homes, marina access, golf course, and resort-style amenities. The fastest-growing area of Suffolk.', price: 'From $400K' },
  { name: 'Bennetts Creek', type: 'Waterfront · Established', desc: 'An established waterfront community with beautiful homes along Bennetts Creek — popular with boaters and families who want direct water access and a quieter pace of life.', price: 'From $380K' },
  { name: 'Westhaven', type: 'Suburban · Family', desc: 'A newer suburban community in northern Suffolk with single-family homes, planned amenities, and easy access to Route 17 for commuters heading toward Hampton or Newport News.', price: 'From $340K' },
  { name: "Downtown Suffolk", type: 'Historic · Revitalizing', desc: 'The historic core of the city, featuring pre-war homes, walkable streets, and a thriving arts and dining scene as the city invests heavily in downtown revitalization.', price: 'From $250K' },
  { name: 'Driver', type: 'Rural · Spacious', desc: 'A semi-rural community in northern Suffolk with large lots, agricultural character, and a genuine country feel — perfect for buyers who want acreage and privacy within city limits.', price: 'From $310K' },
  { name: 'Chuckatuck', type: 'Rural · Historic', desc: 'One of Suffolk\'s oldest communities, Chuckatuck offers a quiet, historic village atmosphere with colonial-era character, large lots, and proximity to both the Nansemond River and the Dismal Swamp.', price: 'From $280K' },
  { name: "Constant's Wharf", type: 'Waterfront · Luxury', desc: 'An exclusive waterfront enclave on the Nansemond River — one of Suffolk\'s most prestigious addresses, featuring executive homes, private docks, and stunning water views.', price: 'From $600K' },
  { name: 'Holland', type: 'Rural · Agricultural', desc: 'A rural community in the western part of Suffolk with farmland, large properties, and a genuine Southern rural character. Ideal for those wanting privacy, horses, or agricultural land.', price: 'From $290K' },
  { name: 'Riverview', type: 'Suburban · Growing', desc: 'A growing suburban neighborhood in northeastern Suffolk with newer construction homes, community feel, and solid access to Route 58 and the broader Hampton Roads highway network.', price: 'From $325K' },
]

const highlights = [
  { icon: '🌱', title: "Virginia's Fastest-Growing City", body: 'Suffolk is one of the fastest-growing cities in Virginia — driven by Harbour View development, Route 58 expansion, and families seeking space and value outside the denser coastal cities.' },
  { icon: '🏡', title: 'More Space for Your Money', body: 'Suffolk consistently offers more lot size and square footage per dollar than any other Hampton Roads city. A $400K home here buys significantly more property than the same budget in Virginia Beach or Chesapeake.' },
  { icon: '⛵', title: 'Nansemond River Waterfront', body: 'The Nansemond River and its tributaries give Suffolk genuine waterfront character — from Harbour View\'s marina community to the historic docks at Constant\'s Wharf and private properties with boat launches.' },
  { icon: '🌿', title: 'Great Dismal Swamp Access', body: 'Suffolk borders the Great Dismal Swamp National Wildlife Refuge — 112,000 acres of wilderness perfect for kayaking, hiking, bird watching, and true outdoor immersion just minutes from residential neighborhoods.' },
  { icon: '🚗', title: 'Strategic Regional Access', body: 'Route 58 and US-460 give Suffolk direct connections to Hampton Roads, Richmond, and North Carolina\'s Research Triangle Park — making it an increasingly popular choice for commuters and remote workers.' },
  { icon: '🏘️', title: 'New Construction Options', body: 'Suffolk has some of the region\'s best new construction inventory, particularly in Harbour View and Westhaven. Modern floor plans, energy efficiency, and builder warranties without the premium of Chesapeake or Virginia Beach.' },
]

const faqs = [
  { q: 'What is the average home price in Suffolk?', a: 'The median home price in Suffolk is around $340,000 as of 2025, with a wide range from historic downtown homes under $280K to luxury waterfront estates in Harbour View and Constant\'s Wharf exceeding $700K.' },
  { q: 'Is Suffolk a good place to live?', a: 'Absolutely — especially for families and individuals who value space, privacy, and a quieter pace of life without giving up access to Hampton Roads amenities. Suffolk is consistently growing in reputation and popularity as buyers discover how much value is available here.' },
  { q: 'How far is Suffolk from the beach?', a: 'Suffolk is roughly 40–50 minutes from Virginia Beach and about 1 hour from the Outer Banks of North Carolina. It\'s not a beachfront community, but its proximity to both the Nansemond River and major beach destinations makes it practical for beach lovers who want space at home.' },
  { q: 'Is Harbour View worth the premium?', a: 'For many buyers, yes. Harbour View offers a genuine resort-lifestyle community with marina access, golf, and upscale amenities that you simply won\'t find at this price point in Virginia Beach or Chesapeake. The master-planned community also tends to hold its value well due to HOA-maintained standards.' },
  { q: 'How are Suffolk Public Schools rated?', a: 'Suffolk Public Schools is a mid-tier school system that has been improving steadily. It\'s not at the level of Chesapeake or Virginia Beach schools, but the city is investing significantly in education. Families focused primarily on school rankings often choose Chesapeake; families who prioritize space and value often choose Suffolk.' },
  { q: 'What is the commute like from Suffolk?', a: 'Suffolk offers good highway access via Route 58, US-460, and I-664. Commutes to Norfolk run about 35 minutes, Chesapeake 25–30 minutes, and Hampton/Newport News via the Monitor-Merrimac Bridge-Tunnel about 40 minutes. Remote workers find Suffolk particularly appealing given its space and value advantages.' },
  { q: 'Is Suffolk a good place for boaters?', a: 'Yes — the Nansemond River system provides direct access to the James River and Hampton Roads harbor, making Suffolk a genuine boating community. Harbour View Marina, Constans Wharf, and numerous private docks along Bennetts Creek offer excellent boating access.' },
]

const hoaData = {
  intro: "Suffolk's large land area and mix of rural and master-planned communities means HOA presence varies significantly by location. Harbour View — one of the city's fastest-growing areas — carries the most active HOA structure. Rural and semi-rural areas in western Suffolk typically have no HOA at all.",
  fees: [
    { neighborhood: 'Rural western Suffolk / large lots', monthly: 'None' },
    { neighborhood: 'Sleepy Hole area', monthly: '$20–$50/mo' },
    { neighborhood: 'Saratoga / Camelot area', monthly: '$25–$60/mo' },
    { neighborhood: 'North Suffolk (newer subdivisions)', monthly: '$40–$90/mo', highlight: true },
    { neighborhood: 'Harbour View (master-planned)', monthly: '$75–$175/mo', highlight: true },
  ],
  covers: [
    'Common area landscaping and grounds maintenance',
    'Community pool and clubhouse access (Harbour View)',
    'Waterfront amenity and marina area maintenance',
    'Architectural standards review and enforcement',
    'Neighborhood entrance and monument maintenance',
    'Reserve fund contributions for capital improvements',
  ],
  note: "Suffolk has some of the region's most varied HOA structures — from highly-amenitized master-planned community fees to zero HOA on large rural parcels. Always confirm the specific HOA situation for any property before purchasing.",
}

const nearbyData = {
  subtitle: 'How Suffolk compares to neighboring Hampton Roads communities.',
  nearby: [
    { name: 'Chesapeake', slug: 'chesapeake', startingPrice: 'From $270K', why: 'More established neighborhoods, top-rated public schools, and stronger suburban infrastructure with easier access to Hampton Roads employment centers.' },
    { name: 'Virginia Beach', slug: 'virginia-beach', startingPrice: 'From $280K', why: 'Beach lifestyle, Atlantic coastline, and the highest concentration of military-friendly amenities, VA loan specialists, and resort-adjacent communities.' },
    { name: 'Isle of Wight County', slug: undefined, startingPrice: 'From $250K', why: "Rural neighbor to the west with even larger lots, true country character, and a quieter lifestyle — popular with buyers who want land beyond what Suffolk offers." },
  ],
}

const newConstructionData = {
  subtitle: 'Suffolk has active new construction primarily in the Harbour View corridor and North Suffolk growth areas.',
  builders: [
    {
      name: 'Ryan Homes',
      communities: 'Harbour View · North Suffolk',
      sqftRange: '1,700–3,200 sq ft',
      startingPrice: 'From $350K',
      desc: 'Highly active in Suffolk\'s fastest-growing corridors. Affordable family product with strong community amenities and quick-move-in availability in established master-planned communities.',
      searchUrl: 'https://search.buyingva.com/search?s[locations][0][city]=Suffolk&s[locations][0][state]=VA',
    },
    {
      name: 'HHHunt Homes',
      communities: 'North Suffolk Communities',
      sqftRange: '2,000–3,800 sq ft',
      startingPrice: 'From $400K',
      desc: 'Regional builder known for quality construction and community programming. Active in several North Suffolk master-planned developments with move-up product and comprehensive amenity packages.',
      searchUrl: 'https://search.buyingva.com/search?s[locations][0][city]=Suffolk&s[locations][0][state]=VA',
    },
    {
      name: 'Mungo Homes',
      communities: 'Harbour View · North Suffolk Corridor',
      sqftRange: '1,800–3,500 sq ft',
      startingPrice: 'From $330K',
      desc: 'Value-oriented regional builder with strong floor plan variety. Among the most competitively priced new construction options in the Suffolk market with solid construction quality.',
      searchUrl: 'https://search.buyingva.com/search?s[locations][0][city]=Suffolk&s[locations][0][state]=VA',
    },
    {
      name: 'Smith Douglas Homes',
      communities: 'Suffolk / Harbour View Area',
      sqftRange: '1,500–2,600 sq ft',
      startingPrice: 'From $310K',
      desc: 'Entry-level focused builder offering the most accessible new construction pricing in Suffolk. Customizable options and a streamlined buying process for first-time and first move-up buyers.',
      searchUrl: 'https://search.buyingva.com/search?s[locations][0][city]=Suffolk&s[locations][0][state]=VA',
    },
  ],
}

export default async function SuffolkPage() {
  const latestReport = await getLatestMarketReport('suffolk')

  return (
    <main>
      {/* BREADCRUMB */}
      <div className="breadcrumb">
        <div className="breadcrumb-inner">
          <Link href="/">Home</Link>
          <span className="breadcrumb-sep">›</span>
          <span>Communities</span>
          <span className="breadcrumb-sep">›</span>
          <span>Suffolk</span>
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
        background: '#0d1e0a',
      }}>
        <img
          src="/Sufolk.jpg"
          alt="Suffolk Virginia luxury home"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 100%)' }} />
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            Hampton Roads, Virginia
          </p>
          <h1 style={{ color: '#fff', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16 }}>
            Suffolk<br />Homes For Sale
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 17, maxWidth: 560, marginBottom: 40, lineHeight: 1.7 }}>
            More space, more privacy, and genuine waterfront living — Suffolk is where Hampton Roads families come when they want room to grow.
          </p>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            {[['400+', 'Active Listings'], ['$340K', 'Median Price'], ['35', 'Avg. Days on Market'], ['430', 'Sq Miles of Land']].map(([num, lbl]) => (
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
            <h2>Where is Suffolk?</h2>
            <p>Suffolk lies west of Chesapeake and south of the James River — Virginia&apos;s largest city by land area, stretching from the Nansemond River to the North Carolina border.</p>
          </div>
          <div style={{ height: 420, borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
            <CommunityMapWrapper
              id="suffolk"
              name="Suffolk, VA"
              subtitle="Hampton Roads · Western Hampton Roads"
              center={[-76.60, 36.73]}
              zoom={10}
              boundary={[
                [-76.92, 36.95], [-76.38, 36.95], [-76.38, 36.55],
                [-76.92, 36.55], [-76.92, 36.95],
              ]}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginTop: 24 }}>
            {[
              { time: '~30 min', dest: 'to Chesapeake', route: 'via US-13 E' },
              { time: '~35 min', dest: 'to Norfolk', route: 'via I-664 E' },
              { time: '~45 min', dest: 'to Virginia Beach', route: 'via I-64 E' },
              { time: '~1.5 hrs', dest: 'to Richmond', route: 'via US-460 W' },
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
            <h2>New Suffolk Listings</h2>
            <p>The latest homes for sale in Suffolk — from waterfront estates to new construction communities, updated daily from the MLS.</p>
          </div>
          <div className="ylopo-wrap">
            <div className="YLOPO_resultsWidget" data-search='{"locations":[{"city":"Suffolk","state":"VA"}],"propertyTypes":["house","condo","townhouse"],"minPrice":200000,"limit":12,"sortBy":"listDate","sortOrder":"desc"}' />
          </div>
          <p className="ylopo-note">Listing data sourced from regional MLS. Information deemed reliable but not guaranteed. Updated daily.</p>
          <div className="listings-actions">
            <a href="https://search.buyingva.com/search?s[orderBy]=sourceCreationDate%2Cdesc&s[page]=1&s[locations][0][city]=Suffolk&s[locations][0][state]=VA" target="_blank" rel="noopener noreferrer" className="btn-primary">
              View All Suffolk Listings →
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
              <h2 style={{ marginBottom: 24 }}>Suffolk: Where Hampton Roads Spreads Out</h2>
              <p style={{ marginBottom: 16 }}>Suffolk is technically the largest city in Virginia by land area — 430 square miles that encompass everything from the waterfront luxury of Harbour View to genuine farmland in the western sections. For families who have been priced out of Chesapeake or Virginia Beach but don&apos;t want to sacrifice quality of life, Suffolk is increasingly the answer.</p>
              <p style={{ marginBottom: 16 }}>Barry Jenkins has watched Suffolk transform over the past decade. Harbour View alone has shifted the perception of the city — what was once seen purely as a rural outpost now has a master-planned waterfront community that competes with anything in Hampton Roads on amenities and lifestyle quality.</p>
              <p style={{ marginBottom: 16 }}>The growth story in Suffolk is compelling. Route 58 improvements, new commercial development along the Harbour View corridor, and increasing employer presence have made the western Hampton Roads corridor a genuine growth destination. Buyers who got in early have seen strong appreciation.</p>
              <p>Whether you want a waterfront estate, a large rural lot, a new construction home in a planned community, or an affordable historic property in downtown Suffolk — this city delivers diversity that its size commands.</p>
            </div>
            <div>
              <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '28px 32px', marginBottom: 20 }}>
                <h3 style={{ marginBottom: 20 }}>Suffolk At a Glance</h3>
                {stats.map(([label, value, cls]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: cls === 'accent' ? 'var(--accent)' : 'var(--text)' }}>{value}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: 'var(--accent)', borderRadius: 'var(--radius-xl)', padding: '28px 32px' }}>
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15, marginBottom: 20, lineHeight: 1.7 }}>
                  Ready to explore Suffolk? Barry will help you find the right neighborhood for your space and lifestyle goals.
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
            <span className="section-label">Why Suffolk</span>
            <h2>Why Families Choose Suffolk</h2>
            <p>Space, value, waterfront living, and growth potential — here&apos;s what makes Suffolk one of Hampton Roads&apos;s most exciting markets.</p>
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
            <h2>Find Your Suffolk Neighborhood</h2>
            <p>From the waterfront luxury of Harbour View to the privacy of rural western Suffolk — there&apos;s a neighborhood for every lifestyle.</p>
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
                src="/Sufolk.jpg"
                alt="Suffolk waterfront and nature"
                style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 'var(--radius-xl)' }}
              />
            </div>
            <div>
              <span className="section-label">Space & Nature</span>
              <div style={{ width: 40, height: 3, background: 'var(--accent)', margin: '12px 0 24px', borderRadius: 2 }} />
              <h2 style={{ marginBottom: 20 }}>Room to Breathe in Every Direction</h2>
              <p style={{ marginBottom: 16 }}>Suffolk is what Hampton Roads looks like when you have room — large lots, navigable waterways, preserved wilderness, and the kind of privacy that simply isn&apos;t available in the denser cities to the east.</p>
              <p style={{ marginBottom: 24 }}>The Nansemond River alone offers miles of boating, fishing, and kayaking. Add the Great Dismal Swamp on the southern border, Northwest River Park nearby in Chesapeake, and the Outer Banks within 90 minutes, and outdoor enthusiasts never run out of options.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  'Harbour View Marina — full-service marina with boat slips, fuel dock, and waterfront dining',
                  'Great Dismal Swamp NWR — 112,000-acre wilderness refuge on the southern border',
                  'Lake Meade — a local recreational lake for fishing, kayaking, and family outings',
                  'Bennett\'s Creek Park — 200+ acres of wooded trails, water access, and picnic areas',
                  'Outer Banks proximity — NC beach access via Route 168 in about 90 minutes',
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
            <h2>Suffolk Public Schools</h2>
            <p>Suffolk Public Schools serves the city&apos;s growing population with a range of academic programs and improving outcomes.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            {[
              {
                group: 'Notable High Schools',
                schools: [
                  ['Nansemond River High School', '9–12 · Harbour View Area'],
                  ['King\'s Fork High School', '9–12 · Central Suffolk'],
                  ['Lakeland High School', '9–12 · Eastern Suffolk'],
                  ['Forest Glen Middle School', 'Feeder to Nansemond River'],
                  ['John Yeates Middle School', 'Feeder to King\'s Fork'],
                ],
              },
              {
                group: 'Private & Independent',
                schools: [
                  ['Tidewater Academy', 'K–12 · Private Academy'],
                  ['Suffolk Christian Academy', 'PreK–12 · Faith-Based'],
                  ['Cape Henry Collegiate', 'PreK–12 · Virginia Beach'],
                  ['Norfolk Academy', '1–12 · Top-Ranked Private · Norfolk'],
                  ['Chesapeake Christian School', 'K–12 · Chesapeake'],
                ],
              },
              {
                group: 'Higher Education',
                schools: [
                  ['Old Dominion University', 'Research University · Norfolk (30 min)'],
                  ['Tidewater Community College', 'Multi-Campus · Norfolk/Chesapeake'],
                  ['Regent University', 'Private University · Virginia Beach'],
                  ['Virginia Wesleyan University', 'Liberal Arts · Norfolk'],
                  ['Norfolk State University', 'HBCU · Norfolk'],
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

      {/* HOA */}
      <CommunityHOA city="Suffolk" {...hoaData} />

      {/* NEW CONSTRUCTION */}
      <CommunityNewConstruction city="Suffolk" {...newConstructionData} />

      {/* COMPARISONS */}
      <CommunityComparisons city="Suffolk" {...nearbyData} />

      {/* MARKET TRENDS */}
      <section id="market">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Market Data</span>
            <h2>Suffolk Market Trends</h2>
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
              src="https://altos.re/html/s-html/7ca30f29-6763-4266-85e3-9c4292b1c25c?scale=1&marketNarrative=true&houses=true&weeklyChange=true&branding=true&size=large"
              style={{ border: 0, display: 'block', width: 640, maxWidth: '100%', height: 800 }}
              scrolling="auto"
              loading="lazy"
              title="Suffolk Market Trends"
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <CommunityFAQ
        title="Suffolk Real Estate FAQs"
        subtitle="Common questions from buyers and sellers navigating the Suffolk market."
        faqs={faqs}
      />

      {/* CTA */}
      <section id="cta" style={{ background: 'var(--accent)', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: 640 }}>
          <h2 style={{ color: '#fff', marginBottom: 16 }}>Ready to Find Your Suffolk Home?</h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 17, marginBottom: 36 }}>
            Barry Jenkins and the Legacy Home Team know Suffolk&apos;s diverse neighborhoods — from Harbour View waterfront to quiet rural estates. Let&apos;s find the right fit for your goals.
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
