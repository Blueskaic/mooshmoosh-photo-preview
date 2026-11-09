(() => {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches || !('IntersectionObserver' in window)) return;

  const elements = [...document.querySelectorAll('[data-reveal], .photo-link:not(.triptych-panel)')];
  const started = new WeakSet();

  async function reveal(element, delay = 0) {
    if (started.has(element)) return;
    started.add(element);
    observer.unobserve(element);
    const image = element.querySelector('img');

    // Native lazy loading fetches nearby images; reveal only once pixels are ready.
    if (image && !image.complete) {
      await new Promise((resolve) => {
        const finish = () => {
          image.removeEventListener('load', finish);
          image.removeEventListener('error', finish);
          resolve();
        };
        image.addEventListener('load', finish);
        image.addEventListener('error', finish);
      });
    }
    if (image) {
      try { await image.decode(); } catch { /* Keep the link and alt text available on failure. */ }
    }
    element.style.setProperty('--reveal-delay', `${delay}ms`);
    element.classList.add('is-revealed');
  }

  const observer = new IntersectionObserver((entries) => {
    entries.filter((entry) => entry.isIntersecting).forEach((entry, index) => {
      reveal(entry.target, Math.min(index, 2) * 90);
    });
  }, { rootMargin: '0px 0px -32px 0px', threshold: 0 });

  for (const element of elements) {
    element.classList.add(element.hasAttribute('data-reveal') ? 'text-reveal' : 'photo-reveal');
    observer.observe(element);
    element.addEventListener('focusin', () => {
      started.add(element);
      observer.unobserve(element);
      element.classList.add('is-revealed');
    }, { once: true });
  }

  motion.addEventListener('change', () => {
    if (!motion.matches) return;
    observer.disconnect();
    elements.forEach((element) => element.classList.add('is-revealed'));
  });
})();
