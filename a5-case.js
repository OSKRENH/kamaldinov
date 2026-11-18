import { logoPaths, construction, clearSpacePaths, clearSpaceGuides, mockups } from './a5-geometry.js?v=2';

const chapters = [
  ['overview', 'Вступление', 'Руководство по фирменному стилю А5. Оно задаёт общие правила для рекламы, печатных материалов, деловой документации и навигации.', '01–03'],
  ['logo', 'Логотип', 'Диагональ А и открытая дуга 5 образуют знак. Направляющие показывают его пропорции, а охранное поле оставляет вокруг него свободное пространство.', '04–05'],
  ['color', 'Цвет', 'Основной тон — тёплый серо-бежевый. Вторичный добавляет глубину, акцентный выделяет детали, нейтральный и комплементарный дают светлые фоны.', '06'],
  ['type', 'Шрифт', 'Onest Medium — для заголовков и выделений. Onest Regular — для основного текста. Введите свою фразу, чтобы сравнить начертания.', '07'],
  ['card', 'Визитная карточка', 'Логотип на лицевой стороне нанесён тиснением. Оборот собран на той же сетке.', '08–09', '90 × 50 мм · Поля 5 мм · 5 × 5 модулей'],
  ['letter', 'Официальный бланк', 'Реквизиты, текст письма и подпись распределены по одной модульной сетке.', '10–11', 'А4 · Поля 10 мм, слева 20 мм · 5 колонок × 10 рядов'],
  ['billboard', 'Рекламный щит', 'Крупный знак задаёт композицию щита, а сообщение и контакты выровнены по общим направляющим.', '12–13', '6 × 3 м · Поля 30 см · 10 колонок × 5 рядов'],
  ['sign', 'Режимная таблица', 'Часы работы расположены в верхней части, знак занимает нижнюю половину таблички.', '14–15', 'А4 или пропорциональный формат · Поля 10 мм, слева 20 мм · 5 колонок × 10 рядов'],
  ['brochure', 'Брошюра', 'Схема показывает расположение заголовка и крупного знака на обложке.', '16'],
  ['badge', 'Бейдж', 'Схема показывает, как на бейдже разделены фотография и нижнее поле с именем и знаком.', '17'],
];
const palette = [
  ['Основной', '#C3BCB4', '400 C', '26 22 27 4', '195 188 180', '#262321'],
  ['Вторичный', '#746661', '410 C', '47 47 47 35', '116 102 97', '#fff'],
  ['Акцентный', '#B68150', '729 C', '24 48 70 14', '182 129 80', '#211c17'],
  ['Нейтральный', '#E5E1E6', '663 C', '12 11 8 0', '229 225 230', '#262321'],
  ['Комплементарный', '#B0BFBC', '5517 C', '36 17 26 2', '176 191 188', '#262321'],
];
const pageLabels = [
  'Обложка', 'Содержание', 'Вступление', 'Построение знака', 'Охранное поле',
  'Цветовая палитра', 'Типографика', 'Визитная карточка', 'Сетка визитки', 'Официальный бланк',
  'Сетка бланка', 'Рекламный щит', 'Сетка щита', 'Режимная таблица', 'Сетка таблицы', 'Брошюра', 'Бейдж',
];
// Coordinates of the cropped mockups in the original PDF's page space.
const carriers = {
  8: ['card', 200, 15, 642, 400],
  10: ['letter', 48, 0, 702, 438],
  12: ['billboard', 150, 13, 620, 400],
  14: ['sign', 35, 0, 665, 423],
  16: ['brochure', 48, 0, 681, 425],
  17: ['badge', 4, 0, 631, 419],
};
const pageNumber = (number) => String(number).padStart(2, '0');
const asset = (name) => new URL('./images/brandbooks/a5/' + name + '.webp', import.meta.url).href;
const paths = (items) => items.map((d) => `<path d="${d}"/>`).join('');
const logo = paths(logoPaths);

