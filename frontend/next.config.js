/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/circle-mainnet/:path*',
        destination: 'https://api.circle.com/:path*',
      },
      {
        source: '/api/circle-sandbox/:path*',
        destination: 'https://api-sandbox.circle.com/:path*',
      },
    ];
  },
};
