'use client'
import dynamic from 'next/dynamic'
import type { CommunityMapProps } from './CommunityMap'

const CommunityMap = dynamic(() => import('./CommunityMap'), { ssr: false })

export default function CommunityMapWrapper(props: CommunityMapProps) {
  return <CommunityMap {...props} />
}
