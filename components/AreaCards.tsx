'use client'
import Link from 'next/link'

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

const areas = [
  {
    name: 'Virginia Beach',
    slug: 'virginia-beach',
    desc: 'Oceanfront condos to suburban family homes — we know every pocket of VB.',
    center: [-76.0, 36.85],
    zoom: 10,
  },
  {
    name: 'Chesapeake',
    slug: 'chesapeake',
    desc: 'Top-rated schools, new construction, and established neighborhoods.',
    center: [-76.29, 36.77],
    zoom: 10,
  },
  {
    name: 'Norfolk',
    slug: 'norfolk',
    desc: 'Urban living, historic charm, and a thriving waterfront community.',
    center: [-76.29, 36.89],
    zoom: 12,
  },
  {
    name: 'Suffolk',
    slug: 'suffolk',
    desc: 'Room to grow with country estates and fast-growing master-planned communities.',
    center: [-76.60, 36.73],
    zoom: 10,
  },
  {
    name: 'Hampton',
    slug: 'hampton',
    desc: 'Waterfront access, military-friendly, and historically rich neighborhoods.',
    center: [-76.34, 37.03],
    zoom: 11,
  },
  {
    name: 'Newport News',
    slug: 'newport-news',
    desc: 'Diverse housing stock with strong value and easy access to the Peninsula.',
    center: [-76.52, 37.07],
    zoom: 11,
  },
]

function staticMapUrl(lon: number, lat: number, zoom: number) {
  if (!TOKEN) return ''
  return `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-s+2563eb(${lon},${lat})/${lon},${lat},${zoom},0/600x400@2x?access_token=${TOKEN}`
}

export default function AreaCards() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
      {areas.map(area => {
        const mapUrl = staticMapUrl(area.center[0], area.center[1], area.zoom)
        return (
          <Link key={area.slug} href={`/${area.slug}`} style={{ textDecoration: 'none' }}>
            <div className="area-card">
              {/* Default content */}
              <div className="area-card-content">
                <div>
                  <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--text)', marginBottom: 8 }}>{area.name}</div>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{area.desc}</p>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>View community →</div>
              </div>

              {/* Map image (shown on hover) */}
              {TOKEN && (
                <div className="area-card-map">
                  <img src={mapUrl} alt={`${area.name} map`} loading="lazy" />
                </div>
              )}

              {/* Dark overlay (shown on hover) */}
              <div className="area-card-overlay" />

              {/* Hover label */}
              <div className="area-card-hover-label">
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 17, marginBottom: 4 }}>{area.name}</div>
                <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>View community →</div>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
