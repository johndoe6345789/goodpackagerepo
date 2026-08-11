import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const monorepoRoot = path.resolve(__dirname, "../../../..");

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:5050";

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.NEXT_BASE_PATH || "",
  output: "standalone",
  outputFileTracingRoot: monorepoRoot,
  transpilePackages: [
    "@shared/m3",
    "@shared/components",
    "@shared/hooks",
    "@shared/hooks-canvas",
    "@shared/icons",
    "@shared/redux-core",
    "@shared/redux-slices",
    "@shared/scss",
    "@shared/service-adapters",
  ],
  sassOptions: {
    silenceDeprecations: ["legacy-js-api"],
    includePaths: [
      path.join(__dirname, "src", "styles"),
      path.join(monorepoRoot, "shared", "scss"),
      path.join(monorepoRoot, "shared", "scss", "m3-scss"),
    ],
    loadPaths: [
      path.join(__dirname, "src", "styles"),
      path.join(monorepoRoot, "shared", "scss", "m3-scss"),
      path.join(monorepoRoot, "shared", "scss"),
    ],
  },
  turbopack: { root: monorepoRoot },
  async rewrites() {
    return [
      {
        source: "/auth/:path*",
        destination: `${backendUrl}/auth/:path*`,
      },
      {
        source: "/v1/:path*",
        destination: `${backendUrl}/v1/:path*`,
      },
      {
        source: "/admin/:path*",
        destination: `${backendUrl}/admin/:path*`,
      },
      {
        source: "/health",
        destination: `${backendUrl}/health`,
      },
      {
        source: "/schema",
        destination: `${backendUrl}/schema`,
      },
    ];
  },
};

export default nextConfig;
