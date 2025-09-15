'use client';
import { Form, Input, Button, Typography, Card, message } from 'antd';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
	const router = useRouter();
	const { login } = useAuth();
	const onFinish = async (values: any) => {
		const ok = await login({ email: values.email, password: values.password });
		if (ok) {
			message.success('Logged in');
			router.push('/');
		} else {
			message.error('Login failed');
		}
	};
	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
			<Card className="w-full max-w-md">
				<Typography.Title level={3}>Masuk</Typography.Title>
				<Form layout="vertical" onFinish={onFinish}>
					<Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
						<Input placeholder="email" />
					</Form.Item>
					<Form.Item name="password" label="Password" rules={[{ required: true }]}>
						<Input.Password placeholder="password" />
					</Form.Item>
					<Button type="primary" htmlType="submit" block>
						Login
					</Button>
				</Form>
			</Card>
		</div>
	);
}
