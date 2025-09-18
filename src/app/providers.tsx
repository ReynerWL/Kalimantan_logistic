'use client';
import { useEffect } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { StyleProvider } from '@ant-design/cssinjs';

export default function Providers({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.register('/sw.js');
		}
	}, []);
	return (
    <AuthProvider>
      <StyleProvider hashPriority="high">{children}</StyleProvider>
    </AuthProvider>
  );
}


