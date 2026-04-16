import type { Metadata } from 'next'
import Link from 'next/link'
import CommunityFAQ from '@/components/CommunityFAQ'
import CommunityMapWrapper from '@/components/CommunityMapWrapper'
import CommunityHOA from '@/components/CommunityHOA'
import CommunityComparisons from '@/components/CommunityComparisons'
import CommunityNewConstruction from '@/components/CommunityNewConstruction'
import { getLatestMarketReport } from '@/sanity/queries'

export const metadata: Metadata = {
  title: 'Norfolk Homes For Sale | Legacy Home Team',
  description: 'Search Norfolk VA homes for sale. Historic neighborhoods, world-class waterfront, Naval Station Norfolk — Barry Jenkins and the Legacy Home Team know every corner of Norfolk. Call (757) 816-4037.',
}

const stats = [
  ['Population', '245,000+'],
  ['Median Home Price', '$295,000', 'accent'],
  ['Avg. Days on Market', '25'],
  ['Naval Station Norfolk', "World's Largest Naval Base"],
  ['School Districts', 'Norfolk Public Schools'],
  ['Notable University', 'Old Dominion University'],
  ['Waterfront Miles', 'Elizabeth River & Chesapeake Bay'],
  ['Distance to Virginia Beach', '~20 min'],
  ['Distance to Chesapeake', '~15 min'],
  ['Distance to DC', '~3.5 hrs'],
]

const neighborhoods = [
  { name: 'Ghent', type: 'Historic · Walkable · Arts', desc: 'Norfolk\'s most vibrant and sought-after neighborhood — Victorian homes, independent restaurants, boutique shops, and Chrysler Museum of Art all within walking distance. The crown jewel of urban Norfolk.', price: 'From $300K' },
  { name: 'Ocean View', type: 'Waterfront · Beach Access', desc: 'A bayside community along the Chesapeake Bay with direct beach access, a lively marina district, and a range of housing from affordable cottages to executive waterfront homes.', price: 'From $250K' },
  { name: 'Larchmont', type: 'Established · Family', desc: 'One of Norfolk\'s most stable and beloved residential neighborhoods — tree-lined streets, brick Colonials, and a strong community identity just minutes from ODU and downtown.', price: 'From $310K' },
  { name: 'Colonial Place', type: 'Charming · Historic', desc: 'A historic early-20th century neighborhood with character-rich homes, brick streets, and a tight-knit community feel. Popular with young professionals and families who want history and charm.', price: 'From $280K' },
  { name: 'Wards Corner', type: 'Convenient · Diverse', desc: 'A diverse and centrally located neighborhood in northern Norfolk with easy access to I-64, shopping centers, and a variety of housing stock at accessible price points.', price: 'From $220K' },
  { name: "Park Place / ODU Area", type: 'Urban · Investment', desc: 'Close to Old Dominion University and downtown Norfolk, Park Place offers affordable homes with strong rental demand — popular with investors and first-time buyers alike.', price: 'From $200K' },
  { name: 'Berkley', type: 'Waterfront · Revitalizing', desc: 'A historic waterfront neighborhood on the southern bank of the Elizabeth River undergoing significant reinvestment. Excellent water views, affordable entry points, and strong upside potential.', price: 'From $185K' },
  { name: 'Downtown Norfolk', type: 'Urban · Condos', desc: 'Condos and lofts in the heart of the city — walking distance to Waterside District, MacArthur Center, Norfolk Scope, and the entire waterfront entertainment corridor.', price: 'From $185K' },
  { name: 'Talbot Park', type: 'Suburban · Stable', desc: 'A solid, well-established neighborhood in the heart of Norfolk with good schools, a strong community association, and consistent home values. Great for families and military families alike.', price: 'From $265K' },
]

