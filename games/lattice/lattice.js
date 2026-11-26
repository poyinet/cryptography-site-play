/* 格子密码 Lattice——
   古典对角线换位：把明文按行写入 n×n 方阵（末尾用 * 补满），
   再从右下往左上沿对角线读，读出顺序就是密文。
   对角线读法与按行/按列换位都不同——它是「斜着走」的。
   本机负责编码：给你单词和已填好的方阵，你按对角线读出字母串。
   5 题一局。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.lattice.tut1t'), d: T('gs.lattice.tut1') },
  { t: T('gs.lattice.tut2t'), d: T('gs.lattice.tut2') },
  { t: T('gs.lattice.tut3t'), d: T('gs.lattice.tut3') },
  { t: T('gs.lattice.tut4t'), d: T('gs.lattice.tut4') }
];

(function () {
  var WORDS = ['LATTICE', 'CIPHER', 'ENIGMA', 'ROUTE', 'BRAVO', 'SEAGULL', 'TUNNEL', 'BEACON', 'SIGNAL', 'FLOOD'];
  var TOTAL = 5, idx = 0, correct = 0;

  /* n = 最小整数使 n*n >= len */
  function gridSize(len) { var n = Math.ceil(Math.sqrt(len)); return n; }

  /* 建方阵：按行填入单词，末尾用 * 补满 n*n */
  function buildSquare(word, n) {
    var grid = [];
    for (var r = 0; r < n; r++) {
      var row = [];
      for (var c = 0; c < n; c++) {
        var i = r * n + c;
        row.push(i < word.length ? word.charAt(i) : '*');
      }
      grid.push(row);
    }
    return grid;
  }

  /* 对角线编码：s 从 2(n-1) 递减到 0，每条对角线内按行号升序，跳过 * */
  function encode(word) {
    var n = gridSize(word.length);
    var grid = buildSquare(word, n);
    var out = '';
    for (var s = 2 * (n - 1); s >= 0; s--) {
      for (var r = 0; r < n; r++) {
        var c = s - r;
        if (c < 0 || c >= n) continue;
        var v = grid[r][c];
        if (v !== '*') out += v;
      }
    }
    return out;
  }

  /* 对角线解码（逆过程，供 QA 往返用）：把密文字母按对角线顺序填回非*格，再按行读出 */
  function decode(code) {
    var n = gridSize(code.length);
    var grid = [];
    for (var r = 0; r < n; r++) { var row = []; for (var c = 0; c < n; c++) { row.push(''); } grid.push(row); }
    var p = 0;
    for (var s = 2 * (n - 1); s >= 0; s--) {
      for (var r2 = 0; r2 < n; r2++) {
        var c2 = s - r2;
        if (c2 < 0 || c2 >= n) continue;
        /* 只填非 * 格（* 是末尾 flat index >= code.length 的补空格） */
        if (r2 * n + c2 < code.length) { grid[r2][c2] = code.charAt(p++); }
      }
    }
    var out = '';
    for (var rr = 0; rr < n; rr++) for (var cc = 0; cc < n; cc++) { if (grid[rr][cc] !== '') out += grid[rr][cc]; }
    return out;
  }

  /* ---------- DOM ---------- */
  var root = document.getElementById('game-root');
  var wrap = document.createElement('div');
  wrap.className = 'la-wrap';
  wrap.innerHTML =
    '<div class="la-progress" id="la-prog"></div>' +
    '<div class="la-lbl">' + T('gs.lattice.plainLbl') + '</div>' +
    '<div class="la-plain" id="la-plain"></div>' +
    '<div class="la-grid" id="la-grid"></div>' +
    '<input class="la-input" id="la-in" maxlength="16" autocomplete="off" spellcheck="false">' +
    '<div class="la-msg" id="la-msg"></div>' +
    '<button class="btn accent" id="la-sub">' + T('gs.lattice.submit') + '</button>' +
    '<div class="la-help">' + T('gs.lattice.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#la-prog'), plainEl = wrap.querySelector('#la-plain'),
      gridEl = wrap.querySelector('#la-grid'), input = wrap.querySelector('#la-in'),
      msg = wrap.querySelector('#la-msg'), sub = wrap.querySelector('#la-sub');

  var answer = '', nextTimer = null;

  function renderGrid(grid) {
    var n = grid.length;
    var h = '';
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        var v = grid[r][c];
        h += '<span class="la-cell' + (v === '*' ? ' pad' : '') + '">' + v + '</span>';
      }
    }
    gridEl.innerHTML = h;
    gridEl.style.setProperty('--n', String(n));
  }

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    var word = WORDS[Math.floor(Math.random() * WORDS.length)];
    var n = gridSize(word.length);
    answer = encode(word);
    plainEl.textContent = word;
    renderGrid(buildSquare(word, n));
    input.value = ''; input.maxLength = answer.length;
    input.placeholder = T('gs.lattice.hintLen').replace('{n}', answer.length);
    prog.textContent = T('gs.lattice.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'la-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.toUpperCase().replace(/[^A-Z]/g, '');
    if (!v) { msg.textContent = T('gs.lattice.msgEmpty'); msg.className = 'la-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.lattice.msgRight'); msg.className = 'la-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.lattice.msgWrong').replace('{answer}', answer); msg.className = 'la-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 900);
  }

  function finish() {
    plainEl.textContent = T('gs.lattice.done');
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.lattice.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.lattice.perfect') : T('gs.lattice.goodJob');
    msg.className = 'la-msg ok';
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

  window.__latticeEncode = encode; window.__latticeDecode = decode; window.__latticeWords = WORDS;
})();
