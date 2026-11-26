/* Lindström 密码（林斯特伦坐标网格）——
   1917 年瑞典人 Olof Lindström 提出、1918 年被 Fritz Nebel 改成 ADFGVX 的 10×10 坐标网格。
   网格填法（教学标准）：关键字混合出 25 个字母（I/J 合并）→ 数字 0-9 → 65 个双字母组合。
   加密：每个明文字母在网格里的「行号 + 列号」两个数字就是它的密文。
   本机负责编码：给你单词和已排好的 10×10 网格，你依次查出每个字母的行列号。
   5 题一局。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.lindstrom.tut1t'), d: T('gs.lindstrom.tut1') },
  { t: T('gs.lindstrom.tut2t'), d: T('gs.lindstrom.tut2') },
  { t: T('gs.lindstrom.tut3t'), d: T('gs.lindstrom.tut3') },
  { t: T('gs.lindstrom.tut4t'), d: T('gs.lindstrom.tut4') }
];

(function () {
  var KEYWORD = 'MONARCHY';
  var WORDS = ['MONARCHY', 'CIPHER', 'SIGNAL', 'TUNNEL', 'BEACON', 'RAVINE', 'CASTLE', 'FLAMES', 'GRANITE', 'WHALES'];
  var TOTAL = 5, idx = 0, correct = 0;

  /* ---------- 网格构建 ---------- */
  /* 关键字混合 25 字母（I/J 合并） */
  function mixedAlphabet(key) {
    var seen = {}, seq = [];
    var k = key.toUpperCase().replace(/[^A-Z]/g, '');
    var src = k + 'ABCDEFGHIKLMNOPQRSTUVWXYZ'; /* 序列里 J 已由 I 代替 */
    for (var i = 0; i < src.length; i++) {
      var ch = src.charAt(i);
      if (ch === 'J') ch = 'I';
      if (!seen[ch]) { seen[ch] = 1; seq.push(ch); }
    }
    return seq.join(''); /* 25 字母 */
  }

  /* 100 格内容：25 字母 + 10 数字 + 65 双字母组合 */
  function buildGrid(key) {
    var cells = mixedAlphabet(key).split('');
    for (var d = 0; d <= 9; d++) cells.push(String(d));
    var A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (var i = 0; i < A.length && cells.length < 100; i++) {
      for (var j = 0; j < A.length && cells.length < 100; j++) {
        cells.push(A.charAt(i) + A.charAt(j));
      }
    }
    return cells; /* 长度 100，按行优先 */
  }

  var CELLS = buildGrid(KEYWORD);
  var LOOKUP = {}; /* 字符 → 补零两位行号 + 补零两位列号（教学变体：原版 10 直接两位会产生 2,10/21,0 歧义，补零消除） */
  (function () {
    for (var p = 0; p < CELLS.length; p++) {
      var r = Math.floor(p / 10) + 1, c = (p % 10) + 1;
      var code = (r < 10 ? '0' : '') + r + (c < 10 ? '0' : '') + c;
      if (!(CELLS[p] in LOOKUP)) LOOKUP[CELLS[p]] = code;
    }
  })();

  function encode(word) {
    var out = '';
    var w = word.toUpperCase().replace(/[^A-Z0-9]/g, '');
    for (var i = 0; i < w.length; i++) {
      var ch = w.charAt(i);
      if (ch === 'J') ch = 'I';
      out += LOOKUP[ch] || '';
    }
    return out;
  }

  /* 解码（QA 往返用）：每字符 4 位（2 位行号 + 2 位列号），查网格还原字符 */
  function decode(code) {
    var out = '';
    var s = String(code).replace(/[^0-9]/g, '');
    for (var i = 0; i + 4 <= s.length; i += 4) {
      var r = parseInt(s.substr(i, 2), 10) - 1, c = parseInt(s.substr(i + 2, 2), 10) - 1;
      if (r >= 0 && r < 10 && c >= 0 && c < 10) out += CELLS[r * 10 + c];
    }
    return out;
  }

  /* ---------- DOM ---------- */
  var root = document.getElementById('game-root');
  var wrap = document.createElement('div');
  wrap.className = 'ls-wrap';
  wrap.innerHTML =
    '<div class="ls-progress" id="ls-prog"></div>' +
    '<div class="ls-lbl">' + T('gs.lindstrom.plainLbl') + '</div>' +
    '<div class="ls-plain" id="ls-plain"></div>' +
    '<div class="ls-grid" id="ls-grid"></div>' +
    '<div class="ls-key">' + T('gs.lindstrom.keyLbl') + ' <b>' + KEYWORD + '</b></div>' +
    '<input class="ls-input" id="ls-in" inputmode="numeric" maxlength="20" autocomplete="off" spellcheck="false">' +
    '<div class="ls-msg" id="ls-msg"></div>' +
    '<button class="btn accent" id="ls-sub">' + T('gs.lindstrom.submit') + '</button>' +
    '<div class="ls-help">' + T('gs.lindstrom.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#ls-prog'), plainEl = wrap.querySelector('#ls-plain'),
      gridEl = wrap.querySelector('#ls-grid'), input = wrap.querySelector('#ls-in'),
      msg = wrap.querySelector('#ls-msg'), sub = wrap.querySelector('#ls-sub');

  var answer = '', nextTimer = null;

  function renderGrid() {
    var h = '';
    for (var p = 0; p < CELLS.length; p++) {
      var v = CELLS[p];
      h += '<span class="ls-cell' + (v.length > 1 ? ' bi' : '') + '">' + v + '</span>';
    }
    gridEl.innerHTML = h;
  }

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    var word = WORDS[Math.floor(Math.random() * WORDS.length)];
    answer = encode(word);
    plainEl.textContent = word;
    input.value = ''; input.maxLength = answer.length;
    input.placeholder = T('gs.lindstrom.hintLen').replace('{n}', answer.length);
    prog.textContent = T('gs.lindstrom.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'ls-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.replace(/[^0-9]/g, '');
    if (!v) { msg.textContent = T('gs.lindstrom.msgEmpty'); msg.className = 'ls-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.lindstrom.msgRight'); msg.className = 'ls-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.lindstrom.msgWrong').replace('{answer}', answer); msg.className = 'ls-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 900);
  }

  function finish() {
    plainEl.textContent = T('gs.lindstrom.done');
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.lindstrom.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.lindstrom.perfect') : T('gs.lindstrom.goodJob');
    msg.className = 'ls-msg ok';
    if (Arcade.juice && correct > 0) Arcade.juice.win();
    if (Arcade.shell) Arcade.shell.submitScore(correct);
  }

  sub.addEventListener('click', submit);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
  renderGrid();
  next();

  window.GAME_RESTART = function () {
    if (nextTimer) { clearTimeout(nextTimer); nextTimer = null; }
    idx = 0; correct = 0;
    input.style.display = ''; sub.style.display = '';
    next();
  };

  window.__lindstromEncode = encode; window.__lindstromDecode = decode;
  window.__lindstromGrid = CELLS; window.__lindstromKeyword = KEYWORD; window.__lindstromWords = WORDS;
})();
