'use strict';

(() => {
  const carousel = document.querySelector('.hero-carousel');
  if (!carousel) return;
  const viewport = carousel.querySelector('.carousel-window');
  const track = carousel.querySelector('.photo-triptych');
  const originals = [...track.querySelectorAll('[data-gallery]')];
  if (originals.length < 2) return;
  const count = originals.length;
  const playback = carousel.querySelector('.carousel-playback');
  const status = carousel.querySelector('#carousel-status');
  const lightbox = document.querySelector('#photo-dialog');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let index = count + 1;
  let slideWidth = 0;
  let gap = 4;
  let hovered = false;
  let focused = false;
  let paused = reducedMotion.matches;
  let transitioning = false;
  let dragging = false;
  let pointer = null;
  let autoTimer;
  let transitionTimer;
  let suppressClickUntil = 0;
  let proxyingClick = false;

  function cloneSlide(original, photoIndex) {
    const clone = document.createElement('div');
    clone.className = 'triptych-panel carousel-clone';
    clone.dataset.photoIndex = String(photoIndex);
    clone.setAttribute('aria-hidden', 'true');
    clone.inert = true;
    const photo = original.querySelector('img').cloneNode();
    photo.alt = '';
    photo.removeAttribute('fetchpriority');
    photo.draggable = false;
    clone.append(photo);
    return clone;
  }
  originals.forEach((slide, photoIndex) => {
    slide.dataset.photoIndex = String(photoIndex);
    slide.querySelector('img').draggable = false;
  });
  track.prepend(...originals.map(cloneSlide));
  track.append(...originals.map(cloneSlide));
  const slides = [...track.children];
  carousel.classList.add('is-ready');

  function scheduleAuto() {
    clearTimeout(autoTimer);
    if (paused || hovered || focused || document.hidden || lightbox.open || dragging || transitioning) return;
    autoTimer = setTimeout(() => move(1), 5000);
  }
  function updatePlayback() {
    playback.setAttribute('aria-label', paused ? 'הפעלת התנועה האוטומטית' : 'עצירת התנועה האוטומטית');
    playback.querySelector('span').textContent = paused ? '▶' : 'Ⅱ';
    scheduleAuto();
  }
  function render(animate = false, dragOffset = 0) {
    const offset = viewport.clientWidth / 2 - (index + 0.5) * slideWidth - index * gap;
    track.classList.toggle('is-animating', animate && !reducedMotion.matches);
    track.style.transform = `translate3d(${offset + dragOffset}px, 0, 0)`;
    viewport.scrollLeft = 0;
  }
  function syncTabStops() {
    const frame = viewport.getBoundingClientRect();
    originals.forEach((slide) => {
      const rect = slide.getBoundingClientRect();
      slide.tabIndex = rect.right > frame.left + 1 && rect.left < frame.right - 1 ? 0 : -1;
    });
  }
  function finishTransition() {
    if (!transitioning) return;
    clearTimeout(transitionTimer);
    transitioning = false;
    index = ((index - count) % count + count) % count + count;
    render();
    syncTabStops();
    scheduleAuto();
  }
  function move(direction, announce = false) {
    if (transitioning) return;
    clearTimeout(autoTimer);
    transitioning = true;
    originals.forEach((slide) => { slide.tabIndex = -1; });
    index += direction;
    render(true);
    const photoIndex = ((index - count) % count + count) % count;
    if (announce) status.textContent = `${originals[photoIndex].querySelector('img').alt} · ${photoIndex + 1} / ${count}`;
    if (reducedMotion.matches) finishTransition();
    else transitionTimer = setTimeout(finishTransition, 750);
  }
  function measure() {
    clearTimeout(transitionTimer);
    transitioning = false;
    index = ((index - count) % count + count) % count + count;
    slideWidth = originals[0].getBoundingClientRect().width;
    gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    render();
    syncTabStops();
    scheduleAuto();
  }

  carousel.querySelector('.carousel-next').addEventListener('click', () => move(1, true));
  carousel.querySelector('.carousel-previous').addEventListener('click', () => move(-1, true));
  playback.addEventListener('click', () => { paused = !paused; updatePlayback(); });
  viewport.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    move(event.key === 'ArrowRight' ? 1 : -1, true);
  });
  track.addEventListener('transitionend', (event) => {
    if (event.target === track && event.propertyName === 'transform') finishTransition();
  });
  carousel.addEventListener('pointerenter', (event) => {
    if (event.pointerType !== 'touch') { hovered = true; scheduleAuto(); }
  });
  carousel.addEventListener('pointerleave', (event) => {
    if (event.pointerType !== 'touch') { hovered = false; scheduleAuto(); }
  });
  carousel.addEventListener('focusin', () => { focused = true; scheduleAuto(); });
  carousel.addEventListener('focusout', (event) => { focused = carousel.contains(event.relatedTarget); scheduleAuto(); });
  originals.forEach((slide, photoIndex) => slide.addEventListener('focus', () => {
    viewport.scrollLeft = 0;
    const frame = viewport.getBoundingClientRect();
    const rect = slide.getBoundingClientRect();
    if (rect.right <= frame.left || rect.left >= frame.right) {
      clearTimeout(transitionTimer);
      transitioning = false;
      index = count + photoIndex;
      render();
      syncTabStops();
    }
  }));
  document.addEventListener('visibilitychange', scheduleAuto);
  new MutationObserver(scheduleAuto).observe(lightbox, { attributes: true, attributeFilter: ['open'] });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) paused = true;
    finishTransition();
    updatePlayback();
  });

  viewport.addEventListener('dragstart', (event) => event.preventDefault());
  viewport.addEventListener('pointerdown', (event) => {
    if (event.isPrimary === false || event.button !== 0 || transitioning) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, distance: 0 };
    clearTimeout(autoTimer);
  });
  viewport.addEventListener('pointermove', (event) => {
    if (!pointer || event.pointerId !== pointer.id) return;
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    if (!dragging && Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { pointer = null; scheduleAuto(); return; }
    if (!dragging && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) {
      dragging = true;
      viewport.setPointerCapture(event.pointerId);
      viewport.classList.add('is-dragging');
    }
    if (!dragging) return;
    event.preventDefault();
    pointer.distance = Math.max(-slideWidth, Math.min(slideWidth, dx));
    render(false, pointer.distance);
  });
  function endPointer(event, cancelled = false) {
    if (!pointer || event.pointerId !== pointer.id) return;
    const distance = pointer.distance;
    const wasDragging = dragging;
    pointer = null;
    dragging = false;
    viewport.classList.remove('is-dragging');
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    if (wasDragging) {
      suppressClickUntil = performance.now() + 350;
      const direction = !cancelled && Math.abs(distance) > Math.min(70, slideWidth * 0.15) ? (distance < 0 ? 1 : -1) : 0;
      move(direction, direction !== 0);
    } else scheduleAuto();
  }
  viewport.addEventListener('pointerup', (event) => endPointer(event));
  viewport.addEventListener('pointercancel', (event) => endPointer(event, true));
  viewport.addEventListener('click', (event) => {
    if (proxyingClick) return;
    if (performance.now() < suppressClickUntil) { event.preventDefault(); event.stopPropagation(); return; }
    if (event.target.closest('[data-gallery]')) return;
    const clone = slides.find((slide) => {
      if (!slide.classList.contains('carousel-clone')) return false;
      const rect = slide.getBoundingClientRect();
      return event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    });
    if (!clone) return;
    event.preventDefault();
    event.stopPropagation();
    proxyingClick = true;
    originals[Number(clone.dataset.photoIndex)].click();
    proxyingClick = false;
  }, true);

  new ResizeObserver(measure).observe(viewport);
  measure();
  updatePlayback();
})();
