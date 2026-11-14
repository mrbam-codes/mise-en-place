"""Checker rules for review questions and the Sunday scenario. Run from the repository: python3 tests/test_quiz_rules.py

Copies the site to a temporary folder with the published editions from
origin/briefs, moves the REVIEW_FROM date in that copy only, then feeds check.py
good and broken editions and reads what it says. The privacy guard needs a secret
salt that is not on this Mac, so its line is expected and ignored, and the Chrome
render step does not run here; GitHub runs the full check.
Prints QUIZ RULES OK or the misses.
"""
import copy, datetime, json, pathlib, re, shutil, subprocess, sys, tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
GATE = 'REVIEW_FROM = "2026-11-16"'


def git(*a):
    return subprocess.run(["git", "-C", str(ROOT), *a], capture_output=True, text=True, check=True).stdout


dates = sorted(p[7:17] for p in git("ls-tree", "--name-only", "origin/briefs", "briefs/").split() if p[7:11].isdigit())
course = json.loads((ROOT / "course.json").read_text(encoding="utf-8"))
weekday = next(d for d in reversed(dates) if datetime.date.fromisoformat(d).weekday() != 6)
sundays = [d for d in dates if datetime.date.fromisoformat(d).weekday() == 6]
load = lambda d: json.loads(git("show", f"origin/briefs:briefs/{d}.json"))


def site(t, date, b, gate_on):
    for f in ROOT.iterdir():
        if f.name not in {".git", "briefs", "tests", ".github", ".claude", "__pycache__"}:
            (shutil.copytree if f.is_dir() else shutil.copy)(f, t / f.name)
    (t / "briefs").mkdir()
    for d in dates:
        if d < date:
            (t / "briefs" / f"{d}.json").write_text(git("show", f"origin/briefs:briefs/{d}.json"), encoding="utf-8")
    (t / "briefs" / "index.json").write_text(json.dumps([d for d in dates if d < date]))
    (t / "briefs" / f"{date}.json").write_text(json.dumps(b, ensure_ascii=False), encoding="utf-8")
    if gate_on:
        for name in ("check.py", "recent.py"):
            s = (t / name).read_text(encoding="utf-8")
            assert s.count(GATE) == 1, f"{GATE} not found once in {name}"
            (t / name).write_text(s.replace(GATE, f'REVIEW_FROM = "{date}"'), encoding="utf-8")


def run(date, b, gate_on, script="check.py"):
    with tempfile.TemporaryDirectory() as t:
        t = pathlib.Path(t); site(t, date, b, gate_on)
        r = subprocess.run([sys.executable, "-I", str(t / script), date], capture_output=True, text=True, timeout=240)
        return r.stdout + r.stderr


def quiz_lines(out):
    return [l[2:] for l in out.splitlines() if l.startswith("- ") and re.match(r"- (quiz|scenario)", l)]


def rq(n, answer=1, **over):
    l = next(x for x in course["lessons"] if x["n"] == n)
    q = {"q": f"A new angle on lesson {n}: which choice fits best?", "options": ["The first sensible choice", "The second sensible choice", "The third sensible choice", "The fourth sensible one"],
         "answer": answer, "why": "The earlier lesson explains why this choice fits.", "from": "review", "n": n, "title": l["title"], "area": l["area"]}
    q.update(over); return q


SCEN = {"title": "A full book and a late delivery", "setup": "It is 5pm on Saturday. The fish delivery is 40 minutes late and 3 tables have pre-ordered it.",
        "q": "What do you do first?", "options": ["Call the three tables now", "Wait and see if it turns up", "Take the dish off quietly", "Ask the kitchen to hurry up"],
        "answer": 0, "why": "Guests forgive what they are told early.", "lessons": [1]}
misses = []


