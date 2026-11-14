"""Quiz page test and scoring parity. Run from the repository: python3 tests/test_quiz_page.py

Serves two copies of the site on this machine only: /old is main as published
(origin/main) and /new is this folder. Both get the real editions from
origin/briefs. One headless Chrome then plays the quiz in each (tests/quiz-audit.js):

- parity: the same three real days, answered the same way by tap, must leave the
  old and the new page with identical scores, points, streak data, review list
  and badges, and show the same score screens;
- keys: the quiz played with the A to D and 1 to 4 keys, the spoken result, the
  focus, and "Practise the ones you missed" (which must change nothing saved);
- resume: a half-finished quiz picks up where it stopped;
- seven: a 7-question edition (5 on today, 2 on earlier lessons);
- sunday: the Sunday scenario scores 15 once, then is practice;
- scene: the Opening Day scene is drawn, counts the tables and picks the right
  ending, and a broken scene leaves a working plain quiz;
- layout: no sideways scroll and 44 pixel tap targets at 320, 360 and 390 wide.

Run one Chrome job at a time on the Mac. Prints QUIZ PAGE OK or the misses.
"""
import base64, copy, functools, http.server, io, json, os, pathlib, shutil, subprocess, sys, tarfile, tempfile, threading

ROOT = pathlib.Path(__file__).resolve().parent.parent
CHROME = next(filter(None, map(shutil.which, ["google-chrome", "chromium", "chromium-browser"])), None) \
    or "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"


def git(*a, text=True):
    return subprocess.run(["git", "-C", str(ROOT), *a], capture_output=True, text=text, check=True).stdout


dates = sorted(p[7:17] for p in git("ls-tree", "--name-only", "origin/briefs", "briefs/").split() if p[7:11].isdigit())
assert len(dates) >= 5, "needs at least 5 published editions on origin/briefs"
real = dates[-1]
par = [[dates[-3], [True] * 5], [dates[-2], [True, False, True, False, True]], [dates[-1], [True, True, True, True, False]]]
seven, sunday = dates[0], dates[1]          # two early dates, replaced in /new only by the fixtures below
course = json.loads((ROOT / "course.json").read_text(encoding="utf-8"))
newest = json.loads(git("show", f"origin/briefs:briefs/{real}.json"))


def review_q(l, answer):
    opts = ["A first plausible answer", "A second plausible answer", "A third plausible answer", "A fourth plausible answer"]
    return {"q": f"Review check on lesson {l['n']}?", "options": opts, "answer": answer, "why": "Because the earlier lesson said so.",
            "from": "review", "n": l["n"], "title": l["title"], "area": l["area"]}


fx7 = copy.deepcopy(newest); fx7["date"] = seven
fx7["quiz"] = fx7["quiz"][:5] + [review_q(course["lessons"][0], 2), review_q(course["lessons"][1], 0)]
fxs = copy.deepcopy(newest); fxs["date"] = sunday
fxs["scenario"] = {"title": "A full book and a late delivery", "setup": "It is 5pm on Saturday. The fish delivery is 40 minutes late and 3 tables have pre-ordered it.",
                   "q": "What do you do first?", "options": ["Call the three tables now", "Wait and see if it turns up", "Take the dish off quietly", "Ask the kitchen to hurry"],
                   "answer": 0, "why": "Guests forgive what they are told early.", "lessons": [newest["lessons"][0]["n"]]}

done = threading.Event(); got = {}


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def do_POST(self):
        got.update(json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0)))))
        self.send_response(204); self.end_headers(); done.set()


