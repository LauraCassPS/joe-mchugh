(() => {
  const root = document.querySelector('.book-extract');
  const stage = root.querySelector('.stage');
  const cover = stage.querySelector('.closed');
  const spreads = Array.from(stage.querySelectorAll('.spread'));
  const allLeaves = Array.from(stage.querySelectorAll('.leaf'));
  const controls = root.querySelector('.reader-controls');
  const [prev, next] = controls.querySelectorAll('button');
  const status = controls.querySelector('[role="status"]');
  const intro = root.querySelector('.reader-intro');
  const mobile = matchMedia('(max-width:700px)');
  const reducedMotion = matchMedia('(prefers-reduced-motion:reduce)');
  let spread = spreads[0];
  let leaves = Array.from(spread.children);
  let page = 0;
  let activeTurn = null;

  function lastPage() {
    return mobile.matches ? allLeaves.length : allLeaves.length - 1;
  }

  function render() {
    const extract = Math.floor((page - 1) / 2);
    cover.hidden = page > 0;
    spreads.forEach((item, index) => { item.hidden = index !== extract; });
    prev.disabled = page === 0;
    prev.textContent = page === 1 ? '← Close book' : '← Previous';
    next.disabled = page === lastPage();
    next.textContent = page ? 'Turn page →' : 'Open book →';
    intro.firstElementChild.setAttribute('aria-hidden', String(page > 0));
    intro.lastElementChild.setAttribute('aria-hidden', String(page === 0));
    status.textContent = !page ? 'Book cover' : mobile.matches
      ? `Page ${page} of ${allLeaves.length}` : `Extract ${extract + 1} of ${spreads.length}`;
    if (!page) return;

    spread = spreads[extract];
    leaves = Array.from(spread.querySelectorAll(':scope > .leaf'));
    leaves.forEach((leaf, side) => {
      leaf.hidden = mobile.matches && side !== (page - 1) % 2;
      leaf.querySelector('.foot').textContent = mobile.matches ? String(extract * 2 + side + 1)
        : side === 0 ? `Extract 0${extract + 1}` : '• • •';
      const corner = leaf.querySelector('.corner');
      corner.hidden = mobile.matches;
      corner.disabled = side === 1 && next.disabled;
      if (!side) corner.setAttribute('aria-label', page === 1 ? 'Close book' : 'Previous extract');
    });
  }

  function restoreFocus(previous) {
    if (document.activeElement !== previous && document.activeElement !== document.body) return;
    if (!page && root.contains(previous)) cover.focus({preventScroll:true});
    else if (previous === cover || previous.closest('.corner') || previous.disabled)
      (next.disabled ? prev : next).focus({preventScroll:true});
  }

  // Copies paint the two faces of one sheet while the real pages stay readable.
  function copyPage(leaf) {
    const copy = leaf.cloneNode(true);
    copy.hidden = false;
    for (const node of [copy, ...copy.querySelectorAll('[id]')]) node.removeAttribute('id');
    copy.removeAttribute('aria-labelledby');
    copy.inert = true;
    copy.setAttribute('aria-hidden', 'true');
    return copy;
  }

  function sizePages() {
    const measure = document.createElement('div');
    measure.className = 'measure';
    measure.inert = true;
    measure.setAttribute('aria-hidden', 'true');
    measure.style.width = stage.clientWidth / (mobile.matches ? 1 : 2) + 'px';
    measure.append(...allLeaves.map(copyPage));
    stage.append(measure);
    const jacketHeight = Math.ceil(measure.offsetWidth * 640 / 427);
    const height = Math.max(jacketHeight, ...Array.from(measure.children, item => item.offsetHeight));
    stage.style.setProperty('--page-height', height + 'px');
    measure.remove();
  }

  function coverArt() {
    const image = cover.querySelector('img').cloneNode();
    image.className = 'jacket';
    image.alt = '';
    return image;
  }

  function makeLayer() {
    const layer = document.createElement('div');
    layer.className = 'turn-layer';
    layer.setAttribute('aria-hidden', 'true');
    layer.inert = true;
    spread.append(layer);
    return layer;
  }

  function turnSheet(layer, side, front, back, animations, timing, keys) {
    const sheet = document.createElement('div');
    sheet.className = 'turn-sheet from-' + side;
    front.querySelector('.ribbon')?.remove();
    front.classList.add('face');
    sheet.append(front);
    if (back) {
      back.querySelector('.ribbon')?.remove();
      back.classList.add('face', 'verso');
      sheet.append(back);
    }
    layer.append(sheet);
    animations.push(sheet.animate(keys, timing));
  }

  function turnPages(direction, outgoing, layer, animations) {
    const forward = direction > 0;
    const side = forward ? 'right' : 'left';
    const start = mobile.matches ? 0 : (forward ? 1 : 0);
    const landing = forward ? 0 : 1;
    if (!mobile.matches) {
      const stationary = outgoing[landing];
      stationary.classList.add('stationary');
      layer.append(stationary);
    }
    turnSheet(layer, side, outgoing[start], mobile.matches ? null : copyPage(leaves[landing]),
      animations, {duration:1000, easing:'ease-in-out', fill:'both'}, [
        {transform:'rotateY(0deg)'},
        {transform:'rotateY(' + (-direction * (mobile.matches ? 95 : 180)) + 'deg)'}
      ]);
  }

  function turnCover(opening, layer, animations) {
    const timing = {duration:850, easing:'ease-in-out', fill:'both', direction:opening ? 'normal' : 'reverse'};
    // Centre the single closed leaf and the two-page spread without resizing either.
    if (!mobile.matches) {
      animations.push(spread.animate([
        {transform:'translateX(-25%)'}, {transform:'translateX(0%)'}
      ], timing));
    }
    if (mobile.matches && !opening) {
      const jacket = coverArt();
      jacket.classList.add('stationary');
      layer.append(jacket);
      turnSheet(layer, 'left', copyPage(leaves[0]), null, animations, {...timing,direction:'normal'}, [
        {transform:'rotateY(0deg)'}, {transform:'rotateY(95deg)'}
      ]);
    } else {
      const inside = mobile.matches ? null : copyPage(leaves[0]);
      if (inside) leaves[0].style.visibility = 'hidden';
      turnSheet(layer, 'right', coverArt(), inside, animations, timing, [
        {transform:'rotateY(0deg)'},
        {transform:'rotateY(' + (mobile.matches ? -95 : -180) + 'deg)'}
      ]);
    }
  }

  function step(direction) {
    if (activeTurn) return;
    const from = page;
    const destination = from === 0 && direction > 0 ? 1 :
      Math.min(lastPage(), Math.max(0, from + direction * (mobile.matches ? 1 : 2)));
    if (from === destination) return;
    const previousFocus = document.activeElement;
    const animate = !reducedMotion.matches && typeof spread.animate === 'function';
    const coverTurn = from === 0 || destination === 0;
    const outgoing = animate && !coverTurn ? leaves.filter(leaf => !leaf.hidden).map(copyPage) : [];
    page = destination;
    if (page || !animate) render();
    if (!animate) {
      restoreFocus(previousFocus);
      return;
    }

    const layer = makeLayer();
    const animations = [];
    if (coverTurn) turnCover(from === 0, layer, animations);
    else turnPages(direction, outgoing, layer, animations);
    function finish() {
      if (activeTurn !== finish) return;
      activeTurn = null;
      animations.forEach(animation => animation.cancel());
      layer.remove();
      leaves[0].style.visibility = '';
      if (!page) render();
      restoreFocus(previousFocus);
    }
    activeTurn = finish;
    Promise.allSettled(animations.map(animation => animation.finished)).then(finish);
  }

  root.addEventListener('click', event => {
    const button = event.target.closest('button[data-turn]');
    if (button && !button.disabled) step(Number(button.dataset.turn));
  });
  root.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.altKey || event.metaKey || event.ctrlKey || event.shiftKey) return;
    if (event.key === 'ArrowRight' && page < lastPage() || event.key === 'ArrowLeft' && page > 0) {
      event.preventDefault();
      if (!event.repeat) step(event.key === 'ArrowRight' ? 1 : -1);
    }
  });
  mobile.addEventListener('change', () => {
    activeTurn?.();
    if (!mobile.matches && page > 0 && page % 2 === 0) page--;
    render();
  });
  window.addEventListener('resize', () => { activeTurn?.(); sizePages(); });
  sizePages();
  render();
  controls.hidden = false;
  document.fonts.load('32px "Old Standard TT"').then(sizePages);
  reducedMotion.addEventListener('change', () => activeTurn?.());

  let touchStart;
  stage.addEventListener('touchstart', event => {
    touchStart = event.touches.length === 1 ? event.touches[0] : null;
  }, {passive:true});
  stage.addEventListener('touchcancel', () => { touchStart = null; }, {passive:true});
  stage.addEventListener('touchend', event => {
    if (!touchStart) return;
    const dx = event.changedTouches[0].clientX - touchStart.clientX;
    const dy = event.changedTouches[0].clientY - touchStart.clientY;
    touchStart = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
  }, {passive:true});
})();
