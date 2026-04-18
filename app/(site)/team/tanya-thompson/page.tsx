import type { Metadata } from 'next'
import AgentLandingPage from '@/components/AgentLandingPage'

export const metadata: Metadata = {
  title: 'Tanya Thompson | REALTOR® · Legacy Home Team — Hampton Roads',
  description:
    'Tanya Thompson is a Hampton Roads REALTOR® with Legacy Home Team, serving Virginia Beach, Chesapeake, Norfolk, Suffolk, Hampton, and Newport News. Search homes, explore communities, and connect directly.',
}

export default function TanyaThompsonPage() {
  return (
    <AgentLandingPage
      name="Tanya Thompson"
      title="REALTOR®"
      phone="(757) 737-1866"
      phoneHref="tel:+17577371866"
      email="tanyasellsvirginia@gmail.com"
      photo="/team/tanya-thompson.jpg"
      bio={[
        'A longtime Hampton Roads resident and REALTOR®, Tanya Thompson brings local expertise, clear communication, and the full resources of Legacy Home Team to every transaction — whether you\'re buying, selling, or investing across the region.',
      ]}
      subdomain="https://tanya.legacyhomesearch.com"
      slug="tanya-thompson"
    />
  )
}
