import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "flagcdn.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  // Fix for chunk loading issues and stability
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        util: false,
        url: false,
        assert: false,
        http: false,
        https: false,
        os: false,
        buffer: false,
      };
    }
    
    // Fix for Windows path issues
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    };
    
    return config;
  },
  // Disable problematic experimental features
  experimental: {
    // optimizePackageImports: ['lucide-react', 'react-icons'], // Disabled for stability
  },
  // Vercel deployment configuration
  // output: 'export', // Commented out for dynamic routes support
  trailingSlash: true,
  // Disable source maps in production for better performance
  productionBrowserSourceMaps: false,
  // Add compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
