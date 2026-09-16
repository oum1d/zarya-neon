/* ============================================================================
   ЗАРЯ — форма заявки
   ----------------------------------------------------------------------------
   Клиентская валидация нужна для удобства, а не для безопасности: она
   объясняет ошибку раньше, чем человек нажмёт «отправить». Настоящая
   проверка обязана стоять на сервере — об этом написано в README.

   Отдельно: форма НЕ делает вид, что письмо ушло. Пока не подключён
   обработчик, она честно говорит об этом и предлагает почту. Фальшивый
   экран «спасибо» — это потерянные заявки и обманутый клиент.
   ============================================================================ */

(function (global) {
  'use strict';

  var T = global.ZaryaI18n;

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
  var PHONE_RE = /^[+\d][\d\s().-]{7,}$/;

  function init() {
    var form = document.getElementById('order-form');
    if (!form) { return; }

    var startedAt = Date.now();
    var status = document.getElementById('order-status');
    var submitBtn = form.querySelector('[type="submit"]');

    var fields = [
      {
        el: document.getElementById('order-name'),
        err: document.getElementById('order-name-error'),
        check: function (v) { return v.trim().length >= 2 ? null : 'order.errName'; }
      },
      {
        el: document.getElementById('order-contact'),
        err: document.getElementById('order-contact-error'),
        check: function (v) {
          var s = v.trim();
          if (!s) { return 'order.errContact'; }
          if (s.indexOf('@') !== -1) {
            return EMAIL_RE.test(s) ? null : 'order.errContactFormat';
          }
          return PHONE_RE.test(s) ? null : 'order.errContactFormat';
        }
      },
      {
        el: document.getElementById('order-consent'),
        err: document.getElementById('order-consent-error'),
        check: function (v, el) { return el.checked ? null : 'order.errConsent'; }
      }
    ].filter(function (f) { return f.el; });

    function showError(field, key) {
      field.el.setAttribute('aria-invalid', 'true');
      if (field.err) {
        field.err.textContent = T.t(key);
        field.err.hidden = false;
      }
    }

    function clearError(field) {
      field.el.removeAttribute('aria-invalid');
      if (field.err) {
        field.err.textContent = '';
        field.err.hidden = true;
      }
    }

    function validate(field) {
      var key = field.check(field.el.value || '', field.el);
      if (key) { showError(field, key); } else { clearError(field); }
      return !key;
    }

    fields.forEach(function (field) {
      field.el.addEventListener('blur', function () { validate(field); });
      field.el.addEventListener('input', function () {
        if (field.el.getAttribute('aria-invalid') === 'true') { validate(field); }
      });
      field.el.addEventListener('change', function () {
        if (field.el.type === 'checkbox') { validate(field); }
      });
    });

    function setStatus(kind, title, text, extraNode) {
      if (!status) { return; }
      while (status.firstChild) { status.removeChild(status.firstChild); }
      status.hidden = false;
      status.className = 'form-status form-status--' + kind;

      var h = document.createElement('strong');
      h.className = 'form-status__t';
      h.textContent = title;
      status.appendChild(h);

      if (text) {
        var p = document.createElement('p');
        p.className = 'form-status__d';
        p.textContent = text;
        status.appendChild(p);
      }
      if (extraNode) { status.appendChild(extraNode); }
    }

    /* Письмо руками: единственный честный путь, пока нет сервера */
    function mailtoNode() {
      var wrap = document.createElement('p');
      wrap.className = 'form-status__d';

      var a = document.createElement('a');
      a.className = 'link';
      var to = (T.t('contact.email') || '').trim();
      var subject = 'ZARYA — ' + (T.t('order.kicker') || 'zapytanie');

      var body = [
        (document.getElementById('order-name') || {}).value || '',
        (document.getElementById('order-contact') || {}).value || '',
        (document.getElementById('order-city') || {}).value || '',
        '',
        (document.getElementById('order-message') || {}).value || '',
        '',
        (document.getElementById('order-spec') || {}).value || ''
      ].join('\n');

      a.href = 'mailto:' + encodeURIComponent(to) +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);
      a.textContent = to;
      wrap.appendChild(a);
      return wrap;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      /* Ловушка для ботов: живой человек этого поля не видит */
      var trap = document.getElementById('order-company');
      if (trap && trap.value) { return; }

      /* Форма, заполненная за секунду, — почти наверняка скрипт */
      var tooFast = (Date.now() - startedAt) < 1500;

      var ok = true;
      var firstBad = null;
      fields.forEach(function (field) {
        if (!validate(field) && ok) { ok = false; firstBad = field; }
        else if (!validate(field) && !firstBad) { firstBad = field; }
      });

      if (!ok) {
        setStatus('error', T.t('order.errSummary'), '');
        if (firstBad) { firstBad.el.focus(); }
        return;
      }
      if (tooFast) { return; }

      var endpoint = (form.getAttribute('data-endpoint') || '').trim();

      if (!endpoint) {
        setStatus('warn', T.t('order.noBackend'), T.t('order.noBackendHint'), mailtoNode());
        status.focus({ preventScroll: true });
        return;
      }

      submitBtn.disabled = true;
      submitBtn.setAttribute('data-label', submitBtn.textContent);
      submitBtn.textContent = T.t('order.sending');

      var payload = {
        name: document.getElementById('order-name').value.trim(),
        contact: document.getElementById('order-contact').value.trim(),
        city: (document.getElementById('order-city') || {}).value || '',
        message: (document.getElementById('order-message') || {}).value || '',
        spec: (document.getElementById('order-spec') || {}).value || '',
        lang: T.current()
      };

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (res) {
        if (!res.ok) { throw new Error('HTTP ' + res.status); }
        global.location.href = 'thanks.html?lang=' + T.current();
      }).catch(function () {
        /* Наружу — только человеческий текст. Никаких кодов и стека:
           они полезны атакующему и бесполезны клиенту. */
        setStatus('error', T.t('order.noBackend'), T.t('order.noBackendHint'), mailtoNode());
        submitBtn.disabled = false;
        submitBtn.textContent = submitBtn.getAttribute('data-label') || T.t('order.submit');
      });
    });
  }

  global.ZaryaForms = { init: init };
})(window);
