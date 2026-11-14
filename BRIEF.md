# How to write Mise en Place

Each edition is one JSON file at `briefs/YYYY-MM-DD.json`. The page design is fixed in `index.html`, `app.js` and `heroes.js`. Do not edit any file except today's edition.

The reader is an EHL-trained front-of-house area manager working towards opening her own restaurant. She wants expert lessons, not basics: useful at work tomorrow and a step towards her own place. About 3 minutes per lesson. Plain English, UK spelling, short sentences, no em dashes. Use symbols for quantities: £12.71, 33%, 63°C.

The page is public. Never name or hint at where she works, who she works for, or any business she is helping to launch. `check.py` blocks a private list of names; if it flags a word, remove it and rephrase. Never write anything about her or about Adam.

## Today's lessons come from the course, never from you

`python3 recent.py YYYY-MM-DD` prints today's course day and its lessons from `course.json` (day 1 is 8 November 2026, the course ends on day 221 on 17 June 2027; a date listed under `repeats` in `course.json` re-teaches an earlier day she missed, and recent.py already allows for it). Teach exactly those lessons, in that order. Copy `n`, `area`, `module`, `title` and `outcome` exactly. Most days have 3 lessons; days 218 and 221 have 2.

## Fields

- `date`: `YYYY-MM-DD`
- `dayLabel`: `Monday 9 November 2026`
- `day`: course day number. `phase`: the lessons' phase, 1 to 5.
- `welcome`: one line, up to 160 characters, naming what today teaches.
- `lessons`: see below.
- `news`: 3 to 10 items, see below. `newsNote` (optional, up to 200): say so when a news area was thin.
- `try`: `{ "title", "steps": [2 to 4], "why" }`. One concrete action she can do on her next shift, built from today's lessons. Title up to 80, each step up to 180, why up to 260.
- `quiz`: 5 questions on today, then 2 review questions on earlier lessons (from 16 November 2026), see below.
- `scenario`: Sunday editions only, from 16 November 2026, see below.
- `terms`: 3 to 9 glossary terms from today's lessons, `{ "term", "def", "lesson" }`, term up to 40, definition up to 240 in plain English, `lesson` 1 to 3. Do not repeat a term `recent.py` lists as already used.
- `toolkit`: 1 to 3 tools she can reuse, `{ "name", "kind", "items": [2 to 8], "lesson" }`. `kind` is `checklist`, `formula`, `framework`, `script` or `template`. Name up to 60, items up to 180.

No HTML or angle brackets anywhere except inside `svg`.

## A lesson

`{ "n", "area", "module", "title", "outcome", "svg", "alt", "intro", "points", "atWork", "takeaway", "sources", "checked" }`

- The lesson is built around its diagram. Draw the course's `visual` description as the `svg`, then write text that explains the picture.
- `intro` up to 600 characters: why this matters, starting from something she will recognise.
- `points`: 2 to 4 `{ "h", "p" }`, heading up to 60, text up to 650. Expert content: real numbers, real practice, the trade-offs.
- `atWork` up to 360: how to use it at work this week.
- `takeaway` up to 220: the one line to remember.
- In all, intro, points, atWork and takeaway come to 220 to 600 words.
- `alt` up to 240: what the diagram shows, for screen readers and as its caption.
- `sources`: 1 to 4 `{ "name", "url" }`, pages you opened today. When the course names an official source (Food Standards Agency, HSE, GOV.UK, HMRC, Acas, ICO, Home Office, section 182 guidance, an Act), cite its current page on gov.uk, legislation.gov.uk, food.gov.uk, hse.gov.uk, acas.org.uk, ico.org.uk or asa.org.uk.
- `checked` (up to 240): required when an Opening and legal lesson, or one with an official source, quotes a £ figure. Say what you re-checked, where and today's date, for example "National Living Wage £12.71 checked on GOV.UK, 9 November 2026". Wage rates, duty, VAT, business rates, licence fees and law dates change: never copy them from the course list or memory.
- A law not yet in force is written as expected, with its expected date, never as current.

## The diagram (`svg`)

One inline `<svg>` element, drawn fresh. The checker refuses anything else.

- `xmlns="http://www.w3.org/2000/svg"`, `viewBox="0 0 W H"` with W 280 to 360 (use 340) and H 80 to 520, `role="img"` and an `aria-label`.
- Allowed elements: svg, g, rect, circle, ellipse, line, polyline, polygon, path, text, tspan, title, desc, defs, linearGradient, radialGradient, stop, marker, clipPath. No images, links, scripts, style elements, `use` or `foreignObject`. No `href`, no web addresses, `url(#id)` only.
- At least 3 text labels and 3 shapes. Every `font-size` 11 or more (11 to 13 for labels, 15 to 17 for titles). Bigger type means fewer, shorter labels: wrap with `tspan` or give the drawing more height rather than shrinking text. Font: `font-family="Figtree, sans-serif"`.
- Bright and calm, on a transparent or ivory background (`#fffdf8`), never dark. No line textures or hatching. Use only the colours in **Colours** below; the checker refuses any other strong colour.
- Lay out for a phone: the drawing is shown edge to edge, about 390 pixels wide, and the card shows a full-size close-up of its middle, so put the most important labels near the centre. Keep labels short, inside the viewBox, and never overlapping. Wrap long labels with `tspan`. Numbers in the diagram must match the text.
- Kinds that work: wheel, timeline, flow with arrows, waterfall or bar chart, comparison grid, floor plan, cross-section, org chart, matrix, ladder.

