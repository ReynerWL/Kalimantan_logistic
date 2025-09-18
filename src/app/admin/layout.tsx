'use client';

import { useState } from 'react';
import { Layout, Menu, Button, Drawer } from 'antd';
import { useRouter } from 'next/navigation';
import { 
  UserOutlined, 
  LogoutOutlined, 
  CarOutlined, 
  DownCircleOutlined, 
  HomeOutlined, 
  NodeIndexOutlined 
} from '@ant-design/icons';
import Link from 'next/link';

const { Content } = Layout;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const router = useRouter();

  const menuItems = [
    { key: 'overview', label: 'Overview', icon: <HomeOutlined /> },
    { key: 'trips', label: 'Trips', icon: <NodeIndexOutlined /> },
    { key: 'delivery-points', label: 'Delivery Points', icon: <DownCircleOutlined /> },
    { key: 'trucks', label: 'Trucks', icon: <CarOutlined /> },
    { key: 'users', label: 'Users', icon: <UserOutlined /> },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      
      {/* Mobile Hamburger Button (Top Left) */}
      <Button
        type="primary"
        onClick={() => setIsDrawerOpen(true)}
        style={{
          position: 'fixed',
          top: 16,
          left: 16,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
        className="md:hidden" // Only show on mobile
      >
        ☰ Menu
      </Button>

      {/* Responsive Sider / Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img
              src="https://img.freepik.com/premium-vector/transport-logistic-logo-express-arrow-moving-forward-courier-delivery-post-mail-shipping-service-vector-isolated-icon-template-transportation-postal-logistics-company-design_10135-5966.jpg?semt=ais_incoming&w=740&q=80"
              alt="Logo"
              width="32"
              height="32"
            />
            <span>Menu</span>
          </div>
        }
        placement="left"
        closable={true}
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        width={250}
        styles={{
          body: { padding: 0 },
          header: { borderBottom: '1px solid #f0f0f0' }
        }}
        closeIcon={<span style={{ fontSize: '18px' }}>✕</span>}
      >
        <div className="flex items-center justify-center h-20">
          <img
            src="https://img.freepik.com/premium-vector/transport-logistic-logo-express-arrow-moving-forward-courier-delivery-post-mail-shipping-service-vector-isolated-icon-template-transportation-postal-logistics-company-design_10135-5966.jpg?semt=ais_incoming&w=740&q=80"
            alt="Next.js Logo"
            width="100"
            height="100"
          />
        </div>

        <Menu
          theme="light"
          mode="inline"
          defaultSelectedKeys={['overview']}
          items={menuItems.map(item => ({
            key: item.key,
            icon: item.icon,
            label: (
              <Link href={`/admin/${item.key}`} onClick={() => setIsDrawerOpen(false)}>
                {item.label}
              </Link>
            ),
          }))}
          style={{ borderRight: 0 }}
        />

        <div style={{ position: 'absolute', bottom: 20, left: 20, width: 'calc(100% - 40px)' }}>
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={() => {
              setIsDrawerOpen(false);
              router.push('/login');
            }}
            style={{ color: '#999', width: '100%', textAlign: 'left' }}
          >
            Logout
          </Button>
        </div>
      </Drawer>

      {/* Main Content */}
      <Layout
        style={{
          marginLeft: 0,
          transition: 'margin-left 0.2s',
        }}
        className="md:ml-64"
      >
        <Content style={{ margin: '24px', background: '#fff', borderRadius: 8, padding: 24 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}