/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images from Unsplash, Google user avatars, and remote media
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
