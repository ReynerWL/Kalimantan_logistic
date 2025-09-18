'use client';

import { useEffect, useState } from 'react';
import { useApi } from '@/lib/api';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Card,
  Typography,
  Space,
  Upload,
  message,
} from 'antd';
import { DownloadOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';

const { Title } = Typography;

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
  const handleImport = async ({ file }: { file: File }) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/users/import/csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      message.success('Impor berhasil');
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
      render: (name: string) =><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name || '-'}</div>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) =><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email || '-'}</div>,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        <span className="capitalize font-medium" style={{
          color: role === 'admin' ? '#1890ff' : '#52c41a',
          backgroundColor: role === 'admin' ? '#e6f7ff' : '#f6ffed',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '13px'
        }}>
          {role}
        </span>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Page Header */}
      <Card style={{ marginBottom: '24px', borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
            👥 Manajemen Pengguna
          </Title>
          <Space wrap>
            <Button icon={<DownloadOutlined />} onClick={onExport} loading={loading}>
              Export CSV
            </Button>
            <Upload
              showUploadList={false}
              customRequest={({ file }) => {
                handleImport({ file: file as File });
                return { onSuccess: () => {}, onError: () => {} };
              }}
            >
              <Button icon={<UploadOutlined />}>Import CSV</Button>
            </Upload>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setOpen(true);
                form.resetFields();
              }}
            >
              Tambah User
            </Button>
          </Space>
        </div>
      </Card>

      {/* Data Table */}
      <Card style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
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
          style={{ minWidth: "600px" }} 
          className="responsive-table"
        />
      </Card>

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
        width={600}
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