# Migration from the old DotNetNuke site

- `url-map.csv` / `url-map.json` — every known old URL (sitemap, internal links, legacy redirects) → new URL.
  - `301` — permanent redirect to the new page.
  - `410` — page intentionally removed (off-topic ads, technical pages, old URLs that already returned 404).
- Old canonical host: `https://www.issykkul.biz` (non-www redirected to www). Keep `www` as canonical on the new site.
- Crawled 2026-11-26: 397 live pages (161 objects, 2 866 photos, 1 137 reviews).
