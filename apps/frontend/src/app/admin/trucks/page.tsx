'use client';

import { useEffect, useState } from 'react';
import { useApi } from '@/lib/api';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Card,
  Typography,
  Space,
  Upload,
  message,
  Spin,
} from 'antd';
import { PlusOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';

const { Title } = Typography;

export default function TrucksAdmin() {
  const api = useApi();
  const [data, setData] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Load trucks
  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/trucks');
      setData(res.data || []);
    } catch (err) {
      message.error('Gagal memuat data truk');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Create new truck
  const onCreate = async () => {
    try {
      setSubmitting(true);
      const values = await form.validateFields();

      await api.post('/trucks', values);
      message.success('Truck berhasil dibuat');

      form.resetFields();
      setOpen(false);
      load(); // Refresh list
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Gagal membuat truck');
    } finally {
      setSubmitting(false);
    }
  };

  // Export CSV
  const onExport = async () => {
    try {
      const res = await api.get('/trucks/export/csv', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trucks-${new Date().toISOString().split('T')[0]}.csv`;
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
      await api.post('/trucks/import/csv', formData, {
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
      title: 'Model',
      dataIndex: 'model',
      key: 'model',
      render: (model: string) =><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{model || '-'}</div>,
    },
    {
      title: 'Plat Nomor',
      dataIndex: 'plateNumber',
      key: 'plateNumber',
      render: (plate: string) =><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{plate || '-'}</div>,
    },
    {
      title: 'Warna',
      dataIndex: 'color',
      key: 'color',
      render: (color: string) => <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><span className="capitalize">{color}</span></div> ,
    },
    {
      title: 'Konsumsi Bahan Bakar',
      dataIndex: 'literPerKm',
      key: 'literPerKm',
      render: (val: number) =>`${val?.toFixed(2)} L/km`,
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Page Header */}
      <Card style={{ marginBottom: '24px', borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
            🚛 Manajemen Truk
          </Title>
          <Space wrap>
            <Button icon={<DownloadOutlined />} onClick={onExport} loading={loading}>
              Export CSV
            </Button>
            <Upload
              showUploadList={false}
              customRequest={({ file }) => {
                handleImport({ file });
                return { onSuccess: () => {}, onError: () => {} };
              }}
            >
              <Button icon={<UploadOutlined />}>Import CSV</Button>
            </Upload>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
              Tambah Truck
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
          className="responsive-table"
          style={{ minWidth: "600px" }} 
        />
      </Card>

      {/* Add Truck Modal */}
      <Modal
        open={open}
        onCancel={() => {
          form.resetFields();
          setOpen(false);
        }}
        onOk={onCreate}
        confirmLoading={submitting}
        title="Tambah Truck Baru"
        okText="Simpan"
        cancelText="Batal"
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            name="model"
            label="Model Kendaraan"
            rules={[{ required: true, message: 'Harap isi model truk' }]}
          >
            <Input placeholder="Contoh: Isuzu Elf" />
          </Form.Item>

          <Form.Item
            name="plateNumber"
            label="Nomor Plat"
            rules={[{ required: true, message: 'Harap isi nomor plat' }]}
          >
            <Input placeholder="DA 1234 AB" />
          </Form.Item>

          <Form.Item
            name="color"
            label="Warna"
            rules={[{ required: true, message: 'Harap isi warna truk' }]}
          >
            <Input placeholder="Hitam, Biru, Merah, dll." />
          </Form.Item>

          <Form.Item
            name="literPerKm"
            label="Konsumsi BBM (L/km)"
            rules={[
              { required: true, message: 'Harap isi konsumsi bahan bakar' },
              { type: 'number', min: 0.01, max: 50, message: 'Masukkan angka realistis' },
            ]}
          >
            <InputNumber step={0.01} precision={2} placeholder="0.40" className="w-full" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}