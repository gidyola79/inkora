import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure satori's wasm deps are traced for Vercel
  serverExternalPackages: ["harfbuzzjs", "yoga-wasm-web"],
  outputFileTracingIncludes: {
    "/api/articles/[id]/share-card": ["./node_modules/harfbuzzjs/**/*", "./node_modules/yoga-wasm-web/**/*"],
    "/articles/[slug]/opengraph-image": ["./node_modules/harfbuzzjs/**/*", "./node_modules/yoga-wasm-web/**/*"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
