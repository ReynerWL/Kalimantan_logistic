// components/MapClient.tsx
'use client';

import { useState } from 'react';
import L from 'leaflet';
import dynamic from 'next/dynamic';
import { DeliveryPoint } from '@/types';

// Icons (same as before)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const customIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const highlightedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Dynamic imports
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

export default function MapClient({
  deliveryPoints,
  selectedPoint,
  onPointClick,
}: {
  deliveryPoints: DeliveryPoint[];
  selectedPoint: DeliveryPoint | null;
  onPointClick: (point: DeliveryPoint) => void;
}) {
  return (
    <MapContainer center={[-2.2166, 113.9166]} zoom={12} style={{ height: '100%', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* Hub */}
      <Marker position={[-2.2166, 113.9166]}>
        <Popup>Pusat Logistik</Popup>
      </Marker>

      {/* Delivery Points */}
      {deliveryPoints.map((p) => (
        <Marker
          key={p.id}
          position={[p.latitude, p.longitude]}
          icon={selectedPoint?.id === p.id ? highlightedIcon : customIcon}
          eventHandlers={{ click: () => onPointClick(p) }}
        >
          <Popup>
            <strong>{p.name}</strong><br />
            {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}