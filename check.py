#!/usr/bin/env python3
"""Check one Mise en Place edition before it is published. Usage: python3 check.py 2026-11-08

Stops with a list of problems if the edition breaks BRIEF.md or would break
the page. If it passes, adds the date to briefs/index.json. Chrome proves the
page renders. The privacy guard needs the MEP_SALT environment variable (it
is kept outside this public repository) and fails closed without it.
"""
import datetime
import functools
import hashlib
import http.server
import json
import os
import pathlib
import re
import shutil
import subprocess
import sys
import threading
import unicodedata
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).parent.resolve()
START = datetime.date(2026, 11, 8)
AREAS = {"kitchen", "drinks", "money", "opening", "brand", "guests"}
NEWS_AREAS = {"industry", "trends", "finedining", "openings"}
TOOL_KINDS = {"checklist", "formula", "framework", "script", "template"}
EM_DASH = "—"

# Privacy guard. Blocked words are stored only as salted sha256 fingerprints
# of the lower-case word. The salt is secret (MEP_SALT), so the short words
# cannot be recovered by hashing a dictionary. Before matching, text is
# normalised (accents, invisible characters, look-alike letters and digits
# removed) and checked as words, words joined in pairs and threes, spaced-out
# letters, plurals and digit suffixes. See privacy() below.
BLOCKED = {
    "1be9d25b50a533e7b6785f79c11743637152c42a6bda725fcad76ab4351ec7b9",
    "1dd899b8b8a6d9517930394c0cd4198fe74dc5ae704e64ff4f60bc3327c7ee18",
    "23e590457845aa59f9a1d45a8f29a049a5cd36012a1a10abfeb77fb560a4df95",
    "6515d9729b40c6510b219ac174f452757d93b2ccf100fed5be98275da03170fc",
    "aa32e06543e532ffa860751c75210dbfa644767c474cac919c31d77df4b9275d",
    "b7576e025c83e6258340455b7d6d125d5c2f900443f482a48b0398e53556204b",
    "f63ba2dccd46c85492b72c5b50e168b57a24dcb4564be536dc0e737808be412b",
}
SALT_CHECK = "781b9e362758451ce9e7a9a6e929cc1f303e52bfe74dce8260df22e7d7a73e1e"

# Official bodies: a lesson whose course entry names one must cite a page on
# one of these sites, re-checked on the day.
OFFICIAL_TEXT = re.compile(r"FSA|Food Standards|HSE|Health and Safety|GOV\.UK|HMRC|Acas|ICO|Home Office|section 182|"
                           r"Licensing Act|Act 19|Act 20|Companies House|Planning Portal|Pensions Regulator|EHRC|CMA|ASA|SIA|"
                           r"Trading Standards|Food Information Regulations|legislation", re.I)
OFFICIAL_HOSTS = ("gov.uk", "acas.org.uk", "ico.org.uk", "asa.org.uk", "equalityhumanrights.com",
                  "planningportal.co.uk", "legislation.gov.uk", "food.gov.uk", "hse.gov.uk", "ppluk.com", "pplprs.co.uk")

SVG_NS = "{http://www.w3.org/2000/svg}"
SVG_TAGS = {"svg", "g", "rect", "circle", "ellipse", "line", "polyline", "polygon", "path", "text", "tspan",
            "title", "desc", "defs", "linearGradient", "radialGradient", "stop", "marker", "clipPath"}
SVG_ATTRS = {"viewBox", "xmlns", "role", "aria-label", "id", "x", "y", "x1", "y1", "x2", "y2", "cx", "cy", "r", "rx", "ry",
             "width", "height", "d", "points", "fill", "fill-opacity", "stroke", "stroke-width", "stroke-dasharray",
             "stroke-linecap", "stroke-linejoin", "stroke-opacity", "opacity", "transform", "font-size", "font-weight",
             "font-family", "font-style", "text-anchor", "dominant-baseline", "letter-spacing", "dx", "dy",
             "offset", "stop-color", "stop-opacity", "gradientUnits", "gradientTransform", "fx", "fy",
             "markerWidth", "markerHeight", "refX", "refY", "orient", "markerUnits", "marker-end", "marker-start",
             "clip-path", "clipPathUnits", "preserveAspectRatio", "textLength", "lengthAdjust", "pathLength"}
problems = []


