

'use client';
import { useEffect, useState } from 'react';
import { useApi } from '@/lib/api';
import { Table, Button, Modal, Form, Input, InputNumber, message, Upload } from 'antd';

export default function TrucksAdmin() {
    const api = useApi();
	const [data, setData] = useState<any[]>([]);
	const [open, setOpen] = useState(false);
	const [form] = Form.useForm();
	const load = async () => {
		const res = await api.get('/trucks');
		setData(res.data);
	};
	useEffect(() => { load(); }, []);
	const onCreate = async () => {
		const values = await form.validateFields();
		await api.post('/trucks', values);
		message.success('Truck dibuat');
		setOpen(false);
		load();
	};
	const onExport = async () => {
		const res = await api.get('/trucks/export/csv', { responseType: 'blob' });
		const url = URL.createObjectURL(res.data); const a = document.createElement('a'); a.href = url; a.download = 'trucks.csv'; a.click(); URL.revokeObjectURL(url);
	};
	return (
		<div>
			<div className="flex justify-between mb-4">
				<h1 className="text-xl font-semibold">Trucks</h1>
				<div className="flex gap-2">
					<Button onClick={onExport}>Export CSV</Button>
					<Upload showUploadList={false} customRequest={async ({ file, onSuccess, onError }) => {
						try {
							const fd = new FormData(); fd.append('file', file as any);
							await api.post('/trucks/import/csv', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
							message.success('Import sukses'); load(); (onSuccess as any)('ok');
						} catch (e) { (onError as any)(e); }
					}}>
						<Button>Import CSV</Button>
					</Upload>
					<Button type="primary" onClick={() => setOpen(true)}>Tambah</Button>
				</div>
			</div>
			<Table rowKey="id" dataSource={data} columns={[
				{ title: 'Model', dataIndex: 'model' },
				{ title: 'Plat', dataIndex: 'plateNumber' },
				{ title: 'Warna', dataIndex: 'color' },
				{ title: 'Liter/Km', dataIndex: 'literPerKm' },
			]} />
			<Modal open={open} onCancel={() => setOpen(false)} onOk={onCreate} title="Tambah Truck">
				<Form layout="vertical" form={form}>
					<Form.Item name="model" label="Model" rules={[{ required: true }]}><Input /></Form.Item>
					<Form.Item name="plateNumber" label="Plat" rules={[{ required: true }]}><Input /></Form.Item>
					<Form.Item name="color" label="Warna" rules={[{ required: true }]}><Input /></Form.Item>
					<Form.Item name="literPerKm" label="Liter/Km" rules={[{ required: true }]}>
						<InputNumber min={0} step={0.01} className="w-full" />
					</Form.Item>
				</Form>
			</Modal>
		</div>
	);
}
