/* Pre-paint theme bootstrap.

   The visible theme control lives in the study dock (assets/enhancements.js).
   This file only restores the saved choice before the first paint, so the page
   never flashes the wrong theme. It must stay in sync with the dock: same
   storage key, same theme names. Load it without `defer` so it runs first. */
(function () {
  'use strict';

  var STORAGE_KEY = 'bfp_theme_mode';
  var THEMES = ['default', 'dark', 'light'];
  var THEME_COLORS = { default: '#f3ede2', dark: '#17120e', light: '#ffffff' };

  // Light is the default for a first visit. The OS `prefers-color-scheme` hint
  // is deliberately not consulted: a saved choice wins, and everyone else gets
  // light. (With JS off no data-theme is set and the CSS falls back to the
  // parchment `:root` baseline, which is what the static theme-color matches.)
  var theme = 'light';

  try {
    var saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'paper' || saved === 'neutral') saved = 'default';
    if (saved && THEMES.indexOf(saved) !== -1) theme = saved;
  } catch (_) { /* storage blocked: keep the default theme */ }

  document.documentElement.setAttribute('data-theme', theme);
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME_COLORS[theme]);
}());
