import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

// We export a factory to get an axios instance that injects our JWT
export function createApi(getToken: () => string | null) {
	const instance = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });
	instance.interceptors.request.use((config) => {
		const token = getToken();
		if (token) {
			config.headers = config.headers || {};
			(config.headers as any).Authorization = `Bearer ${token}`;
		}
		return config;
	});
	return instance;
}

// Convenience hook for components
export function useApi() {
	const { token } = useAuth();
	return createApi(() => token);
}

