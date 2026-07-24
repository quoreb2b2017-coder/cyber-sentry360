/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
    ],
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/sitemap.xml',
        headers: [{ key: 'Content-Type', value: 'text/xml; charset=utf-8' }],
      },
      {
        source: '/sitemap-index.xml',
        headers: [{ key: 'Content-Type', value: 'text/xml; charset=utf-8' }],
      },
    ];
  },
  async redirects() {
    return [
      { source: '/api/robots.txt', destination: '/robots.txt', permanent: true },
    ];
  },
};

module.exports = nextConfig;
