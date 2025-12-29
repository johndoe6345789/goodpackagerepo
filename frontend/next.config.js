/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    API_URL: process.env.API_URL || 'http://localhost:5000',
  },
  output: 'standalone',
}

module.exports = nextConfig