export function isA5(project) {
  return project?.category === 'identity' && project.subcategory === 'Брендбуки' &&
    /\/images\/brandbooks\/a5\/01\.webp$/.test(project.cover);
}

function tabs(items, attribute, name, initial) {
  return `<div class="a5-options" role="group" aria-label="${name}">
    ${items.map(([value, label]) => `<button type="button" ${attribute}="${value}" aria-pressed="${value === initial}">${label}</button>`).join('')}
  </div>`;
}

function logoStage(mode) {
  return `<div class="a5-stage a5-mark-stage" data-mark-mode="${mode}">
    <svg viewBox="115 -22 660 480" role="img" aria-label="Фирменный знак А5">
      <g class="a5-mark">${logo}</g>
      <path class="a5-construction a5-guide" d="${construction}"/>
      <g class="a5-clear" transform="translate(-981.7 -68.4) scale(2.111)">${paths(clearSpacePaths.slice(0, 4))}
        <path class="a5-guide" d="${clearSpaceGuides}"/>
      </g>
    </svg>
  </div>`;
}

function colorStage() {
  return `<div class="a5-stage a5-color" style="--sample:${palette[0][1]};--sample-ink:${palette[0][5]}">
    <svg viewBox="246.5 83.8 398.6 265.8" aria-hidden="true">${logo}</svg>
    <output class="a5-color-values" aria-live="polite"></output>
  </div>
  <div class="a5-colors" role="group" aria-label="Фирменная палитра">
    ${palette.map(([label, hex], i) => `<button type="button" data-swatch="${i}" style="--swatch:${hex}" aria-pressed="${i === 0}">
      <span aria-hidden="true"></span><span>${label}</span><span>${hex}</span></button>`).join('')}
  </div>`;
}

function typeStage() {
  return `<div class="a5-stage a5-type" data-weight="500">
    <label for="a5-specimen">Образец Onest</label>
    <textarea id="a5-specimen" rows="2" maxlength="96" spellcheck="false">Управление комфортом</textarea>
    <p>Аа Бб Вв Гг Дд Ее Жж Зз Ии Кк Лл Мм Нн Оо Пп Рр Сс Тт Уу Фф Хх Цц Чч Шш Щщ Ъъ Ыы Ьь Ээ Юю Яя <span>0123456789</span></p>
  </div>`;
}

function pageOverlay(number) {
  const carrier = carriers[number];
  if (!carrier) return '';
  const [key, x, y, width, height] = carrier;
  const [, guides] = mockups[key];
  return `<svg class="a5-page-grid" viewBox="0 0 841.89 595.276" aria-hidden="true">
    <svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="0 0 1000 1000" preserveAspectRatio="none">
      <path class="a5-grid-shadow" d="${guides}"/><path class="a5-guide" d="${guides}"/>
    </svg>
  </svg>`;
}

