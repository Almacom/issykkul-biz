import re,glob,json,sys,html,urllib.parse
"""Collects the card cover each stay had on the old site.

Usage: python3 -I scripts/migrate/collect_covers.py <crawl_dir> <repo_dir>
Reads <crawl_dir>/old/html/*.html and <crawl_dir>/old/catpages/*.html (all pages of the category lists),
writes <repo_dir>/migration/covers.json: stay slug -> /Portals/0/obj-thumbs/...-270-203.jpg.
"""
S,REPO=sys.argv[1],sys.argv[2]
um=json.load(open(f"{REPO}/migration/url-map.json"))
def norm(u): return urllib.parse.unquote(u.split("?")[0]).lower().replace("https://www.issykkul.biz","")
url2new={}
for row in (um if isinstance(um,list) else [{"old":k,"new":v} for k,v in um.items()]):
    o=row.get("old") or row.get("from"); n=row.get("new") or row.get("to")
    if o and n and n.startswith("/stays/"): url2new[norm(o)]=n.split("/stays/")[1]
pat=re.compile(r'<a[^>]*href="([^"]+)"[^>]*>\s*<img[^>]*src="(/Portals/0/obj-thumbs/[^"]+)"',re.I)
found={}
files=glob.glob(f"{S}/old/html/*.html")+glob.glob(f"{S}/old/catpages/*.html")
for f in files:
    for href,src in pat.findall(open(f,encoding="utf-8",errors="ignore").read()):
        slug=url2new.get(norm(html.unescape(href)))
        if not slug: continue
        m=re.match(r"(.*)-(\d+)-(\d+)(\.\w+)$",src)
        if not m: continue
        base,w=m.group(1)+m.group(4),int(m.group(2))
        cur=found.get(slug)
        if not cur or w>cur[1]: found[slug]=(src,w,base)
json.dump({k:v[0] for k,v in sorted(found.items())},open(f"{REPO}/migration/covers.json","w"),ensure_ascii=False,indent=1)
idx=json.load(open(f"{REPO}/public/content/stays/index.json"))
miss=[s["slug"] for s in idx if s["slug"] not in found]
print("stays",len(idx),"with cover",len(idx)-len(miss),"by width",{w:sum(1 for v in found.values() if v[1]==w) for w in (270,169,78)})
print("missing",miss[:40])