def need(cond, msg):
    if not cond:
        problems.append(msg)


def text(where, value, limit=None, empty_ok=False):
    if empty_ok and value == "":
        return
    need(isinstance(value, str) and value.strip(), f"{where}: missing text")
    if isinstance(value, str):
        need("<" not in value and ">" not in value, f"{where}: no HTML or angle brackets in text")
        if limit:
            need(len(value) <= limit, f"{where}: {len(value)} characters, limit {limit}")


def url(where, value):
    v = str(value or "")
    need(re.match(r"^https://[a-z0-9.-]+\.[a-z]{2,}(/|$)", v, re.I) is not None, f"{where}: url must be a full https:// address")
    return v


def host(u):
    m = re.match(r"^https://([^/]+)", str(u or ""), re.I)
    return m.group(1).lower() if m else ""


def official(u):
    h = host(u)
    return any(h == d or h.endswith("." + d) for d in OFFICIAL_HOSTS)


def strings(o):
    if isinstance(o, str):
        yield o
    elif isinstance(o, dict):
        for k, v in o.items():
            yield str(k)
            yield from strings(v)
    elif isinstance(o, list):
        for v in o:
            yield from strings(v)


def words(s):
    return len(re.findall(r"[A-Za-z0-9£%'.-]+", s))


def paths(o, at="edition"):
    if isinstance(o, str):
        yield at, o
    elif isinstance(o, dict):
        for k, v in o.items():
            yield at, str(k)
            yield from paths(v, f"{at}.{k}")
    elif isinstance(o, list):
        for i, v in enumerate(o):
            yield from paths(v, f"{at}[{i}]")


# Words of 5 letters or more are also searched for inside longer runs of
# letters (hashtags, web addresses, words run together). These fingerprints
# use the prefix "sub:" so they cannot be compared with BLOCKED.
BLOCKED_INSIDE = {
    "14d0cafd83793c8d63516bfb77bf1a4c73c0abd7074b4f288cd649117aa3cf13",
    "3238cef6756826b9b1e2d259a01b7c50834495a665ded927426732e5408f6f5c",
    "7af33760642333b253ab4def9c53816fd6217d7cefae7e100d1f46e49a25a402",
    "968ac20d9a2972eab673c26950b371b8243033561ed25a7f26dede85b2ef59e9",
    "f29574f5fa7c147499c83ab99529f095b265d8e765212f0b9c8b745a221045ba",
}
# Letters from other alphabets that look like plain a to z (Cyrillic, Greek and
# a few others). Accents and full-width letters are handled by NFKD below.
LOOKALIKE = str.maketrans("аеорсухіјѕԁԛԝһкмтвнпгαεοριυνκτχβηιμςſı", "aeopcyxijsdqwhkmtbhnrae" "opiuvktxbnimssi")
DIGIT_AS_LETTER = str.maketrans("0134578@$", "oieastba" "s")
DIGIT_AS_LETTER_NO8 = str.maketrans("013457@$", "oieast" "as")
SPLIT = re.compile(r"[a-z0-9]+")
JOINERS = re.compile(r"[a-z0-9]+(?:[-._/'’][a-z0-9]+)+")


def plain(s):
    """Lower-case, drop accents and invisible characters, map look-alike letters."""
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if unicodedata.category(c) not in ("Mn", "Me", "Cf") and c not in "\u00ad\u034f")
    return s.lower().translate(LOOKALIKE)


def candidates(s):
    """Every form of the text that a blocked word could hide in."""
    base = plain(s)
    out = set()
    # Digits inside a word are read as letters (0 as o, 3 as e...), but not a
    # digit that starts a word, so "5am" stays a time. One form leaves 8 as
    # a digit.
    leet = [re.sub(r"(?<=[a-z0-9])[0-9@$]", lambda m, t=t: m.group().translate(t), base) for t in (DIGIT_AS_LETTER, DIGIT_AS_LETTER_NO8)]
    for form in [base, *leet, re.sub(r"(?<=[a-z0-9])1", "l", base)]:
        toks = SPLIT.findall(form)
        out.update(toks)
        out.update(re.sub(r"[-._/'’]", "", m) for m in JOINERS.findall(form))   # split-up words, possessives
        for i in range(len(toks) - 1):                                              # pairs and triples
            out.add(toks[i] + toks[i + 1])
            if i + 2 < len(toks):
                out.add(toks[i] + toks[i + 1] + toks[i + 2])
        run = []                                                                    # s p a c e d letters
        for t in toks + [""]:
            if len(t) == 1:
                run.append(t)
                continue
            if len(run) >= 3:
                j = "".join(run)
                out.update(j[a:b] for a in range(len(j)) for b in range(a + 3, len(j) + 1))
            run = []
        # A hashtag may start or end with a short blocked word (#namelondon).
        out.update("#" + t for t in re.findall(r"#([a-z0-9]+)", form))
    more = set()
    for t in out:
        more.add(re.sub(r"[0-9]+$", "", t))
        if t.endswith("s"):
            more.add(t[:-1])
    return out | more


