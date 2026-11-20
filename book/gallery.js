(() => {
  const track = document.querySelector('.launch-track');
  if (!track) return;
  const slides = [...track.querySelectorAll('.launch-slide')];
  const controls = document.querySelector('.gallery-controls');
  const previous = controls.querySelector('.gallery-prev');
  const next = controls.querySelector('.gallery-next');
  const count = controls.querySelector('.gallery-count');
  let current = 0;
  const update = () => {
    const step = slides[1].offsetLeft - slides[0].offsetLeft;
    const max = Math.max(0, track.scrollWidth - track.clientWidth);
    current = Math.round(track.scrollLeft / step);
    controls.hidden = max < 2;
    previous.disabled = track.scrollLeft < 2;
    next.disabled = track.scrollLeft >= max - 2;
    const end = Math.min(slides.length, Math.ceil((track.scrollLeft + track.clientWidth - 1) / step));
    count.textContent = track.clientWidth >= 650 && end > current + 1 ? `${current + 1}–${end} of ${slides.length}` : `${current + 1} of ${slides.length}`;
  };
  const move = direction => {
    const step = slides[1].offsetLeft - slides[0].offsetLeft;
    track.scrollTo({left: track.scrollLeft + direction * step, behavior: 'instant'});
    update();
  };
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  track.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1);
  });
  track.addEventListener('scroll', update, {passive:true});
  new ResizeObserver(update).observe(track);
  update();
})();
