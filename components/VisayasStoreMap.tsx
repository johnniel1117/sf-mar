'use client'

import { useEffect, useRef, useState } from 'react'
import { ExternalLink, X, MapPin } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

type StoreChain = 'vic-imperial' | 'du-ek-sam' | 'metro-retail'

interface StoreLocation {
  id: string
  name: string
  chain: StoreChain
  city: string
  address: string
  lat: number
  lng: number
  placeId?: string
}

// ── Store Data ────────────────────────────────────────────────────────────────

const STORES: StoreLocation[] = [
  // ── Vic Imperial / Imperial Appliance Plaza ──
  { id: 'vi-iloilo-mega',     name: 'Imperial Appliance Plaza Mega Showroom',   chain: 'vic-imperial', city: 'Iloilo City',    address: 'Muelle Loney St, Iloilo City Proper',        lat: 10.7000291, lng: 122.5697442, placeId: 'ChIJkb_LZG7lrjMRrJWdnLO7Aeo' },
  { id: 'vi-iloilo-jaro',     name: 'Imperial Appliance Plaza – Jaro',          chain: 'vic-imperial', city: 'Iloilo City',    address: 'E Lopez St, Jaro, Iloilo City',               lat: 10.7209311, lng: 122.559123,  placeId: 'ChIJVUJuyMHlrjMR_Cw2OwkG5Ls' },
  { id: 'vi-bacolod-araneta', name: 'Imperial Appliance Plaza – Araneta',       chain: 'vic-imperial', city: 'Bacolod City',   address: '69-2 Araneta Ave, Bacolod',                   lat: 10.6651588, lng: 122.9444488, placeId: 'ChIJP-maFdrPrjMRcWiizup-0nw'  },
  { id: 'vi-bacolod-lacson',  name: 'Imperial Appliance Plaza – Lacson',        chain: 'vic-imperial', city: 'Bacolod City',   address: 'Lacson St, Bacolod',                          lat: 10.687835,  lng: 122.957586,  placeId: 'ChIJH9grMI7RrjMRb-6hO8bhbEs'  },
  { id: 'vi-cebu-colon',      name: 'Imperial Appliance Plaza – Colon',         chain: 'vic-imperial', city: 'Cebu City',      address: 'Osmeña Blvd, Cebu City',                      lat: 10.294578,  lng: 123.9024003, placeId: 'ChIJN-vrKeKbqTMR-lIp7e2RwK8'  },
  { id: 'vi-cebu-mandaue',    name: 'Imperial Appliance Plaza – Mandaue',       chain: 'vic-imperial', city: 'Mandaue City',   address: 'A.C. Cortes Ave, Mandaue City',               lat: 10.3408,    lng: 123.9388                                              },
  { id: 'vi-tagbilaran',      name: 'Imperial Appliance Plaza – Tagbilaran',    chain: 'vic-imperial', city: 'Tagbilaran City',address: 'Carlos Garcia North Ave, Tagbilaran',         lat: 9.6531,     lng: 123.8572                                              },
  { id: 'vi-cebu-bogo',       name: 'Imperial Appliance Plaza – Bogo',          chain: 'vic-imperial', city: 'Bogo City',      address: 'P. Rodriguez Street, Bogo City, Cebu',        lat: 11.055,     lng: 124.005                                               },

  // ── Du Ek Sam / DES ──
  { id: 'des-tagbilaran-honda',   name: 'Du Ek Sam – Honda Tagbilaran',         chain: 'du-ek-sam', city: 'Tagbilaran City', address: '52 J.A. Clarin St, Tagbilaran City',           lat: 9.6531898,  lng: 123.8671867, placeId: 'ChIJ35nbljZMqjMRE4eVuLCEgTo'  },
  { id: 'des-tagbilaran-gallares',name: 'Du Ek Sam – Gallares St',              chain: 'du-ek-sam', city: 'Tagbilaran City', address: '63 Celestino Gallares St, Tagbilaran',         lat: 9.642208,   lng: 123.854042,  placeId: 'ChIJBciKs7FNqjMR7yQTS7ACTT8'  },
  { id: 'des-cebu-jakosalem',     name: 'Du Ek Sam – D. Jakosalem',             chain: 'du-ek-sam', city: 'Cebu City',       address: 'D. Jakosalem St, Cebu City',                   lat: 10.295178,  lng: 123.9017701, placeId: 'ChIJXb3GOuKbqTMRKUdeob4RbNI'  },
  { id: 'des-dumaguete',          name: 'Du Ek Sam – Honda 3S Dumaguete',       chain: 'du-ek-sam', city: 'Dumaguete City',  address: 'Real St, Dumaguete City',                      lat: 9.307671,   lng: 123.3054624, placeId: 'ChIJcxIlauBuqzMRU-k3Gz2hWfk'  },
  { id: 'des-iloilo-quezon',      name: 'Du Ek Sam – Quezon St Iloilo',         chain: 'du-ek-sam', city: 'Iloilo City',     address: '44 Quezon St, Iloilo City',                    lat: 10.695491,  lng: 122.5662145, placeId: 'ChIJ3Wl3WG_lrjMRc0mqsZcepBc'  },
  { id: 'des-iloilo-jaro',        name: 'Du Ek Sam – Jaro Iloilo',              chain: 'du-ek-sam', city: 'Iloilo City',     address: 'Lawa-an Village, 5th St, Jaro',                lat: 10.7547715, lng: 122.5728753, placeId: 'ChIJX3uNiI_krjMRHMoJKN19XBI'  },
  { id: 'des-bacolod',            name: 'Du Ek Sam – Honda 3S Bacolod',         chain: 'du-ek-sam', city: 'Bacolod City',    address: 'Cor Rizal & Lacson St, Bacolod',               lat: 10.6677955, lng: 122.9497566, placeId: 'ChIJ77hbZ7HRrjMRE4RcXhlosD4'  },
  { id: 'des-cebu-lahug',         name: 'Du Ek Sam – Lahug Cebu',               chain: 'du-ek-sam', city: 'Cebu City',       address: 'Salinas Dr (Lahug), Cebu City',                lat: 10.3269729, lng: 123.905223                                             },

  // ── Metro Retail ──
  { id: 'metro-colon-dept',       name: 'Metro Department Store – Colon',       chain: 'metro-retail', city: 'Cebu City',     address: 'Colon corner Juan Luna Sts., Cebu City',      lat: 10.296025,  lng: 123.8983942, placeId: 'ChIJrxbrv-KbqTMRaA5Ehvn5N5U'  },
  { id: 'metro-colon-super',      name: 'Metro Colon Supermarket',              chain: 'metro-retail', city: 'Cebu City',     address: 'Colon St, Cebu City',                         lat: 10.2958879, lng: 123.8982403, placeId: 'ChIJO41FleKbqTMR1JC__9Bvb1w'  },
  { id: 'metro-cebu-ayala',       name: 'Metro Supermarket – Ayala Center Cebu',chain: 'metro-retail', city: 'Cebu City',     address: 'Cebu Business Park, Archbishop Reyes Ave',    lat: 10.3173018, lng: 123.9039241, placeId: 'ChIJw-AD_z6ZqTMRAxRxSJlurxY'  },
  { id: 'metro-cebu-itpark',      name: 'Metro Supermarket IT Park',            chain: 'metro-retail', city: 'Cebu City',     address: 'Central Bloc, V. Padriga St, Cebu City',      lat: 10.3299042, lng: 123.9075694, placeId: 'ChIJ5TRwln-ZqTMRsotsK2o2-Jo'  },
  { id: 'metro-super-colon',      name: 'Super Metro – Colon/Junquera',         chain: 'metro-retail', city: 'Cebu City',     address: 'Colon Corner Junquera St, Cebu City',         lat: 10.2977391, lng: 123.9004581, placeId: 'ChIJpak6iViZqTMRXlWUY8RiLGw'  },
  { id: 'metro-mandaue-pacific',  name: 'Metro Supermarket – Pacific Mall',     chain: 'metro-retail', city: 'Mandaue City',  address: 'UN Ave, Pacific Mall, Mandaue',                lat: 10.3408076, lng: 123.9487641, placeId: 'ChIJkTPYD0aYqTMRGXd0MrPZlC4'  },
  { id: 'metro-mandaue-fortuna',  name: 'Metro Supermarket – A.S. Fortuna',     chain: 'metro-retail', city: 'Mandaue City',  address: 'A.S. Fortuna St, Mandaue, Cebu',               lat: 10.3398357, lng: 123.9244294, placeId: 'ChIJi1ov1PuYqTMRhhEKLJBk34g'  },
  { id: 'metro-lapulapu',         name: 'Super Metro – Lapu-Lapu',              chain: 'metro-retail', city: 'Lapu-Lapu City',address: 'M.L. Quezon National Highway, Lapu-Lapu',      lat: 10.313015,  lng: 123.9553298, placeId: 'ChIJNQqx48CZqTMRgbU1IetGzTg'  },
  { id: 'metro-talisay',          name: 'Super Metro – Talisay',                chain: 'metro-retail', city: 'Talisay City',  address: 'Tabunok, Talisay, Cebu',                       lat: 10.2627525, lng: 123.8382562, placeId: 'ChIJY13eSACdqTMRLwPju3sU55M'  },
  { id: 'metro-bogo',             name: 'Super Metro Bogo',                     chain: 'metro-retail', city: 'Bogo City',     address: '888 Lepiten St, Bogo City, Cebu',              lat: 11.055532,  lng: 124.0138395, placeId: 'ChIJY1wdhNNoqDMRiOKr16kjUrw'  },
  { id: 'metro-bacolod-ayala',    name: 'Metro Stores – Ayala Capitol Central', chain: 'metro-retail', city: 'Bacolod City',  address: 'Ayala Capitol Central, Bacolod',               lat: 10.6768487, lng: 122.9487313, placeId: 'ChIJkRZ8LYnRrjMR-PSdFU2rooc'  },
  { id: 'metro-bacolod-sumag',    name: 'Metro Supermarket – Sum-ag',           chain: 'metro-retail', city: 'Bacolod City',  address: 'Sum-ag, Bacolod',                              lat: 10.604356,  lng: 122.9214385, placeId: 'ChIJk3lZG0zPrjMRJT_gNPgIGpQ'  },
  { id: 'metro-tacloban',         name: 'Metro Supermarket – Tacloban',         chain: 'metro-retail', city: 'Tacloban City', address: 'Dadison St, Tacloban City, Leyte',             lat: 11.2322565, lng: 125.0030266, placeId: 'ChIJuVODphl3CDMROAwgcWAwJGM'  },
]

