/* ADFGVX 双换位密码（积加密 / Product Cipher）——
   一战德军 ADFGVX 的强化变体：先做 6×6 Polybius 替换（26 字母+10 数字），
   再把关键字列换位【连做两次】（行→列，再行→列）。两次换位叠加成一条更复杂的路线，
   比单次换位更难猜。本机负责编码：给明文+方阵，你算出双换位后的 ADFGVX 密文。
   提供「看第一遍」辅助：显示替换后、经第一趟换位的中间串，你只需手做第二趟。
   5 题一局。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.adfgvx2.tut1t'), d: T('gs.adfgvx2.tut1') },
  { t: T('gs.adfgvx2.tut2t'), d: T('gs.adfgvx2.tut2') },
  { t: T('gs.adfgvx2.tut3t'), d: T('gs.adfgvx2.tut3') },
  { t: T('gs.adfgvx2.tut4t'), d: T('gs.adfgvx2.tut4') }
];

(function () {
  var SYMS = 'ADFGVX';
  var A36 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var WORDS = ['STORM', 'VAULT', 'CODE', 'RAID', 'FROST', 'BLAZE', 'ROUTE', 'FLOOD'];
  var KEYS = ['MARS', 'LYNX', 'BEAR', 'WOLF', 'OWL', 'FOX', 'CAT', 'ELK'];
  var TOTAL = 5, idx = 0, correct = 0;

  /* 6×6 方阵：关键字打头 + 剩余 A-Z0-9 补齐 36 格 */
  function buildTable(keyword) {
    var seen = {}, seq = [];
    var kw = (keyword || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    for (var i = 0; i < kw.length; i++) { var ch = kw.charAt(i); if (!seen[ch]) { seen[ch] = true; seq.push(ch); } }
    for (var j = 0; j < A36.length; j++) { var c = A36.charAt(j); if (!seen[c]) { seen[c] = true; seq.push(c); } }
    return seq; // 36 格
  }

  /* Polybius 替换：明文 -> ADFGVX 符号串（每字符 2 符号） */
  function polybiusEnc(table, text) {
    var out = '';
    var t = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    for (var i = 0; i < t.length; i++) {
      var p = table.indexOf(t.charAt(i));
      if (p < 0) continue;
      out += SYMS[Math.floor(p / 6)] + SYMS[p % 6];
    }
    return out;
  }

  /* Polybius 逆替换 */
  function polybiusDec(table, syms) {
    var out = '';
    for (var i = 0; i + 1 < syms.length; i += 2) {
      var r = SYMS.indexOf(syms.charAt(i)), c = SYMS.indexOf(syms.charAt(i + 1));
      if (r < 0 || c < 0) continue;
      out += table[r * 6 + c];
    }
    return out;
  }

  /* 单次列换位：符号串按行写入宽=key长 的方阵，按密钥字母序逐列读出 */
  function transPos(syms, key) {
    var cols = key.length, rows = Math.ceil(syms.length / cols);
    var grid = [];
    for (var r = 0; r < rows; r++) {
      var row = [];
      for (var c = 0; c < cols; c++) { var i = r * cols + c; row.push(i < syms.length ? syms.charAt(i) : ''); }
      grid.push(row);
    }
    var order = [];
    for (var j = 0; j < cols; j++) order.push(j);
    order.sort(function (a, b) { var ca = key.charAt(a), cb = key.charAt(b); return ca < cb ? -1 : (ca > cb ? 1 : a - b); });
    var out = '';
    for (var k = 0; k < order.length; k++) { var ci = order[k]; for (var rr = 0; rr < rows; rr++) { var v = grid[rr][ci]; if (v) out += v; } }
    return out;
  }

  /* 单次列换位逆运算 */
  function transInv(syms, key) {
    var cols = key.length, rows = Math.ceil(syms.length / cols);
    var order = [];
    for (var j = 0; j < cols; j++) order.push(j);
    order.sort(function (a, b) { var ca = key.charAt(a), cb = key.charAt(b); return ca < cb ? -1 : (ca > cb ? 1 : a - b); });
    var base = Math.floor(syms.length / cols), extra = syms.length % cols;
    var colLens = [];
    for (var c = 0; c < cols; c++) colLens[c] = base + (c < extra ? 1 : 0);
    var grid = [];
    for (var r = 0; r < rows; r++) grid.push(new Array(cols).fill(''));
    var p = 0;
    for (var k = 0; k < order.length; k++) { var ci = order[k]; for (var rr = 0; rr < colLens[ci]; rr++) grid[rr][ci] = syms.charAt(p++); }
    var out = '';
    for (var rr2 = 0; rr2 < rows; rr2++) { for (var cc = 0; cc < cols; cc++) { if (grid[rr2][cc]) out += grid[rr2][cc]; } }
    return out;
  }

  /* 双换位加密：替换 + 列换位×2 */
  function doubleEnc(text, key) {
    var s = polybiusEnc(buildTable(key), text);
    s = transPos(s, key);
    s = transPos(s, key);
    return s;
  }
  /* 双换位解密：逆列换位×2 + 逆替换 */
  function doubleDec(cipher, key) {
    var s = transInv(cipher, key);
    s = transInv(s, key);
    return polybiusDec(buildTable(key), s);
  }
  /* 单换位（对照用：只换一遍） */
  function singleEnc(text, key) {
    return transPos(polybiusEnc(buildTable(key), text), key);
  }

  /* ---------- DOM ---------- */
  var root = document.getElementById('game-root');
  var wrap = document.createElement('div');
  wrap.className = 'ad2-wrap';
  wrap.innerHTML =
    '<div class="ad2-progress" id="ad2-prog"></div>' +
    '<div class="ad2-lbl">' + T('gs.adfgvx2.plainLbl') + '</div>' +
    '<div class="ad2-plain" id="ad2-plain"></div>' +
    '<div class="ad2-keyrow"><span>' + T('gs.adfgvx2.keyLbl') + '</span><b id="ad2-key"></b></div>' +
    '<div class="ad2-grid" id="ad2-grid"></div>' +
    '<button class="btn accent" id="ad2-showpass">' + T('gs.adfgvx2.showPass') + '</button>' +
    '<div class="ad2-mid" id="ad2-mid"></div>' +
    '<input class="ad2-input" id="ad2-in" maxlength="40" autocomplete="off" spellcheck="false">' +
    '<div class="ad2-msg" id="ad2-msg"></div>' +
    '<button class="btn accent" id="ad2-sub">' + T('gs.adfgvx2.submit') + '</button>' +
    '<div class="ad2-help">' + T('gs.adfgvx2.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#ad2-prog'), plainEl = wrap.querySelector('#ad2-plain'),
      keyEl = wrap.querySelector('#ad2-key'), gridEl = wrap.querySelector('#ad2-grid'),
      showBtn = wrap.querySelector('#ad2-showpass'), midEl = wrap.querySelector('#ad2-mid'),
      input = wrap.querySelector('#ad2-in'), msg = wrap.querySelector('#ad2-msg'), sub = wrap.querySelector('#ad2-sub');

  var answer = '', nextTimer = null, revealed = false;

  function renderGrid(table) {
    var h = '<span class="ad2-cell head"></span>';
    for (var c = 0; c < 6; c++) h += '<span class="ad2-cell head">' + SYMS[c] + '</span>';
    for (var r = 0; r < 6; r++) {
      h += '<span class="ad2-cell head">' + SYMS[r] + '</span>';
      for (var c2 = 0; c2 < 6; c2++) h += '<span class="ad2-cell">' + table[r * 6 + c2] + '</span>';
    }
    gridEl.innerHTML = h;
  }

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    var word = WORDS[Math.floor(Math.random() * WORDS.length)];
    var key = KEYS[Math.floor(Math.random() * KEYS.length)];
    var table = buildTable(key);
    answer = doubleEnc(word, key);
    revealed = false;
    plainEl.textContent = word;
    keyEl.textContent = key;
    renderGrid(table);
    midEl.textContent = '';
    showBtn.style.display = '';
    input.value = ''; input.maxLength = answer.length;
    input.placeholder = T('gs.adfgvx2.hintLen').replace('{n}', answer.length);
    prog.textContent = T('gs.adfgvx2.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'ad2-msg';
    setTimeout(function () { input.focus(); }, 60);
    /* 存本轮上下文供「看第一遍」使用 */
    wrap._ctx = { table: table, word: word, key: key };
  }

  function showPass() {
    var ctx = wrap._ctx;
    if (!ctx) return;
    revealed = true;
    var s = polybiusEnc(ctx.table, ctx.word);
    s = transPos(s, ctx.key); // 只做第一趟
    midEl.textContent = T('gs.adfgvx2.passLbl') + ' ' + s;
    showBtn.style.display = 'none';
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.toUpperCase().replace(/[^A-FGXV]/g, '');
    if (!v) { msg.textContent = T('gs.adfgvx2.msgEmpty'); msg.className = 'ad2-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.adfgvx2.msgRight'); msg.className = 'ad2-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.adfgvx2.msgWrong').replace('{answer}', answer); msg.className = 'ad2-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 900);
  }

  function finish() {
    plainEl.textContent = T('gs.adfgvx2.done');
    input.style.display = 'none'; sub.style.display = 'none'; showBtn.style.display = 'none';
    prog.textContent = T('gs.adfgvx2.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.adfgvx2.perfect') : T('gs.adfgvx2.goodJob');
    msg.className = 'ad2-msg ok';
    if (Arcade.juice && correct > 0) Arcade.juice.win();
    if (Arcade.shell) Arcade.shell.submitScore(correct);
  }

  sub.addEventListener('click', submit);
  showBtn.addEventListener('click', showPass);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
  next();

  window.GAME_RESTART = function () {
    if (nextTimer) { clearTimeout(nextTimer); nextTimer = null; }
    idx = 0; correct = 0;
    input.style.display = ''; sub.style.display = '';
    next();
  };

  window.__adfgvx2DoubleEnc = doubleEnc; window.__adfgvx2DoubleDec = doubleDec;
  window.__adfgvx2SingleEnc = singleEnc; window.__adfgvx2Polybius = polybiusEnc;
  window.__adfgvx2Table = buildTable; window.__adfgvx2Words = WORDS; window.__adfgvx2Keys = KEYS;
})();
