/* ============================================================
   Familink — main.js
   ============================================================ */
(function () {
  'use strict';

  /* ── 1. Nav scroll glass effect ─────────────────────────── */
  function initNavScroll() {
    var nav = document.getElementById('nav');
    if (!nav) return;
    function update() { nav.classList.toggle('is-scrolled', window.scrollY > 48); }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ── 2. Hamburger / Drawer ───────────────────────────────── */
  function initHamburger() {
    var btn    = document.getElementById('hamburger');
    var drawer = document.getElementById('drawer');
    if (!btn || !drawer) return;

    btn.addEventListener('click', function () {
      var open = drawer.classList.toggle('is-open');
      btn.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open);
      drawer.setAttribute('aria-hidden', !open);
      document.body.style.overflow = open ? 'hidden' : '';
    });

    drawer.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        drawer.classList.remove('is-open');
        btn.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
        drawer.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      });
    });
  }

  /* ── 3. Scroll fade-in (IntersectionObserver) ────────────── */
  function initScrollFade() {
    var els = document.querySelectorAll('.js-fade');
    if (!els.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ── 4. Contact form (client-side validation) ────────────── */
  function initForm() {
    var form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name  = form.querySelector('#cf-name');
      var email = form.querySelector('#cf-email');
      var msg   = form.querySelector('#cf-msg');
      var check = form.querySelector('input[type="checkbox"]');
      var valid = true;

      [name, email, msg].forEach(function (el) {
        el.style.borderColor = '';
        if (!el.value.trim()) { el.style.borderColor = '#FF3B30'; valid = false; }
      });
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        email.style.borderColor = '#FF3B30'; valid = false;
      }
      if (!check.checked) { valid = false; }

      if (!valid) { return; }

      /* 要設定: 実際の送信処理（Formspree等）をここに追加 */
      var btn = form.querySelector('button[type="submit"]');
      btn.textContent = '送信しました！ありがとうございます';
      btn.disabled = true;
      btn.style.background = '#34C759';
      btn.style.boxShadow  = '0 8px 24px rgba(52,199,89,.3)';
    });
  }

  /* ── 5. Smooth scroll for anchor links ───────────────────── */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href').slice(1);
        if (!id) return;
        var target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        var offset = document.getElementById('nav') ? 72 : 0;
        window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
      });
    });
  }

  /* ── Init ────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    initNavScroll();
    initHamburger();
    initScrollFade();
    initForm();
    initSmoothScroll();
  });
}());