def privacy(b):
    salt = os.environ.get("MEP_SALT", "")
    if hashlib.sha256(("check:" + salt).encode()).hexdigest() != SALT_CHECK:
        problems.append("privacy guard: MEP_SALT is missing or wrong, so the edition cannot be checked (fails closed)")
        return
    whole = functools.lru_cache(maxsize=None)(lambda w: hashlib.sha256((salt + ":" + w).encode()).hexdigest() in BLOCKED)
    inside = functools.lru_cache(maxsize=None)(lambda w: hashlib.sha256((salt + ":sub:" + w).encode()).hexdigest() in BLOCKED_INSIDE)

    def blocked(t):
        if t.startswith("#"):
            t = t[1:]
            return any(whole(t[:i]) or whole(t[i:]) for i in range(1, len(t))) or blocked(t)
        if whole(t):
            return True
        for i in range(1, len(t)):                       # two blocked words run together
            if whole(t[:i]) and (whole(t[i:]) or whole(t[i:].rstrip("s"))):
                return True
        return any(inside(t[a:a + n]) for n in range(5, 15) for a in range(len(t) - n + 1))

    for at, s in paths(b):
        if any(blocked(t) for t in candidates(s)):
            # Never print the word itself: check output can end up in public logs.
            problems.append(f"privacy guard: a blocked name appears in {at}. Remove it; never name the workplaces, "
                            "the owner or the new concept")


# Colour palette (Champagne, tuned, 8 Nov 2026): main, tint and deep for each area,
# plus the frame colours. Any strong colour in a diagram must come from here;
# soft neutrals (greys, ivories, browns with little colour) are always allowed.
PALETTE = {"#ea5f36", "#fce9e3", "#ac4627", "#865d00", "#eee8db", "#009b37", "#dbf1e3", "#00792b",
           "#258fec", "#e0effc", "#1b68ad", "#b31e65", "#f4dfe9", "#7647cd", "#ece5f8",
           "#b48a3c", "#e4cf9c", "#857353", "#2b2417", "#fffdf8", "#fcf9f2", "#ffffff", "#000000"}
NAMED_OK = {"none", "white", "black", "transparent", "currentcolor"}
FAMILY = {"#ea5f36": "Kitchen", "#fce9e3": "Kitchen", "#ac4627": "Kitchen", "#865d00": "Drinks", "#eee8db": "Drinks",
          "#009b37": "Money", "#dbf1e3": "Money", "#00792b": "Money", "#258fec": "Opening", "#e0effc": "Opening",
          "#1b68ad": "Opening", "#b31e65": "Brand", "#f4dfe9": "Brand", "#7647cd": "Guests", "#ece5f8": "Guests"}


def colour_ok(v):
    v = v.strip().lower()
    if v in NAMED_OK or v.startswith("url(#"):
        return True
    if re.fullmatch(r"#[0-9a-f]{3}", v):
        v = "#" + "".join(c * 2 for c in v[1:])
    if not re.fullmatch(r"#[0-9a-f]{6}", v):
        return False
    rgb = [int(v[i:i + 2], 16) for i in (1, 3, 5)]
    return v in PALETTE or max(rgb) - min(rgb) <= 40