with tempfile.TemporaryDirectory() as tmp:
    t = pathlib.Path(tmp); site = t / "site"; new = site / "new"; old = site / "old"
    new.mkdir(parents=True); old.mkdir()
    for f in ROOT.iterdir():
        if f.name not in {".git", "briefs", "tests", ".github", ".claude", "__pycache__"}:
            (shutil.copytree if f.is_dir() else shutil.copy)(f, new / f.name)
    tarfile.open(fileobj=io.BytesIO(git("archive", "origin/main", text=False))).extractall(old)
    shutil.rmtree(old / "briefs", ignore_errors=True)
    for d in (new, old):
        (d / "briefs").mkdir()
        for x in dates:
            (d / "briefs" / f"{x}.json").write_text(git("show", f"origin/briefs:briefs/{x}.json"), encoding="utf-8")
        (d / "briefs" / "index.json").write_text(json.dumps(sorted(dates, reverse=True)))
    (new / "briefs" / f"{seven}.json").write_text(json.dumps(fx7, ensure_ascii=False), encoding="utf-8")
    (new / "briefs" / f"{sunday}.json").write_text(json.dumps(fxs, ensure_ascii=False), encoding="utf-8")
    cfg = {"par": par, "real": real, "seven": seven, "sunday": sunday}
    (site / "audit.html").write_text('<!doctype html><meta charset="utf-8"><body><script>const CFG=' + json.dumps(cfg) + "</script><script>"
                                     + (ROOT / "tests" / "quiz-audit.js").read_text(encoding="utf-8") + "</script>", encoding="utf-8")
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Handler, directory=str(site)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    chrome = subprocess.Popen([CHROME, "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", f"--user-data-dir={t / 'profile'}",
                               "--window-size=420,900", f"http://127.0.0.1:{server.server_port}/audit.html"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        finished = done.wait(300)
    finally:
        chrome.terminate()
        try:
            chrome.wait(10)
        except subprocess.TimeoutExpired:
            chrome.kill()
        server.shutdown()

misses = []


def want(cond, what):
    print(("ok    " if cond else "MISS  ") + what)
    if not cond:
        misses.append(what)


if not finished:
    print("MISS  Chrome did not report back within 5 minutes (a stall is not proof of a page fault: run it again on its own)")
    sys.exit(1)
c = got.get("cases", {})
for e in got.get("errors", []):
    want(False, "no script errors: " + e)
norm = lambda o: json.dumps(o, sort_keys=True, ensure_ascii=False)
po, pn = c.get("parityOld"), c.get("parityNew")
if po and pn:
    want([r["score"] for r in pn["res"]] == ["5/5", "3/5", "4/5"], "parity: the three days score 5/5, 3/5 and 4/5")
    want(norm(po["res"]) == norm(pn["res"]), "parity: old and new show the same score, points line and revise list each day")
    want(norm(po["state"]) == norm(pn["state"]), "parity: old and new save identical points, days, areas, lessons, review and badges")
    print("      points after three days, old " + str(po["state"].get("points")) + ", new " + str(pn["state"].get("points")))
k = c.get("keys")
if k:
    want(k["day"]["score"] == 4 and k["day"]["total"] == 5, "keys: A to D and 1 to 4 answer the quiz (4 of 5)")
    want(all(l["live"].startswith("Correct. ") for i, l in enumerate(k["log"]) if i != 1) and k["log"][1]["live"].startswith("Not quite. The answer is "), "keys: each result is announced to a screen reader, with the right answer on a miss")
    want(all(l["focus" + "Next"] for l in k["log"]), "keys: focus moves to the next button after each answer")
    want(k["review"] == 1, "keys: the missed question joins Review")
    want(k["hasPractise"] and k["practice"] and k["practice"]["unchanged"] and "put right" in k["practice"]["pts"], "practise the missed one: offered, playable, and it changes nothing saved")
r = c.get("resume")
if r:
    want(r["h2"] == "You are 2 questions in" and r["btn"] == "Resume quiz" and r["q3"], "resume: a half-finished quiz picks up at question 3")
    want(r["score"] == "5/5" and r["day"]["score"] == 5 and r["seated"] == "5", "resume: finishing it scores all 5 and the scene shows all 5 tables")
s = c.get("seven")
if s:
    want(s["card"] == "7 tables to seat at your own place | Today’s quiz · 5 on today, 2 from earlier lessons", "seven: the card says 7 tables, 5 on today and 2 from earlier lessons")
    want(s["score"] == "7/7" and s["day"]["total"] == 7 and s["day"]["points"] == 90, "seven: 7 of 7 scores 90 points (7 x 10 plus the 20 perfect bonus)")
    want(s["rev"][5].startswith("From lesson 1: ") and s["rev"][6].startswith("From lesson 2: ") and not any(s["rev"][:5]), "seven: review questions name their earlier lesson")
    want(s["lessons"].get("1") == [1, 1] and s["lessons"].get("2") == [1, 1], "seven: review answers count towards their own lessons")
ub = c.get("sundayBack")
if ub:
    want(ub["title"] == "Practice" and ub["bonus"] == 0 and ub["points"] == 0 and ub["ok"] is False and not ub["note"], "sunday: a wrong call then Back is saved as answered, so a second go earns nothing")
u = c.get("sunday")
if u:
    f = u["first"]
    want(f["title"] == "Sunday scenario" and f["setup"].startswith("It is 5pm"), "sunday: the scenario opens with its situation")
    want(f["bonus"] == 15 and f["points"] == 15 and f["scen"] and f["scen"]["ok"] is True, "sunday: the right call scores 15 points once")
    want(u["card"].startswith("You made the right call") and u["again"]["title"] == "Practice" and u["again"]["bonus"] == 15 and u["again"]["points"] == 15, "sunday: a second go is practice and adds nothing")
v = c.get("scene")
if v:
    want(v["painted"] and abs(v["small"]["w"] - 320) < 1 and v["small"]["h"] < 110, f"scene: drawn full width and compact during questions ({v['small']['w']:.0f} by {v['small']['h']:.0f} at 320 wide)")
    want(v["seated"] == "4" and v["end"] == "last" and v["endH"] > v["small"]["h"] and "4 of 5 tables" in v["label"], "scene: 4 right seats 4 tables, opens out for the ending and picks 'one table left'")
    want(v["cardScene"] and v["doneCard"] == "You seated 4 of 5 tables | last", "scene: the quiz card shows the restaurant before the quiz, and her 4 tables with its ending afterwards")
    want(v["tiers"] == "012334012334", "scene: endings map to full, one left, steady, soft launch and friends and family for 5 and 7 questions")
    want(v["fit"] <= 844, f"scene: question and all four options fit a 320 by 844 screen (lowest option ends at {v['fit']:.0f})")
    fa = v["fitAfter"]
    want(fa["after"] <= 664, f"scene at 390 wide: after answering, the scene, answer, reason and next button fit 664 pixels, a phone with its browser bars showing (ends at {fa['after']:.0f})")
    print(f"      before answering, the lowest option ends at {fa['before']:.0f} of 664 at 390 wide: {'fits' if fa['before'] <= 664 else 'the last option needs a short scroll on the longest question'}")
    if os.environ.get("QUIZ_SHOTS"):
        for name, url in v["shots"].items():
            pathlib.Path(os.environ["QUIZ_SHOTS"], f"scene-{name}.png").write_bytes(base64.b64decode(url.split(",", 1)[1]))
fb = c.get("fallback")
if fb:
    want(fb["score"] == "5/5" and not fb["scene"] and fb["day"]["score"] == 5, "fallback: with a broken scene the quiz still plays and scores as a plain sheet")
lay = c.get("layout")
if lay:
    for w, m in sorted(lay.items()):
        want(m["overflow"] <= 0 and m["minOpt"] >= 44 and m["close"] >= 44 and m["next"] >= 44, f"layout at {w}: no sideways scroll, tap targets 44 or more (options {m['minOpt']:.0f}, back {m['close']:.0f}, next {m['next']:.0f})")
want(all(x in c for x in ("parityOld", "parityNew", "keys", "resume", "seven", "sundayBack", "sunday", "scene", "fallback", "layout")), "every case ran")
print("QUIZ PAGE OK" if not misses else "MISSES: " + str(len(misses)))
sys.exit(1 if misses else 0)
