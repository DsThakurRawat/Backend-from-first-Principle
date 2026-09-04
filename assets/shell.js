/* Backend from First Principles, page shell behaviour.
   Replaces the 20-odd per-chapter table-of-contents scripts with one
   implementation: drawer toggle plus scroll spy. */
(function () {
  'use strict';

  var toc = document.querySelector('.bfp-toc');
  if (!toc) return;

  /* ---------- home link ---------- */
  var home = document.createElement('a');
  home.className = 'bfp-home-link';
  home.href = '../../index.html';
  home.innerHTML = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12.5" y1="8" x2="2.5" y2="8"/><polyline points="6.5,4 2.5,8 6.5,12"/></svg><span>Home</span>';
  toc.insertBefore(home, toc.firstChild);

  var toggle = document.querySelector('.bfp-toc-toggle');
  var scrim = document.querySelector('.bfp-toc-scrim');
  var links = [].slice.call(document.querySelectorAll('.bfp-toc-link'));

  /* ---------- drawer ---------- */
  function setOpen(open) {
    toc.classList.toggle('is-open', open);
    document.body.classList.toggle('bfp-toc-open', open);
    if (scrim) scrim.classList.toggle('is-open', open);
    if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open && window.matchMedia('(max-width: 1000px)').matches ? 'hidden' : '';
  }

  if (toggle) toggle.addEventListener('click', function () { setOpen(!toc.classList.contains('is-open')); });
  if (scrim) scrim.addEventListener('click', function () { setOpen(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && toc.classList.contains('is-open')) setOpen(false);
  });
  /* On the mobile drawer, picking a link should close it. On desktop the
     panel pushes the content rather than covering it, so leave it open. */
  links.forEach(function (l) {
    l.addEventListener('click', function () {
      if (window.matchMedia('(max-width: 1000px)').matches) setOpen(false);
    });
  });

  /* ---------- scroll spy ---------- */
  var byId = {};
  var targets = [];
  links.forEach(function (l) {
    var href = l.getAttribute('href') || '';
    if (href.charAt(0) !== '#' || href.length < 2) return;
    var el = document.getElementById(href.slice(1));
    if (!el) return;
    byId[href.slice(1)] = l;
    targets.push(el);
  });
  if (!targets.length) return;

  var current = null;
  function activate(link) {
    if (link === current) return;
    if (current) current.classList.remove('is-active');
    if (link) link.classList.add('is-active');
    current = link;
    if (link && toc.scrollHeight > toc.clientHeight && !toc.matches(':hover')) {
      var tocRect = toc.getBoundingClientRect();
      var linkRect = link.getBoundingClientRect();
      var buffer = 48;
      if (linkRect.top < tocRect.top + buffer || linkRect.bottom > tocRect.bottom - buffer) {
        var top = toc.scrollTop + (linkRect.top - tocRect.top) - (tocRect.height / 2 - linkRect.height / 2);
        var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        toc.scrollTo({ top: Math.max(0, top), behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      }
    }
  }

  function pick() {
    var line = window.scrollY + window.innerHeight * 0.22;
    var best = null;
    for (var i = 0; i < targets.length; i++) {
      var t = targets[i];
      if (t.getBoundingClientRect().top + window.scrollY <= line) best = t;
    }
    if (!best && targets.length) best = targets[0];
    activate(best ? byId[best.id] : null);
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () { pick(); ticking = false; });
  }, { passive: true });
  window.addEventListener('resize', pick, { passive: true });
  pick();
})();