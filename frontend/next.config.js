/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/circle/:path*',
        destination: 'https://api.circle.com/:path*',
      },
    ];
  },
};