def case(name, date, base, change, gate_on, expect):
    b = copy.deepcopy(base); change(b)
    got = quiz_lines(run(date, b, gate_on))
    hit = any(expect in l for l in got) if expect else not got
    print(("ok    " if hit else "MISS  ") + name + ("" if hit else " | checker said: " + (" / ".join(got) or "nothing about the quiz")))
    if not hit:
        misses.append(name)


wk = load(weekday); today_n = wk["lessons"][0]["n"]
add = lambda *qs: (lambda b: b["quiz"].extend(qs))
case("before the date, a real 5-question edition is unchanged", weekday, wk, lambda b: None, False, None)
case("before the date, review questions are refused", weekday, wk, add(rq(1), rq(4, 2)), False, "exactly 5 questions")
case("from the date, 5 questions alone are refused", weekday, wk, lambda b: None, True, "exactly 2 review questions")
case("from the date, 5 plus 2 good review questions pass", weekday, wk, add(rq(1), rq(4, 2)), True, None)
case("a review question with the wrong lesson title", weekday, wk, add(rq(1, title="Something else"), rq(4, 2)), True, "exact course title")
case("a review question with the wrong area", weekday, wk, add(rq(1, area="money"), rq(4, 2)), True, "area must be")
case("a review question on one of today's lessons", weekday, wk, add(rq(today_n), rq(4, 2)), True, "taught before day")
case("two review questions on the same lesson", weekday, wk, add(rq(1), rq(1, 2)), True, "different lessons")
case("a review question placed before today's questions", weekday, wk, lambda b: b["quiz"].insert(0, rq(1)) or b["quiz"].append(rq(4, 2)), True, "come last")
case("a scenario on a weekday", weekday, wk, lambda b: (b["quiz"].extend([rq(1), rq(4, 2)]), b.update(scenario=SCEN)), True, "only in a Sunday edition")
if sundays:
    sd = sundays[-1]; sb = load(sd); week = [l["n"] for l in course["lessons"] if l["day"] == sb["day"]]
    earlier = [l["n"] for l in course["lessons"] if l["day"] < sb["day"]][:2]
    revs = lambda b: b["quiz"].extend(rq(n, i) for i, n in enumerate(earlier))
    case("a Sunday with no scenario", sd, sb, revs, True, "a Sunday edition needs")
    case("a Sunday with a good scenario", sd, sb, lambda b: (revs(b), b.update(scenario=dict(SCEN, lessons=week[:1]))), True, None)
    case("a scenario built on a lesson outside the week", sd, sb, lambda b: (revs(b), b.update(scenario=dict(SCEN, lessons=[600]))), True, "lessons must list")
    case("a scenario with 3 options", sd, sb, lambda b: (revs(b), b.update(scenario=dict(SCEN, lessons=week[:1], options=SCEN["options"][:3]))), True, "exactly 4 options")
else:
    print("MISS  no Sunday edition on origin/briefs to test the scenario with"); misses.append("sunday")

same = all((ROOT / n).read_text(encoding="utf-8").count(GATE) == 1 for n in ("check.py", "recent.py"))
print(("ok    " if same else "MISS  ") + "check.py and recent.py carry the same start date"); same or misses.append("gate")
out = run(weekday, wk, True, "recent.py")
picks = re.findall(r"^- n=(\d+) \| area=\w+ \| title=", out.split("REVIEW QUESTIONS", 1)[-1], re.M) if "REVIEW QUESTIONS" in out else []
ok = len(picks) == 2 and len(set(picks)) == 2 and all(int(p) < today_n for p in picks) and "takeaway: " in out
print(("ok    " if ok else "MISS  ") + "recent.py names 2 different earlier lessons with their text (" + ", ".join(picks) + ")"); ok or misses.append("recent")
out = run(weekday, wk, False, "recent.py")
ok = "REVIEW QUESTIONS" not in out
print(("ok    " if ok else "MISS  ") + "recent.py says nothing about review before the date"); ok or misses.append("recent-off")
print("QUIZ RULES OK" if not misses else "MISSES: " + ", ".join(misses))
sys.exit(1 if misses else 0)
