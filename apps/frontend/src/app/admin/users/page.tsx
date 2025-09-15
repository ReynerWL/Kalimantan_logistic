'use client';
import { useEffect, useState } from 'react';
import { useApi } from '@/lib/api';
import { Table, Button, Modal, Form, Input, Select, message, Upload } from 'antd';

export default function UsersAdmin() {
    const api = useApi();
	const [data, setData] = useState<any[]>([]);
	const [open, setOpen] = useState(false);
	const [form] = Form.useForm();
	const load = async () => {
		const res = await api.get('/users');
		setData(res.data);
	};
	useEffect(() => { load(); }, []);
	const onCreate = async () => {
		const values = await form.validateFields();
		await api.post('/users', values);
		message.success('User dibuat');
		setOpen(false);
		load();
	};
	const onExport = async () => {
		const res = await api.get('/users/export/csv', { responseType: 'blob' });
		const url = URL.createObjectURL(res.data);
		const a = document.createElement('a');
		a.href = url; a.download = 'users.csv'; a.click();
		URL.revokeObjectURL(url);
	};
	return (
		<div>
			<div className="flex justify-between mb-4">
				<h1 className="text-xl font-semibold">Users</h1>
				<div className="flex gap-2">
					<Button onClick={onExport}>Export CSV</Button>
					<Upload showUploadList={false} customRequest={async ({ file, onSuccess, onError }) => {
						try {
							const formData = new FormData();
							formData.append('file', file as any);
							await api.post('/users/import/csv', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
							message.success('Import sukses');
							load();
							(onSuccess as any)('ok');
						} catch (e) { (onError as any)(e); }
					}}>
						<Button>Import CSV</Button>
					</Upload>
					<Button type="primary" onClick={() => setOpen(true)}>Tambah</Button>
				</div>
			</div>
			<Table rowKey="id" dataSource={data} columns={[
				{ title: 'Nama', dataIndex: 'name' },
				{ title: 'Email', dataIndex: 'email' },
				{ title: 'Role', dataIndex: 'role' },
			]} />
			<Modal open={open} onCancel={() => setOpen(false)} onOk={onCreate} title="Tambah User">
				<Form layout="vertical" form={form}>
					<Form.Item name="name" label="Nama" rules={[{ required: true }]}><Input /></Form.Item>
					<Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
					<Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}><Input.Password /></Form.Item>
					<Form.Item name="role" label="Role" rules={[{ required: true }]}>
						<Select options={[{ value: 'admin', label: 'Admin' }, { value: 'driver', label: 'Driver' }]} />
					</Form.Item>
				</Form>
			</Modal>
		</div>
	);
}
