(function () {
  'use strict';

  // ===== Detect page type =====
  var isHomepage = !!document.getElementById('chapters');
  var isChapter = !!document.getElementById('chapterNav');

  // =============================
  //  CHAPTER PAGE ENHANCEMENTS
  // =============================

  // --- Reading Progress Bar ---
  function initProgressBar() {
    var bar = document.createElement('div');
    bar.className = 'reading-progress-bar';
    bar.style.width = '0%';
    document.body.prepend(bar);
    function update() {
      var scrollTop = window.scrollY;
      var docH = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (docH > 0 ? Math.min((scrollTop / docH) * 100, 100) : 0) + '%';
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

    // --- Keyboard Navigation (arrow keys between chapters) ---
  function getChapterLinks() {
    var nav = document.getElementById('chapterNav');
    if (!nav) return { prev: null, next: null };
    var prev = nav.querySelector('a.nav-chapter-link:not(.nav-next)');
    var next = nav.querySelector('a.nav-chapter-link.nav-next');
    return { prev: prev, next: next };
  }

  function initKeyboardNav() {
    document.addEventListener('keydown', function (e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      var links = getChapterLinks();
      if ((e.key === 'ArrowLeft' || e.code === 'ArrowLeft') && links.prev && links.prev.href) {
        window.location.href = links.prev.href;
      } else if ((e.key === 'ArrowRight' || e.code === 'ArrowRight') && links.next && links.next.href) {
        window.location.href = links.next.href;
      }
    });
  }

  // --- Code Runner (Piston API, supports Go + Python, free, no auth) ---
  var PISTON_URL = 'https://emkc.org/api/v2/piston/execute';

  function initCodeRunner() {
    var blocks = document.querySelectorAll('[data-cb]');
    blocks.forEach(function (block) {
      var pyPanel = block.querySelector('[data-panel="py"]');
      var goPanel = block.querySelector('[data-panel="go"]');

      if (pyPanel) addRunButton(pyPanel, block, 'python', '3.10.0');
      if (goPanel) addRunButton(goPanel, block, 'go', '1.16.2');
    });
  }

  function addRunButton(panel, block, lang, version) {
    var wrap = document.createElement('div');
    wrap.className = 'code-run-wrap';

    var btn = document.createElement('button');
    btn.className = 'code-run-btn';
    btn.textContent = lang === 'python' ? 'Run Python' : 'Run Go';
    btn.setAttribute('data-lang', lang);
    btn.setAttribute('data-version', version);

    btn.addEventListener('click', function () {
      runCode(panel, block, btn, lang, version);
    });
    wrap.appendChild(btn);

    // Add playground link for Go
    if (lang === 'go') {
      var link = document.createElement('a');
      link.className = 'code-playground-link';
      link.href = 'https://go.dev/play/';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Go Playground';
      wrap.appendChild(link);
    }

    panel.appendChild(wrap);
  }

  function runCode(panel, block, btn, lang, version) {
    var codeEl = panel.querySelector('code');
    if (!codeEl) return;
    var code = codeEl.textContent;

    btn.classList.add('loading');
    var origText = btn.textContent;
    btn.textContent = 'Running...';

    // Remove existing output
    var existing = block.querySelectorAll('.code-output-panel');
    existing.forEach(function (e) { e.remove(); });

    fetch(PISTON_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: lang,
        version: version,
        files: [{ content: code }]
      })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var output = '';
        var isErr = false;
        if (data.run) {
          output = (data.run.stdout || '') + (data.run.stderr || '');
          if (data.run.code !== 0) isErr = true;
        } else if (data.message) {
          output = data.message;
          isErr = true;
        }
        showOutput(block, output || '(no output)', isErr);
      })
      .catch(function (err) {
        showOutput(block, 'Execution failed: ' + err.message + '\nTry running locally instead.', true);
      })
      .finally(function () {
        btn.classList.remove('loading');
        btn.textContent = origText;
      });
  }

  function showOutput(block, text, isErr) {
    var el = document.createElement('div');
    el.className = 'code-output-panel' + (isErr ? ' error' : '');
    el.textContent = text;
    block.appendChild(el);
  }

  // ==========================================================================
  //  HOMEPAGE ENHANCEMENTS
  // ==========================================================================

  var CHAPTERS = [
    { n: '01', title: 'HTTP & CORS', time: '3-4 hours', keys: 'http cors headers methods status tls https cookies preflight request response' },
    { n: '02', title: 'Routing in Backend', time: '2-3 hours', keys: 'routing path parameters query strings mux dynamic routes' },
    { n: '03', title: 'Serialization & Deserialization', time: '2-3 hours', keys: 'serialization deserialization json protobuf encoding decoding marshal' },
    { n: '04', title: 'Authentication & Authorization', time: '3-4 hours', keys: 'authentication authorization jwt oauth tokens session cookies rbac' },
    { n: '05', title: 'Validations & Transformations', time: '2-3 hours', keys: 'validation transformation sanitization input schema zod pydantic' },
    { n: '06', title: 'Controllers, Services & Middlewares', time: '2-3 hours', keys: 'controllers services repositories middleware request context layers' },
    { n: '07', title: 'API Design (REST)', time: '3-4 hours', keys: 'api rest restful design versioning pagination hateoas idempotency' },
    { n: '08', title: 'Databases', time: '2-3 hours', keys: 'database postgres sql orm queries transactions connection pooling indexes' },
    { n: '09', title: 'Caching', time: '2-3 hours', keys: 'caching redis memcached cache invalidation ttl lru write-through' },
    { n: '10', title: 'Task Queues & Background Jobs', time: '3-4 hours', keys: 'task queues background jobs workers async redis sidekiq celery' },
    { n: '11', title: 'Full-Text Search (Elasticsearch)', time: '2-3 hours', keys: 'elasticsearch search full-text inverted index fuzzy tokenizer analyzer' },
    { n: '12', title: 'Error Handling & Fault Tolerance', time: '2-3 hours', keys: 'error handling retry circuit breaker fault tolerance resilience fallback' },
    { n: '13', title: 'gRPC & Inter-Service Communication', time: '3-4 hours', keys: 'grpc protobuf microservices inter-service rpc streaming unary' },
    { n: '14', title: 'Configuration Management', time: '2-3 hours', keys: 'configuration environment variables yaml dotenv secrets config management' },
    { n: '15', title: 'Logging & Observability', time: '2-3 hours', keys: 'logging monitoring observability structured logs metrics tracing' },
    { n: '16', title: 'Graceful Shutdown', time: '2-3 hours', keys: 'graceful shutdown signals sigterm sigint sigkill process lifecycle' },
    { n: '17', title: 'Backend Security', time: '2-3 hours', keys: 'security xss csrf sql injection cors csp hsts helmet' },
    { n: '18', title: 'Scaling & Performance (Part 1)', time: '2-3 hours', keys: 'scaling performance horizontal vertical load balancing sharding' },
    { n: '19', title: 'Scaling & Performance (Part 2)', time: '2-3 hours', keys: 'scaling performance cdn rate limiting connection pooling' },
    { n: '20', title: 'Concurrency & Parallelism', time: '2-3 hours', keys: 'concurrency parallelism goroutines asyncio threads io-bound cpu-bound' },
    { n: '21', title: 'Docker, K8s & CI/CD', time: '2-3 hours', keys: 'docker kubernetes k8s cicd containers deployment dockerfile pods' },
    { n: '22', title: 'Automated Testing', time: '2-3 hours', keys: 'testing unit integration e2e test coverage mocking tdd' },
    { n: '23', title: 'Message Brokers & Kafka', time: '2-3 hours', keys: 'kafka message brokers event streaming pub-sub consumers producers topics' },
    { n: '24', title: 'WebSockets & Real-Time', time: '2-3 hours', keys: 'websockets real-time ws upgrade handshake bidirectional persistent' }
  ];

  // --- Search Modal ---
  function initSearch() {
    var overlay = document.getElementById('searchOverlay');
    var input = document.getElementById('searchInput');
    var resultsEl = document.getElementById('searchResults');
    if (!overlay || !input) return;

    var cards = document.querySelectorAll('.chapter-card');
    var activeIdx = -1;

    function openSearch() {
      overlay.classList.add('open');
      input.value = '';
      input.focus();
      renderResults('');
      activeIdx = -1;
    }
    function closeSearch() {
      overlay.classList.remove('open');
      activeIdx = -1;
    }

    document.querySelectorAll('[data-search-trigger]').forEach(function (el) {
      el.addEventListener('click', openSearch);
    });

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeSearch();
    });

    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      }
      if (e.key === 'Escape') closeSearch();
      if (e.key === '/' && !overlay.classList.contains('open') && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        openSearch();
      }
    });

    input.addEventListener('input', function () {
      renderResults(input.value.trim().toLowerCase());
      activeIdx = -1;
    });

    input.addEventListener('keydown', function (e) {
      var items = resultsEl.querySelectorAll('.search-result');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIdx = Math.min(activeIdx + 1, items.length - 1);
        updateActive(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIdx = Math.max(activeIdx - 1, 0);
        updateActive(items);
      } else if (e.key === 'Enter' && activeIdx >= 0 && items[activeIdx]) {
        e.preventDefault();
        items[activeIdx].click();
      }
    });

    function updateActive(items) {
      items.forEach(function (it, i) {
        it.classList.toggle('active', i === activeIdx);
      });
      if (items[activeIdx]) items[activeIdx].scrollIntoView({ block: 'nearest' });
    }

    function renderResults(query) {
      if (!query) {
        resultsEl.innerHTML = '';
        return;
      }
      var matches = [];
      CHAPTERS.forEach(function (ch, i) {
        var haystack = (ch.title + ' ' + ch.keys).toLowerCase();
        if (haystack.indexOf(query) !== -1) {
          matches.push({ ch: ch, idx: i });
        }
      });

      if (matches.length === 0) {
        resultsEl.innerHTML = '<div class="search-no-results">No matching chapters found.</div>';
        return;
      }

      resultsEl.innerHTML = matches.map(function (m) {
        var card = cards[m.idx];
        var href = card ? card.getAttribute('href') : '#';
        return '<a class="search-result" href="' + href + '">' +
          '<span class="sr-num">' + m.ch.n + '</span>' +
          '<span class="sr-title">' + m.ch.title + '</span>' +
          '<span class="sr-meta">' + m.ch.time + '</span>' +
          '</a>';
      }).join('');
    }
  }

  // --- Progress Tracker ---
  function initProgress() {
    var STORAGE_KEY = 'bfp_completed';
    var completed = getCompleted();
    var counterEl = document.getElementById('progressCounter');
    var rows = document.querySelectorAll('.ch-done-btn');

    function getCompleted() {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
      catch (e) { return []; }
    }
    function saveCompleted(arr) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); } catch (e) {}
    }

    function updateCounter() {
      completed = getCompleted();
      if (counterEl) {
        counterEl.innerHTML = '<b>' + completed.length + '</b> of <b>24</b> completed';
      }
    }

    rows.forEach(function (btn) {
      var ch = parseInt(btn.getAttribute('data-ch'), 10);
      if (completed.indexOf(ch) !== -1) btn.classList.add('done');

      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var arr = getCompleted();
        var idx = arr.indexOf(ch);
        if (idx === -1) {
          arr.push(ch);
          btn.classList.add('done');
        } else {
          arr.splice(idx, 1);
          btn.classList.remove('done');
        }
        saveCompleted(arr);
        updateCounter();
      });
    });

    updateCounter();
  }

  // ==========================================================================
  //  THEME ENGINE & TASKBAR DOCK (Neutral -> Dark -> Light)
  // ==========================================================================
  var STORAGE_THEME_KEY = 'bfp_theme_mode';
  var STORAGE_NOTES_KEY = 'bfp_masterclass_notes_v1';
  var THEMES = ['default', 'dark', 'light'];
  var THEME_LABELS = { default: 'Original', neutral: 'Original', paper: 'Original', dark: 'Dark', light: 'Light' };
  var THEME_COLORS = { default: '#f3ede2', dark: '#17120e', light: '#ffffff' };
  var transitionTimer = null;

  // Must match the bootstrap in assets/theme.js: light is the default for a
  // first visit, and the OS `prefers-color-scheme` hint is not consulted.
  function getSavedTheme() {
    try {
      var saved = localStorage.getItem(STORAGE_THEME_KEY);
      if (saved === 'paper' || saved === 'neutral') saved = 'default';
      if (saved && THEMES.indexOf(saved) !== -1) return saved;
    } catch (e) {}
    return 'light';
  }

  function applyTheme(theme, animate) {
    if (theme === 'paper' || theme === 'neutral') theme = 'default';
    if (animate) {
      document.documentElement.classList.add('theme-transitioning');
      if (transitionTimer) clearTimeout(transitionTimer);
      transitionTimer = setTimeout(function () {
        document.documentElement.classList.remove('theme-transitioning');
      }, 300);
    }
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(STORAGE_THEME_KEY, theme); } catch (e) {}

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEME_COLORS[theme] || THEME_COLORS.light);

    var btn = document.getElementById('dockThemeBtn');
    if (btn) {
      btn.innerHTML = THEME_LABELS[theme] || 'Original';
    }
  }

  function cycleTheme() {
    var current = document.documentElement.getAttribute('data-theme') || 'default';
    if (current === 'paper' || current === 'neutral') current = 'default';
    var nextIdx = (THEMES.indexOf(current) + 1) % THEMES.length;
    applyTheme(THEMES[nextIdx], true);
  }

  // Apply theme immediately to prevent FOUC
  applyTheme(getSavedTheme(), false);

  // ==========================================================================
  //  NOTES REPOSITORY & DOM SYNCHRONIZATION
  // ==========================================================================
  
  // ==========================================================================
  //  CONTENT PARSING & NORMALIZATION HELPERS
  // ==========================================================================
  function normalizeExcerptText(rawText, isCode) {
    if (!rawText) return '';
    if (isCode) {
      var lines = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
      while (lines.length && !lines[0].trim()) lines.shift();
      while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
      if (!lines.length) return '';

      var minIndent = Infinity;
      lines.forEach(function (line) {
        if (line.trim()) {
          var match = line.match(/^(\s*)/);
          if (match && match[1].length < minIndent) {
            minIndent = match[1].length;
          }
        }
      });
      if (minIndent > 0 && minIndent !== Infinity) {
        lines = lines.map(function (line) {
          return line.slice(minIndent);
        });
      }
      return lines.join('\n');
    } else {
      var text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      var paragraphs = text.split(/\n\s*\n+/);
      paragraphs = paragraphs.map(function (p) {
        return p.replace(/[\n\r\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
      }).filter(Boolean);
      return paragraphs.join('\n\n');
    }
  }

  function getCleanChapterTitle() {
    var h1 = document.querySelector('h1');
    if (h1) {
      var clone = h1.cloneNode(true);
      clone.querySelectorAll('br, hr, p, div').forEach(function (node) {
        node.replaceWith(document.createTextNode(' ' + node.textContent + ' '));
      });
      clone.querySelectorAll('script, style').forEach(function (node) {
        node.remove();
      });
      var title = (clone.textContent || '').replace(/protocolyour/gi, 'protocol your').replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
      if (title) return title;
    }
    var docTitle = document.title || 'Masterclass Note';
    return docTitle.split(' / ')[0].split(' — ')[0].split(' | ')[0].trim();
  }  var _memStore = {};
  function safeGetItem(key) {
    try { return localStorage.getItem(key); } catch (e) { return _memStore[key] || null; }
  }
  function safeSetItem(key, val) {
    try { localStorage.setItem(key, val); } catch (e) { _memStore[key] = val; }
  }

  var NotesStore = {
    getAll: function () {
      try {
        var list = JSON.parse(safeGetItem(STORAGE_NOTES_KEY) || '[]');
        var seen = {};
        var unique = [];
        list.forEach(function (n) {
          if (!n || !n.text) return;
          if (n.type !== 'custom' && n.type !== 'note') {
            n.text = normalizeExcerptText(n.text, n.type === 'code');
          }
          if (n.chapterTitle) {
            n.chapterTitle = n.chapterTitle.replace(/protocolyour/gi, 'protocol your').replace(/[\r\n\t]+/g, ' ').trim();
          }
          var key = (n.id || '') + '|' + (n.targetId || '') + '|' + (n.chapterTitle || '') + '|' + n.text.substring(0, 80);
          if (!seen[key]) {
            seen[key] = true;
            unique.push(n);
          }
        });
        return unique;
      } catch (e) { return []; }
    },
    saveAll: function (notes) {
      safeSetItem(STORAGE_NOTES_KEY, JSON.stringify(notes));
      updateNotesBadge();
      if (typeof updatePageBookmarkStates === 'function') {
        updatePageBookmarkStates();
      }
    },
    add: function (note) {
      var notes = NotesStore.getAll();
      var exists = notes.some(function (n) {
        if (note.id && n.id === note.id) return true;
        if (note.targetId && n.targetId === note.targetId) return true;
        return (note.type !== 'custom' && note.type !== 'note') && (n.text === note.text && n.chapterTitle === note.chapterTitle);
      });
      if (!exists) {
        notes.unshift(note);
        NotesStore.saveAll(notes);
      }
    },
    remove: function (id) {
      var notes = NotesStore.getAll().filter(function (n) { return n.id !== id; });
      NotesStore.saveAll(notes);
    },
    removeByTargetId: function (targetId) {
      var notes = NotesStore.getAll().filter(function (n) {
        return n.targetId !== targetId && n.cardTargetId !== targetId && (!n.targetId || n.targetId.indexOf(targetId + '_') !== 0);
      });
      NotesStore.saveAll(notes);
    },
    update: function (id, updates) {
      var notes = NotesStore.getAll();
      var target = notes.find(function (n) { return n.id === id; });
      if (target) {
        for (var key in updates) {
          target[key] = updates[key];
        }
        NotesStore.saveAll(notes);
      }
    }
  };

  function getChapterNotesCount() {
    var activeLesson = getActiveLessonInfo();
    var notes = NotesStore.getAll();
    if (!activeLesson.isChapter) return notes.length;
    var count = 0;
    notes.forEach(function (n) {
      if (!n) return;
      if (n.targetId && activeLesson.slug && n.targetId.indexOf(activeLesson.slug) !== -1) {
        count++;
        return;
      }
      if (n.chapterTitle) {
        var ch = n.chapterTitle.toLowerCase();
        if (activeLesson.shortTitle && ch.indexOf(activeLesson.shortTitle.toLowerCase()) !== -1) { count++; return; }
        if (activeLesson.number && (ch.indexOf('chapter ' + activeLesson.number) !== -1 || ch.indexOf('chapter ' + (activeLesson.number < 10 ? '0' + activeLesson.number : activeLesson.number)) !== -1)) { count++; return; }
        if (activeLesson.title && ch.indexOf(activeLesson.title.toLowerCase()) !== -1) { count++; return; }
      }
    });
    return count;
  }

  function updateNotesBadge() {
    var count = getChapterNotesCount();
    var badge = document.getElementById('dockNotebookBadge');
    if (badge) badge.textContent = count;
  }

  function initFloatingDock() {
    if (document.getElementById('masterclassDock')) return;

    var currentTheme = document.documentElement.getAttribute('data-theme') || 'default';

    var dock = document.createElement('nav');
    dock.className = 'masterclass-dock-bar';
    dock.id = 'masterclassDock';
    dock.setAttribute('aria-label', 'Study Controls and Quick Navigation');

    var count = getChapterNotesCount();
    var html = '<button class="dock-btn dock-theme-btn" id="dockThemeBtn" aria-label="Switch color theme (Original / Dark / Light)" title="Switch Theme (Original / Dark / Light)">' +
      (THEME_LABELS[currentTheme] || 'Original') +
      '</button>' +
      '<button class="dock-btn dock-notebook-btn" id="dockNotebookBtn" aria-label="Open Study Notes (Alt+N)" aria-haspopup="dialog" aria-expanded="false" title="Toggle Study Notes (Alt+N)">' +
      'Notes <span class="dock-badge" id="dockNotebookBadge" aria-label="' + count + ' notes">' + count + '</span>' +
      '</button>' +
      '<button class="dock-btn dock-top-btn" id="dockTopBtn" title="Scroll to Top" aria-label="Scroll to top of page">' +
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>' +
      '</button>';

    dock.innerHTML = html;
    document.body.appendChild(dock);

    document.getElementById('dockThemeBtn').addEventListener('click', cycleTheme);
    document.getElementById('dockNotebookBtn').addEventListener('click', toggleNotesSidebar);
    document.getElementById('dockTopBtn').addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Global helper for resetting notes
  window.masterclassClearAllNotes = function () {
    try {
      localStorage.removeItem(STORAGE_NOTES_KEY);
      localStorage.removeItem(STORAGE_LESSON_DOCS_KEY);
      localStorage.removeItem(STORAGE_LESSON_ASSETS_KEY);
      localStorage.removeItem('bfp_diagram_assets_v1');
    } catch (e) {}
    _memStore = {};
    updateNotesBadge();
    updatePageBookmarkStates();
    var textarea = document.getElementById('lessonNotepadTextarea');
    if (textarea) {
      var activeLesson = getActiveLessonInfo();
      textarea.value = getLessonDoc(activeLesson.slug);
      updateNotepadStats();
    }
    console.log('[BFP] All notes and localStorage caches cleared to 0.');
  };

  // ==========================================================================
  //  SELECTION HIGHLIGHTING & IN-DOM NOTE CREATION
  // ==========================================================================
  var activeSelectionRange = null;
  var activePendingColor = 'rust';
  var editingNoteId = null;

  function unwrapHighlight(id) {
    var marks = document.querySelectorAll('.user-highlight[data-id="' + id + '"]');
    marks.forEach(function (mark) {
      if (mark && mark.parentNode) {
        while (mark.firstChild) {
          mark.parentNode.insertBefore(mark.firstChild, mark);
        }
        mark.parentNode.removeChild(mark);
      }
    });
  }

  function findTextInDocument(text) {
    if (!text) return null;
    var clean = text.replace(/^\[DIAGRAM\]\s*/i, '').replace(/^\[CODE\]\s*/i, '').trim();
    var snippet = clean.substring(0, 35).trim().toLowerCase();
    if (!snippet) return null;
    var elements = document.querySelectorAll('main p, main li, main h2, main h3, main pre, main code, p, li, h2, h3');
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      if (el.textContent && el.textContent.toLowerCase().indexOf(snippet) !== -1) {
        return el;
      }
    }
    return null;
  }

  function findCodeBlockInDocument(rawText) {
    if (!rawText) return null;
    var lines = rawText.split('\n');
    var firstLine = lines[0].replace(/:\s*$/, '').trim().toLowerCase();
    if (firstLine && firstLine.indexOf(' ') === -1) {
      var fnameEls = document.querySelectorAll('.codebar .fname, .code-bar .fname, .fname, .langtag');
      for (var i = 0; i < fnameEls.length; i++) {
        var txt = fnameEls[i].textContent.trim().toLowerCase();
        if (txt === firstLine || txt.indexOf(firstLine) !== -1 || firstLine.indexOf(txt) !== -1) {
          return fnameEls[i].closest('.codecard, .codeblock') || fnameEls[i];
        }
      }
    }

    for (var j = 0; j < lines.length; j++) {
      var line = lines[j].trim().toLowerCase();
      if (line.length >= 8 && line !== '{' && line !== '}' && line !== '()') {
        var pres = document.querySelectorAll('.codecard pre, .codeblock pre, pre');
        for (var k = 0; k < pres.length; k++) {
          if (pres[k].textContent.toLowerCase().indexOf(line) !== -1) {
            return pres[k].closest('.codecard, .codeblock') || pres[k];
          }
        }
      }
    }
    return null;
  }

  function findDiagramInDocument(rawText) {
    if (!rawText) return null;
    var clean = rawText.replace(/^\[DIAGRAM\]\s*/i, '').trim();
    var snippet = clean.substring(0, 32).toLowerCase();
    if (!snippet) return null;

    var diags = document.querySelectorAll('.viz, figure, .fig-frame');
    for (var i = 0; i < diags.length; i++) {
      var d = diags[i];
      if (d.textContent && d.textContent.toLowerCase().indexOf(snippet) !== -1) {
        return d;
      }
    }
    return null;
  }

  function locateTargetElement(id, targetId, rawText) {
    if (targetId) {
      var el = document.getElementById(targetId);
      if (el) return el;
    }
    if (id) {
      var hl = document.querySelector('.user-highlight[data-id="' + id + '"]');
      if (hl) return hl;
      var byId = document.getElementById(id);
      if (byId) return byId;
    }
    var codeEl = findCodeBlockInDocument(rawText);
    if (codeEl) return codeEl;

    var diagEl = findDiagramInDocument(rawText);
    if (diagEl) return diagEl;

    var textEl = findTextInDocument(rawText);
    if (textEl) return textEl;

    return null;
  }

  function renderNotesSidebarCards() {
    updatePageBookmarkStates();
    var badge = document.getElementById('dockNotebookBadge');
    if (badge) {
      badge.textContent = getChapterNotesCount();
    }
  }

  function restoreHighlightsOnPageLoad() {
    var activeLesson = getActiveLessonInfo();
    var currentChapter = activeLesson.isChapter ? activeLesson.title.toLowerCase() : '';
    var notes = NotesStore.getAll();
    if (!notes.length) return;

    notes.forEach(function (item) {
      if (document.querySelector('.user-highlight[data-id="' + item.id + '"]')) return;
      if (!item.text) return;

      // Scope highlight restoration to the current chapter only
      if (activeLesson.isChapter && item.chapterTitle) {
        var itemCh = item.chapterTitle.toLowerCase();
        if (currentChapter && itemCh.indexOf(activeLesson.shortTitle.toLowerCase()) === -1 &&
            itemCh.indexOf('chapter ' + activeLesson.number) === -1 &&
            itemCh.indexOf('chapter ' + (activeLesson.number < 10 ? '0' + activeLesson.number : activeLesson.number)) === -1) {
          return;
        }
      }

      var targetEl = findTextInDocument(item.text);
      if (targetEl) {
        var snippet = item.text.trim();
        try {
          var walker = document.createTreeWalker(targetEl, NodeFilter.SHOW_TEXT, null, false);
          var node;
          while ((node = walker.nextNode())) {
            var searchSnippet = snippet.substring(0, Math.min(30, snippet.length));
            var pos = node.nodeValue.toLowerCase().indexOf(searchSnippet.toLowerCase());
            if (pos !== -1) {
              var range = document.createRange();
              range.setStart(node, pos);
              range.setEnd(node, Math.min(pos + snippet.length, node.nodeValue.length));
              var mark = document.createElement('mark');
              mark.className = 'user-highlight';
              mark.setAttribute('data-color', item.color || 'rust');
              mark.setAttribute('data-id', item.id);
              if (item.userNote) mark.title = 'Note: ' + item.userNote;
              range.surroundContents(mark);
              break;
            }
          }
        } catch (e) {}
      }
    });

    if (window.location.hash && window.location.hash.indexOf('#hl=') !== -1) {
      var targetId = decodeURIComponent(window.location.hash.replace('#hl=', ''));
      setTimeout(function () {
        var mark = document.querySelector('.user-highlight[data-id="' + targetId + '"]');
        if (mark) {
          mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
          mark.classList.add('highlight-pulse');
          setTimeout(function () { mark.classList.remove('highlight-pulse'); }, 1500);
        }
      }, 400);
    }
  }

  function initHighlighter() {
    restoreHighlightsOnPageLoad();
    // 1. Floating Selection Bubble
    var bubble = document.createElement('div');
    bubble.className = 'selection-bubble';
    bubble.id = 'selectionBubble';
    bubble.innerHTML = '<button class="bubble-dot-btn dot-rust" data-color="rust" title="Highlight Blue (H)"></button>' +
      '<button class="bubble-dot-btn dot-amber" data-color="amber" title="Highlight Amber"></button>' +
      '<button class="bubble-dot-btn dot-emerald" data-color="emerald" title="Highlight Emerald"></button>' +
      '<button class="bubble-btn" id="bubbleNoteBtn" title="Add Note (N)">Note</button>' +
      '<button class="bubble-btn" id="bubbleCopyQuoteBtn" title="Copy selection">Copy</button>';
    document.body.appendChild(bubble);

    // 2. In-DOM Note Creator Popover
    var popover = document.createElement('div');
    popover.className = 'note-creator-popover';
    popover.id = 'noteCreatorPopover';
    popover.innerHTML = '<div class="note-popover-header">' +
      '<span>Study Note</span>' +
      '<button id="notePopoverCloseBtn" style="background:none;border:none;color:var(--ink-soft);cursor:pointer;font-size:13px;">&times;</button>' +
      '</div>' +
      '<div class="note-popover-quote" id="notePopoverQuote"></div>' +
      '<textarea class="note-popover-textarea" id="notePopoverText" placeholder="Write your key takeaway or commentary..."></textarea>' +
      '<div class="note-popover-actions">' +
      '<div class="note-color-picker">' +
      '<button class="note-color-dot dot-rust active" data-color="rust" title="Blue"></button>' +
      '<button class="note-color-dot dot-amber" data-color="amber" title="Amber"></button>' +
      '<button class="note-color-dot dot-emerald" data-color="emerald" title="Emerald"></button>' +
      '</div>' +
      '<div style="display:flex;gap:6px;">' +
      '<button class="dock-btn" id="notePopoverCancelBtn" style="font-size:11px;padding:4px 10px;">Cancel</button>' +
      '<button class="dock-btn" id="notePopoverSaveBtn" style="font-size:11px;padding:4px 12px;background:var(--accent);color:#fff;border-color:var(--accent);">Save Note</button>' +
      '</div>' +
      '</div>';
    document.body.appendChild(popover);

    // 3. Highlight Click Tooltip
    var tooltip = document.createElement('div');
    tooltip.className = 'highlight-action-tooltip';
    tooltip.id = 'highlightActionTooltip';
    tooltip.innerHTML = '<span class="tooltip-note" id="tooltipNotePreview"></span>' +
      '<button class="bubble-btn" id="tooltipEditBtn" title="Edit Note">Edit</button>' +
      '<button class="bubble-btn" id="tooltipRemoveBtn" title="Remove Highlight" style="color:#ff6b57;">Remove</button>' +
      '<button class="bubble-btn" id="tooltipViewNotesBtn" title="View in Sidebar">Notes</button>';
    document.body.appendChild(tooltip);

    // Selection Bubble Listeners
    bubble.querySelectorAll('.bubble-dot-btn').forEach(function (btn) {
      btn.addEventListener('mousedown', function (e) {
        e.preventDefault();
        e.stopPropagation();
        applyHighlight(btn.getAttribute('data-color'), '');
      });
    });

    document.getElementById('bubbleNoteBtn').addEventListener('mousedown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openNotePopover('rust');
    });

    document.getElementById('bubbleCopyQuoteBtn').addEventListener('mousedown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (activeSelectionRange) {
        navigator.clipboard.writeText(activeSelectionRange.toString().trim());
        bubble.style.display = 'none';
      }
    });

    // Popover Event Listeners
    document.getElementById('notePopoverCloseBtn').addEventListener('click', closeNotePopover);
    document.getElementById('notePopoverCancelBtn').addEventListener('click', closeNotePopover);
    document.getElementById('notePopoverSaveBtn').addEventListener('click', saveNotePopover);

    popover.querySelectorAll('.note-color-dot').forEach(function (dot) {
      dot.addEventListener('click', function () {
        popover.querySelectorAll('.note-color-dot').forEach(function (d) { d.classList.remove('active'); });
        dot.classList.add('active');
        activePendingColor = dot.getAttribute('data-color');
      });
    });

    // Tooltip Action Listeners
    var currentTargetMark = null;
    document.addEventListener('click', function (e) {
      var mark = e.target.closest('.user-highlight');
      if (mark) {
        e.stopPropagation();
        currentTargetMark = mark;
        var id = mark.getAttribute('data-id');
        var noteObj = NotesStore.getAll().find(function (n) { return n.id === id; });
        var preview = document.getElementById('tooltipNotePreview');
        if (preview) {
          preview.textContent = noteObj && noteObj.userNote ? ('Note: ' + noteObj.userNote) : mark.textContent.trim().substring(0, 30) + '...';
        }
        var rect = mark.getBoundingClientRect();
        tooltip.style.position = 'fixed';
        tooltip.style.display = 'flex';
        tooltip.style.top = Math.max(10, rect.top - 8) + 'px';
        tooltip.style.left = Math.max(100, Math.min(window.innerWidth - 100, rect.left + rect.width / 2)) + 'px';
        if (bubble) bubble.style.display = 'none';
      } else if (!e.target.closest('#highlightActionTooltip') && !e.target.closest('#noteCreatorPopover')) {
        tooltip.style.display = 'none';
      }
    });

    document.getElementById('tooltipRemoveBtn').addEventListener('click', function () {
      if (currentTargetMark) {
        var id = currentTargetMark.getAttribute('data-id');
        NotesStore.remove(id);
        unwrapHighlight(id);
        tooltip.style.display = 'none';
        renderNotesSidebarCards();
      }
    });

    document.getElementById('tooltipEditBtn').addEventListener('click', function () {
      if (currentTargetMark) {
        var id = currentTargetMark.getAttribute('data-id');
        var noteObj = NotesStore.getAll().find(function (n) { return n.id === id; });
        tooltip.style.display = 'none';
        openNotePopover(noteObj ? noteObj.color : 'rust', id);
      }
    });

    document.getElementById('tooltipViewNotesBtn').addEventListener('click', function () {
      tooltip.style.display = 'none';
      openNotesSidebar();
    });

    // Selection detection with debouncing
    var _selTimer = null;
    function scheduleSelectionCheck(e) {
      if (_selTimer) clearTimeout(_selTimer);
      _selTimer = setTimeout(function () {
        handleTextSelection(e);
      }, 10);
    }

    document.addEventListener('mouseup', scheduleSelectionCheck);
    document.addEventListener('keyup', scheduleSelectionCheck);
    document.addEventListener('touchend', scheduleSelectionCheck);
    document.addEventListener('selectionchange', function () {
      var sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        var bubble = document.getElementById('selectionBubble');
        if (bubble && bubble.style.display === 'flex' && !document.querySelector('#noteCreatorPopover[style*="flex"]')) {
          bubble.style.display = 'none';
        }
      } else {
        scheduleSelectionCheck();
      }
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        var drawer = document.getElementById('notesSidebarDrawer');
        if (drawer && drawer.classList.contains('is-open')) {
          closeNotesSidebar();
        }
        var pop = document.getElementById('noteCreatorPopover');
        if (pop && pop.style.display === 'flex') {
          closeNotePopover();
        }
        if (tooltip && tooltip.style.display === 'flex') {
          tooltip.style.display = 'none';
        }
        var imgModal = document.getElementById('masterclassImgModal');
        if (imgModal && imgModal.classList.contains('is-open')) {
          imgModal.classList.remove('is-open');
        }
        var bubble = document.getElementById('selectionBubble');
        if (bubble && bubble.style.display === 'flex') {
          bubble.style.display = 'none';
        }
        return;
      }
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        toggleNotesSidebar();
      } else if (e.key.toLowerCase() === 'h' && activeSelectionRange && !activeSelectionRange.collapsed) {
        e.preventDefault();
        applyHighlight('rust', '');
      } else if (e.key.toLowerCase() === 'n' && activeSelectionRange && !activeSelectionRange.collapsed) {
        e.preventDefault();
        openNotePopover('rust');
      }
    });
  }

  function handleTextSelection(e) {
    var targetEl = e && e.target ? (e.target.nodeType === 1 ? e.target : e.target.parentElement) : null;
    if (targetEl && (targetEl.closest('#selectionBubble') || targetEl.closest('#noteCreatorPopover') ||
        targetEl.closest('#highlightActionTooltip') || targetEl.closest('#masterclassDock'))) return;

    var sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      var bubble = document.getElementById('selectionBubble');
      if (bubble && bubble.style.display === 'flex' && !document.querySelector('#noteCreatorPopover[style*="flex"]')) {
        bubble.style.display = 'none';
      }
      activeSelectionRange = null;
      return;
    }

    var text = sel.toString().trim();
    if (!text || text.length < 1) {
      var bubble2 = document.getElementById('selectionBubble');
      if (bubble2 && bubble2.style.display === 'flex' && !document.querySelector('#noteCreatorPopover[style*="flex"]')) {
        bubble2.style.display = 'none';
      }
      activeSelectionRange = null;
      return;
    }

    try {
      var range = sel.getRangeAt(0);
      activeSelectionRange = range.cloneRange();
      var rect = range.getBoundingClientRect();
      if (!rect || (rect.width === 0 && rect.height === 0)) {
        var rects = range.getClientRects();
        for (var i = 0; i < rects.length; i++) {
          if (rects[i].width > 0 || rects[i].height > 0) {
            rect = rects[i];
            break;
          }
        }
      }

      var bubble3 = document.getElementById('selectionBubble');
      if (bubble3 && rect && (rect.width > 0 || rect.height > 0)) {
        var hasSpaceAbove = rect.top >= 52;
        var top = hasSpaceAbove ? (rect.top - 8) : (rect.bottom + 8);
        var transform = hasSpaceAbove ? 'translate(-50%, -100%)' : 'translate(-50%, 0)';
        var midX = rect.left + rect.width / 2;
        var clampedX = Math.max(120, Math.min(window.innerWidth - 120, midX));

        bubble3.style.position = 'fixed';
        bubble3.style.top = top + 'px';
        bubble3.style.left = clampedX + 'px';
        bubble3.style.transform = transform;
        bubble3.style.display = 'flex';
        bubble3.style.visibility = 'visible';
        bubble3.style.opacity = '1';
      }
    } catch (err) {}
  }

  function openNotePopover(color, existingId) {
    var pop = document.getElementById('noteCreatorPopover');
    var quote = document.getElementById('notePopoverQuote');
    var textEl = document.getElementById('notePopoverText');
    if (!pop || !quote || !textEl) return;

    editingNoteId = existingId || null;
    activePendingColor = color || 'rust';

    var bubble = document.getElementById('selectionBubble');
    if (bubble) bubble.style.display = 'none';

    pop.querySelectorAll('.note-color-dot').forEach(function (d) {
      d.classList.toggle('active', d.getAttribute('data-color') === activePendingColor);
    });

    if (existingId) {
      var noteObj = NotesStore.getAll().find(function (n) { return n.id === existingId; });
      quote.textContent = noteObj ? noteObj.text : '';
      textEl.value = noteObj ? (noteObj.userNote || '') : '';
      var mark = document.querySelector('.user-highlight[data-id="' + existingId + '"]');
      if (mark) {
        var rect = mark.getBoundingClientRect();
        pop.style.position = 'fixed';
        pop.style.display = 'flex';
        if (rect.top >= 180) {
          pop.style.top = (rect.top - 12) + 'px';
          pop.style.transform = 'translate(-50%, -100%)';
        } else {
          pop.style.top = (rect.bottom + 12) + 'px';
          pop.style.transform = 'translate(-50%, 0)';
        }
        var midX2 = rect.left + rect.width / 2;
        pop.style.left = Math.max(170, Math.min(window.innerWidth - 170, midX2)) + 'px';
      }
    } else if (activeSelectionRange) {
      quote.textContent = activeSelectionRange.toString().trim();
      textEl.value = '';
      var rects = activeSelectionRange.getClientRects();
      var r = (rects && rects.length > 0) ? rects[0] : activeSelectionRange.getBoundingClientRect();
      pop.style.position = 'fixed';
      pop.style.display = 'flex';
      if (r.top >= 180) {
        pop.style.top = (r.top - 12) + 'px';
        pop.style.transform = 'translate(-50%, -100%)';
      } else {
        pop.style.top = (r.bottom + 12) + 'px';
        pop.style.transform = 'translate(-50%, 0)';
      }
      var midX3 = r.left + (r.width ? r.width / 2 : 0);
      pop.style.left = Math.max(170, Math.min(window.innerWidth - 170, midX3)) + 'px';
    }

    setTimeout(function () { textEl.focus(); }, 50);
  }

  function closeNotePopover() {
    var pop = document.getElementById('noteCreatorPopover');
    if (pop) pop.style.display = 'none';
    editingNoteId = null;
  }

  function saveNotePopover() {
    var textEl = document.getElementById('notePopoverText');
    var noteVal = (textEl ? textEl.value : '').trim();

    if (editingNoteId) {
      NotesStore.update(editingNoteId, { userNote: noteVal, color: activePendingColor });
      var mark = document.querySelector('.user-highlight[data-id="' + editingNoteId + '"]');
      if (mark) {
        mark.setAttribute('data-color', activePendingColor);
        if (noteVal) mark.title = 'Note: ' + noteVal;
        if (noteVal) {
          appendExcerptToActiveLessonDoc(mark.textContent.trim(), 'text', getCleanChapterTitle(), noteVal);
        }
      }
      closeNotePopover();
      renderNotesSidebarCards();
    } else {
      applyHighlight(activePendingColor, noteVal);
      closeNotePopover();
    }
  }

  function applyHighlight(color, userNote) {
    if (!activeSelectionRange) return;
    var rawText = activeSelectionRange.toString();
    if (!rawText || !rawText.trim()) return;

    var isCode = !!(activeSelectionRange.startContainer.parentElement && activeSelectionRange.startContainer.parentElement.closest('pre, code'));
    var cleanText = normalizeExcerptText(rawText, isCode);
    var chapterTitle = getCleanChapterTitle();

    var item = {
      id: 'ann_' + Date.now(),
      chapterTitle: chapterTitle,
      url: window.location.href,
      type: isCode ? 'code' : 'text',
      text: cleanText,
      userNote: userNote || '',
      color: color || 'rust',
      createdAt: new Date().toISOString()
    };

    var mark = document.createElement('mark');
    mark.className = 'user-highlight';
    mark.setAttribute('data-color', item.color);
    mark.setAttribute('data-id', item.id);
    if (userNote) mark.title = 'Note: ' + userNote;

    try {
      activeSelectionRange.surroundContents(mark);
    } catch (ex) {
      try {
        var span = document.createElement('span');
        span.className = 'user-highlight';
        span.setAttribute('data-color', item.color);
        span.setAttribute('data-id', item.id);
        span.appendChild(activeSelectionRange.extractContents());
        activeSelectionRange.insertNode(span);
      } catch (err2) {}
    }

    NotesStore.add(item);
    window.getSelection().removeAllRanges();
    var b = document.getElementById('selectionBubble');
    if (b) b.style.display = 'none';
    activeSelectionRange = null;

    // Automatically append highlight & note to the active lesson's Notepad!
    appendExcerptToActiveLessonDoc(item.text, item.type, item.chapterTitle, item.userNote);
    renderNotesSidebarCards();
  }

  // ==========================================================================
  //  ACTIVE LESSON & OBSIDIAN MARKDOWN ENGINE
  // ==========================================================================
  function getActiveLessonInfo() {
    var path = (window.location.pathname || '').replace(/\\/g, '/');
    var match = path.match(/(?:^|\/)(\d+)\.([^\/]+)(?:\/|$)/i);
    var num = null;
    var name = '';
    var slug = '';

    if (match) {
      num = parseInt(match[1], 10);
    } else {
      var ind = document.querySelector('.nav-indicator');
      if (ind) {
        var m = ind.textContent.match(/Chapter\s*(\d+)/i);
        if (m) num = parseInt(m[1], 10);
      }
    }

    if (num !== null && CHAPTERS[num - 1]) {
      var chObj = CHAPTERS[num - 1];
      name = chObj.title;
      slug = chObj.n + '-' + chObj.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      return {
        isChapter: true,
        number: num,
        padNum: chObj.n,
        title: 'Chapter ' + chObj.n + ': ' + chObj.title,
        shortTitle: chObj.title,
        slug: slug
      };
    }

    var h1Title = getCleanChapterTitle();
    if (isChapter && h1Title && h1Title !== 'Masterclass Note' && h1Title !== 'Backend from First Principles.') {
      var cleanSlug = h1Title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      return {
        isChapter: true,
        number: 1,
        padNum: '01',
        title: h1Title,
        shortTitle: h1Title,
        slug: cleanSlug || '01-chapter-notes'
      };
    }

    return {
      isChapter: false,
      number: null,
      padNum: null,
      title: 'All Lessons',
      shortTitle: 'All Lessons',
      slug: 'backend-masterclass-all-notes'
    };
  }

  function escapeHtml(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function extractDiagramVisual(diagElement) {
    if (!diagElement) return null;
    var titleEl = diagElement.querySelector('.viz-title, figcaption, .viz-cap');
    var title = 'Architecture Diagram';
    if (titleEl) {
      var tClone = titleEl.cloneNode(true);
      tClone.querySelectorAll('button, .viz-bookmark-btn').forEach(function (b) { b.remove(); });
      title = tClone.textContent.trim() || 'Architecture Diagram';
    }

    var svgEl = diagElement.querySelector('svg');
    if (svgEl) {
      var clone = svgEl.cloneNode(true);
      if (!clone.getAttribute('xmlns')) {
        clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      }
      var serializer = new XMLSerializer();
      var svgString = serializer.serializeToString(clone);
      var dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
      return {
        title: title,
        type: 'svg',
        dataUrl: dataUrl,
        rawHtml: svgString
      };
    }

    var imgEl = diagElement.querySelector('img');
    if (imgEl && imgEl.src) {
      return {
        title: title,
        type: 'img',
        dataUrl: imgEl.src,
        rawHtml: imgEl.outerHTML
      };
    }

    return {
      title: title,
      type: 'text',
      dataUrl: null,
      rawHtml: diagElement.textContent.trim()
    };
  }

  function findDiagramOnPage(title) {
    if (!title) return null;
    var tLow = title.toLowerCase().replace(/^\[diagram\]\s*/i, '').replace(/^diagram:\s*/i, '').trim();
    var vizList = document.querySelectorAll('.viz, figure.fig-frame, figure');
    for (var i = 0; i < vizList.length; i++) {
      var v = vizList[i];
      var titleEl = v.querySelector('.viz-title, figcaption, .viz-cap');
      var text = titleEl ? titleEl.textContent.trim().toLowerCase() : '';
      if (text && (text.indexOf(tLow) !== -1 || tLow.indexOf(text) !== -1 || tLow.substring(0, 20) === text.substring(0, 20))) {
        return v;
      }
    }
    if (vizList.length > 0 && tLow.length <= 4) {
      return vizList[0];
    }
    return null;
  }

  function resolveDiagramPlaceholderToHtml(dTitle) {
    var cleanTitle = (dTitle || '').replace(/^\[diagram\]\s*/i, '').trim();
    var diagEl = findDiagramOnPage(cleanTitle);
    if (diagEl) {
      var v = extractDiagramVisual(diagEl);
      if (v && v.dataUrl) {
        return '<div class="md-image-wrap">' +
          '<img src="' + v.dataUrl + '" alt="' + escapeHtml(cleanTitle) + '" class="md-image" onclick="window.masterclassPreviewImage(this.src)" />' +
          '<span class="md-image-caption">' + escapeHtml(cleanTitle) + '</span>' +
          '</div>';
      }
    }
    return '<div class="md-diagram-pill"><span class="diagram-pill-icon">' + SVG_ICONS.diagram + '</span> <b>Diagram:</b> ' + escapeHtml(cleanTitle) + '</div>';
  }

  // ==========================================================================
  //  OBSIDIAN SYNTAX HIGHLIGHTER & CODE BLOCK RENDERER
  // ==========================================================================
  function detectCodeLanguage(code, explicitLang) {
    if (explicitLang && explicitLang !== 'text') {
      var l = explicitLang.toLowerCase().trim();
      if (l === 'golang') return 'go';
      if (l === 'py') return 'python';
      if (l === 'js') return 'javascript';
      if (l === 'ts') return 'typescript';
      if (l === 'sh' || l === 'shell') return 'bash';
      return l;
    }
    var s = code || '';
    if (s.indexOf('package main') !== -1 || s.indexOf('func ') !== -1 || s.indexOf('http.ResponseWriter') !== -1 || s.indexOf('type ') !== -1 && s.indexOf('struct') !== -1) return 'go';
    if (s.indexOf('def ') !== -1 || s.indexOf('import ') !== -1 && s.indexOf('from ') !== -1 || s.indexOf('elif ') !== -1 || s.indexOf('class ') !== -1 && s.indexOf(':') !== -1) return 'python';
    if (s.indexOf('HTTP/1.') !== -1 || s.indexOf('HTTP/2') !== -1 || /^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+/m.test(s) || /^[A-Za-z0-9-]+:\s*.+$/m.test(s) && s.indexOf('{') === -1) return 'http';
    if (/^\s*[\{\[][\s\S]*[\}\]]\s*$/.test(s) && s.indexOf(':') !== -1) return 'json';
    if (s.indexOf('curl ') !== -1 || s.indexOf('npm ') !== -1 || s.indexOf('chmod ') !== -1 || s.indexOf('export ') !== -1) return 'bash';
    if (s.indexOf('const ') !== -1 || s.indexOf('function ') !== -1 || s.indexOf('console.log') !== -1 || s.indexOf('let ') !== -1) return 'javascript';
    return 'go';
  }

  function highlightSyntax(rawCode, rawLang) {
    var lang = detectCodeLanguage(rawCode, rawLang);
    var src = rawCode || '';

    var comments = [];
    var strings = [];

    // 1. Extract comments & strings to placeholders
    if (lang === 'python' || lang === 'bash') {
      src = src.replace(/("""[\s\S]*?"""|'''[\s\S]*?''')/g, function (m) {
        var ph = '%%TOK_STR_' + strings.length + '%%';
        strings.push(m);
        return ph;
      });
      src = src.replace(/(#.*$)/gm, function (m) {
        var ph = '%%TOK_COM_' + comments.length + '%%';
        comments.push(m);
        return ph;
      });
    } else if (lang === 'http') {
      src = src.replace(/(#.*$)/gm, function (m) {
        var ph = '%%TOK_COM_' + comments.length + '%%';
        comments.push(m);
        return ph;
      });
    } else {
      src = src.replace(/(\/\*[\s\S]*?\*\/)/g, function (m) {
        var ph = '%%TOK_COM_' + comments.length + '%%';
        comments.push(m);
        return ph;
      });
      src = src.replace(/(\/\/.*$)/gm, function (m) {
        var ph = '%%TOK_COM_' + comments.length + '%%';
        comments.push(m);
        return ph;
      });
    }

    // Strings
    src = src.replace(/("(\\"|[^"])*"|'(\\'|[^'])*'|`(\\`|[^`])*`)/g, function (m) {
      var ph = '%%TOK_STR_' + strings.length + '%%';
      strings.push(m);
      return ph;
    });

    // Escape HTML on base code template
    src = escapeHtml(src);

    // Language specific token highlighting
    if (lang === 'go') {
      src = src.replace(/\b(break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go|goto|if|import|interface|map|package|range|return|select|struct|switch|type|var|nil|true|false|iota)\b/g, '<span class="tok-kw">$1</span>');
      src = src.replace(/\b(string|int|int8|int16|int32|int64|uint|uint8|uint16|uint32|uint64|uintptr|byte|rune|float32|float64|complex64|complex128|bool|error|any)\b/g, '<span class="tok-type">$1</span>');
      src = src.replace(/\b(make|new|len|cap|append|copy|close|delete|panic|recover|print|println)\b(?=\s*\()/g, '<span class="tok-builtin">$1</span>');
      src = src.replace(/\b([A-Za-z0-9_]+)\b(?=\s*\()/g, '<span class="tok-fn">$1</span>');
      src = src.replace(/\b(\d+(?:\.\d+)?(?:e[+-]?\d+)?|0x[0-9a-fA-F]+)\b/g, '<span class="tok-num">$1</span>');
    } else if (lang === 'python') {
      src = src.replace(/\b(and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield|None|True|False|self)\b/g, '<span class="tok-kw">$1</span>');
      src = src.replace(/\b(print|len|range|str|int|float|list|dict|set|tuple|type|isinstance|enumerate|zip|open|super|sum|min|max)\b/g, '<span class="tok-builtin">$1</span>');
      src = src.replace(/\b([A-Za-z0-9_]+)\b(?=\s*\()/g, '<span class="tok-fn">$1</span>');
      src = src.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tok-num">$1</span>');
    } else if (lang === 'http') {
      src = src.replace(/\b(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS|CONNECT|TRACE)\b/g, '<span class="tok-http-method">$1</span>');
      src = src.replace(/\b(HTTP\/\d(?:\.\d)?)\b/g, '<span class="tok-kw">$1</span>');
      src = src.replace(/\b([1-5]\d{2})\b/g, '<span class="tok-num">$1</span>');
      src = src.replace(/^([A-Za-z0-9-]+)(?=:)/gm, '<span class="tok-http-hdr">$1</span>');
    } else if (lang === 'json') {
      src = src.replace(/\b(true|false|null)\b/g, '<span class="tok-kw">$1</span>');
      src = src.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tok-num">$1</span>');
    } else if (lang === 'javascript' || lang === 'typescript') {
      src = src.replace(/\b(async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|function|if|import|in|instanceof|new|return|super|switch|this|throw|try|typeof|var|void|while|with|yield|let|enum|interface|type|from|as|of|null|undefined|true|false)\b/g, '<span class="tok-kw">$1</span>');
      src = src.replace(/\b(string|number|boolean|any|void|never|unknown|object|Promise|Array|Record)\b/g, '<span class="tok-type">$1</span>');
      src = src.replace(/\b([A-Za-z0-9_]+)\b(?=\s*\()/g, '<span class="tok-fn">$1</span>');
      src = src.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tok-num">$1</span>');
    } else {
      src = src.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tok-num">$1</span>');
    }

    // Restore strings
    for (var sIdx = 0; sIdx < strings.length; sIdx++) {
      var strPh = '%%TOK_STR_' + sIdx + '%%';
      var escapedStr = escapeHtml(strings[sIdx]);
      src = src.replace(strPh, '<span class="tok-str">' + escapedStr + '</span>');
    }

    // Restore comments
    for (var cIdx = 0; cIdx < comments.length; cIdx++) {
      var comPh = '%%TOK_COM_' + cIdx + '%%';
      var escapedCom = escapeHtml(comments[cIdx]);
      src = src.replace(comPh, '<span class="tok-com">' + escapedCom + '</span>');
    }

    return {
      lang: lang,
      html: src
    };
  }

  window.masterclassCopyCode = function (btn) {
    if (!btn) return;
    var wrap = btn.closest('.md-codeblock-wrap');
    if (!wrap) return;
    var codeEl = wrap.querySelector('code');
    var text = codeEl ? codeEl.textContent : '';
    if (!text) return;

    function indicateCopied() {
      btn.classList.add('is-copied');
      var copyText = btn.querySelector('.md-copy-text');
      if (copyText) copyText.textContent = 'Copied!';
      setTimeout(function () {
        btn.classList.remove('is-copied');
        if (copyText) copyText.textContent = 'Copy';
      }, 2000);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(indicateCopied).catch(function () {
        var ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        indicateCopied();
      });
    } else {
      var ta2 = document.createElement('textarea');
      ta2.value = text;
      document.body.appendChild(ta2);
      ta2.select();
      document.execCommand('copy');
      document.body.removeChild(ta2);
      indicateCopied();
    }
  };

  // ==========================================================================
  //  OBSIDIAN SVG VECTOR ICONOGRAPHY (Strictly zero emojis)
  // ==========================================================================
  var SVG_ICONS = {
    edit: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
    preview: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    close: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    callout: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    task: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    taskChecked: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><polyline points="9 11 12 14 22 4"/></svg>',
    taskUnchecked: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>',
    list: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
    wikilink: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    wikilinkSmall: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    tag: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
    image: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    diagram: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
    save: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
    copy: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    pin: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    layers: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
    trash: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    info: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    tip: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 6h8c1.5-1.5 3-3.5 3-6a7 7 0 0 0-7-7z"/></svg>',
    warning: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    danger: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    question: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
  };

  function renderObsidianMarkdown(rawText) {
    if (!rawText) return '';
    var src = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // 1. Extract code blocks with syntax highlighting & UI header
    var codeBlocks = [];
    src = src.replace(/```([a-zA-Z0-9_\-\+\.]*)\n([\s\S]*?)```/g, function (match, lang, code) {
      var placeholder = '%%CODEBLOCK_' + codeBlocks.length + '%%';
      var cleanCode = code.replace(/^\n+|\n+$/g, '');
      var highlighted = highlightSyntax(cleanCode, lang);
      var displayLang = (lang || highlighted.lang || 'code').toUpperCase();
      var dotColor = '#7fb0c9';
      if (highlighted.lang === 'python') dotColor = '#d8b66a';
      else if (highlighted.lang === 'http') dotColor = '#b8402e';
      else if (highlighted.lang === 'json') dotColor = '#3f6f4e';
      else if (highlighted.lang === 'javascript' || highlighted.lang === 'typescript') dotColor = '#3178c6';
      else if (highlighted.lang === 'bash') dotColor = '#89e051';

      var blockHtml = '<div class="md-codeblock-wrap">' +
        '<div class="md-code-header">' +
        '  <div class="md-code-left">' +
        '    <span class="md-code-dot" style="background:' + dotColor + '"></span>' +
        '    <span class="md-code-lang-label">' + escapeHtml(displayLang) + '</span>' +
        '  </div>' +
        '  <button type="button" class="md-code-copy-btn" onclick="window.masterclassCopyCode(this)" title="Copy snippet" aria-label="Copy code snippet to clipboard">' +
        '    <span class="md-copy-icon">' + SVG_ICONS.copy + '</span> <span class="md-copy-text">Copy</span>' +
        '  </button>' +
        '</div>' +
        '<pre class="md-codeblock"><code class="language-' + escapeHtml(highlighted.lang) + '">' + highlighted.html + '</code></pre>' +
        '</div>';

      codeBlocks.push(blockHtml);
      return placeholder;
    });

    // 2. Extract callouts & blockquotes
    var lines = src.split('\n');
    var outLines = [];
    var inQuote = false;
    var quoteBuffer = [];

    function flushQuote() {
      if (!quoteBuffer.length) return;
      var firstLine = quoteBuffer[0].replace(/^>\s?/, '').trim();
      var calloutMatch = firstLine.match(/^\[!([a-zA-Z_-]+)\]\s*(.*)$/i);

      if (calloutMatch) {
        var cType = calloutMatch[1].toLowerCase();
        var cTitle = calloutMatch[2].trim() || (cType.charAt(0).toUpperCase() + cType.slice(1));
        var cBodyLines = quoteBuffer.slice(1).map(function (l) { return l.replace(/^>\s?/, ''); });
        var cBodyText = cBodyLines.join('\n').trim();

        var iconSvg = SVG_ICONS.info;
        if (['tip', 'hint', 'important'].indexOf(cType) !== -1) iconSvg = SVG_ICONS.tip;
        else if (['warning', 'caution', 'attention'].indexOf(cType) !== -1) iconSvg = SVG_ICONS.warning;
        else if (['danger', 'error', 'failure', 'bug'].indexOf(cType) !== -1) iconSvg = SVG_ICONS.danger;
        else if (['example', 'quote', 'cite'].indexOf(cType) !== -1) iconSvg = SVG_ICONS.callout;
        else if (['faq', 'question', 'help'].indexOf(cType) !== -1) iconSvg = SVG_ICONS.question;
        else if (['success', 'check', 'done'].indexOf(cType) !== -1) iconSvg = SVG_ICONS.check;

        var renderedBody = renderObsidianInline(cBodyText);
        outLines.push('<div class="obsidian-callout callout-' + escapeHtml(cType) + '">' +
          '<div class="obsidian-callout-title">' +
          '<span class="obsidian-callout-icon">' + iconSvg + '</span>' +
          '<span class="obsidian-callout-label">' + escapeHtml(cTitle) + '</span>' +
          '</div>' +
          (renderedBody ? '<div class="obsidian-callout-content">' + renderedBody + '</div>' : '') +
          '</div>');
      } else {
        var body = quoteBuffer.map(function (l) { return l.replace(/^>\s?/, ''); }).join('\n');
        outLines.push('<blockquote class="md-quote">' + renderObsidianInline(body) + '</blockquote>');
      }
      quoteBuffer = [];
      inQuote = false;
    }

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (line.match(/^>\s?/)) {
        inQuote = true;
        quoteBuffer.push(line);
      } else {
        if (inQuote) flushQuote();
        outLines.push(line);
      }
    }
    if (inQuote) flushQuote();

    // 3. Process line-by-line block elements
    var processedLines = [];
    for (var j = 0; j < outLines.length; j++) {
      var l = outLines[j];

      if (l.indexOf('<div class="obsidian-callout') === 0 || l.indexOf('<blockquote') === 0 || l.indexOf('%%CODEBLOCK_') !== -1) {
        processedLines.push(l);
        continue;
      }

      // Standalone Image: ![alt](url)
      var imgMatch = l.trim().match(/^!\[([^\]]*)\]\(([\s\S]+)\)$/);
      if (imgMatch) {
        var altText = imgMatch[1] || '';
        var safeAlt = escapeHtml(altText);
        var rawUrl = imgMatch[2].trim();
        var resolvedSrc = resolveAssetUrl(rawUrl, altText);
        processedLines.push('<div class="md-image-wrap">' +
          '<img src="' + resolvedSrc.replace(/"/g, '&quot;') + '" alt="' + safeAlt + '" class="md-image" loading="lazy" onclick="window.masterclassPreviewImage(this.src)" />' +
          (altText ? '<span class="md-image-caption">' + safeAlt + '</span>' : '') +
          '</div>');
        continue;
      }

      // Standalone diagram placeholder: [DIAGRAM] Title
      var diagMatch = l.trim().match(/^\[DIAGRAM\]\s*(.+)$/i);
      if (diagMatch) {
        processedLines.push(resolveDiagramPlaceholderToHtml(diagMatch[1]));
        continue;
      }

      // Headings
      if (l.match(/^####\s+(.+)$/)) {
        processedLines.push('<h5 class="md-heading md-h4">' + renderObsidianInline(l.replace(/^####\s+/, '')) + '</h5>');
        continue;
      }
      if (l.match(/^###\s+(.+)$/)) {
        processedLines.push('<h4 class="md-heading md-h3">' + renderObsidianInline(l.replace(/^###\s+/, '')) + '</h4>');
        continue;
      }
      if (l.match(/^##\s+(.+)$/)) {
        processedLines.push('<h3 class="md-heading md-h2">' + renderObsidianInline(l.replace(/^##\s+/, '')) + '</h3>');
        continue;
      }
      if (l.match(/^#\s+(.+)$/)) {
        processedLines.push('<h2 class="md-heading md-h1">' + renderObsidianInline(l.replace(/^#\s+/, '')) + '</h2>');
        continue;
      }

      // Task List Items
      var taskMatchChecked = l.match(/^\s*[-*]\s+\[[xX]\]\s+(.+)$/);
      if (taskMatchChecked) {
        processedLines.push('<div class="md-task-item is-checked"><span class="md-task-box is-checked">' + SVG_ICONS.taskChecked + '</span> <span class="md-task-text">' + renderObsidianInline(taskMatchChecked[1]) + '</span></div>');
        continue;
      }
      var taskMatchUnchecked = l.match(/^\s*[-*]\s+\[\s\]\s+(.+)$/);
      if (taskMatchUnchecked) {
        processedLines.push('<div class="md-task-item"><span class="md-task-box">' + SVG_ICONS.taskUnchecked + '</span> <span class="md-task-text">' + renderObsidianInline(taskMatchUnchecked[1]) + '</span></div>');
        continue;
      }

      // Bullet List Items
      var bulletMatch = l.match(/^\s*[-*•]\s+(.+)$/);
      if (bulletMatch) {
        processedLines.push('<div class="md-bullet-item"><span class="md-bullet-dot">•</span> <span class="md-bullet-text">' + renderObsidianInline(bulletMatch[1]) + '</span></div>');
        continue;
      }

      // Numbered List Items
      var numMatch = l.match(/^\s*(\d+)\.\s+(.+)$/);
      if (numMatch) {
        processedLines.push('<div class="md-num-item"><span class="md-num-label">' + numMatch[1] + '.</span> <span class="md-num-text">' + renderObsidianInline(numMatch[2]) + '</span></div>');
        continue;
      }

      // Divider
      if (l.match(/^\s*---+\s*$/)) {
        processedLines.push('<hr class="md-divider" />');
        continue;
      }

      if (!l.trim()) {
        processedLines.push('<div class="md-spacer"></div>');
        continue;
      }

      processedLines.push('<div class="md-para">' + renderObsidianInline(l) + '</div>');
    }

    var finalHtml = processedLines.join('');

    // Restore code blocks
    for (var k = 0; k < codeBlocks.length; k++) {
      finalHtml = finalHtml.replace('%%CODEBLOCK_' + k + '%%', codeBlocks[k]);
    }

    return finalHtml;
  }

  function renderObsidianInline(text) {
    if (!text) return '';

    // Extract inline [DIAGRAM] placeholders
    var diagramPlaceholders = [];
    var s = text.replace(/\[DIAGRAM\]\s*([^\n\r<]+)/gi, function (m, dTitle) {
      var ph = '%%DIAGRAM_INLINE_' + diagramPlaceholders.length + '%%';
      diagramPlaceholders.push(resolveDiagramPlaceholderToHtml(dTitle));
      return ph;
    });

    // Extract inline images to placeholders
    var imgPlaceholders = [];
    s = s.replace(/!\[([^\]]*)\]\(([\s\S]+?)\)/g, function (m, alt, url) {
      var ph = '%%IMG_INLINE_' + imgPlaceholders.length + '%%';
      var safeAlt = escapeHtml(alt || '');
      var resolvedSrc = resolveAssetUrl(url, alt);
      imgPlaceholders.push('<span class="md-image-inline-wrap"><img src="' + resolvedSrc.replace(/"/g, '&quot;') + '" alt="' + safeAlt + '" class="md-image" loading="lazy" onclick="window.masterclassPreviewImage(this.src)" /></span>');
      return ph;
    });

    s = escapeHtml(s);

    // Inline code: `code`
    s = s.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>');

    // Obsidian Highlights: ==text==
    s = s.replace(/==([^=]+)==/g, '<mark class="obsidian-highlight">$1</mark>');

    // Strikethrough: ~~text~~
    s = s.replace(/~~([^~]+)~~/g, '<del class="obsidian-strike">$1</del>');

    // Bold: **text** or __text__
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>');

    // Italic: *text* or _text_
    s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    s = s.replace(/_([^_]+)_/g, '<em>$1</em>');

    // Obsidian WikiLinks: [[Target|Alias]] or [[Target]]
    s = s.replace(/\[\[([^\]\|]+)(?:\|([^\]]+))?\]\]/g, function (m, target, alias) {
      var label = alias || target;
      return '<span class="obsidian-wikilink" title="' + escapeHtml(target) + '"><span class="wikilink-icon">' + SVG_ICONS.wikilinkSmall + '</span>' + escapeHtml(label) + '</span>';
    });

    // Links: [text](url) — only http(s), mailto and in-page anchors are linked,
    // so a pasted javascript: URL cannot execute when the note is previewed.
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (m, label, url) {
      var href = url.trim();
      if (!/^(https?:\/\/|mailto:|#|\/|\.\.?\/)/i.test(href)) return m;
      return '<a href="' + href.replace(/"/g, '&quot;') + '" target="_blank" rel="noopener noreferrer" class="md-link">' + label + '</a>';
    });

    // Obsidian Tags: #tag
    s = s.replace(/(^|\s)#([a-zA-Z][a-zA-Z0-9_\-\/]*)/g, '$1<span class="obsidian-tag">#$2</span>');

    // Restore inline images
    for (var i = 0; i < imgPlaceholders.length; i++) {
      s = s.replace('%%IMG_INLINE_' + i + '%%', imgPlaceholders[i]);
    }

    // Restore diagram placeholders
    for (var d = 0; d < diagramPlaceholders.length; d++) {
      s = s.replace('%%DIAGRAM_INLINE_' + d + '%%', diagramPlaceholders[d]);
    }

    return s;
  }

  // Image preview modal
  window.masterclassPreviewImage = function (src) {
    if (!src) return;
    var modal = document.getElementById('masterclassImageModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'masterclassImageModal';
      modal.className = 'image-preview-modal';
      modal.innerHTML = '<div class="image-preview-backdrop"></div>' +
        '<div class="image-preview-box">' +
        '<img src="" id="masterclassPreviewImg" alt="Enlarged Note Image" />' +
        '<button class="image-preview-close" title="Close Preview">&times;</button>' +
        '</div>';
      document.body.appendChild(modal);

      modal.querySelector('.image-preview-backdrop').addEventListener('click', function () {
        modal.classList.remove('is-open');
      });
      modal.querySelector('.image-preview-close').addEventListener('click', function () {
        modal.classList.remove('is-open');
      });
    }
    var imgEl = document.getElementById('masterclassPreviewImg');
    if (imgEl) imgEl.src = src;
    modal.classList.add('is-open');
  };

  function processImageFile(file, callback) {
    if (!file || !file.type.match(/^image\//)) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      var rawDataUrl = e.target.result;
      var img = new Image();
      img.onload = function () {
        var maxDim = 1200;
        var w = img.width;
        var h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
          var canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          var compressed = canvas.toDataURL('image/jpeg', 0.85);
          callback(compressed, file.name || 'image.jpg');
        } else {
          callback(rawDataUrl, file.name || 'image.png');
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  }

  function insertFormatting(textarea, prefix, suffix, defaultText) {
    if (!textarea) return;
    textarea.focus();
    var start = textarea.selectionStart;
    var end = textarea.selectionEnd;
    var val = textarea.value;
    var sel = val.substring(start, end) || defaultText || '';
    var replacement = prefix + sel + (suffix || '');
    textarea.value = val.substring(0, start) + replacement + val.substring(end);
    var newPos = start + prefix.length + sel.length;
    textarea.setSelectionRange(newPos, newPos);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function insertLinePrefix(textarea, prefix, defaultText) {
    if (!textarea) return;
    textarea.focus();
    var start = textarea.selectionStart;
    var end = textarea.selectionEnd;
    var val = textarea.value;
    var lineStart = val.lastIndexOf('\n', start - 1) + 1;
    var sel = val.substring(start, end) || defaultText || '';
    if (start === end && !val.substring(lineStart, start).trim()) {
      textarea.value = val.substring(0, lineStart) + prefix + sel + val.substring(end);
      var pos = lineStart + prefix.length + sel.length;
      textarea.setSelectionRange(pos, pos);
    } else {
      var needNewline = (start > 0 && val[start - 1] !== '\n');
      textarea.value = val.substring(0, start) + (needNewline ? '\n' : '') + prefix + sel + val.substring(end);
      var pos2 = start + (needNewline ? 1 : 0) + prefix.length + sel.length;
      textarea.setSelectionRange(pos2, pos2);
    }
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }

  // ==========================================================================
  //  ATTACHMENT & MEDIA ASSET STORE (Clean short references in edit mode)
  // ==========================================================================
  var STORAGE_LESSON_ASSETS_KEY = 'bfp_lesson_notepad_assets_v1';

  function getStoredAssets() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_LESSON_ASSETS_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  function saveStoredAsset(id, dataUrl, meta) {
    if (!id || !dataUrl) return false;
    try {
      var cleanId = id.replace(/^attachment:\/\//i, '').trim();
      var assets = getStoredAssets();
      assets[cleanId] = {
        dataUrl: dataUrl,
        meta: meta || {},
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_LESSON_ASSETS_KEY, JSON.stringify(assets));
      return true;
    } catch (e) {
      // Almost always QuotaExceededError. The caller must not link an asset
      // that will be missing on the next page load.
      console.warn('[BFP] could not store attachment ' + id + ':', e);
      return false;
    }
  }

  function getStoredAsset(id) {
    if (!id) return null;
    var cleanId = id.replace(/^attachment:\/\//i, '').trim();
    var assets = getStoredAssets();
    if (assets[cleanId] && assets[cleanId].dataUrl) {
      return assets[cleanId].dataUrl;
    }
    return null;
  }

  function resolveAssetUrl(url, alt) {
    if (!url) return '';
    var cleanUrl = url.trim();
    if (cleanUrl.indexOf('attachment://') === 0) {
      var assetId = cleanUrl.replace(/^attachment:\/\//i, '');
      var stored = getStoredAsset(assetId);
      if (stored) return stored;
      var diagOnPage = findDiagramOnPage(alt || assetId);
      if (diagOnPage) {
        var v = extractDiagramVisual(diagOnPage);
        if (v && v.dataUrl) {
          saveStoredAsset(assetId, v.dataUrl, { title: alt, type: 'diagram' });
          return v.dataUrl;
        }
      }
    }
    return cleanUrl;
  }

  // ==========================================================================
  //  LESSON NOTEPAD STORAGE & MANAGER (OBSIDIAN FULL TEXTAREA)
  // ==========================================================================
  var STORAGE_LESSON_DOCS_KEY = 'bfp_lesson_notepad_docs_v1';

  function getStoredLessonDocs() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_LESSON_DOCS_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  function saveStoredLessonDocs(docs) {
    try {
      localStorage.setItem(STORAGE_LESSON_DOCS_KEY, JSON.stringify(docs));
    } catch (e) {}
  }

  function getLessonDoc(slug) {
    var docs = getStoredLessonDocs();
    if (docs[slug] && docs[slug].trim()) {
      return docs[slug];
    }

    var activeLesson = getActiveLessonInfo();
    var starter = '';
    if (activeLesson.isChapter) {
      starter = '# ' + activeLesson.title + ' — Study Notes\n\n## Key Takeaways\n- \n\n## Notes & Architecture Decisions\n\n';
    } else {
      starter = '# Backend from First Principles — Master Study Notes\n\n## Curriculum Notes & Architecture Plan\n- \n\n';
    }

    docs[slug] = starter;
    saveStoredLessonDocs(docs);
    return starter;
  }

  function setLessonDoc(slug, text) {
    var docs = getStoredLessonDocs();
    docs[slug] = text;
    saveStoredLessonDocs(docs);
  }

  function appendExcerptToActiveLessonDoc(text, type, title, userNote) {
    if (!text || !text.trim()) return;
    var activeLesson = getActiveLessonInfo();
    if (!activeLesson.isChapter) return; // Do not append lesson-specific excerpts to homepage overview doc

    var curDoc = getLessonDoc(activeLesson.slug);
    var formatted = '';
    if (type === 'code') {
      if (text.indexOf('```') !== -1 || text.indexOf('### Code') !== -1) {
        formatted = '\n' + text.trim() + '\n';
      } else {
        var normLang = detectCodeLanguage(text);
        formatted = '\n### Code: ' + (title || 'Snippet') + '\n```' + normLang + '\n' + text.trim() + '\n```\n';
      }
      if (userNote) formatted += '> **Personal Note:** ' + userNote.trim() + '\n';
    } else if (type === 'diagram') {
      if (text.indexOf('![') !== -1 || text.indexOf('### Diagram') !== -1) {
        formatted = '\n' + text.trim() + '\n';
      } else {
        formatted = '\n> [!note] Diagram: ' + (title || 'Architecture') + '\n> ' + text.trim().split('\n').join('\n> ') + '\n';
      }
      if (userNote) formatted += '> **Personal Note:** ' + userNote.trim() + '\n';
    } else {
      formatted = '\n> ' + text.trim().split('\n').join('\n> ') + '\n';
      if (userNote) formatted += '> **Personal Note:** ' + userNote.trim() + '\n';
    }

    var cleanFormatted = formatted.trim();
    if (cleanFormatted && curDoc.indexOf(cleanFormatted) === -1) {
      var snippetCheck = text.substring(0, Math.min(25, text.length)).trim();
      if (snippetCheck && title && curDoc.indexOf(title) !== -1 && curDoc.indexOf(snippetCheck) !== -1) {
        return; // Already present in document
      }
      curDoc = curDoc.trimEnd() + '\n\n' + cleanFormatted + '\n';
      setLessonDoc(activeLesson.slug, curDoc);
      var textarea = document.getElementById('lessonNotepadTextarea');
      if (textarea) {
        textarea.value = curDoc;
        updateNotepadStats();
      }
      var preview = document.getElementById('lessonNotepadPreview');
      if (preview && preview.style.display !== 'none') {
        preview.innerHTML = renderObsidianMarkdown(curDoc);
        attachPreviewTaskListeners();
      }
    }
  }

  var autoSaveTimer = null;
  function handleNotepadInput() {
    var textarea = document.getElementById('lessonNotepadTextarea');
    var statusEl = document.getElementById('notesSaveStatus');
    if (!textarea) return;

    if (statusEl) {
      statusEl.textContent = '● Saving...';
      statusEl.className = 'notes-save-status is-saving';
    }

    updateNotepadStats();

    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(function () {
      var activeLesson = getActiveLessonInfo();
      setLessonDoc(activeLesson.slug, textarea.value);
      if (statusEl) {
        var timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        statusEl.textContent = '● Saved ' + timeStr;
        statusEl.className = 'notes-save-status is-saved';
      }
    }, 320);
  }

  function updateNotepadStats() {
    var textarea = document.getElementById('lessonNotepadTextarea');
    var statsEl = document.getElementById('notesFooterStats');
    if (!textarea || !statsEl) return;
    var val = textarea.value.trim();
    var words = val ? val.split(/\s+/).length : 0;
    var chars = val.length;
    statsEl.textContent = words + ' words · ' + chars + ' chars';
  }

  var currentNotepadMode = 'edit';
  function switchNotepadMode(mode) {
    currentNotepadMode = mode;
    var drawer = document.getElementById('notesSidebarDrawer');
    var textarea = document.getElementById('lessonNotepadTextarea');
    var preview = document.getElementById('lessonNotepadPreview');
    var editBtn = document.getElementById('notesEditModeBtn');
    var prevBtn = document.getElementById('notesPreviewModeBtn');
    var toolbar = document.getElementById('obsidianToolbar');

    if (mode === 'preview') {
      if (editBtn) {
        editBtn.classList.remove('active');
        editBtn.setAttribute('aria-selected', 'false');
      }
      if (prevBtn) {
        prevBtn.classList.add('active');
        prevBtn.setAttribute('aria-selected', 'true');
      }
      if (textarea) textarea.style.display = 'none';
      if (preview) {
        preview.style.display = 'block';
        preview.innerHTML = renderObsidianMarkdown(textarea ? textarea.value : '');
        attachPreviewTaskListeners();
      }
      if (toolbar) {
        toolbar.classList.add('is-preview-mode');
      }
    } else {
      if (prevBtn) {
        prevBtn.classList.remove('active');
        prevBtn.setAttribute('aria-selected', 'false');
      }
      if (editBtn) {
        editBtn.classList.add('active');
        editBtn.setAttribute('aria-selected', 'true');
      }
      if (preview) preview.style.display = 'none';
      if (textarea) {
        textarea.style.display = 'block';
        textarea.focus();
      }
      if (toolbar) {
        toolbar.classList.remove('is-preview-mode');
      }
    }
  }

  function attachPreviewTaskListeners() {
    var preview = document.getElementById('lessonNotepadPreview');
    var textarea = document.getElementById('lessonNotepadTextarea');
    if (!preview || !textarea) return;

    preview.querySelectorAll('.md-task-item').forEach(function (taskEl, idx) {
      taskEl.style.cursor = 'pointer';
      taskEl.title = 'Click to toggle task checkbox';
      taskEl.onclick = function (e) {
        e.stopPropagation();
        var val = textarea.value;
        var taskCount = 0;
        var updatedVal = val.replace(/^(\s*[-*]\s+\[)([\s xX])(\]\s+.+)$/gm, function (m, p1, box, p3) {
          if (taskCount === idx) {
            var newBox = (box.trim().toLowerCase() === 'x') ? ' ' : 'x';
            taskCount++;
            return p1 + newBox + p3;
          }
          taskCount++;
          return m;
        });

        textarea.value = updatedVal;
        handleNotepadInput();
        preview.innerHTML = renderObsidianMarkdown(updatedVal);
        attachPreviewTaskListeners();
      };
    });
  }

  function initSidebarResizer() {
    var drawer = document.getElementById('notesSidebarDrawer');
    if (!drawer) return;
    var resizer = document.createElement('div');
    resizer.className = 'notes-sidebar-resizer';
    drawer.insertBefore(resizer, drawer.firstChild);

    var isResizing = false;
    var startX = 0;
    var startWidth = 0;

    resizer.addEventListener('mousedown', function (e) {
      isResizing = true;
      startX = e.clientX;
      startWidth = parseInt(document.defaultView.getComputedStyle(drawer).width, 10);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'ew-resize';
      e.preventDefault();
    });

    document.addEventListener('mousemove', function (e) {
      if (!isResizing) return;
      var newWidth = startWidth + (startX - e.clientX);
      if (newWidth > 320 && newWidth < window.innerWidth - 100) {
        drawer.style.width = newWidth + 'px';
        try {
          localStorage.setItem('bfp_masterclass_sidebar_width', newWidth);
        } catch (err) {}
      }
    });

    document.addEventListener('mouseup', function () {
      if (isResizing) {
        isResizing = false;
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      }
    });
  }

  function getSavedSidebarWidth() {
    try {
      var saved = localStorage.getItem('bfp_masterclass_sidebar_width');
      if (saved) return parseInt(saved, 10);
    } catch (e) {}
    return 480;
  }

  function initNotesSidebar() {
    if (document.getElementById('notesSidebarDrawer')) return;

    var backdrop = document.createElement('div');
    backdrop.className = 'notes-sidebar-backdrop';
    backdrop.id = 'notesSidebarBackdrop';
    document.body.appendChild(backdrop);

    var activeLesson = getActiveLessonInfo();
    var activeLessonLabel = activeLesson.isChapter ? ('Active Lesson: ' + activeLesson.shortTitle) : 'All Masterclass Lessons';
    var exportBtnLabel = activeLesson.isChapter ? ('Export Markdown (' + activeLesson.shortTitle + ')') : 'Export Markdown';

    var drawer = document.createElement('aside');
    drawer.className = 'notes-sidebar-drawer notes-notepad-drawer';
    drawer.id = 'notesSidebarDrawer';
    drawer.innerHTML = '<div class="notes-sidebar-header">' +
      '<div class="notes-sidebar-top-row">' +
      '<div style="display:flex; align-items:center; gap:8px;">' +
      '<div class="notes-sidebar-title">Study Notes</div>' +
      '<span class="notes-save-status is-saved" id="notesSaveStatus" aria-live="polite">● Saved</span>' +
      '</div>' +
      '<div style="display:flex; align-items:center; gap:6px;">' +
      '<div class="notes-mode-toggle" role="tablist" aria-label="Notepad View Modes">' +
      '<button type="button" class="notes-mode-btn active" id="notesEditModeBtn" role="tab" aria-selected="true" aria-controls="lessonNotepadTextarea" aria-label="Edit Markdown (Ctrl+Shift+E)" title="Edit Markdown">' + SVG_ICONS.edit + ' <span>Edit</span></button>' +
      '<button type="button" class="notes-mode-btn" id="notesPreviewModeBtn" role="tab" aria-selected="false" aria-controls="lessonNotepadPreview" aria-label="Rendered Preview (Ctrl+Shift+P)" title="Rendered Obsidian View">' + SVG_ICONS.preview + ' <span>Preview</span></button>' +
      '</div>' +
      '<button class="dock-btn" id="sidebarCloseBtn" aria-label="Close Study Notes" title="Close Study Notes" style="font-size:13.5px; border:1px solid var(--line-strong); display:inline-flex; align-items:center; justify-content:center; padding:6px 14px; border-radius:8px;">Close</button>' +
      '</div>' +
      '</div>' +
      '<div class="notes-sidebar-active-badge" id="sidebarActiveLessonBadge">' +
      '<span class="active-badge-dot"></span>' +
      '<span id="sidebarActiveLessonText">' + escapeHtml(activeLessonLabel) + '</span>' +
      '</div>' +
      '<div class="obsidian-toolbar" id="obsidianToolbar" role="toolbar" aria-label="Markdown formatting toolbar">' +
      '<button type="button" class="obs-tool-btn" data-tool="bold" aria-label="Bold text (Ctrl+B)" title="Bold (**text**) — Ctrl+B"><span class="obs-tool-glyph">B</span></button>' +
      '<button type="button" class="obs-tool-btn" data-tool="italic" aria-label="Italic text (Ctrl+I)" title="Italic (*text*) — Ctrl+I"><span class="obs-tool-glyph"><i>I</i></span></button>' +
      '<button type="button" class="obs-tool-btn" data-tool="heading" aria-label="Heading Level 3" title="Heading (### Heading)"><span class="obs-tool-glyph">H</span></button>' +
      '<button type="button" class="obs-tool-btn" data-tool="highlight" aria-label="Highlight text" title="Highlight (==text==)"><span class="obs-tool-glyph">==</span></button>' +
      '<button type="button" class="obs-tool-btn" data-tool="strike" aria-label="Strikethrough text" title="Strikethrough (~~text~~)"><span class="obs-tool-glyph"><del>S</del></span></button>' +
      '<div class="obs-tool-divider" role="separator" aria-orientation="vertical"></div>' +
      '<button type="button" class="obs-tool-btn" data-tool="code" aria-label="Code block or inline code (Ctrl+Shift+C)" title="Code Block / Inline Code — Ctrl+Shift+C"><span class="obs-tool-glyph">&lt;/&gt;</span></button>' +
      '<button type="button" class="obs-tool-btn" data-tool="callout" aria-label="Insert Obsidian Callout block" title="Obsidian Callout (> [!tip])">' + SVG_ICONS.callout + ' <span>Callout</span></button>' +
      '<button type="button" class="obs-tool-btn" data-tool="task" aria-label="Insert Task list item" title="Task List (- [ ])">' + SVG_ICONS.task + ' <span>Task</span></button>' +
      '<button type="button" class="obs-tool-btn" data-tool="bullet" aria-label="Insert Bullet list item" title="Bullet List (- item)">' + SVG_ICONS.list + ' <span>List</span></button>' +
      '<div class="obs-tool-divider" role="separator" aria-orientation="vertical"></div>' +
      '<button type="button" class="obs-tool-btn" data-tool="wikilink" aria-label="Insert internal WikiLink (Ctrl+K)" title="WikiLink ([[Topic]]) — Ctrl+K">' + SVG_ICONS.wikilink + ' <span>[[ ]]</span></button>' +
      '<button type="button" class="obs-tool-btn" data-tool="tag" aria-label="Insert Obsidian Tag" title="Tag (#tag)">' + SVG_ICONS.tag + ' <span>#tag</span></button>' +
      '<button type="button" class="obs-tool-btn obs-tool-btn-img" id="notepadImportImgBtn" aria-label="Import image or paste from clipboard" title="Import Image (or paste / drop)">' + SVG_ICONS.image + ' <span>Image</span></button>' +
      '<input type="file" id="notepadImageFileInput" accept="image/*" style="display:none;" aria-hidden="true" />' +
      '<div style="flex:1;"></div>' +
      '<button type="button" class="obs-tool-btn obs-save-btn" id="notepadManualSaveBtn" aria-label="Save notes immediately (Ctrl+S)" title="Save notes now — Ctrl+S">' + SVG_ICONS.save + ' <span>Save</span></button>' +
      '</div>' +
      '</div>' +
      '<!-- FULL HEIGHT TEXTAREA & PREVIEW -->' +
      '<div class="notes-notepad-body" id="notesNotepadBody">' +
      '<textarea class="notes-notepad-textarea" id="lessonNotepadTextarea" aria-label="Study notes Markdown editor" placeholder="Write your notes here in Obsidian Markdown...&#10;&#10;Tip: You can paste (Ctrl+V) or drag & drop images directly here!"></textarea>' +
      '<div class="notes-notepad-preview" id="lessonNotepadPreview" style="display:none;" aria-label="Rendered Study Notes preview"></div>' +
      '</div>' +
      '<div class="notes-sidebar-footer">' +
      '<div class="notes-footer-stats" id="notesFooterStats" aria-live="polite">0 words · 0 chars</div>' +
      '<div style="display:flex; align-items:center; gap:8px;">' +
      '<button class="dock-btn reset-notes-btn" id="sidebarResetNotesBtn" aria-label="Clear and reset notes for this lesson" title="Clear notes for this lesson" style="font-size:13.5px; color:#ff6b57; border:1px solid rgba(255,107,87,0.35); background:transparent; display:inline-flex; align-items:center; justify-content:center; padding:8px 14px; border-radius:8px; cursor:pointer;">Clear</button>' +
      '<button class="dock-btn export-md-btn" id="exportMdBtn" aria-label="Export Study Notes as Markdown file" style="background:var(--accent); color:#fff; border-color:var(--accent); font-size:13.5px; padding:8px 16px; border-radius:8px;">' +
      '<span id="exportMdBtnLabel">' + escapeHtml(exportBtnLabel) + '</span>' +
      '</button>' +
      '</div>' +
      '</div>';
    document.body.appendChild(drawer);

    initSidebarResizer();

    var textarea = document.getElementById('lessonNotepadTextarea');
    var editModeBtn = document.getElementById('notesEditModeBtn');
    var previewModeBtn = document.getElementById('notesPreviewModeBtn');
    var manualSaveBtn = document.getElementById('notepadManualSaveBtn');
    var toolbar = document.getElementById('obsidianToolbar');

    if (editModeBtn) editModeBtn.addEventListener('click', function () { switchNotepadMode('edit'); });
    if (previewModeBtn) previewModeBtn.addEventListener('click', function () { switchNotepadMode('preview'); });

    if (textarea) {
      textarea.addEventListener('input', handleNotepadInput);

      textarea.addEventListener('keydown', function (e) {
        var isCtrlOrCmd = e.ctrlKey || e.metaKey;

        if (isCtrlOrCmd && (e.key === 'b' || e.key === 'B')) {
          e.preventDefault();
          insertFormatting(textarea, '**', '**', 'bold text');
          handleNotepadInput();
          return;
        }

        if (isCtrlOrCmd && (e.key === 'i' || e.key === 'I')) {
          e.preventDefault();
          insertFormatting(textarea, '*', '*', 'italic text');
          handleNotepadInput();
          return;
        }

        if (isCtrlOrCmd && (e.key === 's' || e.key === 'S')) {
          e.preventDefault();
          var activeLesson = getActiveLessonInfo();
          setLessonDoc(activeLesson.slug, textarea.value);
          var statusEl = document.getElementById('notesSaveStatus');
          if (statusEl) {
            var timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            statusEl.textContent = '● Saved ' + timeStr;
            statusEl.className = 'notes-save-status is-saved';
          }
          return;
        }

        if (isCtrlOrCmd && (e.key === 'k' || e.key === 'K')) {
          e.preventDefault();
          insertFormatting(textarea, '[[', ']]', 'Lesson Reference');
          handleNotepadInput();
          return;
        }

        if (isCtrlOrCmd && e.shiftKey && (e.key === 'c' || e.key === 'C')) {
          e.preventDefault();
          insertFormatting(textarea, '```\n', '\n```', 'code');
          handleNotepadInput();
          return;
        }

        if (isCtrlOrCmd && e.shiftKey && (e.key === 'e' || e.key === 'E')) {
            e.preventDefault();
            switchNotepadMode('edit');
            return;
        }

        if (isCtrlOrCmd && e.shiftKey && (e.key === 'p' || e.key === 'P')) {
            e.preventDefault();
            switchNotepadMode('preview');
            return;
        }

        if (e.key === 'Tab') {
          e.preventDefault();
          var start = textarea.selectionStart;
          var end = textarea.selectionEnd;
          var val = textarea.value;

          if (start === end) {
            textarea.value = val.substring(0, start) + '  ' + val.substring(end);
            textarea.selectionStart = textarea.selectionEnd = start + 2;
          } else {
            var lineStart = val.lastIndexOf('\n', start - 1) + 1;
            var lineEnd = val.indexOf('\n', end);
            if (lineEnd === -1) lineEnd = val.length;

            var lines = val.substring(lineStart, lineEnd).split('\n');
            if (e.shiftKey) {
              var newLines = lines.map(function (l) { return l.replace(/^ {1,2}/, ''); });
              var joined = newLines.join('\n');
              textarea.value = val.substring(0, lineStart) + joined + val.substring(lineEnd);
              textarea.selectionStart = lineStart;
              textarea.selectionEnd = lineStart + joined.length;
            } else {
              var newLines2 = lines.map(function (l) { return '  ' + l; });
              var joined2 = newLines2.join('\n');
              textarea.value = val.substring(0, lineStart) + joined2 + val.substring(lineEnd);
              textarea.selectionStart = lineStart;
              textarea.selectionEnd = lineStart + joined2.length;
            }
          }
          handleNotepadInput();
        }
      });
    }

    if (manualSaveBtn) {
      manualSaveBtn.addEventListener('click', function () {
        var activeLesson = getActiveLessonInfo();
        if (textarea) {
          setLessonDoc(activeLesson.slug, textarea.value);
        }
        var statusEl = document.getElementById('notesSaveStatus');
        if (statusEl) {
          var timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          statusEl.textContent = '● Saved ' + timeStr;
          statusEl.className = 'notes-save-status is-saved';
        }
      });
    }

    document.getElementById('sidebarCloseBtn').addEventListener('click', closeNotesSidebar);
    backdrop.addEventListener('click', closeNotesSidebar);
    document.getElementById('exportMdBtn').addEventListener('click', exportToMarkdown);

    var resetBtn = document.getElementById('sidebarResetNotesBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        var activeLesson = getActiveLessonInfo();
        var lessonName = activeLesson.isChapter ? activeLesson.shortTitle : 'all lessons';
        if (!confirm('Clear all study notes and reset markdown for ' + lessonName + '?')) {
          return;
        }

        // 1. Filter out notes belonging to this active lesson from NotesStore
        var notes = NotesStore.getAll();
        var remaining = notes.filter(function (n) {
          if (!n) return false;
          if (activeLesson.isChapter) {
            if (n.targetId && activeLesson.slug && n.targetId.indexOf(activeLesson.slug) !== -1) return false;
            if (n.chapterTitle) {
              var ch = n.chapterTitle.toLowerCase();
              if (activeLesson.shortTitle && ch.indexOf(activeLesson.shortTitle.toLowerCase()) !== -1) return false;
              if (activeLesson.number && (ch.indexOf('chapter ' + activeLesson.number) !== -1 || ch.indexOf('chapter ' + (activeLesson.number < 10 ? '0' + activeLesson.number : activeLesson.number)) !== -1)) return false;
              if (activeLesson.title && ch.indexOf(activeLesson.title.toLowerCase()) !== -1) return false;
            }
            return true;
          }
          return false;
        });
        NotesStore.saveAll(remaining);

        // 2. Clear lesson document in storage
        var docs = getStoredLessonDocs();
        delete docs[activeLesson.slug];
        saveStoredLessonDocs(docs);

        // 3. Reset textarea with starter template
        var starter = '';
        if (activeLesson.isChapter) {
          starter = '# ' + activeLesson.title + ' — Study Notes\n\n## Key Takeaways\n- \n\n## Notes & Architecture Decisions\n\n';
        } else {
          starter = '# Backend from First Principles — Masterclass Study Notes\n\n## Overview\n\n';
        }
        if (textarea) {
          textarea.value = starter;
          updateNotepadStats();
          handleNotepadInput();
        }

        // 4. Update bookmarks and badge
        updatePageBookmarkStates();
        updateNotesBadge();
      });
    }

    // Obsidian Toolbar Formatting Handlers
    if (toolbar && textarea) {
      toolbar.querySelectorAll('.obs-tool-btn[data-tool]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          if (currentNotepadMode === 'preview') switchNotepadMode('edit');
          var tool = btn.getAttribute('data-tool');
          if (tool === 'bold') insertFormatting(textarea, '**', '**', 'bold text');
          else if (tool === 'italic') insertFormatting(textarea, '*', '*', 'italic text');
          else if (tool === 'heading') insertLinePrefix(textarea, '### ', 'Heading');
          else if (tool === 'highlight') insertFormatting(textarea, '==', '==', 'highlighted text');
          else if (tool === 'strike') insertFormatting(textarea, '~~', '~~', 'strikethrough');
          else if (tool === 'code') {
            var s = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
            if (s.indexOf('\n') !== -1) {
              insertFormatting(textarea, '```\n', '\n```', 'code');
            } else {
              insertFormatting(textarea, '`', '`', 'code');
            }
          } else if (tool === 'callout') {
            insertLinePrefix(textarea, '> [!tip] Key Takeaway\n> ', 'Enter callout details here...');
          } else if (tool === 'task') {
            insertLinePrefix(textarea, '- [ ] ', 'Task to review');
          } else if (tool === 'bullet') {
            insertLinePrefix(textarea, '- ', 'List item');
          } else if (tool === 'wikilink') {
            insertFormatting(textarea, '[[', ']]', 'Lesson Reference');
          } else if (tool === 'tag') {
            insertFormatting(textarea, '#', '', 'notes');
          }
          handleNotepadInput();
        });
      });

      function handleImportedImage(dataUrl, name) {
        var cleanName = (name || 'image').replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
        var assetId = 'img_' + cleanName + '_' + Date.now().toString(36);
        if (!saveStoredAsset(assetId, dataUrl, { name: cleanName, type: 'image' })) {
          var statsEl = document.getElementById('notesFooterStats');
          if (statsEl) {
            statsEl.textContent = 'Image not saved \u2014 browser storage is full';
            setTimeout(updateNotepadStats, 4000);
          }
          return;
        }
        if (currentNotepadMode === 'preview') switchNotepadMode('edit');
        insertFormatting(textarea, '\n![' + cleanName + '](attachment://' + assetId + ')\n', '', '');
        handleNotepadInput();
      }

      // Image Import File Input
      var fileInput = document.getElementById('notepadImageFileInput');
      var imgBtn = document.getElementById('notepadImportImgBtn');
      if (imgBtn && fileInput) {
        imgBtn.addEventListener('click', function () {
          fileInput.click();
        });
        fileInput.addEventListener('change', function () {
          if (fileInput.files && fileInput.files[0]) {
            processImageFile(fileInput.files[0], function (dataUrl, name) {
              handleImportedImage(dataUrl, name);
            });
            fileInput.value = '';
          }
        });
      }

      // Drag & Drop Image directly onto Textarea
      var notepadBody = document.getElementById('notesNotepadBody');
      if (notepadBody) {
        notepadBody.addEventListener('dragover', function (e) {
          e.preventDefault();
          notepadBody.classList.add('is-dragover');
        });
        notepadBody.addEventListener('dragleave', function () {
          notepadBody.classList.remove('is-dragover');
        });
        notepadBody.addEventListener('drop', function (e) {
          e.preventDefault();
          notepadBody.classList.remove('is-dragover');
          var files = e.dataTransfer ? e.dataTransfer.files : null;
          if (files && files.length) {
            for (var fi = 0; fi < files.length; fi++) {
              if (files[fi].type.match(/^image\//)) {
                processImageFile(files[fi], function (dataUrl, name) {
                  handleImportedImage(dataUrl, name);
                });
              }
            }
          }
        });
      }

      // Paste Image from Clipboard (Ctrl+V)
      textarea.addEventListener('paste', function (e) {
        var clipboardData = e.clipboardData || (window.clipboardData);
        if (!clipboardData) return;
        var items = clipboardData.items;
        if (!items) return;
        for (var pi = 0; pi < items.length; pi++) {
          if (items[pi].type && items[pi].type.indexOf('image') !== -1) {
            var file = items[pi].getAsFile();
            if (file) {
              e.preventDefault();
              processImageFile(file, function (dataUrl, name) {
                handleImportedImage(dataUrl, name);
              });
              break;
            }
          }
        }
      });
    }
  }

  function toggleNotesSidebar() {
    var drawer = document.getElementById('notesSidebarDrawer');
    if (drawer && drawer.classList.contains('is-open')) {
      closeNotesSidebar();
    } else {
      openNotesSidebar();
    }
  }

  function openNotesSidebar() {
    var drawer = document.getElementById('notesSidebarDrawer');
    var backdrop = document.getElementById('notesSidebarBackdrop');
    if (drawer && backdrop) {
      if (window.innerWidth > 600) {
        drawer.style.width = getSavedSidebarWidth() + 'px';
      }

      var activeLesson = getActiveLessonInfo();
      var activeLessonText = document.getElementById('sidebarActiveLessonText');
      if (activeLessonText) {
        activeLessonText.textContent = activeLesson.isChapter ? ('Active Lesson: ' + activeLesson.shortTitle) : 'All Masterclass Lessons';
      }
      var exportLabel = document.getElementById('exportMdBtnLabel');
      if (exportLabel) {
        exportLabel.textContent = activeLesson.isChapter ? ('Export Markdown (' + activeLesson.shortTitle + ')') : 'Export Markdown';
      }

      // Load active lesson document (Title is preloaded if empty)
      var textarea = document.getElementById('lessonNotepadTextarea');
      if (textarea) {
        var docContent = getLessonDoc(activeLesson.slug);
        textarea.value = docContent;
        updateNotepadStats();
      }

      switchNotepadMode('edit');

      drawer.classList.add('is-open');
      backdrop.classList.add('is-open');
      document.body.classList.add('drawer-open');

      if (textarea) {
        setTimeout(function () {
          textarea.focus();
          textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }, 80);
      }
    }
  }

  function closeNotesSidebar() {
    var drawer = document.getElementById('notesSidebarDrawer');
    var backdrop = document.getElementById('notesSidebarBackdrop');
    if (drawer) drawer.classList.remove('is-open');
    if (backdrop) backdrop.classList.remove('is-open');
    document.body.classList.remove('drawer-open');
  }

  function exportToMarkdown() {
    var activeLesson = getActiveLessonInfo();
    var textarea = document.getElementById('lessonNotepadTextarea');
    var content = (textarea ? textarea.value : getLessonDoc(activeLesson.slug)) || '';

    if (!content.trim()) {
      alert('No study notes saved yet for this lesson.');
      return;
    }

    // Expand attachment:// IDs to self-contained data URLs for export portability
    var selfContainedContent = content.replace(/!\[([^\]]*)\]\(attachment:\/\/([^\)]+)\)/g, function (m, alt, id) {
      var dataUrl = getStoredAsset(id);
      if (dataUrl) {
        return '![' + alt + '](' + dataUrl + ')';
      }
      return m;
    });

    var dateStr = new Date().toISOString().split('T')[0];
    var tagSlug = activeLesson.shortTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    var filename = (activeLesson.slug || 'study-notes') + '-study-notes.md';

    var finalMd = '';
    if (selfContainedContent.trim().indexOf('---') === 0) {
      finalMd = selfContainedContent;
    } else {
      finalMd = '---\n' +
        'title: "' + activeLesson.title + ' — Study Notes"\n' +
        'lesson: "' + activeLesson.title + '"\n' +
        (activeLesson.number ? 'chapter: ' + activeLesson.number + '\n' : '') +
        'exported: ' + dateStr + '\n' +
        'tags: [backend, first-principles, study-notes, ' + tagSlug + ']\n' +
        '---\n\n' +
        selfContainedContent;
    }

    downloadBlob(finalMd, filename, 'text/markdown');
  }

  function downloadBlob(content, filename, type) {
    var blob = new Blob([content], { type: type });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ==========================================================================
  //  BOOKMARKING INTERACTION FOR CODE BLOCKS & DIAGRAMS
  // ==========================================================================
  function getCardTabsInfo(card) {
    var tabs = [];
    var tabBtns = card.querySelectorAll('.code-tabs button');
    var panels = card.querySelectorAll('.code-panel');

    tabBtns.forEach(function (tBtn, tIdx) {
      var langAttr = (tBtn.getAttribute('data-lang') || '').toLowerCase();
      var label = tBtn.textContent.replace(/^[\s•●]+/, '').trim() || (langAttr.toUpperCase() || 'Code');
      var panel = card.querySelector('.code-panel[data-panel="' + langAttr + '"]') || panels[tIdx];
      var pre = panel ? panel.querySelector('pre') : null;
      var rawCode = pre ? pre.textContent : '';
      var cleanCode = normalizeExcerptText(rawCode, true);
      var normLang = detectCodeLanguage(cleanCode, langAttr);
      var isTabActive = tBtn.classList.contains('on') || (panel && panel.classList.contains('on'));

      tabs.push({
        index: tIdx,
        btn: tBtn,
        langAttr: langAttr,
        normLang: normLang,
        label: label,
        panel: panel,
        code: cleanCode,
        isActive: isTabActive
      });
    });

    return tabs;
  }

  function getCardTitle(card) {
    var fnameEl = card.querySelector('.fname, .filename');
    if (fnameEl && fnameEl.textContent.trim()) return fnameEl.textContent.trim();
    var capEl = card.querySelector('.code-cap');
    if (capEl && capEl.textContent.trim()) return capEl.textContent.trim();
    var prev = card.previousElementSibling;
    while (prev) {
      if (['H1', 'H2', 'H3', 'H4', 'H5'].indexOf(prev.tagName) !== -1) {
        var hText = prev.textContent.trim();
        if (hText) return hText;
      }
      prev = prev.previousElementSibling;
    }
    return 'Code Snippet';
  }

  function saveCodeTab(card, tabInfo, targetId) {
    var cardTitle = getCardTitle(card);
    var itemTitle = cardTitle + ' (' + tabInfo.label + ')';
    var tabTargetId = targetId + '_' + tabInfo.langAttr;
    var excerpt = '\n### Code: ' + itemTitle + '\n```' + tabInfo.normLang + '\n' + tabInfo.code + '\n```\n';

    var item = {
      id: 'code_' + Date.now() + '_' + tabInfo.langAttr,
      targetId: tabTargetId,
      cardTargetId: targetId,
      chapterTitle: getCleanChapterTitle(),
      url: window.location.href.split('#')[0] + '#' + targetId,
      type: 'code',
      lang: tabInfo.normLang,
      text: itemTitle + ':\n' + tabInfo.code,
      userNote: '',
      color: 'rust',
      createdAt: new Date().toISOString()
    };
    NotesStore.add(item);
    appendExcerptToActiveLessonDoc(excerpt.trim(), 'code', itemTitle);
    updatePageBookmarkStates();
  }

  function saveAllCodeTabs(card, tabs, targetId) {
    var cardTitle = getCardTitle(card);
    tabs.forEach(function (tabInfo) {
      var tabTargetId = targetId + '_' + tabInfo.langAttr;
      var isSaved = NotesStore.getAll().some(function (n) { return n.targetId === tabTargetId; });
      if (!isSaved) {
        var itemTitle = cardTitle + ' (' + tabInfo.label + ')';
        var excerpt = '\n### Code: ' + itemTitle + '\n```' + tabInfo.normLang + '\n' + tabInfo.code + '\n```\n';
        var item = {
          id: 'code_' + Date.now() + '_' + tabInfo.langAttr,
          targetId: tabTargetId,
          cardTargetId: targetId,
          chapterTitle: getCleanChapterTitle(),
          url: window.location.href.split('#')[0] + '#' + targetId,
          type: 'code',
          lang: tabInfo.normLang,
          text: itemTitle + ':\n' + tabInfo.code,
          userNote: '',
          color: 'rust',
          createdAt: new Date().toISOString()
        };
        NotesStore.add(item);
        appendExcerptToActiveLessonDoc(excerpt.trim(), 'code', itemTitle);
      }
    });
    updatePageBookmarkStates();
  }

  function removeCardCodeFromNotes(targetId) {
    var allNotes = NotesStore.getAll();
    allNotes.forEach(function (n) {
      if (n.targetId === targetId || (n.targetId && n.targetId.indexOf(targetId + '_') === 0) || n.cardTargetId === targetId) {
        NotesStore.remove(n.id);
      }
    });
    updatePageBookmarkStates();
  }

  function closeActiveCodeBookmarkPopover() {
    var existing = document.getElementById('activeCodeBookmarkPopover');
    if (existing) existing.remove();
  }

  function showCodeBookmarkPopover(btn, card, targetId) {
    var existing = document.getElementById('activeCodeBookmarkPopover');
    if (existing) {
      var isSameBtn = existing.getAttribute('data-btn-id') === targetId;
      existing.remove();
      if (isSameBtn) return;
    }

    var tabs = getCardTabsInfo(card);
    var activeTab = tabs.find(function (t) { return t.isActive; }) || tabs[0];
    var allNotes = NotesStore.getAll();

    var savedTabsCount = 0;
    tabs.forEach(function (t) {
      var tabTargetId = targetId + '_' + t.langAttr;
      t.isSaved = allNotes.some(function (n) { return n.targetId === tabTargetId; });
      if (t.isSaved) savedTabsCount++;
    });

    var popover = document.createElement('div');
    popover.className = 'code-bookmark-popover';
    popover.id = 'activeCodeBookmarkPopover';
    popover.setAttribute('data-btn-id', targetId);

    var allTabLabels = tabs.map(function (t) { return t.label; }).join(' + ');

    var html = '<div class="cb-popover-title">Save Code Snippet</div>' +
      '<div class="cb-popover-options">' +
      '  <button type="button" class="cb-popover-btn active-tab-btn" aria-label="Save active ' + escapeHtml(activeTab.label) + ' tab">' +
      '    <span class="cb-icon">' + SVG_ICONS.pin + '</span>' +
      '    <div class="cb-btn-body">' +
      '      <b>Save Active (' + escapeHtml(activeTab.label) + ')</b>' +
      '      <small>' + (activeTab.isSaved ? 'Already saved in notes (click to re-save)' : 'Save ' + escapeHtml(activeTab.label) + ' snippet to notes') + '</small>' +
      '    </div>' +
      '  </button>' +
      '  <button type="button" class="cb-popover-btn all-tabs-btn" aria-label="Save all tabs (' + escapeHtml(allTabLabels) + ')">' +
      '    <span class="cb-icon">' + SVG_ICONS.layers + '</span>' +
      '    <div class="cb-btn-body">' +
      '      <b>Save All (' + escapeHtml(allTabLabels) + ')</b>' +
      '      <small>' + (savedTabsCount === tabs.length ? 'All languages saved in notes' : 'Save all language versions together') + '</small>' +
      '    </div>' +
      '  </button>';

    if (savedTabsCount > 0) {
      html += '  <button type="button" class="cb-popover-btn remove-btn" aria-label="Remove snippets of this block from notes">' +
        '    <span class="cb-icon">' + SVG_ICONS.trash + '</span>' +
        '    <div class="cb-btn-body">' +
        '      <b>Remove from Notes</b>' +
        '      <small>Unlink saved snippets of this block</small>' +
        '    </div>' +
        '  </button>';
    }

    html += '</div>';
    popover.innerHTML = html;

    popover.querySelector('.active-tab-btn').onclick = function (e) {
      e.stopPropagation();
      e.preventDefault();
      var curTabs = getCardTabsInfo(card);
      var curActive = curTabs.find(function (t) { return t.isActive; }) || curTabs[0];
      saveCodeTab(card, curActive, targetId);
      closeActiveCodeBookmarkPopover();
    };

    popover.querySelector('.all-tabs-btn').onclick = function (e) {
      e.stopPropagation();
      e.preventDefault();
      var curTabs = getCardTabsInfo(card);
      saveAllCodeTabs(card, curTabs, targetId);
      closeActiveCodeBookmarkPopover();
    };

    var removeBtn = popover.querySelector('.remove-btn');
    if (removeBtn) {
      removeBtn.onclick = function (e) {
        e.stopPropagation();
        e.preventDefault();
        removeCardCodeFromNotes(targetId);
        closeActiveCodeBookmarkPopover();
      };
    }

    var rect = btn.getBoundingClientRect();
    popover.style.position = 'fixed';
    popover.style.top = (rect.bottom + 6) + 'px';
    popover.style.right = (window.innerWidth - rect.right) + 'px';
    popover.style.left = 'auto';
    popover.style.zIndex = '100030';
    document.body.appendChild(popover);
  }

  function updatePageBookmarkStates() {
    var notes = NotesStore.getAll();
    var savedTargetIds = {};

    notes.forEach(function (n) {
      if (n.targetId) savedTargetIds[n.targetId] = true;
      if (n.cardTargetId) savedTargetIds[n.cardTargetId] = true;
    });

    document.querySelectorAll('.code-bookmark-btn').forEach(function (btn) {
      var tid = btn.getAttribute('data-target-id');
      var card = btn.closest('.codecard, .codeblock');
      var isSaved = false;

      if (savedTargetIds[tid]) {
        isSaved = true;
      } else {
        for (var k in savedTargetIds) {
          if (k.indexOf(tid + '_') === 0) {
            isSaved = true;
            break;
          }
        }
      }

      if (card && card.querySelectorAll('.code-tabs button').length > 1) {
        btn.classList.add('has-dropdown');
      }

      if (isSaved) {
        btn.classList.add('is-saved');
        btn.innerHTML = 'Saved';
      } else {
        btn.classList.remove('is-saved');
        btn.innerHTML = '+ Note';
      }
    });

    document.querySelectorAll('.viz-bookmark-btn').forEach(function (btn) {
      var tid = btn.getAttribute('data-target-id');
      if (savedTargetIds[tid]) {
        btn.classList.add('is-saved');
        btn.innerHTML = 'Saved';
      } else {
        btn.classList.remove('is-saved');
        btn.innerHTML = '+ Save Diagram';
      }
    });
  }

  function initCodeAndDiagramBookmarks() {
    var activeLesson = getActiveLessonInfo();
    var chapterSlug = activeLesson.slug || 'masterclass';

    // 1. Code Blocks
    var codeBlocks = document.querySelectorAll('.codecard, .codeblock');
    codeBlocks.forEach(function (card, idx) {
      var targetId = card.id || ('code_' + chapterSlug + '_' + (idx + 1));
      card.id = targetId;

      var header = card.querySelector('.codebar, .code-bar');
      if (header && !header.querySelector('.code-bookmark-btn')) {
        var fnameEl = header.querySelector('.fname, .filename');
        var langtag = header.querySelector('.langtag');
        var fname = fnameEl ? fnameEl.textContent.trim() : (langtag ? langtag.textContent.trim() : getCardTitle(card));

        var btn = document.createElement('button');
        btn.className = 'code-bookmark-btn';
        btn.setAttribute('data-target-id', targetId);
        btn.innerHTML = '+ Note';
        btn.title = 'Bookmark code snippet to Study Notes';

        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          var hasTabs = card.querySelectorAll('.code-tabs button').length > 1;

          if (hasTabs) {
            // Multi-tab card: open interactive options dropdown
            showCodeBookmarkPopover(btn, card, targetId);
          } else {
            // Single code block: direct toggle
            var isAlreadySaved = btn.classList.contains('is-saved');
            if (isAlreadySaved) {
              removeCardCodeFromNotes(targetId);
            } else {
              var pre = card.querySelector('pre');
              var rawCode = pre ? pre.textContent : '';
              var cleanCode = normalizeExcerptText(rawCode, true);
              var normLang = detectCodeLanguage(cleanCode);

              var item = {
                id: 'code_' + Date.now(),
                targetId: targetId,
                cardTargetId: targetId,
                chapterTitle: getCleanChapterTitle(),
                url: window.location.href.split('#')[0] + '#' + targetId,
                type: 'code',
                lang: normLang,
                text: fname + ':\n' + cleanCode,
                userNote: '',
                color: 'rust',
                createdAt: new Date().toISOString()
              };
              NotesStore.add(item);
              appendExcerptToActiveLessonDoc('\n### Code: ' + fname + '\n```' + normLang + '\n' + cleanCode + '\n```\n', 'code', fname);
            }
            updatePageBookmarkStates();
          }
        });

        // Listen for tab changes on card to update states
        card.querySelectorAll('.code-tabs button').forEach(function (tBtn) {
          tBtn.addEventListener('click', function () {
            setTimeout(updatePageBookmarkStates, 60);
          });
        });

        if (langtag) {
          langtag.parentNode.insertBefore(btn, langtag);
        } else {
          header.appendChild(btn);
        }
      }
    });

    // 2. Diagrams & Figures
    var diagrams = document.querySelectorAll('.viz, figure');
    diagrams.forEach(function (diag, idx) {
      var targetId = diag.id || ('diagram_' + chapterSlug + '_' + (idx + 1));
      diag.id = targetId;

      if (diag.classList.contains('viz')) {
        var cap = diag.querySelector('.viz-cap');
        if (cap && !diag.querySelector('.viz-bookmark-btn')) {
          var btn = document.createElement('button');
          btn.className = 'viz-bookmark-btn';
          btn.setAttribute('data-target-id', targetId);
          btn.innerHTML = '+ Save Diagram';
          btn.title = 'Bookmark diagram to Study Notes';

          btn.addEventListener('click', function (e) {
            e.stopPropagation();
            var isAlreadySaved = btn.classList.contains('is-saved');
            if (isAlreadySaved) {
              NotesStore.removeByTargetId(targetId);
            } else {
              var diagVisual = extractDiagramVisual(diag);
              var title = diagVisual ? diagVisual.title : 'Architecture Diagram';
              var excerpt = '';
              if (diagVisual && diagVisual.dataUrl) {
                var assetId = 'diag_' + (diag.id ? diag.id.replace(/[^a-zA-Z0-9_-]/g, '_') : ('d' + Date.now()));
                saveStoredAsset(assetId, diagVisual.dataUrl, { title: title, type: 'diagram' });
                excerpt = '\n### Diagram: ' + title + '\n![' + title + '](attachment://' + assetId + ')\n';
              } else {
                excerpt = '\n> [!note] Diagram: ' + title + '\n> ' + title + '\n';
              }

              var item = {
                id: 'diag_' + Date.now(),
                targetId: targetId,
                chapterTitle: getCleanChapterTitle(),
                url: window.location.href.split('#')[0] + '#' + targetId,
                type: 'diagram',
                text: excerpt.trim(),
                userNote: '',
                color: 'emerald',
                createdAt: new Date().toISOString()
              };
              NotesStore.add(item);
              appendExcerptToActiveLessonDoc(excerpt.trim(), 'diagram', title, '');
            }
            updatePageBookmarkStates();
          });
          cap.appendChild(btn);
        }
      } else {
        var frame = diag.querySelector('.fig-frame') || diag;
        if (frame && !diag.querySelector('.viz-bookmark-btn')) {
          var figcap = diag.querySelector('figcaption');
          var title = figcap ? figcap.textContent.trim() : 'Architecture Diagram';
          var topBar = document.createElement('div');
          topBar.className = 'fig-bookmark-bar';
          var fbtn = document.createElement('button');
          fbtn.className = 'viz-bookmark-btn';
          fbtn.setAttribute('data-target-id', targetId);
          fbtn.innerHTML = '+ Save Diagram';
          fbtn.title = 'Save diagram to Study Notes';

          fbtn.addEventListener('click', function (e) {
            e.stopPropagation();
            var isAlreadySaved = fbtn.classList.contains('is-saved');
            if (isAlreadySaved) {
              NotesStore.removeByTargetId(targetId);
            } else {
              var diagVisual = extractDiagramVisual(diag);
              var dTitle = diagVisual ? diagVisual.title : title;
              var excerpt = '';
              if (diagVisual && diagVisual.dataUrl) {
                var assetId = 'diag_' + (diag.id ? diag.id.replace(/[^a-zA-Z0-9_-]/g, '_') : ('d' + Date.now()));
                saveStoredAsset(assetId, diagVisual.dataUrl, { title: dTitle, type: 'diagram' });
                excerpt = '\n### Diagram: ' + dTitle + '\n![' + dTitle + '](attachment://' + assetId + ')\n';
              } else {
                excerpt = '\n> [!note] Diagram: ' + dTitle + '\n> ' + dTitle + '\n';
              }

              var item = {
                id: 'diag_' + Date.now(),
                targetId: targetId,
                chapterTitle: getCleanChapterTitle(),
                url: window.location.href.split('#')[0] + '#' + targetId,
                type: 'diagram',
                text: excerpt.trim(),
                userNote: '',
                color: 'emerald',
                createdAt: new Date().toISOString()
              };
              NotesStore.add(item);
              appendExcerptToActiveLessonDoc(excerpt.trim(), 'diagram', dTitle, '');
            }
            updatePageBookmarkStates();
          });
          topBar.appendChild(fbtn);
          diag.insertBefore(topBar, diag.firstChild);
        }
      }
    });

    // Global listener to close active popover
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.code-bookmark-popover') && !e.target.closest('.code-bookmark-btn')) {
        closeActiveCodeBookmarkPopover();
      }
    });

    updatePageBookmarkStates();
  }

  function init() {
    try { initCodeAndDiagramBookmarks(); } catch (e) { console.warn('[BFP] initCodeAndDiagramBookmarks failed:', e); }
    if (isChapter) {
      try { initProgressBar(); } catch (e) { console.warn('[BFP] initProgressBar failed:', e); }
      try { initKeyboardNav(); } catch (e) { console.warn('[BFP] initKeyboardNav failed:', e); }
      try { initCodeRunner(); } catch (e) { console.warn('[BFP] initCodeRunner failed:', e); }
    }
    if (isHomepage) {
      try { initSearch(); } catch (e) { console.warn('[BFP] initSearch failed:', e); }
      try { initProgress(); } catch (e) { console.warn('[BFP] initProgress failed:', e); }
    }
    try { initFloatingDock(); } catch (e) { console.warn('[BFP] initFloatingDock failed:', e); }
    try { initHighlighter(); } catch (e) { console.warn('[BFP] initHighlighter failed:', e); }
    try { initNotesSidebar(); } catch (e) { console.warn('[BFP] initNotesSidebar failed:', e); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
