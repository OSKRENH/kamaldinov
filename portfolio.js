import { categories, normalize } from './admin/model.js';

const page = document.querySelector('#portfolio');
const field = document.querySelector('.image-field');
const caption = document.querySelector('#caption-link');
const controls = document.querySelector('.carousel-controls');
const carouselArrows = controls.querySelectorAll('button');
const status = document.querySelector('#slide-status');
const categoryNav = document.querySelector('#categories');
const formatNav = document.querySelector('#formats');
const projectNav = document.querySelector('#projects');
const projectInfo = document.querySelector('#project-info');
const projectTitle = document.querySelector('#project-title');
const name = document.querySelector('.name');
const intro = document.querySelector('#intro');
const advertisingIntro = 'Рекламные концепции и макеты любой сложности.\nИдея, публикация и/или подготовка в производство.';
let homeIntro = intro.textContent;
const cv = document.querySelector('.cv-button');
const cvDialog = document.querySelector('#cv');
const detailBack = document.querySelector('.detail-back');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const sourceLink = document.querySelector('#project-source');

let projects = [];
let slides = [];
let currentElement = null;
let currentSlide = null;
let slideRequest = 0;
let formatCategory = null;
let projectListKey = null;
let route;
let timer;
let paused = motion.matches;
let carouselFocused = false;
let projectHovered = false;

function path(category, format, project) {
  const parts = [category, format, project];
  while (parts.length && !parts.at(-1)) parts.pop();
  return parts.length ? '#/' + parts.map((part) => encodeURIComponent(part || '')).join('/') : '';
}

function readRoute() {
  try {
    const [category, format, id] = location.hash.slice(2).split('/').map(decodeURIComponent);
    const section = categories[category];
    if (!location.hash.startsWith('#/') || !Object.hasOwn(categories, category)) return { view: 'home' };
    const project = projects.find((entry) => entry.id === id && entry.category === category && entry.subcategory === (format || ''));
    if (project) return { view: 'detail', category, format, project };
    const hasFormats = Boolean(section.filters.length);
    if (hasFormats && !format) return { view: 'formats', category };
    if (hasFormats && !formatsFor(category).includes(format)) return { view: 'formats', category };
    return { view: 'projects', category, format: format || '' };
  } catch {
    return { view: 'home' };
  }
}

function formatsFor(category) {
  const { filters } = categories[category];
  if (filters.length && projects.some((project) => project.category === category && !project.subcategory)) {
    return [...filters, 'Другие'];
  }
  return filters;
}

function parentPath(state) {
  if (state.view === 'detail') {
    const format = state.format || (categories[state.category].filters.length ? 'Другие' : '');
    return path(state.category, format);
  }
  if (state.view === 'projects' && state.format) return path(state.category);
  return '';
}

function link(label, href, current = false) {
  const anchor = document.createElement('a');
  anchor.textContent = label;
  anchor.href = href || './';
  anchor.dataset.route = href;
  if (current) anchor.setAttribute('aria-current', 'true');
  return anchor;
}

