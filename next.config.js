/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/projet/clinical-case-analyzer',
  assetPrefix: '/projet/clinical-case-analyzer',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
    NEXT_PUBLIC_OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  }
}

module.exports = nextConfig 