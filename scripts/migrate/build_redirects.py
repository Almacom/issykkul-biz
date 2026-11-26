"""Build src/lib/redirects.json (old path -> new path, or null for 410) from migration/url-map.json."""
import json, sys, os
REPO = sys.argv[1] if len(sys.argv) > 1 else "."
B = "https://www.issykkul.biz"
rows = json.load(open(f"{REPO}/migration/url-map.json"))
out = {}
for r in rows:
    path = r["old"][len(B):] or "/"
    if path == "/":
        continue  # home stays home
    key = path.lower()
    out[key] = r["new"] or None
with open(f"{REPO}/src/lib/redirects.json", "w", encoding="utf-8") as f:
    json.dump(dict(sorted(out.items())), f, ensure_ascii=False, separators=(",", ":"))
print(len(out), "redirects,", sum(1 for v in out.values() if v is None), "gone")
