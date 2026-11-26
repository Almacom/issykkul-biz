import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

const config = {
  ...defineCloudflareConfig({
    // Pre-rendered pages (stays, articles) are served from static assets,
    // so the worker does almost no work per request (free plan: 10 ms CPU).
    incrementalCache: staticAssetsIncrementalCache,
    enableCacheInterception: true,
  }),
  // `npm run build` runs the OpenNext build (what Cloudflare calls),
  // so OpenNext must call Next.js directly to avoid calling itself.
  buildCommand: "npx next build",
};

export default config;
