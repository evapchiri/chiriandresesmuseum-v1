/**
 * Chiriandreses Museum — shared site behaviour.
 * No dependencies. Each block checks for its own DOM hook and does nothing
 * on pages where that hook isn't present, so this one file can be included
 * on every page.
 */

document.addEventListener('DOMContentLoaded', () => {
  initCursorTooltips();
  initAboutTabs();
  initAboutNav();
  initBackToTop();
  initAboutRefFlash();
  initFolderTabs();
  initAboutCarousel();
  initExpandableFigures();
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

/* ---------- About page: tab-style sidebar (swap panel, reset scroll) ---------- */

function initAboutTabs() {
  const nav = document.querySelector('.about-nav');
  if (!nav) return;

  const buttons = nav.querySelectorAll('[data-panel]');
  const panels = document.querySelectorAll('[data-panel-content]');

  // After switching panel: on wide layouts jump back to the very top; on
  // narrow ones scroll just far enough to tuck the hero away, leaving the
  // section's own <h2> near the top of the viewport. Honours the CSS
  // `scroll-behavior` (smooth, or instant under prefers-reduced-motion)
  // by not passing an explicit behavior.
  function repositionForPanel() {
    if (window.innerWidth > 900) {
      window.scrollTo(0, 0);
      return;
    }
    const anchor = document.querySelector('.about-main');
    if (!anchor) {
      window.scrollTo(0, 0);
      return;
    }
    const y = anchor.getBoundingClientRect().top + window.scrollY - 10;
    window.scrollTo(0, Math.max(0, y));
  }

  function selectPanel(target, btn) {
    buttons.forEach((b) => {
      const isActive = b === btn;
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-selected', String(isActive));
    });
    panels.forEach((p) => {
      p.hidden = p.dataset.panelContent !== target;
    });

    const activePanel = document.querySelector(`[data-panel-content="${target}"]`);
    if (activePanel) activePanel.focus({ preventScroll: true });
    repositionForPanel();
  }

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => selectPanel(btn.dataset.panel, btn));
  });

  // In-content cross-references, e.g. "see the Project archive" from deep
  // inside another panel (Stage-by-stage, Lessons learned, ...): jump the
  // reader to that section the same way clicking its sidebar tab would.
  document.querySelectorAll('[data-panel-jump]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const target = link.dataset.panelJump;
      const btn = nav.querySelector(`[data-panel="${target}"]`);
      if (!btn) return;
      e.preventDefault();
      selectPanel(target, btn);
    });
  });
}

/* ---------- About-me: flash the footnote target(s) on jump ----------
 * The "*n" superscript links in the About-me narrative jump to a bullet in
 * the "Other relevant experience" / "Awards & recognition" lists, which sit
 * dimmed (ink-soft) at rest. On click, briefly lift the destination bullet
 * to full ink + a faint brass wash so the eye lands on it once the smooth
 * scroll settles. Pure affordance; no-ops where the panel isn't present.
 *
 * A couple of spots in the narrative have two footnote markers sitting right
 * next to each other (e.g. "*3,4"); those are authored as one merged link
 * with a data-ref-also="other-id" attribute, so a single click flashes both
 * destinations together instead of the reader clicking one, landing on it,
 * and never realising the other reference exists. */

function initAboutRefFlash() {
  const panel = document.getElementById('panel-about-me');
  if (!panel) return;

  let active = [];
  function flash(elements) {
    // Cancel whatever was still highlighted from a previous click.
    active.forEach(({ el, timer }) => {
      clearTimeout(timer);
      el.classList.remove('about-ref-flash');
    });
    // A merged pair flashes a little longer than a single reference — the two
    // targets can sit far apart on the page, so the reader needs more time to
    // scroll from one to the other while both are still lit.
    const duration = elements.length > 1 ? 4200 : 2700;
    active = elements.map((el) => {
      void el.offsetWidth; // reflow, so a repeat click restarts the animation
      el.classList.add('about-ref-flash');
      return { el, timer: setTimeout(() => el.classList.remove('about-ref-flash'), duration) };
    });
  }

  panel.querySelectorAll('#main-text a[href^="#"]').forEach((link) => {
    const extraIds = (link.dataset.refAlso || '').split(/\s+/).filter(Boolean);
    const ids = [link.getAttribute('href').slice(1), ...extraIds];
    link.addEventListener('click', () => {
      flash(ids.map((id) => document.getElementById(id)).filter(Boolean));
    });
  });
}

