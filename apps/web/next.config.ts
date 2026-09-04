import type { NextConfig } from "next";

/**
 * Where the browser's /api and /scim calls are proxied to.
 *
 * Next resolves rewrite destinations during `next build` and writes them into
 * .next/routes-manifest.json, so this is a build-time value: setting it only
 * at run time changes nothing and the container keeps proxying to localhost.
 * Inside a container "localhost" is the web container itself, which is why a
 * deployed build could not reach the API at all. Pass it as a build argument,
 * for example http://api:3001.
 */
const apiOrigin = process.env.API_ORIGIN || "http://localhost:3001";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
      {
        source: "/scim/v2/:path*",
        destination: `${apiOrigin}/scim/v2/:path*`,
      },
    ];
  },
};

export default nextConfig;
