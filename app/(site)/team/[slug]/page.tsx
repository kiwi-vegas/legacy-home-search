import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTeamMember, getAllTeamMemberSlugs } from '@/sanity/queries'

export const revalidate = 60

export async function generateStaticParams() {
  const slugs = await getAllTeamMemberSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const agent = await getTeamMember(slug)
  if (!agent) return {}
  return {
    title: `${agent.name} | Legacy Home Team — Hampton Roads REALTOR®`,
    description: `Meet ${agent.name}, ${agent.title ?? 'REALTOR®'} at Legacy Home Team. Serving buyers and sellers across Hampton Roads, Virginia Beach, and surrounding communities.`,
  }
}

export default async function AgentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const agent = await getTeamMember(slug)
  if (!agent || agent.active === false) notFound()

  const photo = agent.photoUrl ?? agent.photoPath ?? '/team/placeholder.jpg'
  const bio = agent.bio ?? []
  const specialties = agent.specialties ?? []
  const subdomain = agent.subdomain ?? null

  // All other active agents for the "Meet the Team" strip at bottom
  const { getTeamMembers } = await import('@/sanity/queries')
  const allMembers = await getTeamMembers()
  const otherAgents = allMembers
    .filter((m) => m.slug !== slug)
    .map((m) => ({
      slug: m.slug,
      name: m.name,
      title: m.title ?? 'REALTOR®',
      photo: m.photoUrl ?? m.photoPath ?? '/team/placeholder.jpg',
    }))

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
                src={photo}
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
                {agent.title ?? 'REALTOR®'}
              </div>

              {/* Bio */}
              {bio.map((para, i) => (
                <p key={i} style={{ fontSize: 16, lineHeight: 1.75, marginBottom: 16, color: 'var(--text-secondary)' }}>
                  {para}
                </p>
              ))}

              {/* Stats */}
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
              {specialties.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '24px 0 32px' }}>
                  {specialties.map((s) => (
                    <span key={s} style={{
                      background: 'var(--accent-light)', color: 'var(--accent)',
                      fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
                      padding: '6px 14px', borderRadius: 99,
                    }}>{s}</span>
                  ))}
                </div>
              )}

              {/* CTAs */}
              {(agent.phone || agent.email) && (
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {agent.phone && (
                    <a href={`tel:+1${agent.phone.replace(/\D/g, '')}`} className="btn-primary">
                      Call {agent.phone}
                    </a>
                  )}
                  {agent.email && (
                    <a href={`mailto:${agent.email}`} className="btn-outline">
                      Send an Email
                    </a>
                  )}
                </div>
              )}

              {/* Listings link */}
              {subdomain && (
                <div style={{ marginTop: 20 }}>
                  <a
                    href={subdomain.startsWith('http') ? subdomain : `https://${subdomain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}
                  >
                    View {agent.name.split(' ')[0]}&apos;s Listings →
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* MEET THE REST OF THE TEAM */}
      {otherAgents.length > 0 && (
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
      )}
    </>
  )
}
