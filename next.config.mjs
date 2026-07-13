/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the workspace root — a stray lockfile in a parent folder makes
  // Turbopack infer the wrong root otherwise.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
