import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone output for Docker; disabled on Vercel (Vercel has its own output handling)
  ...(process.env.VERCEL ? {} : { output: "standalone" }),

  // Allow cross-origin requests from the backend in development
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
    ];
  },
};

export default nextConfig;
