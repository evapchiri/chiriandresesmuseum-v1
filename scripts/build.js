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
      ${link('collection.html', 'Collection', 'collection')}
    </nav>`;
}

function heroHTML(basePath, current, { showNav = true } = {}) {
  const nav = showNav ? siteNavHTML(basePath, current) : '';
  return `<header class="site-hero">
  <div class="wrap">
    <h1 class="hero-title"><a href="${basePath}index.html"${current === 'index' ? ' aria-current="page"' : ''}>Chiriandreses Museum</a></h1>
    <p class="hero-subtitle">Explore our family's story in <strong>3D</strong></p>
    ${nav}
  </div>
</header>`;
}

/* ---------- Shared theme toggle (icon-only, fixed position, all pages) ---------- */

function themeToggleHTML() {
  return `<button type="button" class="theme-toggle" aria-label="Toggle dark mode">
    <svg class="icon-sun" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>
    <svg class="icon-moon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/></svg>
  </button>`;
}

/* Blocking inline script, placed in <head>, so a stored theme choice is
 * applied before first paint — avoids a flash of the wrong theme. */
function themeInitScript() {
  return `<script>(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();</script>`;
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
    THEME_TOGGLE: themeToggleHTML(),
    THEME_INIT: themeInitScript(),
    FOOTER_META: footerMetaHTML(),
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

/* ---------- About page: Lab notes & Lessons learned ----------
 * Public copy lives at reference/about-page-copy.md — see that file's own
 * header for the supported markdown syntax. Parsed here directly rather than
 * via a markdown-parsing dependency: the source is single-author (not
 * arbitrary input), the feature set is small, and the custom image-gallery
 * blocks would need a hand-written plugin against any library anyway. */

const LAB_IMG = 'assets/img/lab-notes/';

function escapeHTML(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(text) {
  return escapeHTML(text).replace(/"/g, '&quot;');
}

function inlineHTML(text) {
  let out = escapeHTML(text);
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  return out;
}

function galleryBlockHTML(fenceLines) {
  let caption = '';
  const images = [];
  for (const raw of fenceLines) {
    const line = raw.trim();
    if (!line) continue;
    const captionMatch = line.match(/^caption:\s*(.+)$/i);
    if (captionMatch) { caption = captionMatch[1].trim(); continue; }
    const sep = line.indexOf('::');
    if (sep === -1) throw new Error(`Malformed gallery line in about-page-copy.md (expected "file.jpg :: alt text"): ${line}`);
    images.push([line.slice(0, sep).trim(), line.slice(sep + 2).trim()]);
  }
  const figs = images.map(([file, alt]) => `    <a href="${LAB_IMG}${file}" target="_blank" rel="noopener"><img src="${LAB_IMG}${file}" alt="${escapeAttr(alt)}" loading="lazy"></a>`).join('\n');
  const note = caption ? `\n  <p class="lab-gallery-note">${escapeHTML(caption)}</p>` : '';
  return `<div class="lab-gallery">\n${figs}\n  </div>${note}`;
}

function titleCaseHeader(header) {
  return header.split(' ').map((w, i) => (i === 0 ? w[0] + w.slice(1).toLowerCase() : w.toLowerCase())).join(' ');
}

/* Renders the lines between one "## HEADER" marker and the next to HTML. */
function renderMarkdownSection(lines) {
  const out = [];
  let i = 0;
  const isBlank = (line) => line.trim() === '';

  while (i < lines.length) {
    const line = lines[i];

    if (isBlank(line)) { i++; continue; }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) { i++; continue; }

    const heading = line.match(/^###\s+(.+)$/);
    if (heading) { out.push(`<h3>${inlineHTML(heading[1].trim())}</h3>`); i++; continue; }

    if (line.trim() === '```gallery') {
      const fence = [];
      i++;
      while (i < lines.length && lines[i].trim() !== '```') { fence.push(lines[i]); i++; }
      i++;
      out.push(galleryBlockHTML(fence));
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quoteLines = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { quoteLines.push(lines[i].replace(/^>\s?/, '')); i++; }
      out.push(`<blockquote><p>${inlineHTML(quoteLines.join(' ').trim())}</p></blockquote>`);
      continue;
    }

    if (/^-\s+/.test(line)) {
      const items = [];
      while (i < lines.length) {
        if (/^-\s+/.test(lines[i])) {
          items.push({ text: lines[i].replace(/^-\s+/, ''), fence: null });
          i++;
        } else if (isBlank(lines[i])) {
          const next = lines[i + 1];
          if (next !== undefined && (/^\s{2,}/.test(next) || /^-\s+/.test(next))) { i++; continue; }
          break;
        } else if (/^\s{2,}/.test(lines[i])) {
          const trimmed = lines[i].trim();
          if (trimmed === '```gallery') {
            const fence = [];
            i++;
            while (i < lines.length && lines[i].trim() !== '```') { fence.push(lines[i]); i++; }
            i++;
            items[items.length - 1].fence = fence;
          } else {
            items[items.length - 1].text += ` ${trimmed}`;
            i++;
          }
        } else {
          break;
        }
      }
      const li = items.map(({ text, fence }) => {
        const gallery = fence ? `\n  ${galleryBlockHTML(fence)}\n  ` : '';
        return `  <li>${inlineHTML(text.trim())}${gallery}</li>`;
      }).join('\n');
      out.push(`<ul>\n${li}\n</ul>`);
      continue;
    }

    // A `*[bracketed like this]*` paragraph is an internal editorial note —
    // dropped from the build rather than rendered (see about-page-copy.md).
    {
      const commentLines = [];
      let j = i;
      while (j < lines.length && !isBlank(lines[j])) { commentLines.push(lines[j]); j++; }
      if (/^\*\[.*\]\*$/.test(commentLines.join(' ').trim())) { i = j; continue; }
    }

    {
      const paraLines = [];
      while (
        i < lines.length && !isBlank(lines[i]) &&
        !/^#{2,3}\s/.test(lines[i]) && !/^-\s+/.test(lines[i]) &&
        !/^>\s?/.test(lines[i]) && lines[i].trim() !== '```gallery'
      ) {
        paraLines.push(lines[i]);
        i++;
      }
      out.push(`<p>${inlineHTML(paraLines.join(' ').trim())}</p>`);
    }
  }

  return out.join('\n\n');
}

