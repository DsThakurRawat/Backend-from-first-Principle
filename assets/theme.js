(function () {
  'use strict';

  var STORAGE_KEY = 'bfp-theme';
  var stored = null;
  try { stored = window.localStorage.getItem(STORAGE_KEY); } catch (_) { /* session-only */ }
  var theme = stored === 'dark' || stored === 'light' ? stored : 'light';

  function apply(next) {
    theme = next === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#17120e' : '#f3ede2');
    var button = document.querySelector('[data-theme-toggle]');
    if (button) {
      var nextTheme = theme === 'dark' ? 'light' : 'dark';
      button.textContent = nextTheme === 'dark' ? '☾' : '☀';
      button.setAttribute('aria-label', 'Switch to ' + nextTheme + ' theme');
      button.title = 'Switch to ' + nextTheme + ' theme';
    }
    try { window.localStorage.setItem(STORAGE_KEY, theme); } catch (_) { /* session-only */ }
  }

  // Apply before the body paints to avoid a dark-mode flash.
  document.documentElement.dataset.theme = theme;
  document.addEventListener('DOMContentLoaded', function () {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'theme-toggle';
    button.dataset.themeToggle = 'true';
    button.addEventListener('click', function () { apply(theme === 'dark' ? 'light' : 'dark'); });
    document.body.appendChild(button);
    apply(theme);
  });
}());