def svg(where, s):
    if not isinstance(s, str) or not s.strip().startswith("<svg"):
        problems.append(f"{where}: svg must be one inline <svg> element")
        return
    need(len(s) <= 24000, f"{where}: svg is {len(s)} characters, limit 24000")
    low = s.lower()
    for bad in ("<!doctype", "<!entity", "<script", "<image", "<img", "<foreignobject", "<use", "<style", "<a ", "<a>",
                "href", "javascript:", "http:", "https:", "@import", "data:", "<iframe", "onload", "onclick"):
        need(bad not in low or (bad in ("http:", "https:") and "xmlns=\"http://www.w3.org/2000/svg\"" in low
                                and low.count(bad) == low.count("http://www.w3.org/2000/svg")),
             f"{where}: svg must not contain {bad!r} (no scripts, links or outside images)")
    need(EM_DASH not in s, f"{where}: svg contains an em dash")
    try:
        root = ET.fromstring(s)
    except ET.ParseError as e:
        problems.append(f"{where}: svg is not valid XML ({e})")
        return
    need(root.tag in ("svg", SVG_NS + "svg"), f"{where}: the outer element must be <svg>")
    vb = (root.get("viewBox") or "").replace(",", " ").split()
    if len(vb) == 4 and all(re.match(r"^-?\d+(\.\d+)?$", v) for v in vb):
        w, h = float(vb[2]), float(vb[3])
        need(280 <= w <= 360, f"{where}: viewBox width {w:g} must be 280 to 360 so labels stay readable on a phone")
        need(80 <= h <= 520, f"{where}: viewBox height {h:g} must be 80 to 520")
    else:
        problems.append(f"{where}: svg needs viewBox=\"0 0 W H\"")
    need(root.get("role") == "img" and (root.get("aria-label") or "").strip(), f"{where}: svg needs role=\"img\" and an aria-label")
    texts, shapes = 0, 0
    for el in root.iter():
        tag = el.tag.replace(SVG_NS, "")
        if tag not in SVG_TAGS:
            problems.append(f"{where}: svg element <{tag}> is not allowed")
            continue
        for a, v in el.attrib.items():
            name = a.replace("{http://www.w3.org/XML/1998/namespace}", "xml:")
            if name not in SVG_ATTRS:
                problems.append(f"{where}: svg attribute {name!r} on <{tag}> is not allowed")
            if "url(" in v.replace(" ", "") and not re.fullmatch(r"\s*url\(#[A-Za-z0-9_-]+\)\s*", v):
                problems.append(f"{where}: svg attribute {name!r} may only point inside the drawing, url(#id)")
            if name in ("fill", "stroke", "stop-color") and not colour_ok(v):
                problems.append(f"{where}: colour {v!r} on <{tag}> is not in the palette (BRIEF.md, Colours): use an area's main, tint or deep, the frame colours, or a soft neutral")
            if name == "font-size":
                m = re.match(r"^(\d+(\.\d+)?)(px)?$", v.strip())
                need(m is not None and float(m.group(1)) >= 11, f"{where}: font-size {v!r} is below 11 and unreadable on a phone")
        if tag in ("text", "tspan") and (el.text or "").strip():
            texts += 1
        if tag in ("rect", "circle", "ellipse", "line", "polyline", "polygon", "path"):
            shapes += 1
    fams = {FAMILY[v.strip().lower()] for el in root.iter() for k, v in el.attrib.items()
            if k in ("fill", "stroke", "stop-color") and v.strip().lower() in FAMILY}
    need(len(fams) <= 2, f"{where}: uses {len(fams)} colour families ({', '.join(sorted(fams))}); use one, or two only to compare two things")
    need(texts >= 3, f"{where}: the diagram needs at least 3 text labels")
    need(shapes >= 3, f"{where}: the diagram needs at least 3 drawn shapes")


PHOTO_SRC = re.compile(r"^https://(upload|thumb)\.wikimedia\.org/wikipedia/commons/[^\s?#\"'<>]+\.jpe?g$|^https://images\.unsplash\.com/photo-[A-Za-z0-9-]+\?[^\s#\"'<>]*fm=jpg[^\s#\"'<>]*$", re.I)
PHOTO_PAGE = re.compile(r"^https://commons\.wikimedia\.org/wiki/File:[^\s\"'<>]+$|^https://unsplash\.com/photos/[^\s\"'<>]+$")
LICENCES = {"CC0", "Public domain", "CC BY 2.0", "CC BY 2.5", "CC BY 3.0", "CC BY 4.0",
            "CC BY-SA 2.0", "CC BY-SA 2.5", "CC BY-SA 3.0", "CC BY-SA 4.0", "Unsplash Licence"}


