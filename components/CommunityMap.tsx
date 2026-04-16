'use client'
import { useEffect, useRef } from 'react'
import CompassRose from './CompassRose'

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

export interface CommunityMapProps {
  center: [number, number]
  zoom: number
  boundary: [number, number][]
  name: string
  subtitle: string
  id: string
}

export default function CommunityMap({ center, zoom, boundary, name, subtitle, id }: CommunityMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    let map: any

    const init = async () => {
      const mapboxgl = (await import('mapbox-gl')).default
      await import('mapbox-gl/dist/mapbox-gl.css')

      mapboxgl.accessToken = TOKEN

      map = new mapboxgl.Map({
        container: containerRef.current!,
        style: 'mapbox://styles/mapbox/standard',
        center,
        zoom,
        pitch: 45,
        attributionControl: false,
      })

      mapRef.current = map

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
      map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right')

      map.on('load', () => {
        map.addSource(`${id}-boundary`, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [boundary] },
            properties: {},
          },
        })

        map.addLayer({
          id: `${id}-fill`,
          type: 'fill',
          source: `${id}-boundary`,
          slot: 'middle',
          paint: { 'fill-color': '#2563eb', 'fill-opacity': 0.08 },
        })

        map.addLayer({
          id: `${id}-outline`,
          type: 'line',
          source: `${id}-boundary`,
          slot: 'top',
          paint: { 'line-color': '#2563eb', 'line-width': 2, 'line-opacity': 0.7 },
        })

        const el = document.createElement('div')
        el.style.cssText = `
          width: 14px; height: 14px;
          background: #2563eb;
          border: 2px solid #fff;
          border-radius: 50%;
          box-shadow: 0 0 12px rgba(37,99,235,0.5);
        `

        new mapboxgl.Marker({ element: el })
          .setLngLat(center)
          .setPopup(
            new mapboxgl.Popup({ offset: 16 })
              .setHTML(`<div style="font-family:Inter,sans-serif;font-size:13px;font-weight:600;color:#1a1a1a;">${name}</div><div style="font-size:11px;color:#555;margin-top:2px;">${subtitle}</div>`)
          )
          .addTo(map)
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

      {/* Compass — offset below the zoom controls */}
      <CompassRose top={76} />

      <div style={{
        position: 'absolute',
        bottom: '40px',
        left: '16px',
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(37,99,235,0.2)',
        borderRadius: '8px',
        padding: '8px 12px',
        pointerEvents: 'none',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2563eb', fontFamily: 'Inter,sans-serif' }}>
          {name}
        </div>
        <div style={{ fontSize: '11px', color: '#555550', marginTop: '2px', fontFamily: 'Inter,sans-serif' }}>
          {subtitle}
        </div>
      </div>
    </div>
  )
}
