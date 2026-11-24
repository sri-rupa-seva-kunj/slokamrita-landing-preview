/* Bhagavad-gita 2.13 exactly as Slokamrita sends it to its slide-show viewer
   (the "slokamrita-slides-init" message), for the verse widget on the homepage. */
(() => {
  const g = text => '<span class="ss-guru">' + text + '</span>';
  const word = (ru, iast, link, gloss) => ({ ru, iast, gloss, link, joinBefore: false });
  const padas = glosses => [
    [word('д' + g('е') + 'хин' + g('о'), 'd' + g('e') + 'hin' + g('o'), 'word-0', glosses[0][0]),
     word('’см' + g('и') + 'н', '’sm' + g('i') + 'n', 'word-0', glosses[0][1]),
     word('йатх' + g('а̄'), 'yath' + g('ā'), 'word-1', glosses[0][2]),
     word('д' + g('е') + 'х' + g('е'), 'd' + g('e') + 'h' + g('e'), 'word-2', glosses[0][3])],
    [word('к' + g('а') + g('у') + 'м' + g('а̄') + 'р' + g('а') + 'м̇', 'k' + g('a') + g('u') + 'm' + g('ā') + 'r' + g('a') + 'ṁ', 'word-3', glosses[1][0]),
     word('й' + g('а') + g('у') + 'ван' + g('а') + 'м̇', 'y' + g('a') + g('u') + 'van' + g('a') + 'ṁ', 'word-4', glosses[1][1]),
     word('джар' + g('а̄'), 'jar' + g('ā'), 'word-5', glosses[1][2])],
    [word('татх' + g('а̄'), 'tath' + g('ā'), 'word-6', glosses[2][0]),
     word('д' + g('е') + 'х' + g('а̄') + 'нтар' + g('а') + '-пр' + g('а̄') + 'пт' + g('и') + 'р', 'd' + g('e') + 'h' + g('ā') + 'ntar' + g('a') + '-pr' + g('ā') + 'pt' + g('i') + 'r', 'word-7', glosses[2][1])],
    [word('дх' + g('ӣ') + 'р' + g('а') + 'с', 'dh' + g('ī') + 'r' + g('a') + 's', 'word-8', glosses[3][0]),
     word('т' + g('а') + 'тра', 't' + g('a') + 'tra', 'word-9', glosses[3][1]),
     word('на', 'na', 'word-10', glosses[3][2]),
     word('м' + g('у') + 'хйати', 'm' + g('u') + 'hyati', 'word-11', glosses[3][3])],
  ];
  const dictionary = meanings => [
    ['дехинах̣', 'dehinaḥ', 'word-0'], ['асмин', 'asmin', 'word-0'], ['йатха̄', 'yathā', 'word-1'], ['дехе', 'dehe', 'word-2'],
    ['каума̄рам', 'kaumāram', 'word-3'], ['йауванам', 'yauvanam', 'word-4'], ['джара̄', 'jarā', 'word-5'], ['татха̄', 'tathā', 'word-6'],
    ['деха-антара', 'deha-antara', 'word-7'], ['пра̄птих̣', 'prāptiḥ', 'word-7'], ['дхӣрах̣', 'dhīraḥ', 'word-8'], ['татра', 'tatra', 'word-9'],
    ['на', 'na', 'word-10'], ['мухйати', 'muhyati', 'word-11'],
  ].map(([ru, iast, link], i) => ({ ru, iast, translation: meanings[i], link }));

  const svg = paths => '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide" aria-hidden="true">' + paths + '</svg>';
  window.SLOKAMRITA_SLIDES = {
    ru: {
      slug: '218ecd69-d831-4fcc-9adf-20b2d39abcd4', title: 'Бхагавад-гита 2.13',
      translation: 'Воплотившаяся в теле душа постепенно меняет тело ребенка на тело юноши, а затем на тело старика, и точно так же после смерти она переходит в другое тело. Трезвомыслящего человека такая перемена не смущает.',
      padas: padas([['обладателя тела', 'в этом', 'как', 'в теле'], ['детство', 'юность', 'старость'], ['так же', 'другого тела обретение'], ['стойко-разумный', 'при этом', 'не', 'обманывается']]),
      dictionary: dictionary(['воплощенного', 'в этом', 'как', 'в теле', 'детство', 'молодость', 'старость', 'так же', 'другого тела', 'обретение', 'трезвомыслящий человек', 'при этом', 'не', 'обманывается']),
    },
    en: {
      slug: '218ecd69-d831-4fcc-9adf-20b2d39abcd4', title: 'Bhagavad-gita 2.13',
      translation: 'As the embodied soul continuously passes, in this body, from boyhood to youth to old age, the soul similarly passes into another body at death. A sober person is not bewildered by such a change.',
      padas: padas([['of the embodied being', 'in this', 'just as', 'in the body'], ['boyhood', 'youth', 'old age'], ['similarly', 'attainment of another body'], ['the wise person', 'therein', 'not', 'is deluded']]),
      dictionary: dictionary(['of the embodied', 'in this', 'as', 'in the body', 'boyhood', 'youth', 'old age', 'similarly', 'of transference of the body', 'achievement', 'the sober', 'thereupon', 'never', 'is deluded']),
    },
    icons: {
      x: svg('<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>'),
      settings: svg('<path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"></path><circle cx="12" cy="12" r="3"></circle>'),
      maximize: svg('<path d="M8 3H5a2 2 0 0 0-2 2v3"></path><path d="M21 8V5a2 2 0 0 0-2-2h-3"></path><path d="M3 16v3a2 2 0 0 0 2 2h3"></path><path d="M16 21h3a2 2 0 0 0 2-2v-3"></path>'),
      minimize: svg('<path d="M8 3v3a2 2 0 0 1-2 2H3"></path><path d="M21 8h-3a2 2 0 0 1-2-2V3"></path><path d="M3 16h3a2 2 0 0 1 2 2v3"></path><path d="M16 21v-3a2 2 0 0 1 2-2h3"></path>'),
      'eye-off': svg('<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"></path><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"></path><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"></path><path d="m2 2 20 20"></path>'),
      eye: svg('<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle>'),
      'chevron-left': svg('<path d="m15 18-6-6 6-6"></path>'),
      'chevron-right': svg('<path d="m9 18 6-6-6-6"></path>'),
    },
  };
})();
