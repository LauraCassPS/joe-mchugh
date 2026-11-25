(() => {
  const button = document.querySelector('.back-to-top');
  const top = document.getElementById('top');
  if (!button || !top) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let pastThreshold = false;
  function update() {
    button.hidden = !pastThreshold && document.activeElement !== button;
  }

  if ('IntersectionObserver' in window) {
    // The observer also reports the initial position on a restored or deep-linked page.
    const marker = document.createElement('span');
    marker.setAttribute('aria-hidden', 'true');
    marker.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:1px;pointer-events:none';
    document.body.prepend(marker);
    new IntersectionObserver(([entry]) => {
      pastThreshold = !entry.isIntersecting;
      update();
    }, { rootMargin: '299px 0px 0px' }).observe(marker);
  } else {
    const onScroll = () => {
      pastThreshold = window.scrollY >= 300;
      update();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
  button.addEventListener('blur', update);
  button.addEventListener('click', () => {
    if (!top.hasAttribute('tabindex')) top.setAttribute('tabindex', '-1');
    top.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  });
})();
