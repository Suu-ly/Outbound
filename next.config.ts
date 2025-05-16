import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/": ["./src/app/fonts/**/*"],
  },
};

export default nextConfig;
