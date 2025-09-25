'use client';

import type { Viewport } from 'next';

// ✅ Define viewport with proper type for /driver and all its sub-pages
export const viewport: Viewport = {
  themeColor: 'black',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div>{children}</div>;
}