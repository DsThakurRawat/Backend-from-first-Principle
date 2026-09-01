/* Backend from First Principles, page shell behaviour.
   Replaces the 20-odd per-chapter table-of-contents scripts with one
   implementation: drawer toggle, desktop collapse toggle, in-flow nav relocation,
   and scroll spy. */
(function () {
  'use strict';

  var toc = document.querySelector('.bfp-toc');
  if (!toc) return;

  var shell = document.querySelector('.bfp-shell');
  var content = document.querySelector('.bfp-content');

  /* ---------- Relocate Chapter Navigation into In-Flow Article End ---------- */
  var chapterNav = document.getElementById('chapterNav') || document.querySelector('.chapter-nav');
  if (chapterNav && content) {
    var footer = content.querySelector('.bfp-footer');
    if (footer) {
      content.insertBefore(chapterNav, footer);
    } else {
      content.appendChild(chapterNav);
    }
  }

  /* ---------- Home Link & Sidebar Header Controls ---------- */
  var header = document.createElement('div');
  header.className = 'bfp-toc-header';

  var home = document.createElement('a');
  home.className = 'bfp-home-link';
  home.href = '../../index.html';
  home.innerHTML = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12.5" y1="8" x2="2.5" y2="8"/><polyline points="6.5,4 2.5,8 6.5,12"/></svg><span>Home</span>';

  var collapseBtn = document.createElement('button');
  collapseBtn.className = 'bfp-sidebar-collapse-btn';
  collapseBtn.setAttribute('aria-label', 'Collapse Sidebar (Press [ or Ctrl+\\)');
  collapseBtn.setAttribute('title', 'Collapse Sidebar ([)');
  collapseBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="m16 15-3-3 3-3"/></svg>';

  header.appendChild(home);
  header.appendChild(collapseBtn);
  toc.insertBefore(header, toc.firstChild);

  var toggle = document.querySelector('.bfp-toc-toggle');
  var scrim = document.querySelector('.bfp-toc-scrim');
  var links = [].slice.call(document.querySelectorAll('.bfp-toc-link'));

  /* ---------- Sidebar Collapsed State (Desktop & Mobile) ---------- */
  var STORAGE_SIDEBAR_KEY = 'bfp_sidebar_collapsed';

  function isMobile() {
    return window.matchMedia('(max-width: 1000px)').matches;
  }

  function setSidebarCollapsed(collapsed) {
    if (shell) shell.classList.toggle('sidebar-collapsed', collapsed);
    document.body.classList.toggle('bfp-sidebar-collapsed', collapsed);
    try {
      localStorage.setItem(STORAGE_SIDEBAR_KEY, collapsed ? 'true' : 'false');
    } catch (e) {}
  }

  // Restore saved desktop sidebar preference
  var savedCollapsed = false;
  try {
    savedCollapsed = localStorage.getItem(STORAGE_SIDEBAR_KEY) === 'true';
  } catch (e) {}

  if (savedCollapsed) {
    setSidebarCollapsed(true);
  }

  /* ---------- Drawer / Mobile Open State ---------- */
  function setOpen(open) {
    toc.classList.toggle('is-open', open);
    document.body.classList.toggle('bfp-toc-open', open);
    if (scrim) scrim.classList.toggle('is-open', open);
    if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open && isMobile() ? 'hidden' : '';

    if (!isMobile()) {
      setSidebarCollapsed(!open);
    }
  }

  function toggleSidebar() {
    if (isMobile()) {
      setOpen(!toc.classList.contains('is-open'));
    } else {
      var currentlyCollapsed = shell ? shell.classList.contains('sidebar-collapsed') : false;
      setSidebarCollapsed(!currentlyCollapsed);
    }
  }

  collapseBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    toggleSidebar();
  });

  if (toggle) {
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleSidebar();
    });
  }

  if (scrim) {
    scrim.addEventListener('click', function () {
      setOpen(false);
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) return;
    if (e.key === 'Escape' && toc.classList.contains('is-open')) {
      setOpen(false);
    } else if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
      e.preventDefault();
      toggleSidebar();
    } else if (e.key === '[' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      toggleSidebar();
    }
  });

  /* On the mobile drawer, picking a link should close it. On desktop leave it open. */
  links.forEach(function (l) {
    l.addEventListener('click', function () {
      if (isMobile()) setOpen(false);
    });
  });

  /* ---------- Scroll Spy ---------- */
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
    if (link && toc.scrollHeight > toc.clientHeight) {
      var top = link.offsetTop - toc.clientHeight / 2;
      if (Math.abs(toc.scrollTop - top) > toc.clientHeight / 3) {
        toc.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
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