/* ---------- About page: collapsed sidebar → centred popup ----------
 * On wide viewports the About sidebar is a normal sticky column and this does
 * nothing visible. Below the CSS breakpoint (≤900px) the sidebar is styled as
 * a centred popup: this adds the `nav-drawer` marker class (so the CSS only
 * engages when JS is here to drive it), builds the backdrop and the icon-only
 * floating trigger, and toggles `nav-open`. Opening/closing is driven by the
 * "Explore the project" pill, the floating button (which fades in once the
 * pill scrolls out of view), the cancel button, a backdrop tap, the Escape
 * key, and picking a section. If JS is off, the CSS falls back to a plain
 * stacked nav. */

function initAboutNav() {
  const layout = document.querySelector('.about-layout');
  const nav = document.querySelector('.about-nav');
  const toggle = document.querySelector('.about-nav-toggle');
  const closeBtn = document.querySelector('.about-nav-close');
  if (!layout || !nav || !toggle || !closeBtn) return;

  layout.classList.add('nav-drawer');

  const backdrop = document.createElement('div');
  backdrop.className = 'about-nav-backdrop';
  layout.appendChild(backdrop);

  // Icon-only trigger, fixed bottom-right, revealed on scroll (see updateFab).
  const fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'about-nav-fab';
  fab.setAttribute('aria-label', 'Explore the project');
  document.body.appendChild(fab);

  // "Back to top" companion, stacked just above the nav FAB. Shares the FAB's
  // reveal condition so the two read as a pair; jumps to the very top of the
  // page, hero included.
  const topFab = document.createElement('button');
  topFab.type = 'button';
  topFab.className = 'about-top-fab';
  topFab.setAttribute('aria-label', 'Back to top');
  document.body.appendChild(topFab);
  topFab.addEventListener('click', () => window.scrollTo({ top: 0 }));

  const drawerMode = window.matchMedia('(max-width: 900px)');
  let pillOnScreen = true;
  let opener = toggle;

  const isOpen = () => layout.classList.contains('nav-open');

  // Both FABs show only while collapsed, scrolled past the pill, and closed.
  function updateFab() {
    const show = drawerMode.matches && !pillOnScreen && !isOpen();
    fab.classList.toggle('visible', show);
    topFab.classList.toggle('visible', show);
  }

  function open(via) {
    opener = via || toggle;
    layout.classList.add('nav-open');
    toggle.setAttribute('aria-expanded', 'true');
    updateFab();
    closeBtn.focus();
  }

  function close({ restoreFocus = false } = {}) {
    if (!isOpen()) return;
    layout.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    updateFab();
    if (restoreFocus) {
      const target = opener === fab && !fab.classList.contains('visible') ? toggle : opener;
      target.focus();
    }
  }

  toggle.addEventListener('click', () => (isOpen() ? close() : open(toggle)));
  fab.addEventListener('click', () => (isOpen() ? close() : open(fab)));
  closeBtn.addEventListener('click', () => close({ restoreFocus: true }));
  backdrop.addEventListener('click', () => close({ restoreFocus: true }));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) close({ restoreFocus: true });
  });

  // Picking a section dismisses the popup (it stays put on wide layouts,
  // where the popup chrome is hidden and this class is inert anyway).
  nav.addEventListener('click', (e) => {
    if (drawerMode.matches && e.target.closest('[data-panel]')) close();
  });

  drawerMode.addEventListener('change', (e) => {
    if (!e.matches) close();
    updateFab();
  });

  // Reveal the FAB once the in-flow pill has scrolled out of view.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      pillOnScreen = entries[0].isIntersecting;
      updateFab();
    }, { rootMargin: '-8px 0px 0px 0px' }).observe(toggle);
  }
}

/* ---------- Back-to-top bubble ----------
 * A standalone floating control that returns the reader to the very top of the
 * page, hero included. Revealed once the hero has scrolled out of view. The
 * About page has its own version, paired with the nav FAB (see initAboutNav),
 * so this one bows out there to avoid a duplicate.  */