const highlights = [
  { icon: '⚓', title: "World's Largest Naval Base", body: 'Naval Station Norfolk is the largest naval installation in the world, driving constant relocation demand, stable employment, and a deep military community that shapes the entire city.' },
  { icon: '🎨', title: 'Ghent Arts & Culture District', body: 'Ghent is one of the most walkable, culturally rich neighborhoods in all of Hampton Roads — with the Chrysler Museum, NARO Cinema, independent restaurants, and a vibrant arts scene.' },
  { icon: '🌊', title: 'Elizabeth River Waterfront', body: 'The revitalized Waterside District on the Elizabeth River offers dining, entertainment, and waterfront access that has transformed downtown Norfolk into a genuine destination.' },
  { icon: '🎓', title: 'Old Dominion University', body: 'ODU brings 24,000 students and thousands of faculty and staff to the city, supporting rental demand, local restaurants, and a consistent energy that makes Norfolk feel young and dynamic.' },
  { icon: '💰', title: 'Most Affordable Urban Market', body: 'Norfolk offers Hampton Roads\'s most affordable urban homeownership — with Ghent-adjacent neighborhoods starting well under $300K and genuine waterfront access starting around $250K.' },
  { icon: '🚢', title: 'Thriving Port Economy', body: 'The Port of Virginia (Norfolk International Terminals) is one of the busiest on the East Coast, providing civilian employment and economic stability that complements the military presence.' },
]

const faqs = [
  { q: 'What is the average home price in Norfolk?', a: 'The median home price in Norfolk is around $295,000 as of 2025 — making it the most affordable urban market in Hampton Roads. Prices range from under $200K in emerging neighborhoods to $600K+ for waterfront properties and Ghent Victorians.' },
  { q: 'Is Norfolk safe to live in?', a: 'Like any urban city, Norfolk has neighborhoods that vary significantly in character. Ghent, Larchmont, Colonial Place, Talbot Park, and Ocean View are all established, well-regarded areas. Barry knows these neighborhoods well and will always give you an honest assessment of any specific area you\'re considering.' },
  { q: 'Is Norfolk a good investment?', a: 'Norfolk has strong investment fundamentals — the military base ensures consistent rental demand, ODU provides student rental market depth, and waterfront neighborhoods like Berkley and Ocean View have significant appreciation upside as the city continues its revitalization.' },
  { q: 'What makes Ghent special?', a: 'Ghent is the rare combination of walkability, historic architecture, independent dining and retail, arts institutions (Chrysler Museum), and consistent property values. It\'s the most desirable neighborhood in Norfolk for professionals and families who want an urban lifestyle without sacrificing quality.' },
  { q: 'Is Norfolk good for military families?', a: 'Absolutely. Norfolk has one of the highest concentrations of military families in the country. VA loans are the norm, the community understands military life, and the combination of Naval Station Norfolk, Little Creek, and civilian contractors means there\'s always a community of peers nearby.' },
  { q: 'How does Norfolk compare to Virginia Beach for homebuyers?', a: 'Norfolk is generally 15–25% more affordable than comparable Virginia Beach neighborhoods, more urban and walkable, and offers more character-rich historic homes. Virginia Beach has the Atlantic Ocean and quieter suburbs. Many buyers choose Norfolk for value and lifestyle, and Virginia Beach for school districts and beach access.' },
  { q: 'What is the Norfolk real estate market like?', a: 'Norfolk\'s market moves fairly quickly — with the average home spending about 25 days on market. Ghent and Larchmont can move in under 2 weeks when priced right. The military-driven demand keeps inventory relatively tight in desirable neighborhoods.' },
]

const hoaData = {
  intro: "Norfolk's HOA presence is minimal compared to suburban Hampton Roads cities. Most of Norfolk's character-rich single-family neighborhoods — including Ghent, Larchmont, and Colonial Place — were developed well before modern HOA structures became standard. Condominiums in downtown and the waterfront corridor are the primary exception.",
  fees: [
    { neighborhood: 'Ghent (fee-simple homes)', monthly: 'None' },
    { neighborhood: 'Larchmont', monthly: 'None' },
    { neighborhood: 'Colonial Place', monthly: 'None' },
    { neighborhood: 'Talbot Park', monthly: 'None' },
    { neighborhood: 'Ocean View (single-family)', monthly: 'None / Voluntary civic league' },
    { neighborhood: 'ODU-Area Condominiums', monthly: '$150–$300/mo', highlight: true },
    { neighborhood: 'Downtown Norfolk Condominiums', monthly: '$250–$500+/mo', highlight: true },
  ],
  covers: [
    'Exterior building maintenance and repairs (condos)',
    'Common area upkeep and landscaping',
    'Building insurance (structure — condos)',
    'Water / sewer utilities (in select condo associations)',
    'Amenities: fitness center, rooftop access, pool (varies)',
    'Trash and recycling service (select buildings)',
  ],
  note: "Norfolk's civic league associations are community organizations but are generally voluntary and do not carry legally-enforceable covenants. Condominium associations are the primary form of mandatory HOA in Norfolk. Always confirm association status and review bylaws before purchasing.",
}

