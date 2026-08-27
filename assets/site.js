/**
 * Chiriandreses Museum — shared site behaviour.
 * No dependencies. Each block checks for its own DOM hook and does nothing
 * on pages where that hook isn't present, so this one file can be included
 * on every page.
 */

document.addEventListener('DOMContentLoaded', () => {
  initCursorTooltips();
  initThemeToggle();
  initAboutTabs();
  initCollectionFilters();
  initObjectModal();
  initViewerLoading();
});

/* ---------- Sketchfab viewer: loading sweep while the iframe loads ----------
 * Static object-page frames only need this once; the Collection modal reuses
 * one iframe across objects, so openModal() resets the loading state itself
 * (see initObjectModal below) rather than relying on this initial pass. */

function initViewerLoading() {
  document.querySelectorAll('.viewer-frame iframe').forEach((iframe) => {
    iframe.addEventListener('load', () => {
      iframe.closest('.viewer-frame')?.classList.add('loaded');
    });
  });
}

/* ---------- Theme toggle: manual dark/light choice, persisted ---------- */

function initThemeToggle() {
  const btn = document.querySelector('.theme-toggle');
  if (!btn) return;

  const root = document.documentElement;

  function currentTheme() {
    const stored = root.getAttribute('data-theme');
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  btn.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });
}

/* ---------- Landing page: cursor-following tooltips ---------- */

function initCursorTooltips() {
  const triggers = document.querySelectorAll('[data-tip]');
  if (!triggers.length) return;

  // Only on devices with a real hover-capable pointer (skip touch).
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const tip = document.createElement('div');
  tip.className = 'cursor-tip';
  document.body.appendChild(tip);

  let active = null;

  triggers.forEach((el) => {
    el.addEventListener('mouseenter', () => {
      tip.textContent = el.dataset.tip;
      active = el;
      requestAnimationFrame(() => tip.classList.add('visible'));
    });
    el.addEventListener('mousemove', (e) => {
      tip.style.left = `${e.clientX + 16}px`;
      tip.style.top = `${e.clientY + 16}px`;
    });
    el.addEventListener('mouseleave', () => {
      if (active === el) {
        tip.classList.remove('visible');
        active = null;
      }
    });
  });
}

/* ---------- About page: tab-style sidebar (swap in place, no scroll) ---------- */

function initAboutTabs() {
  const nav = document.querySelector('.about-nav');
  if (!nav) return;

  const buttons = nav.querySelectorAll('[data-panel]');
  const panels = document.querySelectorAll('[data-panel-content]');

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.panel;

      buttons.forEach((b) => {
        const isActive = b === btn;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-selected', String(isActive));
      });
      panels.forEach((p) => {
        p.hidden = p.dataset.panelContent !== target;
      });

      // Keep focus + scroll position sane for keyboard/screen-reader users.
      const activePanel = document.querySelector(`[data-panel-content="${target}"]`);
      if (activePanel) activePanel.focus({ preventScroll: true });
    });
  });
}

/* ---------- Collection page: dropdown filters ---------- */

function initCollectionFilters() {
  const filterBar = document.querySelector('.filter-bar');
  if (!filterBar) return;

  const selects = filterBar.querySelectorAll('select[data-filter]');
  const cards = document.querySelectorAll('.card[data-decade]');
  const emptyState = document.querySelector('.no-results');
  const resetBtn = document.querySelector('.filter-reset');

  function applyFilters() {
    const active = {};
    selects.forEach((s) => {
      if (s.value !== 'all') active[s.dataset.filter] = s.value;
    });

    let visibleCount = 0;
    cards.forEach((card) => {
      const matches = Object.entries(active).every(
        ([key, value]) => card.dataset[key] === value
      );
      card.style.display = matches ? '' : 'none';
      if (matches) visibleCount += 1;
    });

    if (emptyState) emptyState.hidden = visibleCount !== 0;
  }

  selects.forEach((s) => s.addEventListener('change', applyFilters));

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      selects.forEach((s) => { s.value = 'all'; });
      applyFilters();
    });
  }
}

/* ---------- Collection page: object detail modal ----------
 * Cards keep a real href to the standalone object page (works with JS off,
 * and is the actual shareable URL); this intercepts a plain click to open
 * the same content in a scrollable modal instead, with the URL hash kept
 * in sync so the modal is deep-linkable and back/forward work. */

