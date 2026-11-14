"""How-this-brief-was-made page test (made.js). Run from the repository: python3 tests/test_made_page.py [--shots DIR]

Copies this folder to a temporary site, adds the real editions from origin/briefs and, in the copy only,
loads made.js after evidence.js and switches app.js to "Made, falling back to Evidence". It serves the
copy on this machine only, and one headless Chrome checks, at 320, 360 and 390 pixels wide on the newest
real edition:

- the section is there, and the counts, the source total and the sources by tier equal the edition's own;
- the drawing is a labelled image, plays once when scrolled into view and ends in its finished state;
- nothing in the section is wider than the screen, no text is under 12px, and tap targets are 44px or more;
- every rejected lead is listed with its reason, and every source link is https and opens safely;
and that ?still draws it finished at once, that an edition with "evidence" removed falls back to the old
panel with no script error, and that an evidence block with only a search count still draws.

With --shots DIR it then saves made-320.png and made-390.png (the finished section) into DIR, one Chrome
at a time. Run this test on its own: parallel Chrome jobs stall on the Mac. Prints MADE PAGE OK or the misses.
"""
import copy, functools, http.server, json, pathlib, re, shutil, subprocess, sys, tempfile, threading

ROOT = pathlib.Path(__file__).resolve().parent.parent
CHROME = next(filter(None, map(shutil.which, ["google-chrome", "chromium", "chromium-browser"])), None) \
    or "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
WIDTHS = [320, 360, 390]
SHOTS = pathlib.Path(sys.argv[sys.argv.index("--shots") + 1]) if "--shots" in sys.argv else None


def git(*a):
    return subprocess.run(["git", "-C", str(ROOT), *a], capture_output=True, text=True, check=True).stdout


dates = sorted(p[7:17] for p in git("ls-tree", "--name-only", "origin/briefs", "briefs/").split() if p[7:11].isdigit())
assert len(dates) >= 3, "needs at least 3 published editions on origin/briefs"
real, noev, part = dates[-1], dates[0], dates[1]   # the two early dates are replaced in the copy by fixtures
newest = json.loads(git("show", f"origin/briefs:briefs/{real}.json"))
ev = newest.get("evidence")
assert isinstance(ev, dict), f"the newest edition ({real}) has no evidence block to test against"
fx_no = copy.deepcopy(newest); fx_no["date"] = noev; fx_no.pop("evidence")
fx_part = copy.deepcopy(newest); fx_part["date"] = part; fx_part["evidence"] = {"searches": 12}

# what the page should say, worked out here from the edition and the register (the same rules as check.py)
reg = json.loads((ROOT / "sources.json").read_text(encoding="utf-8"))


def sources(b):
    seen, out = set(), []

    def walk(o, k):
        if isinstance(o, list):
            for v in o:
                walk(v, k)
        elif isinstance(o, dict):
            if k in ("source", "sources") and isinstance(o.get("url"), str):
                if o["url"] not in seen:
                    seen.add(o["url"]); out.append(o)
                return
            for j, v in o.items():
                if j != "evidence":
                    walk(v, j)
    walk(b, None)
    return out


def tier(u):
    m = re.match(r"^https?://([^/:?#]+)", u or "", re.I)
    h = m.group(1).lower() if m else ""
    h = h[4:] if h.startswith("www.") else h
    best, n = "unlisted", -1
    for t in ("original", "secondary", "lead"):
        for d in reg["tiers"].get(t, []):
            if (h == d or h.endswith("." + d)) and len(d) > n:
                best, n = t, len(d)
    return best


src = sources(newest)
want_tiers = {}
for s in src:
    want_tiers[tier(s["url"])] = want_tiers.get(tier(s["url"]), 0) + 1
rej = [r for r in ev.get("rejected", []) if isinstance(r, dict) and r.get("what")]
want_nums = {"searches": str(ev["searches"]), "rejected": str(len(rej)), "kept": str(ev["kept"])}
plural = lambda n, one, many: f"{n} {one if n == 1 else many}"
want_label = ", ".join([plural(ev["searches"], "search", "searches") + " run", plural(len(rej), "lead", "leads") + " rejected", plural(ev["kept"], "story", "stories") + " kept"])

