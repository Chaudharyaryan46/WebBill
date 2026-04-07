/** @type {import('next').NextConfig} */
const nextConfig = {
  // Config for local development
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com', 'localhost'], // Allow Unsplash and local domain
  }
};

module.exports = nextConfig;
