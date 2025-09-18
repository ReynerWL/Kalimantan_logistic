'use client';
import { useMap } from 'react-leaflet';
import { useEffect } from 'react';

export default function MapSetup({ setMapInstance }: { setMapInstance: (map: any) => void }) {
  const map = useMap();
  useEffect(() => setMapInstance(map), [map, setMapInstance]);
  return null;
}