const nearbyData = {
  subtitle: 'How Norfolk compares to neighboring Hampton Roads communities.',
  nearby: [
    { name: 'Chesapeake', slug: 'chesapeake', startingPrice: 'From $270K', why: 'Top-rated schools, new construction options, and suburban space — the most family-oriented market in Hampton Roads with consistent home value appreciation.' },
    { name: 'Virginia Beach', slug: 'virginia-beach', startingPrice: 'From $280K', why: 'Atlantic beach access, excellent public schools, and the widest variety of housing in the region from condos to oceanfront estates.' },
    { name: 'Portsmouth', slug: undefined, startingPrice: 'From $180K', why: 'Adjacent waterfront city on the Elizabeth River with historic neighborhoods, an emerging arts district, and the most affordable entry points in the region.' },
  ],
}

const newConstructionData = {
  subtitle: "Norfolk is a fully built-out urban city — traditional new construction subdivisions are not available here. What exists is primarily infill development and select condo projects.",
  builders: [
    {
      name: 'Urban Infill Townhomes',
      communities: 'Various Norfolk Neighborhoods',
      sqftRange: '1,400–2,200 sq ft',
      startingPrice: 'From $350K',
      desc: 'Several smaller regional developers build townhome infill projects throughout Norfolk — filling vacant lots in established neighborhoods and redevelopment zones near ODU and downtown.',
      searchUrl: 'https://search.buyingva.com/search?s[locations][0][city]=Norfolk&s[locations][0][state]=VA',
    },
    {
      name: 'Downtown Condominiums',
      communities: 'Waterside District · Downtown Corridor',
      sqftRange: '700–2,000 sq ft',
      startingPrice: 'From $250K',
      desc: 'Occasional condo conversions and select new condo projects in the downtown and Ghent waterfront corridor. Urban lock-and-leave lifestyle steps from dining, entertainment, and the Elizabeth River.',
      searchUrl: 'https://search.buyingva.com/search?s[locations][0][city]=Norfolk&s[locations][0][state]=VA',
    },
  ],
  limitedNote: 'Norfolk is largely built out — traditional new construction subdivisions are not available. Buyers seeking brand-new single-family homes typically expand their search to Chesapeake or Virginia Beach, both within 20 minutes of downtown Norfolk.',
}