def news_v2(w, s):
    text(f"{w} gist", s.get("gist"), 200)
    big = s.get("big") or {}
    text(f"{w} big value", big.get("value"), 10)
    text(f"{w} big label", big.get("label"), 30)
    r = s.get("read") or {}
    text(f"{w} read.what", r.get("what"), 600)
    text(f"{w} read.how", r.get("how", ""), 600, empty_ok=True)
    text(f"{w} read.soWhat", r.get("soWhat"), 360)
    text(f"{w} read.take", r.get("take"), 280)
    ph = s.get("photo")
    if ph is not None:
        src, page, lic = str(ph.get("src", "")), str(ph.get("page", "")), ph.get("licence")
        need(PHOTO_SRC.match(src) is not None, f"{w} photo: src must be a .jpg on upload.wikimedia.org or thumb.wikimedia.org, or an images.unsplash.com photo with fm=jpg")
        need(PHOTO_PAGE.match(page) is not None, f"{w} photo: page must be the photo's own Wikimedia Commons file page or unsplash.com/photos page")
        need(lic in LICENCES, f"{w} photo: licence must be one of {sorted(LICENCES)}")
        unsplash = "unsplash.com" in src
        need(unsplash == (lic == "Unsplash Licence") == ("unsplash.com" in page), f"{w} photo: Unsplash photos use the Unsplash Licence and an unsplash.com page; Commons photos use their Commons licence and file page")
        text(f"{w} photo credit", ph.get("credit"), 80)
        text(f"{w} photo alt", ph.get("alt"), 200)
    if s.get("drawing") is not None:
        svg(f"{w} drawing", s.get("drawing"))
        text(f"{w} drawingAlt", s.get("drawingAlt"), 200)


def today_uk():
    try:
        from zoneinfo import ZoneInfo
        return datetime.datetime.now(ZoneInfo("Europe/London")).date()
    except Exception:  # no time zone data: UTC+1 is never earlier than UK time
        return (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)).date()


def course_day(date):
    c = json.loads((ROOT / "course.json").read_text(encoding="utf-8"))
    reps = c.get("repeats", {})   # a repeat date re-teaches an earlier day; later dates move back one
    k = date.isoformat()
    d = reps.get(k) or (date - START).days + 1 - sum(r < k for r in reps)
    return d, [l for l in c["lessons"] if l["day"] == d], c


