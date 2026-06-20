/** @type {import('next').NextConfig} */
const baseNextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@bimbel/ui", "@bimbel/config", "@bimbel/api-client"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default baseNextConfig;
