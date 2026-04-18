'use client'
import { useState } from 'react'

const TABS = [
  {
    id: 'all',
    label: 'All Hampton Roads',
    search: '{"locations":[{"city":"Virginia Beach","state":"VA"},{"city":"Chesapeake","state":"VA"},{"city":"Norfolk","state":"VA"},{"city":"Suffolk","state":"VA"},{"city":"Hampton","state":"VA"},{"city":"Newport News","state":"VA"}],"limit":12}',
  },
  { id: 'virginia-beach', label: 'Virginia Beach', search: '{"locations":[{"city":"Virginia Beach","state":"VA"}],"limit":12}' },
  { id: 'chesapeake',     label: 'Chesapeake',     search: '{"locations":[{"city":"Chesapeake","state":"VA"}],"limit":12}'     },
  { id: 'norfolk',        label: 'Norfolk',         search: '{"locations":[{"city":"Norfolk","state":"VA"}],"limit":12}'        },
  { id: 'suffolk',        label: 'Suffolk',         search: '{"locations":[{"city":"Suffolk","state":"VA"}],"limit":12}'        },
  { id: 'hampton',        label: 'Hampton',         search: '{"locations":[{"city":"Hampton","state":"VA"}],"limit":12}'        },
  { id: 'newport-news',   label: 'Newport News',    search: '{"locations":[{"city":"Newport News","state":"VA"}],"limit":12}'   },
]

export default function AgentCommunityListings({ subdomain }: { subdomain: string }) {
  const [active, setActive] = useState('all')

  return (
    <div>
      {/* Tab row */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 32,
        paddingBottom: 20,
        borderBottom: '1px solid var(--border)',
      }}>
        {TABS.map(tab => {
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              style={{
                padding: '9px 20px',
                borderRadius: 99,
                border: isActive ? 'none' : '1.5px solid var(--border)',
                background: isActive ? 'var(--accent)' : '#fff',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* All widget divs live in the DOM so YLOPO initialises every one on page load.
          Show/hide via display so no reinitialisation is needed on tab switch. */}
      {TABS.map(tab => (
        <div key={tab.id} style={{ display: active === tab.id ? 'block' : 'none' }}>
          <div className="YLOPO_resultsWidget" data-search={tab.search} />
        </div>
      ))}

      <div className="listings-actions" style={{ marginTop: 32 }}>
        <a
          href={`${subdomain}/search?s[orderBy]=sourceCreationDate%2Cdesc&s[page]=1`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
        >
          View All Properties →
        </a>
      </div>
    </div>
  )
}
