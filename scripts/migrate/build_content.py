"""
Build the new site's content files from a crawl of the old DotNetNuke site.

Usage:
  python3 -I scripts/migrate/build_content.py <crawl_dir> <repo_dir>

<crawl_dir> holds: html/*.html, crawl.json, pages.json (see extract.py),
optionally reviews.json + reviews_full.json.
Writes <repo_dir>/public/content/** and <repo_dir>/migration/images.txt.
"""
import hashlib
import json, re, os, sys, html, collections, shutil

CRAWL, REPO = sys.argv[1], sys.argv[2]
B = "https://www.issykkul.biz"
OUT = os.path.join(REPO, "public", "content")
WHATSAPP = "+996505581681"  # agency WhatsApp, used until hosts claim their listings

pages = json.load(open(f"{CRAWL}/pages.json"))
crawl = json.load(open(f"{CRAWL}/crawl.json"))
urlmap = json.load(open(f"{REPO}/migration/url-map.json"))

# ---------- old URL -> new path ----------
MAP = {}
for r in urlmap:
    MAP[r["old"].lower()] = r["new"] or None  # None = removed (410)

def norm_old(href):
    h = html.unescape(href.strip())
    h = re.sub(r"^https?://(www\.)?issykkul\.biz", "", h, flags=re.I)
    h = re.sub(r"^(\.\./)+", "/", h)
    h = re.sub(r"^/?(www\.)?issykkul\.biz/", "/", h, flags=re.I)
    if "self.close" in h:
        return None
    if h.startswith(("http:", "https:", "mailto:", "tel:", "#", "javascript:", "//")):
        return None
    if not h.startswith("/"):
        h = "/" + h
    return (B + h.split("#")[0]).lower()

unknown_links = collections.Counter()

def new_link(href):
    key = norm_old(href)
    if key is None:
        return href, True
    if key in MAP:
        return MAP[key], MAP[key] is not None
    base = key.split("?")[0]
    if base in MAP:
        return MAP[base], MAP[base] is not None
    loose = base.replace("_", "-")
    for k, v in MAP.items():
        if k.replace("_", "-") == loose:
            return v, v is not None
    if key.rstrip("/") == B.lower():
        return "/", True
    if "/portals/" in key:
        return href, True
    unknown_links[key] += 1
    return href, False  # dead link on the old site too: keep the text, drop the link

# ---------- villages ----------
VILLAGES = [  # slug, ru, en, ky, regex, shore
    ("chon-sary-oy", "Чон-Сары-Ой", "Chon-Sary-Oy", "Чоң-Сары-Ой", r"Чон[- ]Сары[- ]О", "n"),
    ("sary-oy", "Сары-Ой", "Sary-Oy", "Сары-Ой", r"Сары[- ]О", "n"),
    ("cholpon-ata", "Чолпон-Ата", "Cholpon-Ata", "Чолпон-Ата", r"Чолпон[- ]?Ат", "n"),
    ("bosteri", "Бостери", "Bosteri", "Бостери", r"Бо[сз]тер", "n"),
    ("kara-oy", "Кара-Ой", "Kara-Oy", "Кара-Ой", r"Кара[- ]О[йе]|Долинк", "n"),
    ("bulan-sogottu", "Булан-Сёгётту", "Bulan-Sogottu", "Булан-Сөгөттү", r"Б[уа]лан[- ]С[оёөеэ]г", "n"),
    ("baktuu-dolonotu", "Бактуу-Долоноту", "Baktuu-Dolonotu", "Бактуу-Долоноту", r"Бактуу", "n"),
    ("chok-tal", "Чок-Тал", "Chok-Tal", "Чок-Тал", r"Чок[- ]Тал", "n"),
    ("tamchy", "Тамчы", "Tamchy", "Тамчы", r"Тамч[иы]", "n"),
    ("boz-beshik", "Боз-Бешик", "Boz-Beshik", "Боз-Бешик", r"Боз[- ]Бешик", "n"),
    ("korumdu", "Корумду", "Korumdu", "Корумду", r"Корумду", "n"),
    ("kosh-kol", "Кош-Кёль", "Kosh-Kol", "Кош-Көл", r"Кош[- ]К[оёө]л", "n"),
    ("ornok", "Орнок", "Ornok", "Орнок", r"Орнок", "n"),
    ("chyrpykty", "Чырпыкты", "Chyrpykty", "Чырпыкты", r"Чырпыкты", "n"),
    ("ananyevo", "Ананьево", "Ananyevo", "Ананьево", r"Ананьев", "n"),
    ("balykchy", "Балыкчы", "Balykchy", "Балыкчы", r"Балыкч", "w"),
    ("karakol", "Каракол", "Karakol", "Каракол", r"Каракол", "e"),
    ("kyzyl-suu", "Кызыл-Суу", "Kyzyl-Suu", "Кызыл-Суу", r"Кызыл[- ]Суу", "s"),
    ("tamga", "Тамга", "Tamga", "Тамга", r"Тамг", "s"),
    ("kadzhi-say", "Каджы-Сай", "Kadzhi-Say", "Кажы-Сай", r"Ка[дж]{1,2}[иы][- ][Сс]а", "s"),
    ("bokonbaevo", "Боконбаево", "Bokonbaevo", "Бөкөнбаев", r"Боконбаев|Бөкөнбаев", "s"),
    ("baet", "Бает", "Baet", "Бает", r"\bБает", "s"),
]

