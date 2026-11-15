/**
 * Perspective billboard display for the Etalon / SHAGAL outdoor campaign.
 * Both physical structures are HTML/CSS; only the printed posters are raster artwork.
 */
export function isBillboardProject(project) {
  return project?.category === 'advertising'
    && project.subcategory === 'Оффлайн'
    && /\/images\/advertising\/etalon-2026-15x5\.jpg(?:$|[?#])/.test(project.cover || '');
}

export function billboardGallery() {
  const gallery = document.querySelector('#billboards');
  const stage = gallery.querySelector('.billboard-scene');
  const buttons = [...gallery.querySelectorAll('[data-billboard-size]')];
  const posters = [...gallery.querySelectorAll('[data-billboard-select]')];
  const live = gallery.querySelector('.billboard-announcement');
  let current = '15x5';
  let active = false;

  function choose(format, announce = true) {
    if (!['15x5', '6x3'].includes(format)) return;
    current = format;
    stage.dataset.activeFormat = current;
    for (const button of buttons) {
      const selected = button.dataset.billboardSize === current;
      button.setAttribute('aria-pressed', String(selected));
    }
    for (const poster of posters) {
      const selected = poster.dataset.billboardSelect === current;
      poster.setAttribute('aria-pressed', String(selected));
    }
    if (announce) live.textContent = current === '15x5' ? 'Билборд 15 на 5 метров' : 'Билборд 6 на 3 метра';
  }

  buttons.forEach((button) => button.addEventListener('click', () => choose(button.dataset.billboardSize)));
  posters.forEach((poster) => poster.addEventListener('click', () => choose(poster.dataset.billboardSelect)));

  function open() {
    active = true;
    gallery.hidden = false;
    gallery.inert = false;
    choose('15x5', false);
  }

  function close() {
    if (!active) return;
    active = false;
    gallery.hidden = true;
    gallery.inert = true;
  }

  function step(direction) {
    if (!active) return;
    choose(direction > 0 ? '6x3' : '15x5');
  }

  return { open, close, step };
}
