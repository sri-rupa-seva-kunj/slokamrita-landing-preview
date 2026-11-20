const root = document.documentElement;
const en = root.lang === 'en';
const query = new URLSearchParams(location.search);
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
setTheme(query.get('theme') === 'dark' ? 'dark' : 'light');
theme.addEventListener('click', () => setTheme(root.dataset.theme === 'light' ? 'dark' : 'light'));

const audio = document.querySelector('#recitation');
const play = document.querySelector('.recitation-button');
const stop = document.querySelector('.recitation-stop');
const seek = document.querySelector('.recitation-seek');
const time = document.querySelector('.recitation-time');
const volume = document.querySelector('.recitation-volume');
const errorText = document.querySelector('#recitation-error');
const labels = en
  ? { play: 'Play', pause: 'Pause', mute: 'Mute', unmute: 'Unmute' }
  : { play: 'Воспроизвести', pause: 'Пауза', mute: 'Отключить звук', unmute: 'Включить звук' };
function setLabel(element, label) {
  element.setAttribute('aria-label', label);
  element.title = label;
}
function formatTime(seconds) {
  const whole = Math.floor(seconds);
  return Math.floor(whole / 60) + ':' + String(whole % 60).padStart(2, '0');
}
function updatePlayer() {
  const playing = !audio.paused && !audio.ended;
  const loaded = Number.isFinite(audio.duration);
  play.children[0].hidden = playing;
  play.children[1].hidden = !playing;
  setLabel(play, playing ? labels.pause : labels.play);
  stop.disabled = !playing && audio.currentTime === 0;
  seek.disabled = !loaded;
  seek.max = String(loaded ? audio.duration : 15);
  seek.value = String(audio.currentTime);
  const duration = formatTime(loaded ? audio.duration : 15);
  time.textContent = formatTime(audio.currentTime) + ' / ' + duration;
  seek.setAttribute('aria-valuetext', time.textContent);
  volume.children[0].hidden = audio.muted;
  volume.children[1].hidden = !audio.muted;
  setLabel(volume, audio.muted ? labels.unmute : labels.mute);
}
for (const event of ['play', 'pause', 'ended', 'loadedmetadata', 'timeupdate', 'volumechange']) {
  audio.addEventListener(event, updatePlayer);
}
audio.addEventListener('error', () => { errorText.hidden = false; updatePlayer(); });
play.addEventListener('click', async () => {
  if (!audio.paused) { audio.pause(); return; }
  errorText.hidden = true;
  if (audio.error) audio.load();
  try { await audio.play(); } catch (error) {
    if (error.name !== 'AbortError') errorText.hidden = false;
  }
});
stop.addEventListener('click', () => { audio.pause(); audio.currentTime = 0; updatePlayer(); });
seek.addEventListener('input', () => { audio.currentTime = Number(seek.value); updatePlayer(); });
volume.addEventListener('click', () => { audio.muted = !audio.muted; });
updatePlayer();

const exampleLine = document.querySelector('#example-line');
const modeButtons = [...document.querySelectorAll('[data-reading-mode]')];
for (const button of modeButtons) {
  button.addEventListener('click', () => {
    const sanskritOnly = button.dataset.readingMode === 'sanskrit';
    for (const item of modeButtons) item.setAttribute('aria-pressed', String(item === button));
    exampleLine.classList.toggle('sanskrit-only', sanskritOnly);
  });
}

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