def find_village(*texts):
    t = " ".join(texts)
    for v in VILLAGES:
        if re.search(v[4], t):
            return v[0]
    return None

# ---------- html cleanup ----------
def strip_attrs(h):
    h = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", h, flags=re.S | re.I)
    h = re.sub(r"<!--.*?-->", "", h, flags=re.S)
    h = re.sub(r"<iframe[^>]*maps\.google[^>]*>.*?</iframe>", "", h, flags=re.S | re.I)
    h = re.sub(r"</?(font|span|section|article|header|figure)[^>]*>", "", h, flags=re.I)
    h = re.sub(r"<a name=\"[^\"]*\">\s*</a>", "", h)
    h = re.sub(r'\s(style|class|id|data-[\w-]+|align|width|height|border|cellpadding|cellspacing|target|onclick)="[^"]*"', "", h)
    h = re.sub(r"<h1[^>]*>.*?</h1>", "", h, flags=re.S)
    for _ in range(3):
        h = re.sub(r"<(div|p|strong|b|em|ul|li)>\s*(&nbsp;)?\s*</\1>", "", h)
    h = re.sub(r"(<br\s*/?>\s*){3,}", "<br /><br />", h)
    return re.sub(r"\s+", " ", h).strip()

images = set()

def img_url(p):
    """Old image path -> the path used on the new site and as the R2 key: no query, decoded, lower-case, then URL-encoded."""
    from urllib.parse import quote, unquote
    return quote(unquote(p.split("?")[0]).lower(), safe="/()-_.~")

def rewrite(h):
    def a(m):
        href = m.group(2)
        new, alive = new_link(href)
        if not alive:
            return "<a data-removed=\"1\">"
        return f'<a{m.group(1)}href="{html.escape(new, quote=True)}"'
    h = re.sub(r'<a([^>]*?)href="([^"]*)"', a, h)
    h = re.sub(r'<a data-removed="1">(.*?)</a>', r"\1", h, flags=re.S)
    def img(m):
        src = html.unescape(m.group(1))
        if re.match(r"^(https?://(www\.)?issykkul\.biz)?/portals/", src, re.I):
            p = re.sub(r"^https?://(www\.)?issykkul\.biz", "", src, flags=re.I)
            images.add(p)
            return f'src="{html.escape(img_url(p), quote=True)}"'
        return m.group(0)
    return re.sub(r'src="([^"]*)"', img, h)

