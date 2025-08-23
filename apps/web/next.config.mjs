/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { ppr: false },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/:path*', // Proxy to Nest API
      },
    ];
  },
};

export default nextConfig;
