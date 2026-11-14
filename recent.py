"""Print today's lessons from course.json, then the last 3 editions'' news headlines, glossary terms and toolkit names,
so a run can avoid repeating them.

Usage: python3 recent.py YYYY-MM-DD
Prints names only, never links: addresses taken from a file make a routine's
WebFetch stall for 5 minutes waiting for approval.
"""
import json, os, sys

import datetime
day = sys.argv[1]
here = os.path.dirname(os.path.abspath(__file__))
course = json.load(open(os.path.join(here, "course.json"), encoding="utf-8"))
reps = course.get("repeats", {})   # a repeat date re-teaches an earlier day; later dates move back one
n = reps.get(day) or (datetime.date.fromisoformat(day) - datetime.date.fromisoformat(course["start"])).days + 1 - sum(r < day for r in reps)
todays = [l for l in course["lessons"] if l["day"] == n]
print("TODAY " + day + " is course day " + str(n) + " of 221" + (" (a repeat: she missed this day, so teach it afresh)" if day in reps else "") + (", phase " + str(todays[0]["phase"]) if todays else ": NOT IN THE COURSE, write nothing"))
for i, l in enumerate(todays):
    print("Lesson " + str(i + 1) + ": n=" + str(l["n"]) + " | area=" + l["area"] + " | module=" + l["module"] + " | title=" + l["title"])
    print("  outcome: " + l["outcome"])
    print("  visual: " + l["visual"])
    print("  official source to cite: " + (l["source"] or "none named"))
REVIEW_FROM = "2026-11-16"   # must match check.py; tests/test_quiz_rules.py checks it
print()
dates = json.load(open(os.path.join(here, "briefs", "index.json")))
earlier = sorted(d for d in dates if d < day)
if not earlier:
    print("No earlier editions.")
terms = set()
for d in earlier:
    try:
        b = json.load(open(os.path.join(here, "briefs", d + ".json"), encoding="utf-8"))
    except (OSError, ValueError):
        continue
    terms |= {t.get("term", "") for t in b.get("terms", [])}
    if d in earlier[-3:]:
        print(d + " (day " + str(b.get("day")) + "):")
        for s in b.get("news", []):
            print("- news [" + s.get("area", "") + "] " + s.get("headline", "") + " (" + (s.get("source") or {}).get("name", "") + ")")
        for t in b.get("toolkit", []):
            print("- tool: " + t.get("name", ""))
        print("- try: " + (b.get("try") or {}).get("title", ""))
if day >= REVIEW_FROM:
    # Two earlier lessons for the review questions: one from 2 course days ago, one from 7 (or the nearest earlier day).
    by_day = {}
    for d in earlier:
        try:
            e = json.load(open(os.path.join(here, "briefs", d + ".json"), encoding="utf-8"))
        except (OSError, ValueError):
            continue
        by_day[e.get("day")] = e   # a repeat keeps the latest teaching of that day
    picks = []
    order = [n - 2, n - 7, n - 1] + list(range(n - 3, 0, -1))   # then any earlier day, nearest first
    order = [d for i, d in enumerate(order) if d >= 1 and d not in order[:i] and by_day.get(d)]
    for d in order:
        ls = by_day[d].get("lessons") or []
        if ls and len(picks) < 2:
            picks.append(ls[(n + len(picks)) % len(ls)])
    for d in order:   # only one earlier edition: take a second lesson from it
        for l in by_day[d].get("lessons") or []:
            if len(picks) < 2 and all(l.get("n") != p.get("n") for p in picks):
                picks.append(l)
    print("\nREVIEW QUESTIONS: after the 5 questions on today, write one question on each of these earlier lessons (from \"review\").")
    print("Use only the lesson text printed here. Copy n, title and area exactly.")
    for l in picks:
        print("- n=" + str(l.get("n")) + " | area=" + str(l.get("area")) + " | title=" + str(l.get("title")))
        print("  takeaway: " + str(l.get("takeaway")))
        for p in l.get("points") or []:
            print("  " + str(p.get("h")) + ": " + str(p.get("p")))
    if not picks:
        print("- none available: no earlier edition was found")
    if datetime.date.fromisoformat(day).weekday() == 6:
        print("\nSUNDAY SCENARIO: write the scenario field. It may draw on these lessons from the last 7 course days:")
        for l in course["lessons"]:
            if n - 7 < l["day"] <= n:
                print("- n=" + str(l["n"]) + " | day " + str(l["day"]) + " | " + l["title"])
print("\nGlossary terms already used (do not repeat): " + ", ".join(sorted(t for t in terms if t)))
