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
  controls.hidden = false;
  slider.querySelector('.slider-prev').addEventListener('click', () => show(current - 1));
  slider.querySelector('.slider-next').addEventListener('click', () => show(current + 1));
  show(0);
})();
