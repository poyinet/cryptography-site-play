/* Phillips 密码（ACA 经典，一战西线野战密码；A. R. Phillips）——
   从一个 5×5 混方阵（关键词生成，I/J 合并）出发，用「行气泡下沉」生出 8 个方阵：
   原第 1 行每次向下沉一格（连续 4 次）→ 方阵 #2-#5；
   原第 2 行再每次向下沉一格（连续 3 次）→ 方阵 #6-#8。
   加密：明文每 5 个字母一块，第 b 块用第 (b mod 8)+1 号方阵；
   每个字母取「右下对角」——行 +1、列 +1（越界回绕：第 5 列回第 1 列、
   第 5 行回第 1 行）。整体周期 40 字母。
   解密同构：在每个方阵里找密文字母，取它的左上对角。
   5 题一局：看八方阵与密文，还原明文单词（密文按 5 字母分组，对应方阵序号）。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.phillips.tut1t'), d: T('gs.phillips.tut1') },
  { t: T('gs.phillips.tut2t'), d: T('gs.phillips.tut2') },
  { t: T('gs.phillips.tut3t'), d: T('gs.phillips.tut3') },
  { t: T('gs.phillips.tut4t'), d: T('gs.phillips.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  /* 9-13 字母词（2-3 个 5 字母块，至少用到两个方阵） */
  var WORDS = ['CIPHERTEXT', 'CRYPTOGRAM', 'SUBSTITUTE', 'CRYPTOLOGY', 'ENIGMATICS', 'PLAINTEXTS', 'DECIPHERER', 'MORSECODES', 'CODEBREAKER', 'STEGANOGRAPHY'];
  var KEYWORDS = ['DIAGONALS', 'PHILLIPS', 'CIPHER'];
  var STD25 = 'ABCDEFGHIKLMNOPQRSTUVWXYZ'; /* I/J 合并 */
  var TOTAL = 5, idx = 0, correct = 0;

  /* 关键词 → 5×5 基方阵（行优先） */
  function baseSquare(kw) {
    var seen = {}, seq = '';
    for (var i = 0; i < kw.length; i++) {
      var c = kw.charAt(i);
      if (!seen[c]) { seen[c] = 1; seq += c; }
    }
    for (var j = 0; j < STD25.length; j++) {
      var c2 = STD25.charAt(j);
      if (!seen[c2]) { seen[c2] = 1; seq += c2; }
    }
    var rows = [];
    for (var r = 0; r < 5; r++) rows.push(seq.substr(r * 5, 5).split(''));
    return rows;
  }

  /* 行气泡下沉生 8 阵：原行 1 下沉 4 次（#2-#5），原行 2 下沉 3 次（#6-#8） */
  function buildSquares(base) {
    function clone(g) { return g.map(function (r) { return r.slice(); }); }
    var sqs = [clone(base)];
    var cur = clone(base);
    var pos1 = 0; /* 原行 1 当前所在行 */
    for (var b = 0; b < 4; b++) {
      var t1 = cur[pos1]; cur[pos1] = cur[pos1 + 1]; cur[pos1 + 1] = t1;
      pos1++;
      sqs.push(clone(cur));
    }
    var pos2 = -1; /* 原行 2 的当前位置（按内容查找，clone 后引用已变） */
    var key2 = base[1].join('');
    for (var q = 0; q < 5; q++) if (cur[q].join('') === key2) { pos2 = q; break; }
    for (var c = 0; c < 3; c++) {
      var t2 = cur[pos2]; cur[pos2] = cur[pos2 + 1]; cur[pos2 + 1] = t2;
      pos2++;
      sqs.push(clone(cur));
    }
    return sqs;
  }

  /* 右下对角替换：(r,c) → ((r+1)%5, (c+1)%5)；解密取左上对角 */
  function encLetter(sq, ch) {
    for (var r = 0; r < 5; r++) for (var c = 0; c < 5; c++) if (sq[r][c] === ch) return sq[(r + 1) % 5][(c + 1) % 5];
    return ch;
  }
  function decLetter(sq, ch) {
    for (var r = 0; r < 5; r++) for (var c = 0; c < 5; c++) if (sq[r][c] === ch) return sq[(r + 4) % 5][(c + 4) % 5];
    return ch;
  }

  function encrypt(word, sqs) {
    var t = word.replace(/J/g, 'I'), o = '';
    for (var i = 0; i < t.length; i++) {
      var sq = sqs[Math.floor(i / 5) % 8];
      o += encLetter(sq, t.charAt(i));
    }
    return o;
  }

  function decrypt(ct, sqs) {
    var o = '';
    for (var i = 0; i < ct.length; i++) {
      var sq = sqs[Math.floor(i / 5) % 8];
      o += decLetter(sq, ct.charAt(i));
    }
    return o;
  }

  var wrap = document.createElement('div');
  wrap.className = 'ph-wrap';
  wrap.innerHTML =
    '<div class="ph-progress" id="ph-prog"></div>' +
    '<div class="ph-cipher" id="ph-cipher"></div>' +
    '<div class="ph-key">' + T('gs.phillips.keyLabel') + ' <b id="ph-key"></b></div>' +
    '<div class="ph-squares" id="ph-squares"></div>' +
    '<div class="ph-hint" id="ph-hint"></div>' +
    '<input class="ph-input" id="ph-in" maxlength="14" autocomplete="off" spellcheck="false">' +
    '<div class="ph-msg" id="ph-msg"></div>' +
    '<button class="btn accent" id="ph-sub">' + T('gs.phillips.submit') + '</button>' +
    '<div class="ph-help">' + T('gs.phillips.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#ph-prog'), cipherEl = wrap.querySelector('#ph-cipher'),
      keyEl = wrap.querySelector('#ph-key'), squaresEl = wrap.querySelector('#ph-squares'),
      hint = wrap.querySelector('#ph-hint'),
      input = wrap.querySelector('#ph-in'), msg = wrap.querySelector('#ph-msg'), sub = wrap.querySelector('#ph-sub');

  var answer = '', sqs = [], nextTimer = null;

  function renderSquares() {
    var used = {};
    for (var i = 0; i < answer.length; i++) used[Math.floor(i / 5) % 8] = true;
    var h = '';
    for (var s = 0; s < 8; s++) {
      h += '<div class="ph-sq' + (used[s] ? ' used' : '') + '"><span class="ph-lab">#' + (s + 1) + '</span>';
      for (var r = 0; r < 5; r++) for (var c = 0; c < 5; c++) h += '<span class="ph-cell">' + sqs[s][r][c] + '</span>';
      h += '</div>';
    }
    squaresEl.innerHTML = h;
  }

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    answer = WORDS[Math.floor(Math.random() * WORDS.length)];
    var kw = KEYWORDS[Math.floor(Math.random() * KEYWORDS.length)];
    sqs = buildSquares(baseSquare(kw));
    cipherEl.textContent = encrypt(answer, sqs);
    keyEl.textContent = kw;
    renderSquares();
    hint.textContent = answer.replace(/./g, '_ ').trim();
    input.value = ''; input.maxLength = answer.length;
    prog.textContent = T('gs.phillips.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'ph-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.toUpperCase().trim();
    if (!v) { msg.textContent = T('gs.phillips.msgEmpty'); msg.className = 'ph-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.phillips.msgRight'); msg.className = 'ph-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.phillips.msgWrong').replace('{answer}', answer); msg.className = 'ph-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 1200);
  }

  function finish() {
    cipherEl.textContent = T('gs.phillips.done');
    keyEl.textContent = ''; squaresEl.innerHTML = ''; hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.phillips.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.phillips.perfect') : T('gs.phillips.goodJob');
    msg.className = 'ph-msg ok';
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

  window.__phBase = baseSquare; window.__phSquares = buildSquares;
  window.__phEncrypt = encrypt; window.__phDecrypt = decrypt;
})();
