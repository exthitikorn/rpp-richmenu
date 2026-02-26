/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'etrvbdjynqgr71yf.public.blob.vercel-storage.com',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
