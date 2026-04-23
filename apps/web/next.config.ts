import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
