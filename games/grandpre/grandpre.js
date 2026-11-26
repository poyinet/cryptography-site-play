/* Grandpré 密码（19 世纪法国，A. de Grandpré）——
   10×10 密钥方阵：关键词去重后接剩余字母，按行写进前 26 格；
   其余 74 格填虚格（·），永不参与编码。
   加密：每个明文字母在方阵里定位（行 0-9、列 0-9），换成「行号 + 列号」两个数字。
   解密：数字对 → 行列交叉格 → 读出字母（虚格坐标不会出现）。
   5 题一局：看密钥方阵与数字串，还原明文单词。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.grandpre.tut1t'), d: T('gs.grandpre.tut1') },
  { t: T('gs.grandpre.tut2t'), d: T('gs.grandpre.tut2') },
  { t: T('gs.grandpre.tut3t'), d: T('gs.grandpre.tut3') },
  { t: T('gs.grandpre.tut4t'), d: T('gs.grandpre.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var WORDS = ['CIPHER', 'SECRET', 'ENIGMA', 'SIGNAL', 'PUZZLE', 'PATROL', 'RADIO', 'VAULT', 'AGENT', 'MORSE'];
  var KEYWORDS = ['GRAND', 'PRE', 'CIPHER', 'SECRET', 'TUNNEL'];
  var STD = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var TOTAL = 5, idx = 0, correct = 0;

  /* 关键词 → 100 格方阵（前 26 格为混字母表，其余虚格） */
  function buildSquare(kw) {
    var seen = {}, seq = '';
    for (var i = 0; i < kw.length; i++) {
      var c = kw.charAt(i);
      if (!seen[c]) { seen[c] = 1; seq += c; }
    }
    for (var j = 0; j < 26; j++) {
      var c2 = STD.charAt(j);
      if (!seen[c2]) { seen[c2] = 1; seq += c2; }
    }
    var cells = [];
    for (var k = 0; k < 100; k++) cells.push(k < 26 ? seq.charAt(k) : '·');
    return cells;
  }

  function find(cells, ch) {
    for (var i = 0; i < 26; i++) if (cells[i] === ch) return [Math.floor(i / 10), i % 10];
    return [0, 0];
  }

  function encrypt(word, cells) {
    var o = '';
    for (var i = 0; i < word.length; i++) {
      var p = find(cells, word.charAt(i));
      o += p[0] + '' + p[1];
    }
    return o;
  }

  function decrypt(ct, cells) {
    var o = '';
    for (var i = 0; i + 1 < ct.length; i += 2) {
      var r = Number(ct.charAt(i)), c = Number(ct.charAt(i + 1));
      var ch = cells[r * 10 + c];
      if (ch && ch !== '·') o += ch;
    }
    return o;
  }

  var wrap = document.createElement('div');
  wrap.className = 'gp-wrap';
  wrap.innerHTML =
    '<div class="gp-progress" id="gp-prog"></div>' +
    '<div class="gp-cipher" id="gp-cipher"></div>' +
    '<div class="gp-key">' + T('gs.grandpre.keyLabel') + ' <b id="gp-key"></b></div>' +
    '<div class="gp-scroll"><div class="gp-grid" id="gp-grid"></div></div>' +
    '<div class="gp-lab">' + T('gs.grandpre.gridLabel') + '</div>' +
    '<div class="gp-hint" id="gp-hint"></div>' +
    '<input class="gp-input" id="gp-in" maxlength="10" autocomplete="off" spellcheck="false">' +
    '<div class="gp-msg" id="gp-msg"></div>' +
    '<button class="btn accent" id="gp-sub">' + T('gs.grandpre.submit') + '</button>' +
    '<div class="gp-help">' + T('gs.grandpre.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#gp-prog'), cipherEl = wrap.querySelector('#gp-cipher'),
      keyEl = wrap.querySelector('#gp-key'), gridEl = wrap.querySelector('#gp-grid'),
      hint = wrap.querySelector('#gp-hint'),
      input = wrap.querySelector('#gp-in'), msg = wrap.querySelector('#gp-msg'), sub = wrap.querySelector('#gp-sub');

  var answer = '', cells = [], nextTimer = null;

  function renderGrid() {
    var h = '';
    for (var i = 0; i < 100; i++) {
      var cls = cells[i] === '·' ? 'null' : 'letter';
      h += '<span class="gp-cell ' + cls + '">' + cells[i] + '</span>';
    }
    gridEl.innerHTML = h;
  }

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    answer = WORDS[Math.floor(Math.random() * WORDS.length)];
    var kw = KEYWORDS[Math.floor(Math.random() * KEYWORDS.length)];
    cells = buildSquare(kw);
    cipherEl.textContent = encrypt(answer, cells);
    keyEl.textContent = kw;
    renderGrid();
    hint.textContent = answer.replace(/./g, '_ ').trim();
    input.value = ''; input.maxLength = answer.length;
    prog.textContent = T('gs.grandpre.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'gp-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.toUpperCase().trim();
    if (!v) { msg.textContent = T('gs.grandpre.msgEmpty'); msg.className = 'gp-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.grandpre.msgRight'); msg.className = 'gp-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.grandpre.msgWrong').replace('{answer}', answer); msg.className = 'gp-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 1000);
  }

  function finish() {
    cipherEl.textContent = T('gs.grandpre.done');
    keyEl.textContent = ''; gridEl.innerHTML = ''; hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.grandpre.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.grandpre.perfect') : T('gs.grandpre.goodJob');
    msg.className = 'gp-msg ok';
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

  window.__gpEncrypt = encrypt; window.__gpDecrypt = decrypt; window.__gpBuild = buildSquare;
})();
