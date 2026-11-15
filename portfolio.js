import { categories, normalize } from './admin/model.js';
import { bookFor, brandbookGallery } from './brandbooks.js?v=1';
import { createOpening } from './opening.js?v=6';
import { matchGalleryInk } from './gallery-ink.js?v=1';

const page = document.querySelector('#portfolio');
const field = document.querySelector('.image-field');
const progressFill = field.querySelector('.gallery-progress-fill');
const caption = document.querySelector('#caption-link');
const controls = document.querySelector('.carousel-controls');
const carouselArrows = controls.querySelectorAll('button');
const counterWindow = controls.querySelector('.counter-window');
const counterTotal = controls.querySelector('.counter-total');
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
const books = brandbookGallery(motion);
const opening = createOpening({
  page, field, motion, selectSlide: showSlide,
  onLanding: (finalSlide) => {
    // Make the intro's last frame slide 01 for the gallery's counter.
    const pivot = slides.indexOf(finalSlide);
    if (pivot > 0) slides = [...slides.slice(pivot), ...slides.slice(0, pivot)];
    updateSlideCounter(finalSlide, 1, true);
  },
  onFinish: schedule,
});
const sourceLink = document.querySelector('#project-source');

let projects = [];
let slides = [];
let originalSlides = [];
let currentElement = null;
let currentSlide = null;
let slideRequest = 0;
let formatCategory = null;
let projectListKey = null;
let route;
let timer;
let progressAnimation = null;
let slideAnimations = [];
let counterAnimations = [];
let counterGeneration = 0;
let counterValue = null;
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
  if (next.view !== 'home' && page.hasAttribute('data-opening')) opening.cancel();
  clearTimeout(focusTimer);
  renderMenus(next);
  const { view, project, category } = next;
  const detail = view === 'detail';
  const active = document.activeElement;
  const book = detail ? bookFor(project) : null;
  page.toggleAttribute('data-book', Boolean(book));
  if (book) books.open(book, project.title);
  else books.close();
  route = next;
  projectHovered = false;
  page.dataset.view = view;
  const directProjects = view === 'projects' && !categories[category].filters.length;
  page.toggleAttribute('data-direct', directProjects);
  categoryNav.inert = detail || (view === 'projects' && !directProjects);
  formatNav.inert = view !== 'formats' && !(view === 'projects' && !directProjects);
  projectNav.inert = view !== 'projects';
  projectInfo.inert = !detail || Boolean(book);
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
  // Prepare the intro's final cover underneath the grey reel in advance.
  // When the reel fades at 3s, the very same cover is already in the gallery.
  const introFinal = view === 'home' && page.hasAttribute('data-opening')
    ? set.filter((slide) => slide.project.cover).at(-1) : null;
  const selected = set.includes(currentSlide) ? currentSlide : (introFinal || set[0]);
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
  // The homepage omits SU Membership and Ecosystem; individual pages stay reachable.
  return route?.view === 'detail'
    ? originalSlides.filter((slide) => slide.project === route.project)
    : slides;
}

// Shuffle without repeats: autoplay and arrow navigation follow a new random
// sequence on each page load, shared by the opening reel and main gallery.
function shuffleSlides(items) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

// The same index is used for autoplay, manual navigation, and the opening reel.
// The number rolls vertically like a tiny odometer when the cover changes.
function updateSlideCounter(slide, direction = 1, immediate = false) {
  if (!counterWindow || !counterTotal || !slide) return;
  const set = visibleSlides();
  const index = Math.max(0, set.indexOf(slide));
  const next = String(index + 1).padStart(2, '0');
  counterTotal.textContent = String(set.length).padStart(2, '0');
  if (next === counterValue) return;

  const token = ++counterGeneration;
  const previous = counterWindow.lastElementChild;
  counterAnimations.forEach((animation) => animation.cancel());
  counterAnimations = [];
  const newNumber = document.createElement('span');
  newNumber.className = 'counter-number';
  newNumber.textContent = next;
  counterValue = next;

  if (immediate || motion.matches || page.hasAttribute('data-opening') || !previous) {
    counterWindow.replaceChildren(newNumber);
    return;
  }

  const sign = direction < 0 ? -1 : 1;
  counterWindow.replaceChildren(previous, newNumber);
  const timing = { duration: 450, easing: 'cubic-bezier(.2, .85, .22, 1)', fill: 'both' };
  const outgoing = previous.animate([
    { transform: 'translateY(0)', opacity: 1 },
    { transform: `translateY(${-100 * sign}%)`, opacity: .12 },
  ], timing);
  const incoming = newNumber.animate([
    { transform: `translateY(${100 * sign}%)`, opacity: .12 },
    { transform: 'translateY(0)', opacity: 1 },
  ], timing);
  counterAnimations = [outgoing, incoming];
  incoming.finished.then(() => {
    if (token !== counterGeneration) return;
    counterAnimations.forEach((animation) => animation.cancel());
    counterAnimations = [];
    counterWindow.replaceChildren(newNumber);
  }).catch(() => {});
}

