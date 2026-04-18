import type { Metadata } from 'next'
import { getTeamMember } from '@/sanity/queries'
import AgentLandingPage from '@/components/AgentLandingPage'

export const metadata: Metadata = {
  title: 'Julz Gat | REALTOR® · Legacy Home Team — Hampton Roads',
  description:
    'Julz Gat is a Hampton Roads REALTOR® with Legacy Home Team, serving Virginia Beach, Chesapeake, Norfolk, Suffolk, Hampton, and Newport News. Search homes, explore communities, and connect directly.',
}

const SUBDOMAIN = 'https://julz.legacyhomesearch.com'

export default async function JulzGatPage() {
  const agent = await getTeamMember('julz-gat')

  return (
    <AgentLandingPage
      name={agent?.name ?? 'Julz Gat'}
      title={agent?.title ?? 'REALTOR®'}
      phone={agent?.phone ?? ''}
      phoneHref={agent?.phone ? `tel:+${agent.phone.replace(/\D/g, '')}` : '#'}
      email={agent?.email ?? ''}
      photo={agent?.photoUrl ?? agent?.photoPath ?? '/team/julz-gat.png'}
      bio={agent?.bio}
      subdomain={agent?.subdomain ? `https://${agent.subdomain}` : SUBDOMAIN}
      slug="julz-gat"
    />
  )
}
