/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
 
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      // Exclude Node.js-only modules from client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      }
      // Ignore Node.js-only packages that shouldn't be bundled for browser
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^supports-color$/,
        })
      )
    }
    return config
  },
}

export default nextConfig