/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable Partial Prerendering (still experimental in 14.x)
  experimental: {
    ppr: false,
  },

  // ✅ Ignore Next’s internal ESLint check since we lint via workspace config
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ✅ Ignore type errors during Next build if you already run typecheck in CI
  typescript: {
    ignoreBuildErrors: false, // set to true only if you want CI to handle it instead
  },

  // ✅ Rewrites for local dev proxy to your Nest API
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination:
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/:path*",
      },
    ];
  },

  // ✅ Optional optimizations for production
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // ✅ Ensure environment variables are exposed safely
  env: {
    NEXT_PUBLIC_ORG_ID: process.env.NEXT_PUBLIC_ORG_ID,
    NEXT_PUBLIC_ORG_SLUG: process.env.NEXT_PUBLIC_ORG_SLUG,
  },
};

export default nextConfig;
