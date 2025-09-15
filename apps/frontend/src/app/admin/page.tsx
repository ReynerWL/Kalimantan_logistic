'use client';
import { Layout, Menu } from 'antd';
import Link from 'next/link';

export default function AdminPage() {
	return (
		<Layout style={{ minHeight: '100vh' }}>
			<Layout.Sider>
				<div className="text-white text-center py-4 font-semibold">Admin</div>
				<Menu theme="dark" mode="inline">
					<Menu.Item key="users"><Link href="/admin/users">Users</Link></Menu.Item>
					<Menu.Item key="trucks"><Link href="/admin/trucks">Trucks</Link></Menu.Item>
					<Menu.Item key="deliverypoints"><Link href="/admin/delivery-points">Delivery Points</Link></Menu.Item>
					<Menu.Item key="trips"><Link href="/admin/trips">Trips</Link></Menu.Item>
				</Menu>
			</Layout.Sider>
			<Layout.Content className="p-6">Pilih menu di samping.</Layout.Content>
		</Layout>
	);
}
