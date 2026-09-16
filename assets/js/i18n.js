/* ============================================================================
   ЗАРЯ — переключение языка
   ----------------------------------------------------------------------------
   Два языка, одна разметка. В HTML стоят ключи (data-i18n="hero.lead"),
   тексты лежат в assets/data/lang-*.js.

   Выбор языка запоминается в localStorage и попадает в адрес (?lang=ru),
   чтобы ссылкой можно было поделиться и чтобы поисковик увидел обе версии
   через <link rel="alternate" hreflang>.

   Порядок определения: адрес → сохранённый выбор → язык браузера → польский.
   ============================================================================ */

(function (global) {
  'use strict';

  var STORE_KEY = 'zarya.lang';
  var DEFAULT = 'pl';
  var DICTS = {};
  var current = DEFAULT;

  function register(code, dict) {
    if (dict) { DICTS[code] = dict; }
  }

  /* Достаём значение по пути 'builder.gases.neon' */
  function lookup(dict, path) {
    var parts = path.split('.');
    var node = dict;
    var i;
    for (i = 0; i < parts.length; i++) {
      if (node === null || typeof node !== 'object') { return undefined; }
      node = node[parts[i]];
    }
    return node;
  }

  function t(path, fallback) {
    var v = lookup(DICTS[current], path);
    if (v === undefined && current !== DEFAULT) {
      v = lookup(DICTS[DEFAULT], path);
    }
    return v === undefined ? (fallback !== undefined ? fallback : path) : v;
  }

  /* Подстановка вида «{n} шт.» */
  function fmt(path, vars) {
    var s = t(path);
    if (typeof s !== 'string') { return s; }
    return s.replace(/\{(\w+)\}/g, function (m, key) {
      return Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : m;
    });
  }

  function readStored() {
    try { return localStorage.getItem(STORE_KEY); } catch (e) { return null; }
  }

  function store(code) {
    try { localStorage.setItem(STORE_KEY, code); } catch (e) { /* приватный режим — переживём */ }
  }

  function detect() {
    var url = new URLSearchParams(global.location.search).get('lang');
    if (url && DICTS[url]) { return url; }

    var saved = readStored();
    if (saved && DICTS[saved]) { return saved; }

    /* Языки системы: смотрим весь список из настроек браузера, а не только
       первый. У человека в Польше часто стоит «uk, pl, en» — украинского у
       нас нет, но польский из того же списка ближе, чем запасной английский. */
    var nav = global.navigator;
    var list = (nav.languages && nav.languages.length) ? nav.languages : [nav.language || ''];
    for (var i = 0; i < list.length; i++) {
      var code = String(list[i] || '').slice(0, 2).toLowerCase();
      if (code === 'pl') { return 'pl'; }
      if (code === 'ru' || code === 'uk' || code === 'be') { return 'ru'; }
      if (code === 'en') { return DICTS.en ? 'en' : DEFAULT; }
    }
    /* Всем остальным — английский: он поймётся вернее, чем польский,
       а рынок мастерской всё равно начинается с письма. */
    return DICTS.en ? 'en' : DEFAULT;
  }

  /* --- Применение словаря к странице -------------------------------------- */
  function apply() {
    var dict = DICTS[current];
    if (!dict) { return; }

    document.documentElement.setAttribute('lang', dict.htmlLang || current);

    /* Текстовые узлы */
    var nodes = document.querySelectorAll('[data-i18n]');
    var i, el, value;
    for (i = 0; i < nodes.length; i++) {
      el = nodes[i];
      value = t(el.getAttribute('data-i18n'));
      if (typeof value === 'string') { el.textContent = value; }
    }

    /* Атрибуты: data-i18n-attr="placeholder:builder.placeholder1|aria-label:nav.skip" */
    nodes = document.querySelectorAll('[data-i18n-attr]');
    for (i = 0; i < nodes.length; i++) {
      el = nodes[i];
      el.getAttribute('data-i18n-attr').split('|').forEach(function (pair) {
        var idx = pair.indexOf(':');
        if (idx < 0) { return; }
        var attr = pair.slice(0, idx).trim();
        var key = pair.slice(idx + 1).trim();
        var v = t(key);
        if (typeof v === 'string') { el.setAttribute(attr, v); }
      });
    }

    /* Служебные теги головы */
    setTitle(dict);
    setMeta('description', t('meta.description'));
    setMeta('og:title', t('meta.ogTitle'), true);
    setMeta('og:description', t('meta.ogDescription'), true);
    setMeta('og:locale', current === 'ru' ? 'ru_RU' : 'pl_PL', true);

    /* Кнопка переключения показывает ДРУГОЙ язык, а не текущий */
    /* Три языка сразу видны кнопками: так человек находит свой с одного
       взгляда, вместо того чтобы гадать, что покажет следующий щелчок.
       На кнопке — код, в aria-label — полное название языка. */
    var buttons = document.querySelectorAll('[data-lang]');
    for (var b = 0; b < buttons.length; b++) {
      var code = buttons[b].getAttribute('data-lang');
      var active = code === current;
      buttons[b].setAttribute('aria-pressed', String(active));
      buttons[b].setAttribute('lang', code);
      if (DICTS[code]) { buttons[b].setAttribute('aria-label', DICTS[code].label); }
    }

    var group = document.querySelector('[data-lang-group]');
    if (group) { group.setAttribute('aria-label', t('lang.label')); }

    document.dispatchEvent(new CustomEvent('zarya:lang', { detail: { lang: current } }));
  }

  function setTitle(dict) {
    var page = document.body.getAttribute('data-page-title-key');
    var value = page ? t(page) : (dict.meta && dict.meta.title);
    if (typeof value === 'string') { document.title = value; }
  }

  function setMeta(name, value, isProperty) {
    if (typeof value !== 'string') { return; }
    var sel = isProperty ? 'meta[property="' + name + '"]' : 'meta[name="' + name + '"]';
    var tag = document.head.querySelector(sel);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(isProperty ? 'property' : 'name', name);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', value);
  }

  function set(code, opts) {
    if (!DICTS[code] || code === current) { return; }
    current = code;
    store(code);
    apply();

    if (!opts || opts.updateUrl !== false) {
      try {
        var url = new URL(global.location.href);
        url.searchParams.set('lang', code);
        history.replaceState(null, '', url.toString());
      } catch (e) { /* file:// не даёт трогать историю — не страшно */ }
    }
  }

  function init() {
    register('pl', global.ZARYA_LANG_PL);
    register('ru', global.ZARYA_LANG_RU);
    register('en', global.ZARYA_LANG_EN);
    current = detect();
    apply();

    var buttons = document.querySelectorAll('[data-lang]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function (e) {
        e.preventDefault();
        set(this.getAttribute('data-lang'));
      });
    }
  }

  global.ZaryaI18n = {
    init: init,
    set: set,
    t: t,
    fmt: fmt,
    current: function () { return current; },
    dict: function () { return DICTS[current]; }
  };
})(window);
