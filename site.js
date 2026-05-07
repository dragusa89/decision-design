// Decision Design — scroll reveal + mobile nav

(function () {
  function initReveal() {
    const els = document.querySelectorAll('.reveal');
    // Progressive enhancement: content is visible by default. We only add the
    // pending state to elements that are below the fold, then animate them in
    // as they enter the viewport. This guarantees nothing is ever stuck hidden.
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const vh = window.innerHeight || document.documentElement.clientHeight;
    els.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top > vh * 0.9) {
        el.classList.add('is-pending');
      }
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.remove('is-pending');
          en.target.classList.add('is-visible');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -5% 0px', threshold: 0 });
    els.forEach(el => {
      if (el.classList.contains('is-pending')) io.observe(el);
    });
  }

  function initMobileNav() {
    const toggle = document.querySelector('.nav__menu-toggle');
    const overlay = document.querySelector('.mobile-nav');
    if (!toggle || !overlay) return;
    toggle.addEventListener('click', () => overlay.classList.add('is-open'));
    overlay.querySelectorAll('[data-close]').forEach(b => {
      b.addEventListener('click', () => overlay.classList.remove('is-open'));
    });
    overlay.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => overlay.classList.remove('is-open'));
    });
  }

  function initBookingForms() {
    document.querySelectorAll('form[data-netlify]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(new FormData(form)).toString()
        })
          .then(function () { form.classList.add('is-sent'); })
          .catch(function () { form.classList.add('is-sent'); });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initReveal();
    initMobileNav();
    initBookingForms();
  });
})();