function initBackToTop() {
  if (document.querySelector('.about-layout')) return;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'back-to-top';
  btn.setAttribute('aria-label', 'Back to top');
  document.body.appendChild(btn);
  btn.addEventListener('click', () => window.scrollTo({ top: 0 }));

  const hero = document.querySelector('.site-hero');
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      btn.classList.toggle('visible', !entries[0].isIntersecting);
    }, { rootMargin: '-8px 0px 0px 0px' }).observe(hero);
  } else {
    const onScroll = () =>
      btn.classList.toggle('visible', window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
}

/* ---------- Folder tabs (filing-folder strip inside an About panel) ----------
 * A second, self-contained tab layer nested inside one of the About page's
 * panels (used by Lab notes to split the log by date). Scoped to each
 * [data-folder-tabs] block so it never collides with the outer About nav:
 * the outer nav keys off .about-nav / [data-panel-content], this keys off
 * role="tab"/"tabpanel" within its own root. Ships with the first tab active
 * and the rest hidden, so it still reads fine with JS disabled. */

function initFolderTabs() {
  document.querySelectorAll('[data-folder-tabs]').forEach((root) => {
    const tabs = [...root.querySelectorAll('[role="tab"]')];
    if (!tabs.length) return;

    // The Stage-by-stage strip is a full-page navigation: switching stage
    // should drop the reader back to the top of the About content (hero
    // tucked away) so each stage is read from its own beginning. Other
    // folder-tab strips (Lab journal dates) stay where they are.
    const isPageNav = root.classList.contains('stage-nav');
    function scrollPastHero() {
      const anchor = document.querySelector('.about-main');
      const y = anchor
        ? anchor.getBoundingClientRect().top + window.scrollY - 10
        : 0;
      window.scrollTo(0, Math.max(0, y));
    }

    function select(tab, { focus = false } = {}) {
      tabs.forEach((t) => {
        const on = t === tab;
        t.classList.toggle('active', on);
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
    }

    root.addEventListener('click', (e) => {
      const tab = e.target.closest('[role="tab"]');
      if (!tab) return;
      select(tab);
      if (isPageNav) scrollPastHero();
    });

    root.addEventListener('keydown', (e) => {
      const i = tabs.indexOf(document.activeElement);
      if (i === -1) return;
      let next = null;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      if (next === null) return;
      e.preventDefault();
      select(tabs[next], { focus: true });
    });
  });
}

/* ---------- About page: "About me" image carousel ----------
 * One-file, no-dependency slider. Progressive enhancement: markup ships
 * showing the first slide and its caption; if there's more than one slide
 * this wires up prev/next, dot controls, left/right arrow keys, and a
 * click-to-enlarge lightbox (an in-page popup, not a new page) that pages
 * through the same images. */

function initAboutCarousel() {
  document.querySelectorAll('[data-carousel]').forEach((root) => {
    const track = root.querySelector('.carousel-track');
    const slides = [...root.querySelectorAll('.carousel-slide')];
    const caption = root.querySelector('[data-carousel-caption]');
    const dotWrap = root.querySelector('.carousel-dots');
    const prev = root.querySelector('.carousel-prev');
    const next = root.querySelector('.carousel-next');
    const viewport = root.querySelector('.carousel-viewport');

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
      if (!lightbox.hidden) renderLightbox();
    }

    /* ---- Lightbox (in-page popup) ---- */

    const lightbox = document.createElement('div');
    lightbox.className = 'carousel-lightbox';
    lightbox.hidden = true;
    lightbox.innerHTML =
      '<div class="lightbox-dialog" role="dialog" aria-modal="true" aria-label="Enlarged image" tabindex="-1">' +
      '<button class="lightbox-close" type="button" aria-label="Close">&times;</button>' +
      '<button class="lightbox-nav lightbox-prev" type="button" aria-label="Previous image">&#8249;</button>' +
      '<figure class="lightbox-figure"><img class="lightbox-img" alt=""><figcaption class="lightbox-caption"></figcaption></figure>' +
      '<button class="lightbox-nav lightbox-next" type="button" aria-label="Next image">&#8250;</button>' +
      '</div>';
    document.body.appendChild(lightbox);

    const lbImg = lightbox.querySelector('.lightbox-img');
    const lbCaption = lightbox.querySelector('.lightbox-caption');
    const lbDialog = lightbox.querySelector('.lightbox-dialog');
    let lbReturnFocus = null;

    function renderLightbox() {
      const img = slides[index].querySelector('img');
      lbImg.src = img.src;
      lbImg.alt = img.alt || '';
      lbCaption.textContent = img.dataset.caption || img.alt || '';
    }

    function openLightbox() {
      renderLightbox();
      lbReturnFocus = document.activeElement;
      lightbox.hidden = false;
      document.body.classList.add('modal-open');
      lbDialog.focus({ preventScroll: true });
    }

    function closeLightbox() {
      if (lightbox.hidden) return;
      lightbox.hidden = true;
      document.body.classList.remove('modal-open');
      if (lbReturnFocus) lbReturnFocus.focus();
    }

    const expandBtn = document.createElement('button');
    expandBtn.type = 'button';
    expandBtn.className = 'carousel-expand';
    expandBtn.setAttribute('aria-label', 'View image larger');
    expandBtn.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9V4h5M20 15v5h-5M15 4h5v5M9 20H4v-5"/></svg>';
    expandBtn.addEventListener('click', openLightbox);
    viewport.appendChild(expandBtn);

    slides.forEach((slide) => {
      const img = slide.querySelector('img');
      if (img) img.addEventListener('click', openLightbox);
    });

    lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
    lightbox.querySelector('.lightbox-prev').addEventListener('click', () => go(index - 1));
    lightbox.querySelector('.lightbox-next').addEventListener('click', () => go(index + 1));
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
    lightbox.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closeLightbox(); return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); go(index - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); go(index + 1); }
      else if (e.key === 'Tab') {
        const f = [...lightbox.querySelectorAll('button')];
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    prev.addEventListener('click', () => go(index - 1));
    next.addEventListener('click', () => go(index + 1));
    root.addEventListener('keydown', (e) => {
      if (!lightbox.hidden) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
    });

    go(0);
  });
}

/* ---------- Expandable figures ----------
 * Any figure[data-expandable] holding an <img> gets a discoverable corner
 * "expand" button plus click-to-enlarge on the image itself, opening one
 * shared in-page lightbox (same look as the About-me carousel's, minus the
 * paging). Progressive enhancement: with JS off the figure is just a figure.
 * Scroll lock reuses body.modal-open. */

function initExpandableFigures() {
  const figures = [...document.querySelectorAll('figure[data-expandable]')];
  if (!figures.length) return;

  const lightbox = document.createElement('div');
  lightbox.className = 'carousel-lightbox';
  lightbox.hidden = true;
  lightbox.innerHTML =
    '<div class="lightbox-dialog" role="dialog" aria-modal="true" aria-label="Enlarged image" tabindex="-1">' +
    '<button class="lightbox-close" type="button" aria-label="Close">&times;</button>' +
    '<figure class="lightbox-figure"><img class="lightbox-img" alt=""><figcaption class="lightbox-caption"></figcaption></figure>' +
    '</div>';
  document.body.appendChild(lightbox);

  const lbImg = lightbox.querySelector('.lightbox-img');
  const lbCaption = lightbox.querySelector('.lightbox-caption');
  const lbDialog = lightbox.querySelector('.lightbox-dialog');
  const lbClose = lightbox.querySelector('.lightbox-close');
  let returnFocus = null;

  function openLightbox(img, captionText) {
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt || '';
    lbCaption.textContent = captionText || '';
    returnFocus = document.activeElement;
    lightbox.hidden = false;
    document.body.classList.add('modal-open');
    lbDialog.focus({ preventScroll: true });
  }

  function closeLightbox() {
    if (lightbox.hidden) return;
    lightbox.hidden = true;
    document.body.classList.remove('modal-open');
    if (returnFocus) returnFocus.focus();
  }

  lbClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  lightbox.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeLightbox(); return; }
    /* only two focusables (dialog + close) — keep focus inside */
    if (e.key === 'Tab') {
      e.preventDefault();
      (document.activeElement === lbClose ? lbDialog : lbClose).focus();
    }
  });

  figures.forEach((fig) => {
    const img = fig.querySelector('img');
    if (!img) return;
    const capEl = fig.querySelector('figcaption');
    const captionText = (capEl && capEl.textContent.trim()) || img.alt || '';

    /* wrap just the image so the corner button anchors to the image box,
       not the figure (which also holds the caption below) */
    const frame = document.createElement('span');
    frame.className = 'figure-expand-frame';
    img.insertAdjacentElement('beforebegin', frame);
    frame.appendChild(img);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'figure-expand';
    btn.setAttribute('aria-label', 'View image larger');
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9V4h5M20 15v5h-5M15 4h5v5M9 20H4v-5"/></svg>';
    btn.addEventListener('click', () => openLightbox(img, captionText));
    frame.appendChild(btn);

    img.addEventListener('click', () => openLightbox(img, captionText));
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
    modal.querySelector('#modal-use').textContent = obj.use;
    modal.querySelector('#modal-materials').innerHTML = obj.materialsHTML;
    modal.querySelector('#modal-measurements').textContent = obj.measurements;
    modal.querySelector('#modal-weight').textContent = obj.weight;
    modal.querySelector('#modal-condition').textContent = obj.condition;
    modal.querySelector('#modal-integrity').textContent = obj.integrity;
    modal.querySelector('#modal-chronology').textContent = obj.chronology;
    modal.querySelector('#modal-geography').textContent = obj.geography;
    modal.querySelector('#modal-digitised-in').textContent = obj.digitisedIn;
    modal.querySelector('#modal-captured').textContent = obj.captureDate;
    modal.querySelector('#modal-complexity').textContent = obj.complexity;
    modal.querySelector('#modal-complexity-surface').textContent = obj.complexitySurface;
    modal.querySelector('#modal-complexity-material').textContent = obj.complexityMaterial;
    modal.querySelector('#modal-geometric-data').textContent = obj.geometricData;
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
