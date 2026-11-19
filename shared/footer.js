(() => {
  const button = document.querySelector('.back-to-top');
  const top = document.getElementById('top');
  if (!button || !top) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const update = () => { button.hidden = window.scrollY < 300 && document.activeElement !== button; };
  window.addEventListener('scroll', update, { passive: true });
  button.addEventListener('blur', update);
  button.addEventListener('click', () => {
    if (!top.hasAttribute('tabindex')) top.setAttribute('tabindex', '-1');
    top.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    update();
  });
  update();
})();
