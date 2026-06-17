import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import { renderToStaticMarkup } from 'react-dom/server'
import L from 'leaflet'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

export type ClusterPoint = {
  id: string | number
  lat: number
  lng: number
  popup: React.ReactNode
}

/**
 * Raggruppa i marker vicini in un unico indicatore (spider/cluster),
 * come fanno i portali immobiliari. Usa il plugin leaflet.markercluster
 * direttamente via `useMap`, così resta indipendente dalla versione di
 * react-leaflet (v5 + React 19).
 */
export default function ClusteredMarkers({ points }: { points: ClusterPoint[] }) {
  const map = useMap()

  useEffect(() => {
    const group = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
    })

    points.forEach((p) => {
      const marker = L.marker([p.lat, p.lng])
      marker.bindPopup(renderToStaticMarkup(<>{p.popup}</>), { minWidth: 180 })
      group.addLayer(marker)
    })

    map.addLayer(group)
    return () => {
      map.removeLayer(group)
    }
  }, [map, points])

  return null
}