def related_stays(module_html):
    slugs = []
    for href in re.findall(r'href="([^"]*/katalog/[^"]*)"', module_html):
        new, alive = new_link(href)
        if alive and new and new.startswith("/stays/"):
            s = new[len("/stays/"):]
            if s not in slugs:
                slugs.append(s)
    return slugs

# ---------- stays ----------
CATS = {"chastnyyy-sektor": "guest", "kottedjyy": "cottage", "pansionatyy": "pansionat", "oteli": "hotel",
        "mini-pansionatyy": "minipansionat", "sanatorii": "sanatorium", "tsentryy-otdyyha": "resort", "doma_otdyyha": "pansionat"}

def section_html(raw, name):
    m = re.search(r'<h2 class="SubHead_blue accordion dynbox">\s*' + name + r'\s*</h2>\s*<div[^>]*>(.*?)</div>\s*(?:<h2|</div>)', raw, re.S)
    return rewrite(strip_attrs(m.group(1))) if m else ""

def photo(p):
    images.add(p)
    return img_url(p)

# Card covers chosen on the old site (/Portals/0/obj-thumbs/<name>-270-203.jpg), collected from
# the category listing pages by scripts/migrate/collect_covers.py. Where the cover is a copy of a
# gallery photo, the full-size gallery photo is used instead of the small thumbnail.
COVERS = json.load(open(f"{REPO}/migration/covers.json")) if os.path.exists(f"{REPO}/migration/covers.json") else {}

def _ckey(path):
    from urllib.parse import unquote
    name = unquote(path.split("?")[0]).rsplit("/", 1)[-1].lower()
    name = re.sub(r"-\d+-\d+(\.\w+)$", r"\1", name)          # drop -270-203 thumbnail suffix
    name = re.sub(r"\.(jpe?g|png|gif|webp)$", "", name)
    return re.sub(r"[^a-z0-9]", "", name)

def pick_cover(slug, gallery, pool):
    """Returns (cover_path, gallery_reordered). `pool` = gallery + room photos, searched for a full-size copy."""
    thumb = COVERS.get(slug)
    if not thumb:
        return (gallery[0] if gallery else None), gallery
    k = _ckey(thumb)
    for g in pool:
        gk = _ckey(g)
        if len(k) >= 6 and (gk == k or gk.startswith(k) or (k.startswith(gk) and len(gk) >= 6)):
            return g, [g] + [x for x in gallery if x != g]
    return photo(thumb), gallery

# Object photo albums on the old page (module IssykkulPhotoAlbumI): "Территория", "Двор", "Пляж", "Кафе", ...
# They show the building and grounds, so they go first in the gallery; room photos follow.
ALBUM_RANK = [r"террит|двор|общ|вид|здани|корпус", r"^фото(графии)?$|^фото\s|^фотографии", r"пляж|бассейн", r"разн", r"кафе|столов|ресторан|сауна|баня|медицин|этаж"]
ALBUM_LAST = r"рядом|гост|чок-тал"

def _album_segments(raw):
    for m in re.finditer(r'DnnModule-IssykkulPhotoAlbumI DnnModule-(\d+)"', raw):
        seg = raw[m.end():]
        nxt = seg.find('<div class="DnnModule ')
        yield m.group(1), seg[:nxt if nxt > 0 else None]

def object_albums(raw, url=None, ranked=True):
    """Photo albums of a page. Long albums were split into ?pg=2,3… pages, saved in <crawl>/albumpages/."""
    extra = {}
    if url:
        base = url.split("?")[0]
        for n in range(2, 10):
            f = f"{CRAWL}/albumpages/" + hashlib.md5(f"{base}?pg={n}".encode()).hexdigest() + ".html"
            if not os.path.exists(f):
                break
            for mid, seg in _album_segments(open(f, encoding="utf-8", errors="ignore").read()):
                extra.setdefault(mid, []).extend(re.findall(r'data-fancybox="group\d+"[^>]*?href=[\'"]([^\'"]+)[\'"]', seg))
    out = []
    for mid, seg in _album_segments(raw):
        t = re.search(r'<h2 class="headtitle">(.*?)</h2>', seg, re.S)
        hrefs = list(dict.fromkeys(re.findall(r'data-fancybox="group\d+"[^>]*?href=[\'"]([^\'"]+)[\'"]', seg) + extra.get(mid, [])))
        if hrefs:
            out.append({"title": html.unescape(re.sub(r"<[^>]+>", "", t.group(1)).strip()) if t else "", "photos": [photo(h) for h in hrefs]})
    def rank(a):
        tl = a["title"].lower()
        if re.search(ALBUM_LAST, tl):
            return 99
        for i, rx in enumerate(ALBUM_RANK):
            if re.search(rx, tl):
                return i
        return 50
    return sorted(out, key=rank) if ranked else out

