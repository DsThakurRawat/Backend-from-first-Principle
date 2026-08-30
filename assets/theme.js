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
  var theme = 'default';

  try {
    var saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'paper' || saved === 'neutral') saved = 'default';
    if (saved && THEMES.indexOf(saved) !== -1) theme = saved;
    else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) theme = 'dark';
  } catch (_) { /* storage blocked: keep the default theme */ }

  document.documentElement.setAttribute('data-theme', theme);
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME_COLORS[theme]);
}());