export default async function NorfolkPage() {
  const latestReport = await getLatestMarketReport('norfolk')

  return (
    <main>
      {/* BREADCRUMB */}
      <div className="breadcrumb">
        <div className="breadcrumb-inner">
          <Link href="/">Home</Link>
          <span className="breadcrumb-sep">›</span>
          <span>Communities</span>
          <span className="breadcrumb-sep">›</span>
          <span>Norfolk</span>
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
        background: '#0d1b2a',
      }}>
        <img
          src="/Norfolk.jpg"
          alt="Norfolk Virginia waterfront skyline"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 100%)' }} />
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            Hampton Roads, Virginia
          </p>
          <h1 style={{ color: '#fff', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16 }}>
            Norfolk<br />Homes For Sale
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 17, maxWidth: 560, marginBottom: 40, lineHeight: 1.7 }}>
            Historic neighborhoods, world-class waterfront, the world&apos;s largest naval base, and Hampton Roads&apos;s most vibrant urban living.
          </p>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            {[["900+", 'Active Listings'], ['$295K', 'Median Price'], ['25', 'Avg. Days on Market'], ['1682', 'Year Founded']].map(([num, lbl]) => (
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
            <h2>Where is Norfolk?</h2>
            <p>Located at the heart of Hampton Roads — bordered by the Elizabeth River to the south, Chesapeake Bay to the north, and connecting to all major cities in the region.</p>
          </div>
          <div style={{ height: 420, borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
            <CommunityMapWrapper
              id="norfolk"
              name="Norfolk, VA"
              subtitle="Hampton Roads · Historic Port City"
              center={[-76.29, 36.89]}
              zoom={12}
              boundary={[
                [-76.37, 36.97], [-76.14, 36.97], [-76.14, 36.83],
                [-76.37, 36.83], [-76.37, 36.97],
              ]}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginTop: 24 }}>
            {[
              { time: '~10 min', dest: 'to Chesapeake', route: 'via I-64 S' },
              { time: '~20 min', dest: 'to Virginia Beach', route: 'via I-264 E' },
              { time: '~20 min', dest: 'to Hampton', route: 'via Hampton Roads Bridge-Tunnel' },
              { time: '~3.5 hrs', dest: 'to Washington DC', route: 'via I-64 N / I-95 N' },
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
            <h2>New Norfolk Listings</h2>
            <p>The latest homes for sale in Norfolk — historic homes, condos, and waterfront properties updated daily from the MLS.</p>
          </div>
          <div className="ylopo-wrap">
            <div className="YLOPO_resultsWidget" data-search='{"locations":[{"city":"Norfolk","state":"VA"}],"propertyTypes":["house","condo","townhouse"],"minPrice":150000,"limit":12,"sortBy":"listDate","sortOrder":"desc"}' />
          </div>
          <p className="ylopo-note">Listing data sourced from regional MLS. Information deemed reliable but not guaranteed. Updated daily.</p>
          <div className="listings-actions">
            <a href="https://search.buyingva.com/search?s[orderBy]=sourceCreationDate%2Cdesc&s[page]=1&s[locations][0][city]=Norfolk&s[locations][0][state]=VA" target="_blank" rel="noopener noreferrer" className="btn-primary">
              View All Norfolk Listings →
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
              <h2 style={{ marginBottom: 24 }}>Norfolk: Hampton Roads&apos; Urban Soul</h2>
              <p style={{ marginBottom: 16 }}>Norfolk is the oldest and most urban of Hampton Roads&apos; major cities — and the one that surprises buyers most. They come expecting a tired military town and discover one of the East Coast&apos;s most underrated urban living environments: the Ghent arts district, a revitalized waterfront, genuine architectural history, and a price point that makes city living actually attainable.</p>
              <p style={{ marginBottom: 16 }}>Barry Jenkins has helped many buyers discover Norfolk who never originally considered it. What changes their minds is usually walking Ghent for the first time — realizing that for the same price as a cookie-cutter suburban home in another city, they could own a beautifully restored Victorian walking distance from the Chrysler Museum, a dozen great restaurants, and the Elizabeth River waterfront.</p>
              <p style={{ marginBottom: 16 }}>Naval Station Norfolk shapes everything about this market. It&apos;s the world&apos;s largest naval installation, and its presence means constant demand, strong rental market depth, and a community that genuinely understands military life. VA loans are used in a higher percentage of transactions here than almost anywhere else.</p>
              <p>Whether you&apos;re a first-time buyer looking for value, a military family on orders, or an investor looking for strong rental returns, Norfolk&apos;s diverse neighborhoods offer more than most buyers expect.</p>
            </div>
            <div>
              <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '28px 32px', marginBottom: 20 }}>
                <h3 style={{ marginBottom: 20 }}>Norfolk At a Glance</h3>
                {stats.map(([label, value, cls]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: cls === 'accent' ? 'var(--accent)' : 'var(--text)' }}>{value}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: 'var(--accent)', borderRadius: 'var(--radius-xl)', padding: '28px 32px' }}>
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15, marginBottom: 20, lineHeight: 1.7 }}>
                  Ready to explore Norfolk? Barry will help you find the right neighborhood for your lifestyle and investment goals.
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
            <span className="section-label">Why Norfolk</span>
            <h2>Why People Choose Norfolk</h2>
            <p>From urban culture to military stability — here&apos;s what makes Norfolk one of Hampton Roads&apos;s most dynamic markets.</p>
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
            <h2>Find Your Norfolk Neighborhood</h2>
            <p>From Victorian Ghent to bayside Ocean View — Norfolk has a neighborhood for every lifestyle and budget.</p>
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
                src="/Norfolk.jpg"
                alt="Norfolk waterfront lifestyle"
                style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 'var(--radius-xl)' }}
              />
            </div>
            <div>
              <span className="section-label">Urban Waterfront Living</span>
              <div style={{ width: 40, height: 3, background: 'var(--accent)', margin: '12px 0 24px', borderRadius: 2 }} />
              <h2 style={{ marginBottom: 20 }}>Culture, Water, and History at Your Doorstep</h2>
              <p style={{ marginBottom: 16 }}>Norfolk offers something rare in Hampton Roads — genuine urban density with walkability, independent culture, and direct waterfront access. The revitalized Waterside District, Ghent&apos;s arts scene, and Ocean View&apos;s beach community all reflect a city that has reinvented itself.</p>
              <p style={{ marginBottom: 24 }}>The Elizabeth River waterfront, Chesapeake Bay beaches at Ocean View, and downtown&apos;s dining and entertainment corridor mean Norfolk residents have more within reach on foot or a short drive than anywhere else in the region.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  'Chrysler Museum of Art — one of the top art museums in the southeastern United States',
                  'Waterside District — revitalized waterfront dining, craft beer, and entertainment hub',
                  'Norfolk Botanical Garden — 175 acres of gardens along Lake Whitehurst',
                  'Ocean View Beach Park — free public beach on the Chesapeake Bay',
                  'Nauticus & Battleship Wisconsin — maritime museum and WWII battleship on the waterfront',
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
            <h2>Norfolk Public Schools & Universities</h2>
            <p>Norfolk is home to two major universities and a public school system with strong magnet and specialty programs.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            {[
              {
                group: 'Notable High Schools',
                schools: [
                  ['Maury High School', '9–12 · Historic · Magnet Programs'],
                  ['Granby High School', '9–12 · IB Programme'],
                  ['Lake Taylor High School', '9–12 · STEM · CTE Focus'],
                  ['Norview High School', '9–12 · Diverse Programs'],
                  ['Booker T. Washington High', '9–12 · Fine Arts Focus'],
                ],
              },
              {
                group: 'Private & Independent',
                schools: [
                  ['Norfolk Academy', '1–12 · Top-Ranked Private'],
                  ['Cape Henry Collegiate', 'PreK–12 · College Prep'],
                  ['Norfolk Christian School', 'K–12 · Christian'],
                  ['Bishop Sullivan Catholic', '9–12 · Catholic'],
                  ['Norfolk Collegiate', 'PreK–12 · College Prep'],
                ],
              },
              {
                group: 'Higher Education',
                schools: [
                  ['Old Dominion University', 'Major Research University · 24K Students'],
                  ['Norfolk State University', 'HBCU · 6K+ Students'],
                  ['Eastern Virginia Medical School', 'Medical School'],
                  ['Tidewater Community College', 'Norfolk Campus'],
                  ['Regent University', 'Private University · Virginia Beach'],
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
      <CommunityHOA city="Norfolk" {...hoaData} />

      {/* NEW CONSTRUCTION */}
      <CommunityNewConstruction city="Norfolk" {...newConstructionData} />

      {/* COMPARISONS */}
      <CommunityComparisons city="Norfolk" {...nearbyData} />

      {/* MARKET TRENDS */}
      <section id="market">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Market Data</span>
            <h2>Norfolk Market Trends</h2>
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
              src="https://altos.re/html/s-html/830a2b1d-dd67-4da4-a660-c7ada1ac2ba0?scale=1&marketNarrative=true&houses=true&weeklyChange=true&branding=true&size=large"
              style={{ border: 0, display: 'block', width: 640, maxWidth: '100%', height: 800 }}
              scrolling="auto"
              loading="lazy"
              title="Norfolk Market Trends"
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <CommunityFAQ
        title="Norfolk Real Estate FAQs"
        subtitle="Common questions from buyers and sellers navigating the Norfolk market."
        faqs={faqs}
      />

      {/* CTA */}
      <section id="cta" style={{ background: 'var(--accent)', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: 640 }}>
          <h2 style={{ color: '#fff', marginBottom: 16 }}>Ready to Find Your Norfolk Home?</h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 17, marginBottom: 36 }}>
            Barry Jenkins and the Legacy Home Team specialize in connecting buyers with the right Norfolk neighborhood — whether that&apos;s a Ghent Victorian, an Ocean View beach cottage, or a solid investment property.
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