AUDIT = r"""
(async () => {
  const out = { cases: {}, errors: [] };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  async function until(fn, what, ms = 15000) {
    const t = Date.now();
    for (;;) { let v; try { v = fn(); } catch (e) { v = null; } if (v) return v;
      if (Date.now() - t > ms) throw new Error('timed out waiting for ' + what); await sleep(40); }
  }
  const D = f => f.contentDocument;
  async function load(date, w, extra = '') {
    document.querySelectorAll('iframe').forEach(f => f.remove());
    const f = document.createElement('iframe'); f.style.cssText = 'width:' + w + 'px;height:844px;border:0'; document.body.append(f);
    f.src = '/index.html?d=' + date + extra;
    await until(() => D(f) && D(f).querySelector('section.mk, section.evidence'), 'the how-made section on ' + date + ' at ' + w);
    return f;
  }
  const loaded = f => { const l = D(f).querySelector('.mk-legend'); return l && !l.hidden; };
  function measure(f) {
    const d = D(f), w = f.contentWindow, sec = d.querySelector('section.mk'), vw = d.documentElement.clientWidth;
    /* it starts closed: note that, then open it (without the fold's transition) so everything can be measured */
    const tg = sec.querySelector('.mk-toggle'), bodyEl = sec.querySelector('#mk-body');
    const closed = tg.getAttribute('aria-expanded') === 'true' ? null : { expanded: tg.getAttribute('aria-expanded'), bodyH: bodyEl.getBoundingClientRect().height, inert: bodyEl.inert === true, h: sec.getBoundingClientRect().height, tap: tg.getBoundingClientRect().height };
    if (closed) { const st = d.createElement('style'); st.textContent = '.mk-fold,.mk-fold>div,.mk-in,.mk-bar i{transition:none!important;animation:none!important}'; d.head.append(st); tg.click(); }
    const opened = { expanded: tg.getAttribute('aria-expanded'), inert: bodyEl.inert === true, label: tg.textContent };
    sec.querySelectorAll('details').forEach(x => { x.open = true; });
    const name = e => e.tagName.toLowerCase() + (e.getAttribute('class') ? '.' + e.getAttribute('class') : '');
    const wide = [], small = [], taps = [];
    [sec, ...sec.querySelectorAll('*')].forEach(e => {
      const r = e.getBoundingClientRect();
      if (r.width > vw + 0.5 || r.right > vw + 0.5 || r.left < -0.5) wide.push(name(e) + ' ' + r.left.toFixed(1) + ' to ' + r.right.toFixed(1));
      if ([...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) {
        const fs = parseFloat(w.getComputedStyle(e).fontSize); if (fs < 12) small.push(name(e) + ' ' + fs + 'px'); }
    });
    sec.querySelectorAll('summary, a, button').forEach(e => { const h = e.getBoundingClientRect().height; if (h < 44) taps.push(name(e) + ' ' + h.toFixed(1)); });
    const nums = {}; sec.querySelectorAll('.mk-nums li').forEach(li => { nums[li.dataset.k] = li.querySelector('b').textContent; });
    const tiers = {}; sec.querySelectorAll('.mk-legend li').forEach(li => { tiers[li.dataset.t] = +li.dataset.n; });
    const svg = sec.querySelector('svg'), marks = [...svg.querySelectorAll('.mk-d, .mk-t, .mk-k')];
    return { vw, scrollW: d.documentElement.scrollWidth, wide: wide.slice(0, 6), small: small.slice(0, 6), taps: taps.slice(0, 6), nums, tiers,
      closed, opened, mix: sec.querySelector('.mk-row p').textContent, heading: sec.querySelector('h2').textContent,
      role: svg.getAttribute('role'), label: svg.getAttribute('aria-label'), svgText: svg.querySelectorAll('text').length,
      drawn: { d: svg.querySelectorAll('.mk-d').length, t: svg.querySelectorAll('.mk-t').length, k: svg.querySelectorAll('.mk-k').length },
      wrap: svg.parentNode.className, minOpacity: Math.min(1, ...marks.map(m => +w.getComputedStyle(m).opacity)),
      rejected: [...sec.querySelectorAll('.mk-more ol li')].map(li => [li.querySelector('strong').textContent, (li.querySelector('span') || {}).textContent || '']),
      links: [...sec.querySelectorAll('a')].map(a => [a.getAttribute('href'), a.target, a.rel]),
      count: d.querySelectorAll('section.mk').length + d.querySelectorAll('section.evidence').length, errs: w.__errs || [] };
  }
  async function run(name, fn) { try { out.cases[name] = await fn(); } catch (e) { out.errors.push(name + ': ' + e.message); } }
  for (const w of CFG.widths) await run('w' + w, async () => {
    const f = await load(CFG.real, w), d = D(f);
    const wrap = await until(() => d.querySelector('section.mk svg') && d.querySelector('section.mk svg').parentNode, 'the drawing');
    const before = wrap.className;
    d.querySelector('section.mk').scrollIntoView({ block: 'start' });
    await until(() => wrap.className === 'mk-done', 'the drawing to finish', 8000);
    await until(() => loaded(f), 'the source register');
    return Object.assign(measure(f), { before });
  });
  await run('still', async () => {
    const f = await load(CFG.real, 390, '&still'); await until(() => loaded(f), 'the source register'); return measure(f);
  });
  await run('noev', async () => {
    const f = await load(CFG.noev, 390), d = D(f), w = f.contentWindow; await sleep(600);
    const box = d.createElement('div'); let threw = false; try { w.Made.mount(box, d.defaultView.JSON.parse('{"lessons":[]}')); } catch (e) { threw = true; }
    const ev = d.querySelector('section.evidence');
    return { mk: d.querySelectorAll('section.mk').length, ev: !!ev, h: ev ? ev.querySelector('h3').textContent : '', threw, left: box.childNodes.length, errs: w.__errs || [] };
  });
  await run('part', async () => {
    const f = await load(CFG.part, 390, '&still'); await until(() => loaded(f), 'the source register'); return measure(f);
  });
  await fetch('/done', { method: 'POST', body: JSON.stringify(out) });
})();
"""

