// The entire homepage UI enters together as the grey cover wall contracts.
// The cover reel and field movement share one three-second timeline.
const INTRO_MS = 3000;
const CROSSFADE_MS = 300;

export function createOpening({ page, field, motion, selectSlide, onFinish }) {
  const reel = field.querySelector('.opening-reel');
  let generation = 0;
  let frame = 0;
  let finished = false;
  let completionTimer = 0;

  function finish() {
    if (finished) return;
    finished = true;
    ++generation;
    cancelAnimationFrame(frame);
    clearTimeout(completionTimer);
    reel?.remove();
    page.removeAttribute('data-opening');
    page.classList.remove('opening-ui-visible', 'opening-gallery-visible');
    onFinish();
  }

  function play(slides) {
    if (finished || motion.matches || !reel || !slides.length) {
      finish();
      return;
    }

    const token = ++generation;
    const covers = slides.filter((slide) => slide.project.cover);
    if (!covers.length) {
      finish();
      return;
    }

    // Keep the cover already painted by HTML, preventing a blank first frame.
    const initial = reel.querySelector('.opening-reel-image');
    const posters = covers.map((slide, index) => {
      const img = index === 0 && initial ? initial : new Image();
      img.className = 'opening-reel-image' + (index === 0 ? ' is-active' : '');
      img.alt = '';
      img.draggable = false;
      img.decoding = 'async';
      img.loading = 'eager';
      if (index !== 0) img.src = slide.project.cover;
      const setOrientation = () => {
        img.dataset.orientation = img.naturalWidth > img.naturalHeight ? 'wide' : 'portrait';
      };
      if (img.complete && img.naturalWidth) setOrientation();
      else img.addEventListener('load', setOrientation, { once: true });
      return { image: img, slide };
    });
    reel.replaceChildren(...posters.map(({ image }) => image));

    let last = 0;
    let lastValid = posters[0];
    let stageStarted = false;

    function show(index) {
      if (index === last) return;
      const target = posters[index];
      // A slow image response must never blank the reel.
      if (!target.image.complete || !target.image.naturalWidth) return;
      posters[last].image.classList.remove('is-active');
      target.image.classList.add('is-active');
      last = index;
      lastValid = target;
    }

    // Two animation frames ensure browsers register the full-screen starting
    // geometry before interpolating inset to the *normal* gallery geometry.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (finished || generation !== token) return;
      page.classList.add('opening-ui-visible');
      page.dataset.opening = 'shrinking';
      stageStarted = true;
      const started = performance.now();
      const tick = (now) => {
        if (finished || generation !== token) return;
        const elapsed = Math.min(INTRO_MS, now - started);
        const index = Math.min(posters.length - 1, Math.floor(elapsed / INTRO_MS * posters.length));
        show(index);
        if (elapsed < INTRO_MS) {
          frame = requestAnimationFrame(tick);
          return;
        }

        // The gallery has reached its final size; reveal its controls only now.
        selectSlide(lastValid.slide);
        page.dataset.opening = 'settled';
        page.classList.add('opening-gallery-visible');
        completionTimer = setTimeout(() => {
          if (!finished && generation === token) finish();
        }, CROSSFADE_MS + 30);
      };
      frame = requestAnimationFrame(tick);
    }));

    return () => {
      if (!stageStarted) finish();
    };
  }

  return { play, cancel: finish };
}
