// apps/frontend/src/components/MapClient.tsx
'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import map components with SSR disabled
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
  useEffect(() => {
    console.log('Map loaded on client');
  }, []);

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer center={[HUB.lat, HUB.lng]} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Hub */}
        <Marker position={[HUB.lat, HUB.lng]}>
          <Popup>Pusat Logistik</Popup>
        </Marker>

        {/* Delivery Points */}
        {deliveryPoints.map((p) => (
          <Marker
            key={p.id}
            position={[p.latitude, p.longitude]}
            eventHandlers={{
              click: () => onPointClick?.(p),
            }}
          >
            <Popup>
              <strong>{p.name}</strong>
              <br />
              {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}