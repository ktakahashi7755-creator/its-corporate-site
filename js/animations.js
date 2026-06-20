/* ==========================================================================
   ITS合同会社 — animations.js
   World-class animation system inspired by top Japanese corporate sites
   ========================================================================== */

(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ──────────────────────────────────────────────────────────────────────────
     1. スクロール進行バー (Scroll Progress Bar)
     ────────────────────────────────────────────────────────────────────────── */
  function initScrollProgress() {
    var bar = document.getElementById('scroll-progress');
    if (!bar) return;

    function update() {
      var scrolled = window.scrollY;
      var total = document.documentElement.scrollHeight - window.innerHeight;
      var pct = total > 0 ? scrolled / total : 0;
      bar.style.transform = 'scaleX(' + pct + ')';
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ──────────────────────────────────────────────────────────────────────────
     2. スタガーアニメーション (Staggered Group Animation)
     ────────────────────────────────────────────────────────────────────────── */
  function initStagger() {
    var groups = document.querySelectorAll('.js-stagger');
    if (!groups.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var items = entry.target.querySelectorAll('.js-stagger-item');
        items.forEach(function (item, i) {
          setTimeout(function () {
            item.classList.add('is-visible');
          }, i * 130);
        });
        io.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    groups.forEach(function (g) { io.observe(g); });
  }

  /* ──────────────────────────────────────────────────────────────────────────
     3. カウンターアニメーション (Animated Number Counter)
     ────────────────────────────────────────────────────────────────────────── */
  function initCounters() {
    var els = document.querySelectorAll('.js-counter');
    if (!els.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target  = parseFloat(el.dataset.target  || el.textContent.replace(/[^\d.]/g, '') || 0);
        var duration = parseInt(el.dataset.duration || 2000, 10);
        var decimals = parseInt(el.dataset.decimals || 0, 10);
        var suffix   = el.dataset.suffix  || '';
        var prefix   = el.dataset.prefix  || '';
        var start    = performance.now();

        if (prefersReduced) { el.textContent = prefix + target.toFixed(decimals) + suffix; return; }

        function tick(now) {
          var elapsed  = now - start;
          var progress = Math.min(elapsed / duration, 1);
          var eased    = 1 - Math.pow(1 - progress, 3);
          el.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
          if (progress < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });

    els.forEach(function (el) { io.observe(el); });
  }

  /* ──────────────────────────────────────────────────────────────────────────
     4. テキストリビール (Clip-path Text Reveal)
     ────────────────────────────────────────────────────────────────────────── */
  function initTextReveal() {
    var els = document.querySelectorAll('.js-text-reveal');
    if (!els.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var delay = 0;
        entry.target.querySelectorAll('.js-text-reveal__line').forEach(function (line) {
          setTimeout(function () { line.classList.add('is-revealed'); }, delay);
          delay += 100;
        });
        io.unobserve(entry.target);
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -60px 0px' });

    els.forEach(function (el) { io.observe(el); });
  }

  /* ──────────────────────────────────────────────────────────────────────────
     5. 視差スクロール (Parallax)
     ────────────────────────────────────────────────────────────────────────── */
  function initParallax() {
    var els = document.querySelectorAll('.js-parallax');
    if (!els.length || prefersReduced) return;

    function update() {
      var scrollY = window.scrollY;
      els.forEach(function (el) {
        var speed  = parseFloat(el.dataset.parallaxSpeed || 0.25);
        var parent = el.parentElement;
        var rect   = parent.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        var offset = rect.top * speed * -1;
        el.style.transform = 'translateY(' + offset + 'px)';
      });
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ──────────────────────────────────────────────────────────────────────────
     6. マグネティックボタン (Magnetic CTA Effect)
     ────────────────────────────────────────────────────────────────────────── */
  function initMagnetic() {
    var els = document.querySelectorAll('.js-magnetic');
    if (!els.length || prefersReduced) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    els.forEach(function (el) {
      var strength = parseFloat(el.dataset.magneticStrength || 0.28);

      el.addEventListener('mousemove', function (e) {
        var rect = el.getBoundingClientRect();
        var x = (e.clientX - rect.left - rect.width  / 2) * strength;
        var y = (e.clientY - rect.top  - rect.height / 2) * strength;
        el.style.transition = 'transform 0.15s ease';
        el.style.transform  = 'translate(' + x + 'px, ' + y + 'px)';
      });

      el.addEventListener('mouseleave', function () {
        el.style.transition = 'transform 0.55s cubic-bezier(0.16,1,0.3,1)';
        el.style.transform  = 'translate(0,0)';
      });
    });
  }

  /* ──────────────────────────────────────────────────────────────────────────
     7. カスタムカーソル (Custom Cursor)
     ────────────────────────────────────────────────────────────────────────── */
  function initCursor() {
    var cursor = document.getElementById('custom-cursor');
    if (!cursor) return;
    if (window.matchMedia('(pointer: coarse)').matches) { cursor.style.display = 'none'; return; }

    var cx = 0, cy = 0, px = 0, py = 0, running = false;

    window.addEventListener('mousemove', function (e) { cx = e.clientX; cy = e.clientY; });

    function tick() {
      px += (cx - px) * 0.14;
      py += (cy - py) * 0.14;
      cursor.style.transform = 'translate(' + (px - 6) + 'px,' + (py - 6) + 'px)';
      requestAnimationFrame(tick);
    }

    tick();

    document.querySelectorAll('a, button, .js-magnetic, .svc-card, .about-strip__card').forEach(function (el) {
      el.addEventListener('mouseenter', function () { cursor.classList.add('is-hover'); });
      el.addEventListener('mouseleave', function () { cursor.classList.remove('is-hover'); });
    });
  }

  /* ──────────────────────────────────────────────────────────────────────────
     8. セクションライン装飾 (Section Line Reveal)
     ────────────────────────────────────────────────────────────────────────── */
  function initLineReveal() {
    var els = document.querySelectorAll('.js-line-reveal');
    if (!els.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.3 });

    els.forEach(function (el) { io.observe(el); });
  }

  /* ──────────────────────────────────────────────────────────────────────────
     9. ナビスクロールハイライト (Active Nav on Scroll)
     ────────────────────────────────────────────────────────────────────────── */
  function initNavHighlight() {
    var links    = document.querySelectorAll('.nav__link[href^="#"]');
    var sections = [];
    if (!links.length) return;

    links.forEach(function (a) {
      var sec = document.querySelector(a.getAttribute('href'));
      if (sec) sections.push({ el: sec, link: a });
    });

    function update() {
      var scrollMid = window.scrollY + window.innerHeight * 0.35;
      var active = null;
      sections.forEach(function (s) {
        if (s.el.offsetTop <= scrollMid) active = s;
      });

      sections.forEach(function (s) { s.link.classList.remove('is-active'); });
      if (active) active.link.classList.add('is-active');
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ──────────────────────────────────────────────────────────────────────────
     10. ホバー 3Dカード効果 (3D Tilt on Hover)
     ────────────────────────────────────────────────────────────────────────── */
  function initCardTilt() {
    var cards = document.querySelectorAll('.js-tilt');
    if (!cards.length || prefersReduced) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    cards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect   = card.getBoundingClientRect();
        var x      = (e.clientX - rect.left) / rect.width  - 0.5;
        var y      = (e.clientY - rect.top)  / rect.height - 0.5;
        var maxDeg = 5;
        card.style.transform = 'perspective(800px) rotateX(' + (-y * maxDeg) + 'deg) rotateY(' + (x * maxDeg) + 'deg) translateY(-4px)';
      });
      card.addEventListener('mouseleave', function () {
        card.style.transition = 'transform 0.5s cubic-bezier(0.16,1,0.3,1)';
        card.style.transform  = '';
        setTimeout(function () { card.style.transition = ''; }, 500);
      });
    });
  }

  /* ──────────────────────────────────────────────────────────────────────────
     11. ページロードリビール (Page Load Curtain)
     ────────────────────────────────────────────────────────────────────────── */
  function initPageReveal() {
    var curtain = document.getElementById('page-reveal');
    if (!curtain || prefersReduced) { if (curtain) curtain.remove(); return; }
    setTimeout(function () { curtain.classList.add('is-done'); }, 50);
    setTimeout(function () { curtain.remove(); }, 900);
  }

  /* ──────────────────────────────────────────────────────────────────────────
     Init
     ────────────────────────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    initScrollProgress();
    initStagger();
    initCounters();
    initTextReveal();
    initParallax();
    initMagnetic();
    initCursor();
    initLineReveal();
    initNavHighlight();
    initCardTilt();
    initPageReveal();
  });

}());
