import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

const agents = [
  {
    slug: 'barry-jenkins',
    name: 'Barry Jenkins',
    title: 'Team Owner & Lead Agent',
    phone: '(757) 654-5059',
    email: 'Barry@yourfriendlyagent.net',
    photo: '/team/barry-jenkins-main.jpg',
    subdomain: 'https://listings.legacyhomesearch.com',
    bio: [
      'Barry began his real estate career at 18 and has spent over two decades mastering the Hampton Roads market. He leads Legacy Home Team and is ranked among the top teams in America, having sold nearly 900 units in a single year.',
      'He also serves as Head Realtor in Residence at Ylopo, where he trains agents and assists with product development nationwide. His team operates under Better Homes and Gardens NAGR, where Barry serves as CMO.',
      'His approach is simple: treat every family\'s home purchase like it\'s the most important transaction in the world — because it is. That philosophy has built a loyal client base and a wall of 5-star reviews spanning two decades.',
      'Outside of real estate, Barry is an ordained minister, husband, and father of three. His faith and family drive everything he does.',
    ],
    specialties: ['Team Leadership', 'Buyer & Seller Representation', 'Investment Properties', 'Relocation', 'Military Buyers'],
    years: '21+',
    transactions: '900+',
  },
  {
    slug: 'tanya-thompson',
    name: 'Tanya Thompson',
    title: 'REALTOR®',
    phone: '(757) 737-1866',
    email: 'tanyasellsvirginia@gmail.com',
    photo: '/team/tanya-thompson.jpg',
    subdomain: 'https://tanya.legacyhomesearch.com',
    bio: [
      'Tanya brings dedication, local knowledge, and a client-first mindset to every transaction. Whether you\'re buying your first home or making your next move in Hampton Roads, Tanya is committed to making the process smooth, transparent, and successful.',
      'She works closely with buyers and sellers across Virginia Beach, Chesapeake, Norfolk, and the surrounding communities — guiding clients through every step with patience and expertise.',
      'Tanya\'s reputation is built on genuine relationships. Clients describe her as responsive, honest, and a fierce advocate who always puts their best interests first.',
    ],
    specialties: ['First-Time Buyers', 'Seller Representation', 'Virginia Beach', 'Chesapeake'],
    years: null,
    transactions: null,
  },
  {
    slug: 'julz-gat',
    name: 'Julz Gat',
    title: 'REALTOR®',
    phone: '(757) 383-1020',
    email: 'julzgatbeats@gmail.com',
    photo: '/team/julz-gat.png',
    subdomain: 'https://julz.legacyhomesearch.com',
    bio: [
      'Julz brings energy, creativity, and a passion for helping people find their perfect home in Hampton Roads. With a sharp eye for opportunity and a natural talent for negotiation, Julz is a valuable advocate for buyers and sellers alike.',
      'Serving clients across Virginia Beach and the greater Hampton Roads region, Julz combines market knowledge with a personalized approach that makes clients feel heard and supported throughout the entire process.',
      'Whether you\'re entering the market for the first time or a seasoned buyer looking for your next investment, Julz brings the hustle and expertise to get it done right.',
    ],
    specialties: ['Buyer Representation', 'Negotiation', 'Hampton Roads', 'Investment Properties'],
    years: null,
    transactions: null,
  },
  {
    slug: 'jon-mironchik',
    name: 'Jon Mironchik',
    title: 'REALTOR®',
    phone: '(757) 383-1020',
    email: 'jonm.realestate@gmail.com',
    photo: '/team/jon-mironchik.jpg',
    subdomain: 'https://jon.legacyhomesearch.com',
    bio: [
      'Jon combines market expertise with a straightforward, honest approach that clients appreciate. He takes the time to understand each client\'s goals and works tirelessly to deliver results — whether that means finding the right home or getting top dollar on a sale.',
      'Jon serves buyers and sellers across Hampton Roads, bringing data-driven insights and a calm, clear communication style that makes even complex transactions feel manageable.',
      'His clients consistently highlight his responsiveness and integrity as what sets him apart. With Jon, you always know exactly where you stand.',
    ],
    specialties: ['Buyer & Seller Representation', 'Market Analysis', 'Norfolk', 'Virginia Beach'],
    years: null,
    transactions: null,
  },
  {
    slug: 'chris-august',
    name: 'Chris August',
    title: 'REALTOR®',
    phone: '(757) 773-2188',
    email: 'chrisaugust757homes@gmail.com',
    photo: '/team/chris-august.jpg',
    subdomain: 'https://chris.legacyhomesearch.com',
    bio: [
      'Chris is a trusted Hampton Roads REALTOR® who brings a genuine passion for real estate and a deep commitment to his clients\' success. Known for his responsiveness and relentless work ethic, Chris guides buyers and sellers through every step of the process with confidence.',
      'Serving Virginia Beach and the surrounding 757 area, Chris brings local insight and a hands-on approach that keeps clients informed and empowered from the first showing to closing day.',
      'Whether you\'re a first-time buyer navigating the market or a seller looking to maximize your return, Chris brings the expertise and energy to make it happen.',
    ],
    specialties: ['First-Time Buyers', 'Listing Strategy', 'Virginia Beach', '757 Area'],
    years: null,
    transactions: null,
  },
  {
    slug: 'matt-moubray',
    name: 'Matt Moubray',
    title: 'REALTOR®',
    phone: '(804) 852-8866',
    email: 'matt@moubrayhome.com',
    photo: '/team/matt-moubray.jpg',
    subdomain: 'https://matt.legacyhomesearch.com',
    bio: [
      'Matt brings a sharp analytical mind and deep market knowledge to every deal. Serving Hampton Roads and the surrounding region, Matt is focused on helping his clients make confident, well-informed real estate decisions.',
      'With a background that blends strategic thinking with genuine client care, Matt approaches every transaction with the same goal: the best possible outcome for the people he represents.',
      'Buyers and sellers alike rely on Matt for his thoroughness, clear communication, and commitment to getting the details right — from offer to close.',
    ],
    specialties: ['Buyer Representation', 'Market Analysis', 'Hampton Roads Region', 'Strategic Pricing'],
    years: null,
    transactions: null,
  },
]

