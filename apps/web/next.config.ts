import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(process.cwd(), "../.."),
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3001/api/:path*",
      },
      {
        source: "/scim/v2/:path*",
        destination: "http://localhost:3001/scim/v2/:path*",
      },
    ];
  },
};

export default nextConfig;