function renderMenus(next) {
  const { view, category, format } = next;
  for (const anchor of categoryNav.querySelectorAll('a')) {
    const active = (view === 'formats' || (view === 'projects' && !format)) && anchor.dataset.route === path(category);
    if (active) anchor.setAttribute('aria-current', 'true');
    else anchor.removeAttribute('aria-current');
    if (anchor.hasAttribute('aria-expanded')) anchor.setAttribute('aria-expanded', active);
  }

  if (category && formatCategory !== category) {
    formatCategory = category;
    const items = formatsFor(category).map((label) => link(label, path(category, label)));
    const sectionBack = link('← ' + categories[category].label, path(category));
    sectionBack.className = 'section-back';
    sectionBack.dataset.sectionBack = '';
    formatNav.replaceChildren(...items, sectionBack);
    if (route?.view === 'formats' && view === 'formats' && !motion.matches) {
      formatNav.animate([
        { opacity: 0, transform: 'translateX(24px)' },
        { opacity: 1, transform: 'translateX(0)' },
      ], { duration: 650, easing: 'cubic-bezier(.22, 1, .36, 1)' });
    }
  }
  const sectionBack = formatNav.querySelector('.section-back');
  if (sectionBack) {
    sectionBack.inert = view !== 'projects';
    sectionBack.setAttribute('aria-hidden', String(view !== 'projects'));
  }
  for (const anchor of formatNav.querySelectorAll('a:not(.section-back)')) {
    if (anchor.dataset.route === path(category, format)) anchor.setAttribute('aria-current', 'true');
    else anchor.removeAttribute('aria-current');
  }
  if (view !== 'projects' && view !== 'detail') return;

  const listKey = path(category, format);
  if (projectListKey === listKey) return;
  projectListKey = listKey;
  const items = projects.filter((project) => project.category === category
    && project.subcategory === (format === 'Другие' ? '' : format));
  if (items.length) {
    projectNav.replaceChildren(...items.map((project) => link(project.title, project.href)));
  } else {
    const empty = document.createElement('p');
    empty.textContent = '';
    projectNav.replaceChildren(empty);
  }
}

let focusTimer;
function render(next, moveFocus = false) {
  clearTimeout(focusTimer);
  renderMenus(next);
  const { view, project, category } = next;
  const detail = view === 'detail';
  const active = document.activeElement;
  route = next;
  projectHovered = false;
  page.dataset.view = view;
  const directProjects = view === 'projects' && !categories[category].filters.length;
  page.toggleAttribute('data-direct', directProjects);
  categoryNav.inert = detail || (view === 'projects' && !directProjects);
  formatNav.inert = view !== 'formats' && !(view === 'projects' && !directProjects);
  projectNav.inert = view !== 'projects';
  projectInfo.inert = !detail;
  projectTitle.inert = !detail;
  detailBack.inert = !detail;
  name.inert = detail;
  cv.inert = detail;
  intro.inert = detail;
  const advertisingList = view === 'projects' && category === 'advertising';
  page.toggleAttribute('data-advertising-list', advertisingList);
  if (!detail) renderIntro(advertisingList ? advertisingIntro : homeIntro);
  caption.inert = detail;

  if (detail) {
    projectTitle.textContent = project.title;
    document.querySelector('#project-description').textContent = project.description;
    sourceLink.hidden = !project.url;
    if (project.url) sourceLink.href = project.url;
    else sourceLink.removeAttribute('href');
  }

  const set = visibleSlides();
  const selected = set.includes(currentSlide) ? currentSlide : set[0];
  showSlide(selected);
  for (const arrow of carouselArrows) arrow.disabled = set.length < 2;
  schedule();

  if (moveFocus && (active?.closest('[inert]') || active === document.body)) {
    const target = { home: categoryNav, formats: formatNav, projects: projectNav }[view];
    focusTimer = setTimeout(() => {
      (detail ? projectTitle : target?.querySelector('a, button') || formatNav.querySelector('a'))?.focus({ preventScroll: true });
    }, motion.matches ? 0 : 780);
  }
}

function renderIntro(copy) {
  const defaultCopy = 'Коммуникационный дизайнер с опытом работы более 15 лет. Разрабатываю рекламу, айдентику, цифровые и печатные продукты. Визуальный стиль, иерархия и системы, которые работают на любых носителях — от книжного разворота до рекламного щита.';
  if (copy.replace(/\s+/g, ' ').trim() !== defaultCopy) {
    intro.textContent = copy;
    return;
  }
  const desktop = document.createElement('span');
  desktop.className = 'intro-desktop-copy';
  desktop.textContent = copy;
  const mobile = document.createElement('span');
  mobile.className = 'intro-mobile-copy';
  mobile.textContent = [
    'Коммуникационный дизайнер с опытом работы',
    'более 15 лет. Реклама, айдентика, цифровые и печатные',
    'продукты. Визуальный стиль, иерархия и системы,',
    'которые работают на любых носителях —',
    'от книжного разворота до рекламного щита.',
  ].join('\n');
  intro.replaceChildren(desktop, mobile);
}

