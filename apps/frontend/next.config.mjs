/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Correct location
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'export', 
  images: {
    unoptimized: true, // Required when using `output: 'export'`
  },
  // Optional: If you want to set cache headers globally
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },

  // Other config...
};

export default nextConfig;