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
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).parent.resolve()
START = datetime.date(2026, 11, 8)
AREAS = {"kitchen", "drinks", "money", "opening", "brand", "guests"}
NEWS_AREAS = {"industry", "trends", "finedining", "openings"}
TOOL_KINDS = {"checklist", "formula", "framework", "script", "template"}
EM_DASH = "—"

# Privacy guard. Blocked words are stored only as salted sha256 fingerprints
# of the lower-case word. The salt is secret (MEP_SALT), so the short words
# cannot be recovered by hashing a dictionary. Matching is case-insensitive
# and on whole words: text is split on anything that is not a letter or digit.
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


def privacy(b):
    salt = os.environ.get("MEP_SALT", "")
    if hashlib.sha256(("check:" + salt).encode()).hexdigest() != SALT_CHECK:
        problems.append("privacy guard: MEP_SALT is missing or wrong, so the edition cannot be checked (fails closed)")
        return
    for at, s in paths(b):
        for w in set(re.findall(r"[a-z0-9]+", s.lower())):
            if hashlib.sha256((salt + ":" + w).encode()).hexdigest() in BLOCKED:
                # Never print the word itself: check output can end up in public logs.
                problems.append(f"privacy guard: a blocked name appears in {at}. Remove it; never name the workplaces, "
                                "the owner or the new concept")


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
            if name == "font-size":
                m = re.match(r"^(\d+(\.\d+)?)(px)?$", v.strip())
                need(m is not None and float(m.group(1)) >= 11, f"{where}: font-size {v!r} is below 11 and unreadable on a phone")
        if tag in ("text", "tspan") and (el.text or "").strip():
            texts += 1
        if tag in ("rect", "circle", "ellipse", "line", "polyline", "polygon", "path"):
            shapes += 1
    need(texts >= 3, f"{where}: the diagram needs at least 3 text labels")
    need(shapes >= 3, f"{where}: the diagram needs at least 3 drawn shapes")


def course_day(date):
    c = json.loads((ROOT / "course.json").read_text(encoding="utf-8"))
    d = (date - START).days + 1
    return d, [l for l in c["lessons"] if l["day"] == d], c


def check(date):
    b = json.loads((ROOT / "briefs" / f"{date}.json").read_text(encoding="utf-8"))
    day = datetime.date.fromisoformat(date)
    need(b.get("date") == date, "date does not match the filename")
    need("sample" not in b, "remove the sample flag")
    need(b.get("dayLabel") == f"{day:%A} {day.day} {day:%B %Y}", "dayLabel does not match the date")
    n, todays, course = course_day(day)
    need(1 <= n <= 221, f"{date} is course day {n}: the course runs from day 1 (8 November 2026) to day 221")
    need(b.get("day") == n, f"day must be {n} for {date}")
    if todays:
        need(b.get("phase") == todays[0]["phase"], f"phase must be {todays[0]['phase']} on day {n}")
    text("welcome", b.get("welcome"), 160)

    for s in strings(b):
        if EM_DASH in s:
            problems.append("the edition contains an em dash: " + s[max(0, s.find(EM_DASH) - 30):s.find(EM_DASH) + 10])
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

    blob = json.dumps(b)
    need(not re.search(r"<img|\.png|\.jpe?g|\.gif|\.webp|\.avif", blob, re.I), "no outside images: the edition mentions an image file or <img>")


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
