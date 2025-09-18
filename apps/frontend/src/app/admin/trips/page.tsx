'use client';

import { useEffect, useState } from 'react';
import { useApi } from '@/lib/api';
import {
  Table,
  Button,
  Modal,
  Form,
  Select,
  DatePicker,
  message,
  Input,
  Space,
  Card,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { render } from 'react-dom';

const { Title } = Typography;

export default function TripsAdmin() {
  const api = useApi();
  const [data, setData] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [users, setUsers] = useState<any[]>([]);
  const [trucks, setTrucks] = useState<any[]>([]);
  const [dps, setDps] = useState<any[]>([]);
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [pagination, setPagination] = useState({
  current: 1,
  pageSize: 10,
  total: 0,
});

  // Load all data
  const loadData = async (page = 1, pageSize = 10) => {
  setLoading(true);
  try {
    const [tripsRes, usersRes, trucksRes, dpsRes] = await Promise.all([
      api.get('/trips', {
        params: { page, limit: pageSize },
      }),
      api.get('/users'),
      api.get('/trucks'),
      api.get('/delivery-points'),
    ]);

    // ✅ Handle paginated response
    setData(tripsRes.data.data || []);
    setPagination(prev => ({
      ...prev,
      current: page,
      pageSize,
      total: tripsRes.data.meta?.total || 0,
    }));

    setUsers(usersRes.data || []);
    setTrucks(trucksRes.data || []);
    setDps(dpsRes.data || []);
  } catch (err) {
    message.error('Gagal memuat data trip');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    loadData();
  }, []);

  // Preview trip cost
  const onPreview = async () => {
    try {
      const values = await form.validateFields(['destinationId', 'truckId', 'tripDate']);

      const res = await api.get('/trips/preview/cost', {
        params: {
          destinationId: values.destinationId,
          truckId: values.truckId,
          startAt: values.tripDate.toISOString(),
          fuelPrice: 10000,
        },
      });

      setPreview(res.data);
    } catch (err: any) {
      message.error('Gagal menghitung perkiraan biaya');
    }
  };

  // Create new trip
  const onCreate = async () => {
    try {
      setSubmitting(true);
      const values = await form.validateFields();

      await api.post('/trips', {
        driverId: values.driverId,
        truckId: values.truckId,
        destinationId: values.destinationId,
        tripDate: values.tripDate.toISOString(),
        miscCost: 0,
      });

      message.success('Trip berhasil dibuat');
      setOpen(false);
      setPreview(null);
      form.resetFields();
      loadData(); // Refresh list
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Gagal membuat trip');
    } finally {
      setSubmitting(false);
    }
  };

  // Export CSV
  const onExport = async () => {
    try {
      const res = await api.get('/trips/export/csv', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trips-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success('CSV berhasil diunduh');
    } catch (err) {
      message.error('Gagal mengekspor CSV');
    }
  };

  const columns = [
    {
      title: 'Driver',
      dataIndex: ['driver', 'name'],
      key: 'driver',
      render: (driver: string)=><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{driver || '-'}</div>
    },
    {
      title: 'Truck',
      dataIndex: ['truck', 'model'],
      render: (_: any, record: any) => (
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <span>{record.truck?.model} ({record.truck?.plateNumber})</span>
        </div>
      ),
    },
    {
      title: 'Tujuan',
      dataIndex: ['destination', 'name'],
      key: 'destination',
      render: (dest: string)=><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dest || '-'}</div> 
    },
    {
      title: 'Tanggal',
      dataIndex: 'tripDate',
      key: 'tripDate',
      render: (date: string) => <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dayjs(date).format('DD-MM-YYYY HH:mm')}</div>,
    },
    {
      title: 'Total Biaya',
      dataIndex: 'totalCost',
      key: 'totalCost',
      render: (value: number) => <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{`Rp ${value.toLocaleString()}`}</div>,
    },
  ];

  return (
    <div style={{ padding: "24px", background: "#f5f5f5", minHeight: "100vh" }}>
      {/* Page Header */}
      <Card style={{ marginBottom: "24px", borderRadius: 8 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Title level={3} style={{ margin: 0, color: "#1890ff" }}>
            📝 Manajemen Trip
          </Title>
          <Space wrap>
            <Button
              icon={<DownloadOutlined />}
              onClick={onExport}
              loading={loading}
            >
              Export CSV
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setOpen(true);
                setPreview(null);
                form.resetFields();
              }}
            >
              Tambah Trip
            </Button>
          </Space>
        </div>
      </Card>

      {/* Data Table */}
      <Card style={{ borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <Table
          rowKey="id"
          dataSource={data}
          columns={columns}
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: false,
            onChange: (page, pageSize) => {
              loadData(page, pageSize);
            },
            position: ["bottomCenter"],
          }}
          scroll={{ x: true }}
          style={{ minWidth: "600px" }} 
          className="responsive-table"
        />
      </Card>

      {/* Add Trip Modal */}
      <Modal
        open={open}
        onCancel={() => {
          form.resetFields();
          setPreview(null);
          setOpen(false);
        }}
        footer={null}
        title="Buat Trip Baru"
        width={640}
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            name="driverId"
            label="Pilih Driver"
            rules={[{ required: true, message: "Harap pilih driver" }]}
          >
            <Select
              placeholder="Pilih driver"
              options={users
                .filter((u) => u.role === "driver")
                .map((u) => ({
                  value: u.id,
                  label: u.name,
                }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item
            name="truckId"
            label="Pilih Truck"
            rules={[{ required: true, message: "Harap pilih truck" }]}
          >
            <Select
              placeholder="Pilih truck"
              options={trucks.map((t) => ({
                value: t.id,
                label: `${t.model} - ${t.plateNumber}`,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="destinationId"
            label="Tujuan"
            rules={[{ required: true, message: "Harap pilih tujuan" }]}
          >
            <Select
              placeholder="Pilih lokasi tujuan"
              options={dps.map((d) => ({
                value: d.id,
                label: d.name,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="tripDate"
            label="Tanggal & Waktu"
            initialValue={dayjs()}
            rules={[{ required: true, message: "Harap isi tanggal" }]}
          >
            <DatePicker showTime format="DD-MM-YYYY HH:mm" className="w-full" />
          </Form.Item>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <Button onClick={onPreview}>Hitung Biaya</Button>
            <Button type="primary" onClick={onCreate} loading={submitting}>
              Simpan Trip
            </Button>
          </div>

          {/* Cost Preview */}
          {preview && (
            <div
              style={{
                marginTop: "16px",
                padding: "16px",
                backgroundColor: "#f0f8ff",
                borderRadius: "8px",
                border: "1px solid #bae7ff",
                fontSize: "14px",
              }}
            >
              <h3 style={{ margin: 0, fontWeight: "bold", color: "#1890ff" }}>
                Perkiraan Biaya
              </h3>
              <p style={{ margin: "8px 0" }}>
                <strong>Jarak:</strong> {preview.distanceKm?.toFixed(1)} km
              </p>
              <p style={{ margin: "8px 0" }}>
                <strong>Durasi:</strong> {preview.durationHours?.toFixed(1)} jam
              </p>
              <p style={{ margin: "8px 0" }}>
                <strong>Bensin:</strong> {preview.fuelUsedLiters?.toFixed(1)} L
                (Rp {Math.round(preview.fuelCost).toLocaleString()})
              </p>
              <p style={{ margin: "8px 0" }}>
                <strong>Makan:</strong> Rp{" "}
                {Math.round(preview.mealCost).toLocaleString()}
              </p>
              <p
                style={{
                  margin: "8px 0",
                  fontWeight: "bold",
                  color: "#1890ff",
                }}
              >
                Total: Rp {Math.round(preview.totalCost).toLocaleString()}
              </p>
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
}

// Icons
function DownloadOutlined() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  );
}

function PlusOutlined() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}