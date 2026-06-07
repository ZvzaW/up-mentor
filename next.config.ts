import type { NextConfig } from "next";

const nextConfig: NextConfig = {
};

module.exports = {
    logging: {
      serverFunctions: false,
      browserToTerminal: false,
    },
  }

export default nextConfig;