function cancelSlideMotion() {
  slideAnimations.forEach((animation) => animation.cancel());
  slideAnimations = [];
}

// Editorial motion: the new poster uncovers from the chosen direction while
// the outgoing artwork gently recedes. The grey gallery background never moves.
function showSlide(slide, announce = false, direction = 1) {
  if (slide && slide === currentSlide) return;
  currentSlide = slide || null;
  const request = ++slideRequest;

  if (!slide) {
    cancelSlideMotion();
    for (const item of field.querySelectorAll('.slide')) {
      item.classList.remove('is-current', 'is-outgoing');
      item.setAttribute('aria-hidden', 'true');
    }
    currentElement = null;
    caption.removeAttribute('href');
    caption.hidden = true;
    return;
  }

  const { project } = slide;
  caption.hidden = false;
  document.querySelector('#slide-category').textContent = categories[project.category].label;
  document.querySelector('#slide-title').textContent = project.client || project.title;
  caption.setAttribute('aria-label', project.title);
  caption.href = project.href;
  caption.dataset.route = project.href;
  if (announce) status.textContent = slide.alt;

  const element = slide.element;
  const commit = () => {
    if (request !== slideRequest) return;

    cancelSlideMotion();
    const previous = currentElement !== element && currentElement?.isConnected ? currentElement : null;
    const animate = Boolean(previous && !motion.matches && !page.hasAttribute('data-opening')
      && route?.view !== 'detail');

    for (const item of field.querySelectorAll('.slide')) {
      item.classList.remove('is-current', 'is-outgoing');
      item.setAttribute('aria-hidden', 'true');
    }

    if (slide.preview) {
      const ratio = slide.preview.naturalHeight / slide.preview.naturalWidth;
      element.dataset.orientation = ratio >= 1.8 ? 'infographic'
        : ratio < 1 ? 'wide' : 'portrait';
    }
    if (!element.isConnected) field.append(element);
    element.removeAttribute('aria-hidden');
    if (animate) previous.classList.add('is-outgoing');
    element.classList.add('is-current');
    currentElement = element;
    matchGalleryInk(page, slide);
    updateSlideCounter(slide, direction, !animate);

    if (!animate) return;

    const duration = 820;
    const ease = 'cubic-bezier(.2, .82, .2, 1)';
    const clipFrom = direction < 0 ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)';
    const curtain = element.animate([
      { clipPath: clipFrom },
      { clipPath: 'inset(0 0 0 0)' },
    ], { duration, easing: ease, fill: 'both' });
    slideAnimations.push(curtain);

    const arrivingImage = element.querySelector('img');
    if (arrivingImage) slideAnimations.push(arrivingImage.animate([
      { transform: 'scale(1.055)', opacity: .72 },
      { transform: 'scale(1)', opacity: 1 },
    ], { duration: duration + 70, easing: ease, fill: 'both' }));

    const departingImage = previous.querySelector('img');
    if (departingImage) slideAnimations.push(departingImage.animate([
      { transform: 'translateX(0) scale(1)', opacity: 1 },
      { transform: `translateX(${direction < 0 ? '2%' : '-2%'}) scale(.975)`, opacity: .78 },
    ], { duration, easing: ease, fill: 'both' }));

    curtain.finished.then(() => {
      if (request !== slideRequest) return;
      // Release the temporary animation styles and keep only the new slide.
      previous.classList.remove('is-outgoing');
      cancelSlideMotion();
    }).catch(() => {});
  };

  const preview = slide.preview;
  if (preview && !preview.hasAttribute('src')) preview.src = project.cover;
  if (!preview || (preview.complete && preview.naturalWidth)) commit();
  else preview.decode().then(commit).catch(() => {
    if (request !== slideRequest) return;
    slide.element = colorSlide(project);
    slide.preview = null;
    currentSlide = null;
    showSlide(slide, announce, direction);
  });
}

