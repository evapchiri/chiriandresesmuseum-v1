/**
 * Chiriandreses Museum — static build script.
 * No dependencies, no framework: reads data/objects.json, fills in the HTML
 * templates, writes finished static pages to /docs (served directly by
 * GitHub Pages). Run with: node scripts/build.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');

function readJSON(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function readFile(p) { return fs.readFileSync(p, 'utf8'); }

/* A site-root-relative asset path with a short content-hash query appended
 * (`assets/x.mp4?v=1a2b3c4d`), so a re-encoded file with the same name still
 * busts browser/CDN caches. Falls back to the bare path if the file is
 * missing at build time. */
function assetURL(relPath) {
  const abs = path.join(ROOT, relPath);
  if (!fs.existsSync(abs)) return relPath;
  const hash = crypto.createHash('sha1').update(fs.readFileSync(abs)).digest('hex').slice(0, 8);
  return `${relPath}?v=${hash}`;
}

function fill(template, tokens) {
  let out = template;
  for (const [key, value] of Object.entries(tokens)) {
    out = out.split(`{{${key}}}`).join(value ?? '');
  }
  return out;
}

/* ---------- Shared navigation + hero ---------- */

/* `basePath` is '' on top-level pages and '../' on generated object pages.
 * `current` marks the active link with aria-current="page" (one of
 * 'index' | 'about' | 'collection', or '' if none apply). */
function siteNavHTML(basePath, current, { withHome = false } = {}) {
  const link = (href, label, key) =>
    `<a class="site-nav-link" href="${basePath}${href}"${current === key ? ' aria-current="page"' : ''}>${label}</a>`;
  const home = withHome ? link('index.html', 'Chiriandreses Museum', 'index') : '';
  return `<nav class="site-nav" aria-label="Main">
      ${home}${link('about.html', 'About', 'about')}
      ${link('collection.html', 'The Collection', 'collection')}
    </nav>`;
}

function heroHTML(basePath, current, { showNav = true } = {}) {
  const nav = showNav ? siteNavHTML(basePath, current) : '';
  return `<header class="site-hero">
  <div class="wrap">
    <h1 class="hero-title"><a href="${basePath}index.html"${current === 'index' ? ' aria-current="page"' : ''}>Chiriandreses Museum</a></h1>
    <p class="hero-subtitle">Explore our family's story in 3D</p>
    ${nav}
  </div>
</header>`;
}

/* ---------- Shared theme toggle ----------
 * Light/dark switching is disabled for now: the site ships a single fixed
 * palette (see assets/styles.css). Both hooks emit nothing; restore the
 * button + init-script bodies from git history to bring switching back. */

function themeToggleHTML() {
  return '';
}

function themeInitScript() {
  return '';
}

/* ---------- Shared footer credit line ---------- */

const { version: SITE_VERSION } = readJSON(path.join(ROOT, 'package.json'));

function footerMetaHTML() {
  const year = new Date().getFullYear();
  return `<p class="footer-meta">&copy; ${year} Eva Perez Chirinos — v${SITE_VERSION} Licensed CC BY-NC-SA 4.0</p>`;
}

/* ---------- Landing page ---------- */

const PROJECT_BLURB = `<p>A small family collection of heirlooms, travel mementos and precious treasures that capture my parents' love story, turned into interactive 3D models for you to explore.</p>
<p>Each model comes with its own story of how it turned up here with us, alongside an honest record of its digitisation process that aims to closely follow the current European framework set out in the VIGIE 2020/654 study to achieve quality and traceability in 3D heritage digitisation.</p>`;

function buildLandingPage(template) {
  return fill(template, {
    HERO: heroHTML('', 'index', { showNav: false }),
    PROJECT_BLURB,
    LANDING_VIDEO_SRC: assetURL('assets/video/landing-bg.mp4'),
    LANDING_VIDEO_POSTER: assetURL('assets/video/landing-bg-poster.jpg'),
    THEME_TOGGLE: themeToggleHTML(),
    THEME_INIT: themeInitScript(),
    FOOTER_META: footerMetaHTML(),
  });
}

