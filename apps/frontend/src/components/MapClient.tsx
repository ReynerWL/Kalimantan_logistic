'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import L from 'leaflet';

// Dynamically import Leaflet components with SSR disabled
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const HUB = { lat: -2.2166, lng: 113.9166 };

export default function MapClient({
  deliveryPoints = [],
  selectedPoint,
  onPointClick,
}: {
  deliveryPoints?: any[];
  selectedPoint?: any;
  onPointClick?: (point: any) => void;
}) {
  const [map, setMap] = useState<L.Map | any>(null); // ✅ Type: L.Map | null

  // ✅ Use `whenReady` correctly — it receives the map instance as a parameter
  const handleMapReady = (leafletMap: L.Map | void) => {
    setMap(leafletMap); // ✅ Set the actual map instance
  };

  // Optional: Re-center or resize when map changes
  useEffect(() => {
    if (map) {
      map.invalidateSize();
    }
  }, [map]);

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer
        center={[HUB.lat, HUB.lng]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        whenReady={handleMapReady} // ✅ Correct usage — function that receives map
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Hub Marker */}
        <Marker position={[HUB.lat, HUB.lng]}>
          <Popup>Pusat Logistik - Jl. G. Obos</Popup>
        </Marker>

        {/* Delivery Points */}
        {deliveryPoints.map((p) => (
          <Marker
            key={p.id}
            position={[p.latitude, p.longitude]}
            icon={selectedPoint?.id === p.id
              ? L.icon({
                  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png',
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                })
              : L.icon({
                  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                })}
            eventHandlers={{
              click: () => onPointClick?.(p),
            }}
          >
            <Popup>
              <strong>{p.name}</strong><br />
              {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}