document.addEventListener('pointerdown', (event) => {
  document.documentElement.dataset.input = event.pointerType;
}, true);
document.addEventListener('keydown', () => {
  delete document.documentElement.dataset.input;
}, true);

function step(direction, announce = true) {
  const set = visibleSlides();
  if (set.length < 2) return;
  const index = set.indexOf(currentSlide);
  showSlide(set[(index + direction + set.length) % set.length], announce, direction);
  schedule();
}

// Use the exact same duration for the 1px line and the slide timer.
function animateProgress(duration) {
  if (!progressFill || motion.matches || document.hidden) return;
  progressAnimation?.cancel();
  field.dataset.progress = 'running';
  progressAnimation = progressFill.animate([
    { transform: 'scaleX(0)' },
    { transform: 'scaleX(1)' },
  ], { duration, easing: 'linear', fill: 'forwards' });
}

function stopProgress() {
  progressAnimation?.cancel();
  progressAnimation = null;
  field.removeAttribute('data-progress');
}

function schedule() {
  clearTimeout(timer);
  // The intro has its own 200ms slide clock and must not be interrupted.
  if (page.hasAttribute('data-opening')) {
    stopProgress();
    return;
  }

  stopProgress();
  if (!paused && !carouselFocused && !projectHovered && !(route?.view === 'projects' && projectNav.contains(document.activeElement) && document.activeElement.matches(':focus-visible')) && !document.hidden && !cvDialog.open && route?.view !== 'detail' && slides.length > 1) {
    const slideDuration = 5000;
    animateProgress(slideDuration);
    timer = setTimeout(() => step(1, false), slideDuration);
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
  originalSlides = projects.map((project) => {
    const alt = project.title;
    if (!project.cover) return { element: colorSlide(project), project, alt };
    const element = document.createElement('div');
    element.className = 'slide project-cover';
    if (project.title === 'Artificial Intelligence, Big Data, Machine Learning, and Deep Learning') {
      element.dataset.feature = 'ai';
    }
    element.style.setProperty('--preview', 'url(' + JSON.stringify(project.cover) + ')');
    const preview = new Image();
    preview.alt = alt;
    preview.decoding = 'async';
    element.append(preview);
    return { element, preview, project, alt };
  });
  // The landing reel and main gallery have one AI infographic cover.
  // Membership and Ecosystem still have their own project detail pages.
  slides = shuffleSlides(originalSlides.filter(({ project }) =>
    project.title !== 'SU Membership' && project.title !== 'SU Ecosystem'
  ));
  for (const [key, section] of Object.entries(categories)) {
    const anchor = link(section.label, path(key));
    if (section.filters.length) {
      anchor.setAttribute('aria-controls', 'formats');
      anchor.setAttribute('aria-expanded', 'false');
    }
    categoryNav.append(anchor);
  }
  const initialRoute = readRoute();
  if (initialRoute.view !== 'home' || motion.matches || !slides.some((slide) => slide.project.cover)) opening.cancel();
  render(initialRoute);
  if (page.hasAttribute('data-opening')) void opening.play(slides);
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
  const slide = originalSlides.find((entry) => entry.project === project);
  if (slide) showSlide(slide);
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
motion.addEventListener('change', () => { paused = motion.matches; if (motion.matches) opening.cancel(); schedule(); });
document.addEventListener('keydown', (event) => {
  if (cvDialog.open || books.zoom.open || !route || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === 'Escape') back();
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    const direction = event.key === 'ArrowLeft' ? -1 : 1;
    if (page.hasAttribute('data-book')) {
      event.preventDefault();
      books.step(direction);
    } else if (visibleSlides().length >= 2) {
      event.preventDefault();
      step(direction);
    }
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
