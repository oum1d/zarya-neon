/* ============================================================================
   ЗАРЯ — точка входа
   ----------------------------------------------------------------------------
   Порядок важен: сначала язык (иначе секции соберутся из пустых ключей),
   потом контент, потом интерфейс и конструктор.
   ============================================================================ */

(function (global) {
  'use strict';

  function boot() {
    global.ZaryaI18n.init();

    if (global.ZaryaContent) { global.ZaryaContent.renderAll(); }
    if (global.ZaryaUI) { global.ZaryaUI.init(); }
    if (global.ZaryaBuilder) { global.ZaryaBuilder.init(); }
    if (global.ZaryaForms) { global.ZaryaForms.init(); }

    /* Смена языка перебирает динамические секции заново */
    document.addEventListener('zarya:lang', function () {
      if (global.ZaryaContent) { global.ZaryaContent.renderAll(); }
    });

    document.documentElement.classList.add('is-ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window);