def check(date):
    b = json.loads((ROOT / "briefs" / f"{date}.json").read_text(encoding="utf-8"))
    day = datetime.date.fromisoformat(date)
    need(b.get("date") == date, "date does not match the filename")
    need(day <= today_uk(), f"{date} is later than today in the UK: never publish an edition ahead of its day")
    need("sample" not in b, "remove the sample flag")
    need(b.get("dayLabel") == f"{day:%A} {day.day} {day:%B %Y}", "dayLabel does not match the date")
    n, todays, course = course_day(day)
    m = re.search(r"const REPEATS=(\{[^}]*\})", (ROOT / "app.js").read_text(encoding="utf-8"))
    need(bool(m) and json.loads(m.group(1).replace("'", '"')) == course.get("repeats", {}), "app.js REPEATS must match course.json repeats")
    need(1 <= n <= 221, f"{date} is course day {n}: the course runs from day 1 (8 November 2026) to day 221 (17 June 2027)")
    need(b.get("day") == n, f"day must be {n} for {date}")
    if todays:
        need(b.get("phase") == todays[0]["phase"], f"phase must be {todays[0]['phase']} on day {n}")
    text("welcome", b.get("welcome"), 160)

    for at, s in paths(b):
        if EM_DASH in s:
            # Report only where: check output is copied into the public Actions log.
            problems.append(f"the edition contains an em dash in {at}")
            break
    privacy(b)

    ls = b.get("lessons") or []
    need(len(ls) == len(todays), f"day {n} has {len(todays)} lessons in course.json, the edition has {len(ls)}")
    for i, (l, c) in enumerate(zip(ls, todays)):
        w = f"lesson {i + 1}"
        for k in ("n", "area", "module", "title", "outcome"):
            need(l.get(k) == c[k], f"{w}: {k} must match course.json exactly: {c[k]!r}")
        svg(f"{w} diagram", l.get("svg"))
        text(f"{w} alt", l.get("alt"), 240)
        text(f"{w} intro", l.get("intro"), 600)
        pts = l.get("points") or []
        need(2 <= len(pts) <= 4, f"{w}: 2 to 4 points")
        for j, p in enumerate(pts):
            text(f"{w} point {j + 1} heading", p.get("h"), 60)
            text(f"{w} point {j + 1} text", p.get("p"), 650)
        text(f"{w} atWork", l.get("atWork"), 360)
        text(f"{w} takeaway", l.get("takeaway"), 220)
        total = sum(words(str(x)) for x in [l.get("intro", ""), l.get("atWork", ""), l.get("takeaway", "")] +
                    [p.get("p", "") for p in pts])
        need(220 <= total <= 600, f"{w}: {total} words, aim for about 3 minutes (220 to 600 words)")
        src = l.get("sources") or []
        need(1 <= len(src) <= 4, f"{w}: 1 to 4 sources")
        for j, s in enumerate(src):
            text(f"{w} source {j + 1} name", s.get("name"), 90)
            url(f"{w} source {j + 1}", s.get("url"))
        if c.get("source") and OFFICIAL_TEXT.search(c["source"]):
            need(any(official(s.get("url")) for s in src),
                 f"{w}: course names an official source ({c['source']}), so cite its current page (gov.uk, legislation.gov.uk, food.gov.uk, hse.gov.uk, acas.org.uk, ico.org.uk or asa.org.uk)")
        if "checked" in l:
            text(f"{w} checked", l.get("checked"), 240)
        if c["area"] == "opening" or (c.get("source") and OFFICIAL_TEXT.search(c["source"])):
            figs = re.findall(r"£\s?\d", " ".join(strings(l)))
            need(not figs or "checked" in l, f"{w}: quotes money figures, so add 'checked' saying where and when each was re-checked today")

    news = b.get("news") or []
    need(3 <= len(news) <= 10, "news: 3 to 10 items in all")
    heads = []
    for i, s in enumerate(news):
        w = f"news {i + 1}"
        need(s.get("area") in NEWS_AREAS, f"{w}: area must be one of {sorted(NEWS_AREAS)}")
        text(f"{w} headline", s.get("headline"), 90)
        if "read" in s:
            news_v2(w, s)
        elif date >= "2026-11-09":
            problems.append(f"{w}: use the news format in BRIEF-news.md (gist, big, read, and photo or drawing where they help)")
        else:  # older format, only for editions before 9 November 2026
            text(f"{w} summary", s.get("summary"), 260)
            text(f"{w} why", s.get("why"), 220)
        src = s.get("source") or {}
        text(f"{w} source name", src.get("name"), 60)
        text(f"{w} source date", src.get("date"), 12)
        url(f"{w} source", src.get("url"))
        heads.append(str(s.get("headline", "")).strip().lower())
    need(len(heads) == len(set(heads)), "news: two items have the same headline")
    for a in NEWS_AREAS:
        need(sum(s.get("area") == a for s in news) <= 3, f"news: 3 items at most in {a}")
    text("newsNote", b.get("newsNote", ""), 200, empty_ok=True)

    t = b.get("try") or {}
    text("try title", t.get("title"), 80)
    st = t.get("steps") or []
    need(2 <= len(st) <= 4, "try: 2 to 4 steps")
    for i, s in enumerate(st):
        text(f"try step {i + 1}", s, 180)
    text("try why", t.get("why"), 260)

    qz = b.get("quiz") or []
    need(len(qz) == 5, "quiz: exactly 5 questions")
    for i, q in enumerate(qz):
        w = f"quiz {i + 1}"
        text(f"{w} question", q.get("q"), 180)
        ops = q.get("options") or []
        need(len(ops) == 4, f"{w}: exactly 4 options")
        for j, o in enumerate(ops):
            text(f"{w} option {j + 1}", o, 100)
        need(len({str(o).strip().lower() for o in ops}) == len(ops), f"{w}: two options are the same")
        need(q.get("answer") in (0, 1, 2, 3), f"{w}: answer must be 0, 1, 2 or 3")
        text(f"{w} why", q.get("why"), 280)
        need(q.get("from") in list(range(1, len(ls) + 1)) + ["news"], f"{w}: from must be a lesson number 1 to {len(ls)} or \"news\"")
    for k in range(1, len(ls) + 1):
        need(sum(q.get("from") == k for q in qz) >= 1, f"quiz: needs at least one question on lesson {k}")
    answers = [q.get("answer") for q in qz]
    need(len(set(answers)) >= 2, "quiz: vary the position of the right answer")
    if date >= "2026-11-12":   # length must not give the answer away (it did in 9 of the first 15 questions)
        def longest(q):
            n = [len(str(o).strip()) for o in q.get("options") or []]
            a = q.get("answer")
            return len(n) == 4 and a in (0, 1, 2, 3) and n[a] == max(n) and n.count(n[a]) == 1
        tell = sum(longest(q) for q in qz)
        need(tell <= 2, f"quiz: the right answer is the longest option in {tell} of 5 questions; at most 2. Make the options similar in length")

    terms = b.get("terms") or []
    need(3 <= len(terms) <= 9, "terms: 3 to 9 glossary terms")
    for i, x in enumerate(terms):
        text(f"term {i + 1}", x.get("term"), 40)
        text(f"term {i + 1} def", x.get("def"), 240)
        need(x.get("lesson") in range(1, len(ls) + 1), f"term {i + 1}: lesson must be 1 to {len(ls)}")
    tk = b.get("toolkit") or []
    need(1 <= len(tk) <= 3, "toolkit: 1 to 3 tools")
    for i, x in enumerate(tk):
        text(f"tool {i + 1} name", x.get("name"), 60)
        need(x.get("kind") in TOOL_KINDS, f"tool {i + 1}: kind must be one of {sorted(TOOL_KINDS)}")
        it = x.get("items") or []
        need(2 <= len(it) <= 8, f"tool {i + 1}: 2 to 8 items")
        for j, s in enumerate(it):
            text(f"tool {i + 1} item {j + 1}", s, 180)
        need(x.get("lesson") in range(1, len(ls) + 1), f"tool {i + 1}: lesson must be 1 to {len(ls)}")

    bare = json.loads(json.dumps(b))
    for s in bare.get("news") or []:
        s.pop("photo", None)
    blob = json.dumps(bare)
    need(not re.search(r"<img|\.png|\.jpe?g|\.gif|\.webp|\.avif", blob, re.I), "no outside images: the edition mentions an image file or <img> outside a news photo")


