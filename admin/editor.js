import { categories, normalize } from './model.js';

const form = document.querySelector('#editor');
const bio = document.querySelector('#intro');
const list = document.querySelector('#projects');
const status = document.querySelector('#status');
const publish = document.querySelector('#publish');
const exportBox = document.querySelector('#export');
const exportText = document.querySelector('#export-text');
let revision = '';

function add(project = {}, open = false) {
  const article = document.querySelector('#project').content.firstElementChild.cloneNode(true);
  const details = article.querySelector('details');
  const summary = article.querySelector('summary');
  const title = article.querySelector('[name=title]');
  const category = article.querySelector('[name=category]');
  const subcategory = article.querySelector('[name=subcategory]');

  for (const [key, entry] of Object.entries(categories)) category.add(new Option(entry.label, key));
  category.value = project.category || 'advertising';
  function renderFilters(selected = '') {
    subcategory.replaceChildren(new Option('Без подраздела', ''));
    for (const filter of categories[category.value].filters) subcategory.add(new Option(filter, filter));
    subcategory.value = selected;
    subcategory.disabled = subcategory.options.length === 1;
  }
  renderFilters(project.subcategory);
  category.addEventListener('change', () => renderFilters());

  for (const name of ['title', 'client', 'description', 'cover', 'url']) {
    article.querySelector(`[name=${name}]`).value = project[name] || '';
  }
  const setTitle = () => { summary.textContent = title.value.trim() || 'Новый проект'; };
  title.addEventListener('input', setTitle);
  setTitle();

  article.querySelector('[data-remove]').addEventListener('click', () => {
    if (window.confirm(`Убрать «${summary.textContent}» из списка проектов?`)) {
      article.remove();
      status.textContent = 'Проект убран из редактора. Сохрани изменения, чтобы убрать его с сайта.';
    }
  });
  details.open = open;
  list.append(article);
  if (open) title.focus();
}

async function load() {
  exportBox.hidden = true;
  status.textContent = 'Загружаю портфолио…';
  try {
    const hosted = !location.hostname.endsWith('.github.io') && location.protocol === 'https:';
    const response = await fetch(hosted ? '/api/content' : '../content.json', { cache:'no-store' });
    if (!response.ok) throw Error('Не удалось загрузить опубликованные данные.');
    const payload = await response.json();
    const data = normalize(hosted ? payload.data : payload);
    revision = hosted ? payload.sha : '';
    bio.value = data.intro;
    list.replaceChildren();
    data.projects.forEach((project) => add(project));
    publish.textContent = revision ? 'Опубликовать' : 'Сохранить для GitHub';
    form.hidden = false;
    status.textContent = '';
  } catch (error) { status.textContent = error.message; }
}

document.querySelector('#add').addEventListener('click', () => add({}, true));
document.querySelector('#reload').addEventListener('click', () => {
  if (window.confirm('Загрузить опубликованную версию? Изменения в редакторе будут сброшены.')) load();
});
form.addEventListener('invalid', (event) => {
  if (event.target.closest('details')) event.target.closest('details').open = true;
}, true);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  publish.disabled = true;
  try {
    const projects = [...list.children].map((article) =>
      Object.fromEntries([...article.querySelectorAll('[name]')].map(({name,value}) => [name,value]))
    );
    const data = normalize({ intro: bio.value, projects });
    if (!revision) {
      exportText.value = JSON.stringify(data, null, 2) + '\n';
      exportBox.hidden = false;
      exportText.focus();
      status.textContent = 'Данные готовы для сохранения в GitHub.';
      return;
    }
    const result = await fetch('/api/content', {
      method:'PUT', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ sha:revision, data }),
    });
    const response = await result.json();
    if (!result.ok) throw Error(response.error);
    revision = response.sha;
    status.textContent = 'Изменения сохранены. GitHub Pages обновит сайт после сборки.';
  } catch (error) { status.textContent = error.message; }
  finally { publish.disabled = false; }
});

document.querySelector('#copy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(exportText.value);
    status.textContent = 'Текст скопирован.';
  } catch {
    exportText.select();
    status.textContent = 'Текст выделен. Скопируй его через меню или сочетание клавиш.';
  }
});
load();
