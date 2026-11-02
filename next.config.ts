import type { NextConfig } from "next";

const isGithubPages = Boolean(
  process.env.GITHUB_ACTIONS || process.env.BUILD_TARGET === "gh-pages"
);
const basePath = isGithubPages ? "/pokedraft-studio" : "";

const nextConfig: NextConfig = {
  output: isGithubPages ? "export" : undefined,
  basePath: basePath || undefined,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pokeapi.co",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
