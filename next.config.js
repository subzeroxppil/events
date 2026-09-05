/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
};

// module.exports = nextConfig;

module.exports = {
  // Next blocks dev requests whose Host is not one of these, so a phone on the
  // LAN gets no HMR and no dev assets unless this machine's address is listed.
  // The address moves with the network, so keep the whole subnet as well as
  // whatever it happens to be today.
  allowedDevOrigins: [
    "local-origin.dev",
    "*.local-origin.dev",
    "192.168.1.187",
    "192.168.1.*",
    "192.168.18.62",
    "192.168.18.*",
  ],
};
