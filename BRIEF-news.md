# News, new format (replaces the News section of BRIEF.md once switched on)

The news is shown as The Pass Gazette: the first item is the lead story, set large with its photo and key figure, and the rest follow as receipt slips. Put the most important story first.

Each item:

```
{ "area", "headline", "gist", "big": { "value", "label" },
  "read": { "what", "how", "soWhat", "take" },
  "source": { "name", "date", "url" },
  "photo": { "src", "page", "credit", "licence", "alt" },   (optional)
  "drawing": "<svg ...>", "drawingAlt": "..."               (optional) }
```

- `area`: `industry`, `trends`, `finedining` or `openings`, as before. 3 items at most per area; 3 to 10 in all.
- `headline` up to 90 characters. `gist` up to 200: what happened, in one or two sentences with the key number.
- `big`: the story's key figure, `value` up to 10 characters (`£65`, `9 Nov`, `+5.5%`, `EC3`) and `label` up to 30 saying what it is (`a kilo of turbot`).
- `read.what` up to 600: what happened, with the numbers from the source.
- `read.how` up to 600, or `""`: how it works or why it happened, only when there is more to explain.
- `read.soWhat` up to 360: what it means for someone running a floor today or planning her own restaurant.
- `read.take` up to 280: the key insight, one practical thing to do or watch.
- `source`: the article you opened, as before.

## Photos (free licence only)

A real photo makes a story land, but only a free-licence one. Never use the article's own photo: it belongs to the publisher.

1. When you open the article, note what its main photo shows (a chef, a dish, a building, a street).
2. Search for a free-licence photo of the same subject, for example `"Pimlico Road" site:commons.wikimedia.org` or `turbot unsplash`. Prefer the exact place, person or dish; otherwise the closest honest subject (the street, the ingredient, the type of venue). Never pass off a different place or person as the one in the story.
3. Open the photo's own page (the Wikimedia Commons `File:` page, or the `unsplash.com/photos/` page) from your search results and confirm the licence there.
4. Fill in `photo`:
   - `src`: the image file address. For Commons, a `.jpg` on `upload.wikimedia.org` or `thumb.wikimedia.org`, ideally the 960px version (`.../960px-Name.jpg`). For Unsplash, the `images.unsplash.com/photo-...` address with `?w=960&q=70&fm=jpg`.
   - `page`: the photo's own page address.
   - `credit`: the author as the page gives it, then `, Wikimedia Commons` or `, Unsplash`. Up to 80 characters.
   - `licence`: exactly one of `CC0`, `Public domain`, `CC BY 2.0`, `CC BY 2.5`, `CC BY 3.0`, `CC BY 4.0`, `CC BY-SA 2.0`, `CC BY-SA 2.5`, `CC BY-SA 3.0`, `CC BY-SA 4.0`, `Unsplash Licence`.
   - `alt`: what the photo shows, up to 200.
5. If you cannot confirm a free licence, leave `photo` out. A story without a photo is fine; a wrong licence is not.

You cannot download images in this session and must not try. The publishing step fetches each photo, checks it and serves it from the site.

## Drawings

Add a `drawing` when a number or comparison is the point of the story: a price that jumped, a rise against a fall, a date to remember, a map of where something opens. Same rules as lesson diagrams in BRIEF.md (inline SVG, viewBox width 280 to 360, font-size 11 or more, at least 3 labels and 3 shapes, bright background, area colour). Every number in the drawing must match the story. `drawingAlt` up to 200 says what it shows. Skip the drawing when the photo already says it.
