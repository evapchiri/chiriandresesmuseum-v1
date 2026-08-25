# Chiriandreses Museum — v1

Static site for the Chiriandreses Museum digitisation project. Plain HTML/CSS/JS,
no framework, no client-side dependencies. A small Node build script turns
`data/objects.json` + four HTML templates into finished static pages in `/docs`,
which GitHub Pages serves directly.

## Site structure

- **`index.html`** — Landing page. Hero, a short project blurb, and two buttons
  ("About the project" / "The Collection") with a cursor-following tooltip on
  hover (desktop only — gracefully skipped on touch devices).
- **`about.html`** — The BTS/process page. Same hero, then a sticky left-hand
  nav that swaps content panels in place (About the project / Lab notes /
  Lessons learned / Documentation) — no page scroll or navigation, just a
  tab switch.
- **`collection.html`** — Same hero, a horizontal bar of five dropdown
  filters (Acquisition Year, Country, Continent, ID, Object Name), and the
  grid of object cards. Filtering is client-side vanilla JS — no page reload.
- **`objects/*.html`** — One page per object, same as before: Sketchfab
  embed + the "Field Record" provenance docket.

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

## Filling in the real Sketchfab embeds

Every object in `data/objects.json` currently has:

```json
"sketchfabUid": "REPLACE_WITH_SKETCHFAB_UID"
```

To get the real UID: open the model on Sketchfab, and copy the long
alphanumeric string from the model's URL —
`sketchfab.com/models/<THIS-PART>/...` (or `sketchfab.com/3d-models/<name>-<THIS-PART>`).
Paste it in for each object, then re-run `npm run build`.

## Filling in the Documentation links

The About page's Documentation panel lists six source documents (methodology
doc, digitisation journal, spreadsheets, Metashape reports, planning table),
each currently pointing at `REPLACE_WITH_LINK` in
`scripts/build.js` → `documentationLinksHTML()`. Once you've decided where
each document will actually live (GitHub, Google Drive, etc.), update the
`href` values there and re-run `npm run build`.

## Editing content

- **Object data, story text, provenance flags** → `data/objects.json`
- **Page structure / layout** → `templates/index.html`, `templates/object.html`
- **Look and feel** → `assets/styles.css`

After any change, run `npm run build` again and commit the regenerated
`/docs` folder along with your source changes — `/docs` is checked into git
deliberately (see below), so GitHub Pages has something to serve without
needing a CI step.

## Publishing on GitHub Pages (fastest path)

1. Push this repo to GitHub.
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Branch: **main**, folder: **/docs**. Save.
5. GitHub gives you a `https://<username>.github.io/<repo>/` URL within a
   minute or two.

No GitHub Actions workflow needed for v1 — you build locally, commit `/docs`,
push. A custom domain can be added later under the same Pages settings
without changing anything else here.

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
