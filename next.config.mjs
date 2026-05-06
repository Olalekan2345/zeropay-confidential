/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['api.dicebear.com'],
  },
  webpack: (config) => {
    config.resolve.alias['@react-native-async-storage/async-storage'] =
      require('path').resolve('./lib/stubs/async-storage.js');
    return config;
  },
};

export default nextConfig;
