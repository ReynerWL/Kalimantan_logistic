'use client';
import { useEffect, useState } from 'react';
import { useApi } from '@/lib/api';
import { Table, Button, Modal, Form, Input, InputNumber, message, Upload } from 'antd';

export default function DeliveryPointsAdmin() {
    const api = useApi();
	const [data, setData] = useState<any[]>([]);
	const [open, setOpen] = useState(false);
	const [form] = Form.useForm();
	const load = async () => {
		const res = await api.get('/delivery-points');
		setData(res.data);
	};
	useEffect(() => { load(); }, []);
	const onCreate = async () => {
		const values = await form.validateFields();
		await api.post('/delivery-points', values);
		message.success('Tujuan dibuat');
		setOpen(false);
		load();
	};
	const onExport = async () => {
		const res = await api.get('/delivery-points/export/csv', { responseType: 'blob' });
		const url = URL.createObjectURL(res.data); const a = document.createElement('a'); a.href = url; a.download = 'delivery_points.csv'; a.click(); URL.revokeObjectURL(url);
	};
	return (
		<div>
			<div className="flex justify-between mb-4">
				<h1 className="text-xl font-semibold">Delivery Points</h1>
				<div className="flex gap-2">
					<Button onClick={onExport}>Export CSV</Button>
					<Upload showUploadList={false} customRequest={async ({ file, onSuccess, onError }) => {
						try {
							const fd = new FormData(); fd.append('file', file as any);
							await api.post('/delivery-points/import/csv', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
							message.success('Import sukses'); load(); (onSuccess as any)('ok');
						} catch (e) { (onError as any)(e); }
					}}>
						<Button>Import CSV</Button>
					</Upload>
					<Button type="primary" onClick={() => setOpen(true)}>Tambah</Button>
				</div>
			</div>
			<Table rowKey="id" dataSource={data} columns={[
				{ title: 'Nama', dataIndex: 'name' },
				{ title: 'Alamat', dataIndex: 'address' },
				{ title: 'Latitude', dataIndex: 'latitude' },
				{ title: 'Longitude', dataIndex: 'longitude' },
			]} />
			<Modal open={open} onCancel={() => setOpen(false)} onOk={onCreate} title="Tambah Delivery Point">
				<Form layout="vertical" form={form}>
					<Form.Item name="name" label="Nama" rules={[{ required: true }]}><Input /></Form.Item>
					<Form.Item name="address" label="Alamat" rules={[{ required: true }]}><Input /></Form.Item>
					<Form.Item name="latitude" label="Latitude" rules={[{ required: true }]}>
						<InputNumber className="w-full" min={-90} max={90} step={0.000001} />
					</Form.Item>
					<Form.Item name="longitude" label="Longitude" rules={[{ required: true }]}>
						<InputNumber className="w-full" min={-180} max={180} step={0.000001} />
					</Form.Item>
				</Form>
			</Modal>
		</div>
	);
}
