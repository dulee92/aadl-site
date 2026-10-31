/* AADL site — shared behaviour (no dependencies) */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  // Navigation: solid background after scrolling, mobile toggle, current page marker
  var nav = document.querySelector('.nav');
  var toggle = document.querySelector('.nav__toggle');
  var links = document.querySelector('.nav__links');

  var sentinel = document.querySelector('.sentinel');
  if (nav && !nav.classList.contains('nav--always-solid')) {
    var heroEl = document.querySelector('.hero') || sentinel;
    if (heroEl && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        nav.classList.toggle('nav--solid', !entries[0].isIntersecting);
      }, { rootMargin: '-' + (nav.offsetHeight || 72) + 'px 0px 0px 0px', threshold: 0 }).observe(heroEl);
    } else {
      var updateNav = function () { nav.classList.toggle('nav--solid', window.scrollY > 40); };
      updateNav(); window.addEventListener('scroll', updateNav, { passive: true });
    }
  }

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
  var desktop = window.matchMedia && window.matchMedia('(min-width: 901px) and (hover: hover) and (pointer: fine)').matches;

  // Reveal on scroll: tag common blocks automatically (only when the observer exists, so no-JS pages stay visible)
  if ('IntersectionObserver' in window && !reduceMotion) {
    var autoSel = '.topic, .card, .person, .award, .pillar, .pub-group, .timeline__item, .stat, .paper, .section__head, .figure-grid > .figure, .split > *, .vision__list, .vision > .figure, .contact, .news__feature, .news__list, .pi, .group-head, .pillar-block__label';
    document.querySelectorAll(autoSel).forEach(function (el) {
      if (el.closest('.hero') || el.closest('.nav') || el.closest('.popup')) return;
      if (!el.classList.contains('reveal')) el.classList.add('reveal');
    });
    document.querySelectorAll('.grid, .figure-grid, .timeline, .stats').forEach(function (group) {
      Array.prototype.forEach.call(group.children, function (child, i) { if (child.classList.contains('reveal')) child.style.setProperty('--i', Math.min(i, 6)); });
    });
    if (desktop) {
      document.querySelectorAll('.split').forEach(function (sp) {
        var kids = Array.prototype.filter.call(sp.children, function (k) { return k.classList.contains('reveal'); });
        if (kids.length === 2) {
          var rev = sp.classList.contains('split--reverse');
          kids[0].classList.add(rev ? 'reveal--right' : 'reveal--left');
          kids[1].classList.add(rev ? 'reveal--left' : 'reveal--right');
        }
      });
      document.querySelectorAll('.figure-grid > .figure.reveal, .vision > .figure.reveal').forEach(function (fg) { fg.classList.add('reveal--scale'); });
    }
  }
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
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
    var popupOpener = null;
    if (!dismissed) {
      setTimeout(function () {
        popupOpener = document.activeElement;
        popup.classList.add('is-open');
        var first = popup.querySelector('.popup__close'); if (first) first.focus();
      }, 700);
    }
    function closePopup() {
      if (!popup.classList.contains('is-open')) return;
      popup.classList.remove('is-open');
      if (popupOpener && popupOpener.focus && popupOpener !== document.body) popupOpener.focus();
    }
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
  var heroContent = document.querySelector('.hero__content');
  function onScrollFx() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h > 0 ? Math.min(100, window.scrollY / h * 100) : 0) + '%';
    top.classList.toggle('is-visible', window.scrollY > 600);
    if (heroContent && desktop && !reduceMotion) {
      var y = Math.min(window.scrollY, 900);
      heroContent.style.translate = '0 ' + (y * 0.12) + 'px';
      heroContent.style.opacity = String(Math.max(0, 1 - y / 800));
      var side = document.querySelector('.hero__side'); if (side) side.style.translate = '0 ' + (y * 0.06) + 'px';
    }
  }
  onScrollFx(); window.addEventListener('scroll', onScrollFx, { passive: true });

  // Lightbox for figures
  var figImgs = document.querySelectorAll('.figure img');
  if (figImgs.length) {
    var lb = document.createElement('div'); lb.className = 'lightbox'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Enlarged figure');
    lb.innerHTML = '<button class="lightbox__close" type="button" aria-label="Close">✕</button><img alt=""><figcaption></figcaption>';
    document.body.appendChild(lb);
    var lbImg = lb.querySelector('img'), lbCap = lb.querySelector('figcaption'), lbClose = lb.querySelector('.lightbox__close'), lbOpener = null;
    function closeLb() {
      if (!lb.classList.contains('is-open')) return;
      lb.classList.remove('is-open'); lbImg.src = '';
      if (lbOpener && lbOpener.focus) lbOpener.focus();
    }
    figImgs.forEach(function (img) {
      img.setAttribute('data-lightbox', ''); img.tabIndex = 0; img.setAttribute('role', 'button');
      img.setAttribute('aria-label', (img.alt || 'Figure') + ' (press Enter to enlarge)');
      function openLb() {
        lbOpener = img;
        lbImg.src = img.currentSrc || img.src; lbImg.alt = img.alt || '';
        var cap = img.closest('figure') && img.closest('figure').querySelector('figcaption');
        lbCap.textContent = cap ? cap.textContent : '';
        lb.classList.add('is-open'); lbClose.focus();
      }
      img.addEventListener('click', openLb);
      img.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(); } });
    });
    lb.addEventListener('click', function (e) { if (e.target !== lbImg) closeLb(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLb(); });
  }

  // Publication filters (publications.html)
  var filters = document.getElementById('filters');
  if (filters) {
    var pubs = Array.prototype.slice.call(document.querySelectorAll('.pub'));
    var groups = Array.prototype.slice.call(document.querySelectorAll('.pub-group'));
    var chips = Array.prototype.slice.call(filters.querySelectorAll('.chip[data-filter]'));
    var clearBtn = document.getElementById('filter-clear'), countEl = document.getElementById('filter-count');
    var active = { type: [], year: [], tag: [] };
    function apply() {
      var shown = 0;
      pubs.forEach(function (li) {
        var ok = true;
        if (active.type.length) ok = ok && active.type.indexOf(li.getAttribute('data-type')) > -1;
        if (active.year.length) ok = ok && active.year.indexOf(li.getAttribute('data-year')) > -1;
        if (active.tag.length) { var tags = (li.getAttribute('data-tags') || '').split(' '); ok = ok && active.tag.some(function (t) { return tags.indexOf(t) > -1; }); }
        li.hidden = !ok; if (ok) shown++;
      });
      groups.forEach(function (g) {
        var visible = g.querySelectorAll('.pub:not([hidden])').length;
        var c = g.querySelector('.count'); if (c) c.textContent = visible;
        g.hidden = visible === 0;
      });
      var any = active.type.length + active.year.length + active.tag.length > 0;
      if (countEl) countEl.textContent = any ? shown + ' of ' + pubs.length + ' publications match' : pubs.length + ' publications';
      if (clearBtn) clearBtn.hidden = !any;
      chips.forEach(function (c) { var kv = c.getAttribute('data-filter').split(':'); c.setAttribute('aria-pressed', active[kv[0]].indexOf(kv[1]) > -1 ? 'true' : 'false'); });
      var h = [].concat(active.type.map(function (v) { return 'type:' + v; }), active.year.map(function (v) { return 'year:' + v; }), active.tag.map(function (v) { return 'tag:' + v; })).join(',');
      if (history.replaceState) history.replaceState(null, '', h ? '#f=' + h : location.pathname + location.search);
    }
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        var kv = c.getAttribute('data-filter').split(':'), arr = active[kv[0]], i = arr.indexOf(kv[1]);
        if (i > -1) arr.splice(i, 1); else arr.push(kv[1]);
        apply();
      });
    });
    if (clearBtn) clearBtn.addEventListener('click', function () { active = { type: [], year: [], tag: [] }; apply(); });
    function fromHash() {
      active = { type: [], year: [], tag: [] };
      if (location.hash.indexOf('#f=') === 0) {
        location.hash.slice(3).split(',').forEach(function (kv) { var p = kv.split(':'); if (active[p[0]] && p[1] && active[p[0]].indexOf(p[1]) < 0) active[p[0]].push(p[1]); });
      }
      apply();
    }
    window.addEventListener('hashchange', fromHash);
    fromHash();
  }

  // Lazy-play muted videos only when visible
  var vids = document.querySelectorAll('video[data-autoplay]');
  if ('IntersectionObserver' in window && vids.length) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting && !reduceMotion) { v.play().catch(function () {}); } else { v.pause(); }
      });
    }, { threshold: 0.25 });
    vids.forEach(function (v) { vio.observe(v); });
  }
})();
