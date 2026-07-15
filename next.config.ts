import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // vídeos podem ter até 300MB (ver MAX_VIDEO_SIZE em src/lib/uploads.ts);
      // deixamos folga para o overhead do multipart/form-data
      bodySizeLimit: "320mb",
    },
  },
};

export default nextConfig;
