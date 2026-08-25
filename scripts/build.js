/**
 * Chiriandreses Museum — static build script.
 * No dependencies, no framework: reads data/objects.json, fills in the HTML
 * templates, writes finished static pages to /docs (served directly by
 * GitHub Pages). Run with: node scripts/build.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');

function readJSON(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function readFile(p) { return fs.readFileSync(p, 'utf8'); }

function fill(template, tokens) {
  let out = template;
  for (const [key, value] of Object.entries(tokens)) {
    out = out.split(`{{${key}}}`).join(value ?? '');
  }
  return out;
}

/* ---------- Shared hero (identical markup on every top-level page) ---------- */

function heroHTML() {
  return `<header class="site-hero">
  <div class="wrap">
    <h1 class="hero-title">Chiriandreses Museum</h1>
    <p class="hero-subtitle">Our family's story in 3D</p>
  </div>
</header>`;
}

/* ---------- Landing page ---------- */

const PROJECT_BLURB = `Between 16–22 February 2026, I spent a week in Spain 3D-digitising eighteen of my family's heirlooms and travel souvenirs — a hand-carved Moroccan candlestick, a toy bus from Senegal, a stone my mother swears was once part of a Roman statue. Nine objects made it through cleanly enough to share. This site holds all of it: the objects themselves, and the process, equipment, and judgement calls behind getting each one from a physical heirloom to a shareable, trustworthy 3D model.`;

function buildLandingPage(template) {
  return fill(template, {
    HERO: heroHTML(),
    PROJECT_BLURB,
  });
}

/* ---------- About / BTS page ---------- */

function aboutContentHTML() {
  return `<h2>About the project</h2>

<p>This project followed the European Commission's VIGIE 2020/654 study on quality in 3D digitisation of tangible cultural heritage, adapted throughout for a solo practitioner working with personal, non-fragile objects rather than an institutional team and archival-grade holdings. Planning and capture practice also drew on the 3D4CH Competence Centre's <em>Essential Guide to 3D Digitised Heritage</em> training series, alongside photogrammetry community guidance on preparing models for reuse in VR, AR, and web-based viewing.</p>

<h3>Scope &amp; team</h3>
<p>The objective was to generate high-quality 3D models of a family heirloom and travel-souvenir collection, following Europeana-aligned standards for model, metadata, and paradata, and to make them accessible through a purpose-built web experience. I led capture, processing, and documentation. Custom tooling was developed in collaboration with my partner, <strong>Robert Upson</strong>, a Senior Software Engineer, to address reconstruction failures the standard pipeline couldn't resolve.</p>

<h3>Equipment &amp; software</h3>
<ul class="spec-list">
  <li><strong>Camera:</strong> Canon DSLR 2000D, EF-S 18-55mm IS II lens</li>
  <li><strong>Lighting:</strong> 2× NEEWER portable lights, dimmable 5600K 1000LM, white diffuser filter</li>
  <li><strong>Turntable:</strong> Home turntable rig, white background</li>
  <li><strong>Scale reference:</strong> Homemade, accurate to ±1mm</li>
  <li><strong>Photogrammetry:</strong> Agisoft Metashape Standard v2.2.2</li>
  <li><strong>Supplementary tooling:</strong> HeritageScan — a custom CLI built on Apple's RealityKit SDK, for cases the standard pipeline couldn't resolve</li>
  <li><strong>3D authoring:</strong> Blender</li>
  <li><strong>Compute:</strong> MacBook M2 2022, 16GB</li>
</ul>

<h3>The capture campaign</h3>
<p>18 objects were photographed across a single week's access to the family collection at my parents' home in Spain (16–22 February 2026), immediately before my relocation to Japan. Re-photographing wasn't possible afterwards — the objects aren't accessible for recapture — which shaped several decisions along the way. Target accuracy was ±5mm, target resolution 1.5mm, target reprojection error 1.5px. Nine objects reached finished status: technical success (a model exists) was treated as necessary but not sufficient — a model also had to remain a credible representation of the object without disproportionate manual reconstruction to count.</p>

<h3>Custom tooling: HeritageScan</h3>
<p>Where Metashape's standard reconstruction failed — high-specularity or dark textures, low-featured surfaces — Robert built HeritageScan to test an alternative reconstruction algorithm against the same source images. It didn't resolve every alignment challenge Metashape struggled with, but for one object in particular it produced a better result in roughly a fifth of the time and effort.</p>

<p>The full methodology and per-object paradata record goes into considerably more depth than fits here — see the Documentation tab for the complete document.</p>`;
}

function documentationLinksHTML() {
  const docs = [
    { label: 'Methodology & Paradata document (full)', href: 'REPLACE_WITH_LINK' },
    { label: 'Digitisation journal — dated process log, 16 Feb–19 May 2026', href: 'REPLACE_WITH_LINK' },
    { label: 'Object digitisation notes (spreadsheet, per-object capture & processing sheets)', href: 'REPLACE_WITH_LINK' },
    { label: 'Object metadata info (spreadsheet, family-sourced raw metadata + narrative descriptions)', href: 'REPLACE_WITH_LINK' },
    { label: 'Final Metashape processing reports (PDF, one per object)', href: 'REPLACE_WITH_LINK' },
    { label: 'Project planning table (EP-001 / EP-002)', href: 'REPLACE_WITH_LINK' },
  ];
  return docs.map((d) => `<li><a href="${d.href}">${d.label}</a></li>`).join('\n        ');
}

function buildAboutPage(template) {
  return fill(template, {
    HERO: heroHTML(),
    ABOUT_CONTENT: aboutContentHTML(),
    DOCUMENTATION_LINKS: documentationLinksHTML(),
  });
}

/* ---------- Collection page ---------- */

function uniqueSorted(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function optionsHTML(values) {
  return values.map((v) => `<option value="${v}">${v}</option>`).join('\n        ');
}

function buildCard(obj) {
  return `<article class="card" data-decade="${obj.decade}" data-country="${obj.country}" data-continent="${obj.continent}" data-id="${obj.id}" data-name="${obj.title}">
    <span class="card-id">${obj.id}</span>
    <h2><a href="objects/${obj.slug}.html">${obj.title}</a></h2>
    <p class="teaser">${obj.story[0].slice(0, 130)}…</p>
    <p class="tags">${obj.decade} · ${obj.country}</p>
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
    HERO: heroHTML(),
    YEAR_OPTIONS: optionsHTML(years),
    COUNTRY_OPTIONS: optionsHTML(countries),
    CONTINENT_OPTIONS: optionsHTML(continents),
    ID_OPTIONS: ids.map((id) => `<option value="${id}">${id}</option>`).join('\n        '),
    NAME_OPTIONS: names.map((n) => `<option value="${n}">${n}</option>`).join('\n        '),
    CARDS: cards,
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

function buildObjectPage(obj, template) {
  const materialsNote = obj.materialsNote
    ? `<span class="materials-note">${obj.materialsNote}</span>`
    : '';

  return fill(template, {
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
  });
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

  fs.copyFileSync(path.join(ROOT, 'assets', 'styles.css'), path.join(DOCS, 'assets', 'styles.css'));
  fs.copyFileSync(path.join(ROOT, 'assets', 'site.js'), path.join(DOCS, 'assets', 'site.js'));

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

main();
