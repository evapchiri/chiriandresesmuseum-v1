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

/* About page: "About me" panel.
 * Hand-authored HTML (unlike Lab notes / Lessons learned, which come from
 * reference/about-page-copy.md): this panel needs an image carousel, the
 * muted "extras" block, and footnote-style superscript links that the small
 * markdown parser in this file doesn't cover. The "## ABOUT ME" section still
 * present in about-page-copy.md is now unused — kept only so that file stays a
 * complete record; this function is the source of truth for what ships. */
function aboutMeHTML() {
  return `<h2>About me</h2>

<p>Eva Perez Chirinos</p>
<p>Digital Cultural Heritage &nbsp;|&nbsp; Photogrammetry &nbsp;|&nbsp; 3D &nbsp;|&nbsp; Digital asset management</p>
<p class="about-me-links">
  <a href="https://www.linkedin.com/in/eva-perez-chirinos" target="_blank" rel="noopener">
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/></svg>
    LinkedIn
  </a>
  <a href="https://github.com/evapchiri" target="_blank" rel="noopener">
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.36-3.88-1.36-.53-1.34-1.3-1.7-1.3-1.7-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.1-.75.4-1.27.73-1.56-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.08 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5z"/></svg>
    GitHub
  </a>
</p>

<p>Long story short: I&rsquo;m an archaeologist in love with all things digital - diving into how 3D interactive data can offer new ways of experiencing and learning cultural heritage in the digital space.</p>

<p>I hold a BA in Archaeology and Anthropology from UCL (University College London), where I naturally gravitated towards Digital Humanities. During my early steps at university I supervised the post-processing workload of a student excavation&rsquo;s finds and structured its main database. During this work, I decided to implement new photographic pipelines for the 2D &amp; 3D visual documentation of highlighted artefacts and archaeological trenches &mdash; so that these didn&rsquo;t just stay as rows in the database, but could be interacted with, displayed in class, local exhibitions, or for further specialist analysis.</p>

<div class="about-me-carousel" data-carousel>
  <div class="carousel-viewport">
    <div class="carousel-track">
      <div class="carousel-slide">
        <img src="assets/img/about/excavation-exhibition-weald-downland.jpg" loading="lazy"
          alt="Some of the excavation&rsquo;s artefact photographs being displayed in a temporary exhibition in Weald &amp; Downland Living Museum (2023)"
          data-caption="Some of the excavation&rsquo;s artefact photographs being displayed in a temporary exhibition in Weald &amp; Downland Living Museum (2023)">
      </div>
      <div class="carousel-slide">
        <img src="assets/img/about/student-excavation-digitisation-work.jpg" loading="lazy"
          alt="Some of my digitisation work in the student excavation. Left: collage of different views of an artefact&rsquo;s RTI model. Right: multiple views of a processed 3D scan of one of the trenches"
          data-caption="Some of my digitisation work in the student excavation. Left: collage of different views of an artefact&rsquo;s RTI model. Right: multiple views of a processed 3D scan of one of the trenches">
      </div>
    </div>
    <button class="carousel-prev" type="button" aria-label="Previous image">&#8249;</button>
    <button class="carousel-next" type="button" aria-label="Next image">&#8250;</button>
  </div>
  <p class="carousel-caption" data-carousel-caption>Some of the excavation&rsquo;s artefact photographs being displayed in a temporary exhibition in Weald &amp; Downland Living Museum (2023)</p>
  <div class="carousel-dots"></div>
</div>

<p>This work got me the Peter Dorell Prize 2022 from the Institute of Archaeology<a href="#award-1"><sup>*1</sup></a>, but more so I navigated the struggles we can face in the Heritage field when trying to generate digital media within tight budgets, timelines, and certainly not the most &ldquo;cushy&rdquo; environments. It taught me about the importance of traceability - and how easy it is to lose sight of it - and equally so, the importance of organising that media well enough that it does not become a derived struggle to reuse those assets. Quite rapidly, software and digital asset management became another one of my passions.</p>

<p>For the last couple of years I&rsquo;ve been working in SaaS software technical support, where I got pretty good at helping both internal and client teams do their best work when problems arise, or there&rsquo;s a challenge to face<a href="#award-2"><sup>*2</sup></a>. I learned first hand how software gets built, deployed, and iterated on in the real world, and how digital experiences get curated. In my most recent work I supported a Digital Asset Management platform, a critical software in every Heritage professionals&rsquo; toolkit in the management of their institution&rsquo;s digital assets.</p>

<p>Like so, Chiriandreses Museum is where all of that technical and archaeological knowledge merges: an end-to-end digitisation pipeline, from project planning, to photography, to processing, and a key final part: sharing the knowledge behind the geometric data in an engaging way.</p>

<div class="about-extras">

  <p class="about-extras-heading"><strong><em>Other experiences/educational certificates of mine:</em></strong></p>
  <ul>
    <li>
      <strong>CFG alumni with a CFGDegree in Software &amp; Data Engineering</strong> (<em>Merit</em>) <strong>and a Masters in DevOps &amp; Cloud</strong> (<em>Distinction</em>).
      <span class="about-extra-note"><em>Back-end and front-end programming, Cloud software, UX/UI</em></span>
    </li>
    <li>
      <strong>Contributed to the University of Oxford&rsquo;s &ldquo;<em>MarEA Project</em>&rdquo;.</strong>
      <span class="about-extra-note"><em>Researching cyclonic impacts on Omani maritime heritage. My work was <a href="https://marea.soton.ac.uk/2021/10/26/examining-omans-cyclonic-activity-and-its-impact-on-maritime-cultural-heritage-student-project/" target="_blank" rel="noopener">published in the project&rsquo;s website.</a></em></span>
    </li>
    <li>
      <strong>Assistant to &ldquo;<em>Monumentality and Landscape: Linear Earthworks in Britain</em>&rdquo;</strong> (UCL Institute of Archaeology &amp; Durham University, Leverhulme Trust-funded)
      <span class="about-extra-note"><em>Database development and grey literature retrieval.</em></span>
    </li>
  </ul>

  <p class="about-extras-heading"><strong><em>Awards &amp; recognition:</em></strong></p>
  <ul>
    <li id="award-1">
      (*1) Awarded the <strong>2022 Peter Dorell Prize</strong> (UCL Institute of Archaeology)
      <span class="about-extra-note"><em>For bringing 3D digitisation and artefact photographic documentation into the Downley excavation.</em></span>
    </li>
    <li id="award-2">
      (*2) Avalara &ldquo;<strong>Customer Champion&rdquo; award</strong> for Q1 2025
      <span class="about-extra-note"><em>For my &ldquo;unwavering commitment to putting customers first. With nearly 90% of Avalara Europe&rsquo;s glowing Trustpilot reviews and continues to set the gold standard for CSAT across the team.&rdquo;</em></span>
    </li>
    <li>
      <strong>&ldquo;<em>Highly commended candidate</em>&rdquo;</strong> <strong><em>award</em></strong> <strong>x2</strong>
      <span class="about-extra-note"><em>For two of CodeFirstGirls Kickstarter programming certificates: Python &amp; Apps | Javascript</em></span>
    </li>
  </ul>

</div>`;
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
  const { labNotes, lessonsLearned } = parseAboutPageCopy();
  return fill(template, {
    HERO: heroHTML('', 'about'),
    ABOUT_ME: aboutMeHTML(),
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

main();