ERRLOG = "window.__errs=[];addEventListener('error',function(e){__errs.push(String(e.message)+' '+(e.filename||'')+':'+(e.lineno||''))});" \
         "addEventListener('unhandledrejection',function(e){__errs.push('unhandled rejection: '+String(e.reason))});\n"
SHOT = "(function(){var q=location.search;if(!/[?&]shot\\b/.test(q))return;var n=0,t=setInterval(function(){var s=document.querySelector('section.mk');" \
       "if(!s&&++n<200)return;clearInterval(t);if(!s)return;if(/[?&]open\\b/.test(q)){var t2=s.querySelector('.mk-toggle');if(t2)t2.click()}if(/[?&]open\\b/.test(q))s.querySelectorAll('details').forEach(function(d){d.open=true});" \
       "[].forEach.call(s.parentNode.children,function(x){if(x!==s)x.style.display='none'});var b=document.getElementById('scorebadge');if(b)b.style.display='none';" \
       "s.style.marginTop='8px';scrollTo(0,0)},50)})();\n"

done = threading.Event(); got = {}


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def do_POST(self):
        got.update(json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0)))))
        self.send_response(204); self.end_headers(); done.set()


def chrome(args, t, wait=None):
    p = subprocess.Popen([CHROME, "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
                          f"--user-data-dir={t / 'profile'}", *args], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        if wait:
            return wait()
        p.wait(90)
    finally:
        if p.poll() is None:
            p.terminate()
            try:
                p.wait(10)
            except subprocess.TimeoutExpired:
                p.kill()


patch_notes = []
with tempfile.TemporaryDirectory() as tmp:
    t = pathlib.Path(tmp); site = t / "site"; site.mkdir()
    for f in ROOT.iterdir():
        if f.name not in {".git", "briefs", "tests", ".github", ".claude", "__pycache__"}:
            (shutil.copytree if f.is_dir() else shutil.copy)(f, site / f.name)
    (site / "briefs").mkdir()
    for x in dates:
        (site / "briefs" / f"{x}.json").write_text(git("show", f"origin/briefs:briefs/{x}.json"), encoding="utf-8")
    (site / "briefs" / "index.json").write_text(json.dumps(sorted(dates, reverse=True)))
    (site / "briefs" / f"{noev}.json").write_text(json.dumps(fx_no, ensure_ascii=False), encoding="utf-8")
    (site / "briefs" / f"{part}.json").write_text(json.dumps(fx_part, ensure_ascii=False), encoding="utf-8")
    # in the copy only: load made.js, catch script errors, and mount Made with Evidence as the fallback
    idx = (site / "index.html").read_text(encoding="utf-8")
    tag = '<script src="evidence.js" defer></script>'
    assert idx.count(tag) == 1, "index.html: the evidence.js script tag was not found exactly once"
    if 'src="made.js"' not in idx:
        idx = idx.replace(tag, tag + '\n<script src="made.js" defer></script>')
    else:
        patch_notes.append("index.html already loads made.js")
    first = idx.index("<script src=")
    idx = idx[:first] + '<script src="errlog.js"></script>\n<script src="shot.js"></script>\n' + idx[first:]
    (site / "index.html").write_text(idx, encoding="utf-8")
    (site / "errlog.js").write_text(ERRLOG); (site / "shot.js").write_text(SHOT)
    app = (site / "app.js").read_text(encoding="utf-8")
    old = "if(window.Evidence)Evidence.mount(app,b,{cls:'evidence'});"
    if "Made.mount(" in app:
        patch_notes.append("app.js already calls Made.mount, so it was left as it is")
    else:
        assert app.count(old) == 1, "app.js: the Evidence.mount line was not found exactly once"
        app = app.replace(old, "if(window.Made){try{Made.mount(app,b,{cls:'evidence'})}catch(e){if(window.Evidence)Evidence.mount(app,b,{cls:'evidence'})}}"
                               "else if(window.Evidence)Evidence.mount(app,b,{cls:'evidence'});")
    (site / "app.js").write_text(app, encoding="utf-8")
    cfg = {"widths": WIDTHS, "real": real, "noev": noev, "part": part}
    (site / "made-audit.html").write_text('<!doctype html><meta charset="utf-8"><body style="margin:0"><script>const CFG=' + json.dumps(cfg)
                                          + "</script><script>" + AUDIT + "</script>", encoding="utf-8")
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Handler, directory=str(site)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{server.server_port}"
    try:
        finished = chrome(["--window-size=420,900", base + "/made-audit.html"], t, wait=lambda: done.wait(240))
        if SHOTS and finished:
            SHOTS.mkdir(parents=True, exist_ok=True)
            for w in (320, 390):
                for suffix, extra, h in (("", "", 1000), ("-open", "&open", 2600)):
                    # headless Chrome will not lay out narrower than about 500px, so the page sits in an iframe of the
                    # exact width, centred, and the picture is cropped to the centre afterwards (sips, the Mac's own image tool)
                    frame = f"shot-{w}{suffix}.html"
                    (site / frame).write_text(f'<!doctype html><body style="margin:0"><iframe style="width:{w}px;height:{h}px;border:0;display:block;margin:0 auto" '
                                              f'src="index.html?d={real}&still&shot{extra}"></iframe>', encoding="utf-8")
                    out_png = SHOTS / f"made-{w}{suffix}.png"
                    chrome(["--window-size=600," + str(h), "--force-device-scale-factor=2", "--hide-scrollbars", "--virtual-time-budget=8000",
                            f"--screenshot={out_png}", f"{base}/{frame}"], t)
                    if out_png.exists() and shutil.which("sips"):
                        subprocess.run(["sips", "-c", str(h * 2), str(w * 2), str(out_png)], capture_output=True)
    finally:
        server.shutdown()

misses = []


def want(cond, what):
    print(("ok    " if cond else "MISS  ") + what)
    if not cond:
        misses.append(what)


for n in patch_notes:
    print("note  " + n)
if not finished:
    print("MISS  Chrome did not report back within 4 minutes (a stall is not proof of a page fault: run it again on its own)")
    sys.exit(1)
c = got.get("cases", {})
for e in got.get("errors", []):
    want(False, "every case ran: " + e)
print(f"      newest edition {real}: {want_nums['searches']} searches, {want_nums['rejected']} rejected, {want_nums['kept']} kept, {len(src)} sources {want_tiers}")
for w in WIDTHS:
    m = c.get("w" + str(w))
    if not m:
        continue
    want(m["count"] == 1 and m["heading"] == "How this brief was made", f"{w}: one section, headed How this brief was made")
    cl, op = m.get("closed"), m.get("opened")
    want(bool(cl) and cl["expanded"] == "false" and cl["bodyH"] == 0 and cl["inert"] and cl["tap"] >= 44 and cl["h"] < 520, f"{w}: starts closed, with the detail folded away and unreachable (closed height {cl and round(cl['h'])})")
    want(bool(op) and op["expanded"] == "true" and not op["inert"] and op["label"] == "Close", f"{w}: one tap opens it")
    want(m["nums"] == want_nums, f"{w}: the counts shown are the edition's own (shown {m['nums']})")
    want(m["mix"].startswith(plural(len(src), "source", "sources") + " behind") and m["tiers"] == want_tiers, f"{w}: sources and tiers match the register (shown {m['tiers']}: {m['mix']})")
    want(m["role"] == "img" and want_label in (m["label"] or "") and m["svgText"] == 0, f"{w}: the drawing is role=img and its label states the counts")
    want(m["drawn"] == {"d": min(ev["searches"], 60), "t": min(len(rej), 8), "k": min(ev["kept"], 12)}, f"{w}: one mark per search, rejected lead and story (drawn {m['drawn']})")
    want(m["before"] == "mk-pre" and m["wrap"] == "mk-done" and m["minOpacity"] == 1, f"{w}: the drawing waits off screen, plays once and lands finished")
    want(m["scrollW"] <= m["vw"] and not m["wide"], f"{w}: nothing wider than the screen ({m['wide'] or 'none'})")
    want(not m["small"], f"{w}: no text under 12px ({m['small'] or 'none'})")
    want(not m["taps"], f"{w}: tap targets 44px or more ({m['taps'] or 'all fine'})")
    want(m["rejected"] == [[r["what"], r.get("why", "")] for r in rej], f"{w}: every rejected lead is listed with its reason")
    want(len(m["links"]) == len(src) and all(h.startswith("https://") and tg == "_blank" and rl == "noopener noreferrer" for h, tg, rl in m["links"]),
         f"{w}: {len(m['links'])} source links, all https, new tab, noopener noreferrer")
    want(not m["errs"], f"{w}: no script errors {m['errs'] or ''}")
s = c.get("still")
if s:
    want(s["wrap"] == "" and s["minOpacity"] == 1 and s["nums"] == want_nums, "still: drawn finished straight away, same counts")
nv = c.get("noev")
if nv:
    want(nv["mk"] == 0 and nv["ev"] and nv["h"] == "How this brief was made", "no evidence: falls back to the old panel")
    want(nv["threw"] and nv["left"] == 0, "no evidence: Made.mount throws and leaves nothing behind")
    want(not nv["errs"], f"no evidence: no script errors {nv['errs'] or ''}")
p = c.get("part")
if p:
    want(p["nums"] == {"searches": "12", "rejected": "not logged", "kept": "not logged"} and p["drawn"] == {"d": 12, "t": 0, "k": 0} and not p["errs"],
         f"searches only: draws the 12, says not logged for the rest (shown {p['nums']})")
if SHOTS:
    for w in (320, 390):
        f = SHOTS / f"made-{w}.png"
        want(f.exists() and f.stat().st_size > 5000, f"screenshot saved: {f}")
want(all(k in c for k in [f"w{w}" for w in WIDTHS] + ["still", "noev", "part"]), "every case ran")
print("MADE PAGE OK" if not misses else "MISSES: " + str(len(misses)))
sys.exit(1 if misses else 0)
