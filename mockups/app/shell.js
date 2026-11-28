/* Shared parts of the mockups, copied from the live app's markup (slokamrita.com):
   header, footer and the phone tab bar, plus the mockup strip on top (not part of the design).
   New entries: the «Лекции» and «Блог» icons in the header and footer, «Блог» in the phone tab bar. */
(() => {
  const root = document.documentElement;
  const saved = (() => { try { return localStorage.getItem('slokamrita-mock-theme'); } catch { return null; } })();
  const setTheme = theme => { root.dataset.theme = theme; root.style.colorScheme = theme; };
  setTheme(saved || 'dark');

  const icon = (name, size = 24, extra = '', stroke = 1.25) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-${name} ${extra}" aria-hidden="true">${window.APP_ICONS[name] || ''}</svg>`;
  window.appIcon = icon;
  const paint = scope => scope.querySelectorAll('i[data-i]').forEach(node => {
    node.outerHTML = icon(node.dataset.i, +(node.dataset.size || 24), node.className || '', +(node.dataset.stroke || 1.25));
  });
  window.appPaint = paint;

  const pages = [
    ['index.html', 'Все макеты'],
    ['lectures.html', 'Шлоки для лекций'],
    ['blog.html', 'Блог'],
    ['article.html', 'Статья'],
    ['admin-blog.html', 'Админка: статьи'],
  ];
  const here = location.pathname.split('/').pop() || 'index.html';
  const strip = document.createElement('div');
  strip.className = 'mock-strip';
  strip.innerHTML = `<strong>МАКЕТ</strong><nav>${pages.map(([href, label]) => `<a href="${href}"${href === here ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav><button type="button" data-theme-toggle>Светлая / тёмная</button>`;
  document.body.prepend(strip);
  strip.querySelector('[data-theme-toggle]').addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try { localStorage.setItem('slokamrita-mock-theme', next); } catch {}
  });

  const roundBtn = (label, name, href, isNew) =>
    `<a href="${href}" aria-label="${label}" title="${label}" class="hide-on-mobile flex items-center justify-center w-[33px] h-[33px] rounded-full bg-[#ededee] dark:bg-dark-tertiary transition hover:bg-[#e0e0e1] dark:hover:bg-dark-secondary [&amp;&gt;svg]:!w-[21px] [&amp;&gt;svg]:!h-[21px] relative"${isNew ? ' data-new' : ''}>${icon(name, 28, 'text-text-light-secondary dark:text-text-dark-secondary hover:text-accent-brown dark:hover:text-accent-gold transition-colors')}</a>`;
  const icons = `<div class="flex items-center gap-2 flex-shrink-0 ml-4">${roundBtn('Лекции', 'presentation', 'lectures.html')}${roundBtn('Блог', 'newspaper', 'blog.html')}${roundBtn('Мои шлоки', 'book-open', '#')}${roundBtn('Профиль', 'user', '#')}${roundBtn('Настройки', 'settings', '#')}</div>`;

  // <header data-app-header> or <header data-app-header data-back="url">
  window.appHeader = back => {
    const logo = back
      ? `<a href="${back}" aria-label="Вернуться назад" class="h-6 -ml-1.5 pr-2 rounded-md transition flex items-center justify-center">${icon('arrow-left', 24, 'text-text-light-primary dark:text-text-dark-primary hover:text-accent-brown dark:hover:text-accent-gold')}</a><a href="${back}" class="text-base font-secondary font-semibold text-text-light-primary dark:text-text-dark-primary flex-1 flex items-center min-w-0 text-left hover:text-accent-brown dark:hover:text-accent-gold transition">Назад</a><a class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center cursor-pointer" href="index.html"><div class="md:!hidden" style="display:block"><img alt="Шлокамрита" class="h-[50px] w-auto" src="app/logos/key.svg"></div><div class="md:!block" style="display:none"><img alt="Шлокамрита" class="h-[50px] w-auto block dark:hidden" src="app/logos/inner_w.svg"><img alt="Шлокамрита" class="h-[50px] w-auto hidden dark:block" src="app/logos/inner_d.svg"></div></a>`
      : `<a class="flex items-center cursor-pointer" href="index.html"><img alt="Шлокамрита" class="h-[65px] w-auto max-w-[70vw] block dark:hidden" src="app/logos/index_ru_w.svg"><img alt="Шлокамрита" class="h-[65px] w-auto max-w-[70vw] hidden dark:block" src="app/logos/index_ru_d.svg"></a>`;
    return `<div class="public-app-header z-sticky bg-light-primary dark:bg-dark-primary border-b border-light-tertiary dark:border-dark-tertiary h-[80px] md:h-[100px] overflow-hidden"><div class="relative flex items-center justify-between px-md h-[80px] md:h-[100px]"><div class="flex items-center gap-2">${logo}</div>${icons}</div></div>`;
  };

  const footBtn = (label, inner, href, isNew, hideOnMobile) =>
    `<a href="${href}" class="${hideOnMobile ? 'hide-on-mobile ' : ''}flex flex-col items-center gap-xs px-sm py-sm rounded-md transition text-text-light-secondary dark:text-text-dark-secondary hover:text-accent-brown dark:hover:text-accent-gold relative"${isNew ? ' data-new' : ''}><div class="flex items-center justify-center h-6">${inner}</div><span class="text-xs font-secondary">${label}</span></a>`;
  const fillFooter = footer => {
    footer.outerHTML = `<footer class="pt-sm pb-sm border-t border-light-tertiary dark:border-dark-tertiary"><div class="flex justify-center items-end gap-sm">${footBtn('О проекте', '<div class="w-6 h-6"><img alt="" class="w-full h-full object-contain mock-sign" src="app/logos/slokamrita_sign.svg"></div>', '#')}${footBtn('Лекции', icon('presentation', 22), 'lectures.html')}${footBtn('Блог', icon('newspaper', 22), 'blog.html')}${footBtn('Мои шлоки', icon('book-open', 22), '#', false, true)}${footBtn('Профиль', icon('user', 22), '#', false, true)}${footBtn('Настройки', icon('settings', 22), '#', false, true)}${footBtn('Ошибка?', icon('circle-alert', 22), '#')}</div><div class="flex flex-col items-center gap-xs sm:flex-row sm:flex-wrap sm:justify-center sm:gap-md text-sm font-secondary px-md py-sm mt-sm"><span class="flex items-center gap-md"><a class="text-text-light-secondary dark:text-text-dark-secondary hover:text-accent-brown dark:hover:text-accent-gold transition-colors" href="#">Условия использования</a><span class="hidden sm:inline text-text-light-tertiary dark:text-text-dark-tertiary">•</span></span><span class="flex items-center gap-md"><a class="text-text-light-secondary dark:text-text-dark-secondary hover:text-accent-brown dark:hover:text-accent-gold transition-colors" href="#">Политика конфиденциальности</a></span></div><div class="text-center text-xs font-secondary text-text-light-tertiary dark:text-text-dark-tertiary py-sm">© Sri Rupa Seva Kunj</div></footer>`;
  };
  // Fills <header data-app-header [data-back]>, <footer data-app-footer> and <i data-i> icons; pages call it after redrawing.
  window.appRefresh = () => {
    document.querySelectorAll('header[data-app-header]').forEach(node => { node.outerHTML = window.appHeader(node.dataset.back); });
    document.querySelectorAll('footer[data-app-footer]').forEach(fillFooter);
    paint(document);
  };

  // Phone tab bar: the app's four items plus «Блог».
  const tab = document.body.dataset.tab;
  if (tab) {
    const items = [['home', 'index.html', 'Главная', 'house'], ['verses', '#', 'Мои шлоки', 'book-open'], ['blog', 'blog.html', 'Блог', 'newspaper'], ['profile', '#', 'Профиль', 'user'], ['settings', '#', 'Настройки', 'settings']];
    const nav = document.createElement('nav');
    nav.className = 'mobile-tab-bar lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-light-secondary dark:bg-dark-secondary border-t border-light-tertiary dark:border-dark-tertiary';
    nav.setAttribute('aria-label', 'Основная навигация');
    nav.innerHTML = `<ul class="flex min-h-14 items-stretch justify-around" style="padding-left:12px;padding-right:12px">${items.map(([key, href, label, name]) => `<li class="flex-1"><a href="${href}" aria-label="${label}"${key === tab ? ' aria-current="page"' : ''} class="flex w-full flex-col items-center justify-center gap-0.5 border-0 bg-transparent py-2 px-1 outline-none relative ${key === tab ? 'text-accent-brown dark:text-accent-gold' : 'text-text-light-secondary dark:text-text-dark-secondary'}">${icon(name, 22)}<span class="text-[10px] font-secondary leading-tight">${label}</span></a></li>`).join('')}</ul>`;
    document.body.append(nav);
  }
  window.appRefresh();
})();
