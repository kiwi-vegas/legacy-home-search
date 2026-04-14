'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

const CITIES = [
  {
    id: 'virginia-beach',
    name: 'Virginia Beach',
    slug: 'virginia-beach',
    desc: 'Oceanfront condos to suburban family homes — we know every pocket of VB.',
    center: [-76.0, 36.85] as [number, number],
    boundary: [
      [-76.27, 36.98], [-75.97, 36.98], [-75.9, 36.92],
      [-75.9, 36.66], [-76.0, 36.55], [-76.2, 36.55],
      [-76.27, 36.72], [-76.27, 36.98],
    ] as [number, number][],
  },
  {
    id: 'norfolk',
    name: 'Norfolk',
    slug: 'norfolk',
    desc: 'Urban living, historic charm, and a thriving waterfront community.',
    center: [-76.29, 36.89] as [number, number],
    boundary: [
      [-76.37, 36.97], [-76.22, 36.97], [-76.22, 36.83],
      [-76.30, 36.83], [-76.37, 36.90], [-76.37, 36.97],
    ] as [number, number][],
  },
  {
    id: 'chesapeake',
    name: 'Chesapeake',
    slug: 'chesapeake',
    desc: 'Top-rated schools, new construction, and established neighborhoods.',
    center: [-76.29, 36.70] as [number, number],
    boundary: [
      [-76.55, 36.82], [-76.10, 36.82], [-76.10, 36.55],
      [-76.55, 36.55], [-76.55, 36.82],
    ] as [number, number][],
  },
  {
    id: 'suffolk',
    name: 'Suffolk',
    slug: 'suffolk',
    desc: 'Room to grow with country estates and master-planned communities.',
    center: [-76.72, 36.73] as [number, number],
    boundary: [
      [-77.05, 36.98], [-76.55, 36.98], [-76.55, 36.55],
      [-77.05, 36.55], [-77.05, 36.98],
    ] as [number, number][],
  },
  {
    id: 'hampton',
    name: 'Hampton',
    slug: 'hampton',
    desc: 'Waterfront access, military-friendly, and historically rich neighborhoods.',
    center: [-76.34, 37.04] as [number, number],
    boundary: [
      [-76.46, 37.12], [-76.25, 37.12], [-76.25, 36.98],
      [-76.46, 36.98], [-76.46, 37.12],
    ] as [number, number][],
  },
  {
    id: 'newport-news',
    name: 'Newport News',
    slug: 'newport-news',
    desc: 'Diverse housing stock with strong value and easy access to the Peninsula.',
    center: [-76.57, 37.11] as [number, number],
    boundary: [
      [-76.72, 37.22], [-76.46, 37.22], [-76.46, 37.05],
      [-76.72, 37.05], [-76.72, 37.22],
    ] as [number, number][],
  },
]

type City = typeof CITIES[number]

export default function HamptonRoadsMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const router = useRouter()
  const [hoveredCity, setHoveredCity] = useState<City | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !TOKEN) return

    let map: any

    const init = async () => {
      const mapboxgl = (await import('mapbox-gl')).default
      await import('mapbox-gl/dist/mapbox-gl.css')

      mapboxgl.accessToken = TOKEN

      map = new mapboxgl.Map({
        container: containerRef.current!,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-76.35, 36.87],
        zoom: 9,
        attributionControl: false,
        pitchWithRotate: false,
        dragRotate: false,
      })

      mapRef.current = map

      map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right')

      map.on('load', () => {
        // Add each city as a fill + outline layer
        for (const city of CITIES) {
          map.addSource(`${city.id}-source`, {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [city.boundary],
              },
              properties: { id: city.id },
            },
          })

          map.addLayer({
            id: `${city.id}-fill`,
            type: 'fill',
            source: `${city.id}-source`,
            paint: {
              'fill-color': '#2563eb',
              'fill-opacity': 0.06,
            },
          })

          map.addLayer({
            id: `${city.id}-outline`,
            type: 'line',
            source: `${city.id}-source`,
            paint: {
              'line-color': '#2563eb',
              'line-width': 1.5,
              'line-opacity': 0.45,
            },
          })

          // City label marker
          const el = document.createElement('div')
          el.style.cssText = `
            background: rgba(255,255,255,0.92);
            border: 1px solid rgba(37,99,235,0.3);
            border-radius: 6px;
            padding: 4px 9px;
            font-family: Inter, sans-serif;
            font-size: 11px;
            font-weight: 700;
            color: #1a1a1a;
            letter-spacing: 0.02em;
            pointer-events: none;
            box-shadow: 0 1px 4px rgba(0,0,0,0.1);
            white-space: nowrap;
          `
          el.textContent = city.name

          new mapboxgl.Marker({ element: el, anchor: 'center' })
            .setLngLat(city.center)
            .addTo(map)

          // Hover — mouseenter
          map.on('mouseenter', `${city.id}-fill`, () => {
            map.setPaintProperty(`${city.id}-fill`, 'fill-opacity', 0.22)
            map.setPaintProperty(`${city.id}-outline`, 'line-opacity', 1)
            map.setPaintProperty(`${city.id}-outline`, 'line-width', 2.5)
            map.getCanvas().style.cursor = 'pointer'
            setHoveredCity(city)
          })

          // Hover — mouseleave
          map.on('mouseleave', `${city.id}-fill`, () => {
            map.setPaintProperty(`${city.id}-fill`, 'fill-opacity', 0.06)
            map.setPaintProperty(`${city.id}-outline`, 'line-opacity', 0.45)
            map.setPaintProperty(`${city.id}-outline`, 'line-width', 1.5)
            map.getCanvas().style.cursor = ''
            setHoveredCity(null)
          })

          // Click — navigate to city page
          map.on('click', `${city.id}-fill`, () => {
            router.push(`/${city.slug}`)
          })
        }
      })
    }

    init()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', borderRadius: 'inherit' }} />

      {/* Hover info panel */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        zIndex: 10,
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(37,99,235,0.2)',
        borderRadius: 10,
        padding: '14px 18px',
        minWidth: 220,
        maxWidth: 280,
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        pointerEvents: 'none',
        transition: 'opacity 0.15s ease',
      }}>
        {hoveredCity ? (
          <>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 4, fontFamily: 'Inter,sans-serif' }}>
              {hoveredCity.name}
            </div>
            <div style={{ fontSize: 13, color: '#555550', lineHeight: 1.5, fontFamily: 'Inter,sans-serif', marginBottom: 8 }}>
              {hoveredCity.desc}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', fontFamily: 'Inter,sans-serif' }}>
              Click to explore →
            </div>
          </>
        ) : (
          <div style={{ fontSize: 13, color: '#888884', fontFamily: 'Inter,sans-serif' }}>
            Hover a city to explore
          </div>
        )}
      </div>
    </div>
  )
}
