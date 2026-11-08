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
n = (datetime.date.fromisoformat(day) - datetime.date.fromisoformat(course["start"])).days + 1
todays = [l for l in course["lessons"] if l["day"] == n]
print("TODAY " + day + " is course day " + str(n) + " of 221" + (", phase " + str(todays[0]["phase"]) if todays else ": NOT IN THE COURSE, write nothing"))
for i, l in enumerate(todays):
    print("Lesson " + str(i + 1) + ": n=" + str(l["n"]) + " | area=" + l["area"] + " | module=" + l["module"] + " | title=" + l["title"])
    print("  outcome: " + l["outcome"])
    print("  visual: " + l["visual"])
    print("  official source to cite: " + (l["source"] or "none named"))
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
print("\nGlossary terms already used (do not repeat): " + ", ".join(sorted(t for t in terms if t)))
