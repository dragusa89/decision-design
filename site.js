// Decision Design — language toggle + scroll reveal + mobile nav

(function () {
  const STORAGE_KEY = 'dd-lang';

  function setLang(lang) {
    if (lang !== 'en' && lang !== 'hu') lang = 'en';
    document.documentElement.lang = lang;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    document.querySelectorAll('.nav__lang button, .mobile-nav__lang button').forEach(b => {
      b.classList.toggle('is-active', b.dataset.set === lang);
    });
  }

  function initLang() {
    let stored;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    setLang(stored || document.documentElement.lang || 'en');
    document.querySelectorAll('.nav__lang button, .mobile-nav__lang button').forEach(b => {
      b.addEventListener('click', () => setLang(b.dataset.set));
    });
  }

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

  document.addEventListener('DOMContentLoaded', () => {
    initLang();
    initReveal();
    initMobileNav();
  });
})();
