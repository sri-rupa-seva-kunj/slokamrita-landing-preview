const root = document.documentElement;
const en = root.lang === 'en';
const query = new URLSearchParams(location.search);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

/* Theme: ?theme= wins, then the saved choice, then the system setting (resolved inline in <head>). */
const theme = document.querySelector('#theme');
function setTheme(value) {
  root.dataset.theme = value;
  theme.setAttribute('aria-pressed', String(value === 'dark'));
  const otherEdition = document.querySelector('.edition-switch a:not([aria-current])');
  const url = new URL(otherEdition.href);
  if (url.protocol === 'file:' && url.pathname.endsWith('/')) url.pathname += 'index.html';
  if (value === 'dark') url.searchParams.set('theme', 'dark');
  else url.searchParams.delete('theme');
  otherEdition.href = url.href;
}
setTheme(root.dataset.theme === 'dark' ? 'dark' : 'light');
theme.addEventListener('click', () => {
  const next = root.dataset.theme === 'light' ? 'dark' : 'light';
  setTheme(next);
  try { localStorage.setItem('slokamrita-landing-theme', next); } catch {}
});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
  let saved = null;
  try { saved = localStorage.getItem('slokamrita-landing-theme'); } catch {}
  if (!query.get('theme') && !saved) setTheme(event.matches ? 'dark' : 'light');
});

/* App window: tabs and translation modes behave like the verse page in Slokamrita. */
const app = document.querySelector('[data-app-window]');
const readingBox = app.querySelector('.app-reading');
const tabs = [...app.querySelectorAll('[data-tab]')];
const panels = [...app.querySelectorAll('[data-panel]')];
const modeButtons = [...app.querySelectorAll('[data-mode]')];
const scope = app.querySelector('.word-links-scope');
const hint = app.querySelector('[data-hint-wbw]');

function showTab(name) {
  for (const tab of tabs) tab.setAttribute('aria-selected', String(tab.dataset.tab === name));
  for (const panel of panels) panel.hidden = panel.dataset.panel !== name;
}
function setModes(modes) {
  for (const button of modeButtons) button.setAttribute('aria-pressed', String(modes.includes(button.dataset.mode)));
  readingBox.dataset.modes = modes.join(' ');
  const linked = modes.includes('wordByWord');
  scope.dataset.wordLinks = linked ? 'on' : 'off';
  hint.hidden = !linked;
  if (!linked) paintWord('');
}
const currentModes = () => modeButtons.filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.dataset.mode);
tabs.forEach(tab => tab.addEventListener('click', () => showTab(tab.dataset.tab)));
tabs.forEach((tab, index) => tab.addEventListener('keydown', event => {
  const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
  if (!step) return;
  const next = tabs[(index + step + tabs.length) % tabs.length];
  next.focus(); showTab(next.dataset.tab);
}));
modeButtons.forEach(button => button.addEventListener('click', () => {
  const modes = currentModes();
  const mode = button.dataset.mode;
  const next = modes.includes(mode) ? modes.filter(m => m !== mode) : [...modes, mode];
  setModes(next);
}));

/* Word links: the same DOM-only highlighting as the app's word-link-interaction. */
const keyOf = target => target instanceof Element ? target.closest('[data-word-link]')?.dataset.wordLink || '' : '';
function wireWordLinks(root) {
  let hovered = '', pinned = '';
  const paint = key => root.querySelectorAll('[data-word-link]').forEach(node => node.classList.toggle('word-link-active', !!key && node.dataset.wordLink === key));
  const on = () => root.dataset.wordLinks === 'on';
  root.addEventListener('pointerover', event => { if (event.pointerType !== 'touch' && on()) { hovered = keyOf(event.target); paint(hovered || pinned); } });
  root.addEventListener('pointerleave', () => { hovered = ''; paint(pinned); });
  root.addEventListener('click', event => {
    if (!on()) return;
    const key = keyOf(event.target);
    pinned = key && pinned !== key ? key : '';
    paint(hovered || pinned);
  });
  root.addEventListener('focusin', event => { if (on()) paint(keyOf(event.target)); });
  root.addEventListener('focusout', () => paint(pinned));
  root.addEventListener('keydown', event => {
    if (!on()) return;
    if (event.key === 'Escape') { pinned = ''; paint(''); }
    if (event.key === 'Enter' || event.key === ' ') { const key = keyOf(event.target); if (key) { event.preventDefault(); pinned = pinned === key ? '' : key; paint(pinned); } }
  });
  return { reset() { pinned = ''; hovered = ''; paint(''); } };
}
const readingLinks = wireWordLinks(scope);
function paintWord(key) { if (!key) readingLinks.reset(); }
scope.querySelectorAll('.word-link-source[data-word-link]').forEach(node => { node.tabIndex = 0; });
setModes(currentModes());