# village pages whose names the regexes miss
SELA_VILLAGE = {"ornok": "ornok", "korumdu": "korumdu", "balykchy": "balykchy"}

stays = []
stay_files = {}
for p in pages:
    if p["kind"] != "object":
        continue
    new = MAP.get(p["url"].lower())
    if not new or not new.startswith("/stays/"):
        continue
    slug = new[len("/stays/"):]
    raw = open(f"{CRAWL}/html/{crawl[p['url']]['file']}", encoding="utf-8", errors="ignore").read()
    cat = p["url"].replace(B, "").split("/")[2]
    name = p["breadcrumb"][-1][0] if p["breadcrumb"] else p["h1"]
    desc_text = re.sub(r"<[^>]+>", " ", p["descriptionHtml"])
    village = find_village(p["h1"], p["title"]) or find_village(desc_text)
    rooms = []
    for r in p["rooms"]:
        rooms.append({
            "name": r["name"],
            "description": r["description"],
            "photos": [photo(x) for x in dict.fromkeys(r["photos"])],
            "prices": [{"period": x["period"].rstrip(".").strip(), "price": x["price"], "per": x["per"]} for x in r["periods"]],
        })
    prices = [x["price"] for r in rooms for x in r["prices"] if x["price"] > 0]
    albums = object_albums(raw, p["url"])
    room_photos = [photo(x) for x in p["photos"]]
    photos = list(dict.fromkeys([x for a in albums for x in a["photos"]] + room_photos))
    all_photos = list(dict.fromkeys(photos + [x for r in rooms for x in r["photos"]]))
    cover, photos_sorted = pick_cover(slug, photos if photos else all_photos, all_photos)
    if photos:
        photos = photos_sorted
    stay = {
        "slug": slug,
        "oldId": p["objectId"],
        "oldUrl": p["url"],
        "type": CATS.get(cat, "guest"),
        "village": village,
        "name": re.sub(r"\s+", " ", html.unescape(name)).strip(),
        "h1": p["h1"],
        "seoTitle": p["title"],
        "seoDescription": p["metaDescription"],
        "descriptionHtml": rewrite(strip_attrs(p["descriptionHtml"])),
        "foodHtml": section_html(raw, "Питание"),
        "priceNote": p["priceNote"],
        "rooms": rooms,
        "photos": photos,
        "albums": albums,
        "cover": cover,
        "priceFrom": min(prices) if prices else None,
        "rating": p["rating"],
        "reviewCount": p["reviewCount"],
        "whatsapp": WHATSAPP,
        "plan": "standard",
    }
    stays.append(stay)
    stay_files[slug] = stay

# ---------- reviews ----------
def plain_text(t):
    """Review texts from the old site may contain HTML (<br />, <strong>, links): keep line breaks, drop tags."""
    t = t or ""
    t = re.sub(r"(?i)<br\s*/?>", "\n", t)
    t = re.sub(r"(?i)</p\s*>|</div\s*>", "\n\n", t)
    t = re.sub(r"<[^>]+>", "", t)
    t = html.unescape(t).replace("\xa0", " ")
    t = re.sub(r"[ \t]+", " ", t)
    t = "\n".join(line.strip() for line in t.splitlines())
    return re.sub(r"\n{3,}", "\n\n", t).strip()

