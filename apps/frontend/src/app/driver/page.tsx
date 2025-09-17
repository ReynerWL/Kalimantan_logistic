"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Button, Modal, Form, Select, DatePicker, Input, message } from "antd";
import dayjs from "dayjs";
import "leaflet/dist/leaflet.css";

// Dynamically import Map components
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});

import L from "leaflet";
import MapSetup from "@/components/MapSetup";

// Fix default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom red circle marker
const customIcon = new L.Icon({
  iconUrl:
    "https://github.com/pointhi/leaflet-color-markers/blob/master/img/marker-icon-2x-red.png?raw=true",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  className: "",
  iconSize: [25, 41],
  iconAnchor: [15, 46],
  popupAnchor: [1, -40],
});

// ✅ Highlighted yellow marker (larger)
const highlightedIcon = new L.Icon({
  iconUrl:
    "https://github.com/pointhi/leaflet-color-markers/blob/master/img/marker-icon-2x-yellow.png?raw=true",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [15, 46],
  popupAnchor: [1, -40],
});

const HUB = { lat: -2.2166, lng: 113.9166 };

export default function MapPage() {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [deliveryPoints, setDeliveryPoints] = useState<any[]>([]);
  const [trucks, setTrucks] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [preview, setPreview] = useState<any>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // 🔍 Search & Detail State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPoint, setSelectedPoint] = useState<any>(null);

  // Load data on mount
  useEffect(() => {
    Promise.all([
      fetch("http://localhost:3001/delivery-points").then((r) => r.json()),
      fetch("http://localhost:3001/trucks").then((r) => r.json()),
      fetch("http://localhost:3001/users/driver").then((r) => r.json()),
    ])
      .then(([dpRes, truckRes, driverRes]) => {
        const points = Array.isArray(dpRes) ? dpRes : dpRes.data || [];
        const trucksData = Array.isArray(truckRes)
          ? truckRes
          : truckRes.data || [];
        const driversData = Array.isArray(driverRes)
          ? driverRes
          : driverRes.data || [];

        setDeliveryPoints(points);
        setTrucks(trucksData);
        setDrivers(driversData);
      })
      .catch((err) => console.error("Failed to load ", err));
  }, []);

  // 🔎 Handle search input change
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (!value.trim()) {
      // ✅ Clear selection when search is empty
      setSelectedPoint(null);
      return;
    }

    const found = deliveryPoints.find((p) => {
      const name = p.name?.toLowerCase() || "";
      const type = p.type?.toLowerCase() || "";
      const val = value.toLowerCase();
      return name.includes(val) || type.includes(val);
    });

    if (found && mapInstance) {
      mapInstance.setView([found.latitude, found.longitude], 14);
      setSelectedPoint(found);
    }
  };

  // ✅ Close detail panel
  const closeDetailPanel = () => {
    setSelectedPoint(null);
    setSearchTerm("");
  };

  // 🧮 Local Trip Cost Calculation Function
  const calculateTripCost = (
    distanceOneWayKm: number,
    fuelRateLPerKm: number
  ) => {
    const roundTripDistance = distanceOneWayKm * 2;
    const fuelUsed = roundTripDistance * fuelRateLPerKm;
    const fuelCost = fuelUsed * 10000; // Rp 10,000 per liter
    const timeHours = roundTripDistance / 40; // Avg speed 40 km/h
    const mealCost = timeHours <= 6 ? 75000 : 75000 * Math.ceil(timeHours / 6); // Rp 75,000 per shift
    const miscCost = roundTripDistance * 2000; // Rp 2,000 per km
    const totalCost = fuelCost + mealCost + miscCost;

    return {
      distance: roundTripDistance,
      timeHours,
      fuelLiters: fuelUsed,
      fuelCostIdr: fuelCost,
      mealCostIdr: mealCost,
      miscCostIdr: miscCost,
      totalCostIdr: totalCost,
    };
  };

  // 🔍 Preview trip cost locally
  const onPreview = async (values: any) => {
  setLoadingPreview(true);
  const { destinationId, truckId } = values;
  const startAt = dayjs(values.startAt).toISOString();

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/trips/preview/cost?${new URLSearchParams({
        destinationId,
        truckId,
        startAt,
      })}`
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to calculate cost');
    }

    const data = await res.json();

    // ✅ Validate required fields
    if (!data.distanceKm || !data.totalCost) {
      throw new Error('Invalid preview response');
    }

    setPreview(data); // ✅ Now safe to use
  } catch (err: any) {
    console.error('Preview failed:', err);
    message.error(`Gagal memperkirakan biaya: ${err.message}`);
    setPreview(null); // Prevent rendering null
  } finally {
    setLoadingPreview(false);
  }
};

  // ✅ Start a new trip
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

    // ✅ Do NOT send preview data — backend will recalculate
    const payload = {
      driverId,
      truckId,
      destinationId,
      tripDate: dayjs(startAt).toISOString(),
      miscCost: preview?.miscCostIdr || 0, // only optional field
    };

    const tripRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/trips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
    console.error('Trip creation error:', e);
    message.error(e.message.includes('Failed to fetch')
      ? 'Tidak dapat terhubung ke server. Cek koneksi.'
      : `Gagal memulai rute: ${e.message}`
    );
  }
};

  return (
    <div className="h-screen w-screen relative">
      {/* Full-Screen Map */}
      <div style={{ height: "100vh", width: "100%" }}>
        <MapContainer
          center={[HUB.lat, HUB.lng]}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
        >
          {/* ✅ Use MapSetup component to safely access map instance */}
          <MapSetup setMapInstance={setMapInstance} />

          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {/* Hub Marker */}
          <Marker position={[HUB.lat, HUB.lng]}>
            <Popup>Pusat Logistik - Jl. G. Obos</Popup>
          </Marker>

          {/* Delivery Point Markers */}
          {deliveryPoints
            .filter(
              (p) =>
                (p.name?.toLowerCase() || "").includes(
                  searchTerm.toLowerCase()
                ) ||
                (p.type?.toLowerCase() || "").includes(searchTerm.toLowerCase())
            )
            .map((p) => {
              const isSelected = selectedPoint?.id === p.id;
              return (
                <Marker
                  key={p.id}
                  position={[p.latitude, p.longitude]}
                  icon={isSelected ? highlightedIcon : customIcon}
                  eventHandlers={{
                    click: () => {
                      setSelectedPoint(p);
                      setSearchTerm(p.name);
                      if (mapInstance) {
                        mapInstance.setView([p.latitude, p.longitude], 14);
                      }
                    },
                  }}
                >
                  <Popup>
                    <div>
                      <strong>{p.name}</strong>
                      Koordinat: {p.latitude.toFixed(4)},{" "}
                      {p.longitude.toFixed(4)}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
        </MapContainer>
      </div>

      {/* ✅ Floating Search Bar */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "80%",
          maxWidth: "400px",
          zIndex: 1000,
        }}
      >
        <Input.Search
          placeholder="Cari rumah sakit atau klinik..."
          value={searchTerm}
          onChange={handleSearch}
          size="large"
          style={{
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        />
      </div>

      {/* ✅ Info Panel for Selected Point */}
      {selectedPoint && (
        <div
          style={{
            position: "absolute",
            top: "90px",
            left: "20px",
            backgroundColor: "white",
            padding: "16px",
            borderRadius: "8px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            zIndex: 1000,
            width: "280px",
            fontSize: "14px",
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          {/* ✅ X Button to Close */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <h3 style={{ margin: 0, color: "#1890ff" }}>
              <strong>{selectedPoint.name}</strong>
            </h3>
            <Button
              type="text"
              size="small"
              onClick={closeDetailPanel}
              style={{ color: "#999", fontWeight: "bold" }}
            >
              ✕
            </Button>
          </div>

          <p style={{ margin: "6px 0", color: "#555" }}>
            Tipe: {selectedPoint.type}
          </p>
          <p style={{ margin: "6px 0", color: "#555" }}>
            Alamat: {selectedPoint.address || "Tidak tersedia"}
          </p>
          <p style={{ margin: "6px 0", color: "#555" }}>
            Koordinat: {selectedPoint.latitude.toFixed(4)},{" "}
            {selectedPoint.longitude.toFixed(4)}
          </p>

          <Button
            size="small"
            type="primary"
            onClick={() => {
              window.open(
                `https://www.google.com/maps/dir/?api=1&origin=${HUB.lat},${HUB.lng}&destination=${selectedPoint.latitude},${selectedPoint.longitude}`,
                "_blank"
              );
            }}
            style={{ marginTop: "10px" }}
          >
            Buka di Google Maps
          </Button>
        </div>
      )}

      {/* ✅ Floating Action Button */}
      <Button
        type="primary"
        onClick={() => setOpen(true)}
        style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          zIndex: 1000,
          fontWeight: "bold",
          boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
          height: "45px",
          width: "130px",
          borderRadius: "8px",
          backgroundColor: "blue",
        }}
      >
        Mulai Rute
      </Button>

      {/* Modal */}
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        title="Mulai Rute"
        footer={null}
      >
        <Form layout="vertical" form={form} onFinish={onPreview}>
          <Form.Item
            name="driverId"
            label="Pilih Driver"
            rules={[{ required: true }]}
          >
            <Select placeholder="Pilih driver">
              {drivers.map((d) => (
                <Select.Option key={d.id} value={d.id}>
                  {d.name} ({d.email})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="destinationId"
            label="Tujuan"
            rules={[{ required: true }]}
          >
            <Select
              options={deliveryPoints.map((d) => ({
                value: d.id,
                label: d.name,
              }))}
            />
          </Form.Item>

          <Form.Item name="truckId" label="Truck" rules={[{ required: true }]}>
            <Select
              options={trucks.map((t) => ({
                value: t.id,
                label: `${t.model} - ${t.policeNumber}`,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="startAt"
            label="Tanggal Mulai"
            rules={[{ required: true }]}
            initialValue={dayjs()}
          >
            <DatePicker showTime className="w-full" format="DD-MM-YYYY HH:mm" />
          </Form.Item>

          <div className="flex gap-2">
            <Button htmlType="submit" loading={loadingPreview}>
              Lihat Perkiraan
            </Button>
            <Button type="primary" onClick={onStart}>
              Mulai Trip
            </Button>
          </div>
        </Form>

        {preview && (
          <div className="mt-4 space-y-1 text-sm">
            <p>
              <strong>Jarak:</strong> {(preview.distanceKm ?? 0).toFixed(1)} km
            </p>
            <p>
              <strong>Durasi:</strong> {(preview.durationHours ?? 0).toFixed(1)}{" "}
              jam
            </p>
            <p>
              <strong>Bensin:</strong>{" "}
              {(preview.fuelUsedLiters ?? 0).toFixed(1)} L (Rp{" "}
              {(preview.fuelCost ?? 0).toLocaleString()})
            </p>
            <p>
              <strong>Makan:</strong> Rp{" "}
              {(preview.mealCost ?? 75000).toLocaleString()}
            </p>
            <p>
              <strong>Total:</strong>{" "}
              <strong>Rp {(preview.totalCost ?? 0).toLocaleString()}</strong>
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ✅ Hook helper
function useMap() {
  const [map, setMap] = useState<L.Map | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("react-leaflet").then(({ useMap: um }) => {
        setMap(um());
      });
    }
  }, []);
  return map;
}
