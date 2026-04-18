import type { Metadata } from 'next'
import { getTeamMember } from '@/sanity/queries'
import AgentLandingPage from '@/components/AgentLandingPage'

export const metadata: Metadata = {
  title: 'Chris August | REALTOR® · Legacy Home Team — Hampton Roads',
  description:
    'Chris August is a Hampton Roads REALTOR® with Legacy Home Team, serving Virginia Beach, Chesapeake, Norfolk, Suffolk, Hampton, and Newport News. Search homes, explore communities, and connect directly.',
}

const SUBDOMAIN = 'https://chris.legacyhomesearch.com'

export default async function ChrisAugustPage() {
  const agent = await getTeamMember('chris-august')

  return (
    <AgentLandingPage
      name={agent?.name ?? 'Chris August'}
      title={agent?.title ?? 'REALTOR®'}
      phone={agent?.phone ?? ''}
      phoneHref={agent?.phone ? `tel:+${agent.phone.replace(/\D/g, '')}` : '#'}
      email={agent?.email ?? ''}
      photo={agent?.photoUrl ?? agent?.photoPath ?? '/team/chris-august.jpg'}
      bio={agent?.bio}
      subdomain={agent?.subdomain ? `https://${agent.subdomain}` : SUBDOMAIN}
      slug="chris-august"
    />
  )
}
