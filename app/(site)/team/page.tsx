import type { Metadata } from 'next'
import AgentCard from '@/components/AgentCard'
import { getTeamMembers } from '@/sanity/queries'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Our Team | Legacy Home Team — Hampton Roads Real Estate Agents',
  description: 'Meet the Legacy Home Team — experienced Hampton Roads REALTORS® led by Barry Jenkins. We help families buy and sell homes across Virginia Beach, Chesapeake, Norfolk, and beyond.',
}

export default async function TeamPage() {
  const members = await getTeamMembers()

  const agents = members.map((m) => ({
    slug: m.slug,
    name: m.name,
    title: m.title ?? 'REALTOR®',
    phone: m.phone ?? '',
    email: m.email ?? '',
    photo: m.photoUrl ?? m.photoPath ?? '/team/placeholder.jpg',
    bio: m.bio?.join(' ') ?? '',
  }))

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
              <AgentCard key={agent.slug} agent={agent} />
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
