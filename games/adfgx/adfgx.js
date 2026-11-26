/* ADFGX 密码（1918 年德军，一战西线）——分馏 + 换位的二联密码：
   第一步（坐标化）：5×5 混方阵（I/J 合并），行列表头为 A/D/F/G/X 五个字母，
   每个明文字母换成「行头 + 列头」两个坐标字母（如 C → FG）。
   第二步（列换位）：整串坐标字母按关键词列换位——写进与关键词等长的网格，
   按关键词字母序逐列读出。密文因此只含 A/D/F/G/X 五种字母。
   解密：先把密文按密钥切回各列、按行读出坐标串，再两两查方阵还原字母。
   5 题一局：看方阵、密钥与密文，还原明文单词（词长 5 配 5 列密钥、6 配 4/6 列，无填充）。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.adfgx.tut1t'), d: T('gs.adfgx.tut1') },
  { t: T('gs.adfgx.tut2t'), d: T('gs.adfgx.tut2') },
  { t: T('gs.adfgx.tut3t'), d: T('gs.adfgx.tut3') },
  { t: T('gs.adfgx.tut4t'), d: T('gs.adfgx.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var WORDS5 = ['AGENT', 'RADIO', 'MORSE', 'VAULT'];
  var WORDS6 = ['CIPHER', 'SECRET', 'ENIGMA', 'SIGNAL', 'PUZZLE', 'PATROL'];
  var SQKEYS = ['GERMAN', 'CIPHER', 'TUNNEL', 'FELIX'];
  var TR5 = ['ROUTE', 'DELTA', 'TABLE'];          /* 5 列：配 5 字母词（10 坐标 = 2 行） */
  var TR46 = ['CODE', 'LOCK', 'GRID', 'WIRE', 'CIPHER', 'SECRET', 'TUNNEL']; /* 4/6 列：配 6 字母词（12 坐标整除） */
  var LABELS = 'ADFGX';
  var STD25 = 'ABCDEFGHIKLMNOPQRSTUVWXYZ'; /* I/J 合并 */
  var TOTAL = 5, idx = 0, correct = 0;

  /* 关键词 → 25 字母混方阵（行优先 5x5） */
  function keyedSquare(kw) {
    var seen = {}, seq = '';
    for (var i = 0; i < kw.length; i++) {
      var c = kw.charAt(i);
      if (!seen[c]) { seen[c] = 1; seq += c; }
    }
    for (var j = 0; j < STD25.length; j++) {
      var c2 = STD25.charAt(j);
      if (!seen[c2]) { seen[c2] = 1; seq += c2; }
    }
    var g = [];
    for (var r = 0; r < 5; r++) { g[r] = []; for (var c3 = 0; c3 < 5; c3++) g[r][c3] = seq.charAt(r * 5 + c3); }
    return g;
  }

  function find(sq, ch) {
    for (var r = 0; r < 5; r++) for (var c = 0; c < 5; c++) if (sq[r][c] === ch) return [r, c];
    return [0, 0];
  }

  /* 明文 → 坐标串（J 按 I） */
  function toCoords(word, sq) {
    var t = word.replace(/J/g, 'I'), o = '';
    for (var i = 0; i < t.length; i++) {
      var p = find(sq, t.charAt(i));
      o += LABELS.charAt(p[0]) + LABELS.charAt(p[1]);
    }
    return o;
  }

  /* 列换位：写进 N 列网格，按密钥字母序逐列读出（坐标串长为行宽整数倍，无填充） */
  function transpose(text, kw) {
    var N = kw.length, rows = text.length / N, o = '';
    /* 密钥字母序：相同字母按出现顺序 */
    var pairs = [];
    for (var c = 0; c < N; c++) pairs.push([kw.charAt(c), c]);
    pairs.sort(function (a, b) { return a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 : a[1] - b[1]); });
    for (var k = 0; k < N; k++) {
      var col = pairs[k][1];
      for (var r = 0; r < rows; r++) o += text.charAt(r * N + col);
    }
    return o;
  }

  /* 逆列换位：按密钥序切回各列，按行读出 */
  function untranspose(ct, kw) {
    var N = kw.length, rows = ct.length / N, cols = new Array(N), pos = 0;
    var pairs = [];
    for (var c = 0; c < N; c++) pairs.push([kw.charAt(c), c]);
    pairs.sort(function (a, b) { return a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 : a[1] - b[1]); });
    for (var k = 0; k < N; k++) {
      var col = pairs[k][1];
      cols[col] = ct.substr(pos, rows);
      pos += rows;
    }
    var o = '';
    for (var r = 0; r < rows; r++) for (var c2 = 0; c2 < N; c2++) o += cols[c2].charAt(r);
    return o;
  }

  function encrypt(word, sqKw, trKw) {
    return transpose(toCoords(word, keyedSquare(sqKw)), trKw);
  }

  function decrypt(ct, sqKw, trKw) {
    var sq = keyedSquare(sqKw);
    var co = untranspose(ct, trKw), o = '';
    for (var i = 0; i + 1 < co.length; i += 2) {
      var r = LABELS.indexOf(co.charAt(i)), c = LABELS.indexOf(co.charAt(i + 1));
      if (r >= 0 && c >= 0 && sq[r][c]) o += sq[r][c];
    }
    return o;
  }

  var wrap = document.createElement('div');
  wrap.className = 'ax-wrap';
  wrap.innerHTML =
    '<div class="ax-progress" id="ax-prog"></div>' +
    '<div class="ax-cipher" id="ax-cipher"></div>' +
    '<div class="ax-key">' + T('gs.adfgx.keyLabel') + ' <b id="ax-key"></b></div>' +
    '<div class="ax-square" id="ax-square"></div>' +
    '<div class="ax-lab">' + T('gs.adfgx.squareLabel') + '</div>' +
    '<div class="ax-hint" id="ax-hint"></div>' +
    '<input class="ax-input" id="ax-in" maxlength="10" autocomplete="off" spellcheck="false">' +
    '<div class="ax-msg" id="ax-msg"></div>' +
    '<button class="btn accent" id="ax-sub">' + T('gs.adfgx.submit') + '</button>' +
    '<div class="ax-help">' + T('gs.adfgx.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#ax-prog'), cipherEl = wrap.querySelector('#ax-cipher'),
      keyEl = wrap.querySelector('#ax-key'), squareEl = wrap.querySelector('#ax-square'),
      hint = wrap.querySelector('#ax-hint'),
      input = wrap.querySelector('#ax-in'), msg = wrap.querySelector('#ax-msg'), sub = wrap.querySelector('#ax-sub');

  var answer = '', sqKw = '', trKw = '', nextTimer = null;

  function renderSquare(sq) {
    var h = '<span class="ax-cell lab"></span>';
    for (var c = 0; c < 5; c++) h += '<span class="ax-cell lab">' + LABELS.charAt(c) + '</span>';
    for (var r = 0; r < 5; r++) {
      h += '<span class="ax-cell lab">' + LABELS.charAt(r) + '</span>';
      for (var c2 = 0; c2 < 5; c2++) h += '<span class="ax-cell">' + sq[r][c2] + '</span>';
    }
    squareEl.innerHTML = h;
  }

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    var len5 = Math.random() < 0.5;
    var pool = len5 ? WORDS5 : WORDS6;
    answer = pool[Math.floor(Math.random() * pool.length)];
    sqKw = SQKEYS[Math.floor(Math.random() * SQKEYS.length)];
    trKw = (answer.length === 5 ? TR5 : TR46)[Math.floor(Math.random() * (answer.length === 5 ? TR5.length : TR46.length))];
    cipherEl.textContent = encrypt(answer, sqKw, trKw);
    keyEl.textContent = T('gs.adfgx.sqKw') + ' ' + sqKw + ' · ' + T('gs.adfgx.trKw') + ' ' + trKw + '（' + trKw.length + ' ' + T('gs.adfgx.cols') + '）';
    renderSquare(keyedSquare(sqKw));
    hint.textContent = answer.replace(/./g, '_ ').trim();
    input.value = ''; input.maxLength = answer.length;
    prog.textContent = T('gs.adfgx.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'ax-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.toUpperCase().trim();
    if (!v) { msg.textContent = T('gs.adfgx.msgEmpty'); msg.className = 'ax-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.adfgx.msgRight'); msg.className = 'ax-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.adfgx.msgWrong').replace('{answer}', answer); msg.className = 'ax-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 1000);
  }

  function finish() {
    cipherEl.textContent = T('gs.adfgx.done');
    keyEl.textContent = ''; squareEl.innerHTML = ''; hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.adfgx.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.adfgx.perfect') : T('gs.adfgx.goodJob');
    msg.className = 'ax-msg ok';
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

  window.__axEncrypt = encrypt; window.__axDecrypt = decrypt;
})();
