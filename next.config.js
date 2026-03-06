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
  // ป้องกันการ bundle Prisma และ driver ที่มี native bindings (เหมาะกับ Vercel serverless)
  serverExternalPackages: ['prisma', '@prisma/client', '@prisma/adapter-mariadb', 'mariadb'],
};

module.exports = nextConfig;
