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
     4. Hero: Canvas パーティクル
     ------------------------------------------------------------------ */
  function initParticles() {
    var canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    var particles = [];

    function resize() {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    function makeParticle() {
      return {
        x:    Math.random() * canvas.width,
        y:    Math.random() * canvas.height,
        vx:   (Math.random() - 0.5) * 0.3,
        vy:   (Math.random() - 0.5) * 0.3,
        r:    Math.random() * 1.3 + 0.4,
        a:    Math.random() * 0.5 + 0.15,
        gold: Math.random() < 0.12
      };
    }

    function init() {
      resize();
      var count = Math.min(Math.floor(canvas.width * canvas.height / 14000), 100);
      particles = [];
      for (var i = 0; i < count; i++) particles.push(makeParticle());
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 接続線
      for (var i = 0; i < particles.length; i++) {
        for (var j = i + 1; j < particles.length; j++) {
          var dx = particles[i].x - particles[j].x;
          var dy = particles[i].y - particles[j].y;
          var d  = Math.sqrt(dx * dx + dy * dy);
          if (d < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = 'rgba(201,168,76,' + ((1 - d / 100) * 0.1) + ')';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // 点
      particles.forEach(function (p) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height)  p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.gold
          ? 'rgba(201,168,76,' + p.a + ')'
          : 'rgba(139,160,184,' + p.a + ')';
        ctx.fill();
      });

      requestAnimationFrame(draw);
    }

    init();
    draw();

    window.addEventListener('resize', init, { passive: true });
  }

  /* ------------------------------------------------------------------
     Init
     ------------------------------------------------------------------ */
  document.addEventListener('DOMContentLoaded', function () {
    initNavScroll();
    initHamburger();
    initScrollFade();
    initParticles();
  });

}());
