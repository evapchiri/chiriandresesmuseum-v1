/**
 * Chiriandreses Museum — static build script.
 * No dependencies, no framework: reads data/objects.json, fills in the HTML
 * templates, writes finished static pages to /docs (served directly by
 * GitHub Pages). Run with: node scripts/build.js
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { validate: validateData } = require("./validate-data");

const ROOT = path.join(__dirname, "..");
const DOCS = path.join(ROOT, "docs");

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}
function readFile(p) {
  return fs.readFileSync(p, "utf8");
}

/* ---------- Data loading + lookup resolution ----------
 * data/objects.json is the single source of truth (curated tier-1/2 fields,
 * a nested fullRecord for tier 3, and locationId/periodId/campaignId
 * references). data/locations.json, periods.json and campaigns.json are
 * lean lookup tables — see data restructuring instructions.md. Resolution
 * happens once, in memory, right here: everything downstream (buildCard,
 * buildCollectionPage, buildObjectPage) keeps reading obj.country /
 * obj.continent / obj.decade exactly as before, so filter logic and
 * templates never need to know lookup tables exist. campaignId resolves
 * too, but only feeds the Full record panel — it's deliberately not wired
 * into the Collection filter bar. */
function loadResolvedObjects() {
  const objects = readJSON(path.join(ROOT, "data", "objects.json"));
  const locations = readJSON(path.join(ROOT, "data", "locations.json"));
  const periods = readJSON(path.join(ROOT, "data", "periods.json"));
  const campaigns = readJSON(path.join(ROOT, "data", "campaigns.json"));

  const locationById = Object.fromEntries(locations.map((l) => [l.id, l]));
  const periodById = Object.fromEntries(periods.map((p) => [p.id, p]));
  const campaignById = Object.fromEntries(campaigns.map((c) => [c.id, c]));

  const resolved = objects.map((obj) => {
    const location = locationById[obj.locationId];
    const period = periodById[obj.periodId];
    const campaign = campaignById[obj.campaignId];
    return {
      ...obj,
      country: location.country,
      continent: location.continent,
      decade: period.label,
      campaign,
    };
  });

  // Debug/diff aid only (gitignored) — never read back in as a source of truth.
  fs.writeFileSync(
    path.join(ROOT, "data", "objects.resolved.json"),
    JSON.stringify(resolved, null, 2),
  );

  return resolved;
}

/* A site-root-relative asset path with a short content-hash query appended
 * (`assets/x.mp4?v=1a2b3c4d`), so a re-encoded file with the same name still
 * busts browser/CDN caches. Falls back to the bare path if the file is
 * missing at build time. */
function assetURL(relPath) {
  const abs = path.join(ROOT, relPath);
  if (!fs.existsSync(abs)) return relPath;
  const hash = crypto
    .createHash("sha1")
    .update(fs.readFileSync(abs))
    .digest("hex")
    .slice(0, 8);
  return `${relPath}?v=${hash}`;
}

function fill(template, tokens) {
  let out = template;
  for (const [key, value] of Object.entries(tokens)) {
    out = out.split(`{{${key}}}`).join(value ?? "");
  }
  return out;
}

/* ---------- Shared navigation + hero ---------- */

/* `basePath` is '' on top-level pages and '../' on generated object pages.
 * `current` marks the active link with aria-current="page" (one of
 * 'index' | 'about' | 'collection', or '' if none apply). */
function siteNavHTML(basePath, current, { withHome = false } = {}) {
  const link = (href, label, key) =>
    `<a class="site-nav-link" href="${basePath}${href}"${current === key ? ' aria-current="page"' : ""}>${label}</a>`;
  const home = withHome
    ? link("index.html", "Chiriandreses Museum", "index")
    : "";
  return `<nav class="site-nav" aria-label="Main">
      ${home}${link("about.html", "About", "about")}
      ${link("collection.html", "The Collection", "collection")}
    </nav>`;
}

