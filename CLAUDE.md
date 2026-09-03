# CLAUDE.md — Chiriandreses Museum v1

## What this is

Static site for the Chiriandreses Museum digitisation project — a personal case study in 3D-digitising family heirlooms and travel souvenirs, done to a genuinely thought-through, Europeana-aligned methodology rather than as a portfolio of "pretty renders." Nine finished objects, each with a Sketchfab embed and a full provenance record (what was measured vs. hand-estimated, and where).

Content licence: CC BY-NC-SA 4.0 (Attribution–NonCommercial–ShareAlike) throughout.

## Architecture — read this before touching anything

Plain HTML/CSS/JS. No framework, no client-side dependencies, no build tooling beyond a few small dependency-free Node scripts in `scripts/` (build, dev server, plain server). This is a deliberate, already-litigated choice (see `README.md` → "Why this shape"). Two earlier attempts at this same project were abandoned specifically because framework overhead outpaced the actual need — a Next.js/shadcn build and a Vite/React build before that, both live as sibling folders one level up (`../chiriandresesmuseum`, `../chiriandresesmuseum-OLDvite`), neither referenced by this repo. Don't reintroduce React, a bundler, or a CSS framework here without discussing it first.

- `data/objects.json` — single source of truth for all object content (metadata, story text, provenance records). This is what you edit for content changes.
- `templates/*.html` — the four page templates (index, about, collection, object), with `{{TOKEN}}` slots build.js fills.
- `templates/partials/*.html` — standalone HTML fragments, each read verbatim into a template token. About-section panels currently wired in: `about-intro.html`, `about-me.html`, `project-lifecycle.html`, `stage-by-stage.html`, `documentation.html`, `lab-notes.html`, `lessons-learned.html` (token map: `ABOUT_PANELS` in `build.js`). `about-project.html` ("The technical details") is retired from the built page for now but kept on disk — source to fold into `project-lifecycle.html` / `stage-by-stage.html`, which currently ship as `.placeholder-note` stubs. Each fragment starts with its own `<h2>`. `about-intro.html` is the short "what is Chiriandreses Museum?" landing view shown by default when you open the About page; it also has its own sidebar button at the top. Sidebar (set in `templates/about.html`) is grouped with non-clickable `<p class="about-nav-group" role="presentation">` labels: What is Chiriandreses Museum?, About me, **The project** → Project lifecycle, Stage-by-stage, Project archive, **The journey** → Lab journal, Lessons learned. Labels don't always match the partial filename or the panel `<h2>`. `lab-notes.html` (menu label / heading "Lab journal") has a second, nested tab layer inside it — a `[data-folder-tabs]` filing-folder strip splitting the log by date, wired by `initFolderTabs()` in `assets/site.js` and styled as `.folder-tab-*` in `assets/styles.css`; add a new dated entry by adding a `<button role="tab">` to the strip and a matching `<section role="tabpanel">`. This is the **only** way About content is authored now — no markdown step, no HTML in JS string literals. Lab-note photo galleries are written inline as `<div class="lab-gallery">` blocks pointing at `assets/img/lab-notes/…`. Add more partials here whenever a chunk of hand-written page HTML would otherwise live as a JS template literal.
- `scripts/build.js` — reads `objects.json` + templates + partials, writes finished static pages into `/docs`. Also copies `assets/img/lab-notes/` and `assets/img/about/` into `docs/` on build, and emits the per-object JSON the Collection page's detail modal reads (same data as the standalone object pages — both are generated from one source, not duplicated by hand). Exports `{ build }` and only auto-runs when invoked directly, so `scripts/dev.js` can re-require it per rebuild.
- `docs/` — **build output**, served directly by GitHub Pages once deployed. Checked into git deliberately — GitHub Pages here is still "Deploy from a branch: main / docs", not an Actions-based deploy. `.github/workflows/build-docs.yml` rebuilds and auto-commits `/docs` on every push to `main`, so pushing a source change is enough; run `npm run build` locally too when you want to preview before pushing. Never hand-edit files inside `docs/` directly — edits get silently wiped on the next build.
- `assets/` — site-wide CSS/JS, copied into `docs/assets` on build. `assets/img/lab-notes/` specifically holds the **public, curated, resized** copies of process photos used in the About page's Lab notes panel — committed, not gitignored. Don't confuse this with `reference/lab-notes/` below, which is the private raw source those images were curated *from*. `assets/video/` holds the pre-encoded landing-page background video (`landing-bg.mp4` + `landing-bg-poster.jpg`), copied verbatim into `docs/assets/video/`; it's a large-screen-only flourish loaded lazily by `assets/site.js`, and the source render lives outside the repo (re-encode with ffmpeg if it changes).
- `reference/` — source material that feeds the site's content but isn't itself served (see "Reference material" below). `reference/lab-notes/` specifically is gitignored and never committed — it's private, internal-only working material, not a draft of public content.

