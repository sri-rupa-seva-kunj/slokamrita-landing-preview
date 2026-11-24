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
// Every card in the drum gets the height of the tallest one, and the cards sit one after another
// with a gap: as the drum turns they slide along each other without ever overlapping, so no card
// passes over or under another.
const DRUM_GAP = 18;
let cardHeight = 0;
function sizeDrum() {
  drum.style.removeProperty('--card-h');
  cardHeight = Math.max(...featurePanels.map(panel => panel.offsetHeight));
  const room = innerHeight - 72 - 12;
  const peek = Math.round(Math.min(150, Math.max(70, (room - cardHeight) / 2)));
  drum.style.setProperty('--card-h', cardHeight + 'px');
  drum.style.setProperty('--drum-h', cardHeight + peek * 2 + 'px');
  drum.style.setProperty('--drum-fade', Math.round(peek * 0.6) + 'px');
  turnDrum();
}
const drumScale = distance => Math.max(0.6, 1 - distance * 0.12);
// Distance from the drum's middle to the middle of the card `distance` places away.
function drumOffset(distance) {
  let y = 0;
  for (let d = 1; d <= distance; d++) y += cardHeight * (drumScale(d - 1) + drumScale(d)) / 2 + DRUM_GAP;
  return y;
}
// Where a card stands `offset` places from the middle of the drum, and how clearly it shows.
function placeCard(panel, offset, opacity) {
  const distance = Math.abs(offset);
  const shift = Math.sign(offset) * drumOffset(distance);
  panel.style.opacity = String(opacity ?? (distance === 0 ? 1 : distance === 1 ? 0.7 : 0));
  panel.style.pointerEvents = distance > 1 ? 'none' : '';
  panel.style.transform = `translateY(calc(-50% + ${shift.toFixed(1)}px)) rotateX(${-Math.sign(offset) * 16}deg) scale(${drumScale(distance)})`;
}
// Moves a card without animating it (it is invisible at the time).
function teleport(panel, offset, opacity) {
  panel.style.transition = 'none';
  placeCard(panel, offset, opacity);
}
function markCurrent() {
  featurePanels.forEach((panel, i) => {
    const current = i === activeFeature;
    panel.hidden = false;
    panel.classList.toggle('is-current', current);
    panel.setAttribute('aria-hidden', String(!current));
    panel.querySelectorAll('a,button').forEach(node => { node.tabIndex = current ? 0 : -1; });
  });
}
function turnDrum() {
  markCurrent();
  featurePanels.forEach((panel, i) => placeCard(panel, i - activeFeature));
}
// A jump over several entries plays like a single step: the chosen card is slipped in, unseen,
// just past the current one's neighbour, the drum turns as if by one, and then the neighbours
// quietly fade over to the chosen card's real ones.
let jumpTimers = [];
function settleDrum() {
  jumpTimers.forEach(clearTimeout);
  jumpTimers = [];
  featurePanels.forEach(panel => { panel.style.transition = ''; });
}
function jumpDrum(from, to) {
  const step = Math.sign(to - from);
  const card = i => featurePanels[i];
  const exists = i => i >= 0 && i < featurePanels.length;
  const fadeOut = (panel, seconds) => {
    panel.style.transition = `opacity ${seconds}s linear`;
    panel.style.opacity = '0';
    panel.style.pointerEvents = 'none';
  };
  // The chosen card waits, unseen, two places out; the current neighbour on that side steps aside quickly.
  teleport(card(to), step * 2, 0);
  if (exists(to + step)) teleport(card(to + step), step * 3, 0);
  drum.getBoundingClientRect();
  settleDrum();
  markCurrent();
  placeCard(card(from), -step);
  // While the neighbour fades, the chosen card is still invisible; it shows only once that place is clear.
  card(to).style.transition = 'transform .95s cubic-bezier(.22,.8,.24,1),opacity .8s cubic-bezier(.22,.8,.24,1) .13s';
  placeCard(card(to), 0);
  if (exists(to + step)) placeCard(card(to + step), step);
  if (exists(from - step)) placeCard(card(from - step), -step * 2);
  if (card(from + step) !== card(to)) fadeOut(card(from + step), 0.12);
  // Then the card left behind gives its place to the chosen card's real neighbour: out first, then in.
  jumpTimers.push(setTimeout(() => {
    const before = card(to - step);
    if (before !== card(from)) fadeOut(card(from), 0.25);
    jumpTimers.push(setTimeout(() => {
      if (before !== card(from)) {
        teleport(before, -step, 0);
        drum.getBoundingClientRect();
        before.style.transition = 'opacity .3s linear';
        placeCard(before, -step);
      }
      jumpTimers.push(setTimeout(() => {
        featurePanels.forEach(panel => { panel.style.transition = 'none'; });
        turnDrum();
        drum.getBoundingClientRect();
        settleDrum();
      }, 320));
    }, 260));
  }, 950));
}
function showFeature(index) {
  const previous = activeFeature;
  activeFeature = (index + featurePanels.length) % featurePanels.length;
  featureToggles.forEach((toggle, i) => toggle.setAttribute('aria-expanded', String(i === activeFeature)));
  settleDrum();
  if (Math.abs(activeFeature - previous) > 1 && !reduceMotion.matches && cardHeight) jumpDrum(previous, activeFeature);
  else turnDrum();
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
// Phones: an accordion, one entry open at a time; panels slide open and shut.
function foldPanel(toggle, open) {
  const panel = panelOf(toggle);
  toggle.setAttribute('aria-expanded', String(open));
  panel.getAnimations().forEach(animation => animation.cancel());
  if (reduceMotion.matches) { panel.hidden = !open; return; }
  panel.hidden = false;
  const height = panel.scrollHeight + 'px';
  const frames = open
    ? [{ height: '0px', opacity: 0 }, { height, opacity: 1 }]
    : [{ height, opacity: 1 }, { height: '0px', opacity: 0 }];
  const animation = panel.animate(frames, { duration: open ? 420 : 320, easing: 'cubic-bezier(.22,.8,.24,1)' });
  animation.onfinish = () => { panel.hidden = !open; };
}
featureToggles.forEach((toggle, index) => {
  toggle.addEventListener('click', () => {
    if (phoneLayout.matches) {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      // An entry open above this one shuts at once and the page scrolls by the same amount
      // in the same frame, so the tapped title stays exactly where the finger is.
      const before = toggle.getBoundingClientRect().top;
      featureToggles.forEach((other, i) => {
        if (other === toggle || other.getAttribute('aria-expanded') !== 'true') return;
        if (i < index) {
          const panel = panelOf(other);
          panel.getAnimations().forEach(animation => animation.cancel());
          other.setAttribute('aria-expanded', 'false');
          panel.hidden = true;
        } else foldPanel(other, false);
      });
      const shift = toggle.getBoundingClientRect().top - before;
      if (shift) scrollBy({ top: shift, behavior: 'instant' });
      foldPanel(toggle, open);
      // Opened low on the screen, or too tall to fit below: the page glides up to the entry's start
      // while it opens.
      if (open) {
        const item = toggle.closest('li');
        const top = item.getBoundingClientRect().top;
        const bottom = top + toggle.offsetHeight + panelOf(toggle).scrollHeight;
        const headerBottom = document.querySelector('.site-header').getBoundingClientRect().bottom;
        if (top > innerHeight * 0.4 || bottom > innerHeight - 12) {
          scrollBy({ top: top - headerBottom - 10, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
        }
      }
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
// The screenshots in the features (and the AI shot beside «Мои шлоки») are fetched as soon as the page
// has loaded, not when they scroll into view, so a card never turns with an empty picture.
// Only the current theme's copies: the other theme's are fetched when the theme switches.
function fetchShots() {
  for (const img of document.querySelectorAll('.feature-panel img, .cabinet-shot img')) {
    if (img.loading === 'lazy' && getComputedStyle(img).display !== 'none') img.loading = 'eager';
  }
}
if (document.readyState === 'complete') fetchShots();
else addEventListener('load', fetchShots, { once: true });
new MutationObserver(() => requestAnimationFrame(fetchShots)).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

/* Team: as many columns as fit, then evened out so the rows hold about the same number of people
   (five people on room for four: three and two, not four and one). */
const teamList = document.querySelector('.team-list');
if (teamList) {
  const balanceTeam = () => {
    const count = teamList.children.length;
    const gap = parseFloat(getComputedStyle(teamList).columnGap) || 0;
    const fit = Math.max(1, Math.floor((teamList.clientWidth + gap) / (200 + gap)));
    const rows = Math.ceil(count / fit);
    teamList.style.setProperty('--team-cols', String(Math.ceil(count / rows)));
  };
  new ResizeObserver(balanceTeam).observe(teamList);
}

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

/* Phones and tablets: the header's section links in a panel that slides in from the right. */
{
  const headerNav = document.querySelector('.header-row>nav');
  const actions = document.querySelector('.header-actions');
  const library = document.querySelector('.header-library');
  const text = en ? { open: 'Menu', close: 'Close menu', title: 'Sections' } : { open: 'Меню', close: 'Закрыть меню', title: 'Разделы' };
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'menu-toggle';
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', 'site-menu');
  button.setAttribute('aria-label', text.open);
  button.innerHTML = '<span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span>';
  actions.append(button);

  const menu = document.createElement('div');
  menu.className = 'site-menu';
  menu.id = 'site-menu';
  menu.hidden = true;
  menu.innerHTML = `<div class="site-menu-backdrop" data-menu-close></div>
    <div class="site-menu-panel" role="dialog" aria-modal="true" aria-label="${text.title}">
      <div class="site-menu-head"><span>${text.title}</span><button type="button" class="site-menu-close" data-menu-close aria-label="${text.close}"><span aria-hidden="true"></span></button></div>
      <nav class="site-menu-links"></nav>
    </div>`;
  const links = menu.querySelector('.site-menu-links');
  headerNav.querySelectorAll('a').forEach((link, i) => {
    const copy = document.createElement('a');
    copy.href = link.getAttribute('href');
    copy.innerHTML = `<span class="site-menu-num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><span>${link.innerHTML}</span>`;
    copy.style.setProperty('--i', i);
    links.append(copy);
  });
  if (library) {
    const app = library.cloneNode(true);
    app.className = 'button primary site-menu-app';
    app.style.setProperty('--i', links.children.length);
    links.after(app);
  }
  document.body.append(menu);

  const panel = menu.querySelector('.site-menu-panel');
  let closeTimer;
  function setMenu(open) {
    clearTimeout(closeTimer);
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? text.close : text.open);
    root.classList.toggle('menu-open', open);
    if (open) {
      menu.hidden = false;
      void menu.offsetWidth;
      menu.classList.add('is-open');
      menu.querySelector('.site-menu-links a').focus({ preventScroll: true });
    } else {
      menu.classList.remove('is-open');
      closeTimer = setTimeout(() => { menu.hidden = true; }, reduceMotion.matches ? 0 : 420);
    }
  }
  button.addEventListener('click', () => setMenu(button.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', event => {
    if (event.target.closest('[data-menu-close]')) { setMenu(false); button.focus({ preventScroll: true }); }
    else if (event.target.closest('a')) {
      const link = event.target.closest('a');
      const target = link.hash && link.closest('.site-menu-links') ? document.querySelector(link.hash) : null;
      setMenu(false);
      if (!target) return;
      // The page is unlocked first, then scrolled, so the jump always reaches the section.
      event.preventDefault();
      history.pushState(null, '', link.hash);
      requestAnimationFrame(() => target.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' }));
    }
  });
  document.addEventListener('keydown', event => {
    if (menu.hidden) return;
    if (event.key === 'Escape') { setMenu(false); button.focus({ preventScroll: true }); }
    if (event.key === 'Tab') {
      const items = [...panel.querySelectorAll('a,button')];
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  matchMedia('(min-width: 901px)').addEventListener('change', event => { if (event.matches) setMenu(false); });
}

/* Desktop: sections slide in as they come into view, from the side they sit on; lists come in one
   item after another. Each element goes back to its own styles once it is in. Phones, reduced motion
   and browsers without IntersectionObserver get the page as it is. */
if (root.classList.contains('reveal-on')) {
  const groups = [
    ['.section-head > :first-child', 'left'],
    ['.section-head > :last-child:not(:first-child)', 'right'],
    ['.day .app-window', 'zoom'],
    ['.day-foot', 'up'],
    ['.feature-explorer > li', 'left', 0.06],
    ['.feature-drum', 'right'],
    ['.community-copy', 'left'],
    ['.quote-block', 'right'],
    ['.cabinet .feature-copy', 'left'],
    ['.cabinet-shot', 'right'],
    ['.lecture .product-shot', 'left'],
    ['.lecture .feature-copy', 'right'],
    ['.app-grid > div', 'left'],
    ['.app-grid > .device', 'zoom'],
    ['.post-list > li', 'up', 0.1],
    ['.about-grid > :first-child', 'left'],
    ['.about-grid > .srsk', 'right'],
    ['.about-team > h3', 'up'],
    ['.team-list > li', 'up', 0.07],
    ['.about-bottom > div', 'up', 0.1],
    ['.project-list > *', 'up', 0.1],
    ['.closing .wrap > *', 'up', 0.08],
  ];
  const marked = [];
  for (const [selector, from, stagger = 0] of groups) {
    document.querySelectorAll(selector).forEach(element => {
      if (element.hasAttribute('data-reveal')) return;
      element.dataset.reveal = from;
      if (stagger) {
        const index = [...element.parentElement.children].indexOf(element);
        element.style.setProperty('--reveal-delay', Math.min(index * stagger, 0.5) + 's');
      }
      marked.push(element);
    });
  }
  const settle = element => {
    element.removeAttribute('data-reveal');
    element.classList.remove('is-revealed');
    element.style.removeProperty('--reveal-delay');
  };
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const element = entry.target;
      observer.unobserve(element);
      element.classList.add('is-revealed');
      const delay = parseFloat(element.style.getPropertyValue('--reveal-delay')) || 0;
      setTimeout(() => settle(element), (delay + 1.2) * 1000);
    }
  }, { rootMargin: '0px 0px -8% 0px' });
  marked.forEach(element => observer.observe(element));
  // Shrunk to phone width: everything simply shows.
  phoneLayout.addEventListener('change', () => {
    if (!phoneLayout.matches) return;
    observer.disconnect();
    marked.forEach(settle);
    root.classList.remove('reveal-on');
  });
}
