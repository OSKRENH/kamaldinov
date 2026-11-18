const sections = [
  { id: 'intro', title: 'О системе', pages: [[2, 'Содержание'], [3, 'Задача руководства']] },
  { id: 'identity', title: 'Фирменный стиль', pages: [[4, 'Построение знака'], [5, 'Охранное поле'], [6, 'Цветовая палитра'], [7, 'Типографика Onest']] },
  { id: 'applications', title: 'Носители', pages: [[8, 'Визитная карточка'], [9, 'Сетка визитки'], [10, 'Фирменный бланк'], [11, 'Сетка бланка'], [12, 'Рекламный щит'], [13, 'Сетка рекламного щита'], [14, 'Режимная таблица'], [15, 'Сетка режимной таблицы'], [16, 'Брошюра'], [17, 'Бейдж']] },
];
const palette = [
  ['#C3BCB4', 'Основной', '#262321'],
  ['#746661', 'Вторичный', '#fff'],
  ['#B68150', 'Акцентный', '#211c17'],
  ['#E5E1E6', 'Нейтральный', '#262321'],
  ['#B0BFBC', 'Комплементарный', '#262321'],
];
const pageNumber = (number) => String(number).padStart(2, '0');
const pageUrl = (number) => new URL('./images/brandbooks/a5/' + pageNumber(number) + '.webp', import.meta.url).href;

export function isA5(project) {
  return project?.category === 'identity' && project.subcategory === 'Брендбуки' &&
    /\/images\/brandbooks\/a5\/01\.webp$/.test(project.cover);
}

function pageCard([number, label], cover = false) {
  return `<figure class="a5-page${cover ? ' a5-cover' : ''}" data-a5-reveal>
    <button class="a5-page-open" type="button" data-a5-page="${number}" aria-label="Увеличить: ${label}">
      <img src="${pageUrl(number)}" loading="${cover ? 'eager' : 'lazy'}" decoding="async"
        width="1900" height="1343" alt="${label}">
    </button>
    <figcaption><span>${label}</span><span>${pageNumber(number)} / 17</span></figcaption>
  </figure>`;
}

export function createA5Case(root, motion) {
  const dialog = document.querySelector('#a5-zoom');
  const zoomImage = dialog.querySelector('img');
  const zoomLabel = dialog.querySelector('.a5-zoom-label');
  const prev = dialog.querySelector('[data-a5-zoom="-1"]');
  const next = dialog.querySelector('[data-a5-zoom="1"]');
  const pages = ['Обложка', ...sections.flatMap((section) => section.pages.map((page) => page[1]))];
  let observer, sectionObserver, currentPage, built = false;

  function labelPalette(button) {
    const [color, label, ink] = palette[Number(button.dataset.swatch)];
    const sample = root.querySelector('.a5-sample');
    sample.style.setProperty('--sample', color);
    sample.style.setProperty('--sample-ink', ink);
    sample.querySelector('output').textContent = label + ' · ' + color;
    for (const option of root.querySelectorAll('[data-swatch]')) {
      option.setAttribute('aria-pressed', String(option === button));
    }
  }

  function build() {
    root.innerHTML = `<div class="a5-top"><div class="a5-grid a5-top-grid">
      <button type="button" data-back class="a5-back">← Назад</button>
      <nav aria-label="Разделы кейса">${sections.map(({ id, title }) => `<button type="button" data-chapter="${id}">${title}</button>`).join('')}</nav>
    </div></div>
    <div class="a5-body">
      <header class="a5-grid a5-hero">
        <div class="a5-title"><p>Айдентика</p><h1 tabindex="-1">A5</h1><p>Руководство по фирменному стилю</p></div>
        ${pageCard([1, 'Обложка'], true)}
      </header>
      ${sections.map(({ id, title, pages }) => `<section id="a5-${id}" class="a5-grid a5-chapter" aria-labelledby="a5-${id}-title">
        <h2 id="a5-${id}-title" data-a5-reveal>${title}</h2>
        ${pages.map(page => pageCard(page)).join('')}
        ${id === 'identity' ? `<div class="a5-palette" data-a5-reveal>
          <div class="a5-sample"><span aria-hidden="true">A5</span><output aria-live="polite"></output></div>
          <div class="a5-swatches" aria-label="Цвета A5">${palette.map(([hex, label], i) => `<button type="button" data-swatch="${i}" style="--swatch:${hex}" aria-pressed="false"><span>${label}</span><span>${hex}</span></button>`).join('')}</div>
        </div>` : ''}
      </section>`).join('')}
    </div>`;
    labelPalette(root.querySelector('[data-swatch]'));
    built = true;
  }

  function selectPage(number) {
    if (number < 1 || number > pages.length) return;
    currentPage = number;
    zoomLabel.textContent = pageNumber(number) + ' / 17 · ' + pages[number - 1];
    zoomImage.alt = pages[number - 1] + ', страница ' + number;
    zoomImage.src = pageUrl(number);
    prev.disabled = number === 1;
    next.disabled = number === pages.length;
  }

  root.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-a5-page')) {
      selectPage(Number(button.dataset.a5Page));
      dialog.showModal();
    } else if (button.hasAttribute('data-chapter')) {
      root.querySelector('#a5-' + button.dataset.chapter).scrollIntoView({ behavior: motion.matches ? 'instant' : 'smooth', block: 'start' });
    } else if (button.hasAttribute('data-swatch')) labelPalette(button);
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
      if (!built) build();
      if (!root.hidden) return;
      root.hidden = false;
      root.scrollTop = 0;
      if (focus) root.querySelector('h1').focus({ preventScroll: true });
      if (!motion.matches && 'IntersectionObserver' in window) {
        observer = new IntersectionObserver((entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.animate([{ opacity: .4, transform: 'translateY(14px)' }, { opacity: 1, transform: 'translateY(0)' }],
              { duration: 460, easing: 'cubic-bezier(.22, 1, .36, 1)' });
            observer.unobserve(entry.target);
          }
        }, { root, threshold: .16 });
        root.querySelectorAll('[data-a5-reveal]').forEach((node) => observer.observe(node));
      }
      if ('IntersectionObserver' in window) {
        sectionObserver = new IntersectionObserver((entries) => {
          const visible = entries.filter((entry) => entry.isIntersecting).at(-1);
          if (!visible) return;
          for (const button of root.querySelectorAll('[data-chapter]')) {
            if (visible.target.id === 'a5-' + button.dataset.chapter) button.setAttribute('aria-current', 'location');
            else button.removeAttribute('aria-current');
          }
        }, { root, rootMargin: '-12% 0px -62% 0px' });
        root.querySelectorAll('.a5-hero, .a5-chapter').forEach((node) => sectionObserver.observe(node));
      }
    },
    close() {
      observer?.disconnect();
      sectionObserver?.disconnect();
      if (dialog.open) dialog.close();
      root.querySelector('[data-chapter][aria-current]')?.removeAttribute('aria-current');
      root.hidden = true;
    },
  };
}
