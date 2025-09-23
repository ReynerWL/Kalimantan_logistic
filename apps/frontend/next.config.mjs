// apps/frontend/next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🚫 Disable telemetry (silent, no console noise)
  experimental: {
    optimizePackageImports: ['react', 'react-dom'],
  },
  env: {
    NEXT_TELEMETRY_DISABLED: '1', // 👈 Disable telemetry logging
  },

  // 🚫 Disable headers/rewrites/redirects if not needed
  // (They’re ignored in static export anyway, but harmless here)
  // headers: [], // remove if unused
  // redirects: [], // remove if unused
  // rewrites: [], // remove if unused

  // ✅ Optimize images
  images: {
    domains: [
      'maps.googleapis.com',
      'tile.openstreetmap.org',
      'raw.githubusercontent.com',
      'your-internal-api.com', // if you have custom map tiles
    ],
    unoptimized: false, // Let Next.js optimize your images
    minimumCacheTTL: 60 * 60 * 24, // 24h cache
  },

  // ✅ Optimize fonts
  fonts: [
    {
      family: 'Geist',
      src: [
        './public/fonts/GeistVF.woff',
        './public/fonts/GeistMonoVF.woff',
      ],
    },
  ],

  // ✅ Optimize TypeScript
  typescript: {
    ignoreBuildErrors: false, // Keep strict in prod
  },

  // ✅ Optimize ESLint
  eslint: {
    ignoreDuringBuilds: true, // We lint during dev, not build
  },

  // ✅ Optimize compiler
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Reduce bundle size by excluding Node.js modules from client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        path: false,
        os: false,
        crypto: false, // We polyfill this manually if needed
      };
    }
    return config;
  },
};

export default nextConfig;