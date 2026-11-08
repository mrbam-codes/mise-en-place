# How to write Mise en Place

Each edition is one JSON file at `briefs/YYYY-MM-DD.json`. The page design is fixed in `index.html`, `app.js` and `heroes.js`. Do not edit any file except today's edition.

The reader is an EHL-trained front-of-house area manager working towards opening her own restaurant. She wants expert lessons, not basics: useful at work tomorrow and a step towards her own place. About 3 minutes per lesson. Plain English, UK spelling, short sentences, no em dashes. Use symbols for quantities: £12.71, 33%, 63°C.

The page is public. Never name or hint at where she works, who she works for, or any business she is helping to launch. `check.py` blocks a private list of names; if it flags a word, remove it and rephrase. Never write anything about her or about Adam.

## Today's lessons come from the course, never from you

`python3 recent.py YYYY-MM-DD` prints today's course day and its lessons from `course.json` (day 1 is 8 November 2026, the course ends on day 221). Teach exactly those lessons, in that order. Copy `n`, `area`, `module`, `title` and `outcome` exactly. Most days have 3 lessons; days 218 and 221 have 2.

## Fields

- `date`: `YYYY-MM-DD`
- `dayLabel`: `Monday 9 November 2026`
- `day`: course day number. `phase`: the lessons' phase, 1 to 5.
- `welcome`: one line, up to 160 characters, naming what today teaches.
- `lessons`: see below.
- `news`: 3 to 10 items, see below. `newsNote` (optional, up to 200): say so when a news area was thin.
- `try`: `{ "title", "steps": [2 to 4], "why" }`. One concrete action she can do on her next shift, built from today's lessons. Title up to 80, each step up to 180, why up to 260.
- `quiz`: exactly 5 questions, see below.
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
- Bright and calm, on a transparent or ivory background (`#fffdf8`), never dark. No line textures or hatching. Ink `#2b2417`, muted `#857353`, gold `#b48a3c`, pale gold `#e4cf9c`. Area colours: Kitchen `#c4562a`, Drinks `#b48a3c`, Money `#5e8f3a`, Opening and legal `#4f6d8f`, Brand `#a3456b`, Guests `#7a5aa8`; soft tints of them for fills.
- Lay out for a phone: the drawing is shown edge to edge, about 390 pixels wide, and the card shows a full-size close-up of its middle, so put the most important labels near the centre. Keep labels short, inside the viewBox, and never overlapping. Wrap long labels with `tspan`. Numbers in the diagram must match the text.
- Kinds that work: wheel, timeline, flow with arrows, waterfall or bar chart, comparison grid, floor plan, cross-section, org chart, matrix, ladder.

## News

`{ "area", "headline", "summary", "why", "source": { "name", "date", "url" } }`

- `area`: `industry` (UK hospitality business, law, costs, people), `trends` (food and drink trends), `finedining` (fine dining and chefs) or `openings` (London openings). 3 at most per area. Aim for one or two in each.
- Headline up to 90, summary up to 260 with the numbers from the source, `why` up to 220 (shown as "For you": what it means for someone running a floor or planning her own restaurant). Source date short, like `8 Nov`. The exact article address.
- Prefer the last 7 days. Never pad: fewer real items beat thin ones. No social media or X.

## Quiz

`{ "q", "options": [4], "answer", "why", "from" }`

- Exactly 5. At least one on each lesson; `from` is the lesson's position in today's edition (1, 2 or 3, not its course number `n`), or `"news"`. Question up to 180, options up to 100, `why` up to 280.
- `answer` is 0 to 3: vary its position. Wrong options must be plausible. Test understanding and application, not trivia. Every answer must be supported by today's lesson text.

## Order of work

1. `python3 recent.py YYYY-MM-DD`.
2. For each lesson, search for good sources (official ones first where named), open them, and note the facts and figures you will use.
3. Search the four news areas and open each article to confirm its date and figures.
4. Write the edition, drawing each diagram from its course `visual`.
5. Run `python3 check.py YYYY-MM-DD` and fix every problem until it prints PASSED.