function parseAboutPageCopy() {
  const lines = readFile(path.join(ROOT, 'reference', 'about-page-copy.md')).split('\n');

  function extractSection(marker) {
    const startIdx = lines.findIndex((l) => l.trim() === `## ${marker}`);
    if (startIdx === -1) throw new Error(`reference/about-page-copy.md is missing a "## ${marker}" header`);
    let endIdx = lines.findIndex((l, idx) => idx > startIdx && /^##\s/.test(l));
    if (endIdx === -1) endIdx = lines.length;
    const body = renderMarkdownSection(lines.slice(startIdx + 1, endIdx));
    return `<h2>${titleCaseHeader(marker)}</h2>\n\n${body}`;
  }

  return {
    aboutMe: extractSection('ABOUT ME'),
    labNotes: extractSection('LAB NOTES'),
    lessonsLearned: extractSection('LESSONS LEARNED'),
  };
}

function buildAboutPage(template) {
  const { aboutMe, labNotes, lessonsLearned } = parseAboutPageCopy();
  return fill(template, {
    HERO: heroHTML('', 'about'),
    ABOUT_ME: aboutMe,
    ABOUT_CONTENT: aboutContentHTML(),
    DOCUMENTATION_LINKS: documentationLinksHTML(),
    LAB_NOTES: labNotes,
    LESSONS_LEARNED: lessonsLearned,
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

  fs.copyFileSync(path.join(ROOT, 'assets', 'styles.css'), path.join(DOCS, 'assets', 'styles.css'));
  fs.copyFileSync(path.join(ROOT, 'assets', 'site.js'), path.join(DOCS, 'assets', 'site.js'));

  const labImgDir = path.join(ROOT, 'assets', 'img', 'lab-notes');
  if (fs.existsSync(labImgDir)) {
    for (const file of fs.readdirSync(labImgDir)) {
      fs.copyFileSync(path.join(labImgDir, file), path.join(DOCS, 'assets', 'img', 'lab-notes', file));
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

main();
