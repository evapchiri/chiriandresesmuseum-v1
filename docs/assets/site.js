/**
 * Chiriandreses Museum — shared site behaviour.
 * No dependencies. Each block checks for its own DOM hook and does nothing
 * on pages where that hook isn't present, so this one file can be included
 * on every page.
 */

document.addEventListener('DOMContentLoaded', () => {
  initCursorTooltips();
  initAboutTabs();
  initAboutCarousel();
  initCollectionFilters();
  initObjectModal();
  initViewerLoading();
  initLandingBackgroundVideo();
});

/* ---------- Landing page: looping background video ----------
 * Big-screen-only flourish. The <video> ships with no src/poster; we attach
 * them (and start playback) only past a min-width breakpoint and only when
 * the visitor hasn't asked for reduced motion — so narrow or motion-averse
 * viewports never download the media. If the window is later widened past
 * the breakpoint, it starts then. CSS (.landing-bg) hides the element and
 * lays down the scrim; this just governs loading/playback. */

function initLandingBackgroundVideo() {
  const video = document.querySelector('.landing-bg-video');
  if (!video) return;

  const bigScreen = window.matchMedia('(min-width: 1024px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let attached = false;

  const play = () => {
    const p = video.play();
    if (p) p.catch(() => {}); // muted autoplay; poster stays if the browser blocks it
  };

  function attach() {
    if (attached || !bigScreen.matches || reducedMotion.matches) return;
    attached = true;
    // Paths (with a cache-busting ?v=hash) come from build.js via data-* attrs.
    video.poster = video.dataset.poster || 'assets/video/landing-bg-poster.jpg';
    const source = document.createElement('source');
    source.src = video.dataset.src || 'assets/video/landing-bg.mp4';
    source.type = 'video/mp4';
    video.appendChild(source);
    video.load(); // re-run resource selection now that a <source> exists
    video.addEventListener('canplay', play, { once: true });
    play();
  }

  attach();
  bigScreen.addEventListener('change', attach);

  // Resume if playback was deferred while the tab was in the background
  // (e.g. opened in a new tab, or a battery/visibility pause) — it's a
  // silent loop with no controls, so there's nothing a visitor meant to pause.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && attached && video.paused) play();
  });
}

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

/* ---------- About page: "About me" image carousel ----------
 * One-file, no-dependency slider. Progressive enhancement: markup ships
 * showing the first slide and its caption; if there's more than one slide
 * this wires up prev/next, dot controls, and left/right arrow keys. */

function initAboutCarousel() {
  document.querySelectorAll('[data-carousel]').forEach((root) => {
    const track = root.querySelector('.carousel-track');
    const slides = [...root.querySelectorAll('.carousel-slide')];
    const caption = root.querySelector('[data-carousel-caption]');
    const dotWrap = root.querySelector('.carousel-dots');
    const prev = root.querySelector('.carousel-prev');
    const next = root.querySelector('.carousel-next');

    if (slides.length < 2) {
      prev?.remove();
      next?.remove();
      dotWrap?.remove();
      return;
    }

    let index = 0;

    const dots = slides.map((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel-dot';
      dot.setAttribute('aria-label', `Show image ${i + 1} of ${slides.length}`);
      dot.addEventListener('click', () => go(i));
      dotWrap.appendChild(dot);
      return dot;
    });

    function go(to) {
      index = (to + slides.length) % slides.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((d, di) => d.setAttribute('aria-current', String(di === index)));
      const img = slides[index].querySelector('img');
      if (caption && img) caption.textContent = img.dataset.caption || img.alt || '';
    }

    prev.addEventListener('click', () => go(index - 1));
    next.addEventListener('click', () => go(index + 1));
    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
    });

    go(0);
  });
}

/* ---------- Collection page: dropdown filters ---------- */

function initCollectionFilters() {
  const filterBar = document.querySelector('.filter-bar');
  if (!filterBar) return;

  const selects = [...filterBar.querySelectorAll('select[data-filter]')];
  const cards = [...document.querySelectorAll('.card[data-decade]')];
  const emptyState = document.querySelector('.no-results');
  const resetBtn = document.querySelector('.filter-reset');

  // Snapshot each card's filterable values once, keyed by filter name.
  const cardData = cards.map((card) => {
    const values = {};
    selects.forEach((s) => { values[s.dataset.filter] = card.dataset[s.dataset.filter]; });
    return { card, values };
  });

  // The full, build-time option list for each select (minus the "All" entry),
  // kept so the dropdowns can be rebuilt as selections narrow the field.
  const fullOptions = new Map(
    selects.map((s) => [
      s,
      [...s.options]
        .filter((o) => o.value !== 'all')
        .map((o) => ({ value: o.value, label: o.textContent })),
    ])
  );

  // Active selections, optionally ignoring one select (used so a dropdown
  // never constrains its own list of options).
  function selections(exclude) {
    const active = {};
    selects.forEach((s) => {
      if (s === exclude || s.value === 'all') return;
      active[s.dataset.filter] = s.value;
    });
    return active;
  }

  function cardMatches(values, active) {
    return Object.entries(active).every(([key, value]) => values[key] === value);
  }

  // Values of `key` that some card still has once the other active filters
  // are applied — i.e. the options for that dropdown that would return a hit.
  function reachableValues(key, exclude) {
    const others = selections(exclude);
    return new Set(
      cardData
        .filter((d) => cardMatches(d.values, others))
        .map((d) => d.values[key])
    );
  }

  // Rebuild every dropdown so it only offers values that, combined with the
  // other active filters, still return at least one object. A dropdown with
  // no such values is disabled and shows a "No options" placeholder.
  function refreshOptions() {
    // First settle the selections themselves: clear any active choice the
    // others have made impossible, repeating until stable so the result
    // doesn't depend on which dropdown is examined first.
    let changed = true;
    while (changed) {
      changed = false;
      selects.forEach((select) => {
        if (select.value === 'all') return;
        if (!reachableValues(select.dataset.filter, select).has(select.value)) {
          select.value = 'all';
          changed = true;
        }
      });
    }

    // Then rebuild each dropdown's option list from the settled selections.
    selects.forEach((select) => {
      const reachable = reachableValues(select.dataset.filter, select);
      const current = select.value;
      const opts = fullOptions.get(select).filter((o) => reachable.has(o.value));

      select.innerHTML = '';
      if (opts.length === 0) {
        select.appendChild(new Option('No options', 'all', true, true));
        select.disabled = true;
        return;
      }
      select.disabled = false;
      select.appendChild(new Option('All', 'all'));
      opts.forEach((o) => select.appendChild(new Option(o.label, o.value)));
      select.value = current === 'all' || reachable.has(current) ? current : 'all';
    });
  }

  function applyFilters() {
    const active = selections(null);
    let visibleCount = 0;
    cardData.forEach(({ card, values }) => {
      const matches = cardMatches(values, active);
      card.style.display = matches ? '' : 'none';
      if (matches) visibleCount += 1;
    });
    if (emptyState) emptyState.hidden = visibleCount !== 0;
  }

  function update() {
    refreshOptions();
    applyFilters();
  }

  selects.forEach((s) => s.addEventListener('change', update));

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      selects.forEach((s) => { s.value = 'all'; });
      update();
    });
  }

  update();
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
