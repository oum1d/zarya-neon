/* ============================================================================
   ЗАРЯ — сборка надписи из трубок и измерение
   ----------------------------------------------------------------------------
   Здесь текст превращается в SVG и здесь же берётся главное число всего
   сайта — ДЛИНА ТРУБКИ. Не «примерно по буквам», а реальная длина кривой:
   path.getTotalLength() браузера, тот же алгоритм, что рисует линию на экране.

   Почему это важно: мастер покупает стекло метрами и гнёт его метрами.
   Буква «Ш» вдвое длиннее буквы «Г», поэтому и стоит вдвое дороже. Сайт
   показывает ровно ту арифметику, по которой считает мастерская.

   Все координаты глифов абсолютные (M, L, A, C, Z), поэтому строку можно
   собрать в ОДИН path простым сдвигом координат. Один path на строку =
   одно измерение длины и никаких вложенных трансформаций, которые
   незаметно врут в расчётах.
   ============================================================================ */

(function (global) {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var G = global.ZaryaGlyphs;

  /* Сколько чисел ждёт каждая команда пути */
  var ARITY = { M: 2, L: 2, C: 6, A: 7, Z: 0 };

  /* --- Сдвиг абсолютного пути --------------------------------------------
     Для A сдвигаются только последние два числа (радиусы и флаги трогать
     нельзя), для остальных команд — все пары. */
  function translatePath(d, dx, dy) {
    if (!d) { return ''; }
    var out = [];
    var re = /([MLACZ])([^MLACZ]*)/gi;
    var m, cmd, nums, arity, i, j, chunk;

    while ((m = re.exec(d)) !== null) {
      cmd = m[1].toUpperCase();
      arity = ARITY[cmd];
      if (arity === 0) { out.push('Z'); continue; }

      nums = (m[2].match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) || []).map(Number);

      for (i = 0; i + arity <= nums.length; i += arity) {
        chunk = nums.slice(i, i + arity);
        if (cmd === 'A') {
          chunk[5] += dx;
          chunk[6] += dy;
        } else {
          for (j = 0; j < arity; j += 2) {
            chunk[j] += dx;
            chunk[j + 1] += dy;
          }
        }
        out.push((i === 0 ? cmd : ' ') + chunk.map(round2).join(' '));
      }
    }
    return out.join(' ');
  }

  function round2(n) { return Math.round(n * 100) / 100; }

  /* Каждая команда M — отдельная трубка: свой кусок стекла, своя пара
     электродов, своя пайка. Считаем их честно. */
  function countTubes(d) {
    var m = d.match(/M/gi);
    return m ? m.length : 0;
  }

  /* --- Раскладка строки --------------------------------------------------- */
  function layoutLine(text) {
    var mt = G.metrics;
    var items = [];
    var x = 0;
    var i, ch, glyph;

    for (i = 0; i < text.length; i++) {
      ch = text[i].toUpperCase();
      glyph = G.table[ch];
      if (!glyph) { continue; }               /* неизвестный символ пропускаем */
      items.push({ ch: ch, x: x, w: glyph.w, d: glyph.d });
      x += glyph.w + mt.letterSpacing;
    }
    if (items.length) { x -= mt.letterSpacing; }

    return { items: items, width: Math.max(0, x) };
  }

  /* --- Раскладка всей надписи --------------------------------------------
     Возвращает по одному path на строку плюс общие габариты в глифовых
     единицах (высота прописной = 100). */
  function layout(lines) {
    var mt = G.metrics;
    var laid = [];
    var width = 0;
    var i;

    for (i = 0; i < lines.length; i++) {
      laid.push(layoutLine(lines[i]));
      width = Math.max(width, laid[i].width);
    }

    var rowStep = mt.capHeight + mt.lineGap;
    var result = { lines: [], width: width, height: 0, empty: true };

    for (i = 0; i < laid.length; i++) {
      var offsetX = (width - laid[i].width) / 2;   /* строки по центру */
      var offsetY = i * rowStep;
      var d = '';
      var k;

      for (k = 0; k < laid[i].items.length; k++) {
        var it = laid[i].items[k];
        var moved = translatePath(it.d, it.x + offsetX, offsetY);
        if (moved) { d += (d ? ' ' : '') + moved; }
      }

      result.lines.push({
        d: d,
        text: lines[i],
        tubes: countTubes(d),
        width: laid[i].width,
        top: offsetY + mt.ascent,
        bottom: offsetY + mt.descent
      });
      if (d) { result.empty = false; }
    }

    var last = laid.length - 1;
    result.height = last * rowStep + mt.capHeight;
    result.viewTop = mt.ascent;
    result.viewBottom = last * rowStep + mt.descent;

    /* Капительные границы — верх прописной буквы и базовая линия. По ним
       выравниваются рамка и подложка: глаз считает центром надписи середину
       букв, а не середину габарита с акцентами и хвостами. */
    result.capTop = 0;
    result.capBottom = last * rowStep + mt.capHeight;
    return result;
  }

  /* --- Рамка и подчёркивание ---------------------------------------------
     Тоже трубка: те же метры, та же цена. Считается тем же способом. */
  /* Рамка и подложка выравниваются по буквам, а не по габариту.
     Разница видна на словах вроде «ŚWIT»: акут над Ś поднимает верх габарита,
     и рамка, построенная по нему, оказывается выше надписи — буквы будто
     проваливаются вниз. Поэтому поля считаются от капители и базовой линии,
     а акценту и нижним хвостам гарантируется лишь небольшой зазор. */
  function optical(box, caps, pad, minGap) {
    var capTop = caps ? caps.top : box.y;
    var capBottom = caps ? caps.bottom : box.y + box.h;
    return {
      x0: box.x - pad,
      x1: box.x + box.w + pad,
      y0: Math.min(capTop - pad, box.y - minGap),
      y1: Math.max(capBottom + pad, box.y + box.h + minGap)
    };
  }

  function framePath(box, kind, caps) {
    var pad = 46;
    var f = optical(box, caps, pad, 14);
    var x0 = f.x0, y0 = f.y0, x1 = f.x1, y1 = f.y1;
    var r = 34;

    if (kind === 'rect') {
      return 'M' + (x0 + r) + ',' + y0 +
             ' L' + (x1 - r) + ',' + y0 +
             ' A' + r + ',' + r + ' 0 0 1 ' + x1 + ',' + (y0 + r) +
             ' L' + x1 + ',' + (y1 - r) +
             ' A' + r + ',' + r + ' 0 0 1 ' + (x1 - r) + ',' + y1 +
             ' L' + (x0 + r) + ',' + y1 +
             ' A' + r + ',' + r + ' 0 0 1 ' + x0 + ',' + (y1 - r) +
             ' L' + x0 + ',' + (y0 + r) +
             ' A' + r + ',' + r + ' 0 0 1 ' + (x0 + r) + ',' + y0 + ' Z';
    }
    if (kind === 'underline') {
      /* Подчёркивание идёт под базовой линией, а не под самой нижней точкой:
         иначе слово с хвостом у «Ц» или «Д» уводило черту заметно ниже. */
      var uy = round2(Math.max((caps ? caps.bottom : box.y + box.h) + 30,
                               box.y + box.h + 12));
      return 'M' + x0 + ',' + uy + ' L' + x1 + ',' + uy;
    }
    return '';
  }

  /* --- Отрисовка ----------------------------------------------------------
     Каждая строка рисуется дважды: широкая трубка цветом газа и тонкое
     белое ядро внутри. Свечение навешивает CSS (drop-shadow), поэтому в
     дневном режиме достаточно обнулить переменные — стекло гаснет само. */
  function render(svg, model) {
    while (svg.firstChild) { svg.removeChild(svg.firstChild); }

    /* Стартовый кадр по метрикам шрифта — только чтобы в SVG было что мерить.
       Настоящие границы возьмём ниже, у нарисованных букв. */
    var pad = 60;
    svg.setAttribute('viewBox',
      round2(-pad) + ' ' + round2(model.layout.viewTop - pad) + ' ' +
      round2(model.layout.width + pad * 2) + ' ' +
      round2((model.layout.viewBottom - model.layout.viewTop) + pad * 2));
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    var made = [];
    var i;

    function draw(d, gas, kind, index) {
      var g = document.createElementNS(SVG_NS, 'g');
      g.setAttribute('class', 'nl-part');
      /* Газ задаётся атрибутом, а не инлайн-стилем: так строгая CSP
         обходится без unsafe-inline. Цвет подставляет CSS. */
      g.setAttribute('data-gas', gas);

      var glow = document.createElementNS(SVG_NS, 'path');
      glow.setAttribute('class', 'nl-tube');
      glow.setAttribute('d', d);
      glow.setAttribute('stroke-width', model.tubeWidth);

      var core = document.createElementNS(SVG_NS, 'path');
      core.setAttribute('class', 'nl-core');
      core.setAttribute('d', d);
      core.setAttribute('stroke-width', Math.max(2, model.tubeWidth * 0.34));

      g.appendChild(glow);
      g.appendChild(core);
      svg.appendChild(g);

      made.push({ node: glow, kind: kind, index: index, d: d });
    }

    for (i = 0; i < model.layout.lines.length; i++) {
      if (!model.layout.lines[i].d) { continue; }
      draw(model.layout.lines[i].d,
           model.lines[i] ? model.lines[i].gas : model.lines[0].gas,
           'text', i);
    }

    /* Рамку гнут вокруг готовой надписи, поэтому и строим её по фактическим
       границам букв. Раньше она бралась из метрик шрифта — с запасом под
       выносные хвосты и надстрочные знаки, которых в слове может не быть.
       Из-за этого короткое слово оказывалось не по центру рамки. */
    if (model.frame && model.frame !== 'none') {
      var box = textBox(svg);
      if (box) {
        var fd = framePath(box, model.frame,
          { top: model.layout.capTop, bottom: model.layout.capBottom });
        if (fd) { draw(fd, model.frameGas || model.lines[0].gas, 'frame'); }
      }
    }

    /* Подложку режут по готовой вывеске, а не наоборот, поэтому и здесь она
       строится последней — по фактическим границам букв. Раньше это был
       прямоугольник фиксированной доли сцены, и длинная надпись из него
       вылезала. */
    addPlate(svg, model);

    /* Кадрируем по реальным границам букв, а не по метрикам шрифта: иначе
       короткое слово болтается в пустоте, оставленной под выносные хвосты,
       которых в нём нет. Запас — на толщину трубки и на ореол свечения. */
    fitViewBox(svg, model.tubeWidth * 1.4 + 26);

    return made;
  }

  function addPlate(svg, model) {
    var kind = model.backing || 'none';
    if (kind === 'none') { return; }

    var box;
    try {
      box = svg.getBBox();
    } catch (e) {
      return;
    }
    if (!box || !box.width) { return; }

    /* Поле вокруг стекла: половина трубки плюс запас на крепёж.
       Лист режут по буквам, поэтому и здесь выравнивание оптическое: акут
       над Ś не должен утягивать надпись к нижнему краю акрила. */
    var pad = model.tubeWidth / 2 + 26;
    var f = optical({ x: box.x, y: box.y, w: box.width, h: box.height },
                    { top: model.layout.capTop, bottom: model.layout.capBottom },
                    pad, 10);
    var plate = document.createElementNS(SVG_NS, 'rect');

    plate.setAttribute('class', 'nl-plate');
    plate.setAttribute('x', round2(f.x0));
    plate.setAttribute('y', round2(f.y0));
    plate.setAttribute('width', round2(f.x1 - f.x0));
    plate.setAttribute('height', round2(f.y1 - f.y0));

    /* «По контуру» — акрил фрезеруют в форму надписи, поэтому у него
       скругление во всю высоту, а не аккуратные уголки прямоугольника. */
    var r = kind === 'cut' ? (f.y1 - f.y0) / 2 : 18;
    plate.setAttribute('rx', round2(r));
    plate.setAttribute('data-plate', kind);

    svg.insertBefore(plate, svg.firstChild);
  }

  /* Границы уже нарисованных букв — по осевым линиям, без учёта толщины
     трубки. Именно от них пляшут и рамка, и подложка. */
  function textBox(svg) {
    var box;
    try {
      box = svg.getBBox();
    } catch (e) {
      return null;
    }
    if (!box || !box.width) { return null; }
    return { x: box.x, y: box.y, w: box.width, h: box.height };
  }

  function fitViewBox(svg, pad) {
    var box;
    try {
      box = svg.getBBox();
    } catch (e) {
      return;                       /* элемент скрыт — оставляем как есть */
    }
    if (!box || !box.width || !box.height) { return; }

    svg.setAttribute('viewBox',
      round2(box.x - pad) + ' ' + round2(box.y - pad) + ' ' +
      round2(box.width + pad * 2) + ' ' + round2(box.height + pad * 2));
  }

  /* --- Измерение ----------------------------------------------------------
     Длина берётся у уже нарисованных путей. Единицы глифовые: высота
     прописной = 100. Перевод в сантиметры делает калькулятор цены, потому
     что только он знает, какую высоту букв заказали. */
  function measure(parts) {
    var out = { text: [], frame: 0, tubesText: 0, tubesFrame: 0, total: 0 };
    var i, len;

    for (i = 0; i < parts.length; i++) {
      len = parts[i].node.getTotalLength();
      if (parts[i].kind === 'frame') {
        out.frame += len;
        out.tubesFrame += countTubes(parts[i].d);
      } else {
        out.text[parts[i].index] = (out.text[parts[i].index] || 0) + len;
        out.tubesText += countTubes(parts[i].d);
      }
      out.total += len;
    }
    return out;
  }

  /* --- Побуквенная раскладка ----------------------------------------------
     Нужна там, где буквы зажигаются по очереди (первый экран): для этого
     каждая должна быть отдельным путём, а не частью общей строки. */
  function glyphPaths(text) {
    var line = layoutLine(text);
    var out = [];
    var i, it, moved;

    for (i = 0; i < line.items.length; i++) {
      it = line.items[i];
      moved = translatePath(it.d, it.x, 0);
      if (moved) { out.push({ ch: it.ch, d: moved }); }
    }
    return { glyphs: out, width: line.width };
  }

  global.ZaryaNeon = {
    layout: layout,
    glyphPaths: glyphPaths,
    fitViewBox: fitViewBox,
    render: render,
    measure: measure,
    translatePath: translatePath,
    countTubes: countTubes
  };
})(window);
