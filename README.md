# Chiriandreses Museum

A personal case study in 3D-digitising family heirlooms and travel souvenirs —
ten objects captured, processed, and published to a genuinely thought-through,
Europeana-aligned methodology, with an honest paper trail for every object:
what was measured directly from the capture, what was estimated by eye, and
where. The point is the process behind the models being trustworthy and
reusable, not just the renders themselves.

Full methodology & paradata write-up: [`reference/methodology-paradata.md`](reference/methodology-paradata.md).

Static site: plain HTML/CSS/JS, no framework, no client-side dependencies. A
small Node build script turns `data/objects.json` + four HTML templates into
finished static pages in `/docs`, which GitHub Pages serves directly.

## Site structure

Every page shares a persistent nav (About ⇄ Collection, plus the site title
linking back to the landing page).

- **`index.html`** — Landing page. Hero, a short project blurb, and two buttons
  ("About the project" / "The Collection") with a cursor-following tooltip on
  hover (desktop only — gracefully skipped on touch devices).
- **`about.html`** — The BTS/process page. A sticky left-hand nav swaps
  content panels in place (About Me / About the project / Lab notes / Lessons
  learned / Documentation) — no page scroll or navigation, just a tab switch.
- **`collection.html`** — A horizontal bar of five dropdown filters
  (Acquisition Year, Country, Continent, ID, Object Name) and the grid of
  object cards. Filtering is client-side vanilla JS — no page reload. Clicking
  a card opens that object's full record in a scrollable modal, sharing the
  same data the standalone object pages are built from; the modal is
  deep-linkable (`collection.html#chan-001`) and degrades to a normal link if
  JS is off.
- **`objects/*.html`** — One page per object: Sketchfab embed + the "Field
  Record" provenance docket. Real, shareable, crawlable URLs — not just an
  artifact of the modal.

## Why this shape

- **No React, no build framework.** Templating is one ~100-line script with
  zero dependencies — nothing to learn, nothing to fall out of date.
- **No self-hosted 3D files.** Each object embeds its existing Sketchfab
  model. This sidesteps GitHub's file-size limits entirely and means the repo
  stays small and fast to clone.
- **Static output, not client-side fetch.** The build script writes real
  `.html` files per object rather than one page that fetches JSON at
  runtime — faster first paint, works with `file://` locally, and each object
  gets its own shareable, crawlable URL.
- **Data and presentation are separate.** All object content lives in
  `data/objects.json`. Editing an object, or adding a 10th, never touches
  HTML or CSS.

## One-time setup

You need Node.js installed (any reasonably recent version — no other
dependencies are required).

```bash
git clone <this-repo-url>
cd chiriandreses-v1
npm run build
```

That generates `/docs`. Open `docs/index.html` directly in a browser to
check it, or serve it properly (recommended, since the browser's file://
security model can be fussy with some setups):

```bash
npx serve docs
# or: python3 -m http.server 8080 --directory docs
```

## Filling in the Documentation links

The About page's Documentation panel lists source documents (methodology
doc, spreadsheets, Metashape reports, planning table), some still pointing at
`REPLACE_WITH_LINK` in `templates/partials/documentation.html`. Update
the `href` values there once each document has a home, then re-run
`npm run build`.

## Editing content

- **Object data, story text, provenance flags** → `data/objects.json`
- **Locations, periods, digitisation campaigns (lookup tables)** → `data/locations.json`, `data/periods.json`, `data/campaigns.json`
- **Page structure / layout** → `templates/index.html`, `templates/object.html`
- **Look and feel** → `assets/styles.css`

Run `npm run build` locally to preview your change before pushing. `/docs` is
checked into git deliberately, so GitHub Pages has something to serve — but
you don't need to commit the rebuilt `/docs` yourself: `.github/workflows/build-docs.yml`
rebuilds and commits it automatically on every push to `main`, so pushing
your source change is enough.

## Publishing on GitHub Pages

1. Push this repo to GitHub.
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Branch: **main**, folder: **/docs**. Save.
5. GitHub gives you a `https://<username>.github.io/<repo>/` URL within a
   minute or two.

A custom domain can be added later under the same Pages settings without
changing anything else here.

## Known trade-offs (worth knowing, not fixing yet)

- The free Sketchfab embed carries the Sketchfab watermark/logo — removing
  it requires a paid plan. Not worth solving for v1.
- Object pages are generated with the same template, so a genuinely
  different treatment for an object (e.g. CHAN-007's "selected as the best
  of three" caveat) is expressed through the data, not bespoke HTML. If an
  object ever needs a fundamentally different layout, that's a sign to add a
  second template, not to hand-edit generated output (hand edits get wiped
  on the next build).
- No 404 page, no sitemap.xml, no analytics. Add if/when it's actually
  needed — resist adding it pre-emptively.
