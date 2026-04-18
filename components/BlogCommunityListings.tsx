'use client'

import { useState } from 'react'

export type CommunityKey =
  | 'virginia-beach'
  | 'chesapeake'
  | 'norfolk'
  | 'hampton'
  | 'newport-news'
  | 'suffolk'
  | 'hampton-roads' // fallback — all cities

const CONFIG: Record<CommunityKey, {
  label: string
  search: string
  viewAllUrl: string
}> = {
  'virginia-beach': {
    label: 'Virginia Beach',
    search: '{"locations":[{"city":"Virginia Beach","state":"VA"}],"propertyTypes":["house","condo","townhouse"],"minPrice":250000,"limit":12,"sortBy":"listDate","sortOrder":"desc"}',
    viewAllUrl: 'https://search.buyingva.com/search?s[orderBy]=sourceCreationDate%2Cdesc&s[page]=1&s[locations][0][city]=Virginia+Beach&s[locations][0][state]=VA',
  },
  chesapeake: {
    label: 'Chesapeake',
    search: '{"locations":[{"city":"Chesapeake","state":"VA"}],"propertyTypes":["house","condo","townhouse"],"minPrice":200000,"limit":12,"sortBy":"listDate","sortOrder":"desc"}',
    viewAllUrl: 'https://search.buyingva.com/search?s[orderBy]=sourceCreationDate%2Cdesc&s[page]=1&s[locations][0][city]=Chesapeake&s[locations][0][state]=VA',
  },
  norfolk: {
    label: 'Norfolk',
    search: '{"locations":[{"city":"Norfolk","state":"VA"}],"propertyTypes":["house","condo","townhouse"],"minPrice":150000,"limit":12,"sortBy":"listDate","sortOrder":"desc"}',
    viewAllUrl: 'https://search.buyingva.com/search?s[orderBy]=sourceCreationDate%2Cdesc&s[page]=1&s[locations][0][city]=Norfolk&s[locations][0][state]=VA',
  },
  hampton: {
    label: 'Hampton',
    search: '{"locations":[{"city":"Hampton","state":"VA"}],"propertyTypes":["house","condo","townhouse"],"minPrice":150000,"limit":12,"sortBy":"listDate","sortOrder":"desc"}',
    viewAllUrl: 'https://search.buyingva.com/search?s[orderBy]=sourceCreationDate%2Cdesc&s[page]=1&s[locations][0][city]=Hampton&s[locations][0][state]=VA',
  },
  'newport-news': {
    label: 'Newport News',
    search: '{"locations":[{"city":"Newport News","state":"VA"}],"propertyTypes":["house","condo","townhouse"],"minPrice":150000,"limit":12,"sortBy":"listDate","sortOrder":"desc"}',
    viewAllUrl: 'https://search.buyingva.com/search?s[orderBy]=sourceCreationDate%2Cdesc&s[page]=1&s[locations][0][city]=Newport+News&s[locations][0][state]=VA',
  },
  suffolk: {
    label: 'Suffolk',
    search: '{"locations":[{"city":"Suffolk","state":"VA"}],"propertyTypes":["house","condo","townhouse"],"minPrice":200000,"limit":12,"sortBy":"listDate","sortOrder":"desc"}',
    viewAllUrl: 'https://search.buyingva.com/search?s[orderBy]=sourceCreationDate%2Cdesc&s[page]=1&s[locations][0][city]=Suffolk&s[locations][0][state]=VA',
  },
  'hampton-roads': {
    label: 'Hampton Roads',
    search: '{"locations":[{"city":"Virginia Beach","state":"VA"},{"city":"Chesapeake","state":"VA"},{"city":"Norfolk","state":"VA"},{"city":"Hampton","state":"VA"},{"city":"Newport News","state":"VA"},{"city":"Suffolk","state":"VA"}],"propertyTypes":["house","condo","townhouse"],"limit":12,"sortBy":"listDate","sortOrder":"desc"}',
    viewAllUrl: 'https://search.buyingva.com/search?s[orderBy]=sourceCreationDate%2Cdesc&s[page]=1',
  },
}

export default function BlogCommunityListings({ communities }: { communities: CommunityKey[] }) {
  // Fall back to Hampton Roads if no specific community detected
  const tabs = communities.length > 0 ? communities : ['hampton-roads' as CommunityKey]
  const [active, setActive] = useState<CommunityKey>(tabs[0])

  const activeConfig = CONFIG[active]
  const isSingle = tabs.length === 1
  const heading = isSingle
    ? `View ${CONFIG[tabs[0]].label} Homes For Sale`
    : 'View Homes For Sale'

  return (
    <section className="blog-listings-section">
      <div className="blog-listings-inner">
        <div className="blog-listings-header">
          <span className="blog-listings-eyebrow">Browse</span>
          <h2 className="blog-listings-title">{heading}</h2>
          {isSingle && (
            <p className="blog-listings-sub">
              Live MLS listings updated daily — homes and condos in {CONFIG[tabs[0]].label}.
            </p>
          )}
        </div>

        {/* Tabs — only shown when 2+ communities */}
        {!isSingle && (
          <div className="blog-listings-tabs">
            {tabs.map((key) => (
              <button
                key={key}
                onClick={() => setActive(key)}
                className={`blog-listings-tab${active === key ? ' active' : ''}`}
              >
                {CONFIG[key].label}
              </button>
            ))}
          </div>
        )}

        {/* All widget containers live in the DOM; visibility toggled via display */}
        <div className="ylopo-wrap">
          {tabs.map((key) => (
            <div key={key} style={{ display: active === key ? 'block' : 'none' }}>
              <div className="YLOPO_resultsWidget" data-search={CONFIG[key].search} />
            </div>
          ))}
        </div>

        <p className="ylopo-note">
          Listing data sourced from regional MLS. Information deemed reliable but not guaranteed. Updated daily.
        </p>

        <div className="blog-listings-cta">
          <a
            href={activeConfig.viewAllUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            View All {activeConfig.label} Homes →
          </a>
        </div>
      </div>
    </section>
  )
}
