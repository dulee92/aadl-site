/* AADL site — shared behaviour (no dependencies) */
(function () {
  'use strict';

  // Navigation: solid background after scrolling, mobile toggle, current page marker
  var nav = document.querySelector('.nav');
  var toggle = document.querySelector('.nav__toggle');
  var links = document.querySelector('.nav__links');

  function updateNav() {
    if (!nav || nav.classList.contains('nav--always-solid')) return;
    nav.classList.toggle('nav--solid', window.scrollY > 40);
  }
  updateNav();
  window.addEventListener('scroll', updateNav, { passive: true });

  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('is-open');
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.nav__links a').forEach(function (a) {
    var target = (a.getAttribute('href') || '').split('#')[0].toLowerCase();
    if (target && target === here) a.setAttribute('aria-current', 'page');
  });

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reveal on scroll: tag common blocks automatically (only when the observer exists, so no-JS pages stay visible)
  if ('IntersectionObserver' in window && !reduceMotion) {
    var autoSel = '.topic, .card, .person, .award, .pillar, .pub-group, .timeline__item, .stat, .paper, .section__head, .figure-grid > .figure, .split > *';
    document.querySelectorAll(autoSel).forEach(function (el) {
      if (el.closest('.hero') || el.closest('.nav') || el.closest('.popup')) return;
      if (!el.classList.contains('reveal')) el.classList.add('reveal');
    });
    document.querySelectorAll('.grid, .figure-grid, .timeline, .stats').forEach(function (group) {
      Array.prototype.forEach.call(group.children, function (child, i) { if (child.classList.contains('reveal')) child.style.setProperty('--i', Math.min(i, 6)); });
    });
  }
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  // Scrollspy for the home side navigation
  var spyLinks = document.querySelectorAll('.sidenav a[href^="#"]');
  if (spyLinks.length) {
    var sections = [];
    spyLinks.forEach(function (a) {
      var sec = document.querySelector(a.getAttribute('href'));
      if (sec) sections.push({ link: a, sec: sec });
    });
    function spy() {
      var y = window.scrollY + 140;
      var current = sections[0];
      sections.forEach(function (s) { if (s.sec.offsetTop <= y) current = s; });
      sections.forEach(function (s) { s.link.classList.toggle('is-active', s === current); });
    }
    spy();
    window.addEventListener('scroll', spy, { passive: true });
  }

  // Announcement popup (home only): shown unless dismissed with "더이상 안보기"
  var popup = document.getElementById('popup');
  if (popup) {
    var KEY = 'aadl-popup-dismissed-v1';
    var dismissed = false;
    try { dismissed = localStorage.getItem(KEY) === '1'; } catch (e) {}
    if (!dismissed) {
      setTimeout(function () { popup.classList.add('is-open'); }, 700);
    }
    function closePopup() { popup.classList.remove('is-open'); }
    popup.querySelectorAll('[data-popup-close]').forEach(function (b) { b.addEventListener('click', closePopup); });
    var never = popup.querySelector('[data-popup-never]');
    if (never) never.addEventListener('click', function () {
      try { localStorage.setItem(KEY, '1'); } catch (e) {}
      closePopup();
    });
    popup.addEventListener('click', function (e) { if (e.target === popup) closePopup(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePopup(); });
  }

  // Count-up for numeric stats
  var nums = document.querySelectorAll('.stat__num');
  if (nums.length && 'IntersectionObserver' in window && !reduceMotion) {
    var nio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, target = parseInt(el.textContent, 10);
        if (isNaN(target)) { nio.unobserve(el); return; }
        var start = null;
        function step(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / 1100, 1), eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased);
          if (p < 1) requestAnimationFrame(step); else el.textContent = target;
        }
        requestAnimationFrame(step); nio.unobserve(el);
      });
    }, { threshold: 0.6 });
    nums.forEach(function (n) { nio.observe(n); });
  }

  // Scroll progress bar and back-to-top button
  var bar = document.createElement('div'); bar.className = 'progress'; bar.setAttribute('aria-hidden', 'true'); document.body.appendChild(bar);
  var top = document.createElement('button'); top.className = 'to-top'; top.type = 'button'; top.setAttribute('aria-label', 'Back to top');
  top.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  document.body.appendChild(top);
  top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); });
  function onScrollFx() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h > 0 ? Math.min(100, window.scrollY / h * 100) : 0) + '%';
    top.classList.toggle('is-visible', window.scrollY > 600);
  }
  onScrollFx(); window.addEventListener('scroll', onScrollFx, { passive: true });

  // Lightbox for figures
  var figImgs = document.querySelectorAll('.figure img');
  if (figImgs.length) {
    var lb = document.createElement('div'); lb.className = 'lightbox'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Enlarged figure');
    lb.innerHTML = '<button class="lightbox__close" type="button" aria-label="Close">✕</button><img alt=""><figcaption></figcaption>';
    document.body.appendChild(lb);
    var lbImg = lb.querySelector('img'), lbCap = lb.querySelector('figcaption');
    function closeLb() { lb.classList.remove('is-open'); lbImg.src = ''; }
    figImgs.forEach(function (img) {
      img.setAttribute('data-lightbox', '');
      img.addEventListener('click', function () {
        lbImg.src = img.currentSrc || img.src; lbImg.alt = img.alt || '';
        var cap = img.closest('figure') && img.closest('figure').querySelector('figcaption');
        lbCap.textContent = cap ? cap.textContent : '';
        lb.classList.add('is-open');
      });
    });
    lb.addEventListener('click', function (e) { if (e.target !== lbImg) closeLb(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLb(); });
  }

  // Hero: rotating application words and a light parallax on the fleet drawing
  var rot = document.querySelector('.hero__rotate .rotate');
  if (rot && !reduceMotion) {
    var words = (rot.getAttribute('data-words') || '').split('|').filter(Boolean), wi = 0;
    if (words.length > 1) setInterval(function () {
      rot.classList.add('is-out');
      setTimeout(function () { wi = (wi + 1) % words.length; rot.textContent = words[wi]; rot.classList.remove('is-out'); }, 380);
    }, 2600);
  }
  var art = document.querySelector('.hero__art');
  if (art && !reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    document.querySelector('.hero').addEventListener('pointermove', function (e) {
      var r = e.currentTarget.getBoundingClientRect();
      var dx = (e.clientX - r.left) / r.width - 0.5, dy = (e.clientY - r.top) / r.height - 0.5;
      art.style.translate = (dx * -18) + 'px ' + (dy * -12) + 'px';
    });
  }

  // Lazy-play muted videos only when visible
  var vids = document.querySelectorAll('video[data-autoplay]');
  if ('IntersectionObserver' in window && vids.length) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { v.play().catch(function () {}); } else { v.pause(); }
      });
    }, { threshold: 0.25 });
    vids.forEach(function (v) { vio.observe(v); });
  }
})();
