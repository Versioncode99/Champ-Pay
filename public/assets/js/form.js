/* ==========================================================================
   ChampPay — contact form
   Client-side validation, then POST to the Pages Function at /api/contact.
   Errors name the problem and the recovery.
   ========================================================================== */
(function () {
  'use strict';

  var form = document.getElementById('contactForm');
  if (!form) return;

  var statusEl = document.getElementById('formStatus');
  var btn = document.getElementById('submitBtn');
  var label = document.getElementById('submitLabel');

  /* Deep links from Careers pre-select the correct route without duplicating
     the form or creating a second delivery path. */
  var requested = new URLSearchParams(window.location.search).get('for');
  if (requested === 'candidate') {
    var capacity = form.querySelector('[name="capacity"]');
    var message = form.querySelector('[name="message"]');
    if (capacity) capacity.value = 'A candidate';
    if (message) message.placeholder = 'Link to your CV or portfolio, name the role or discipline, and tell us what you are unusually good at.';
  }

  var RULES = {
    name: function (v) { return v.trim().length >= 2 || 'Enter your name'; },
    email: function (v) {
      if (!v.trim()) return 'Enter your work email';
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'That email address is not complete';
    },
    company: function (v) { return v.trim().length >= 2 || 'Enter your company'; },
    capacity: function (v) { return !!v || 'Choose the option that fits you best'; },
    message: function (v) { return v.trim().length >= 20 || 'A little more detail helps: 20 characters or more'; }
  };

  function setError(name, msg) {
    var field = form.querySelector('[name="' + name + '"]');
    if (!field) return;
    var wrap = field.closest('.field');
    var err = form.querySelector('[data-err-for="' + name + '"]');
    if (msg) {
      wrap.setAttribute('data-invalid', 'true');
      field.setAttribute('aria-invalid', 'true');
      if (err) err.textContent = msg;
    } else {
      wrap.removeAttribute('data-invalid');
      field.removeAttribute('aria-invalid');
      if (err) err.textContent = '';
    }
  }

  function validate() {
    var ok = true;
    var firstBad = null;
    Object.keys(RULES).forEach(function (name) {
      var field = form.querySelector('[name="' + name + '"]');
      var res = RULES[name](field ? field.value : '');
      if (res !== true) {
        setError(name, res);
        ok = false;
        if (!firstBad) firstBad = field;
      } else {
        setError(name, null);
      }
    });
    if (firstBad) firstBad.focus();
    return ok;
  }

  // Clear an error as soon as the visitor fixes it.
  Object.keys(RULES).forEach(function (name) {
    var field = form.querySelector('[name="' + name + '"]');
    if (!field) return;
    field.addEventListener('input', function () {
      if (field.closest('.field').getAttribute('data-invalid') === 'true') {
        if (RULES[name](field.value) === true) setError(name, null);
      }
    });
  });

  function showStatus(kind, msg) {
    statusEl.className = 'form__status is-shown form__status--' + kind;
    statusEl.textContent = msg;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    statusEl.className = 'form__status';
    if (!validate()) return;

    var data = Object.fromEntries(new FormData(form).entries());

    btn.disabled = true;
    btn.style.opacity = '.6';
    label.textContent = 'Sending…';

    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (body) {
          return { ok: res.ok, body: body };
        });
      })
      .then(function (r) {
        if (r.ok) {
          form.reset();
          showStatus('ok', 'Message sent. You will get a reply from someone who can actually answer, usually within two business days.');
          label.textContent = 'Sent';
          setTimeout(function () {
            btn.disabled = false;
            btn.style.opacity = '';
            label.textContent = 'Send message';
          }, 4000);
        } else {
          throw new Error((r.body && r.body.error) || 'Send failed');
        }
      })
      .catch(function () {
        showStatus('err', 'That did not send. Please try again shortly, or email contact@champ-pay.com.');
        btn.disabled = false;
        btn.style.opacity = '';
        label.textContent = 'Send message';
      });
  });
})();
