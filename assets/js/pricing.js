/* ============================================================================
   ЗАРЯ — калькулятор сметы
   ----------------------------------------------------------------------------
   Одно правило: ни одной строки в смете, которую нельзя объяснить клиенту.
   Метры стекла, пары электродов, площадь подложки, блок питания, монтаж.
   Никаких «коэффициентов сложности» с потолка.

   Все цены — в одном месте, чтобы мастерская правила прайс здесь, а не в
   пятнадцати файлах. Валюта — злотый, netto и brutto (VAT 23%).

   ВАЖНО для внедрения: это витринная смета. Финальную цену мастерская
   подтверждает после проверки макета — так и написано у формы заявки.
   ============================================================================ */

(function (global) {
  'use strict';

  var PRICE = {
    currency: 'zł',
    vat: 0.23,

    /* Метр гнутой трубки. Тонкая трубка дороже: её сложнее гнуть,
       брака больше. */
    tubePerMeter: { 8: 195, 10: 168, 12: 152 },

    /* Надбавка за газ и покрытие стекла */
    gasFactor: {
      neon: 1.0,     /* чистый неон: самый простой и самый живой цвет */
      ruby: 1.2,
      pink: 1.18,
      ice: 1.1,
      mint: 1.15,
      violet: 1.22,
      warm: 1.12,
      white: 1.14
    },

    /* Каждая отдельная трубка: пара электродов, откачка, пайка */
    perTube: 46,

    /* Подложка, zł за м² */
    backing: { none: 0, clear: 430, black: 470, cut: 690 },

    /* Блок питания подбирается по суммарной длине: один трансформатор
       тянет примерно 4 метра трубки */
    psuPerUnit: 190,
    metersPerPsu: 4,

    dimmer: 160,

    mount: { pickup: 0, ship: 95, install: 280 },

    /* Минимальный заказ мастерской */
    minNetto: 900,

    /* Срок изготовления */
    baseDays: 12,
    rushDays: 6,
    rushFactor: 0.25
  };

  function round(n, step) {
    step = step || 1;
    return Math.round(n / step) * step;
  }

  function ceilTo(n, step) {
    return Math.ceil(n / step) * step;
  }

  /* --------------------------------------------------------------------------
     input:
       unitsText   [длина строки 1, длина строки 2] в глифовых единицах
       unitsFrame  длина рамки/подчёркивания
       tubesText, tubesFrame — число отдельных трубок
       capCm       высота прописной буквы в сантиметрах (это и есть масштаб)
       gases       ['neon', 'ice'] — газ каждой строки
       frameGas    газ рамки
       diameter    8 | 10 | 12
       backing     none | clear | black | cut
       boxUnits    { w, h } габарит макета в глифовых единицах
       mount       pickup | ship | install
       dimmer, rush — булевы
     -------------------------------------------------------------------------- */
  function calc(input) {
    var k = input.capCm / 100;          /* 1 глифовая единица = k сантиметров */
    var items = [];
    var i;

    var metersText = [];
    var totalMeters = 0;

    for (i = 0; i < input.unitsText.length; i++) {
      var m = (input.unitsText[i] || 0) * k / 100;
      metersText.push(m);
      totalMeters += m;
    }
    var metersFrame = (input.unitsFrame || 0) * k / 100;
    totalMeters += metersFrame;

    var base = PRICE.tubePerMeter[input.diameter] || PRICE.tubePerMeter[10];

    /* 1. Стекло по строкам — у каждой строки свой газ, значит свой тариф */
    for (i = 0; i < metersText.length; i++) {
      if (metersText[i] <= 0) { continue; }
      var gas = input.gases[i] || input.gases[0] || 'neon';
      var rate = base * (PRICE.gasFactor[gas] || 1);
      items.push({
        key: 'tube',
        line: i + 1,
        gas: gas,
        meters: metersText[i],
        rate: rate,
        amount: metersText[i] * rate
      });
    }

    /* 2. Рамка — то же стекло, отдельной строкой, чтобы было видно её цену */
    if (metersFrame > 0) {
      var fgas = input.frameGas || input.gases[0] || 'neon';
      var frate = base * (PRICE.gasFactor[fgas] || 1);
      items.push({
        key: 'frame',
        gas: fgas,
        meters: metersFrame,
        rate: frate,
        amount: metersFrame * frate
      });
    }

    /* 3. Электроды и пайка — по числу отдельных трубок */
    var tubes = (input.tubesText || 0) + (input.tubesFrame || 0);
    if (tubes > 0) {
      items.push({
        key: 'electrodes',
        count: tubes,
        rate: PRICE.perTube,
        amount: tubes * PRICE.perTube
      });
    }

    /* 4. Подложка — по площади габарита плюс поле 4 см с каждой стороны */
    var areaM2 = 0;
    if (input.backing && input.backing !== 'none') {
      var wCm = input.boxUnits.w * k + 8;
      var hCm = input.boxUnits.h * k + 8;
      areaM2 = ceilTo((wCm * hCm) / 10000, 0.05);
      items.push({
        key: 'backing',
        variant: input.backing,
        area: areaM2,
        rate: PRICE.backing[input.backing],
        amount: areaM2 * PRICE.backing[input.backing]
      });
    }

    /* 5. Блоки питания — по суммарной длине трубки */
    var psu = Math.max(1, Math.ceil(totalMeters / PRICE.metersPerPsu));
    if (totalMeters > 0) {
      items.push({
        key: 'psu',
        count: psu,
        rate: PRICE.psuPerUnit,
        amount: psu * PRICE.psuPerUnit
      });
    }

    if (input.dimmer) {
      items.push({ key: 'dimmer', amount: PRICE.dimmer });
    }

    if (input.mount && PRICE.mount[input.mount]) {
      items.push({ key: 'mount', variant: input.mount, amount: PRICE.mount[input.mount] });
    }

    /* 6. Итоги */
    var subtotal = 0;
    for (i = 0; i < items.length; i++) { subtotal += items[i].amount; }

    var minTopUp = 0;
    if (subtotal > 0 && subtotal < PRICE.minNetto) {
      minTopUp = PRICE.minNetto - subtotal;
      items.push({ key: 'minimum', amount: minTopUp });
      subtotal = PRICE.minNetto;
    }

    var rushAmount = 0;
    if (input.rush && subtotal > 0) {
      rushAmount = subtotal * PRICE.rushFactor;
      items.push({ key: 'rush', rate: PRICE.rushFactor, amount: rushAmount });
      subtotal += rushAmount;
    }

    var netto = round(subtotal, 5);
    var vat = netto * PRICE.vat;

    return {
      items: items,
      meters: totalMeters,
      metersText: metersText,
      metersFrame: metersFrame,
      tubes: tubes,
      psu: psu,
      area: areaM2,
      netto: netto,
      vat: vat,
      brutto: round(netto * (1 + PRICE.vat), 5),
      days: input.rush ? PRICE.rushDays : PRICE.baseDays,
      empty: totalMeters <= 0
    };
  }

  /* Формат денег без «красивых» округлений вида 999 zł */
  function money(value, lang) {
    var n = Math.round(value);
    var s = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return s + ' ' + PRICE.currency;
  }

  function meters(value) {
    return (Math.round(value * 100) / 100).toFixed(2);
  }

  global.ZaryaPricing = {
    config: PRICE,
    calc: calc,
    money: money,
    meters: meters
  };
})(window);
