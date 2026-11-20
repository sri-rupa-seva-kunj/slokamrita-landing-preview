const root=document.documentElement;
const theme=document.querySelector('#theme');
const setTheme=value=>{root.dataset.theme=value;theme.setAttribute('aria-pressed',String(value==='dark'))};
setTheme(new URLSearchParams(location.search).get('theme')==='dark'?'dark':'light');
theme.addEventListener('click',()=>setTheme(root.dataset.theme==='light'?'dark':'light'));
const articles=[
 ['Первая шлока на слух','Откройте «Бхагавад-гиту» 2.13 и послушайте рецитацию Нитьянанды Прабху. После первой строки «dehino ’smin yathā dehe» поставьте запись на паузу и повторите её вслух.','Прочитайте перевод целиком, чтобы понимать, о чём стих. На следующий день попробуйте вспомнить первую строку до того, как откроете запись, и только потом добавьте вторую.','https://slokamrita.com/ru/verse/bhagavad-gita-2-13/','Открыть стих и запись'],
 ['Что меняет черта над «ā»?','В латинской записи санскрита черта над гласной обозначает долготу. Посмотрите на yathā и jarā в «Бхагавад-гите» 2.13: оба слова заканчиваются на ā, а внутри у них короткая a.','Включите рецитацию и найдите оба слова на слух. Затем произнесите их сами, различая короткую и долгую гласную.','https://slokamrita.com/ru/verse/bhagavad-gita-2-13/','Открыть «Бхагавад-гиту» 2.13'],
 ['Зачем читать стих слово за словом','В «Бхагавад-гите» 12.8 пословник передаёт manaḥ как «ум», а buddhim как «разум». В самом стихе эти слова выглядят как mana и buddhiṁ. Попробуйте найти их в первых двух строках.','Теперь перечитайте литературный перевод: Кришна говорит Арджуне сосредоточить на Нём ум и направить на Него разум. Пословник помогает увидеть, откуда взялись оба слова в переводе.','https://slokamrita.com/ru/verse/bhagavad-gita-12-8/','Сравнить переводы стиха 12.8'],
];
const dialog=document.querySelector('#detail'),title=document.querySelector('#dialog-title'),tag=document.querySelector('#dialog-tag'),body=document.querySelector('#dialog-body');
function openDetail(label,heading,paragraphs,link){tag.textContent=label;title.textContent=heading;body.replaceChildren();for(const text of paragraphs){const p=document.createElement('p');p.textContent=text;body.append(p)}if(link){const a=document.createElement('a');a.href=link[0];a.textContent=link[1];body.append(a)}dialog.showModal()}
document.querySelectorAll('.article-trigger').forEach(btn=>btn.addEventListener('click',()=>{const [headline,p1,p2,href,label]=articles[Number(btn.dataset.article)];openDetail('ЧЕРНОВИК СТАТЬИ',headline,[p1,p2],[href,label])}));
document.querySelectorAll('.group-trigger').forEach(btn=>btn.addEventListener('click',()=>openDetail('TELEGRAM','Ссылка пока не добавлена',['Здесь появится приглашение в группу совместного изучения шлок.'])));
document.querySelector('#close').addEventListener('click',()=>dialog.close());
const audio=document.querySelector('#recitation');
const playButton=document.querySelector('.recitation-button');
const audioError=document.querySelector('#recitation-error');
function updateRecitation(){
  const playing=!audio.paused&&!audio.ended;
  playButton.querySelector('.play-icon').hidden=playing;
  playButton.querySelector('.pause-icon').hidden=!playing;
  playButton.querySelector('.recitation-label').textContent=playing?'Пауза':'Слушать рецитацию';
}
for(const event of ['play','pause','ended']) audio.addEventListener(event,updateRecitation);
audio.addEventListener('error',()=>{audioError.hidden=false;updateRecitation()});
playButton.addEventListener('click',async()=>{
  if(!audio.paused){audio.pause();return}
  audioError.hidden=true;
  if(audio.error) audio.load();
  try{await audio.play()}catch(error){if(error.name!=='AbortError') audioError.hidden=false}
});
