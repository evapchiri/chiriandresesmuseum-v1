# Chiriandreses Museum

## What this project is about

Chiriandreses Museum is a curated portal to view and learn about ten 3D-digitised objects from my
parents' living-room vitrine. Each object gets its own page pairing a Sketchfab embed with its
story and an honest digitisation trail: what was measured directly from the
capture, what I judged by eye, and where. The site is built to an actual
VIGIE 2020/654 study-aligned methodology rather than assembled as a portfolio of nice
renders, so the point is that the process behind the models can be trusted
and reused, not just that they look good: every object's page states
plainly which of its dimensions, materials and surface properties came
straight out of the capture, and which were judged by eye and disclosed as
such.

Static site: plain HTML/CSS/JS, no framework, no client-side dependencies. A
small Node build script turns `data/objects.json` plus four HTML templates
into finished static pages in `/docs`, which GitHub Pages serves directly.

## Site structure

Every page shares a persistent nav (About ⇄ Collection, plus the site title
linking back to the landing page).

- **`index.html`** — Landing page. Hero, a short project blurb, and two
  buttons ("About the project" / "The Collection") with a cursor-following
  tooltip on hover (desktop only — skipped on touch devices).
- **`about.html`** — The behind-the-scenes page. A sticky left-hand nav
  swaps content panels in place: What is Chiriandreses Museum?, About me,
  then **The project** (Project lifecycle, Stage-by-stage, Project archive)
  and **My journey** (Lab journal, Lessons learned). No page scroll, just a
  tab switch.
- **`collection.html`** — A horizontal bar of five dropdown filters
  (Acquisition Year, Country, Continent, ID, Object Name) and the grid of
  object cards. Filtering is client-side vanilla JS — no page reload.
  Clicking a card opens that object's full record in a scrollable modal,
  sharing the same data the standalone object pages are built from; the
  modal is deep-linkable (`collection.html#chan-001`) and degrades to a
  normal link if JS is off.
- **`objects/*.html`** — One page per object: Sketchfab embed plus the
  "Field Record" provenance docket. Real, shareable, crawlable URLs — not
  just an artefact of the modal.

## Why this shape

- **No React, no build framework.** Templating is one ~100-line script with
  zero dependencies — nothing to learn, nothing to fall out of date.
- **No self-hosted 3D files.** Each object embeds its existing Sketchfab
  model. That sidesteps GitHub's file-size limits entirely and keeps the
  repo small and fast to clone.
- **Static output, not client-side fetch.** The build script writes real
  `.html` files per object rather than one page that fetches JSON at
  runtime — faster first paint, works over `file://` locally, and each
  object gets its own shareable, crawlable URL.
- **Data and presentation are separate.** All object content lives in
  `data/objects.json`. Editing an object, or adding an eleventh, never
  touches HTML or CSS.

## Data structure & validation

`data/objects.json` is the single source of truth for every object. Each
entry holds the curated fields the site actually renders (title, materials,
measurements, story text, a `provenance` array), a
`locationId`/`periodId`/`campaignId` reference into three lookup tables, and
a nested `fullRecord` block for everything else the digitisation record
captured — equipment, acquisition geometry, derived-asset stats, processing
notes — which only ever surfaces in the object page's "Full record"
expandable panel, not the main view or the Collection modal. That split is
deliberate: the primary record stays readable at a glance, while nothing
from the original paradata gets thrown away to keep it that way.

`locations.json`, `periods.json` and `campaigns.json` are kept deliberately
lean. `locations.json`, for instance, is just `{ id, country, continent }` —
no city or site detail — because those two fields are all the Collection
page's filters actually need; anything more specific about where an object
came from lives in its own story text if it's worth keeping. The lookups
exist to avoid repeating the same country/continent/period string across
every object that shares one, not to model geography or chronology in full.

The `provenance` array is the part that does the most work: every entry is
a `{ property, status, note }` triple, and `status` is always one of
`measured` (read directly off the capture), `estimated` (judged by eye and
disclosed as such), `n/a`, or `flagged` (a known limitation worth surfacing
plainly). This isn't limited to material properties — it's used for any
field, physical or otherwise, that wasn't directly measured, so a dimension
calculated from a photo-scale reference reads the same honest way as an
eyeballed roughness value. Nothing here gets softened into a `measured`
claim it hasn't earned.

`scripts/validate-data.js` checks all of this at build time, using
[`ajv`](https://ajv.js.org/) — the one dependency in the project, used
purely for schema validation and never shipped to the browser. It confirms
every object has the fields the templates expect, that `provenance.status`
only ever takes one of the four values above, that ids follow the
`CHAN-###` pattern with no duplicates, and that every `locationId` /
`periodId` / `campaignId` actually resolves in its lookup file. `build.js`
runs this automatically and aborts the whole build on any failure, so a
typo in the data can't quietly ship as a broken or misleading page. Run it
on its own with `npm run validate`.

## One-time setup

You need Node.js installed (any reasonably recent version — no other
dependencies required).

```bash
git clone <this-repo-url>
cd chiriandreses-v1
npm run build
```

That generates `/docs`. Open `docs/index.html` directly in a browser to
check it, or serve it properly (recommended — the browser's `file://`
security model can be fussy with some setups):

```bash
npx serve docs
# or: python3 -m http.server 8080 --directory docs
```

## About the author

Eva Perez Chirinos — Digital Cultural Heritage, Photogrammetry, 3D and
Digital Asset Management. [LinkedIn](https://www.linkedin.com/in/eva-perez-chirinos) ·
[GitHub](https://github.com/evapchiri). The site's own About Me panel has
the longer version.

## License

[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) — see
[`LICENSE`](LICENSE).
