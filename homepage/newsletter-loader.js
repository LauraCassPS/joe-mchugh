(() => {
  const form = document.querySelector('.newsletter-editorial form[data-sv-form]');
  if (!form) return;

  let observer;
  let started = false;
  function loadKit() {
    if (started) return;
    started = true;
    observer?.disconnect();
    const script = document.createElement('script');
    script.src = 'https://f.convertkit.com/ckjs/ck.5.js';
    document.head.append(script);
  }

  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) loadKit();
    }, { rootMargin: '800px 0px' });
    observer.observe(form);
    form.addEventListener('focusin', loadKit, { once: true });
    document.querySelector('.newsletter-nav')?.addEventListener('click', loadKit, { once: true });
  } else {
    loadKit();
  }
})();
