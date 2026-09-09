/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: [
      "react-icons",
      "react-icons/hi2",
      "react-icons/hi",
      "react-icons/bs",
      "react-icons/io5",
      "react-icons/bi",
      "react-icons/md",
      "react-toastify",
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;