## Colours

Each area owns a family: **main** for shapes, strips and the one thing to look at; **tint** for fills and boxes; **deep** for text and fine lines.

| Area | Main | Tint | Deep |
|---|---|---|---|
| Kitchen | `#ea5f36` | `#fce9e3` | `#ac4627` |
| Drinks | `#865d00` | `#eee8db` | `#865d00` |
| Money | `#009b37` | `#dbf1e3` | `#00792b` |
| Opening and legal | `#258fec` | `#e0effc` | `#1b68ad` |
| Brand | `#b31e65` | `#f4dfe9` | `#b31e65` |
| Guests | `#7647cd` | `#ece5f8` | `#7647cd` |

Frame and neutrals: ink `#2b2417`, muted `#857353`, gold `#b48a3c`, pale gold `#e4cf9c`, ivory `#fffdf8`, white. Soft greys and browns are allowed for lines and labels.

Rules:
1. A lesson diagram uses its own area's family. Use a second family only to compare two things (before and after, us and them).
2. One star per diagram: the single most important element is solid main; everything else is tint, outline or neutral.
3. Text is ink, muted or a deep shade, never a main or tint colour (main colours are too light for small text). White text only on a deep shade or on Drinks, Brand or Guests main.
4. Never colour alone: every coloured mark has a label, number or symbol next to it. Never ask the reader to tell red from green; for up and down or good and bad, use ▲ ▼ ✓ ✗ with ink or the area's deep shade.
5. News drawings borrow a family: UK industry uses Opening and legal, food and drink trends uses Drinks, fine dining and chefs uses Kitchen, London openings uses Brand.

## News

`{ "area", "headline", "summary", "why", "source": { "name", "date", "url" } }`

- `area`: `industry` (UK hospitality business, law, costs, people), `trends` (food and drink trends), `finedining` (fine dining and chefs) or `openings` (London openings). 3 at most per area. Aim for one or two in each.
- Headline up to 90, summary up to 260 with the numbers from the source, `why` up to 220 (shown as "For you": what it means for someone running a floor or planning her own restaurant). Source date short, like `8 Nov`. The exact article address.
- Prefer the last 7 days. Never pad: fewer real items beat thin ones. No social media or X.

## Quiz

`{ "q", "options": [4], "answer", "why", "from" }`

- Exactly 5. At least one on each lesson; `from` is the lesson's position in today's edition (1, 2 or 3, not its course number `n`), or `"news"`. Question up to 180, options up to 100, `why` up to 280.
- `answer` is 0 to 3: vary its position. Wrong options must be plausible. Test understanding and application, not trivia. Every answer must be supported by today's lesson text.
- Keep the 4 options of a question about the same length, so length gives nothing away. The right answer may be the longest option in at most 2 of the day's questions. If it is, shorten it or write a fuller wrong option.

### Review questions (editions dated 16 November 2026 or later)

`{ "q", "options": [4], "answer", "why", "from": "review", "n", "title", "area" }`

- After the 5 questions on today, add exactly 2 review questions, one on each of the two earlier lessons that `recent.py` prints under REVIEW QUESTIONS. They come last, so the quiz has 7 questions.
- `from` is `"review"`. Copy `n` (the lesson's course number), `title` and `area` exactly as printed.
- Write each from the lesson text `recent.py` prints, and nothing else. Do not reuse that lesson's original quiz wording: ask the same idea from a new angle, ideally as a situation at work.
- The same length limits and option rules apply.

## Sunday scenario (Sunday editions dated 16 November 2026 or later)

`"scenario": { "title", "setup", "q", "options": [4], "answer", "why", "lessons": [1 to 3] }`

- One realistic situation on a restaurant floor or in planning her own place, where the right call needs this week's lessons used together. It tests judgement, not recall.
- `title` up to 80. `setup` up to 500: the situation, with the numbers she needs. `q` up to 180: what should she do. Options up to 140 each, all sensible things a manager might do, about the same length. `why` up to 400: why the best option wins and what is wrong with the most tempting other one.
- `lessons`: the course numbers `n` of the 1 to 3 lessons it draws on, from the list `recent.py` prints under SUNDAY SCENARIO.
- Never put a scenario in an edition on any other day.

## Order of work

1. `python3 recent.py YYYY-MM-DD`.
2. For each lesson, search for good sources (official ones first where named), open them, and note the facts and figures you will use.
3. Search the four news areas and open each article to confirm its date and figures.
4. Write the edition, drawing each diagram from its course `visual`.
5. Run `python3 check.py YYYY-MM-DD` and fix every problem until it prints PASSED.
