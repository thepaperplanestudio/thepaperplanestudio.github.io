(function () {
  "use strict";

  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Theme toggle ---------- */
  var themeBtn = document.querySelector(".theme");

  function currentTheme() {
    return root.dataset.theme ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }
  function updateThemeLabel() {
    themeBtn.textContent = currentTheme() === "dark" ? "Light" : "Dark";
  }
  try {
    var saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") root.dataset.theme = saved;
  } catch (e) {}
  updateThemeLabel();
  themeBtn.addEventListener("click", function () {
    var next = currentTheme() === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (e) {}
    updateThemeLabel();
  });

  /* ---------- Split manifesto into words ---------- */
  var counter = { i: 0 };
  function splitWords(node) {
    Array.prototype.slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (t) {
          if (!t) return;
          if (/^\s+$/.test(t)) {
            frag.appendChild(document.createTextNode(" "));
          } else {
            var w = document.createElement("span");
            w.className = "w";
            w.style.setProperty("--i", counter.i++);
            w.textContent = t;
            frag.appendChild(w);
          }
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) {
        splitWords(n);
      }
    });
  }
  var manifesto = document.querySelector(".manifesto");
  Array.prototype.forEach.call(manifesto.querySelectorAll(".line"), splitWords);

  /* ---------- Reveal on scroll ---------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  reveals.push(manifesto);

  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.2, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Shelf filter ---------- */
  var tabs = document.querySelectorAll(".tabs button");
  var items = document.querySelectorAll(".shelf-list li");
  Array.prototype.forEach.call(tabs, function (btn) {
    btn.addEventListener("click", function () {
      var f = btn.dataset.f;
      Array.prototype.forEach.call(tabs, function (b) {
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
      Array.prototype.forEach.call(items, function (li) {
        var show = f === "All" || li.dataset.type === f;
        li.hidden = !show;
        if (show) li.classList.add("in");
      });
    });
  });

  /* ---------- Scroll: progress bar, header, flying plane ---------- */
  var header = document.querySelector(".top");
  var plane = document.querySelector(".plane");
  var lastY = window.scrollY;
  var target = 0, shown = 0, ticking = false;

  function progress() {
    var max = root.scrollHeight - window.innerHeight;
    return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  }

  function drawPlane(p) {
    var vw = window.innerWidth, vh = window.innerHeight;
    var size = plane.getBoundingClientRect().width || 80;
    var a = p * 9.4 + 0.9;                       // wave phase along the page
    var x = (50 + 38 * Math.sin(a)) * vw / 100 - size / 2;
    var y = (14 + 72 * p) * vh / 100;
    var dx = 38 * 9.4 * Math.cos(a) * vw / 100;  // direction of travel
    var dy = 72 * vh / 100;
    var angle = Math.atan2(dy, dx) * 180 / Math.PI + 25;
    plane.style.transform = "translate(" + x + "px," + y + "px) rotate(" + angle + "deg)";
  }

  function loop() {
    shown += (target - shown) * 0.12;
    if (Math.abs(target - shown) < 0.0004) shown = target;
    drawPlane(shown);
    ticking = shown !== target;
    if (ticking) requestAnimationFrame(loop);
  }

  function onScroll() {
    var y = window.scrollY;
    target = progress();
    root.style.setProperty("--p", target);

    if (y > lastY + 6 && y > 140) header.classList.add("hide");
    else if (y < lastY - 6 || y < 140) header.classList.remove("hide");
    lastY = y;

    if (reduce) { drawPlane(0); return; }
    if (!ticking) { ticking = true; requestAnimationFrame(loop); }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  shown = target = progress();
  drawPlane(shown);
  root.style.setProperty("--p", target);
})();
