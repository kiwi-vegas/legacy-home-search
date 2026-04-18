import type { Metadata } from 'next'
import { getTeamMember } from '@/sanity/queries'
import AgentLandingPage from '@/components/AgentLandingPage'

export const metadata: Metadata = {
  title: 'Barry Jenkins | REALTOR® · Legacy Home Team — Hampton Roads',
  description:
    'Barry Jenkins is a Hampton Roads REALTOR® with Legacy Home Team, serving Virginia Beach, Chesapeake, Norfolk, Suffolk, Hampton, and Newport News. Search homes, explore communities, and connect directly.',
}

const SUBDOMAIN = 'https://listings.legacyhomesearch.com'

export default async function BarryJenkinsPage() {
  const agent = await getTeamMember('barry-jenkins')

  return (
    <AgentLandingPage
      name={agent?.name ?? 'Barry Jenkins'}
      title={agent?.title ?? 'REALTOR®'}
      phone={agent?.phone ?? '(757) 717-6360'}
      phoneHref={`tel:+${(agent?.phone ?? '7577176360').replace(/\D/g, '')}`}
      email={agent?.email ?? 'barry@legacyhometeamlpt.com'}
      photo={agent?.photoUrl ?? agent?.photoPath ?? '/Barry-AI.jpg'}
      bio={agent?.bio}
      subdomain={agent?.subdomain ? `https://${agent.subdomain}` : SUBDOMAIN}
      slug="barry-jenkins"
    />
  )
}
