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

function logoStage(isCover) {
  return `<div class="a5-stage a5-mark-stage${isCover ? ' a5-cover' : ''}" data-mark-mode="mark">
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

function mockupStage(id, label) {
  const [height, grid] = mockups[id];
  return `<button class="a5-stage a5-mockup" type="button" data-mockup="${id}" data-grid aria-label="Сетка · ${label}" aria-pressed="false">
    <span class="a5-mockup-art" style="--ratio:${1000 / height}">
      <img src="${asset(id)}" alt="" width="1000" height="${Math.round(height)}" decoding="async">
      <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
        <path class="a5-grid-shadow" d="${grid}"/>
        <path class="a5-guide" d="${grid}"/>
      </svg>
    </span>
  </button>`;
}

export function createA5Case(root, motion) {
  const dialog = document.querySelector('#a5-zoom');
  const zoomImage = dialog.querySelector('img');
  const zoomLabel = dialog.querySelector('.a5-zoom-label');
  const prev = dialog.querySelector('[data-a5-zoom="-1"]');
  const next = dialog.querySelector('[data-a5-zoom="1"]');
  let stage, title, copy, specs, options, pageButton, active, currentPage;

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

  function showChapter(id) {
    const [key, label, description, spread, details] = chapters.find(([entry]) => entry === id);
    active = key;
    title.textContent = label;
    copy.textContent = description;
    specs.textContent = details || '';
    for (const button of root.querySelectorAll('[data-chapter]')) {
      if (button.dataset.chapter === key) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    }
    pageButton.dataset.original = spread.split('–')[0];
    pageButton.textContent = `Брендбук · ${spread} / 17 ↗`;
    if (key === 'overview' || key === 'logo') stage.innerHTML = logoStage(key === 'overview');
    else if (key === 'color') stage.innerHTML = colorStage();
    else if (key === 'type') stage.innerHTML = typeStage();
    else stage.innerHTML = mockupStage(key, label);
    options.innerHTML = key === 'logo'
      ? tabs([['mark', 'Знак'], ['construction', 'Построение'], ['clear', 'Охранное поле']], 'data-mark', 'Вид логотипа', 'mark')
      : key === 'type'
        ? tabs([['500', 'Medium'], ['400', 'Regular']], 'data-weight', 'Начертание Onest', '500')
        : Object.hasOwn(mockups, key) ? '<button type="button" data-grid aria-pressed="false">Показать сетку</button>' : '';
    if (key === 'color') chooseColor(0);
    if (!motion.matches) stage.animate(
      [{ opacity: .55, transform: 'translateX(9px)' }, { opacity: 1, transform: 'translateX(0)' }],
      { duration: 320, easing: getComputedStyle(root).getPropertyValue('--ease').trim() },
    );
  }

  function build() {
    root.innerHTML = `<header class="a5-grid a5-header">
      <h1 tabindex="-1">А5</h1>
      <a href="#/identity/%D0%91%D1%80%D0%B5%D0%BD%D0%B4%D0%B1%D1%83%D0%BA%D0%B8" class="a5-back" data-back>Назад</a>
    </header>
    <div class="a5-grid a5-layout">
      <section class="a5-copy" aria-labelledby="a5-chapter-title" aria-live="polite">
        <h2 id="a5-chapter-title"></h2><p></p><p class="a5-specs"></p>
      </section>
      <nav class="a5-contents" aria-label="Разделы брендбука">
        <div class="a5-chapters">
          <div>${chapters.slice(0, 4).map(([id, label]) => `<button type="button" data-chapter="${id}">${label}</button>`).join('')}</div>
          <div>${chapters.slice(4).map(([id, label]) => `<button type="button" data-chapter="${id}">${label}</button>`).join('')}</div>
        </div>
        <button class="a5-original" type="button" data-original></button>
      </nav>
      <div class="a5-visual">
        <div class="a5-visual-content"></div><div class="a5-visual-options"></div>
      </div>
    </div>`;
    const content = root.querySelector('.a5-copy');
    stage = root.querySelector('.a5-visual-content');
    title = content.querySelector('h2');
    copy = content.querySelector('p');
    specs = content.querySelector('.a5-specs');
    options = root.querySelector('.a5-visual-options');
    pageButton = root.querySelector('[data-original]');
  }

  function selectPage(number) {
    if (number < 1 || number > pageLabels.length) return;
    currentPage = number;
    zoomLabel.textContent = pageNumber(number) + ' / 17 · ' + pageLabels[number - 1];
    zoomImage.alt = pageLabels[number - 1] + ', страница ' + number;
    zoomImage.src = asset(pageNumber(number));
    prev.disabled = number === 1;
    next.disabled = number === pageLabels.length;
  }

  root.addEventListener('click', (event) => {
    if (event.target.closest('[data-back]')) {
      if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) event.preventDefault();
      else event.stopPropagation();
      return;
    }
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-chapter') && active !== button.dataset.chapter) showChapter(button.dataset.chapter);
    if (button.hasAttribute('data-original')) {
      selectPage(Number(button.dataset.original));
      dialog.showModal();
      dialog.scrollTop = dialog.scrollLeft = 0;
    }
    if (button.hasAttribute('data-swatch')) chooseColor(Number(button.dataset.swatch));
    if (button.hasAttribute('data-grid')) {
      const enabled = button.getAttribute('aria-pressed') !== 'true';
      for (const toggle of root.querySelectorAll('[data-grid]')) toggle.setAttribute('aria-pressed', String(enabled));
      options.firstElementChild.textContent = enabled ? 'Скрыть сетку' : 'Показать сетку';
    }
    if (button.hasAttribute('data-mark') || button.hasAttribute('data-weight')) {
      const mode = button.hasAttribute('data-mark') ? 'mark' : 'weight';
      stage.firstElementChild.dataset[mode === 'mark' ? 'markMode' : 'weight'] = button.dataset[mode];
      for (const toggle of options.querySelectorAll('button')) toggle.setAttribute('aria-pressed', String(toggle === button));
    }
  });

  dialog.addEventListener('click', (event) => {
    const button = event.target.closest('[data-a5-zoom]');
    if (button) selectPage(currentPage + Number(button.dataset.a5Zoom));
  });
  dialog.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    selectPage(currentPage + (event.key === 'ArrowRight' ? 1 : -1));
  });

  return {
    dialog,
    open(focus) {
      if (!root.hidden) return;
      if (!stage) build();
      root.hidden = false;
      showChapter('overview');
      root.scrollTop = 0;
      if (focus) root.querySelector('h1').focus({ preventScroll: true });
    },
    close() {
      if (dialog.open) dialog.close();
      root.hidden = true;
    },
  };
}
