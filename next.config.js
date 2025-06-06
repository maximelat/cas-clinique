/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/projet/clinical-case-analyzer',
  assetPrefix: '/projet/clinical-case-analyzer',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
}

module.exports = nextConfig 