function initObjectModal() {
  const grid = document.querySelector('.grid');
  const modal = document.getElementById('object-modal');
  const dataEl = document.getElementById('objects-data');
  if (!grid || !modal || !dataEl) return;

  const objects = JSON.parse(dataEl.textContent);
  const byId = new Map(objects.map((o) => [o.id.toLowerCase(), o]));

  const panel = modal.querySelector('.modal-panel');
  const closeBtn = modal.querySelector('.modal-close');
  const iframe = modal.querySelector('#modal-iframe');
  const viewerFrame = iframe.closest('.viewer-frame');
  const viewerWrap = modal.querySelector('.viewer-wrap');
  const fieldRecord = modal.querySelector('.field-record');
  let lastFocused = null;

  /* Field record's max-height is set here (not in CSS) so it can match
   * .viewer-wrap's actual rendered height exactly — a pure-CSS grid-stretch
   * approach lets field-record's own tall content inflate the shared row
   * instead of being capped by it, so this needs a real measurement. */
  function syncFieldRecordHeight() {
    if (modal.hidden) return;
    fieldRecord.style.maxHeight = `${viewerWrap.getBoundingClientRect().height}px`;
  }
  window.addEventListener('resize', syncFieldRecordHeight);

  function fillModal(obj) {
    modal.querySelector('#modal-title').textContent = obj.title;
    modal.querySelector('#modal-tags').innerHTML =
      `<span>${obj.id}</span><span>${obj.type}</span><span>${obj.chronologyShort}</span><span>${obj.geography}</span>`;
    iframe.title = `3D model of ${obj.title}`;
    viewerFrame?.classList.remove('loaded');
    iframe.src = `https://sketchfab.com/models/${obj.sketchfabUid}/embed?ui_theme=dark&ui_infos=0`;
    modal.querySelector('#modal-story').innerHTML = obj.storyHTML;
    modal.querySelector('#modal-record-title').textContent = `Field record — ${obj.id}`;
    modal.querySelector('#modal-type').textContent = obj.type;
    modal.querySelector('#modal-materials').innerHTML = obj.materialsHTML;
    modal.querySelector('#modal-measurements').textContent = obj.measurements;
    modal.querySelector('#modal-weight').textContent = obj.weight;
    modal.querySelector('#modal-chronology').textContent = obj.chronology;
    modal.querySelector('#modal-geography').textContent = obj.geography;
    modal.querySelector('#modal-captured').textContent = obj.captureDate;
    modal.querySelector('#modal-complexity').textContent = obj.complexity;
    modal.querySelector('#modal-route').textContent = obj.route;
    modal.querySelector('#modal-software').textContent = obj.software;
    modal.querySelector('#modal-provenance').innerHTML = obj.provenanceHTML;
    modal.querySelector('#modal-full-link').href = `objects/${obj.slug}.html`;
  }

  function openModal(obj, { pushState = true } = {}) {
    fillModal(obj);
    lastFocused = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    panel.focus({ preventScroll: true });
    syncFieldRecordHeight();
    if (pushState) history.pushState({ modal: obj.id }, '', `#${obj.id.toLowerCase()}`);
  }

  function closeModal({ popState = false } = {}) {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    iframe.src = ''; // stop playback/loading once closed
    if (lastFocused) lastFocused.focus();
    if (!popState && location.hash) {
      history.pushState(null, '', location.pathname + location.search);
    }
  }

  grid.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = e.target.closest('a[href^="objects/"]');
    if (!link) return;
    const card = link.closest('.card');
    if (!card) return;
    const obj = byId.get((card.dataset.id || '').toLowerCase());
    if (!obj) return;
    e.preventDefault();
    openModal(obj);
  });

  closeBtn.addEventListener('click', () => closeModal());

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });

  // Minimal focus trap while the modal is open.
  modal.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusable = modal.querySelectorAll('a[href], button, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  window.addEventListener('popstate', () => {
    const hash = location.hash.slice(1).toLowerCase();
    if (hash && byId.has(hash)) {
      openModal(byId.get(hash), { pushState: false });
    } else {
      closeModal({ popState: true });
    }
  });

  // Deep link straight to a modal on first load, e.g. collection.html#chan-001
  const initialHash = location.hash.slice(1).toLowerCase();
  if (initialHash && byId.has(initialHash)) {
    openModal(byId.get(initialHash), { pushState: false });
  }
}
