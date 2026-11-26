/* 敲击码通信 Tap code——
   越战战俘用来跟看守通信的「无声摩斯」：一张 5×5 波利比奥斯阵（C/K 合并），
   每个字母由两组敲击组成——先敲「第几行」（1–5 下）、再敲「第几列」（1–5 下）。
   本机负责「听敲读字」：把敲击组序列翻译成阵里的字母，拼回单词。
   5 题一局：看敲击组还原英文单词。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.tapcode.tut1t'), d: T('gs.tapcode.tut1') },
  { t: T('gs.tapcode.tut2t'), d: T('gs.tapcode.tut2') },
  { t: T('gs.tapcode.tut3t'), d: T('gs.tapcode.tut3') },
  { t: T('gs.tapcode.tut4t'), d: T('gs.tapcode.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  /* 5×5 阵，C/K 合并到 I 位（标准 tap code 约定） */
  var GRID = [
    ['A', 'B', 'C', 'D', 'E'],
    ['F', 'G', 'H', 'IK', 'J'],
    ['L', 'M', 'N', 'O', 'P'],
    ['Q', 'R', 'S', 'T', 'U'],
    ['V', 'W', 'X', 'Y', 'Z']
  ];
  var WORDS = ['CIPHER', 'SECRET', 'ENIGMA', 'SIGNAL', 'PATROL', 'VAULT', 'AGENT', 'MORSE', 'RADAR', 'TUNNEL'];
  var TOTAL = 5, idx = 0, correct = 0;

  /* 字母 → (行, 列) */
  function coords(ch) {
    ch = ch.toUpperCase();
    for (var r = 0; r < 5; r++) for (var c = 0; c < 5; c++) {
      if (GRID[r][c].indexOf(ch) >= 0) return [r + 1, c + 1];
    }
    return null;
  }
  /* 单个字母 → 敲击组串 "●● · ●●●" */
  function taps(ch) {
    var cc = coords(ch);
    if (!cc) return '';
    return dot(cc[0]) + ' · ' + dot(cc[1]);
  }
  function dot(n) { var s = ''; for (var i = 0; i < n; i++) s += '●'; return s; }
  /* 单词 → 敲击序列 */
  function encode(word) {
    var out = [];
    for (var i = 0; i < word.length; i++) {
      var t = taps(word.charAt(i));
      if (t) out.push(t);
    }
    return out;
  }
  /* 解码：(行,列) → 字母（IK 取 I） */
  function decode(rc) { return GRID[rc[0] - 1][rc[1] - 1].charAt(0); }

  var wrap = document.createElement('div');
  wrap.className = 'tc-wrap';
  var gh = '';
  for (var gr = 0; gr < 5; gr++) for (var gc = 0; gc < 5; gc++) gh += '<span class="tc-cell">' + GRID[gr][gc] + '</span>';
  wrap.innerHTML =
    '<div class="tc-progress" id="tc-prog"></div>' +
    '<div class="tc-cipher" id="tc-cipher"></div>' +
    '<div class="tc-grid">' + gh + '</div>' +
    '<div class="tc-hint" id="tc-hint"></div>' +
    '<input class="tc-input" id="tc-in" maxlength="10" autocomplete="off" spellcheck="false">' +
    '<div class="tc-msg" id="tc-msg"></div>' +
    '<button class="btn accent" id="tc-sub">' + T('gs.tapcode.submit') + '</button>' +
    '<div class="tc-help">' + T('gs.tapcode.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#tc-prog'), cipherEl = wrap.querySelector('#tc-cipher'),
      hint = wrap.querySelector('#tc-hint'),
      input = wrap.querySelector('#tc-in'), msg = wrap.querySelector('#tc-msg'), sub = wrap.querySelector('#tc-sub');

  var answer = '', nextTimer = null;

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    answer = WORDS[Math.floor(Math.random() * WORDS.length)];
    cipherEl.textContent = encode(answer).join('   ');
    hint.textContent = answer.replace(/./g, '_ ').trim();
    input.value = ''; input.maxLength = answer.length;
    prog.textContent = T('gs.tapcode.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'tc-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.toUpperCase().trim();
    if (!v) { msg.textContent = T('gs.tapcode.msgEmpty'); msg.className = 'tc-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.tapcode.msgRight'); msg.className = 'tc-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.tapcode.msgWrong').replace('{answer}', answer); msg.className = 'tc-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 900);
  }

  function finish() {
    cipherEl.textContent = T('gs.tapcode.done');
    hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.tapcode.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.tapcode.perfect') : T('gs.tapcode.goodJob');
    msg.className = 'tc-msg ok';
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

  window.__tcEncode = encode; window.__tcCoords = coords; window.__tcDecode = decode;
})();