/* ---------- About page ----------
 * Every About-section panel is a plain HTML fragment in templates/partials/,
 * each read verbatim into its template token. about-intro.html is the default
 * panel shown on load (the section's short "what is this?" landing view) and
 * has no button in the sidebar; the rest are the tabbed panels. Edit those
 * files directly — no
 * markdown step, no HTML-in-JS-string-literal. Each fragment starts with its
 * own <h2>. Lab-note photo galleries are written inline as
 * <div class="lab-gallery"> blocks (styled in assets/styles.css); the images
 * they point at are copied from assets/img/lab-notes/ by main(). */

function partialHTML(name) {
  return readFile(path.join(ROOT, 'templates', 'partials', name)).trim();
}

const ABOUT_PANELS = {
  ABOUT_INTRO: 'about-intro.html',
  ABOUT_ME: 'about-me.html',
  ABOUT_CONTENT: 'about-project.html',
  LAB_NOTES: 'lab-notes.html',
  LESSONS_LEARNED: 'lessons-learned.html',
  DOCUMENTATION: 'documentation.html',
};

function buildAboutPage(template) {
  const panels = Object.fromEntries(
    Object.entries(ABOUT_PANELS).map(([token, file]) => [token, partialHTML(file)])
  );
  return fill(template, {
    HERO: heroHTML('', 'about'),
    ...panels,
    THEME_TOGGLE: themeToggleHTML(),
    THEME_INIT: themeInitScript(),
    FOOTER_META: footerMetaHTML(),
  });
}

/* ---------- Collection page ---------- */

