// First-visit choreography for the portfolio homepage.
// UI starts immediately; the cover reel plays for 3 seconds once images are ready.
const REEL_MS = 3000;
const SETTLE_MS = 1140;

export function createOpening({ page, field, motion, selectSlide, onFinish }) {
  const reel = field.querySelector('.opening-reel');
  let generation = 0;
  let frame = 0;
  let resolveFrame = null;
  let finished = false;
  const revealTimers = [];

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const stillCurrent = (id) => id === generation && !finished;

  function finish() {
    if (finished) return;
    finished = true;
    generation++;
    cancelAnimationFrame(frame);
    for (const timer of revealTimers) clearTimeout(timer);
    resolveFrame?.();
    resolveFrame = null;
    reel?.remove();
    page.removeAttribute('data-opening');
    page.removeAttribute('aria-busy');
    page.classList.remove(
      'opening-show-given',
      'opening-show-family',
      'opening-show-cv',
      'opening-show-description',
      'opening-show-navigation',
      'opening-show-extras'
    );
    onFinish();
  }

  // Start the editorial UI choreography while the background is still full-screen.
  // Only the image-gallery caption and arrows wait for the background to settle.
  function startInterface(id) {
    const reveals = [
      ['opening-show-given', 90],
      ['opening-show-family', 330],
      ['opening-show-cv', 600],
      ['opening-show-description', 870],
      ['opening-show-navigation', 1130],
    ];
    for (const [className, at] of reveals) {
      revealTimers.push(setTimeout(() => {
        if (stillCurrent(id)) page.classList.add(className);
      }, at));
    }
  }

  async function play(slides) {
    if (finished || motion.matches || !reel || !slides.length) {
      finish();
      return;
    }
    const id = ++generation;
    startInterface(id);

    // Decode images before the timed reel to avoid flashing blank frames.
    const prepared = await Promise.all(slides.filter((item) => item.project.cover).map(async (slide) => {
      const image = new Image();
      image.alt = '';
      image.decoding = 'async';
      image.src = slide.project.cover;
      try {
        await image.decode();
        return { image, slide };
      } catch {
        return null;
      }
    }));

    if (!stillCurrent(id)) return;
    const posters = prepared.filter(Boolean);
    if (!posters.length) { finish(); return; }

    reel.replaceChildren(...posters.map(({ image }) => {
      image.classList.add('opening-reel-image');
      image.dataset.orientation = image.naturalWidth > image.naturalHeight ? 'wide' : 'portrait';
      image.setAttribute('aria-hidden', 'true');
      image.draggable = false;
      return image;
    }));

    let last = -1;
    function show(index) {
      if (index === last) return;
      if (last >= 0) posters[last].image.classList.remove('is-active');
      posters[index].image.classList.add('is-active');
      last = index;
    }
    show(0);

    // Switch every single cover in one 3000ms reel; the last frame is kept
    // during the seamless move to the normal gallery rectangle.
    await new Promise((resolve) => {
      resolveFrame = resolve;
      let start = null;
      const tick = (now) => {
        if (!stillCurrent(id)) { resolve(); return; }
        if (start === null) start = now;
        const elapsed = Math.min(REEL_MS, now - start);
        const index = Math.min(posters.length - 1, Math.floor(elapsed / REEL_MS * posters.length));
        show(index);
        if (elapsed >= REEL_MS) {
          resolveFrame = null;
          resolve();
        } else {
          frame = requestAnimationFrame(tick);
        }
      };
      frame = requestAnimationFrame(tick);
    });
    if (!stillCurrent(id)) return;

    // Place the matching real carousel slide behind the reel before shrinking.
    selectSlide(posters.at(-1).slide);
    field.getBoundingClientRect(); // flush the fullscreen inset
    page.dataset.opening = 'settle';
    await sleep(SETTLE_MS);
    if (!stillCurrent(id)) return;

    // The regular cover is now occupying its final gallery rectangle.
    // Reveal only the carousel's own controls after the shrink is complete.
    reel.remove();
    page.dataset.opening = 'sequence';
    page.classList.add('opening-show-extras');
    await sleep(850);
    if (stillCurrent(id)) finish();
  }

  return { play, cancel: finish };
}
