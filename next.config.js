/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['cdn.discordapp.com'],
  },
  env: {
    NEXT_PUBLIC_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL,
  },
};

module.exports = nextConfig;
