/* ==========================================================================
   ITS — main.js  (段階的に追記していく)
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------
     1. Nav: スクロールで背景を付ける
     ------------------------------------------------------------------ */
  function initNavScroll() {
    const nav = document.getElementById('nav');
    if (!nav) return;

    function update() {
      nav.classList.toggle('is-scrolled', window.scrollY > 40);
    }

    window.addEventListener('scroll', update, { passive: true });
    update(); // 初期実行
  }

  /* ------------------------------------------------------------------
     2. Nav: ハンバーガーメニュー開閉
     ------------------------------------------------------------------ */
  function initHamburger() {
    const btn    = document.getElementById('hamburger');
    const drawer = document.getElementById('nav-drawer');
    if (!btn || !drawer) return;

    btn.addEventListener('click', function () {
      const isOpen = drawer.classList.toggle('is-open');
      btn.classList.toggle('is-open', isOpen);
      btn.setAttribute('aria-expanded', isOpen);
      drawer.setAttribute('aria-hidden', !isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // ドロワー内リンクをタップしたら閉じる
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

  /* ------------------------------------------------------------------
     3. スクロールフェードイン
     ------------------------------------------------------------------ */
  function initScrollFade() {
    const els = document.querySelectorAll('.js-fade');
    if (!els.length) return;

    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' });

    els.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------------
     Init
     ------------------------------------------------------------------ */
  document.addEventListener('DOMContentLoaded', function () {
    initNavScroll();
    initHamburger();
    initScrollFade();
  });

}());
