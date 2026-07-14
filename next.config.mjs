/** @type {import('next').NextConfig} */
const nextConfig = {
  // Reduce local memory pressure while keeping hot reload available.
  experimental: {
    webpackMemoryOptimizations: true,
    preloadEntriesOnStart: false,
    serverSourceMaps: false,
  },
  productionBrowserSourceMaps: false,

  // Pin the workspace root — a stray lockfile in a parent folder makes
  // Turbopack infer the wrong root otherwise.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
