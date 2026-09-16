/* ============================================================================
   ЗАРЯ — интерфейс
   ----------------------------------------------------------------------------
   Надпись на первом экране, меню, активный пункт, появление секций.

   Общее правило по анимации: она объясняет физику товара (трубка разогревается,
   стартер моргает) и нигде не задерживает человека. При prefers-reduced-motion
   всё выключается — остаётся статичный, полностью читаемый сайт.
   ============================================================================ */

(function (global) {
  'use strict';

  var N = global.ZaryaNeon;
  var T = global.ZaryaI18n;

  function reduced() {
    return global.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* Своего переключателя дня и ночи у сайта нет: тему задаёт система, а CSS
     подхватывает её через prefers-color-scheme. Поэтому здесь нет ни кнопки,
     ни хранения выбора — если человек переключит тему в телефоне, страница
     перерисуется сама, даже без перезагрузки. */

  /* Надписи, набранные трубкой: первый экран, логотип в шапке, «404».
     Логотип и заголовок рисуются одним и тем же алфавитом — бренд написан
     тем же стеклом, что и товар. */
  function initSigns() {
    var nodes = document.querySelectorAll('[data-sign]');
    for (var i = 0; i < nodes.length; i++) { initSign(nodes[i]); }
  }

  function initSign(svg) {
    if (!svg || !N) { return; }

    var gas = svg.getAttribute('data-gas') || 'neon';
    /* Розжиг по буквам — только там, где он уместен: в шапке дёргающийся
       логотип раздражал бы на каждой странице. */
    var animated = svg.hasAttribute('data-sign-animate');

    function draw() {
      var text = T.t(svg.getAttribute('data-sign')) || T.t('hero.sign');
      var res = N.glyphPaths(text);
      var m = global.ZaryaGlyphs.metrics;
      var pad = 40;

      while (svg.firstChild) { svg.removeChild(svg.firstChild); }
      svg.setAttribute('viewBox',
        (-pad) + ' ' + (m.ascent - pad) + ' ' +
        (res.width + pad * 2) + ' ' + ((m.descent - m.ascent) + pad * 2));
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

      /* Логотипу подпись не нужна: рядом с ним лежит текстовое имя для
         скринридера, а два одинаковых названия подряд только мешают. */
      if (svg.getAttribute('aria-hidden') !== 'true') {
        svg.setAttribute('role', 'img');
        svg.setAttribute('aria-label', text);
      }

      res.glyphs.forEach(function (g, i) {
        var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'nl-part hero-letter');
        group.setAttribute('data-gas', gas);
        /* Задержка розжига — через порядковый номер буквы: CSS сам знает,
           что четвёртая зажигается позже первой. Инлайн-стили не нужны. */
        group.setAttribute('data-ignite', String(Math.min(i, 13)));

        var tube = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        tube.setAttribute('class', 'nl-tube');
        tube.setAttribute('d', g.d);
        tube.setAttribute('stroke-width', '11');

        var core = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        core.setAttribute('class', 'nl-core');
        core.setAttribute('d', g.d);
        core.setAttribute('stroke-width', '3.6');

        group.appendChild(tube);
        group.appendChild(core);
        svg.appendChild(group);
      });

      N.fitViewBox(svg, 30);

      if (animated && !reduced()) {
        svg.classList.remove('is-lit');
        /* перезапуск анимации после смены языка */
        void svg.offsetWidth;
        svg.classList.add('is-lit');
      } else {
        /* Горит ровно, без розжига: логотип не должен моргать на каждой
           странице, а при reduced-motion не моргает вообще ничего. */
        svg.classList.add('is-static');
      }
    }

    draw();
    document.addEventListener('zarya:lang', draw);
  }

  /* --- Шапка и навигация -------------------------------------------------- */
  function initHeader() {
    var header = document.querySelector('[data-header]');
    var toggle = document.querySelector('[data-nav-toggle]');
    var nav = document.querySelector('[data-nav]');
    if (!header) { return; }

    var onScroll = function () {
      header.classList.toggle('is-stuck', global.scrollY > 24);
    };
    global.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (!toggle || !nav) { return; }

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      document.body.classList.toggle('has-nav-open', open);
      if (open) {
        /* Фокус переносим следующим кадром: до перерисовки меню ещё
           невидимо, и браузер откажется его фокусировать. Таймер —
           страховка для случаев, когда кадра не будет (фоновая вкладка). */
        var focusFirst = function () {
          var first = nav.querySelector('a, button');
          if (first && !nav.contains(document.activeElement)) { first.focus(); }
        };
        requestAnimationFrame(focusFirst);
        setTimeout(focusFirst, 60);
      }
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) { setOpen(false); }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    /* Меню — только для узких экранов; на широком оно всегда открыто */
    global.matchMedia('(min-width: 60rem)').addEventListener('change', function (e) {
      if (e.matches) { setOpen(false); }
    });
  }

  /* --- Активный пункт меню ------------------------------------------------ */
  function initSpy() {
    var links = Array.prototype.slice.call(document.querySelectorAll('[data-spy] a[href^="#"]'));
    if (!links.length || !('IntersectionObserver' in global)) { return; }

    var map = {};
    links.forEach(function (link) {
      var id = link.getAttribute('href').slice(1);
      var section = document.getElementById(id);
      if (section) { map[id] = link; }
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        links.forEach(function (l) { l.removeAttribute('aria-current'); });
        var active = map[entry.target.id];
        if (active) { active.setAttribute('aria-current', 'true'); }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    Object.keys(map).forEach(function (id) {
      io.observe(document.getElementById(id));
    });
  }

  /* --- Появление блоков ---------------------------------------------------- */
  function initReveal() {
    var nodes = document.querySelectorAll('[data-reveal]');
    if (!nodes.length) { return; }

    if (reduced() || !('IntersectionObserver' in global)) {
      Array.prototype.forEach.call(nodes, function (n) { n.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    Array.prototype.forEach.call(nodes, function (n) { io.observe(n); });
  }

  /* --- Мелочи -------------------------------------------------------------- */
  function initYear() {
    var node = document.querySelector('[data-year]');
    if (node) { node.textContent = new Date().getFullYear(); }
  }

  function initSmoothLinks() {
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href^="#"]');
      if (!link) { return; }
      var id = link.getAttribute('href').slice(1);
      if (!id) { return; }
      var target = document.getElementById(id);
      if (!target) { return; }

      e.preventDefault();
      target.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });

      /* Фокус переносим руками: без этого клавиатура остаётся наверху */
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      try {
        history.replaceState(null, '', '#' + id);
      } catch (err) {}
    });
  }

  function init() {
    initHeader();
    initSigns();
    initSpy();
    initReveal();
    initYear();
    initSmoothLinks();
  }

  global.ZaryaUI = { init: init };
})(window);