export function createA5Case(root, motion, galleryField) {
  const dialog = document.querySelector('#a5-zoom');
  const zoomImage = dialog.querySelector('img');
  const zoomLabel = dialog.querySelector('.a5-zoom-label');
  let stage, title, copy, specs, options, details, stageArea, strip, count, background, thumbs;
  let current = 0;
  let returnFocus;
  let live = false;
  let pinnedGrid = false;
  let scene = 0;
  let request = 0;
  let touchStart;

  function chooseColor(index) {
    const [label, hex, pantone, cmyk, rgb, ink] = palette[index];
    const sample = stage.querySelector('.a5-color');
    sample.style.setProperty('--sample', hex);
    sample.style.setProperty('--sample-ink', ink);
    sample.querySelector('output').textContent = `${label} · ${hex}\nPantone ${pantone} · CMYK ${cmyk} · RGB ${rgb}`;
    for (const button of stage.querySelectorAll('[data-swatch]')) {
      button.setAttribute('aria-pressed', String(Number(button.dataset.swatch) === index));
    }
  }

  function showControls() {
    const interactive = current >= 4 && current <= 7;
    const canShowGrid = Object.hasOwn(carriers, current);
    options.innerHTML = `${interactive ? `<button type="button" data-details aria-pressed="${live}">${live ? 'Страница' : 'Детали'}</button>` : ''}
      ${canShowGrid ? `<button type="button" data-grid aria-pressed="${pinnedGrid}">Сетка</button>` : ''}
      <button type="button" data-zoom>Увеличить ↗</button>`;
    details.innerHTML = !live ? '' : current <= 5
      ? tabs([['mark', 'Знак'], ['construction', 'Построение'], ['clear', 'Охранное поле']], 'data-mark', 'Вид логотипа', current === 4 ? 'construction' : 'clear')
      : current === 7 ? tabs([['500', 'Medium'], ['400', 'Regular']], 'data-weight', 'Начертание Onest', '500') : '';
  }

  function showLive() {
    ++request;
    if (current <= 5) stage.innerHTML = logoStage(current === 4 ? 'construction' : 'clear');
    else if (current === 6) {
      stage.innerHTML = colorStage();
      chooseColor(0);
    } else stage.innerHTML = typeStage();
  }

  function showArtwork(direction = 0) {
    const id = ++request;
    const number = current;
    const image = new Image();
    image.alt = pageLabels[number - 1];
    image.width = 1900;
    image.height = 1343;
    image.src = asset(pageNumber(number));
    image.decode().catch(() => {}).then(() => {
      if (id !== request) return;
      const art = document.createElement('button');
      art.type = 'button';
      art.className = 'a5-art';
      art.dataset.zoom = '';
      art.setAttribute('aria-label', 'Увеличить: ' + image.alt);
      art.append(image);
      art.insertAdjacentHTML('beforeend', pageOverlay(number));
      stage.replaceChildren(art);
      const artwork = 'url(' + JSON.stringify(image.src) + ')';
      if (background[scene].style.backgroundImage !== artwork) {
        const next = background[1 - scene];
        next.style.backgroundImage = artwork;
        background[scene].classList.remove('is-current');
        next.classList.add('is-current');
        scene = 1 - scene;
      }
      if (!motion.matches && direction) {
        art.animate([{ opacity: .6, transform: `translateX(${direction * 8}px)` }, { opacity: 1, transform: 'translateX(0)' }],
          { duration: 240, easing: getComputedStyle(root).getPropertyValue('--ease').trim() });
      }
    });
  }

  function syncZoom() {
    zoomLabel.textContent = `${pageNumber(current)} / 17 · ${pageLabels[current - 1]}`;
    zoomImage.alt = pageLabels[current - 1];
    zoomImage.src = asset(pageNumber(current));
    const form = dialog.querySelector('form');
    form.querySelector('[data-a5-zoom="-1"]').disabled = current === 1;
    form.querySelector('[data-a5-zoom="1"]').disabled = current === pageLabels.length;
    dialog.scrollTop = dialog.scrollLeft = 0;
  }

  function selectPage(number, animate = true) {
    if (number < 1 || number > pageLabels.length || number === current) return;
    const direction = current && animate ? Math.sign(number - current) : 0;
    const previous = thumbs[current - 1];
    const thumb = thumbs[number - 1];
    const moveFocus = previous === document.activeElement;
    previous?.removeAttribute('aria-current');
    thumb.setAttribute('aria-current', 'page');
    if (moveFocus) thumb.focus({ preventScroll: true });
    strip.scrollTo({ top: thumb.offsetTop - (strip.clientHeight - thumb.offsetHeight) / 2,
      behavior: motion.matches || !animate ? 'instant' : 'smooth' });
    current = number;
    root.querySelector('[data-step="-1"]').setAttribute('aria-disabled', String(current === 1));
    root.querySelector('[data-step="1"]').setAttribute('aria-disabled', String(current === pageLabels.length));
    live = pinnedGrid = false;
    stageArea.removeAttribute('data-grid-on');
    stageArea.toggleAttribute('data-has-grid', Object.hasOwn(carriers, current));
    if (!stage.firstElementChild?.matches('.a5-art')) stage.replaceChildren();
    count.textContent = `${pageNumber(current)} / ${pageNumber(pageLabels.length)}`;
    const [, , description, , measurements] = chapters.find(([, , , spread]) => {
      const [first, last = first] = spread.split('–').map(Number);
      return number >= first && number <= last;
    });
    title.textContent = pageLabels[number - 1];
    copy.textContent = description;
    specs.textContent = measurements || '';
    showControls();
    showArtwork(direction);
    if (dialog.open) syncZoom();
  }

  function build() {
    root.innerHTML = `<div class="a5-background" aria-hidden="true"><div></div><div></div></div>
    <header class="a5-grid a5-header">
      <h1 tabindex="-1">А5</h1>
      <a href="#/identity/%D0%91%D1%80%D0%B5%D0%BD%D0%B4%D0%B1%D1%83%D0%BA%D0%B8" class="a5-back" data-back>Назад</a>
    </header>
    <div class="a5-grid a5-layout">
      <section class="a5-copy" aria-labelledby="a5-chapter-title">
        <h2 id="a5-chapter-title"></h2><p></p><p class="a5-specs"></p>
      </section>
      <nav class="a5-contents" aria-label="Страницы брендбука">
        ${pageLabels.map((label, i) => `<button type="button" data-page="${i + 1}" aria-label="Страница ${i + 1}. ${label}">
          <span class="a5-thumb" style="--x:${i % 6 * 20}%;--y:${Math.floor(i / 6) * 50}%"></span><span>${pageNumber(i + 1)}</span>
        </button>`).join('')}
      </nav>
      <div class="a5-reader">
        <div class="a5-page-area"><div class="a5-visual-content"></div></div>
        <div class="a5-detail-options"></div>
        <div class="a5-tools">
          <div class="a5-pager">
            <button type="button" data-step="-1" aria-label="Предыдущая страница">←</button>
            <output class="a5-count" aria-label="Номер страницы" aria-live="polite"></output>
            <button type="button" data-step="1" aria-label="Следующая страница">→</button>
          </div>
          <div class="a5-options a5-visual-options"></div>
        </div>
      </div>
    </div>`;
    const content = root.querySelector('.a5-copy');
    background = root.querySelector('.a5-background').children;
    stageArea = root.querySelector('.a5-page-area');
    stage = root.querySelector('.a5-visual-content');
    strip = root.querySelector('.a5-contents');
    thumbs = strip.children;
    title = content.querySelector('h2');
    copy = content.querySelector('p');
    specs = content.querySelector('.a5-specs');
    options = root.querySelector('.a5-visual-options');
    details = root.querySelector('.a5-detail-options');
    count = root.querySelector('.a5-count');
    stageArea.addEventListener('touchstart', (event) => {
      if (event.touches.length !== 1 || event.target.closest('textarea')) { touchStart = null; return; }
      const { clientX, clientY } = event.touches[0];
      touchStart = [clientX, clientY];
    }, { passive: true });
    stageArea.addEventListener('touchend', (event) => {
      if (!touchStart) return;
      const { clientX, clientY } = event.changedTouches[0];
      const dx = clientX - touchStart[0];
      const dy = clientY - touchStart[1];
      touchStart = null;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        event.preventDefault();
        selectPage(current - Math.sign(dx));
      }
    });
    stageArea.addEventListener('touchcancel', () => { touchStart = null; });
  }

  root.addEventListener('click', (event) => {
    if (event.target.closest('[data-back]')) {
      if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) event.preventDefault();
      else event.stopPropagation();
      return;
    }
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-page')) selectPage(Number(button.dataset.page));
    if (button.hasAttribute('data-step')) selectPage(current + Number(button.dataset.step));
    if (button.hasAttribute('data-zoom')) {
      returnFocus = button;
      dialog.removeAttribute('data-full-size');
      dialog.querySelector('[data-a5-size]').setAttribute('aria-pressed', 'false');
      dialog.querySelector('[data-a5-size]').textContent = '100%';
      syncZoom();
      dialog.showModal();
    }
    if (button.hasAttribute('data-details')) {
      live = !live;
      showControls();
      if (live) showLive();
      else showArtwork();
      options.querySelector('[data-details]').focus({ preventScroll: true });
    }
    if (button.hasAttribute('data-swatch')) chooseColor(Number(button.dataset.swatch));
    if (button.hasAttribute('data-grid')) {
      pinnedGrid = !pinnedGrid;
      button.setAttribute('aria-pressed', String(pinnedGrid));
      stageArea.toggleAttribute('data-grid-on', pinnedGrid);
    }
    if (button.hasAttribute('data-mark') || button.hasAttribute('data-weight')) {
      const mode = button.hasAttribute('data-mark') ? 'mark' : 'weight';
      stage.firstElementChild.dataset[mode === 'mark' ? 'markMode' : 'weight'] = button.dataset[mode];
      for (const toggle of details.querySelectorAll('button')) toggle.setAttribute('aria-pressed', String(toggle === button));
    }
  });

  function handleKeys(event) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest('textarea, input')) return;
    const vertical = event.target.closest('.a5-contents');
    const previous = event.key === 'ArrowLeft' || (vertical && event.key === 'ArrowUp');
    const next = event.key === 'ArrowRight' || (vertical && event.key === 'ArrowDown');
    if (!previous && !next) return;
    event.preventDefault();
    selectPage(current + (previous ? -1 : 1), false);
  }

  dialog.addEventListener('close', () => {
    if (root.hidden) return;
    (returnFocus?.isConnected ? returnFocus : options.querySelector('[data-zoom]'))?.focus({ preventScroll: true });
  });
  root.addEventListener('keydown', handleKeys);
  dialog.addEventListener('keydown', handleKeys);
  dialog.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (button?.hasAttribute('data-a5-zoom')) selectPage(current + Number(button.dataset.a5Zoom));
    if (button?.hasAttribute('data-a5-size')) {
      const full = dialog.toggleAttribute('data-full-size');
      button.setAttribute('aria-pressed', String(full));
      button.textContent = full ? 'Вписать' : '100%';
      dialog.scrollTop = dialog.scrollLeft = 0;
    }
  });

  return {
    dialog,
    open(focus) {
      if (!root.hidden) return;
      const { top, left, right, bottom } = galleryField.getBoundingClientRect();
      if (!stage) build();
      root.hidden = false;
      root.scrollTop = 0;
      background[scene].style.backgroundImage = 'url(' + JSON.stringify(asset('01')) + ')';
      background[scene].classList.add('is-current');
      selectPage(1, false);
      if (!motion.matches && focus) {
        root.querySelector('.a5-background').animate([
          { clipPath: `inset(${Math.max(0, top)}px ${Math.max(0, innerWidth - right)}px ${Math.max(0, innerHeight - bottom)}px ${Math.max(0, left)}px)` },
          { clipPath: 'inset(0)' },
        ], { duration: 760, easing: getComputedStyle(root).getPropertyValue('--ease').trim() });
      }
      if (focus) root.querySelector('h1').focus({ preventScroll: true });
    },
    close() {
      if (root.hidden) return;
      ++request;
      current = 0;
      stage.replaceChildren();
      for (const layer of background) {
        layer.classList.remove('is-current');
        layer.style.backgroundImage = '';
      }
      strip.querySelector('[aria-current]')?.removeAttribute('aria-current');
      if (dialog.open) dialog.close();
      root.hidden = true;
    },
  };
}