/* Slides tab: a working slide-show viewer. The verse is a copy of the reading block;
   the rail sets what is shown, hides the title, and expands the slide to full screen. */
const slide = app.querySelector('[data-slide]');
const slideSurface = app.querySelector('#app-reading-content').cloneNode(true);
slideSurface.removeAttribute('id');
const slideScope = slideSurface.querySelector('.word-links-scope');
slide.querySelector('[data-slide-body]').append(slideSurface);
const settingsButton = slide.querySelector('[data-slide-settings]');
const slideMenu = slide.querySelector('.slide-menu');
const slideModes = [...slide.querySelectorAll('[data-slide-mode]')];
function setSlideModes() {
  const modes = slideModes.filter(b => b.getAttribute('aria-checked') === 'true').map(b => b.dataset.slideMode);
  slide.dataset.modes = modes.join(' ');
  const linked = modes.includes('wordByWord') && modes.includes('sanskrit');
  slideScope.dataset.wordLinks = linked ? 'on' : 'off';
  slideScope.querySelectorAll('.word-link-source[data-word-link]').forEach(node => { node.tabIndex = linked ? 0 : -1; });
}
const slideLinks = wireWordLinks(slideScope);
setSlideModes();
function openMenu(open, focus) {
  settingsButton.setAttribute('aria-expanded', String(open));
  slideMenu.hidden = !open;
  if (open && focus) slideModes[0].focus({ preventScroll: true });
}
settingsButton.addEventListener('click', event => openMenu(slideMenu.hidden, event.detail === 0));
slideModes.forEach((button, index) => {
  button.addEventListener('click', () => {
    button.setAttribute('aria-checked', String(button.getAttribute('aria-checked') !== 'true'));
    slideLinks.reset();
    setSlideModes();
  });
  button.addEventListener('keydown', event => {
    const step = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
    if (step) { event.preventDefault(); slideModes[(index + step + slideModes.length) % slideModes.length].focus(); }
    if (event.key === 'Escape') { openMenu(false); settingsButton.focus(); }
  });
});
document.addEventListener('pointerdown', event => { if (!slideMenu.hidden && !event.target.closest('.slide-settings')) openMenu(false); });
const fullButton = slide.querySelector('[data-slide-full]');
if (!slide.requestFullscreen) fullButton.hidden = true;
fullButton.addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else slide.requestFullscreen?.().catch(() => {});
});
document.addEventListener('fullscreenchange', () => {
  const full = document.fullscreenElement === slide;
  fullButton.children[0].hidden = full;
  fullButton.children[1].hidden = !full;
  const label = full ? fullButton.dataset.labelExit : fullButton.dataset.labelEnter;
  fullButton.setAttribute('aria-label', label);
  fullButton.title = label;
});
const chromeButton = slide.querySelector('[data-slide-chrome]');
const chromeLabels = en ? ['Hide the title', 'Show the title'] : ['Скрыть название', 'Показать название'];
chromeButton.addEventListener('click', () => {
  const hide = chromeButton.getAttribute('aria-pressed') !== 'true';
  chromeButton.setAttribute('aria-pressed', String(hide));
  slide.dataset.chrome = hide ? 'hidden' : 'shown';
  chromeButton.children[0].hidden = hide;
  chromeButton.children[1].hidden = !hide;
  chromeButton.setAttribute('aria-label', chromeLabels[hide ? 1 : 0]);
  chromeButton.title = chromeLabels[hide ? 1 : 0];
});

