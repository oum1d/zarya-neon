/* ============================================================================
   ЗАРЯ — сборка повторяющихся секций
   ----------------------------------------------------------------------------
   Карточки, шаги, образцы, строки прайса и FAQ приходят из словаря, поэтому
   собираются кодом: иначе при переводе пришлось бы держать две копии
   разметки и однажды они разъедутся.

   Никакого innerHTML с текстами: только createElement и textContent.
   Даже если завтра тексты начнут приходить с сервера, XSS тут не появится.
   ============================================================================ */

(function (global) {
  'use strict';

  var T = global.ZaryaI18n;

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) { node.className = cls; }
    if (text !== undefined && text !== null) { node.textContent = text; }
    return node;
  }

  function clear(node) {
    while (node && node.firstChild) { node.removeChild(node.firstChild); }
  }

  /* --- «Трубка или лента» ------------------------------------------------- */
  function renderWhy() {
    var host = document.querySelector('[data-render="why"]');
    if (!host) { return; }
    var cards = T.t('why.cards');
    if (!Array.isArray(cards)) { return; }

    clear(host);
    cards.forEach(function (card, i) {
      var item = el('article', 'why-card');
      item.appendChild(el('span', 'why-card__num', String(i + 1).padStart(2, '0')));
      item.appendChild(el('h3', 'why-card__t', card.t));
      item.appendChild(el('p', 'why-card__d', card.d));
      if (i === cards.length - 1) { item.classList.add('why-card--honest'); }
      host.appendChild(item);
    });
  }

  /* --- Процесс ------------------------------------------------------------ */
  function renderProcess() {
    var host = document.querySelector('[data-render="process"]');
    if (!host) { return; }
    var steps = T.t('process.steps');
    if (!Array.isArray(steps)) { return; }

    clear(host);
    steps.forEach(function (step) {
      var item = el('li', 'step');
      item.appendChild(el('span', 'step__n', step.n));
      var body = el('div', 'step__body');
      body.appendChild(el('h3', 'step__t', step.t));
      body.appendChild(el('p', 'step__d', step.d));
      item.appendChild(body);
      host.appendChild(item);
    });
  }

  /* --- Образцы алфавита ---------------------------------------------------
     Каждый образец рисуется тем же движком, что и конструктор: это не
     картинки, а живые трубки. Клик отправляет параметры в конструктор. */
  var SAMPLE_SETUP = [
    { gas: 'ice',    diameter: 10, backing: 'black',  frame: 'none',      cap: 22 },
    { gas: 'neon',   diameter: 12, backing: 'none',   frame: 'none',      cap: 26 },
    { gas: 'warm',   diameter: 8,  backing: 'none',   frame: 'rect',      cap: 20 },
    { gas: 'ruby',   diameter: 10, backing: 'none',   frame: 'underline', cap: 22 },
    { gas: 'ice',    diameter: 8,  backing: 'clear',  frame: 'none',      cap: 18 },
    { gas: 'mint',   diameter: 10, backing: 'none',   frame: 'none',      cap: 22 }
  ];

  function renderSamples() {
    var host = document.querySelector('[data-render="samples"]');
    if (!host) { return; }
    var items = T.t('samples.items');
    if (!Array.isArray(items)) { return; }

    clear(host);
    items.forEach(function (item, i) {
      var setup = SAMPLE_SETUP[i] || SAMPLE_SETUP[0];

      var card = el('button', 'sample');
      card.type = 'button';
      card.setAttribute('data-sample', String(i));
      card.setAttribute('aria-label', item.text + ' — ' + T.t('samples.open'));

      var stage = el('span', 'sample__stage');
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'neon-svg');
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-hidden', 'true');
      stage.appendChild(svg);

      var caption = el('span', 'sample__cap');
      caption.appendChild(el('span', 'sample__text', item.text));
      caption.appendChild(el('span', 'sample__sub', item.sub));
      caption.appendChild(el('span', 'sample__go', T.t('samples.open')));

      card.appendChild(stage);
      card.appendChild(caption);
      host.appendChild(card);

      var model = {
        layout: global.ZaryaNeon.layout([item.text]),
        lines: [{ gas: setup.gas }],
        tubeWidth: setup.diameter * 0.85,
        backing: setup.backing,
        frame: setup.frame,
        frameGas: setup.gas
      };
      global.ZaryaNeon.render(svg, model);
      stage.setAttribute('data-backing', setup.backing);

      card.addEventListener('click', function () {
        document.dispatchEvent(new CustomEvent('zarya:sample', {
          detail: {
            text: item.text,
            gas: setup.gas,
            diameter: setup.diameter,
            backing: setup.backing,
            frame: setup.frame,
            cap: setup.cap
          }
        }));
      });
    });
  }

  /* --- Прайс -------------------------------------------------------------- */
  function renderPrices() {
    var host = document.querySelector('[data-render="prices"]');
    if (!host) { return; }
    var rows = T.t('prices.rows');
    if (!Array.isArray(rows)) { return; }

    clear(host);
    rows.forEach(function (row) {
      var tr = el('tr');
      var th = el('th', 'price__item', row.i);
      th.setAttribute('scope', 'row');
      tr.appendChild(th);
      tr.appendChild(el('td', 'price__value', row.p));
      tr.appendChild(el('td', 'price__note', row.n));
      host.appendChild(tr);
    });
  }

  /* --- FAQ ---------------------------------------------------------------
     <details> вместо самодельного аккордеона: работает без JS, читается
     скринридером и ищется через Ctrl+F в свежих браузерах. */
  function renderFaq() {
    var host = document.querySelector('[data-render="faq"]');
    if (!host) { return; }
    var items = T.t('faq.items');
    if (!Array.isArray(items)) { return; }

    clear(host);
    items.forEach(function (item) {
      var d = el('details', 'faq__item');
      var s = el('summary', 'faq__q');
      s.appendChild(el('span', 'faq__q-text', item.q));
      s.appendChild(el('span', 'faq__q-mark'));
      d.appendChild(s);
      var wrap = el('div', 'faq__a');
      wrap.appendChild(el('p', null, item.a));
      d.appendChild(wrap);
      host.appendChild(d);
    });
  }

  /* --- Политика конфиденциальности ---------------------------------------- */
  function renderPrivacy() {
    var host = document.querySelector('[data-render="privacy"]');
    if (!host) { return; }
    var sections = T.t('privacy.sections');
    if (!Array.isArray(sections)) { return; }

    clear(host);
    sections.forEach(function (s, i) {
      var block = el('section', 'legal__block');
      var h = el('h2', 'legal__h', s.t);
      h.id = 'p-' + (i + 1);
      block.appendChild(h);
      block.appendChild(el('p', null, s.b));
      host.appendChild(block);
    });
  }

  function renderAll() {
    renderWhy();
    renderProcess();
    renderSamples();
    renderPrices();
    renderFaq();
    renderPrivacy();
  }

  global.ZaryaContent = { renderAll: renderAll };
})(window);
