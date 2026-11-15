const books = new Map([
  ['flat', 16],
  ['a5', 17],
  ['itm', 12],
]);

export function bookFor(project) {
  if (project?.category !== 'identity' || project.subcategory !== 'Брендбуки') return null;
  const match = project.cover.match(/\/images\/brandbooks\/(flat|a5|itm)\/01\.webp$/);
  if (!match) return null;
  const slug = match[1];
  return { base: new URL('./images/brandbooks/' + slug + '/', import.meta.url), count: books.get(slug) };
}

export function brandbookGallery(motion) {
  const gallery = document.querySelector('#brandbook');
  const stage = gallery.querySelector('.book-stage');
  const main = gallery.querySelector('.book-page');
  const left = gallery.querySelector('[data-book-step="-1"]');
  const right = gallery.querySelector('[data-book-step="1"]');
  const strip = gallery.querySelector('.book-strip');
  const counter = gallery.querySelector('.book-counter');
  const zoom = document.querySelector('#book-zoom');
  const zoomImage = new Image();
  let book, title, current, animation, request = 0, startPoint;
  const format = (number) => String(number).padStart(2, '0');
  const pageUrl = (index) => new URL(format(index + 1) + '.webp', book.base).href;

  function neighbor(button, index) {
    const offEnd = index < 0 || index >= book.count;
    button.disabled = offEnd;
    if (offEnd) return;
    let image = button.querySelector('img');
    if (!image) {
      image = new Image();
      image.alt = '';
      button.prepend(image);
    }
    image.src = pageUrl(index);
  }

  function select(index, animate = true) {
    if (!book || index < 0 || index >= book.count || current === index) return;
    const direction = index > current ? 1 : -1;
    current = index;
    counter.textContent = format(index + 1) + ' / ' + format(book.count);
    neighbor(left, index - 1);
    neighbor(right, index + 1);
    for (const thumb of strip.children) thumb.removeAttribute('aria-current');
    const thumb = strip.children[index];
    thumb.setAttribute('aria-current', 'page');
    const leftEdge = thumb.offsetLeft - strip.clientWidth / 2 + thumb.offsetWidth / 2;
    strip.scrollTo({ left: leftEdge, behavior: motion.matches || !animate ? 'instant' : 'smooth' });

    const id = ++request;
    const image = new Image();
    image.alt = title + ', страница ' + (index + 1);
    image.src = pageUrl(index);
    const draw = () => {
      if (id !== request) return;
      animation?.cancel();
      main.replaceChildren(image);
      if (!motion.matches && animate) {
        animation = image.animate([
          { opacity: 0.35, transform: 'translateX(' + (direction * 24) + 'px) scale(.988)' },
          { opacity: 1, transform: 'translateX(0) scale(1)' },
        ], { duration: 420, easing: 'cubic-bezier(.22, 1, .36, 1)' });
      }
    };
    image.decode().then(draw, draw);
  }

  function open(next, name) {
    if (book?.base.href === next.base.href) return;
    book = next;
    title = name;
    current = -1;
    main.replaceChildren();
    gallery.hidden = false;
    strip.style.setProperty('--thumb-sheet', 'url(' + JSON.stringify(new URL('thumbs.webp', book.base).href) + ')');
    strip.style.setProperty('--thumb-rows', Math.ceil(book.count / 6));
    const thumbs = Array.from({ length: book.count }, (_, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'book-thumb';
      button.dataset.page = index;
      button.setAttribute('aria-label', 'Страница ' + (index + 1));
      button.style.setProperty('--thumb-x', (index % 6) * 20 + '%');
      button.style.setProperty('--thumb-y', Math.floor(index / 6) * 100 / (Math.ceil(book.count / 6) - 1) + '%');
      return button;
    });
    strip.replaceChildren(...thumbs);
    select(0, false);
  }

  function close() {
    if (!book) return;
    ++request;
    animation?.cancel();
    if (zoom.open) zoom.close();
    book = null;
    gallery.hidden = true;
  }

  function step(direction) {
    if (!zoom.open) select(current + direction);
  }

  function enlarge() {
    if (!book) return;
    zoomImage.src = pageUrl(current);
    zoomImage.alt = title + ', страница ' + (current + 1);
    zoom.append(zoomImage);
    zoom.scrollTop = 0;
    zoom.scrollLeft = 0;
    zoom.showModal();
  }

  strip.addEventListener('click', (event) => {
    const target = event.target.closest('[data-page]');
    if (target) select(Number(target.dataset.page));
  });
  for (const control of [left, right]) {
    control.addEventListener('click', () => step(Number(control.dataset.bookStep)));
  }
  main.addEventListener('click', enlarge);
  gallery.querySelector('.book-enlarge').addEventListener('click', enlarge);
  stage.addEventListener('touchstart', (event) => {
    const touch = event.touches[0];
    startPoint = event.touches.length === 1 ? { x: touch.clientX, y: touch.clientY } : null;
  }, { passive: true });
  stage.addEventListener('touchend', (event) => {
    if (!startPoint) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - startPoint.x;
    const dy = touch.clientY - startPoint.y;
    startPoint = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
  }, { passive: true });
  stage.addEventListener('touchcancel', () => { startPoint = null; }, { passive: true });
  return { open, close, step, zoom };
}
