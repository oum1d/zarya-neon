/* ============================================================================
   ЗАРЯ — конструктор вывески
   ----------------------------------------------------------------------------
   Связывает три вещи: алфавит (glyphs.js), измерение трубки (neon.js) и
   смету (pricing.js). Всё пересчитывается на каждое нажатие клавиши, но
   тяжёлая часть — измерение длины — идёт через requestAnimationFrame,
   чтобы ввод не дёргался на слабом ноутбуке.

   Состояние конструктора сохраняется в localStorage: человек вернётся на
   сайт и увидит свою вывеску, а не пустое поле.
   ============================================================================ */

(function (global) {
  'use strict';

  var T = global.ZaryaI18n;
  var N = global.ZaryaNeon;
  var P = global.ZaryaPricing;
  var G = global.ZaryaGlyphs;

  var STORE_KEY = 'zarya.builder';
  var MAX_CHARS = 14;

  /* Потребление трубки, Вт на метр — зависит от диаметра */
  var WATT_PER_M = { 8: 30, 10: 38, 12: 46 };

  var state = {
    line1: 'ЗАРЯ',
    line2: '',
    cap: 22,
    diameter: 10,
    gas1: 'neon',
    gas2: 'ice',
    frame: 'none',
    backing: 'black',
    mount: 'pickup',
    dimmer: false,
    rush: false
  };

  var dom = {};
  var lastResult = null;
  var frameRequested = false;

  /* --- Хранилище ---------------------------------------------------------- */
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) { return; }
      var saved = JSON.parse(raw);
      Object.keys(state).forEach(function (k) {
        if (Object.prototype.hasOwnProperty.call(saved, k)) { state[k] = saved[k]; }
      });
    } catch (e) { /* повреждённое значение просто игнорируем */ }
  }

  /* --- Макет в адресе ------------------------------------------------------
     Клиент собрал вывеску и прислал ссылку — мастер открыл и увидит ровно
     то же самое. Параметры из адреса сильнее сохранённых: пришли по ссылке
     смотреть чужой макет, а не свой прошлый. */
  var URL_KEYS = {
    text: 'line1', text2: 'line2', cap: 'cap', d: 'diameter',
    gas: 'gas1', gas2: 'gas2', frame: 'frame', backing: 'backing'
  };

  var ALLOWED = {
    diameter: ['8', '10', '12'],
    frame: ['none', 'rect', 'underline'],
    backing: ['none', 'clear', 'black', 'cut'],
    gas1: ['neon', 'ruby', 'pink', 'ice', 'mint', 'violet', 'warm', 'white'],
    gas2: ['neon', 'ruby', 'pink', 'ice', 'mint', 'violet', 'warm', 'white']
  };

  function loadFromUrl() {
    var params;
    try {
      params = new URLSearchParams(global.location.search);
    } catch (e) { return; }

    Object.keys(URL_KEYS).forEach(function (param) {
      if (!params.has(param)) { return; }
      var field = URL_KEYS[param];
      var raw = params.get(param);

      /* Всё, что приходит из адреса, проверяется по белому списку: в поле
         текста попадёт только текст, в остальные — только известные значения. */
      if (field === 'line1' || field === 'line2') {
        state[field] = raw.slice(0, MAX_CHARS);
      } else if (field === 'cap') {
        var n = parseInt(raw, 10);
        if (n >= 10 && n <= 45) { state.cap = n; }
      } else if (field === 'diameter') {
        if (ALLOWED.diameter.indexOf(raw) !== -1) { state.diameter = parseInt(raw, 10); }
      } else if (ALLOWED[field] && ALLOWED[field].indexOf(raw) !== -1) {
        state[field] = raw;
      }
    });
  }

  function shareUrl() {
    var url;
    try {
      url = new URL(global.location.href);
    } catch (e) { return ''; }

    url.hash = 'builder';
    url.searchParams.set('lang', T.current());
    url.searchParams.set('text', state.line1);
    if (state.line2.trim()) { url.searchParams.set('text2', state.line2); }
    else { url.searchParams.delete('text2'); }
    url.searchParams.set('cap', state.cap);
    url.searchParams.set('d', state.diameter);
    url.searchParams.set('gas', state.gas1);
    if (state.line2.trim()) { url.searchParams.set('gas2', state.gas2); }
    url.searchParams.set('frame', state.frame);
    url.searchParams.set('backing', state.backing);
    return url.toString();
  }

  /* --- Считывание формы --------------------------------------------------- */
  function readForm() {
    state.line1 = dom.line1.value.slice(0, MAX_CHARS);
    state.line2 = dom.line2.value.slice(0, MAX_CHARS);
    state.cap = parseInt(dom.cap.value, 10) || 20;
    state.diameter = parseInt(pickRadio('diameter'), 10) || 10;
    state.gas1 = dom.gas1.value;
    state.gas2 = dom.gas2.value;
    state.frame = pickRadio('frame') || 'none';
    state.backing = dom.backing.value;
    state.mount = dom.mount.value;
    state.dimmer = dom.dimmer.checked;
    state.rush = dom.rush.checked;
  }

  function pickRadio(name) {
    var node = dom.form.querySelector('input[name="' + name + '"]:checked');
    return node ? node.value : null;
  }

  function writeForm() {
    dom.line1.value = state.line1;
    dom.line2.value = state.line2;
    dom.cap.value = state.cap;
    dom.gas1.value = state.gas1;
    dom.gas2.value = state.gas2;
    dom.backing.value = state.backing;
    dom.mount.value = state.mount;
    dom.dimmer.checked = state.dimmer;
    dom.rush.checked = state.rush;

    setRadio('diameter', state.diameter);
    setRadio('frame', state.frame);
  }

  function setRadio(name, value) {
    var node = dom.form.querySelector('input[name="' + name + '"][value="' + value + '"]');
    if (node) { node.checked = true; }
  }

  /* --- Пересчёт ----------------------------------------------------------- */
  /* Пересчёт откладывается до следующего кадра, чтобы ввод не дёргался.
     Но в скрытой вкладке кадров не бывает — там срабатывает таймер, иначе
     человек вернулся бы к смете, отставшей на несколько букв. */
  function schedule() {
    if (frameRequested) { return; }
    frameRequested = true;

    var done = false;
    var run = function () {
      if (done) { return; }
      done = true;
      frameRequested = false;
      update();
    };

    requestAnimationFrame(run);
    setTimeout(run, 120);
  }

  function update() {
    readForm();
    save();

    var lines = [state.line1];
    if (state.line2.trim()) { lines.push(state.line2); }

    var layout = N.layout(lines);
    var model = {
      layout: layout,
      lines: [{ gas: state.gas1 }, { gas: state.gas2 }],
      tubeWidth: state.diameter * 0.85,
      backing: state.backing,
      frame: state.frame,
      frameGas: state.gas1
    };

    dom.stage.setAttribute('data-backing', state.backing);
    dom.stage.classList.toggle('is-empty', layout.empty);

    var parts = N.render(dom.svg, model);
    var measured = N.measure(parts);

    updateCounters();
    updateWarning();

    if (layout.empty) {
      lastResult = null;
      dom.estimate.classList.add('is-empty');
      renderEmptyEstimate();
      return;
    }
    dom.estimate.classList.remove('is-empty');

    /* getBBox меряет по осевой линии трубки, поэтому к габариту добавляется
       её толщина: вывеска шире своего чертежа ровно на один диаметр. */
    var box = safeBBox(dom.svg);
    var k = state.cap / 100;                       /* см в одной глифовой единице */
    var outerW = box.width + model.tubeWidth;
    var outerH = box.height + model.tubeWidth;
    var sizeW = outerW * k;
    var sizeH = outerH * k;

    var result = P.calc({
      unitsText: measured.text,
      unitsFrame: measured.frame,
      tubesText: measured.tubesText,
      tubesFrame: measured.tubesFrame,
      capCm: state.cap,
      gases: [state.gas1, state.gas2],
      frameGas: state.gas1,
      diameter: state.diameter,
      backing: state.backing,
      boxUnits: { w: outerW, h: outerH },
      mount: state.mount,
      dimmer: state.dimmer,
      rush: state.rush
    });

    lastResult = { result: result, measured: measured, size: { w: sizeW, h: sizeH } };
    renderFacts(result, sizeW, sizeH);
    renderEstimate(result);
  }

  /* Габарит меряется по стеклу, а не по всему холсту: подложка уже
     нарисована с полями вокруг букв, и если считать по ней, поле уйдёт
     в смету дважды. getBBox падает на скрытом элементе — подстрахуемся. */
  function safeBBox(svg) {
    var parts = svg.querySelectorAll('.nl-part');
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    var i, b;

    for (i = 0; i < parts.length; i++) {
      try {
        b = parts[i].getBBox();
      } catch (e) {
        continue;
      }
      if (!b || !b.width) { continue; }
      minX = Math.min(minX, b.x);
      minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.width);
      maxY = Math.max(maxY, b.y + b.height);
    }

    if (isFinite(minX) && maxX > minX) {
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }

    var vb = (svg.getAttribute('viewBox') || '0 0 100 100').split(/\s+/).map(Number);
    return { x: 0, y: 0, width: vb[2], height: vb[3] };
  }

  function updateCounters() {
    dom.count1.textContent = state.line1.length + '/' + MAX_CHARS;
    dom.count2.textContent = state.line2.length + '/' + MAX_CHARS;
  }

  function updateWarning() {
    var bad = G.unsupported(state.line1 + state.line2);
    if (!bad.length) {
      dom.warn.hidden = true;
      dom.warn.textContent = '';
      return;
    }
    dom.warn.hidden = false;
    dom.warn.textContent = T.t('builder.unsupported') + ' ' + bad.join(' ');
  }

  /* --- Вывод сметы -------------------------------------------------------- */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) { n.className = cls; }
    if (text !== undefined) { n.textContent = text; }
    return n;
  }

  function clear(node) { while (node.firstChild) { node.removeChild(node.firstChild); } }

  function renderEmptyEstimate() {
    clear(dom.rows);
    var row = el('p', 'estimate__empty', T.t('builder.empty'));
    dom.rows.appendChild(row);
    dom.netto.textContent = '—';
    dom.vat.textContent = '—';
    dom.brutto.textContent = '—';
    dom.term.textContent = '—';
    ['length', 'tubes', 'size', 'power'].forEach(function (key) {
      dom.facts[key].textContent = '—';
    });
  }

  function labelFor(item) {
    switch (item.key) {
      case 'tube':       return T.fmt('builder.lineTube', { n: item.line });
      case 'frame':      return T.t('builder.lineFrame');
      case 'electrodes': return T.t('builder.lineElectrodes');
      case 'backing':    return T.t('builder.lineBacking');
      case 'psu':        return T.t('builder.linePsu');
      case 'dimmer':     return T.t('builder.lineDimmer');
      case 'mount':      return T.t('builder.lineMount');
      case 'minimum':    return T.t('builder.lineMinimum');
      case 'rush':       return T.t('builder.lineRush');
      default:           return item.key;
    }
  }

  /* Пояснение к строке: именно оно превращает счёт в понятный разговор */
  function noteFor(item) {
    if (item.key === 'tube' || item.key === 'frame') {
      return P.meters(item.meters) + ' ' + T.t('builder.metersUnit') +
             ' × ' + Math.round(item.rate) + ' ' + T.t('builder.perMeter') +
             ' · ' + T.t('builder.gases.' + item.gas);
    }
    if (item.key === 'electrodes') {
      return T.fmt('builder.tubesCount', { n: item.count }) +
             ' × ' + item.rate + ' zł';
    }
    if (item.key === 'backing') {
      return T.t('builder.backings.' + item.variant) + ' · ' +
             item.area.toFixed(2) + ' ' + T.t('builder.areaUnit') +
             ' × ' + item.rate + ' zł';
    }
    if (item.key === 'psu') {
      return T.fmt('builder.tubesCount', { n: item.count }) + ' × ' + item.rate + ' zł';
    }
    if (item.key === 'mount') {
      return T.t('builder.mounts.' + item.variant);
    }
    if (item.key === 'rush') {
      return '+' + Math.round(item.rate * 100) + '%';
    }
    if (item.key === 'minimum') {
      return T.t('builder.minimumNote');
    }
    return '';
  }

  function renderEstimate(result) {
    clear(dom.rows);

    result.items.forEach(function (item) {
      var row = el('div', 'estimate__row');
      var main = el('div', 'estimate__main');
      main.appendChild(el('span', 'estimate__label', labelFor(item)));
      var note = noteFor(item);
      if (note) { main.appendChild(el('span', 'estimate__note', note)); }
      row.appendChild(main);
      row.appendChild(el('span', 'estimate__sum', P.money(item.amount)));
      dom.rows.appendChild(row);
    });

    dom.netto.textContent = P.money(result.netto);
    dom.vat.textContent = P.money(result.vat);
    dom.brutto.textContent = P.money(result.brutto);
    dom.term.textContent = result.days + ' ' + T.t('builder.days');
  }

  function renderFacts(result, sizeW, sizeH) {
    var watt = Math.round(result.meters * (WATT_PER_M[state.diameter] || 38));

    /* Единицы тоже переводятся: «см» и «cm» — разные подписи одной величины */
    dom.facts.length.textContent = P.meters(result.meters) + ' ' + T.t('builder.metersUnit');
    dom.facts.tubes.textContent = String(result.tubes);
    dom.facts.size.textContent = Math.round(sizeW) + ' × ' + Math.round(sizeH) +
      ' ' + T.t('builder.unitCm');
    dom.facts.power.textContent = watt + ' ' + T.t('builder.unitW');
  }

  /* --- Экспорт макета -----------------------------------------------------
     Файл должен открываться у любого: у мастера, у печатника, у клиента.
     Поэтому цвета и свечение записываются в сам файл, а не берутся из CSS
     сайта. Фильтр — стандартный SVG, без внешних зависимостей. */
  function xmlEscape(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c];
    });
  }

  var GAS_HEX = {
    neon: '#FF4D1C', ruby: '#FF2D6F', pink: '#FF3DB8', ice: '#35D6F5',
    mint: '#37F5A3', violet: '#9B6BFF', warm: '#FFC46B', white: '#E8F4FF'
  };

  var BACKING_HEX = { none: 'none', clear: 'rgba(255,255,255,0.06)', black: '#0B0B0E', cut: '#0B0B0E' };

  function exportSVG() {
    if (!lastResult) { return null; }

    var vb = dom.svg.getAttribute('viewBox');
    var groups = dom.svg.querySelectorAll('.nl-part');
    var body = '';
    var i, g, gas, d, w;

    for (i = 0; i < groups.length; i++) {
      g = groups[i];
      gas = g.getAttribute('data-gas') || 'neon';
      d = g.querySelector('.nl-tube').getAttribute('d');
      w = g.querySelector('.nl-tube').getAttribute('stroke-width');
      var hex = GAS_HEX[gas] || GAS_HEX.neon;

      body +=
        '\n    <g filter="url(#glow)">' +
        '\n      <path d="' + d + '" fill="none" stroke="' + hex + '" stroke-width="' + w +
        '" stroke-linecap="round" stroke-linejoin="round" opacity="0.95"/>' +
        '\n      <path d="' + d + '" fill="none" stroke="#FFFFFF" stroke-width="' +
        (Math.max(2, w * 0.34)).toFixed(1) + '" stroke-linecap="round" stroke-linejoin="round"/>' +
        '\n    </g>';
    }

    var bg = BACKING_HEX[state.backing] === 'none' ? '#0A0A0D' : BACKING_HEX[state.backing];
    var title = (state.line1 + (state.line2 ? ' / ' + state.line2 : '')).trim();

    return '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '" role="img" aria-label="' +
      xmlEscape(title) + '">\n' +
      '  <title>' + xmlEscape(title) + ' — ZARYA</title>\n' +
      '  <desc>' + xmlEscape(
        'Makieta / макет: ' + P.meters(lastResult.result.meters) + ' m, ' +
        lastResult.result.tubes + ' tubes, ' + state.diameter + ' mm, cap ' + state.cap + ' cm'
      ) + '</desc>\n' +
      '  <defs>\n' +
      '    <filter id="glow" x="-25%" y="-25%" width="150%" height="150%">\n' +
      '      <feGaussianBlur stdDeviation="6" result="b1"/>\n' +
      '      <feGaussianBlur stdDeviation="16" result="b2"/>\n' +
      '      <feMerge>\n' +
      '        <feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/>\n' +
      '      </feMerge>\n' +
      '    </filter>\n' +
      '  </defs>\n' +
      '  <rect x="-9999" y="-9999" width="19998" height="19998" fill="' + bg + '"/>' +
      body + '\n</svg>\n';
  }

  function downloadSVG() {
    var svg = exportSVG();
    if (!svg) { return; }

    var name = (state.line1 + '-' + state.line2).trim()
      .replace(/\s+/g, '-')
      .replace(/[^\p{L}\p{N}-]/gu, '')
      .slice(0, 40) || 'zarya';

    var blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'zarya-' + name.toLowerCase() + '.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* --- Передача в заявку --------------------------------------------------
     Человеческий текст, а не JSON: его прочитает и мастер, и клиент в копии
     письма. */
  function specText() {
    if (!lastResult) { return ''; }
    var r = lastResult.result;
    var parts = [];

    parts.push(T.t('builder.text1') + ': ' + state.line1);
    if (state.line2.trim()) { parts.push(T.t('builder.text2') + ': ' + state.line2); }
    parts.push(T.t('builder.height') + ': ' + state.cap + ' cm');
    parts.push(T.t('builder.diameter') + ': ' + state.diameter + ' mm');
    parts.push(T.t('builder.gas1') + ': ' + T.t('builder.gases.' + state.gas1));
    if (state.line2.trim()) {
      parts.push(T.t('builder.gas2') + ': ' + T.t('builder.gases.' + state.gas2));
    }
    parts.push(T.t('builder.frame') + ': ' + T.t('builder.frames.' + state.frame));
    parts.push(T.t('builder.backing') + ': ' + T.t('builder.backings.' + state.backing));
    parts.push(T.t('builder.mount') + ': ' + T.t('builder.mounts.' + state.mount));
    if (state.dimmer) { parts.push(T.t('builder.dimmer')); }
    if (state.rush) { parts.push(T.t('builder.rush')); }
    parts.push(T.t('builder.facts.length') + ': ' + P.meters(r.meters) + ' m');
    parts.push(T.t('builder.facts.tubes') + ': ' + r.tubes);
    parts.push(T.t('builder.facts.size') + ': ' +
      Math.round(lastResult.size.w) + ' × ' + Math.round(lastResult.size.h) + ' cm');
    parts.push(T.t('builder.brutto') + ': ' + P.money(r.brutto));

    return parts.join('\n');
  }

  function sendToOrder() {
    var spec = specText();
    var field = document.getElementById('order-spec');
    var badge = document.querySelector('[data-order-spec-state]');

    if (field) { field.value = spec; }
    if (badge) {
      badge.textContent = spec ? T.t('order.attached') : T.t('order.attachedNone');
      badge.classList.toggle('is-on', !!spec);
    }

    var target = document.getElementById('order');
    if (target) {
      target.scrollIntoView({ behavior: prefersMotion() ? 'auto' : 'smooth', block: 'start' });
      var first = document.getElementById('order-name');
      if (first) { setTimeout(function () { first.focus({ preventScroll: true }); }, 400); }
    }
  }

  function prefersMotion() {
    return global.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* --- Инициализация ------------------------------------------------------ */
  function init() {
    dom.form = document.getElementById('builder-form');
    if (!dom.form) { return; }

    dom.line1 = document.getElementById('b-line1');
    dom.line2 = document.getElementById('b-line2');
    dom.cap = document.getElementById('b-cap');
    dom.capOut = document.getElementById('b-cap-out');
    dom.gas1 = document.getElementById('b-gas1');
    dom.gas2 = document.getElementById('b-gas2');
    dom.backing = document.getElementById('b-backing');
    dom.mount = document.getElementById('b-mount');
    dom.dimmer = document.getElementById('b-dimmer');
    dom.rush = document.getElementById('b-rush');
    dom.count1 = document.getElementById('b-count1');
    dom.count2 = document.getElementById('b-count2');
    dom.warn = document.getElementById('b-warn');
    dom.stage = document.getElementById('b-stage');
    dom.svg = document.getElementById('b-svg');
    dom.estimate = document.getElementById('b-estimate');
    dom.rows = document.getElementById('b-rows');
    dom.netto = document.getElementById('b-netto');
    dom.vat = document.getElementById('b-vat');
    dom.brutto = document.getElementById('b-brutto');
    dom.term = document.getElementById('b-term');
    dom.facts = {
      length: document.getElementById('b-fact-length'),
      tubes: document.getElementById('b-fact-tubes'),
      size: document.getElementById('b-fact-size'),
      power: document.getElementById('b-fact-power')
    };

    load();
    loadFromUrl();
    writeForm();

    dom.form.addEventListener('input', function (e) {
      if (e.target === dom.cap) { dom.capOut.textContent = dom.cap.value; }
      schedule();
    });
    dom.form.addEventListener('change', schedule);
    dom.form.addEventListener('submit', function (e) { e.preventDefault(); });

    var dl = document.getElementById('b-download');
    if (dl) { dl.addEventListener('click', downloadSVG); }

    var share = document.getElementById('b-share');
    if (share) {
      share.addEventListener('click', function () {
        var link = shareUrl();
        if (!link) { return; }

        var done = function () {
          var was = share.textContent;
          share.textContent = T.t('builder.linkCopied');
          setTimeout(function () { share.textContent = was; }, 2000);
        };

        if (global.navigator.clipboard && global.navigator.clipboard.writeText) {
          global.navigator.clipboard.writeText(link).then(done, function () {
            /* Буфер может быть закрыт политикой браузера — тогда просто
               кладём ссылку в адресную строку, откуда её можно скопировать. */
            try { history.replaceState(null, '', link); } catch (e) {}
          });
        } else {
          try { history.replaceState(null, '', link); } catch (e) {}
        }
      });
    }

    var toOrder = document.getElementById('b-to-order');
    if (toOrder) { toOrder.addEventListener('click', sendToOrder); }

    var reset = document.getElementById('b-reset');
    if (reset) {
      reset.addEventListener('click', function () {
        state.line1 = 'ЗАРЯ'; state.line2 = ''; state.cap = 22;
        state.diameter = 10; state.gas1 = 'neon'; state.gas2 = 'ice';
        state.frame = 'none'; state.backing = 'black'; state.mount = 'pickup';
        state.dimmer = false; state.rush = false;
        writeForm();
        dom.capOut.textContent = state.cap;
        update();
      });
    }

    /* Клик по образцу заряжает конструктор его настройками */
    document.addEventListener('zarya:sample', function (e) {
      var s = e.detail;
      state.line1 = s.text.slice(0, MAX_CHARS);
      state.line2 = '';
      state.gas1 = s.gas;
      state.diameter = s.diameter;
      state.backing = s.backing;
      state.frame = s.frame;
      state.cap = s.cap;
      writeForm();
      dom.capOut.textContent = state.cap;
      update();

      var section = document.getElementById('builder');
      if (section) {
        section.scrollIntoView({ behavior: prefersMotion() ? 'auto' : 'smooth', block: 'start' });
      }
    });

    /* Смена языка переписывает подписи в смете */
    document.addEventListener('zarya:lang', function () {
      if (dom.capOut) { dom.capOut.textContent = state.cap; }
      update();
    });

    dom.capOut.textContent = state.cap;
    update();
  }

  global.ZaryaBuilder = { init: init, specText: specText };
})(window);