function uniqueSorted(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function optionsHTML(values) {
  return values.map((v) => `<option value="${v}">${v}</option>`).join('\n        ');
}

/* Card thumbnails are black line-art SVGs supplied per object, named by ID
 * (assets/img/cards/chan-001.svg). Inlined at build time (rather than
 * referenced via <img src>) so CSS can recolor them for dark mode via
 * currentColor. Returns '' when the file doesn't exist yet — CSS renders
 * a placeholder box via .card-thumb:empty, so the site builds fine before
 * the real assets arrive. */
function cardThumbHTML(id) {
  const file = path.join(ROOT, 'assets', 'img', 'cards', `${id.toLowerCase()}.svg`);
  return fs.existsSync(file) ? readFile(file) : '';
}

const CARD_SEARCH_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8"/></svg>`;

function buildCard(obj) {
  return `<article class="card" data-decade="${obj.decade}" data-country="${obj.country}" data-continent="${obj.continent}" data-id="${obj.id}" data-name="${obj.title}">
    <a class="card-link" href="objects/${obj.slug}.html" aria-label="${obj.title}">
      <div class="card-thumb">${cardThumbHTML(obj.id)}</div>
      <div class="card-info">
        <span class="card-id">${obj.id}</span>
        <h2>${obj.title}</h2>
        <ul class="card-meta">
          <li>${obj.materials}</li>
          <li>${chronologyShort(obj.chronology)}</li>
          <li>${obj.geography}</li>
        </ul>
      </div>
      <span class="card-icon">${CARD_SEARCH_ICON}</span>
    </a>
  </article>`;
}

function buildCollectionPage(template, objects) {
  const years = uniqueSorted(objects.map((o) => o.decade));
  const countries = uniqueSorted(objects.map((o) => o.country));
  const continents = uniqueSorted(objects.map((o) => o.continent));
  const ids = objects.map((o) => o.id).sort();
  const names = uniqueSorted(objects.map((o) => o.title));

  const cards = objects.map(buildCard).join('\n');

  return fill(template, {
    HERO: heroHTML('', 'collection'),
    YEAR_OPTIONS: optionsHTML(years),
    COUNTRY_OPTIONS: optionsHTML(countries),
    CONTINENT_OPTIONS: optionsHTML(continents),
    ID_OPTIONS: ids.map((id) => `<option value="${id}">${id}</option>`).join('\n        '),
    NAME_OPTIONS: names.map((n) => `<option value="${n}">${n}</option>`).join('\n        '),
    CARDS: cards,
    OBJECTS_DATA: buildObjectsDataJSON(objects),
    THEME_TOGGLE: themeToggleHTML(),
    THEME_INIT: themeInitScript(),
    FOOTER_META: footerMetaHTML(),
  });
}

/* ---------- Object detail pages ---------- */

const STATUS_LABEL = {
  measured: 'Measured',
  estimated: 'Estimated',
  flagged: 'Flagged',
  na: 'N/A',
};

function provenanceHTML(items) {
  return items.map((item) => {
    const statusKey = item.status === 'n/a' ? 'na' : item.status;
    const label = STATUS_LABEL[statusKey] || item.status;
    return `<div class="provenance-item">
      <span class="stamp ${statusKey}">${label}</span>
      <span class="prop">${item.property}</span>
      <span class="note">${item.note}</span>
    </div>`;
  }).join('\n');
}

function complexityText(c) {
  if (!c) return 'Not individually recorded';
  return `Object ${c.object} · Surface ${c.surface} · Material ${c.material}`;
}

function chronologyShort(chronology) {
  return chronology.split(/[,;]| \(/)[0].trim();
}

function storyHTML(paragraphs) {
  return paragraphs.map((p) => `<p>${p}</p>`).join('\n');
}

function materialsNoteHTML(obj) {
  return obj.materialsNote
    ? `<span class="materials-note">${obj.materialsNote}</span>`
    : '';
}

function buildObjectPage(obj, template) {
  const materialsNote = materialsNoteHTML(obj);

  return fill(template, {
    SITE_NAV: siteNavHTML('../', 'collection', { withHome: true }),
    TITLE: obj.title,
    ID: obj.id,
    TYPE: obj.type,
    TEASER: obj.story[0].slice(0, 155) + '…',
    CHRONOLOGY: obj.chronology,
    CHRONOLOGY_SHORT: chronologyShort(obj.chronology),
    GEOGRAPHY: obj.geography,
    MATERIALS: obj.materials,
    MATERIALS_NOTE: materialsNote,
    MEASUREMENTS: obj.measurements,
    WEIGHT: obj.weight,
    CAPTURE_DATE: obj.captureDate,
    COMPLEXITY: complexityText(obj.complexity),
    ROUTE: obj.route,
    SOFTWARE: obj.software,
    SKETCHFAB_UID: obj.sketchfabUid,
    STORY: storyHTML(obj.story),
    PROVENANCE: provenanceHTML(obj.provenance),
    THEME_TOGGLE: themeToggleHTML(),
    THEME_INIT: themeInitScript(),
    FOOTER_META: footerMetaHTML(),
  });
}

/* Per-object data for the Collection page's detail modal — same fields as
 * the standalone object page, pre-rendered to HTML fragments so the client
 * JS only has to inject innerHTML, not re-implement the markup rules here. */
function buildObjectsDataJSON(objects) {
  const data = objects.map((obj) => ({
    id: obj.id,
    slug: obj.slug,
    title: obj.title,
    type: obj.type,
    chronology: obj.chronology,
    chronologyShort: chronologyShort(obj.chronology),
    geography: obj.geography,
    materialsHTML: obj.materials + materialsNoteHTML(obj),
    measurements: obj.measurements,
    weight: obj.weight,
    captureDate: obj.captureDate,
    complexity: complexityText(obj.complexity),
    route: obj.route,
    software: obj.software,
    sketchfabUid: obj.sketchfabUid,
    storyHTML: storyHTML(obj.story),
    provenanceHTML: provenanceHTML(obj.provenance),
  }));
  // Defuse a literal "</script" inside any authored field so it can't
  // terminate the embedding <script type="application/json"> early.
  return JSON.stringify(data).replace(/<\/script/gi, '<\\/script');
}

/* ---------- Main ---------- */

function main() {
  const objects = readJSON(path.join(ROOT, 'data', 'objects.json'));

  const landingTemplate = readFile(path.join(ROOT, 'templates', 'index.html'));
  const aboutTemplate = readFile(path.join(ROOT, 'templates', 'about.html'));
  const collectionTemplate = readFile(path.join(ROOT, 'templates', 'collection.html'));
  const objectTemplate = readFile(path.join(ROOT, 'templates', 'object.html'));

  fs.rmSync(DOCS, { recursive: true, force: true });
  fs.mkdirSync(path.join(DOCS, 'objects'), { recursive: true });
  fs.mkdirSync(path.join(DOCS, 'assets'), { recursive: true });
  fs.mkdirSync(path.join(DOCS, 'assets', 'img', 'lab-notes'), { recursive: true });
  fs.mkdirSync(path.join(DOCS, 'assets', 'img', 'about'), { recursive: true });

  fs.copyFileSync(path.join(ROOT, 'assets', 'styles.css'), path.join(DOCS, 'assets', 'styles.css'));
  fs.copyFileSync(path.join(ROOT, 'assets', 'site.js'), path.join(DOCS, 'assets', 'site.js'));

  const labImgDir = path.join(ROOT, 'assets', 'img', 'lab-notes');
  if (fs.existsSync(labImgDir)) {
    for (const file of fs.readdirSync(labImgDir)) {
      fs.copyFileSync(path.join(labImgDir, file), path.join(DOCS, 'assets', 'img', 'lab-notes', file));
    }
  }

  const aboutImgDir = path.join(ROOT, 'assets', 'img', 'about');
  if (fs.existsSync(aboutImgDir)) {
    for (const file of fs.readdirSync(aboutImgDir)) {
      fs.copyFileSync(path.join(aboutImgDir, file), path.join(DOCS, 'assets', 'img', 'about', file));
    }
  }

  // Landing-page background video + poster (large-screen flourish, see
  // assets/site.js). Committed pre-encoded web assets, copied verbatim.
  const videoDir = path.join(ROOT, 'assets', 'video');
  if (fs.existsSync(videoDir)) {
    fs.mkdirSync(path.join(DOCS, 'assets', 'video'), { recursive: true });
    for (const file of fs.readdirSync(videoDir)) {
      fs.copyFileSync(path.join(videoDir, file), path.join(DOCS, 'assets', 'video', file));
    }
  }

  fs.writeFileSync(path.join(DOCS, 'index.html'), buildLandingPage(landingTemplate));
  fs.writeFileSync(path.join(DOCS, 'about.html'), buildAboutPage(aboutTemplate));
  fs.writeFileSync(path.join(DOCS, 'collection.html'), buildCollectionPage(collectionTemplate, objects));

  for (const obj of objects) {
    const html = buildObjectPage(obj, objectTemplate);
    fs.writeFileSync(path.join(DOCS, 'objects', `${obj.slug}.html`), html);
  }

  fs.writeFileSync(path.join(DOCS, '.nojekyll'), '');

  console.log(`Built landing, about, collection + ${objects.length} object pages into /docs`);
  const missing = objects.filter((o) => o.sketchfabUid === 'REPLACE_WITH_SKETCHFAB_UID');
  if (missing.length) {
    console.log(`\nReminder: ${missing.length} object(s) still need a real Sketchfab UID in data/objects.json:`);
    missing.forEach((o) => console.log(`  - ${o.id} (${o.slug})`));
  }
  console.log('Reminder: Documentation links on the About page still use REPLACE_WITH_LINK placeholders.');
}

if (require.main === module) main();

module.exports = { build: main };
