// Editorial entrance and shuffled cover reel share a single three-second timeline.
const INTRO_MS = 3000;
const CROSSFADE_MS = 300;

// The five content groups appear consecutively, but all finish within the
// same three seconds as the grey cover field's full-screen contraction.
const REVEALS = [
  ['opening-show-given', 0],
  ['opening-show-family', 420],
  ['opening-show-cv', 870],
  ['opening-show-description', 1430],
  ['opening-show-navigation', 2050],
];

export function createOpening({ page, field, motion, selectSlide, onFinish }) {
  const reel = field.querySelector('.opening-reel');
  let generation = 0;
  let frame = 0;
  let completionTimer = 0;
  let finished = false;

  function finish() {
    if (finished) return;
    finished = true;
    generation++;
    cancelAnimationFrame(frame);
    clearTimeout(completionTimer);
    reel?.remove();
    page.removeAttribute('data-opening');
    page.classList.remove(...REVEALS.map(([name]) => name), 'opening-gallery-visible');
    onFinish();
  }

  function play(slides) {
    if (finished || motion.matches || !reel || !slides.length) {
      finish();
      return;
    }
    const token = ++generation;
    // Slides were shuffled once on page load and are also used by the main
    // carousel. Thus the intro's final frame is exactly its first gallery view.
    const covers = slides.filter(({ project }) => project.cover);
    if (!covers.length) {
      finish();
      return;
    }

    const posters = covers.map((slide, index) => {
      const image = new Image();
      image.className = 'opening-reel-image' + (index === 0 ? ' is-active' : '');
      image.alt = '';
      image.draggable = false;
      image.decoding = 'async';
      image.loading = 'eager';
      image.src = slide.project.cover;
      const orient = () => {
        image.dataset.orientation = image.naturalWidth > image.naturalHeight ? 'wide' : 'portrait';
      };
      if (image.complete && image.naturalWidth) orient();
      else image.addEventListener('load', orient, { once: true });
      return { image, slide };
    });
    reel.replaceChildren(...posters.map(({ image }) => image));

    let current = 0;
    let lastVisible = posters[0];
    function show(index) {
      if (index === current) return;
      const poster = posters[index];
      // Never replace a loaded cover with an empty/loading image.
      if (!poster.image.complete || !poster.image.naturalWidth) return;
      posters[current].image.classList.remove('is-active');
      poster.image.classList.add('is-active');
      current = index;
      lastVisible = poster;
    }

    // Preserve the full-screen first paint so CSS can interpolate its inset.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (finished || token !== generation) return;
      page.dataset.opening = 'shrinking';
      const start = performance.now();

      const tick = (now) => {
        if (finished || token !== generation) return;
        const elapsed = Math.min(INTRO_MS, now - start);
        for (const [className, at] of REVEALS) {
          if (elapsed >= at) page.classList.add(className);
        }
        const index = Math.min(posters.length - 1, Math.floor(elapsed / INTRO_MS * posters.length));
        show(index);

        if (elapsed < INTRO_MS) {
          frame = requestAnimationFrame(tick);
          return;
        }

        // The last frame is selected behind the reel before fading the reel
        // itself. The gallery cover was already preselected and preloaded.
        selectSlide(lastVisible.slide);
        page.dataset.opening = 'settled';
        page.classList.add('opening-gallery-visible');
        completionTimer = setTimeout(() => {
          if (!finished && token === generation) finish();
        }, CROSSFADE_MS + 40);
      };
      frame = requestAnimationFrame(tick);
    }));
  }

  return { play, cancel: finish };
}
