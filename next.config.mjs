import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['api.dicebear.com'],
  },
  webpack: (config) => {
    config.resolve.alias['@react-native-async-storage/async-storage'] =
      path.resolve(__dirname, './lib/stubs/async-storage.js');
    return config;
  },
};

export default nextConfig;
