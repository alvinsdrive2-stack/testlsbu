import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Serve file upload yang muncul setelah build (public/ hanya serve file
      // yang ada saat build). File yang ke-build tetap serve static lebih cepat.
      { source: "/uploads/:path*", destination: "/api/files/:path*" },
    ];
  },
};

export default nextConfig;
