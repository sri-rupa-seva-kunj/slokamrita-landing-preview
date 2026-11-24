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
  document.querySelector('#app-slides iframe')?.contentWindow?.postMessage({ type: 'slokamrita-slides-theme', theme: value }, '*');
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

let shownTab = 'verse';
function showTab(name) {
  for (const tab of tabs) tab.setAttribute('aria-selected', String(tab.dataset.tab === name));
  if (name === 'slides') { openSlides(); return; }
  shownTab = name;
  closeSlides();
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

/* Slides tab: Slokamrita's own slide-show viewer (slideshow/viewer.html, copied from the app),
   opened over the window as the app opens it over the verse page, and fed the same init message. */
const slidesBox = app.querySelector('#app-slides');
const slidesFrame = slidesBox.querySelector('iframe');
let slidesLoaded = false;
const slidesInit = () => ({
  type: 'slokamrita-slides-init',
  samples: [window.SLOKAMRITA_SLIDES[en ? 'en' : 'ru']],
  initialIndex: 0,
  locale: en ? 'en' : 'ru',
  theme: root.dataset.theme === 'dark' ? 'dark' : 'light',
  native: false,
  visible: { sanskrit: true, interlinear: false, word: true, literary: true },
  icons: window.SLOKAMRITA_SLIDES.icons,
});
const postSlides = message => slidesFrame.contentWindow?.postMessage(message, '*');
function openSlides() {
  if (!slidesBox.hidden) return;
  slidesBox.hidden = false;
  root.classList.add('slides-open');
  if (!slidesLoaded) { slidesLoaded = true; slidesFrame.src = slidesFrame.dataset.src; }
  else postSlides(slidesInit());
  slidesFrame.focus({ preventScroll: true });
}
function closeSlides() {
  if (slidesBox.hidden) return;
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  slidesBox.hidden = true;
  root.classList.remove('slides-open');
}
addEventListener('message', event => {
  if (event.source !== slidesFrame.contentWindow || !event.data || typeof event.data !== 'object') return;
  const { type } = event.data;
  if (type === 'slokamrita-slides-ready') postSlides(slidesInit());
  if (type === 'slokamrita-slides-close') { showTab(shownTab); tabs.find(tab => tab.dataset.tab === shownTab)?.focus({ preventScroll: true }); }
});
// The viewer's full-screen button fills the screen with this page, so the viewer then covers it all.
document.addEventListener('fullscreenchange', () => slidesBox.classList.toggle('is-fullscreen', document.fullscreenElement === root && !slidesBox.hidden));

/* Materials: Recordings and Comments, as in the app. */
const subtabs = [...app.querySelectorAll('[data-subtab]')];
subtabs.forEach(button => button.addEventListener('click', () => {
  for (const other of subtabs) other.setAttribute('aria-pressed', String(other === button));
  app.querySelectorAll('[data-subpanel]').forEach(panel => { panel.hidden = panel.dataset.subpanel !== button.dataset.subtab; });
}));

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

/* Features: on wider screens a list beside a drum of detail cards. The chosen card faces the reader;
   its neighbours stay in sight above and below, smaller and turned away, and fade out through
   the soft edges of the window. On phones every entry is a collapsed row opened in place. */
const phoneLayout = matchMedia('(max-width: 760px)');
const explorer = document.querySelector('[data-feature-explorer]');
const drum = document.querySelector('[data-feature-drum]');
const featureToggles = [...explorer.querySelectorAll('.feature-toggle')];
const panelOf = toggle => document.getElementById(toggle.getAttribute('aria-controls'));
const featurePanels = featureToggles.map(panelOf);
let activeFeature = 0;
function sizeDrum() {
  const tallest = Math.max(...featurePanels.map(panel => panel.offsetHeight));
  const peek = Math.round(Math.min(130, Math.max(80, innerHeight * 0.12)));
  drum.style.setProperty('--drum-h', tallest + peek * 2 + 'px');
  drum.style.setProperty('--drum-fade', peek + 'px');
}
function turnDrum() {
  featurePanels.forEach((panel, i) => {
    const offset = i - activeFeature;
    const distance = Math.abs(offset);
    const current = offset === 0;
    panel.hidden = false;
    panel.classList.toggle('is-current', current);
    panel.setAttribute('aria-hidden', String(!current));
    panel.querySelectorAll('a,button').forEach(node => { node.tabIndex = current ? 0 : -1; });
    panel.style.zIndex = String(10 - distance);
    panel.style.opacity = distance === 0 ? '1' : distance === 1 ? '.62' : '0';
    panel.style.pointerEvents = distance > 1 ? 'none' : '';
    const shift = Math.sign(offset) * (distance === 0 ? 0 : 62 + (distance - 1) * 26);
    panel.style.transform = `translateY(calc(-50% + ${shift}%)) rotateX(${-offset * 24}deg) scale(${Math.max(0.6, 1 - distance * 0.15)})`;
  });
}
function showFeature(index) {
  activeFeature = (index + featurePanels.length) % featurePanels.length;
  featureToggles.forEach((toggle, i) => toggle.setAttribute('aria-expanded', String(i === activeFeature)));
  turnDrum();
}
function layoutFeatures() {
  if (phoneLayout.matches) {
    featurePanels.forEach((panel, i) => {
      featureToggles[i].closest('li').append(panel);
      featureToggles[i].setAttribute('aria-expanded', 'false');
      panel.hidden = true;
      panel.classList.remove('is-current');
      panel.removeAttribute('aria-hidden');
      panel.removeAttribute('style');
      panel.querySelectorAll('a,button').forEach(node => node.removeAttribute('tabindex'));
    });
  } else {
    featurePanels.forEach(panel => { panel.hidden = false; drum.append(panel); });
    sizeDrum();
    showFeature(activeFeature);
  }
}
featureToggles.forEach((toggle, index) => {
  toggle.addEventListener('click', () => {
    if (phoneLayout.matches) {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      panelOf(toggle).hidden = !open;
    } else showFeature(index);
  });
  toggle.addEventListener('keydown', event => {
    if (phoneLayout.matches) return;
    const step = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (index + step + featureToggles.length) % featureToggles.length;
    featureToggles[next].focus();
    showFeature(next);
  });
});
// A neighbour card peeking out of the drum turns it to that card.
drum.addEventListener('click', event => {
  const panel = event.target.closest('.feature-panel');
  if (!panel || panel.classList.contains('is-current')) return;
  event.preventDefault();
  showFeature(featurePanels.indexOf(panel));
});
phoneLayout.addEventListener('change', layoutFeatures);
addEventListener('resize', () => { if (!phoneLayout.matches) sizeDrum(); });
document.fonts?.ready.then(() => { if (!phoneLayout.matches) sizeDrum(); });
featurePanels.forEach(panel => panel.querySelector('img')?.addEventListener('load', () => { if (!phoneLayout.matches) sizeDrum(); }));
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
