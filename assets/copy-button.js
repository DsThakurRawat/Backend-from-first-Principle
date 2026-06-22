(function () {
  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }
  ready(function () {
    document.querySelectorAll("pre").forEach(function (pre) {
      if (pre.closest("svg,nav,aside,script,style,footer")) return;
      if (pre.querySelector("svg")) return;
      if ((pre.textContent || "").trim().length < 1) return;
      var parent = pre.parentElement;
      if (parent && parent.classList.contains("copy-code-wrapper")) return;
      var wrap = document.createElement("div");
      wrap.className = "copy-code-wrapper";
      pre.parentNode.insertBefore(wrap, pre);
      wrap.appendChild(pre);
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "copy-code-button";
      btn.setAttribute("aria-label", "Copy code");
      btn.innerHTML =
        '<svg class="cb-go" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>' +
        '<svg class="cb-ok" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        e.preventDefault();
        var text = pre.innerText || pre.textContent || "";
        function done() {
          btn.classList.add("copied");
          setTimeout(function () { btn.classList.remove("copied"); }, 1500);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () { fallback(text); done(); });
        } else {
          fallback(text);
          done();
        }
      });
      wrap.appendChild(btn);
    });
    function fallback(text) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta);
    }
  });
})();
