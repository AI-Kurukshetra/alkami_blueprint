/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@banking/config",
    "@banking/database",
    "@banking/types",
    "@banking/ui",
    "@banking/utils"
  ]
};

export default nextConfig;