/* Recording card player, styled after the Materials tab. */
const audio = document.querySelector('#recitation');
const row = app.querySelector('.app-record-row');
const listen = row.querySelector('.app-listen');
const play = row.querySelector('.app-play');
const close = row.querySelector('.app-close');
const seek = row.querySelector('.app-seek');
const current = row.querySelector('.app-current');
const total = row.querySelector('.app-total');
const errorText = document.querySelector('#recitation-error');
const labels = en ? { play: 'Play', pause: 'Pause' } : { play: 'Воспроизвести', pause: 'Пауза' };
const formatTime = seconds => { const whole = Math.floor(seconds || 0); return Math.floor(whole / 60) + ':' + String(whole % 60).padStart(2, '0'); };
function updatePlayer() {
  const playing = !audio.paused && !audio.ended;
  const loaded = Number.isFinite(audio.duration);
  play.children[0].hidden = !playing;
  play.children[1].hidden = playing;
  play.setAttribute('aria-label', playing ? labels.pause : labels.play);
  play.title = play.getAttribute('aria-label');
  seek.max = String(loaded ? audio.duration : 15);
  seek.value = String(audio.currentTime);
  seek.style.setProperty('--progress', ((audio.currentTime / (loaded ? audio.duration : 15)) * 100 || 0) + '%');
  current.textContent = formatTime(audio.currentTime);
  total.textContent = formatTime(loaded ? audio.duration : 15);
  seek.setAttribute('aria-valuetext', current.textContent + ' / ' + total.textContent);
}
for (const event of ['play', 'pause', 'ended', 'loadedmetadata', 'timeupdate']) audio.addEventListener(event, updatePlayer);
audio.addEventListener('error', () => { errorText.hidden = false; row.dataset.player = 'idle'; updatePlayer(); });
async function start() {
  errorText.hidden = true;
  row.dataset.player = 'active';
  if (audio.error) audio.load();
  try { await audio.play(); } catch (error) { if (error.name !== 'AbortError') { errorText.hidden = false; row.dataset.player = 'idle'; } }
  updatePlayer();
}
listen.addEventListener('click', () => { start(); play.focus({ preventScroll: true }); });
play.addEventListener('click', () => { if (audio.paused) start(); else audio.pause(); });
close.addEventListener('click', () => { audio.pause(); audio.currentTime = 0; row.dataset.player = 'idle'; updatePlayer(); listen.focus({ preventScroll: true }); });
seek.addEventListener('input', () => { audio.currentTime = Number(seek.value); updatePlayer(); });
updatePlayer();

/* Bento tiles open the matching state of the app window. */
const demos = {
  wordlinks: () => { showTab('verse'); setModes(['interlinear', 'wordByWord']); },
  guru: () => { showTab('verse'); setModes(['literary']); },
  interlinear: () => { showTab('verse'); setModes(['interlinear']); },
  audio: () => showTab('materials'),
  slides: () => showTab('slides'),
};
document.querySelectorAll('[data-demo]').forEach(link => link.addEventListener('click', () => {
  demos[link.dataset.demo]?.();
  app.classList.remove('app-window-flash');
  void app.offsetWidth;
  app.classList.add('app-window-flash');
}));

/* Features: on wider screens a list beside one detail card, switched as a vertical carousel
   (the old card shrinks and fades out, the new one grows in from the direction of travel);
   on phones every entry is a collapsed row with its title and a short line, opened in place. */
