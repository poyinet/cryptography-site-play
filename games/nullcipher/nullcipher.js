/* 虚密文 Null Cipher（隐写术的古典形态）——
   不替换、不换位——整封信看起来完全普通，暗语却藏在规律位置里。
   本题规则：每行第 3 个词的首字母，按行序连起来就是暗语单词。
   历史上更常见的变体还有「藏头诗」（每行首字母）、「每第 N 个词」、
   「每句第 N 个字母」等——本质相同：把信息摊在无害的文本里，只有知道
   取字规则的人才能捞出来。
   5 题一局：看掩护文本与取字规则，还原暗语单词。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.nullcipher.tut1t'), d: T('gs.nullcipher.tut1') },
  { t: T('gs.nullcipher.tut2t'), d: T('gs.nullcipher.tut2') },
  { t: T('gs.nullcipher.tut3t'), d: T('gs.nullcipher.tut3') },
  { t: T('gs.nullcipher.tut4t'), d: T('gs.nullcipher.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  /* 掩护文本：每行第 3 个词的首字母按行连成暗语 */
  var COVERS = [
    {
      word: 'CIPHER',
      lines: [
        'The old clock struck twelve.',
        'We will invite everyone.',
        'She did paint the wall.',
        'They found honey inside.',
        'He could easily tell.',
        'It was rather quiet.'
      ]
    },
    {
      word: 'SECRET',
      lines: [
        'My sister sang tonight.',
        'The dog enjoyed dinner.',
        'A cat can wait.',
        'The men ran fast.',
        'One big egg appeared.',
        'The boy told us.'
      ]
    },
    {
      word: 'ENIGMA',
      lines: [
        'The sun eventually set.',
        'We can not decide.',
        'Her cat is black.',
        'The old game ended.',
        'The dog made noise.',
        'It is an honor.'
      ]
    },
    {
      word: 'SIGNAL',
      lines: [
        'The boy sat down.',
        'We all inched closer.',
        'The cat got milk.',
        'Her son never cried.',
        'The dog ate slowly.',
        'One man laughed loudly.'
      ]
    },
    {
      word: 'PUZZLE',
      lines: [
        'The cat played outside.',
        'We can use this.',
        'The dog zipped past.',
        'Her cat zigzagged home.',
        'One kid learned it.',
        'The boy earned praise.'
      ]
    }
  ];
  var TOTAL = 5, idx = 0, correct = 0;

  /* 取字规则：每行第 3 个词的首字母 */
  function extract(lines) {
    var o = '';
    for (var i = 0; i < lines.length; i++) {
      var words = lines[i].split(' ');
      o += words[2].charAt(0);
    }
    return o;
  }

  var wrap = document.createElement('div');
  wrap.className = 'nl-wrap';
  wrap.innerHTML =
    '<div class="nl-progress" id="nl-prog"></div>' +
    '<div class="nl-rule">🔍 ' + T('gs.nullcipher.rule') + '</div>' +
    '<div class="nl-cover" id="nl-cover"></div>' +
    '<div class="nl-hint" id="nl-hint"></div>' +
    '<input class="nl-input" id="nl-in" maxlength="10" autocomplete="off" spellcheck="false">' +
    '<div class="nl-msg" id="nl-msg"></div>' +
    '<button class="btn accent" id="nl-sub">' + T('gs.nullcipher.submit') + '</button>' +
    '<div class="nl-help">' + T('gs.nullcipher.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#nl-prog'), coverEl = wrap.querySelector('#nl-cover'),
      hint = wrap.querySelector('#nl-hint'),
      input = wrap.querySelector('#nl-in'), msg = wrap.querySelector('#nl-msg'), sub = wrap.querySelector('#nl-sub');

  var answer = '', nextTimer = null;

  function renderCover(lines) {
    var h = '';
    for (var i = 0; i < lines.length; i++) {
      h += '<span class="nl-line"><span class="nl-no">' + (i + 1) + '</span>' + lines[i] + '</span>';
    }
    coverEl.innerHTML = h;
  }

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    var c = COVERS[Math.floor(Math.random() * COVERS.length)];
    answer = c.word;
    renderCover(c.lines);
    hint.textContent = answer.replace(/./g, '_ ').trim();
    input.value = ''; input.maxLength = answer.length;
    prog.textContent = T('gs.nullcipher.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'nl-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.toUpperCase().trim();
    if (!v) { msg.textContent = T('gs.nullcipher.msgEmpty'); msg.className = 'nl-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.nullcipher.msgRight'); msg.className = 'nl-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.nullcipher.msgWrong').replace('{answer}', answer); msg.className = 'nl-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 1000);
  }

  function finish() {
    coverEl.innerHTML = '<span style="font-size:26px">🫥</span>';
    hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.nullcipher.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.nullcipher.perfect') : T('gs.nullcipher.goodJob');
    msg.className = 'nl-msg ok';
    if (Arcade.juice && correct > 0) Arcade.juice.win();
    if (Arcade.shell) Arcade.shell.submitScore(correct);
  }

  sub.addEventListener('click', submit);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
  next();

  window.GAME_RESTART = function () {
    if (nextTimer) { clearTimeout(nextTimer); nextTimer = null; }
    idx = 0; correct = 0;
    input.style.display = ''; sub.style.display = '';
    next();
  };

  window.__nlExtract = extract; window.__nlCovers = COVERS;
})();
