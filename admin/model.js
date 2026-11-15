export const categories = {
  advertising: { label: 'Реклама', filters: ['Оффлайн', 'Digital'] },
  identity: { label: 'Айдентика', filters: ['Брендбуки', 'Мерч'] },
  editions: { label: 'Издания', filters: ['Печатные', 'Цифровые'] },
  presentations: { label: 'Презентации', filters: [] },
  pets: { label: 'Pets', filters: [] },
};

export function safeUrl(value) {
  if (!value) return '';
  const url = new URL(value);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Разрешены ссылки http и https.');
  }
  return url.href;
}

function cleanText(value, name, max, required = false) {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) {
    throw new Error(`Проверь поле «${name}».`);
  }
  return value.trim();
}

export function normalize(data) {
  if (!data || !Array.isArray(data.projects) || data.projects.length > 100) {
    throw new Error('Можно сохранить до 100 проектов.');
  }
  return {
    intro: cleanText(data.intro, 'Описание', 650, true),
    projects: data.projects.map((project) => {
      if (!project || !Object.hasOwn(categories, project.category)) throw new Error('Выбери раздел проекта.');
      const { filters } = categories[project.category];
      const subcategory = project.subcategory || '';
      if (subcategory && !filters.includes(subcategory)) throw new Error('Проверь подраздел проекта.');
      return {
        title: cleanText(project.title, 'Название', 100, true),
        category: project.category,
        subcategory,
        description: cleanText(project.description ?? '', 'Краткое описание', 600),
        cover: safeUrl(cleanText(project.cover ?? '', 'Обложка', 1000)),
        url: safeUrl(cleanText(project.url ?? '', 'Ссылка', 1000)),
      };
    }),
  };
}
