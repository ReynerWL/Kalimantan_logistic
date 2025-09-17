import type { Viewport } from 'next';
import Providers from './providers';

export const viewport = {
  themeColor: 'black',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
        {children}
        </Providers>
      </body>
    </html>
  );
}