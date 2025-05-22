/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
};

// module.exports = nextConfig;

module.exports = {
  allowedDevOrigins: [
    "local-origin.dev",
    "*.local-origin.dev",
    "192.168.18.62",
  ],
};
