'use client';
import { useEffect, useState } from 'react';
import { useApi } from '@/lib/api';
import { Table, Button, Modal, Form, Select, DatePicker, message, Upload } from 'antd';
import dayjs from 'dayjs';

export default function TripsAdmin() {
	const api = useApi();
	const [data, setData] = useState<any[]>([]);
	const [open, setOpen] = useState(false);
	const [form] = Form.useForm();
	const [users, setUsers] = useState<any[]>([]);
	const [trucks, setTrucks] = useState<any[]>([]);
	const [dps, setDps] = useState<any[]>([]);
	const [preview, setPreview] = useState<any>(null);
	const load = async () => {
		const res = await api.get('/trips');
		setData(res.data);
	};
	useEffect(() => {
		load();
		Promise.all([api.get('/users'), api.get('/trucks'), api.get('/delivery-points')]).then(([u,t,d]) => {
			setUsers(u.data);
			setTrucks(t.data);
			setDps(d.data);
		});
	}, []);
	const onPreview = async () => {
		const values = await form.validateFields();
		const res = await api.get('/trips/preview/cost', {
			params: { destinationId: values.destinationId, truckId: values.truckId, startAt: values.tripDate.toISOString(), fuelPrice: 10000 },
		});
		setPreview(res.data);
	};
	const onCreate = async () => {
		const values = await form.validateFields();
		await api.post('/trips', {
			driverId: values.driverId,
			truckId: values.truckId,
			destinationId: values.destinationId,
			tripDate: values.tripDate.toISOString(),
			miscCost: 0,
		});
		message.success('Trip dibuat');
		setOpen(false);
		setPreview(null);
		load();
	};
	const onExport = async () => {
		const res = await api.get('/trips/export/csv', { responseType: 'blob' });
		const url = URL.createObjectURL(res.data); const a = document.createElement('a'); a.href = url; a.download = 'trips.csv'; a.click(); URL.revokeObjectURL(url);
	};
	return (
		<div>
			<div className="flex justify-between mb-4">
				<h1 className="text-xl font-semibold">Trips</h1>
				<div className="flex gap-2">
					<Button onClick={onExport}>Export CSV</Button>
					<Button type="primary" onClick={() => setOpen(true)}>Tambah</Button>
				</div>
			</div>
			<Table rowKey="id" dataSource={data} columns={[
				{ title: 'Driver', dataIndex: ['driver','name'] },
				{ title: 'Truck', dataIndex: ['truck','model'] },
				{ title: 'Tujuan', dataIndex: ['destination','name'] },
				{ title: 'Tanggal', dataIndex: 'tripDate' },
				{ title: 'Total', dataIndex: 'totalCost' },
			]} />
			<Modal open={open} onCancel={() => { setOpen(false); setPreview(null); }} footer={null} title="Tambah Trip">
				<Form layout="vertical" form={form}>
					<Form.Item name="driverId" label="Driver" rules={[{ required: true }]}>
						<Select options={users.filter((u) => u.role === 'driver').map((u) => ({ value: u.id, label: u.name }))} />
					</Form.Item>
					<Form.Item name="truckId" label="Truck" rules={[{ required: true }]}>
						<Select options={trucks.map((t) => ({ value: t.id, label: `${t.model} - ${t.plateNumber}` }))} />
					</Form.Item>
					<Form.Item name="destinationId" label="Tujuan" rules={[{ required: true }]}>
						<Select options={dps.map((d) => ({ value: d.id, label: d.name }))} />
					</Form.Item>
					<Form.Item name="tripDate" label="Tanggal" initialValue={dayjs()} rules={[{ required: true }]}>
						<DatePicker showTime className="w-full" />
					</Form.Item>
					<div className="flex gap-2">
						<Button onClick={onPreview}>Lihat Perkiraan</Button>
						<Button type="primary" onClick={onCreate}>Simpan</Button>
					</div>
					{preview && (
						<div className="mt-4 space-y-1">
							<div>Jarak: {preview.distanceKm.toFixed(1)} km</div>
							<div>Durasi: {preview.durationHours.toFixed(1)} jam</div>
							<div>Bensin: {preview.fuelUsedLiters.toFixed(1)} L (Rp {Math.round(preview.fuelCost).toLocaleString()})</div>
							<div>Makan: Rp {Math.round(preview.mealCost).toLocaleString()}</div>
							<div>Total: Rp {Math.round(preview.totalCost).toLocaleString()}</div>
						</div>
					)}
				</Form>
			</Modal>
		</div>
	);
}
