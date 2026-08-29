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
  function initKeyboardNav() {
    var nav = document.getElementById('chapterNav');
    if (!nav) return;
    var links = nav.querySelectorAll('a.nav-chapter-link');
    var prev = null, next = null;
    links.forEach(function (l) {
      if (l.classList.contains('nav-prev') || (!l.classList.contains('nav-next') && !l.classList.contains('nav-disabled'))) prev = l;
      if (l.classList.contains('nav-next')) next = l;
    });
    // Also check first link if it's not disabled
    if (!prev) {
      var first = nav.querySelector('a.nav-chapter-link:not(.nav-disabled):not(.nav-next)');
      if (first) prev = first;
    }

    var hint = document.createElement('div');
    hint.className = 'kbd-nav-hint';
    hint.innerHTML = '<span class="kbd">&larr;</span><span class="kbd">&rarr;</span> Navigate chapters';
    document.body.appendChild(hint);
    setTimeout(function () { hint.style.opacity = '0'; hint.style.transition = 'opacity .6s'; }, 8000);

    document.addEventListener('keydown', function (e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft' && prev) window.location.href = prev.href;
      if (e.key === 'ArrowRight' && next) window.location.href = next.href;
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

  // =============================
  //  HOMEPAGE ENHANCEMENTS
  // =============================

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

    // Open/close
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

    // Trigger buttons
    document.querySelectorAll('[data-search-trigger]').forEach(function (el) {
      el.addEventListener('click', openSearch);
    });

    // Close on overlay click
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeSearch();
    });

    // Keyboard: Cmd+K / Ctrl+K to open, Escape to close
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      }
      if (e.key === 'Escape') closeSearch();
      if (e.key === '/' && !overlay.classList.contains('open') && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        openSearch();
      }
    });

    // Search input
    input.addEventListener('input', function () {
      renderResults(input.value.trim().toLowerCase());
      activeIdx = -1;
    });

    // Arrow key navigation in results
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
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

  // ===== Init =====
  function init() {
    if (isChapter) {
      initProgressBar();
      initKeyboardNav();
      initCodeRunner();
    }
    if (isHomepage) {
      initSearch();
      initProgress();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
