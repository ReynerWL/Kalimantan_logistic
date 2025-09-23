'use client';

import { useEffect, useState, useRef } from 'react';
import { Button, Modal, Form, Select, DatePicker, Input, message } from 'antd';
import dayjs from 'dayjs';
import dynamic from 'next/dynamic';

// ✅ Safe dynamic imports for Leaflet (SSR-safe)
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

// ✅ Import Leaflet only on client side
import L from 'leaflet';
import MapClient from '@/components/MapClient';

// ✅ Fix Leaflet icon paths (critical for map to render)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ✅ Define types
interface DeliveryPoint {
  id: string;
  name: string;
  type: string;
  address?: string;
  latitude: number;
  longitude: number;
}

interface Truck {
  id: string;
  model: string;
  policeNumber: string;
  literPerKm: number;
}

interface Driver {
  id: string;
  name: string;
  email: string;
}

const HUB = { lat: -2.2166, lng: 113.9166 };

export default function MapPage() {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [preview, setPreview] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPoint, setSelectedPoint] = useState<DeliveryPoint | null>(null);
  const [map, setMap] = useState<L.Map | null>(null); // ✅ Use useRef or state for map instance

  const mapRef = useRef<L.Map | null>(null); // ✅ Better: useRef for map instance

  // ✅ Load data from HTTPS API (Vercel is HTTPS, backend must be HTTPS too)
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [dpRes, truckRes, driverRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/delivery-points`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/trucks`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/users?role=driver`),
        ]);

        const points = (await dpRes.json())?.data || [];
        const trucksData = (await truckRes.json())?.data || [];
        const driversData = (await driverRes.json())?.data || [];

        setDeliveryPoints(points);
        setTrucks(trucksData);
        setDrivers(driversData);
      } catch (err) {
        console.error('Failed to load data:', err);
        message.error('Failed to load data. Please check your API connection.');
      }
    };

    fetchAllData();
  }, []);

  // ✅ Handle search input
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (!value.trim()) {
      setSelectedPoint(null);
      return;
    }

    const found = deliveryPoints.find(p =>
      p.name?.toLowerCase().includes(value.toLowerCase()) ||
      p.type?.toLowerCase().includes(value.toLowerCase())
    );

    if (found) {
      setSelectedPoint(found);
      setSearchTerm(found.name);
      // Optional: center map on point
      if (mapRef.current) {
        mapRef.current.setView([found.latitude, found.longitude], 14);
      }
    }
  };

  // ✅ Close detail panel
  const closeDetailPanel = () => {
    setSelectedPoint(null);
    setSearchTerm('');
  };

  // ✅ Calculate route distance
  const calculateRouteDistance = async (dest: { latitude: number; longitude: number }): Promise<number> => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${HUB.lng},${HUB.lat};${dest.longitude},${dest.latitude}?overview=false&steps=false`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Route failed');
      const data = await res.json();
      return data.routes[0].distance / 1000; // meters → km
    } catch (err) {
      console.warn('OSRM failed, using haversine fallback');
      return haversineDistance(HUB.lat, HUB.lng, dest.latitude, dest.longitude);
    }
  };

  // ✅ Haversine distance fallback
  const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // ✅ Calculate trip cost
  const calculateTripCost = async (destination: DeliveryPoint, truck: Truck) => {
    const oneWayKm = await calculateRouteDistance(destination);
    const roundTripKm = oneWayKm * 2;
    const durationHours = roundTripKm / 40;

    const fuelUsed = roundTripKm * truck.literPerKm;
    const fuelCost = fuelUsed * 10000;
    const mealCost = durationHours <= 6 ? 75000 : 75000 * Math.ceil(durationHours / 6);
    const miscCost = roundTripKm * 2000;
    const totalCost = fuelCost + mealCost + miscCost;

    return {
      distanceKm: roundTripKm,
      durationHours,
      fuelUsedLiters: fuelUsed,
      fuelCostIdr: fuelCost,
      mealCostIdr: mealCost,
      miscCostIdr: miscCost,
      totalCostIdr: totalCost,
    };
  };

  // ✅ Handle preview calculation
  const onPreview = async (values: any) => {
    setLoadingPreview(true);
    try {
      const { destinationId, truckId } = values;
      const selectedTruck = trucks.find((t) => t.id === truckId);
      const deliveryPoint = deliveryPoints.find((p) => p.id === destinationId);

      if (!selectedTruck || !deliveryPoint) {
        message.error('Invalid truck or destination');
        return;
      }

      const cost = await calculateTripCost(deliveryPoint, selectedTruck);
      setPreview(cost);
    } catch (err: any) {
      message.error('Could not calculate route cost');
      setPreview(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  // ✅ Handle trip start
  const onStart = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    const { driverId, truckId, destinationId, startAt } = values;

    try {
      const destRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/delivery-points/${destinationId}`);
      if (!destRes.ok) throw new Error('Destination not found');
      const dest = await destRes.json();

      const payload = {
        driverId,
        truckId,
        destinationId,
        tripDate: dayjs(startAt).toISOString(),
        miscCost: preview?.miscCostIdr || 0,
      };

      const tripRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/trips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseData = await tripRes.json();

      if (!tripRes.ok) {
        message.error(`Gagal memulai rute: ${responseData.message || 'Unknown error'}`);
        return;
      }

      message.success('Trip dibuat');
      setOpen(false);

      const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${HUB.lat},${HUB.lng}&destination=${dest.latitude},${dest.longitude}&travelmode=driving`;
      window.open(mapsUrl, '_blank');
    } catch (e: any) {
      message.error(
        e.message.includes('Failed to fetch')
          ? 'Tidak dapat terhubung ke server.'
          : `Gagal memulai rute: ${e.message}`
      );
    }
  };

  // ✅ Handle map ready event — this is critical
  const handleMapReady = (leafletMap: L.Map | any | void) => {
    mapRef.current = leafletMap; // ✅ Store reference
    setMap(leafletMap); // ✅ Also set state if needed
    leafletMap.invalidateSize(); // ✅ Fix: resize map after render
  };

  return (
    <div className="h-screen w-screen relative bg-gray-50">
      {/* Full-Screen Map */}
      <div style={{ height: '100vh', width: '100%' }}>
        <MapClient
          deliveryPoints={deliveryPoints}
          selectedPoint={selectedPoint}
          onPointClick={setSelectedPoint}
        />
      </div>

      {/* Floating Search Bar */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '80%',
        maxWidth: '400px',
        zIndex: 1000,
      }}>
        <Input.Search
          placeholder="Cari rumah sakit atau klinik..."
          value={searchTerm}
          onChange={handleSearch}
          size="large"
          style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        />
      </div>

      {/* Info Panel */}
      {selectedPoint && (
        <div style={{
          position: 'absolute',
          top: '90px',
          left: '20px',
          backgroundColor: 'white',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          zIndex: 1000,
          width: '280px',
          fontSize: '14px',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <h3 style={{ margin: 0, color: '#1890ff' }}><strong>{selectedPoint.name}</strong></h3>
            <Button type="text" size="small" onClick={closeDetailPanel} style={{ color: '#999' }}>✕</Button>
          </div>
          <p style={{ margin: '6px 0', color: '#555' }}>Tipe: {selectedPoint.type}</p>
          <p style={{ margin: '6px 0', color: '#555' }}>Alamat: {selectedPoint.address || 'Tidak tersedia'}</p>
          <p style={{ margin: '6px 0', color: '#555' }}>
            Koordinat: {selectedPoint.latitude.toFixed(4)}, {selectedPoint.longitude.toFixed(4)}
          </p>
          <Button
            size="small"
            type="primary"
            onClick={() => {
              window.open(
                `https://www.google.com/maps/dir/?api=1&origin=${HUB.lat},${HUB.lng}&destination=${selectedPoint.latitude},${selectedPoint.longitude}`,
                '_blank'
              );
            }}
            style={{ marginTop: '10px' }}
          >
            Buka di Google Maps
          </Button>
          <div style={{ marginTop: '10px' }}>
            <Button
              type="primary"
              onClick={() => setOpen(true)}
              style={{
                height: '30px',
                width: '100%',
                borderRadius: '8px',
                backgroundColor: '#1890ff',
              }}
            >
              Mulai Rute
            </Button>
          </div>
        </div>
      )}

      {/* FAB */}
      <Button
        type="primary"
        onClick={() => setOpen(true)}
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
          fontWeight: 'bold',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          height: '45px',
          width: '130px',
          borderRadius: '8px',
          backgroundColor: '#1890ff',
        }}
      >
        Mulai Rute
      </Button>

      {/* Modal */}
      <Modal open={open} onCancel={() => setOpen(false)} title="Mulai Rute" footer={null}>
        <Form layout="vertical" form={form} onFinish={onPreview}>
          <Form.Item name="driverId" label="Pilih Driver" rules={[{ required: true }]}>
            <Select placeholder="Pilih driver">
              {drivers.map(d => (
                <Select.Option key={d.id} value={d.id}>{d.name} ({d.email})</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="destinationId" label="Tujuan" rules={[{ required: true }]}>
            <Select options={deliveryPoints.map(d => ({ value: d.id, label: d.name }))} />
          </Form.Item>

          <Form.Item name="truckId" label="Truck" rules={[{ required: true }]}>
            <Select options={trucks.map(t => ({ value: t.id, label: `${t.model} - ${t.policeNumber}` }))} />
          </Form.Item>

          <Form.Item name="startAt" label="Tanggal Mulai" rules={[{ required: true }]} initialValue={dayjs()}>
            <DatePicker showTime className="w-full" format="DD-MM-YYYY HH:mm" />
          </Form.Item>

          <div className="flex gap-2">
            <Button htmlType="submit" loading={loadingPreview}>Lihat Perkiraan</Button>
            <Button type="primary" onClick={onStart}>Mulai Trip</Button>
          </div>
        </Form>

        {preview && (
          <div className="mt-4 space-y-1 text-sm border-t pt-2">
            <p><strong>Jarak:</strong> {(preview.distanceKm ?? 0).toFixed(1)} km</p>
            <p><strong>Durasi:</strong> {(preview.durationHours ?? 0).toFixed(1)} jam</p>
            <p><strong>Bensin:</strong> {(preview.fuelUsedLiters ?? 0).toFixed(1)} L (Rp {(preview.fuelCostIdr ?? 0).toLocaleString()})</p>
            <p><strong>Makan:</strong> Rp {(preview.mealCostIdr ?? 75000).toLocaleString()}</p>
            <p><strong>Total:</strong> <strong>Rp {(preview.totalCostIdr ?? 0).toLocaleString()}</strong></p>
          </div>
        )}
      </Modal>
    </div>
  );
}