/**
 * Chiriandreses Museum — shared site behaviour.
 * No dependencies. Each block checks for its own DOM hook and does nothing
 * on pages where that hook isn't present, so this one file can be included
 * on every page.
 */

document.addEventListener('DOMContentLoaded', () => {
  initCursorTooltips();
  initAboutTabs();
  initCollectionFilters();
});

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

      buttons.forEach((b) => b.classList.toggle('active', b === btn));
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