function visibleSlides() {
  return route?.view === 'detail' ? slides.filter((slide) => slide.project === route.project) : slides;
}

function showSlide(slide, announce = false) {
  if (slide && slide === currentSlide) return;
  currentSlide = slide || null;
  const request = ++slideRequest;
  if (!slide) {
    for (const image of field.querySelectorAll('.slide')) {
      image.classList.remove('is-current', 'is-outgoing');
      image.setAttribute('aria-hidden', 'true');
    }
    caption.removeAttribute('href');
    caption.hidden = true;
    return;
  }

  const { project } = slide;
  caption.hidden = false;
  document.querySelector('#slide-category').textContent = categories[project.category].label;
  document.querySelector('#slide-title').textContent = project.title;
  caption.href = project.href;
  caption.dataset.route = project.href;
  if (announce) status.textContent = slide.alt;

  const element = slide.element;
  const commit = () => {
    if (request !== slideRequest) return;
    for (const previous of field.querySelectorAll('.slide')) {
      previous.classList.remove('is-current', 'is-outgoing');
      previous.setAttribute('aria-hidden', 'true');
    }
    const outgoing = currentElement !== element && currentElement?.isConnected ? currentElement : null;
    outgoing?.classList.add('is-outgoing');
    const fresh = !element.isConnected;
    if (fresh) {
      field.append(element);
      element.getBoundingClientRect();
    }
    if (slide.preview) element.removeAttribute('aria-hidden');
    element.classList.add('is-current');
    currentElement = element;
    if (outgoing) {
      const clearOutgoing = () => {
        if (request === slideRequest) outgoing.classList.remove('is-outgoing');
      };
      if (motion.matches) clearOutgoing();
      else {
        element.addEventListener('transitionend', clearOutgoing, { once: true });
        setTimeout(clearOutgoing, 1300);
      }
    }
  };
  const preview = slide.preview;
  if (preview && !preview.hasAttribute('src')) preview.src = project.cover;
  if (!preview || (preview.complete && preview.naturalWidth)) commit();
  else preview.decode().then(commit).catch(() => {
    if (request !== slideRequest) return;
    slide.element = colorSlide(project);
    slide.preview = null;
    currentSlide = null;
    showSlide(slide);
  });
}

function step(direction, announce = true) {
  const set = visibleSlides();
  if (set.length < 2) return;
  const index = set.indexOf(currentSlide);
  showSlide(set[(index + direction + set.length) % set.length], announce);
  schedule();
}

function schedule() {
  clearTimeout(timer);
  if (!paused && !carouselFocused && !projectHovered && !(route?.view === 'projects' && projectNav.contains(document.activeElement) && document.activeElement.matches(':focus-visible')) && !document.hidden && !cvDialog.open && route?.view !== 'detail' && slides.length > 1) {
    timer = setTimeout(() => step(1, false), 5000);
  }
}

function navigate(href) {
  if (href === location.hash) return;
  const from = location.hash;
  history.pushState({ portfolio: true, from }, '', href || location.pathname + location.search);
  render(readRoute(), true);
}

function back() {
  if (!route || route.view === 'home') return;
  const previous = history.state?.portfolio ? history.state.from : undefined;
  if (previous !== undefined) {
    history.back();
  } else {
    history.replaceState(null, '', parentPath(route) || location.pathname + location.search);
    render(readRoute(), true);
  }
}

function colorSlide(project) {
  const element = document.createElement('div');
  element.className = 'slide color-slide';
  element.dataset.category = project.category;
  element.setAttribute('aria-hidden', 'true');
  return element;
}

