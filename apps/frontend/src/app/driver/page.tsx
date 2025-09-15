'use client';
import dynamic from 'next/dynamic';
import type { MapContainerProps, TileLayerProps, MarkerProps } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Button, Modal, Form, Select, DatePicker, message } from 'antd';
import { useEffect, useState } from 'react';
import { useApi } from '@/lib/api';
import dayjs from 'dayjs';
import { useSession } from 'next-auth/react';

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false }) as unknown as React.FC<MapContainerProps>;
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false }) as unknown as React.FC<TileLayerProps>;
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false }) as unknown as React.FC<MarkerProps>;

const HUB = { lat: -2.2166, lng: 113.9166 }; // G. Obos area approx

export default function DriverPage() {
    const api = useApi();
	const { data: session } = useSession();
	const [open, setOpen] = useState(false);
	const [form] = Form.useForm();
	const [deliveryPoints, setDeliveryPoints] = useState<any[]>([]);
	const [trucks, setTrucks] = useState<any[]>([]);
	const [preview, setPreview] = useState<any>(null);

	useEffect(() => {
		Promise.all([
			api.get('/delivery-points'),
			api.get('/trucks'),
		]).then(([dp, tr]) => {
			setDeliveryPoints(dp.data);
			setTrucks(tr.data);
		});
	}, []);

	const onPreview = async (values: any) => {
		const res = await api.get('/trips/preview/cost', {
			params: {
				destinationId: values.destinationId,
				truckId: values.truckId,
				startAt: values.startAt.toISOString(),
				fuelPrice: 10000,
			},
		});
		setPreview(res.data);
	};

	const onStart = async () => {
		const values = await form.validateFields();
		try {
			const { data: dest } = await api.get(`/delivery-points/${values.destinationId}`);
			const res = await api.post('/trips', {
				driverId: (session?.user as any)?.id || (session as any)?.user?.id,
				truckId: values.truckId,
				destinationId: values.destinationId,
				tripDate: values.startAt.toISOString(),
			});
			message.success('Trip dibuat');
			setOpen(false);
			const maps = `https://www.google.com/maps/dir/?api=1&origin=${HUB.lat},${HUB.lng}&destination=${dest.latitude},${dest.longitude}&travelmode=driving`;
			window.open(maps, '_blank');
		} catch (e) {
			message.error('Gagal memulai rute');
		}
	};

	return (
		<div className="h-screen w-screen relative">
			<MapContainer center={[HUB.lat, HUB.lng]} zoom={12} className="h-full w-full">
				<TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
				<Marker position={[HUB.lat, HUB.lng]} />
				{deliveryPoints.map((p) => (
					<Marker key={p.id} position={[p.latitude, p.longitude]} />
				))}
			</MapContainer>
			<Button type="primary" className="!fixed right-6 bottom-6" onClick={() => setOpen(true)}>Mulai Rute</Button>
			<Modal open={open} onCancel={() => setOpen(false)} title="Mulai Rute" footer={null}>
				<Form layout="vertical" form={form} onFinish={onPreview}>
					<Form.Item name="destinationId" label="Tujuan" rules={[{ required: true }]}>
						<Select options={deliveryPoints.map((d) => ({ value: d.id, label: d.name }))} />
					</Form.Item>
					<Form.Item name="truckId" label="Truck" rules={[{ required: true }]}>
						<Select options={trucks.map((t) => ({ value: t.id, label: `${t.model} - ${t.plateNumber}` }))} />
					</Form.Item>
					<Form.Item name="startAt" label="Tanggal Mulai" rules={[{ required: true }]} initialValue={dayjs()}>
						<DatePicker showTime className="w-full" />
					</Form.Item>
					<div className="flex gap-2">
						<Button htmlType="submit">Lihat Perkiraan</Button>
						<Button type="primary" onClick={onStart}>Mulai</Button>
					</div>
				</Form>
				{preview && (
					<div className="mt-4 space-y-1">
						<div>Jarak: {preview.distanceKm.toFixed(1)} km</div>
						<div>Durasi: {preview.durationHours.toFixed(1)} jam</div>
						<div>Bensin: {preview.fuelUsedLiters.toFixed(1)} L (Rp {Math.round(preview.fuelCost).toLocaleString()})</div>
						<div>Makan: Rp {Math.round(preview.mealCost).toLocaleString()}</div>
						<div>Total: Rp {Math.round(preview.totalCost).toLocaleString()}</div>
					</div>
				)}
			</Modal>
		</div>
	);
}
