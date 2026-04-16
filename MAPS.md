# Maps Configuration — Legacy Home Search

## Style

All maps on this site use the **Mapbox Standard style**:

```
mapbox://styles/mapbox/standard
```

This style provides:
- 3D buildings (auto-rendered when zoomed in)
- Points of interest (restaurants, schools, businesses, etc.)
- Major and minor road labels
- Terrain and water features
- Clean, modern basemap that matches the site's light design

Do **not** use `light-v11` or `dark-v11` — Standard is the correct style for all maps.

---

## Map Types

### CommunityMap (`components/CommunityMap.tsx`)

Used on individual city/community pages. Shows a single city boundary with a marker and label.

```ts
new mapboxgl.Map({
  style: 'mapbox://styles/mapbox/standard',
  center,   // [lng, lat] — passed as prop per city
  zoom,     // passed as prop per city (typically 11–12)
  pitch: 45,
  attributionControl: false,
})
```

- `pitch: 45` gives a 3D perspective that shows buildings
- Navigation control added (`showCompass: false`) — lets users pan and zoom
- Attribution control added (compact, bottom-right)
- `dragRotate` and `pitchWithRotate` are **not disabled** — users can tilt and rotate

### HamptonRoadsMap (`components/HamptonRoadsMap.tsx`)

Used on the homepage and `/communities` page. Shows all 6 Hampton Roads cities as interactive polygon overlays.

```ts
new mapboxgl.Map({
  style: 'mapbox://styles/mapbox/standard',
  center: [-76.35, 36.87],
  zoom: 9,
  pitch: 30,
  attributionControl: false,
})
```

- `pitch: 30` — lighter 3D tilt appropriate for a regional overview
- No navigation control (overview context — not meant for deep navigation)
- Attribution control compact, bottom-right

---

## Layer Slots (Mapbox Standard Style)

The Standard style uses a slot system. Always specify `slot` when adding custom layers:

| Layer type | Slot | Reason |
|------------|------|--------|
| Fill (city boundary) | `'middle'` | Above terrain/water, below 3D buildings — boundary is visible but doesn't obscure buildings |
| Line (city outline) | `'top'` | Above all basemap features — border always visible |

Example:
```ts
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
```

---

## City Boundary Coordinates

Approximate GeoJSON polygon boundaries for the 6 Hampton Roads cities used in `HamptonRoadsMap`:

```ts
Virginia Beach:  [[-76.27,36.98],[-75.97,36.98],[-75.9,36.92],[-75.9,36.66],[-76.0,36.55],[-76.2,36.55],[-76.27,36.72],[-76.27,36.98]]
Norfolk:         [[-76.37,36.97],[-76.22,36.97],[-76.22,36.83],[-76.30,36.83],[-76.37,36.90],[-76.37,36.97]]
Chesapeake:      [[-76.55,36.82],[-76.10,36.82],[-76.10,36.55],[-76.55,36.55],[-76.55,36.82]]
Suffolk:         [[-77.05,36.98],[-76.55,36.98],[-76.55,36.55],[-77.05,36.55],[-77.05,36.98]]
Hampton:         [[-76.46,37.12],[-76.25,37.12],[-76.25,36.98],[-76.46,36.98],[-76.46,37.12]]
Newport News:    [[-76.72,37.22],[-76.46,37.22],[-76.46,37.05],[-76.72,37.05],[-76.72,37.22]]
```

City centers (for markers/labels):
```ts
Virginia Beach:  [-76.0, 36.85]
Norfolk:         [-76.29, 36.89]
Chesapeake:      [-76.29, 36.70]
Suffolk:         [-76.72, 36.73]
Hampton:         [-76.34, 37.04]
Newport News:    [-76.57, 37.11]
```

---

## Hover Interactions (HamptonRoadsMap)

On `mouseenter` for a city fill layer:
```ts
map.setPaintProperty(`${city.id}-fill`, 'fill-opacity', 0.22)
map.setPaintProperty(`${city.id}-outline`, 'line-opacity', 1)
map.setPaintProperty(`${city.id}-outline`, 'line-width', 2.5)
map.getCanvas().style.cursor = 'pointer'
setHoveredCity(city)
```

On `mouseleave`:
```ts
map.setPaintProperty(`${city.id}-fill`, 'fill-opacity', 0.06)
map.setPaintProperty(`${city.id}-outline`, 'line-opacity', 0.45)
map.setPaintProperty(`${city.id}-outline`, 'line-width', 1.5)
map.getCanvas().style.cursor = ''
setHoveredCity(null)
```

On `click`: `router.push('/' + city.slug)`

---

## Dynamic Import Pattern

Both map components use dynamic import to avoid SSR errors with mapbox-gl:

```ts
const init = async () => {
  const mapboxgl = (await import('mapbox-gl')).default
  await import('mapbox-gl/dist/mapbox-gl.css')
  mapboxgl.accessToken = TOKEN
  // ...
}
```

`CommunityMapWrapper.tsx` wraps `CommunityMap` with Next.js `dynamic()` and `ssr: false` for community pages.

---

## Token

```
NEXT_PUBLIC_MAPBOX_TOKEN
```

Set in `.env.local` and Vercel environment variables.
