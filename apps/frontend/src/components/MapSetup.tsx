'use client';

import { useMap } from 'react-leaflet';
import { useEffect } from 'react';

type Props = {
  setMapInstance: (map: L.Map) => void;
};

export default function MapSetup({ setMapInstance }: Props) {
  const map = useMap();

  useEffect(() => {
    setMapInstance(map);
  }, [map, setMapInstance]);

  return null;
}