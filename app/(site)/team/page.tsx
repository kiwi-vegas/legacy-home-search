import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Our Team | Legacy Home Team — Hampton Roads Real Estate Agents',
  description: 'Meet the Legacy Home Team — experienced Hampton Roads REALTORS® led by Barry Jenkins. We help families buy and sell homes across Virginia Beach, Chesapeake, Norfolk, and beyond.',
}

const agents = [
  {
    slug: 'barry-jenkins',
    name: 'Barry Jenkins',
    title: 'Team Owner & Lead Agent',
    phone: '(757) 654-5059',
    email: 'Barry@yourfriendlyagent.net',
    photo: '/team/barry-jenkins-main.jpg',
    subdomain: 'listings.legacyhomesearch.com',
    bio: 'Barry began his real estate career at 18 and has spent over two decades mastering the Hampton Roads market. He leads Legacy Home Team and is ranked among the top teams in America, having sold nearly 900 units in a single year. He also serves as Head Realtor in Residence at Ylopo, where he trains agents and assists with product development nationwide.',
  },
  {
    slug: 'tanya-thompson',
    name: 'Tanya Thompson',
    title: 'REALTOR®',
    phone: '(757) 737-1866',
    email: 'tanyasellsvirginia@gmail.com',
    photo: '/team/tanya-thompson.jpg',
    subdomain: 'tanya.legacyhomesearch.com',
    bio: 'Tanya brings dedication, local knowledge, and a client-first mindset to every transaction. Whether you\'re buying your first home or making your next move, Tanya is committed to making the process smooth and successful.',
  },
  {
    slug: 'julz-gat',
    name: 'Julz Gat',
    title: 'REALTOR®',
    phone: '(757) 383-1020',
    email: 'julzgatbeats@gmail.com',
    photo: '/team/julz-gat.jpg',
    subdomain: 'julz.legacyhomesearch.com',
    bio: 'Julz brings energy, creativity, and a passion for helping people find their perfect home in Hampton Roads. With a sharp eye for opportunity and a talent for negotiation, Julz is a valuable advocate for buyers and sellers alike.',
  },
  {
    slug: 'jon-mironchik',
    name: 'Jon Mironchik',
    title: 'REALTOR®',
    phone: '(757) 383-1020',
    email: 'jonm.realestate@gmail.com',
    photo: '/team/jon-mironchik.jpg',
    subdomain: 'jon.legacyhomesearch.com',
    bio: 'Jon combines market expertise with a straightforward, honest approach that clients appreciate. He takes the time to understand each client\'s goals and works tirelessly to deliver results — whether that means finding the right home or getting top dollar on a sale.',
  },
  {
    slug: 'chris-august',
    name: 'Chris August',
    title: 'REALTOR®',
    phone: '(757) 773-2188',
    email: 'chrisaugust757homes@gmail.com',
    photo: '/team/chris-august.jpg',
    subdomain: 'chris.legacyhomesearch.com',
    bio: 'Chris is a trusted Hampton Roads REALTOR® who brings a genuine passion for real estate and a commitment to his clients\' success. Known for his responsiveness and work ethic, Chris guides buyers and sellers through every step of the process with confidence.',
  },
  {
    slug: 'matt-moubray',
    name: 'Matt Moubray',
    title: 'REALTOR®',
    phone: '(804) 852-8866',
    email: 'matt@moubrayhome.com',
    photo: '/team/matt-moubray.jpg',
    subdomain: 'matt.legacyhomesearch.com',
    bio: 'Matt brings a sharp analytical mind and deep market knowledge to every deal. Serving Hampton Roads and the surrounding region, Matt is focused on helping his clients make confident, well-informed real estate decisions.',
  },
]

export default function TeamPage() {
  return (
    <>
      {/* HERO */}
      <section style={{
        background: 'var(--off-white)',
        paddingTop: 'calc(var(--nav-h) + 64px)',
        paddingBottom: 64,
        borderBottom: '1px solid var(--border)',
      }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: 680 }}>
          <span className="section-label">Legacy Home Team</span>
          <h1 style={{ marginBottom: 20 }}>Meet the Team</h1>
          <p style={{ fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            A group of dedicated Hampton Roads REALTORS® united by one goal — helping families buy and sell homes with confidence, clarity, and care.
          </p>
        </div>
      </section>

      {/* TEAM GRID */}
      <section>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 36,
          }}>
            {agents.map((agent) => (
              <Link
                key={agent.slug}
                href={`/team/${agent.slug}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div style={{
                  background: '#fff',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-xl)',
                  overflow: 'hidden',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                  cursor: 'pointer',
                }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)'
                    el.style.transform = 'translateY(-4px)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.boxShadow = 'none'
                    el.style.transform = 'none'
                  }}
                >
                  {/* Headshot */}
                  <div style={{ aspectRatio: '4/3', overflow: 'hidden', background: 'var(--light-gray)' }}>
                    <img
                      src={agent.photo}
                      alt={agent.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
                    />
                  </div>

                  {/* Info */}
                  <div style={{ padding: '24px 24px 28px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 6 }}>
                      {agent.title}
                    </div>
                    <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10, color: 'var(--text)' }}>
                      {agent.name}
                    </h3>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 20 }}>
                      {agent.bio.slice(0, 110)}…
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <a
                        href={`tel:${agent.phone.replace(/\D/g, '')}`}
                        onClick={e => e.stopPropagation()}
                        style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}
                      >
                        📞 {agent.phone}
                      </a>
                      <a
                        href={`mailto:${agent.email}`}
                        onClick={e => e.stopPropagation()}
                        style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}
                      >
                        ✉️ {agent.email}
                      </a>
                    </div>
                    <div style={{ marginTop: 20, fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
                      View Profile →
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'var(--off-white)' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: 600 }}>
          <span className="section-label">Work With Us</span>
          <h2 style={{ marginBottom: 16 }}>Ready to Find Your Agent?</h2>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 32 }}>
            Every member of the Legacy Home Team brings the same commitment — local expertise, honest advice, and results you can count on.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="tel:+17578164037" className="btn-primary">Call (757) 816-4037</a>
            <a href="/#contact" className="btn-outline">Send a Message</a>
          </div>
        </div>
      </section>
    </>
  )
}