function install(data) {
  homeIntro = data.intro;
  const ids = new Map();
  projects = data.projects.map((project) => {
    const base = project.title.toLocaleLowerCase('ru').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'project';
    const key = path(project.category, project.subcategory, base);
    const count = (ids.get(key) || 0) + 1;
    ids.set(key, count);
    const id = count === 1 ? base : base + '~' + count;
    return { ...project, id, href: path(project.category, project.subcategory, id) };
  });
  slides = projects.map((project) => {
    const alt = project.title;
    if (!project.cover) return { element: colorSlide(project), project, alt };
    const element = document.createElement('div');
    element.className = 'slide project-cover';
    element.style.setProperty('--preview', 'url(' + JSON.stringify(project.cover) + ')');
    const preview = new Image();
    preview.alt = alt;
    preview.decoding = 'async';
    element.append(preview);
    return { element, preview, project, alt };
  });
  for (const [key, section] of Object.entries(categories)) {
    const anchor = link(section.label, path(key));
    if (section.filters.length) {
      anchor.setAttribute('aria-controls', 'formats');
      anchor.setAttribute('aria-expanded', 'false');
    }
    categoryNav.append(anchor);
  }
  render(readRoute());
}

page.addEventListener('click', (event) => {
  const routeLink = event.target.closest('[data-route]');
  if (routeLink && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
    event.preventDefault();
    const currentFormat = route?.view === 'projects' && routeLink.closest('#formats')
      && routeLink.getAttribute('aria-current');
    if (routeLink.hasAttribute('data-section-back') || currentFormat) {
      const destination = parentPath(route);
      if (history.state?.from === destination) back();
      else {
        history.replaceState(null, '', destination || location.pathname + location.search);
        render(readRoute(), true);
      }
    } else navigate(routeLink.dataset.route);
  }
  if (event.target.closest('[data-back]')) back();
  const arrow = event.target.closest('[data-step]');
  if (arrow) step(Number(arrow.dataset.step));
});
function updateCarouselFocus() {
  const active = document.activeElement;
  carouselFocused = active?.matches(':focus-visible') && (controls.contains(active) || caption === active);
  schedule();
}
function previewProject(anchor) {
  if (route?.view !== 'projects' || !anchor) return;
  const project = projects.find((entry) => entry.href === anchor.dataset.route);
  if (!project) return;
  const slide = slides.find((entry) => entry.project === project);
  showSlide(slide);
  schedule();
}

projectNav.addEventListener('pointerover', (event) => {
  if (event.pointerType === 'touch' || route?.view !== 'projects') return;
  projectHovered = true;
  const anchor = event.target.closest('a[data-route]');
  if (anchor && !anchor.contains(event.relatedTarget)) previewProject(anchor);
  schedule();
});
projectNav.addEventListener('pointerleave', () => {
  projectHovered = false;
  schedule();
});
projectNav.addEventListener('focusin', (event) => {
  previewProject(event.target.closest('a[data-route]'));
});
projectNav.addEventListener('focusout', () => queueMicrotask(schedule));

page.addEventListener('focusin', updateCarouselFocus);
page.addEventListener('focusout', () => queueMicrotask(updateCarouselFocus));
cv.addEventListener('click', () => { cvDialog.showModal(); schedule(); });
cvDialog.addEventListener('close', schedule);
window.addEventListener('popstate', () => render(readRoute(), true));
document.addEventListener('visibilitychange', schedule);
motion.addEventListener('change', () => { paused = motion.matches; schedule(); });
document.addEventListener('keydown', (event) => {
  if (cvDialog.open || !route || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === 'Escape') back();
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    if (visibleSlides().length < 2) return;
    event.preventDefault();
    step(event.key === 'ArrowLeft' ? -1 : 1);
  }
});

async function start() {
  try {
    const response = await fetch('./content.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error('Не удалось загрузить проекты.');
    install(normalize(await response.json()));
  } catch (error) {
    console.error(error);
    install({ intro: document.querySelector('#intro').textContent, projects: [] });
  }
}
start();
