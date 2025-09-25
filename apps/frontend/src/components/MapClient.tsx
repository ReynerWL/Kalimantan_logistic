'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; // ← Critical: Must be imported here

// Fix default icon issue (no extra spaces!)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
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
  // Optional: Custom highlighted icon
  const highlightedIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  const defaultIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  // Workaround for React Leaflet not auto-updating size after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  return (
    <MapContainer
      center={[HUB.lat, HUB.lng]}
      zoom={12}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
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
          icon={selectedPoint?.id === p.id ? highlightedIcon : defaultIcon}
          eventHandlers={{
            click: () => onPointClick?.(p),
          }}
        >
          <Popup>
            <div>
              <strong>{p.name}</strong>
              <br />
              {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}