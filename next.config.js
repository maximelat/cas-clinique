/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/projet/clinical-case-analyzer',
  assetPrefix: '/projet/clinical-case-analyzer',
  images: {
    unoptimized: true,
  },
  env: {
    NEXTAUTH_URL: process.env.NODE_ENV === 'production' 
      ? 'http://latry.consulting/projet/clinical-case-analyzer' 
      : 'http://localhost:3000',
  },
  trailingSlash: true,
}

module.exports = nextConfig 