const phoneLayout = matchMedia('(max-width: 760px)');
const explorer = document.querySelector('[data-feature-explorer]');
const featureToggles = [...explorer.querySelectorAll('.feature-toggle')];
const panelOf = toggle => document.getElementById(toggle.getAttribute('aria-controls'));
let activeFeature = 0;
const leaveTimers = new Map();
function finishLeaving(panel) {
  clearTimeout(leaveTimers.get(panel));
  leaveTimers.delete(panel);
  panel.classList.remove('is-leaving');
  if (!panel.classList.contains('is-current')) panel.hidden = true;
}
function showFeature(index, animate) {
  const previous = activeFeature;
  activeFeature = index;
  featureToggles.forEach((toggle, i) => {
    toggle.setAttribute('aria-expanded', String(i === index));
    panelOf(toggle).classList.toggle('is-current', i === index);
  });
  if (!animate || previous === index || reduceMotion.matches) {
    featureToggles.forEach((toggle, i) => { const panel = panelOf(toggle); clearTimeout(leaveTimers.get(panel)); panel.classList.remove('is-entering', 'is-leaving'); panel.hidden = i !== index; });
    return;
  }
  // Cards still leaving from an earlier switch disappear at once.
  featureToggles.forEach((toggle, i) => { const panel = panelOf(toggle); if (i !== index && i !== previous && !panel.hidden) finishLeaving(panel); });
  explorer.style.setProperty('--dir', index > previous ? '1' : '-1');
  const outgoing = panelOf(featureToggles[previous]);
  outgoing.classList.add('is-leaving');
  clearTimeout(leaveTimers.get(outgoing));
  leaveTimers.set(outgoing, setTimeout(() => finishLeaving(outgoing), 750));
  const incoming = panelOf(featureToggles[index]);
  clearTimeout(leaveTimers.get(incoming));
  incoming.classList.remove('is-leaving');
  incoming.classList.add('is-entering');
  incoming.hidden = false;
  void incoming.offsetWidth;
  incoming.classList.remove('is-entering');
}
function layoutFeatures() {
  if (phoneLayout.matches) {
    featureToggles.forEach(toggle => {
      const panel = panelOf(toggle);
      toggle.setAttribute('aria-expanded', 'false');
      panel.hidden = true;
      panel.classList.remove('is-entering', 'is-leaving', 'is-current');
    });
  } else showFeature(activeFeature, false);
}
featureToggles.forEach((toggle, index) => {
  toggle.addEventListener('click', () => {
    if (phoneLayout.matches) {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      panelOf(toggle).hidden = !open;
    } else showFeature(index, true);
  });
  toggle.addEventListener('keydown', event => {
    if (phoneLayout.matches) return;
    const step = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (index + step + featureToggles.length) % featureToggles.length;
    featureToggles[next].focus();
    showFeature(next, true);
  });
});
phoneLayout.addEventListener('change', layoutFeatures);
layoutFeatures();

/* "Share" from the former About page: the system share sheet, or copy the link. */
for (const button of document.querySelectorAll('[data-share]')) {
  const status = button.closest('div').parentElement.querySelector('.share-status');
  button.addEventListener('click', async () => {
    const data = { title: button.dataset.shareTitle, text: button.dataset.shareText, url: location.origin + location.pathname };
    if (navigator.share) {
      try { await navigator.share(data); } catch {}
      return;
    }
    try {
      await navigator.clipboard.writeText(data.url);
      status.textContent = button.dataset.copied;
      setTimeout(() => { status.textContent = ''; }, 2500);
    } catch {}
  });
}

/* Hero photo tilt (mouse only, keeps the last position). */
const enableTilt = matchMedia('(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)');
for (const photo of document.querySelectorAll('[data-photo-tilt]')) {
  photo.addEventListener('pointermove', event => {
    if (!enableTilt.matches || event.pointerType !== 'mouse') return;
    const rect = photo.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    photo.style.setProperty('--photo-depth', Math.max(1800, rect.width * 1.6, rect.height * 2) + 'px');
    photo.style.setProperty('--photo-rx', (-y * 5).toFixed(2) + 'deg');
    photo.style.setProperty('--photo-ry', (x * 6).toFixed(2) + 'deg');
    photo.style.setProperty('--photo-x', (-x * 1.1).toFixed(2) + '%');
    photo.style.setProperty('--photo-y', (-y * 1.1).toFixed(2) + '%');
    photo.style.setProperty('--photo-scale', '1.075');
  });
}

/* Gentle reveal of sections as they enter the viewport. */
if ('IntersectionObserver' in window && !reduceMotion.matches) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const node = entry.target;
      node.classList.add('in-view');
      observer.unobserve(node);
      setTimeout(() => node.classList.remove('reveal', 'in-view'), 1000);
    }
  }, { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.feature-explorer, .app-window, .group-cta, .project, .steps li').forEach(node => { node.classList.add('reveal'); observer.observe(node); });
}
