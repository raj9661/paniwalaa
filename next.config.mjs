/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Allow different distDir for multiple instances
  distDir: process.env.NEXT_DIST_DIR || '.next',
}

export default nextConfig
