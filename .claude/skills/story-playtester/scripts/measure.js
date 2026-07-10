// Storyline measurement snippet — paste as the `function` argument of the
// chrome-devtools MCP `evaluate_script` tool on a /s/<slug> player page.
// (In the playground, replace `document` with `iframe.contentDocument`.)
// Returns every static metric of the review checklist in one call.
async () => {
  const el = document.querySelector('[data-slot=storyline]');
  if (!el) return { error: 'no storyline on this page' };

  // Interactive = the widget types that count as "something to touch".
  const INTERACTIVE = new Set([
    'quiz', 'decision-tree', 'checklist', 'tangle-text', 'flashcards',
    'surprise', 'drag-and-drop', 'fill-in-the-blanks', 'predict-output',
    'spot-the-bug', 'profile-quiz', 'hotspots', 'compare-slider', 'scrubber',
  ]);

  const modules = Array.from(el.querySelectorAll('[data-module-index]'));
  // Top-level screens in reading order (direct data-slot descendants of the
  // screen wrappers), with their absolute offsets inside the scroller.
  const screens = [];
  for (const mod of modules) {
    for (const wrap of mod.querySelectorAll(':scope > div > [data-reveal], :scope > div [data-reveal]')) {
      const w = wrap.querySelector('[data-slot]');
      if (!w) continue;
      const slot = w.getAttribute('data-slot');
      if (slot.startsWith('storyline')) continue;
      let top = 0, n = w;
      while (n && n !== el) { top += n.offsetTop; n = n.offsetParent; }
      screens.push({ slot, top, height: w.offsetHeight, module: +mod.dataset.moduleIndex });
    }
  }
  screens.sort((a, b) => a.top - b.top);

  const firstInt = screens.find((s) => INTERACTIVE.has(s.slot));
  const m0top = (() => { let t = 0, n = modules[0]; while (n && n !== el) { t += n.offsetTop; n = n.offsetParent; } return t; })();

  // Passive streaks, in screens and in pixels.
  let streak = [], worst = { screens: 0, px: 0, from: null };
  for (const s of screens) {
    if (INTERACTIVE.has(s.slot)) { streak = []; continue; }
    streak.push(s);
    const px = streak.at(-1).top + streak.at(-1).height - streak[0].top;
    if (streak.length > worst.screens || px > worst.px)
      worst = { screens: streak.length, px: Math.round(px), from: streak[0].slot + '@M' + (streak[0].module + 1) };
  }

  const census = {};
  for (const s of screens) census[s.slot] = (census[s.slot] ?? 0) + 1;
  const proseTypes = ['prose', 'glossary-text'];
  const prosePx = screens.filter((s) => proseTypes.includes(s.slot)).reduce((n, s) => n + s.height, 0);

  return {
    totalScrollPx: el.scrollHeight,
    screens: screens.length,
    pxToFirstInteraction: firstInt ? Math.round(firstInt.top - m0top) : null,
    firstInteraction: firstInt?.slot ?? 'NONE',
    worstPassiveStreak: worst,
    prosePxShare: Math.round((prosePx / el.scrollHeight) * 100) + '%',
    outros: el.querySelectorAll('[data-slot=storyline-module-outro]').length,
    modules: modules.length,
    census,
    coverBadges: el.querySelector('[data-slot=storyline-cover] ul')?.textContent ?? 'NO COVER',
    challengeMeter: el.querySelector('[data-slot=storyline-challenge]')?.textContent ?? null,
    savedProgress: localStorage.getItem('wgt-storyline:' + location.pathname.split('/').pop()),
  };
}
