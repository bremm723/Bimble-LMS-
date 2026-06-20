import sharedConfig from "@bimbel/config/tailwind.config";

/** @type {import('tailwindcss').Config} */
const config = {
  ...sharedConfig,
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
};

export default config;
