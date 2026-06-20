/* ==========================================================================
   ITS合同会社 — main.js
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------
     1. Nav: スクロールで白背景に切り替え
     ------------------------------------------------------------------ */
  function initNavScroll() {
    var nav = document.getElementById('nav');
    if (!nav) return;

    function update() {
      nav.classList.toggle('is-scrolled', window.scrollY > 60);
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ------------------------------------------------------------------
     2. ハンバーガーメニュー
     ------------------------------------------------------------------ */
  function initHamburger() {
    var btn    = document.getElementById('hamburger');
    var drawer = document.getElementById('nav-drawer');
    if (!btn || !drawer) return;

    btn.addEventListener('click', function () {
      var isOpen = drawer.classList.toggle('is-open');
      btn.classList.toggle('is-open', isOpen);
      btn.setAttribute('aria-expanded', isOpen);
      drawer.setAttribute('aria-hidden', !isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
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

  /* ------------------------------------------------------------------
     3. スクロールフェードイン
     ------------------------------------------------------------------ */
  function initScrollFade() {
    var els = document.querySelectorAll('.js-fade');
    if (!els.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.10, rootMargin: '0px 0px -40px 0px' });

    els.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------------
     4. Hero: Canvas パーティクル
     ------------------------------------------------------------------ */
  function initParticles() {
    var canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    var particles = [];
    var raf;

    function resize() {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    function makeParticle() {
      var roll = Math.random();
      return {
        x:    Math.random() * canvas.width,
        y:    Math.random() * canvas.height,
        vx:   (Math.random() - 0.5) * 0.28,
        vy:   (Math.random() - 0.5) * 0.28,
        r:    Math.random() * 1.4 + 0.4,
        a:    Math.random() * 0.45 + 0.15,
        type: roll < 0.12 ? 'gold' : (roll < 0.45 ? 'blue' : 'white')
      };
    }

    function particleColor(p) {
      if (p.type === 'gold')  return 'rgba(201,168,76,'  + p.a + ')';
      if (p.type === 'blue')  return 'rgba(10,132,255,'  + p.a + ')';
      return                         'rgba(180,210,255,' + p.a + ')';
    }

    function init() {
      resize();
      var count = Math.min(Math.floor(canvas.width * canvas.height / 12000), 110);
      particles = [];
      for (var i = 0; i < count; i++) particles.push(makeParticle());
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      /* 接続線 */
      for (var i = 0; i < particles.length; i++) {
        for (var j = i + 1; j < particles.length; j++) {
          var dx = particles[i].x - particles[j].x;
          var dy = particles[i].y - particles[j].y;
          var d  = Math.sqrt(dx * dx + dy * dy);
          if (d < 90) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = 'rgba(10,132,255,' + ((1 - d / 90) * 0.08) + ')';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      /* ドット */
      particles.forEach(function (p) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height)  p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = particleColor(p);
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    }

    init();
    draw();

    window.addEventListener('resize', function () {
      cancelAnimationFrame(raf);
      init();
      draw();
    }, { passive: true });
  }

  /* ------------------------------------------------------------------
     5. スムーズスクロール (anchor links)
     ------------------------------------------------------------------ */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var target = document.querySelector(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        var offset = 72;
        var top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: top, behavior: 'smooth' });
      });
    });
  }

  /* ------------------------------------------------------------------
     6. コンタクトフォーム バリデーション
     ------------------------------------------------------------------ */
  function initForm() {
    var form = document.querySelector('.contact-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name    = form.querySelector('[name="name"]');
      var email   = form.querySelector('[name="email"]');
      var message = form.querySelector('[name="message"]');
      var ok = true;

      [name, email, message].forEach(function (el) {
        if (!el) return;
        el.classList.remove('is-error');
        if (!el.value.trim()) { el.classList.add('is-error'); ok = false; }
      });

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        email.classList.add('is-error'); ok = false;
      }

      if (ok) {
        var btn = form.querySelector('[type="submit"]');
        if (btn) {
          btn.disabled = true;
          btn.textContent = '送信しました ✓';
          btn.style.background = '#34C759';
        }
      }
    });
  }

  /* ------------------------------------------------------------------
     Init
     ------------------------------------------------------------------ */
  document.addEventListener('DOMContentLoaded', function () {
    initNavScroll();
    initHamburger();
    initScrollFade();
    initParticles();
    initSmoothScroll();
    initForm();
  });

}());
