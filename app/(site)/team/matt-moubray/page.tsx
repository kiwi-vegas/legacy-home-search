import type { Metadata } from 'next'
import { getTeamMember } from '@/sanity/queries'
import AgentLandingPage from '@/components/AgentLandingPage'

export const metadata: Metadata = {
  title: 'Matt Moubray | REALTOR® · Legacy Home Team — Hampton Roads',
  description:
    'Matt Moubray is a Hampton Roads REALTOR® with Legacy Home Team, serving Virginia Beach, Chesapeake, Norfolk, Suffolk, Hampton, and Newport News. Search homes, explore communities, and connect directly.',
}

const SUBDOMAIN = 'https://matt.legacyhomesearch.com'

export default async function MattMoubrayPage() {
  const agent = await getTeamMember('matt-moubray')

  return (
    <AgentLandingPage
      name={agent?.name ?? 'Matt Moubray'}
      title={agent?.title ?? 'REALTOR®'}
      phone={agent?.phone ?? ''}
      phoneHref={agent?.phone ? `tel:+${agent.phone.replace(/\D/g, '')}` : '#'}
      email={agent?.email ?? ''}
      photo={agent?.photoUrl ?? agent?.photoPath ?? '/team/matt-moubray.jpg'}
      bio={agent?.bio}
      subdomain={agent?.subdomain ? `https://${agent.subdomain}` : SUBDOMAIN}
      slug="matt-moubray"
    />
  )
}
