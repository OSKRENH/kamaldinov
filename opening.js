// The grey gallery, cover reel and editorial entrance share a 3-second timeline.
const INTRO_MS = 3000;
const CROSSFADE_MS = 300;
const REVEALS = [
  ['opening-show-given', 0],
  ['opening-show-family', 420],
  ['opening-show-cv', 870],
  ['opening-show-description', 1430],
  ['opening-show-navigation', 2050],
];

export function createOpening({ page, field, motion, selectSlide, onLanding, onFinish }) {
  const reel = field.querySelector('.opening-reel');
  let generation = 0;
  let frame = 0;
  let completionTimer = 0;
  let finished = false;

  function finish() {
    if (finished) return;
    finished = true;
    ++generation;
    cancelAnimationFrame(frame);
    clearTimeout(completionTimer);
    reel?.remove();
    page.removeAttribute('data-opening');
    page.classList.remove(...REVEALS.map(([className]) => className), 'opening-gallery-visible');
    onFinish();
  }

  async function play(slides) {
    if (finished || motion.matches || !reel || !slides.length) {
      finish();
      return;
    }

    const token = ++generation;
    // Both the cover reel and gallery receive the same randomized slide array.
    const covers = slides.filter(({ project }) => project.cover);
    if (!covers.length) {
      finish();
      return;
    }

    const posters = covers.map((slide) => {
      const image = new Image();
      image.className = 'opening-reel-image';
      image.alt = '';
      image.draggable = false;
      image.decoding = 'async';
      image.loading = 'eager';
      image.src = slide.project.cover;
      if (slide.element.dataset.feature === 'popolam') image.dataset.feature = 'popolam';
      if (slide.element.dataset.feature === 'ai') image.dataset.feature = 'ai';
      return { image, slide };
    });

    // Decode each frame before the 3-second reel to avoid skipped covers.
    await Promise.all(posters.map(async ({ image }) => {
      try { await image.decode(); } catch { /* A missing cover must not block the site. */ }
      if (image.naturalWidth) {
        const ratio = image.naturalHeight / image.naturalWidth;
        image.dataset.orientation = ratio >= 1.8 ? 'infographic'
          : ratio < 1 ? 'wide' : 'portrait';
      }
    }));
    if (finished || generation !== token) return;

    const ready = posters.filter(({ image }) => image.naturalWidth > 0);
    if (!ready.length) {
      finish();
      return;
    }

    const interval = INTRO_MS / ready.length;
    ready[0].image.classList.add('is-active');
    reel.replaceChildren(...ready.map(({ image }) => image));
    let current = 0;

    function show(index) {
      if (current === index) return;
      ready[current].image.classList.remove('is-active');
      ready[index].image.classList.add('is-active');
      current = index;
    }

    // Ensure the fullscreen initial geometry is painted before shrinking.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (finished || generation !== token) return;

      page.dataset.opening = 'shrinking';
      const start = performance.now();

      function tick(now) {
        if (finished || generation !== token) return;
        const elapsed = Math.min(INTRO_MS, now - start);

        for (const [className, at] of REVEALS) {
          if (elapsed >= at) page.classList.add(className);
        }

        const targetIndex = Math.min(ready.length - 1, Math.floor(elapsed / interval));
        if (targetIndex !== current) show(targetIndex);

        if (elapsed < INTRO_MS) {
          frame = requestAnimationFrame(tick);
          return;
        }

        // The last visible frame becomes the first normal gallery cover.
        selectSlide(ready[current].slide);
        onLanding(ready[current].slide);
        page.dataset.opening = 'settled';
        page.classList.add('opening-gallery-visible');
        completionTimer = setTimeout(() => {
          if (!finished && generation === token) finish();
        }, CROSSFADE_MS + 40);
      }
      frame = requestAnimationFrame(tick);
    }));
  }

  return { play, cancel: finish };
}