def render(date):
    chrome = next(filter(None, map(shutil.which, ["google-chrome", "chromium", "chromium-browser"])), None) \
        or "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    handler = functools.partial(QuietHandler, directory=str(ROOT))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    page = f"http://127.0.0.1:{server.server_port}/index.html?d={date}&still&open=1"
    try:
        out = subprocess.run(
            [chrome, "--headless=new", "--no-sandbox", "--disable-gpu", "--window-size=390,844",
             "--virtual-time-budget=5000", "--dump-dom", page],
            capture_output=True, text=True, timeout=90).stdout
    finally:
        server.shutdown()
    b = json.loads((ROOT / "briefs" / f"{date}.json").read_text(encoding="utf-8"))
    n = len(b.get("lessons") or [])
    got = len(re.findall(r'<button class="tk[ "]', out))
    need(got == n, f"page rendered {got} lesson tickets, expected {n}")
    need(out.count('class="glimpse" data-ok="1"') == n, "page did not draw every ticket's diagram close-up (an svg was refused by the page)")
    need('class="lsheet"' in out and re.search(r'class="fig"[^>]*data-ok="1"', out) is not None, "page could not open lesson 1 with its diagram")
    need('data-hero="' in out, "page did not start its opening")
    need('class="quizcard"' in out, "page did not render the quiz")
    need('class="news"' in out, "page did not render the news")
    need('class="err"' not in out, "page showed its error message")


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def main():
    date = sys.argv[1]
    datetime.date.fromisoformat(date)
    index_path = ROOT / "briefs" / "index.json"
    original = index_path.read_text()
    try:
        check(date)
    except Exception as e:
        need(False, f"edition could not be read: {type(e).__name__}: {e}")
    if not problems:
        dates = sorted(set(json.loads(original)) | {date}, reverse=True)
        index_path.write_text(json.dumps(dates))
        render(date)
    if problems:
        index_path.write_text(original)
        print("FAILED")
        print("\n".join(f"- {p}" for p in problems))
        sys.exit(1)
    print("PASSED")


main()
