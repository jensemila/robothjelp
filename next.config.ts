import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Selvhostes på egen server (robothjelp.no): standalone-bygg gir en
  // liten node-server uten behov for node_modules i produksjon.
  output: "standalone",
};

export default nextConfig;
