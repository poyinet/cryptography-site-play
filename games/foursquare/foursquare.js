/* 四方阵密码 Four-square Cipher —— 两个关键词混字母方阵（左上、右下）夹住两个标准方阵
   （右上、左下）。加密：明文字母对 (P1,P2) 在左上方阵定位 (r1,c1)、在右下方阵定位 (r2,c2)，
   密文 = 右上方阵[r1][c2] + 左下方阵[r2][c1]。解密反向查表。
   I/J 合并（方阵共 25 字母）。5 题一局：看密文与四方阵，还原明文单词。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.foursquare.tut1t'), d: T('gs.foursquare.tut1') },
  { t: T('gs.foursquare.tut2t'), d: T('gs.foursquare.tut2') },
  { t: T('gs.foursquare.tut3t'), d: T('gs.foursquare.tut3') },
  { t: T('gs.foursquare.tut4t'), d: T('gs.foursquare.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  /* 全部为 6 字母词（偶数长，免填充），且不含 J（方阵 I/J 合并） */
  var WORDS = ['CIPHER', 'SECRET', 'ARCADE', 'ENIGMA', 'SIGNAL', 'PUZZLE', 'BATTLE', 'DECODE', 'FORCES', 'VAULTS'];
  var KEYS = ['CRYPTO', 'SECRET', 'PUZZLE', 'CIPHER'];
  var STD = 'ABCDEFGHIKLMNOPQRSTUVWXYZ'; /* 标准方阵：I/J 合并，无 J */
  var TOTAL = 5, idx = 0, correct = 0;

  /* 由关键词生成 25 字母混字母方阵（去重后接剩余字母） */
  function keyedSquare(keyword) {
    var seen = {}, out = '';
    for (var i = 0; i < keyword.length; i++) {
      var c = keyword.charAt(i);
      if (c !== 'J' && !seen[c]) { seen[c] = 1; out += c; }
    }
    for (var j = 0; j < STD.length; j++) {
      var c2 = STD.charAt(j);
      if (!seen[c2]) { seen[c2] = 1; out += c2; }
    }
    return out;
  }

  /* 25 字母串 → 5x5 */
  function toGrid(s) {
    var g = [];
    for (var r = 0; r < 5; r++) { g[r] = []; for (var c = 0; c < 5; c++) g[r][c] = s.charAt(r * 5 + c); }
    return g;
  }

  /* 在 5x5 阵中定位字母 → [row, col] */
  function find(grid, ch) {
    for (var r = 0; r < 5; r++) for (var c = 0; c < 5; c++) if (grid[r][c] === ch) return [r, c];
    return [0, 0];
  }

  /* 四方阵加密：TL/BR 为混阵，TR/BL 为标准阵 */
  function encrypt(word, TL, BR) {
    var TR = toGrid(STD), BL = toGrid(STD);
    var o = '';
    for (var i = 0; i < word.length; i += 2) {
      var p1 = find(TL, word.charAt(i)), p2 = find(BR, word.charAt(i + 1));
      o += TR[p1[0]][p2[1]] + BL[p2[0]][p1[1]];
    }
    return o;
  }

  /* 四方阵解密（用于校验与反向验证） */
  function decrypt(ct, TL, BR) {
    var TR = toGrid(STD), BL = toGrid(STD);
    var o = '';
    for (var i = 0; i < ct.length; i += 2) {
      var c1 = find(TR, ct.charAt(i)), c2 = find(BL, ct.charAt(i + 1));
      o += TL[c1[0]][c2[1]] + BR[c2[0]][c1[1]];
    }
    return o;
  }

  var wrap = document.createElement('div');
  wrap.className = 'fs-wrap';
  wrap.innerHTML =
    '<div class="fs-progress" id="fs-prog"></div>' +
    '<div class="fs-cipher" id="fs-cipher"></div>' +
    '<div class="fs-grids" id="fs-grids"></div>' +
    '<div class="fs-hint" id="fs-hint"></div>' +
    '<input class="fs-input" id="fs-in" maxlength="10" autocomplete="off" spellcheck="false">' +
    '<div class="fs-msg" id="fs-msg"></div>' +
    '<button class="btn accent" id="fs-sub">' + T('gs.foursquare.submit') + '</button>' +
    '<div class="fs-help">' + T('gs.foursquare.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#fs-prog'), cipherEl = wrap.querySelector('#fs-cipher'),
      gridsEl = wrap.querySelector('#fs-grids'), hint = wrap.querySelector('#fs-hint'),
      input = wrap.querySelector('#fs-in'), msg = wrap.querySelector('#fs-msg'), sub = wrap.querySelector('#fs-sub');

  var answer = '', TLs = '', BRs = '', nextTimer = null;

  function renderGrid(label, s, keyed, keyword) {
    var h = '<div class="fs-grid' + (keyed ? ' fs-k' : '') + '"><span class="fs-lab' + (keyed ? ' keyed' : '') + '">' + label +
      (keyword ? ' · <b>' + keyword + '</b>' : '') + '</span>';
    for (var i = 0; i < 25; i++) h += '<span class="fs-cell">' + s.charAt(i) + '</span>';
    return h + '</div>';
  }

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    answer = WORDS[Math.floor(Math.random() * WORDS.length)];
    var kw1 = KEYS[Math.floor(Math.random() * KEYS.length)];
    var kw2 = KEYS[Math.floor(Math.random() * KEYS.length)];
    TLs = keyedSquare(kw1); BRs = keyedSquare(kw2);
    cipherEl.textContent = encrypt(answer, toGrid(TLs), toGrid(BRs));
    gridsEl.innerHTML =
      renderGrid(T('gs.foursquare.tl'), TLs, true, kw1) +
      renderGrid(T('gs.foursquare.tr'), STD, false) +
      renderGrid(T('gs.foursquare.bl'), STD, false) +
      renderGrid(T('gs.foursquare.br'), BRs, true, kw2);
    hint.textContent = answer.replace(/./g, '_ ').trim();
    input.value = ''; input.maxLength = answer.length;
    prog.textContent = T('gs.foursquare.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'fs-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.toUpperCase().trim();
    if (!v) { msg.textContent = T('gs.foursquare.msgEmpty'); msg.className = 'fs-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.foursquare.msgRight'); msg.className = 'fs-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.foursquare.msgWrong').replace('{answer}', answer); msg.className = 'fs-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 900);
  }

  function finish() {
    cipherEl.textContent = T('gs.foursquare.done');
    gridsEl.innerHTML = ''; hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.foursquare.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.foursquare.perfect') : T('gs.foursquare.goodJob');
    msg.className = 'fs-msg ok';
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

  /* 供 QA 校验的编解码入口 */
  window.__fsEncrypt = encrypt; window.__fsDecrypt = decrypt;
  window.__fsKeyed = keyedSquare;
})();
