/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['edge-tts-universal', 'ws'],
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/index.html',
      },
      {
        source: '/landing',
        destination: '/landing.html',
      },
      {
        source: '/privacy',
        destination: '/privacy.html',
      },
    ];
  },
};

export default nextConfig;
