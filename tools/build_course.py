"""Build course.json from the approved course (v3). Usage: python3 tools/build_course.py SRC.md"""
import json, re, sys, datetime
src = open(sys.argv[1], encoding="utf-8").read().split("\n")
AREAS = {"Kitchen": "kitchen", "Drinks": "drinks", "Money": "money", "Opening": "opening", "Brand": "brand", "Guests": "guests"}
lessons, phase, phases, day = [], None, [], None
L = re.compile(r"^(\d+)\. \[([^·\]]+?) · ([^\]]+)\] (.+)$")
for line in src:
    if line.startswith("## How the course was validated"):
        break
    m = re.match(r"^## Phase (\d): (.+)$", line)
    if m:
        phase = int(m.group(1)); phases.append({"n": phase, "name": m.group(2).strip()}); continue
    m = re.match(r"^### Day (\d+)$", line)
    if m:
        day = int(m.group(1)); continue
    m = L.match(line)
    if m and phase:
        parts = [p.strip() for p in m.group(4).split(" | ")]
        title = parts[0]
        rest = {"outcome": "", "visual": "", "source": ""}
        for p in parts[1:]:
            if p.startswith("Visual:"): rest["visual"] = p[7:].strip()
            elif p.startswith("Source:"): rest["source"] = p[7:].strip()
            elif p.startswith("You will be able to"): rest["outcome"] = p
            else: raise SystemExit("unknown part: " + line)
        lessons.append({"n": int(m.group(1)), "day": day, "phase": phase, "area": AREAS[m.group(2).strip()],
                        "module": m.group(3).strip(), "title": title, **rest})
start = datetime.date(2026, 11, 8)
days = sorted({l["day"] for l in lessons})
for p in phases:
    ds = [l["day"] for l in lessons if l["phase"] == p["n"]]; p["days"] = [min(ds), max(ds)]
out = {"start": start.isoformat(), "areas": {"kitchen": "Kitchen", "drinks": "Drinks", "money": "Money", "opening": "Opening and legal", "brand": "Brand", "guests": "Guests and growth"},
       "phases": phases, "lessons": lessons}
json.dump(out, open("course.json", "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print(len(lessons), "lessons,", len(days), "days,", len(phases), "phases")
