'use client';

import { useEffect, useState } from 'react';
import { useApi } from '@/lib/api';
import { Table, Button, Modal, Form, Input, Select, message, Upload, Spin } from 'antd';

export default function UsersAdmin() {
  const api = useApi();
  const [data, setData] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Load users
  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setData(res.data || []);
    } catch (err) {
      message.error('Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Create new user
  const onCreate = async () => {
    try {
      setSubmitting(true);
      const values = await form.validateFields();
      
      await api.post('/users', values);
      message.success('User berhasil dibuat');
      
      form.resetFields();
      setOpen(false);
      load(); // Refresh list
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Gagal membuat user');
    } finally {
      setSubmitting(false);
    }
  };

  // Export CSV
  const onExport = async () => {
    try {
      const res = await api.get('/users/export/csv', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success('CSV berhasil diunduh');
    } catch (err) {
      message.error('Gagal mengekspor CSV');
    }
  };

  // Import CSV
  const handleImport = async ({ file }: { file: any }) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/users/import/csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      message.success('Import berhasil');
      load();
    } catch (err: any) {
      message.error(
        err.response?.data?.message || 'Gagal mengimpor file. Pastikan format benar.'
      );
    }
  };

  const columns = [
    {
      title: 'Nama',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <span className="capitalize font-medium text-gray-700">
          {role}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-xl font-semibold text-gray-800">Manajemen Pengguna</h1>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button onClick={onExport} loading={loading}>
            Export CSV
          </Button>
          <Upload
            showUploadList={false}
            customRequest={({ file }) => {
              handleImport({ file });
              return { onSuccess: () => {}, onError: () => {} };
            }}
          >
            <Button>Import CSV</Button>
          </Upload>
          <Button type="primary" onClick={() => setOpen(true)}>
            Tambah User
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table
          rowKey="id"
          dataSource={data}
          columns={columns}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            position: ['bottomCenter'],
          }}
          scroll={{ x: true }}
        />
      </div>

      {/* Add User Modal */}
      <Modal
        open={open}
        onCancel={() => {
          form.resetFields();
          setOpen(false);
        }}
        onOk={onCreate}
        confirmLoading={submitting}
        title="Tambah Pengguna Baru"
        okText="Simpan"
        cancelText="Batal"
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            name="name"
            label="Nama Lengkap"
            rules={[{ required: true, message: 'Harap isi nama' }]}
          >
            <Input placeholder="Contoh: Budi Santoso" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Harap isi email' },
              { type: 'email', message: 'Format email tidak valid' },
            ]}
          >
            <Input placeholder="budi@example.com" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: 'Harap isi password' },
              { min: 6, message: 'Password minimal 6 karakter' },
            ]}
          >
            <Input.Password placeholder="••••••" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Hak Akses"
            rules={[{ required: true, message: 'Pilih role pengguna' }]}
          >
            <Select placeholder="Pilih hak akses">
              <Select.Option value="admin">Admin</Select.Option>
              <Select.Option value="driver">Driver</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}