reviews_by_slug = {}
if os.path.exists(f"{CRAWL}/reviews.json"):
    revs = json.load(open(f"{CRAWL}/reviews.json"))
    full = json.load(open(f"{CRAWL}/reviews_full.json")) if os.path.exists(f"{CRAWL}/reviews_full.json") else {}
    for url, items in revs.items():
        new = MAP.get(url.lower())
        if not new or not new.startswith("/stays/"):
            continue
        out = []
        for r in items:
            text = full.get(str(r["id"]), r["text"])
            out.append({"id": r["id"], "author": r["author"], "from": r["from"], "rating": r["rating"], "date": r["date"],
                        "title": plain_text(r["title"]), "text": plain_text(text), "with": r["with"]})
        out.sort(key=lambda r: r["date"], reverse=True)
        reviews_by_slug[new[len("/stays/"):]] = out

# ---------- articles ----------
BOILERPLATE = re.compile(r"Введите (ваш )?email|менеджер по отдыху|Бесплатная консультация|Поделиться:|pluso|revStars|Загружается\.\.\.|"
                         r"Фильтр Сортировка|Поможем подобрать|Просмотреть увеличенную карту|Где остановиться\? Как добраться|"
                         r"Другие экскурсии по Иссык", re.I)
def section_of(path):
    parts = path.strip("/").split("/")
    return parts[0] if parts[0] != "guide" or len(parts) < 3 else f"guide/{parts[1]}"

H1_OVERRIDE = {"/rasskazy": "Рассказы туристов об отдыхе на Иссык-Куле", "/faq": "Частые вопросы об отдыхе на Иссык-Куле"}
articles = []
for p in pages:
    if p["kind"] != "page":
        continue
    new = MAP.get(p["url"].lower())
    if not new or not re.match(r"^/(guide|blog|rasskazy|transfers/|stays/[^/]+/|faq$|terms$|otzyvy|chastnyy-sektor$|pansionaty$|sanatorii$|oteli|kottedzhi$|mini-pansionaty$|tsentry-otdykha$|gostevye-doma|vse-vklyucheno$|tseny$)", new):
        continue
    raw_html = open(f"{CRAWL}/html/{crawl[p['url']]['file']}", encoding="utf-8", errors="ignore").read()
    i = raw_html.find('id="dnn_ContentPane"')
    body = raw_html[i:] if i > 0 else raw_html
    mods = re.findall(r"<!-- Start_Module_\d+ -->(.*?)<!-- End_Module_\d+ -->", body, re.S)
    text_parts, rel = [], []
    for m in mods:
        mt = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", re.sub(r"<(script|style)[^>]*>.*?</\1>", "", m, flags=re.S)))).strip()
        if "ViewPhotoAlbumI" in m:
            continue  # photo albums are exported separately (article["albums"])
        if "obj-thumbs" in m or "RestaurantsDetailsView" in m or (re.search(r"\d+ отзыв", mt) and "/katalog/" in m):
            rel += related_stays(m)
        elif BOILERPLATE.search(mt) or re.match(r"^\d\d\.\d\d\.\d{4}", mt) or "<input" in m or "<select" in m \
                or "reviews-list" in m or "dlReviews" in m or len(mt) < 20 and "<img" not in m and "<iframe" not in m:
            continue
        else:
            t = strip_attrs(m)
            if len(re.sub(r"<[^>]+>", "", t).strip()) > 20:
                text_parts.append(rewrite(t))
    if not text_parts and p.get("contentHtml"):
        text_parts = [rewrite(strip_attrs(p["contentHtml"]))]
    PRIMARY = {"/faq": "/chavo.aspx", "/otzyvy": "/otzyyvyy.aspx"}
    if new in PRIMARY and not p["url"].lower().endswith(PRIMARY[new]):
        continue  # several old pages merged into one new page: keep the main one
    if any(a["path"] == new for a in articles):
        continue
    articles.append({
        "path": new,
        "section": section_of(new),
        "oldUrl": p["url"],
        "h1": H1_OVERRIDE.get(new) or p["h1"] or p["title"],
        "seoTitle": p["title"],
        "seoDescription": p["metaDescription"],
        "html": "\n".join(text_parts),
        "relatedStays": list(dict.fromkeys(rel)),
        "albums": object_albums(raw_html, p["url"], ranked=False),
        "village": (SELA_VILLAGE.get(new.rsplit("/", 1)[-1]) or find_village(p["url"].replace("-", " "), p["h1"] or "")) if "/sela/" in new else None,
    })

