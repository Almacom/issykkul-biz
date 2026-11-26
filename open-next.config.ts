import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default {
  ...defineCloudflareConfig(),
  // `npm run build` runs the OpenNext build (what Cloudflare calls),
  // so OpenNext must call Next.js directly to avoid calling itself.
  buildCommand: "npx next build",
};
