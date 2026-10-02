import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Turbopack rooted at this project when other lockfiles exist above it.
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  images: {
    remotePatterns: [
      // Demo catalogue images (used until real product images are seeded).
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
      // Supabase Storage public objects.
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Chemzo Plaza product images.
      { protocol: "https", hostname: "i.etsystatic.com" },
      { protocol: "https", hostname: "digital.loblaws.ca" },
      { protocol: "https", hostname: "i.pinimg.com" },
      { protocol: "https", hostname: "d2cdo4blch85n8.cloudfront.net" },
      { protocol: "https", hostname: "adorit.com.au" },
    ],
  },
};

export default nextConfig;