## Commands

- `npm run dev` — the working loop: build once, serve `/docs` at `http://localhost:3000`, watch `templates/ assets/ data/ reference/ scripts/`, rebuild on save, and live-reload the browser (SSE snippet injected into HTML responses only — never written to `/docs`). Editing `scripts/build.js` is picked up live; editing `scripts/dev.js` needs a restart. No dependencies.
- `npm run build` — one-shot regenerate `/docs` from source (what CI runs).
- `npm run serve` — plain static server for `/docs`, no watch/reload (or `npx serve docs`).

Edit **source only** — `templates/`, `templates/partials/`, `assets/`, `data/objects.json`, `scripts/build.js`. `docs/` is build output and is wiped on every build.

## The provenance/status vocabulary — keep this consistent

Every object's `provenance` array in `objects.json` uses a fixed status vocabulary that is core to this project's whole point (see "Why this project exists" in `CLAUDE.local.md`): `measured` (empirically derived from the capture), `estimated` (hand-judged by eye, disclosed as such), `n/a`, and `flagged` (a known limitation worth surfacing plainly). Never soften an `estimated` entry so it reads as `measured`, and don't add a new status value without updating this file and whatever template logic renders it.

## Content & tone conventions

- UK English throughout, metric units.
- First-person voice (Eva), as established in the methodology document and already reflected in `objects.json` story text.
- Honesty over polish: known limitations (e.g. CHAN-007's focus limitations on fine extremities, CHAN-006's slightly rugged top edge) are stated plainly, not smoothed over in copy. This is deliberate and matches the project's whole methodological stance — don't tidy this language away without checking first.
- The private lab notes (see below) are deliberately raw and colloquial — first drafts, frustration, dead ends, family details included. They are the *source*, not the *content*: when writing the About page's "Lab notes" / "Lessons learned" panels, draw on them but write actual public copy — don't link to, embed, or copy-paste the raw file wholesale (see the "Reference material" section for why). What does carry over is the tone: keep the public version honest and a little unpolished rather than sanding it into corporate case-study language. This is the same "honesty over polish" stance as the provenance vocabulary, applied to prose instead of data — just exercised through curation and rewriting, not exposure of the raw source. **Specifically for the Lab notes panel**: keep the voice loose, colloquial, and contraction-heavy — not rigid or report-like — while Lessons learned stays comparatively serious and thematic. Match that established split rather than defaulting back to something more formal. About Me sits in between: personal and conversational, but not fragmentary.

## Reference material

`reference/` splits into two tiers with different publication status — don't conflate them:

- **`reference/methodology-paradata.md`** — committed, and written for public consumption (a first-person, official wrap-up). The full methodology & paradata document: reference framework, equipment, capture campaign summary, what didn't survive and why, the custom HeritageScan tooling, and the PBR-material-authenticity note. Authoritative source for anything `objects.json` doesn't cover, and the source `objects.json`'s content was originally condensed from. Fine to link to directly from the site if that's the eventual call on the Documentation panel.

  *(The About-page panels used to be authored as markdown in `reference/about-page-copy.md`; that file is retired — the panels are now hand-authored HTML in `templates/partials/`. The voice guidance in "Content & tone conventions" above still applies when editing `lab-notes.html` / `lessons-learned.html`.)*
- **`reference/lab-notes/`** — gitignored, private, never committed, never public. Holds the raw process journal (colloquial and unedited, covering the full campaign from initial photography through Sketchfab upload and on to later retopology/texturing work) and its accompanying process photos, plus a companion notes file pairing that raw material against how it was synthesised into the public methodology document. Both are drafting source for the About page's About Me/Lab notes/Lessons learned panels — treat as Eva's own private working material, not a draft of public content, and don't commit anything under this path without checking first; if `.gitignore` doesn't list it, that's a bug, not licence to add it.

## Personal / career context

Why this specific project exists and how it fits a wider plan lives in `CLAUDE.local.md`, which is gitignored and never committed — this repo may end up public on GitHub Pages, so career-strategy material is kept out of every file that ships.