function heroHTML(basePath, current, { showNav = true } = {}) {
  const nav = showNav ? siteNavHTML(basePath, current) : "";
  return `<header class="site-hero">
  <div class="wrap">
    <h1 class="hero-title"><a href="${basePath}index.html"${current === "index" ? ' aria-current="page"' : ""}>Chiriandreses Museum</a></h1>
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
  return "";
}

function themeInitScript() {
  return "";
}

/* ---------- Shared footer credit line ---------- */

const { version: SITE_VERSION } = readJSON(path.join(ROOT, "package.json"));

function footerMetaHTML() {
  const year = new Date().getFullYear();
  return `<p class="footer-meta">&copy; ${year} Eva Perez Chirinos — v${SITE_VERSION} Licensed CC BY-NC-SA 4.0</p>`;
}

/* ---------- Landing page ---------- */

const PROJECT_BLURB = `<p>A small family collection of heirlooms, travel mementos and precious treasures that capture my parents' love story, turned into interactive 3D models for you to explore.</p>
<p>Each model comes with its own story of how it turned up here with us, alongside an honest record of their digitisation process. A record that aims to closely follow the current European metadata and paradata framework set out in the VIGIE 2020/654 study, to achieve high quality and traceability in 3D heritage digitisation projects.</p>`;

function buildLandingPage(template) {
  return fill(template, {
    HERO: heroHTML("", "index", { showNav: false }),
    PROJECT_BLURB,
    LANDING_VIDEO_SRC: assetURL("assets/video/landing-bg.mp4"),
    LANDING_VIDEO_POSTER: assetURL("assets/video/landing-bg-poster.jpg"),
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
  return readFile(path.join(ROOT, "templates", "partials", name)).trim();
}

/* Panel order here is cosmetic; the sidebar order lives in templates/about.html.
 * about-project.html ("The technical details") is retired from the built page
 * for now — kept on disk as source to fold into the two new project panels. */
const ABOUT_PANELS = {
  ABOUT_INTRO: "about-intro.html",
  ABOUT_ME: "about-me.html",
  LIFECYCLE: "project-lifecycle.html",
  STAGE_BY_STAGE: "stage-by-stage.html",
  DOCUMENTATION: "documentation.html",
  LAB_NOTES: "lab-notes.html",
  LESSONS_LEARNED: "lessons-learned.html",
};

function buildAboutPage(template) {
  const panels = Object.fromEntries(
    Object.entries(ABOUT_PANELS).map(([token, file]) => [
      token,
      partialHTML(file),
    ]),
  );
  return fill(template, {
    HERO: heroHTML("", "about"),
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
  return values
    .map((v) => `<option value="${v}">${v}</option>`)
    .join("\n        ");
}

/* Card thumbnails are black line-art SVGs supplied per object, named by ID
 * (assets/img/cards/chan-001.svg). Inlined at build time (rather than
 * referenced via <img src>) so CSS can recolor them for dark mode via
 * currentColor. Returns '' when the file doesn't exist yet — CSS renders
 * a placeholder box via .card-thumb:empty, so the site builds fine before
 * the real assets arrive. */
function cardThumbHTML(id) {
  const file = path.join(
    ROOT,
    "assets",
    "img",
    "cards",
    `${id.toLowerCase()}.svg`,
  );
  return fs.existsSync(file) ? readFile(file) : "";
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
          <li>${obj.country}</li>
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

  const cards = objects.map(buildCard).join("\n");

  return fill(template, {
    HERO: heroHTML("", "collection"),
    YEAR_OPTIONS: optionsHTML(years),
    COUNTRY_OPTIONS: optionsHTML(countries),
    CONTINENT_OPTIONS: optionsHTML(continents),
    ID_OPTIONS: ids
      .map((id) => `<option value="${id}">${id}</option>`)
      .join("\n        "),
    NAME_OPTIONS: names
      .map((n) => `<option value="${n}">${n}</option>`)
      .join("\n        "),
    CARDS: cards,
    OBJECTS_DATA: buildObjectsDataJSON(objects),
    THEME_TOGGLE: themeToggleHTML(),
    THEME_INIT: themeInitScript(),
    FOOTER_META: footerMetaHTML(),
  });
}

/* ---------- Object detail pages ---------- */

const STATUS_LABEL = {
  measured: "Measured",
  estimated: "Estimated",
  flagged: "Flagged",
  na: "N/A",
};

/* item.chip (Reshaped/Patched/Recreated) mirrors the same work-type chips
 * used in the About page's Stage-by-stage "Mesh or texture polishing
 * record" table (.res-chip.is-part there too) — only set on provenance
 * entries that actually got that kind of manual post-processing work. It's
 * grouped with .note in .provenance-detail (not with the status stamp in
 * .provenance-head) because it explains *how* the note's disclosure
 * happened, not the property's status.
 *
 * status: "n/a" is rendered as a bare "Not created" stamp chip on the same
 * .provenance-head row as every other status (property name left, stamp
 * right) — there's nothing to disclose about a map that was never
 * generated, so the .provenance-detail block (chip + note, still required
 * by the schema for internal record-keeping) is intentionally omitted. */
function renderProvenanceItem(item) {
  if (item.status === "n/a") {
    return `<div class="provenance-item">
      <div class="provenance-head">
        <span class="prop">${item.property}</span>
        <span class="stamp na">Not created</span>
      </div>
    </div>`;
  }
  const label = STATUS_LABEL[item.status] || item.status;
  const chip = item.chip
    ? `<span class="res-chip is-part">${item.chip}</span>`
    : "";
  return `<div class="provenance-item">
      <div class="provenance-head">
        <span class="prop">${item.property}</span>
        <span class="stamp ${item.status}">${label}</span>
      </div>
      <div class="provenance-detail">${chip}
        <span class="note">${item.note}</span>
      </div>
    </div>`;
}

/* The Texture maps section is texture-only, despite obj.provenance carrying
 * the object's full disclosed-fields record (Overall model, Geometry,
 * Confidence, Measurements, etc. — real record data, kept in objects.json,
 * just not this section's business). It always shows exactly these two
 * rows, in this order, for every object: Albedo/diffuse, then Roughness/
 * metallic — matched loosely (CHAN-007 discloses only "Metallic", CHAN-016
 * only "Roughness") and normalised to the canonical property label so the
 * heading reads the same everywhere.
 *
 * Undisclosed is meaningful, not absent: an object with no albedo/diffuse
 * entry never had that map touched, so it's Metashape's unedited output
 * ("Measured" / as-is); an object with no roughness/metallic entry never
 * had one generated at all ("Not created"). Those defaults are synthesised
 * here rather than the section silently dropping the row. */
const ALBEDO_DEFAULT = {
  property: "Albedo / diffuse",
  status: "measured",
  note: "As-is from processing.",
};
const ROUGHNESS_METALLIC_DEFAULT = {
  property: "Roughness / metallic",
  status: "n/a",
  note: "Not created for this object.",
};

function provenanceHTML(items) {
  const albedo = items.find((item) => /albedo|diffuse/i.test(item.property));
  const roughnessMetallic = items.find((item) =>
    /roughness|metallic/i.test(item.property),
  );
  return [
    renderProvenanceItem({
      ...(albedo || ALBEDO_DEFAULT),
      property: "Albedo / diffuse",
    }),
    renderProvenanceItem({
      ...(roughnessMetallic || ROUGHNESS_METALLIC_DEFAULT),
      property: "Roughness / metallic",
    }),
  ].join("\n");
}

/* Complexity is rendered as three separate rows (Complexity/Surface/Material)
 * rather than one combined string — see the "Complexity" row split in
 * templates/object.html and templates/collection.html. */
function complexityValue(c, key) {
  return c ? c[key] : "Not individually recorded";
}

function chronologyShort(chronology) {
  return chronology.split(/[,;]| \(/)[0].trim();
}

function storyHTML(paragraphs) {
  return paragraphs.map((p) => `<p>${p}</p>`).join("\n");
}

function materialsNoteHTML(obj) {
  return obj.materialsNote
    ? `<span class="materials-note">${obj.materialsNote}</span>`
    : "";
}

/* Tier-2 "Geometric data" row — condensed from the primary derived asset in
 * fullRecord, rather than authored separately, so mesh stats never drift
 * out of sync with the full record's own asset inventory. */
function geometricDataText(fullRecord) {
  const asset =
    fullRecord && fullRecord.derivedAssets && fullRecord.derivedAssets[0];
  if (!asset) return "Not individually recorded";
  return `${asset.meshResolution} · ${asset.vertexCount.toLocaleString("en-GB")} vertices · ${asset.faceCount.toLocaleString("en-GB")} faces`;
}

/* Tier-3 "Full record" — everything from the digitisation record that
 * doesn't belong in the curated tier-1/2 field record: initial assessment,
 * capture tolerances, full equipment + per-chunk acquisition detail,
 * derived-asset inventory, campaign info, and the post-processing lab
 * notes. Rendered only on the standalone object page (see decision #1 in
 * the restructuring plan) — the Collection modal never receives this data. */
function fullRecordHTML(obj) {
  const r = obj.fullRecord;
  if (!r) return "";

  const eq = r.equipment || {};
  const acquisitionRows = (r.acquisition || [])
    .map(
      (a) => `
        <tr>
          <td>${a.chunk}</td>
          <td>${a.exposureMode}</td>
          <td>${a.opticsFocus}</td>
          <td>${a.rotationalSteps}</td>
          <td>${a.imageCount}</td>
        </tr>`,
    )
    .join("");

  const assetRows = (r.derivedAssets || [])
    .map(
      (a) => `
        <tr>
          <td>${a.label}</td>
          <td>${a.meshResolution}</td>
          <td>${a.alignmentQuality}</td>
          <td>${a.tiePointCount.toLocaleString("en-GB")}</td>
          <td>${a.vertexCount.toLocaleString("en-GB")}</td>
          <td>${a.faceCount.toLocaleString("en-GB")}</td>
          <td>${a.filename}</td>
          <td>${a.format}</td>
          <td>${a.size}</td>
        </tr>`,
    )
    .join("");

  return `<p class="record-section-label">Assessment</p>
    <dl>
      <div class="record-row"><dt>Initial review</dt><dd>${r.initialReview}</dd></div>
      <div class="record-row"><dt>Condition</dt><dd>${r.conditionDetail}</dd></div>
      <div class="record-row"><dt>Obstructions</dt><dd>${r.obstructions}</dd></div>
      <div class="record-row"><dt>Physical challenges</dt><dd>${r.physicalChallenges}</dd></div>
      <div class="record-row"><dt>Overall description</dt><dd>${r.overallDescription}</dd></div>
      <div class="record-row"><dt>Recording challenges</dt><dd>${r.recordingChallenges}</dd></div>
      <div class="record-row"><dt>Experiment?</dt><dd>${r.experiment ? "Yes — deliberate technique experiment" : "No"}</dd></div>
      <div class="record-row"><dt>Digitisation campaign</dt><dd>${obj.campaign.label}</dd></div>
    </dl>

    <p class="record-section-label">Post-processing lab notes</p>
    ${storyHTML(r.postProcessingNotes.split("\n\n"))}

    <p class="record-section-label">Capture tolerances &amp; equipment</p>
    <dl>
      <div class="record-row"><dt>Capture solution</dt><dd>${r.captureSolution}</dd></div>
      <div class="record-row"><dt>Agreed accuracy</dt><dd>${r.tolerances.accuracy}</dd></div>
      <div class="record-row"><dt>Agreed resolution</dt><dd>${r.tolerances.resolution}</dd></div>
      <div class="record-row"><dt>Agreed error</dt><dd>${r.tolerances.error}</dd></div>
      <div class="record-row"><dt>Camera &amp; lens</dt><dd>${eq.cameraLens}</dd></div>
      <div class="record-row"><dt>Sensor output</dt><dd>${eq.sensorOutput}</dd></div>
      <div class="record-row"><dt>Lighting</dt><dd>${eq.lighting}</dd></div>
      <div class="record-row"><dt>Colour profile</dt><dd>${eq.colourProfile}</dd></div>
      <div class="record-row"><dt>Colour target</dt><dd>${eq.colourTarget}</dd></div>
      <div class="record-row"><dt>Scale</dt><dd>${eq.scaleType}, ${eq.scaleLength} reference</dd></div>
      <div class="record-row"><dt>Pixel count</dt><dd>${eq.pixelCount}</dd></div>
      <div class="record-row"><dt>GSD</dt><dd>${eq.gsd}</dd></div>
    </dl>

    <p class="record-section-label">Acquisition, by chunk</p>
    <div class="stage-table-wrap">
      <table class="stage-table results-table">
        <thead>
          <tr><th scope="col">Chunk</th><th scope="col">Exposure</th><th scope="col">Optics &amp; focus</th><th scope="col">Rotational steps</th><th scope="col">Images</th></tr>
        </thead>
        <tbody>${acquisitionRows}</tbody>
      </table>
    </div>

    <p class="record-section-label">Processing &amp; derived assets</p>
    <dl>
      <div class="record-row"><dt>Software</dt><dd>${r.processingSoftware}</dd></div>
    </dl>
    <div class="stage-table-wrap">
      <table class="stage-table results-table results-table--wide">
        <thead>
          <tr><th scope="col">Asset</th><th scope="col">Mesh</th><th scope="col">Alignment</th><th scope="col">Tie points</th><th scope="col">Vertices</th><th scope="col">Faces</th><th scope="col">Filename</th><th scope="col">Format</th><th scope="col">Size</th></tr>
        </thead>
        <tbody>${assetRows}</tbody>
      </table>
    </div>`;
}

function buildObjectPage(obj, template) {
  const materialsNote = materialsNoteHTML(obj);

  return fill(template, {
    HERO: heroHTML("../", "collection"),
    TITLE: obj.title,
    ID: obj.id,
    TYPE: obj.type,
    USE: obj.use,
    TEASER: obj.story[0].slice(0, 155) + "…",
    CHRONOLOGY: obj.chronology,
    CHRONOLOGY_SHORT: chronologyShort(obj.chronology),
    GEOGRAPHY: obj.country,
    MATERIALS: obj.materials,
    MATERIALS_NOTE: materialsNote,
    MEASUREMENTS: obj.measurements,
    WEIGHT: obj.weight,
    CONDITION: obj.condition,
    INTEGRITY: obj.integrity,
    CAPTURE_DATE: obj.captureDate,
    COMPLEXITY: complexityValue(obj.complexity, "object"),
    COMPLEXITY_SURFACE: complexityValue(obj.complexity, "surface"),
    COMPLEXITY_MATERIAL: complexityValue(obj.complexity, "material"),
    GEOMETRIC_DATA: geometricDataText(obj.fullRecord),
    SOFTWARE: obj.software,
    SKETCHFAB_UID: obj.sketchfabUid,
    STORY: storyHTML(obj.story),
    PROVENANCE: provenanceHTML(obj.provenance),
    FULL_RECORD: fullRecordHTML(obj),
    THEME_TOGGLE: themeToggleHTML(),
    THEME_INIT: themeInitScript(),
    FOOTER_META: footerMetaHTML(),
  });
}

/* Per-object data for the Collection page's detail modal — same tier-1/2
 * fields as the standalone object page, pre-rendered to HTML fragments so
 * the client JS only has to inject innerHTML, not re-implement the markup
 * rules here. Deliberately excludes fullRecord — the modal always sends
 * visitors to the object's own page for that (see decision #1). `digitisedIn`
 * is the one field that only exists here, not on the object page's Full
 * record (which has its own, more detailed "Digitisation campaign" row). */
function buildObjectsDataJSON(objects) {
  const data = objects.map((obj) => ({
    id: obj.id,
    slug: obj.slug,
    title: obj.title,
    type: obj.type,
    use: obj.use,
    chronology: obj.chronology,
    chronologyShort: chronologyShort(obj.chronology),
    geography: obj.country,
    materialsHTML: obj.materials + materialsNoteHTML(obj),
    measurements: obj.measurements,
    weight: obj.weight,
    condition: obj.condition,
    integrity: obj.integrity,
    digitisedIn: `${obj.campaign.label} - ${obj.campaign.digitisedDate}`,
    complexity: complexityValue(obj.complexity, "object"),
    complexitySurface: complexityValue(obj.complexity, "surface"),
    complexityMaterial: complexityValue(obj.complexity, "material"),
    geometricData: geometricDataText(obj.fullRecord),
    software: obj.software,
    sketchfabUid: obj.sketchfabUid,
    storyHTML: storyHTML(obj.story),
    provenanceHTML: provenanceHTML(obj.provenance),
  }));
  // Defuse a literal "</script" inside any authored field so it can't
  // terminate the embedding <script type="application/json"> early.
  return JSON.stringify(data).replace(/<\/script/gi, "<\\/script");
}

/* ---------- Main ---------- */

function main() {
  const dataErrors = validateData();
  if (dataErrors.length) {
    console.error(
      `Build aborted — data validation failed with ${dataErrors.length} error(s):\n`,
    );
    dataErrors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  const objects = loadResolvedObjects();

  const landingTemplate = readFile(path.join(ROOT, "templates", "index.html"));
  const aboutTemplate = readFile(path.join(ROOT, "templates", "about.html"));
  const collectionTemplate = readFile(
    path.join(ROOT, "templates", "collection.html"),
  );
  const objectTemplate = readFile(path.join(ROOT, "templates", "object.html"));

  fs.rmSync(DOCS, { recursive: true, force: true });
  fs.mkdirSync(path.join(DOCS, "objects"), { recursive: true });
  fs.mkdirSync(path.join(DOCS, "assets"), { recursive: true });
  fs.mkdirSync(path.join(DOCS, "assets", "img", "lab-notes"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(DOCS, "assets", "img", "about"), { recursive: true });

  fs.copyFileSync(
    path.join(ROOT, "assets", "styles.css"),
    path.join(DOCS, "assets", "styles.css"),
  );
  fs.copyFileSync(
    path.join(ROOT, "assets", "site.js"),
    path.join(DOCS, "assets", "site.js"),
  );

  const labImgDir = path.join(ROOT, "assets", "img", "lab-notes");
  if (fs.existsSync(labImgDir)) {
    for (const file of fs.readdirSync(labImgDir)) {
      fs.copyFileSync(
        path.join(labImgDir, file),
        path.join(DOCS, "assets", "img", "lab-notes", file),
      );
    }
  }

  const aboutImgDir = path.join(ROOT, "assets", "img", "about");
  if (fs.existsSync(aboutImgDir)) {
    for (const file of fs.readdirSync(aboutImgDir)) {
      fs.copyFileSync(
        path.join(aboutImgDir, file),
        path.join(DOCS, "assets", "img", "about", file),
      );
    }
  }

  // Landing-page background video + poster (large-screen flourish, see
  // assets/site.js). Committed pre-encoded web assets, copied verbatim.
  const videoDir = path.join(ROOT, "assets", "video");
  if (fs.existsSync(videoDir)) {
    fs.mkdirSync(path.join(DOCS, "assets", "video"), { recursive: true });
    for (const file of fs.readdirSync(videoDir)) {
      fs.copyFileSync(
        path.join(videoDir, file),
        path.join(DOCS, "assets", "video", file),
      );
    }
  }

  fs.writeFileSync(
    path.join(DOCS, "index.html"),
    buildLandingPage(landingTemplate),
  );
  fs.writeFileSync(
    path.join(DOCS, "about.html"),
    buildAboutPage(aboutTemplate),
  );
  fs.writeFileSync(
    path.join(DOCS, "collection.html"),
    buildCollectionPage(collectionTemplate, objects),
  );

  for (const obj of objects) {
    const html = buildObjectPage(obj, objectTemplate);
    fs.writeFileSync(path.join(DOCS, "objects", `${obj.slug}.html`), html);
  }

  fs.writeFileSync(path.join(DOCS, ".nojekyll"), "");

  console.log(
    `Built landing, about, collection + ${objects.length} object pages into /docs`,
  );
  const missing = objects.filter(
    (o) => o.sketchfabUid === "REPLACE_WITH_SKETCHFAB_UID",
  );
  if (missing.length) {
    console.log(
      `\nReminder: ${missing.length} object(s) still need a real Sketchfab UID in data/objects.json:`,
    );
    missing.forEach((o) => console.log(`  - ${o.id} (${o.slug})`));
  }
  console.log(
    "Reminder: Documentation links on the About page still use REPLACE_WITH_LINK placeholders.",
  );
}

if (require.main === module) main();

module.exports = { build: main };