export async function generateStaticParams() {
  return agents.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const agent = agents.find((a) => a.slug === slug)
  if (!agent) return {}
  return {
    title: `${agent.name} | Legacy Home Team — Hampton Roads REALTOR®`,
    description: `Meet ${agent.name}, ${agent.title} at Legacy Home Team. Serving buyers and sellers across Hampton Roads, Virginia Beach, and surrounding communities.`,
  }
}

export default async function AgentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const agent = agents.find((a) => a.slug === slug)
  if (!agent) notFound()

  const otherAgents = agents.filter((a) => a.slug !== agent.slug)

  return (
    <>
      {/* HERO */}
      <section style={{
        paddingTop: 'calc(var(--nav-h) + 64px)',
        paddingBottom: 80,
      }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 80, alignItems: 'start' }}>

            {/* Photo */}
            <div style={{
              aspectRatio: '3/4',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              background: 'var(--light-gray)',
              position: 'relative',
            }}>
              <img
                src={agent.photo}
                alt={agent.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
              />
            </div>

            {/* Info */}
            <div>
              <span className="section-label">Legacy Home Team</span>
              <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>
                {agent.name}
              </h1>
              <div style={{ fontSize: 15, color: 'var(--accent)', fontWeight: 600, marginBottom: 32 }}>
                {agent.title}
              </div>

              {/* Bio */}
              {agent.bio.map((para, i) => (
                <p key={i} style={{ fontSize: 16, lineHeight: 1.75, marginBottom: 16, color: 'var(--text-secondary)' }}>
                  {para}
                </p>
              ))}

              {/* Stats (Barry only) */}
              {(agent.years || agent.transactions) && (
                <div style={{ display: 'flex', gap: 32, margin: '28px 0', padding: '24px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                  {agent.years && (
                    <div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)' }}>{agent.years}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Years of Experience</div>
                    </div>
                  )}
                  {agent.transactions && (
                    <div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)' }}>{agent.transactions}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Transactions</div>
                    </div>
                  )}
                </div>
              )}

              {/* Specialties */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '24px 0 32px' }}>
                {agent.specialties.map((s) => (
                  <span key={s} style={{
                    background: 'var(--accent-light)', color: 'var(--accent)',
                    fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
                    padding: '6px 14px', borderRadius: 99,
                  }}>{s}</span>
                ))}
              </div>

              {/* CTAs */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <a href={`tel:+1${agent.phone.replace(/\D/g, '')}`} className="btn-primary">
                  Call {agent.phone}
                </a>
                <a href={`mailto:${agent.email}`} className="btn-outline">
                  Send an Email
                </a>
              </div>

              {/* Listings link */}
              <div style={{ marginTop: 20 }}>
                <a
                  href={agent.subdomain}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}
                >
                  View {agent.name.split(' ')[0]}&apos;s Listings →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MEET THE REST OF THE TEAM */}
      <section style={{ background: 'var(--off-white)' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-label">The Team</span>
            <h2>Meet Your Fellow Agents</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 24 }}>
            {otherAgents.map((a) => (
              <a key={a.slug} href={`/team/${a.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{
                  background: '#fff', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-xl)', overflow: 'hidden',
                  transition: 'box-shadow 0.2s',
                }}>
                  <div style={{ aspectRatio: '1/1', overflow: 'hidden', background: 'var(--light-gray)' }}>
                    <img
                      src={a.photo}
                      alt={a.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
                    />
                  </div>
                  <div style={{ padding: '16px 20px 20px' }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{a.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>{a.title}</div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
