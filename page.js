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
  setModes(next.length ? next : [mode]);
}));

/* Word links: the same DOM-only highlighting as the app's word-link-interaction. */
let hovered = '', pinned = '';
function paintWord(key) {
  scope.querySelectorAll('[data-word-link]').forEach(node => node.classList.toggle('word-link-active', !!key && node.dataset.wordLink === key));
}
const keyOf = target => target instanceof Element ? target.closest('[data-word-link]')?.dataset.wordLink || '' : '';
const linkedOn = () => scope.dataset.wordLinks === 'on';
scope.addEventListener('pointerover', event => { if (event.pointerType !== 'touch' && linkedOn()) { hovered = keyOf(event.target); paintWord(hovered || pinned); } });
scope.addEventListener('pointerleave', () => { hovered = ''; paintWord(pinned); });
scope.addEventListener('click', event => {
  if (!linkedOn()) return;
  const key = keyOf(event.target);
  pinned = key && pinned !== key ? key : '';
  paintWord(hovered || pinned);
});
scope.addEventListener('focusin', event => { if (linkedOn()) paintWord(keyOf(event.target)); });
scope.addEventListener('focusout', () => paintWord(pinned));
scope.addEventListener('keydown', event => {
  if (!linkedOn()) return;
  if (event.key === 'Escape') { pinned = ''; paintWord(''); }
  if (event.key === 'Enter' || event.key === ' ') { const key = keyOf(event.target); if (key) { event.preventDefault(); pinned = pinned === key ? '' : key; paintWord(pinned); } }
});
scope.querySelectorAll('.word-link-source[data-word-link]').forEach(node => { node.tabIndex = 0; });
setModes(currentModes());

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
    for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target); }
  }, { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.tile, .app-window, .group-cta, .project, .steps li').forEach(node => { node.classList.add('reveal'); observer.observe(node); });
}
