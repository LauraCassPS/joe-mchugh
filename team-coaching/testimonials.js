(() => {
  const slider = document.querySelector('.testimonial-slider');
  if (!slider) return;
  const slides = [...slider.querySelectorAll('.testimonial-slide')];
  const controls = slider.querySelector('.slider-controls');
  const count = slider.querySelector('.slider-count');
  let current = 0;
  function show(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => { slide.hidden = i !== current; });
    count.textContent = `${current + 1} / ${slides.length}`;
  }
  function changeSlide(offset) {
    show(current + offset);
    if (!window.matchMedia('(max-width: 760px)').matches) return;

    const author = slides[current].querySelector('.attribution');
    const opening = slides[current].querySelector('.opening');
    const top = author.getBoundingClientRect().top;
    if (top >= 0 && opening.getBoundingClientRect().top + 32 <= window.innerHeight) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollBy({ top: top - 16, behavior: reducedMotion ? 'instant' : 'smooth' });
  }

  controls.hidden = false;
  slider.querySelector('.slider-prev').addEventListener('click', () => changeSlide(-1));
  slider.querySelector('.slider-next').addEventListener('click', () => changeSlide(1));
  show(0);
})();