# ---------- FAQ (answers were loaded by AJAX on the old site; fetched separately into faq.json) ----------
if os.path.exists(f"{CRAWL}/faq.json"):
    faq = json.load(open(f"{CRAWL}/faq.json"))
    NEW_FIRST = {"group": "Бронирование проживания", "q": "Как забронировать жильё?",
                 "a": "<p>Выберите объект в каталоге и напишите в WhatsApp прямо со страницы объекта. Вам ответят, есть ли свободные места на ваши даты, "
                      "и подскажут цены. Сайт не берёт комиссию: условия и оплату вы обсуждаете напрямую.</p>"}
    faq = [NEW_FIRST] + [f for f in faq if not f["q"].startswith("Как бронируются места через сайт")]
    parts, group = [], None
    for f in faq:
        if f["group"] != group:
            group = f["group"]; parts.append(f"<h2>{html.escape(group)}</h2>")
        ans = re.sub(r"^\s*<div[^>]*>\s*<b>Ответ:</b>", "", f.get("a", ""), flags=re.I)
        ans = re.sub(r"</div>\s*$", "", ans)
        parts.append(f"<h3>{html.escape(f['q'])}</h3>" + rewrite(strip_attrs(ans)))
    for a in articles:
        if a["path"] == "/faq":
            a["html"] = "\n".join(parts)
            a["faq"] = [{"q": f["q"], "a": re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", f.get("a", "")))).replace("Ответ:", "").strip()} for f in faq]
            a["relatedStays"] = []

# ---------- write ----------
if os.path.exists(OUT):
    shutil.rmtree(OUT)
os.makedirs(f"{OUT}/stays"); os.makedirs(f"{OUT}/articles"); os.makedirs(f"{OUT}/reviews")

def dump(path, obj):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))

index = []
for s in stays:
    dump(f"{OUT}/stays/{s['slug']}.json", s)
    index.append({k: s[k] for k in ("slug", "type", "village", "name", "priceFrom", "rating", "reviewCount", "plan", "oldId")} |
                 {"photo": s["cover"] or (s["photos"][0] if s["photos"] else None), "photoCount": len(s["photos"])})
dump(f"{OUT}/stays/index.json", index)
for slug, items in reviews_by_slug.items():
    dump(f"{OUT}/reviews/{slug}.json", items)

def afile(path):
    return path.strip("/").replace("/", "__")

aindex = []
for a in articles:
    dump(f"{OUT}/articles/{afile(a['path'])}.json", a)
    aindex.append({k: a[k] for k in ("path", "section", "h1", "seoTitle", "seoDescription", "village")})
dump(f"{OUT}/articles/index.json", aindex)
dump(f"{OUT}/villages.json", [{"slug": v[0], "name": {"ru": v[1], "en": v[2], "ky": v[3]}, "shore": v[5]} for v in VILLAGES])

with open(f"{REPO}/migration/images.txt", "w") as f:
    f.write("\n".join(sorted(images)))

print("stays", len(stays), "no village", sum(1 for s in stays if not s["village"]))
print("types", collections.Counter(s["type"] for s in stays))
print("villages", collections.Counter(s["village"] for s in stays).most_common())
print("articles", len(articles), collections.Counter(a["section"] for a in articles))
print("reviews files", len(reviews_by_slug), "reviews", sum(len(v) for v in reviews_by_slug.values()))
print("images", len(images))
print("unknown internal links", len(unknown_links), unknown_links.most_common(15))
