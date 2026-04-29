/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  env: {
    WORKFLOW_BACKEND_URL: process.env.WORKFLOW_BACKEND_URL || '',
    WORKFLOW_API_KEY: process.env.WORKFLOW_API_KEY || '',
  },
};

export default nextConfig;
