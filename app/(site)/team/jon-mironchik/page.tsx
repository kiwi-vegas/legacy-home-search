import type { Metadata } from 'next'
import { getTeamMember } from '@/sanity/queries'
import AgentLandingPage from '@/components/AgentLandingPage'

export const metadata: Metadata = {
  title: 'Jon Mironchik | REALTOR® · Legacy Home Team — Hampton Roads',
  description:
    'Jon Mironchik is a Hampton Roads REALTOR® with Legacy Home Team, serving Virginia Beach, Chesapeake, Norfolk, Suffolk, Hampton, and Newport News. Search homes, explore communities, and connect directly.',
}

const SUBDOMAIN = 'https://jon.legacyhomesearch.com'

export default async function JonMironchikPage() {
  const agent = await getTeamMember('jon-mironchik')

  return (
    <AgentLandingPage
      name={agent?.name ?? 'Jon Mironchik'}
      title={agent?.title ?? 'REALTOR®'}
      phone={agent?.phone ?? ''}
      phoneHref={agent?.phone ? `tel:+${agent.phone.replace(/\D/g, '')}` : '#'}
      email={agent?.email ?? ''}
      photo={agent?.photoUrl ?? agent?.photoPath ?? '/team/jon-mironchik.jpg'}
      bio={agent?.bio}
      subdomain={agent?.subdomain ? `https://${agent.subdomain}` : SUBDOMAIN}
      slug="jon-mironchik"
    />
  )
}