// ── Chain config ──────────────────────────────────────────────────────────────

const CHAIN_CONFIG: Record<StoreChain, { label: string; color: string }> = {
  'vic-imperial': { label: 'Vic Imperial',    color: '#E8192C' },
  'du-ek-sam':    { label: 'Du Ek Sam / DES', color: '#F5A623' },
  'metro-retail': { label: 'Metro Retail',    color: '#58A6FF' },
}

// ── Component ─────────────────────────────────────────────────────────────────

interface VisayasStoreMapProps {
  className?: string
}

export function VisayasStoreMap({ className = '' }: VisayasStoreMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef          = useRef<any>(null)
  const markersRef      = useRef<any[]>([])

  const [selected,     setSelected]     = useState<StoreLocation | null>(null)
  const [activeChains, setActiveChains] = useState<Set<StoreChain>>(
    new Set<StoreChain>(['vic-imperial', 'du-ek-sam', 'metro-retail'])
  )
  const [mapReady, setMapReady] = useState(false)

  // ── Bootstrap Leaflet once (SSR-safe) ────────────────────────────────────
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return

    ;(async () => {
      // Inject CSS once
      if (!document.getElementById('leaflet-css')) {
        const link   = document.createElement('link')
        link.id      = 'leaflet-css'
        link.rel     = 'stylesheet'
        link.href    = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }

      // @ts-ignore dynamic import
      const L = (await import('leaflet')).default

      // Fix default icon path issue with bundlers
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapContainerRef.current!, {
        center:           [10.45, 123.5],
        zoom:             8,
        zoomControl:      false,
        attributionControl: false,
      })

      mapRef.current = map

      // Carto Dark Matter — free, no API key required
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        { attribution: '&copy; <a href="https://carto.com/">CARTO</a>', subdomains: 'abcd', maxZoom: 19 }
      ).addTo(map)

      L.control.zoom({ position: 'topright' }).addTo(map)
      L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map)

      setMapReady(true)
    })()

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  // ── Re-plot markers when ready or filters change ──────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current) return

    ;(async () => {
      // @ts-ignore
      const L = (await import('leaflet')).default

      // Clear old markers
      markersRef.current.forEach(m => m.remove())
      markersRef.current = []

      STORES.filter(s => activeChains.has(s.chain)).forEach(store => {
        const { color } = CHAIN_CONFIG[store.chain]

        const icon = L.divIcon({
          className:   '',
          iconSize:    [26, 34],
          iconAnchor:  [13, 34],
          popupAnchor: [0, -36],
          html: `
            <svg width="26" height="34" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="d${store.id}" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
                  <feColorMatrix in="blur" type="matrix"
                    values="0 0 0 0 ${parseInt(color.slice(1,3),16)/255}
                            0 0 0 0 ${parseInt(color.slice(3,5),16)/255}
                            0 0 0 0 ${parseInt(color.slice(5,7),16)/255}
                            0 0 0 0.8 0" result="glow"/>
                  <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>
              <path d="M13 1C6.925 1 2 5.925 2 12c0 7.6 11 21 11 21S24 19.6 24 12C24 5.925 19.075 1 13 1z"
                fill="${color}" opacity="0.9" filter="url(#d${store.id})"/>
              <circle cx="13" cy="12" r="4.5" fill="white" opacity="0.95"/>
            </svg>`,
        })

        const marker = L.marker([store.lat, store.lng], { icon })
          .addTo(mapRef.current)
          .on('click', () => setSelected(prev => prev?.id === store.id ? null : store))

        markersRef.current.push(marker)
      })
    })()
  }, [mapReady, activeChains])

  const toggleChain = (chain: StoreChain) => {
    setActiveChains(prev => {
      const next = new Set(prev)
      if (next.has(chain)) {
        if (next.size === 1) return prev   // keep at least one chain visible
        next.delete(chain)
      } else {
        next.add(chain)
      }
      return next
    })
  }

  const flyTo = (store: StoreLocation) => {
    mapRef.current?.flyTo([store.lat, store.lng], 15, { duration: 1.2 })
    setSelected(store)
  }

  const visibleCount = STORES.filter(s => activeChains.has(s.chain)).length

  return (
    <div className={`flex flex-col ${className}`}>

      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#6E7681]">
          Store Locations · Visayas
        </p>
        <span className="text-[10px] text-[#484F58] font-mono tabular-nums">
          {visibleCount} / {STORES.length} stores
        </span>
      </div>

      {/* Chain filter pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(CHAIN_CONFIG) as StoreChain[]).map(chain => {
          const { label, color } = CHAIN_CONFIG[chain]
          const active           = activeChains.has(chain)
          const count            = STORES.filter(s => s.chain === chain).length
          return (
            <button
              key={chain}
              onClick={() => toggleChain(chain)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-200"
              style={{
                background: active ? `${color}18` : 'rgba(255,255,255,0.04)',
                border:     `1px solid ${active ? `${color}55` : '#21262D'}`,
                color:      active ? color : '#484F58',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: active ? color : '#484F58' }}
              />
              {label}
              <span className="opacity-60">{count}</span>
            </button>
          )
        })}
      </div>

      {/* Map */}
      <div
        className="relative w-full rounded-xl overflow-hidden border border-[#21262D]"
        style={{ height: 340 }}
      >
        {/* Leaflet mount point */}
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

        {/* Loading spinner */}
        {!mapReady && (
          <div className="absolute inset-0 bg-[#0D1117] flex flex-col items-center justify-center gap-3 z-[500]">
            <div
              className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: '#21262D', borderTopColor: '#E8192C' }}
            />
            <p className="text-[10px] uppercase tracking-widest text-[#484F58]">Loading map…</p>
          </div>
        )}

        {/* Selected store info card */}
        {selected && (
          <div className="absolute bottom-4 left-4 right-16 z-[1000]">
            <div
              className="rounded-xl p-3.5 flex items-start gap-3 shadow-2xl"
              style={{
                background:     '#161B22ee',
                border:         `1px solid ${CHAIN_CONFIG[selected.chain].color}44`,
                backdropFilter: 'blur(14px)',
              }}
            >
              <div
                className="w-0.5 self-stretch rounded-full flex-shrink-0"
                style={{ background: CHAIN_CONFIG[selected.chain].color }}
              />
              <div className="flex-1 min-w-0">
                <p
                  className="text-[12px] font-bold leading-snug"
                  style={{ color: CHAIN_CONFIG[selected.chain].color }}
                >
                  {selected.name}
                </p>
                <p className="text-[10px] text-[#6E7681] mt-0.5">{selected.address}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span
                    className="text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded"
                    style={{
                      background: `${CHAIN_CONFIG[selected.chain].color}18`,
                      color:      CHAIN_CONFIG[selected.chain].color,
                    }}
                  >
                    {CHAIN_CONFIG[selected.chain].label}
                  </span>
                  <span className="text-[10px] text-[#484F58]">{selected.city}</span>
                  {selected.placeId && (
                    <a
                      href={`https://www.google.com/maps/place/?q=place_id:${selected.placeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto flex items-center gap-1 text-[10px] text-[#6E7681] hover:text-[#F5A623] transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Google Maps
                    </a>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="flex-shrink-0 text-[#484F58] hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Store list grouped by city */}
      <div
        className="mt-4 max-h-52 overflow-y-auto pr-1"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#21262D transparent' }}
      >
        {Array.from(new Set(
          STORES.filter(s => activeChains.has(s.chain)).map(s => s.city)
        ))
          .sort()
          .map(city => {
            const cityStores = STORES.filter(s => activeChains.has(s.chain) && s.city === city)
            return (
              <div key={city}>
                <p className="text-[9px] uppercase tracking-widest text-[#30363D] font-bold pt-3 pb-1 px-1">
                  {city}
                </p>
                {cityStores.map(store => {
                  const { color }  = CHAIN_CONFIG[store.chain]
                  const isSelected = selected?.id === store.id
                  return (
                    <button
                      key={store.id}
                      onClick={() => flyTo(store)}
                      className="w-full flex items-center gap-2.5 py-1.5 px-2 rounded-lg text-left transition-all duration-150 group"
                      style={{ background: isSelected ? `${color}12` : 'transparent' }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{
                          background: color,
                          opacity:    isSelected ? 1 : 0.45,
                          boxShadow:  isSelected ? `0 0 6px ${color}` : 'none',
                        }}
                      />
                      <span
                        className="text-[11px] truncate flex-1 transition-colors"
                        style={{ color: isSelected ? color : '#6E7681' }}
                      >
                        {store.name}
                      </span>
                      <MapPin
                        className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-50 transition-opacity"
                        style={{ color }}
                      />
                    </button>
                  )
                })}
              </div>
            )
          })}
      </div>
    </div>
  )
}