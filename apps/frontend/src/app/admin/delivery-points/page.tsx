"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/lib/api";
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
  Popconfirm,
  Empty,
} from "antd";
import {
  UploadOutlined,
  PlusOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

export default function DeliveryPointsAdmin() {
  const api = useApi();
  const [data, setData] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<any>(null); // ← Track edit mode
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Load delivery points
  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/delivery-points");
      setData(res.data || []);
    } catch (err) {
      message.error("Gagal memuat titik pengiriman");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Reset form and mode
  const onModalOpen = (point: any = null) => {
    setEditingPoint(point);
    if (point) {
      form.setFieldsValue({
        name: point.name,
        address: point.address,
        type: point.type,
        latitude: point.latitude,
        longitude: point.longitude,
      });
    } else {
      form.resetFields();
    }
    setOpen(true);
  };

  const onModalClose = () => {
    form.resetFields();
    setOpen(false);
    setEditingPoint(null);
  };

  // Create or Update delivery point
  const onSave = async () => {
    try {
      setSubmitting(true);
      const values = await form.validateFields();

      const payload = {
        name: values.name,
        address: values.address,
        type: values.type,
        latitude: parseFloat(values.latitude),
        longitude: parseFloat(values.longitude),
      };

      if (editingPoint) {
        // Update existing
        await api.put(`/delivery-points/${editingPoint.id}`, payload);
        message.success("Titik pengiriman berhasil diperbarui");
      } else {
        // Create new
        await api.post("/delivery-points", payload);
        message.success("Tujuan berhasil dibuat");
      }

      onModalClose();
      load(); // Refresh list
    } catch (err: any) {
      message.error(
        err.response?.data?.message ||
          `Gagal ${editingPoint ? "memperbarui" : "membuat"} titik pengiriman`
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Delete delivery point
  const onDelete = async (id: string) => {
    try {
      await api.delete(`/delivery-points/${id}`);
      message.success("Titik pengiriman dihapus");
      load(); // Refresh
    } catch (err: any) {
      message.error("Gagal menghapus titik pengiriman");
    }
  };

  // Export CSV
  const onExport = async () => {
    try {
      const res = await api.get("/delivery-points/export/csv", {
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `delivery_points-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success("CSV berhasil diunduh");
    } catch (err) {
      message.error("Gagal mengekspor CSV");
    }
  };

  // Import CSV
  const handleImport = async ({ file }: { file: File }) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.post("/delivery-points/import/csv", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      message.success("Impor berhasil");
      load();
    } catch (err: any) {
      message.error(
        err.response?.data?.message ||
          "Gagal mengimpor file. Pastikan format benar."
      );
    }
  };

  const columns = [
    {
      title: "Nama",
      dataIndex: "name",
      key: "name",
      render: (name: string) => (
        <div
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name || "-"}
        </div>
      ),
    },
    {
      title: "Alamat",
      dataIndex: "address",
      key: "address",
      render: (addr: string) => (
        <div
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {addr || "-"}
        </div>
      ),
    },
    {
      title: "Latitude",
      dataIndex: "latitude",
      key: "latitude",
      render: (lat: number) => lat.toFixed(6),
    },
    {
      title: "Longitude",
      dataIndex: "longitude",
      key: "longitude",
      render: (lng: number) => lng.toFixed(6),
    },
    {
      title: "Aksi",
      key: "actions",
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => onModalOpen(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Hapus titik pengiriman?"
            description="Anda tidak dapat mengembalikan data yang telah dihapus."
            onConfirm={() => onDelete(record.id)}
            okText="Ya"
            cancelText="Batal"
          >
            <Button danger icon={<DeleteOutlined />} size="small">
              Hapus
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px", background: "#f5f5f5", minHeight: "100vh" }}>
      {/* Page Header */}
      <style jsx>{`
        .responsive-table {
          font-size: 14px;
          border-collapse: collapse;
        }

        .responsive-table th,
        .responsive-table td {
          padding: 8px 12px;
          white-space: normal;
          word-wrap: break-word;
          max-width: 150px;
        }

        @media (max-width: 768px) {
          .responsive-table {
            font-size: 12px;
          }

          .responsive-table th,
          .responsive-table td {
            padding: 6px 8px;
            max-width: 100px;
          }
        }
      `}</style>
      <Card style={{ marginBottom: "24px", borderRadius: 8 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Title level={3} style={{ margin: 0, color: "#1890ff" }}>
            📍 Manajemen Titik Pengiriman
          </Title>
          <Space wrap>
            <Button
              icon={<DownloadOutlined />}
              onClick={onExport}
              loading={loading}
            >
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
              onClick={() => onModalOpen()}
            >
              Tambah Tujuan
            </Button>
          </Space>
        </div>
      </Card>

      {/* Data Table - Responsive Card Grid */}
<Card style={{ borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
  <div
    className="responsive-table-container"
    style={{
      maxHeight: '700px',
      overflowY: 'auto',
      padding: '4px 0',
    }}
  >
    {data.length === 0 ? (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <Empty description="Tidak ada titik pengiriman ditemukan" />
      </div>
    ) : (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '16px',
          padding: '8px',
        }}
      >
        {data.map((point) => (
          <div
            key={point.id}
            style={{
              border: '1px solid #f0f0f0',
              borderRadius: '8px',
              padding: '16px',
              backgroundColor: '#fff',
              transition: 'box-shadow 0.2s',
              position: 'relative',
            }}
          >
            {/* Header */}
            <div style={{ marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#1890ff' }}>
                {point.name}
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#555' }}>
                {point.address || '-'}
              </p>
            </div>

            {/* Coordinates */}
            <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.5' }}>
              <div><strong>Latitude:</strong> {point.latitude.toFixed(6)}</div>
              <div><strong>Longitude:</strong> {point.longitude.toFixed(6)}</div>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                marginTop: '16px',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
              }}
            >
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onModalOpen(point)}
              >
                Edit
              </Button>
              <Popconfirm
                title="Hapus titik pengiriman?"
                description="Anda tidak dapat mengembalikan data yang telah dihapus."
                onConfirm={() => onDelete(point.id)}
                okText="Ya"
                cancelText="Batal"
              >
                <Button danger size="small" icon={<DeleteOutlined />}>
                  Hapus
                </Button>
              </Popconfirm>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
</Card>
      {/* Add/Edit Modal */}
      <Modal
        open={open}
        title={
          editingPoint
            ? "Edit Titik Pengiriman"
            : "Tambah Titik Pengiriman Baru"
        }
        okText={editingPoint ? "Perbarui" : "Simpan"}
        cancelText="Batal"
        onOk={onSave}
        confirmLoading={submitting}
        onCancel={onModalClose}
        width={600}
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            name="name"
            label="Nama Tempat"
            rules={[{ required: true, message: "Harap isi nama tempat" }]}
          >
            <Input placeholder="RSUD Doris Sylvanus, Puskesmas Pahandut, dll." />
          </Form.Item>

          <Form.Item
            name="address"
            label="Alamat Lengkap"
            rules={[{ required: true, message: "Harap isi alamat" }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Jl. G. Obos No. XX, Palangka Raya"
            />
          </Form.Item>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <Form.Item
              name="latitude"
              label="Latitude"
              rules={[
                { required: true, message: "Harap isi latitude" },
                {
                  type: "number",
                  min: -90,
                  max: 90,
                  message: "Rentang: -90 sampai 90",
                },
              ]}
            >
              <InputNumber
                min={-90}
                max={90}
                step={0.000001}
                precision={6}
                placeholder="-2.202137"
                className="w-full"
              />
            </Form.Item>

            <Form.Item
              name="longitude"
              label="Longitude"
              rules={[
                { required: true, message: "Harap isi longitude" },
                {
                  type: "number",
                  min: -180,
                  max: 180,
                  message: "Rentang: -180 sampai 180",
                },
              ]}
            >
              <InputNumber
                min={-180}
                max={180}
                step={0.000001}
                precision={6}
                placeholder="113.917000"
                className="w-full"
              />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
