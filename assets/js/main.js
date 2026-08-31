/* ============================================================
   sysctl — site behaviour
   No dependencies. Every enhancement degrades gracefully.
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Theme ---------- */
  var themeBtn = $('#theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('sysctl-theme', next); } catch (e) {}
    });
  }

  /* ---------- Mobile nav ---------- */
  var burger = $('#nav-burger');
  var links  = $('#nav-links');
  if (burger && links) {
    burger.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    links.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        links.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- Sticky nav shadow ---------- */
  var nav = $('#nav');
  var onScroll = function () {
    if (nav) nav.classList.toggle('is-stuck', window.scrollY > 8);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Reveal on scroll ---------- */
  var revealables = $$('[data-reveal]');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = Math.min(i * 60, 240);
        setTimeout(function () { el.classList.add('is-in'); }, delay);
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Scrollspy ---------- */
  var navAnchors = $$('.nav__links a[href^="#"]');
  var sections = navAnchors
    .map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navAnchors.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Card spotlight ---------- */
  if (window.matchMedia('(pointer: fine)').matches && !reduceMotion) {
    $$('.card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------- Board filters ---------- */
  var chips = $$('.chip[data-filter]');
  var boards = $$('#boards-grid .board');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var f = chip.dataset.filter;
      chips.forEach(function (c) { c.classList.toggle('is-active', c === chip); });
      boards.forEach(function (b) {
        var vendors = (b.dataset.vendor || '').split(/\s+/);
        b.classList.toggle('is-hidden', f !== 'all' && vendors.indexOf(f) === -1);
      });
    });
  });

  /* ---------- Copy button ---------- */
  var copyBtn = $('#copy-btn');
  if (copyBtn && navigator.clipboard) {
    copyBtn.addEventListener('click', function () {
      navigator.clipboard.writeText(copyBtn.dataset.copy || '').then(function () {
        var label = $('#copy-label');
        copyBtn.classList.add('is-done');
        if (label) label.textContent = 'Copied';
        setTimeout(function () {
          copyBtn.classList.remove('is-done');
          if (label) label.textContent = 'Copy';
        }, 1800);
      }).catch(function () {});
    });
  }

  /* ---------- Footer year ---------- */
  var year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- Terminal boot log ---------- */
  var termBody = $('#term-body');
  var BOOT = [
    ['c-dim', '$ '], ['c-hi', 'tio /dev/cuaU0 -b 115200\n'],
    ['', 'U-Boot SPL 2024.07 (Banana Pi BPI-R2 Pro)\n'],
    ['', 'Trying to boot from MMC1\n'],
    ['c-inf', 'Loading FreeBSD/arm64 kernel ...\n'],
    ['', '\n'],
    ['c-hi', 'Copyright (c) 1992-2026 The FreeBSD Project.\n'],
    ['', 'FreeBSD 15.0-CURRENT #4 arena/bananapi-r2-pro\n'],
    ['', 'real memory  = 2147483648 (2048 MB)\n'],
    ['', 'simplebus0: <Flattened Device Tree> on ofwbus0\n'],
    ['', 'rk_gpio0: <RockChip GPIO Controller> mem 0xfdd60000\n'],
    ['', 'dwmmc0: <Rockchip RK3568 Sdmmc> irq 42 on simplebus0\n'],
    ['', 'ehci0: <Generic EHCI Controller> mem 0xfd800000\n'],
    ['c-ok',  'awg0: link state changed to UP\n'],
    ['', 'Trying to mount root from ufs:/dev/mmcsd0s2a [rw]...\n'],
    ['', '\n'],
    ['c-dim', 'root@r2pro:~ # '], ['c-hi', 'sysctl hw.model\n'],
    ['c-acc', 'hw.model: Rockchip RK3568\n'],
    ['c-dim', 'root@r2pro:~ # '], ['c-hi', 'uname -m\n'],
    ['c-acc', 'arm64\n'],
    ['c-dim', 'root@r2pro:~ # ']
  ];

  function renderBoot(upTo) {
    var html = '';
    for (var i = 0; i < BOOT.length; i++) {
      var cls = BOOT[i][0];
      var txt = BOOT[i][1];
      if (i < upTo.seg) {
        html += wrap(cls, txt);
      } else if (i === upTo.seg) {
        html += wrap(cls, txt.slice(0, upTo.ch));
        break;
      }
    }
    return html;
  }

  function wrap(cls, txt) {
    var safe = txt.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return cls ? '<span class="' + cls + '">' + safe + '</span>' : safe;
  }

  function fullBoot() {
    return BOOT.map(function (s) { return wrap(s[0], s[1]); }).join('');
  }

  if (termBody) {
    if (reduceMotion) {
      termBody.innerHTML = fullBoot() + '<span class="term__cursor"></span>';
    } else {
      var pos = { seg: 0, ch: 0 };
      var started = false;

      var typeStep = function () {
        if (pos.seg >= BOOT.length) {
          termBody.innerHTML = fullBoot() + '<span class="term__cursor"></span>';
          return;
        }
        var text = BOOT[pos.seg][1];
        // Emit whole lines quickly, characters slowly for prompts.
        var isPrompt = /\$ |# /.test(text) || pos.seg < 2;
        var step = isPrompt ? 1 : Math.max(2, Math.ceil(text.length / 6));
        pos.ch += step;
        if (pos.ch >= text.length) { pos.seg++; pos.ch = 0; }

        termBody.innerHTML = renderBoot(pos) + '<span class="term__cursor"></span>';
        termBody.scrollTop = termBody.scrollHeight;
        setTimeout(typeStep, isPrompt ? 34 : 62);
      };

      var startTyping = function () {
        if (started) return;
        started = true;
        setTimeout(typeStep, 380);
      };

      if ('IntersectionObserver' in window) {
        var tio = new IntersectionObserver(function (entries) {
          if (entries[0].isIntersecting) { startTyping(); tio.disconnect(); }
        }, { threshold: 0.25 });
        tio.observe(termBody);
      } else {
        startTyping();
      }
    }
  }

  /* ---------- Live GitHub data ---------- */
  var CACHE_KEY = 'sysctl-gh-v1';
  var CACHE_TTL = 60 * 60 * 1000; // 1 hour

  function readCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (Date.now() - obj.t > CACHE_TTL) return null;
      return obj.d;
    } catch (e) { return null; }
  }

  function writeCache(d) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), d: d })); } catch (e) {}
  }

  function fmtNum(n) {
    return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n);
  }

  function ago(iso) {
    var d = (Date.now() - new Date(iso).getTime()) / 86400000;
    if (isNaN(d)) return '';
    if (d < 1)   return 'today';
    if (d < 2)   return 'yesterday';
    if (d < 31)  return Math.floor(d) + 'd ago';
    if (d < 365) return Math.floor(d / 30) + 'mo ago';
    return Math.floor(d / 365) + 'y ago';
  }

  function paint(data) {
    var totalStars = 0;

    $$('[data-repo]').forEach(function (el) {
      var info = data.repos[el.dataset.repo];
      var slot = $('[data-gh-stats]', el);
      if (!info || !slot) return;
      totalStars += info.stars || 0;
      var bits = [];
      bits.push('<b>★ ' + fmtNum(info.stars || 0) + '</b>');
      if (info.language) bits.push(info.language);
      if (info.pushed) bits.push(ago(info.pushed));
      slot.innerHTML = bits.join('<span aria-hidden="true">·</span>');
    });

    $$('[data-branch]').forEach(function (el) {
      var when = data.branches[el.dataset.branch];
      var slot = $('[data-branch-when]', el);
      if (when && slot) slot.textContent = ago(when);
    });

    var starEl = $('#stat-stars');
    if (starEl && totalStars > 0) starEl.textContent = fmtNum(totalStars);
  }

  function fetchJSON(url) {
    return fetch(url, { headers: { Accept: 'application/vnd.github+json' } })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); });
  }

  function loadGitHub() {
    var cached = readCache();
    if (cached) { paint(cached); return; }

    var repoNames = $$('[data-repo]').map(function (el) { return el.dataset.repo; });
    var branchRefs = $$('[data-branch]').map(function (el) { return el.dataset.branch; });
    var data = { repos: {}, branches: {} };

    var repoJobs = repoNames.map(function (name) {
      return fetchJSON('https://api.github.com/repos/' + name)
        .then(function (j) {
          data.repos[name] = {
            stars: j.stargazers_count,
            language: j.language,
            pushed: j.pushed_at
          };
        })
        .catch(function () {});
    });

    var branchJobs = branchRefs.map(function (ref) {
      var parts = ref.split(':');
      var repo = parts[0];
      var branch = parts.slice(1).join(':');
      return fetchJSON('https://api.github.com/repos/' + repo + '/branches/' + encodeURIComponent(branch))
        .then(function (j) {
          var d = j && j.commit && j.commit.commit && j.commit.commit.committer;
          if (d && d.date) data.branches[ref] = d.date;
        })
        .catch(function () {});
    });

    Promise.all(repoJobs.concat(branchJobs)).then(function () {
      if (Object.keys(data.repos).length) writeCache(data);
      paint(data);
    });
  }

  if (window.fetch && window.Promise) {
    if ('requestIdleCallback' in window) requestIdleCallback(loadGitHub, { timeout: 2500 });
    else setTimeout(loadGitHub, 600);
  }
})();
