/* 双方阵密码 Two-square（又称 Double Square，波利比奥斯方阵家族的双阵成员）——
   左右两个 5×5 混方阵（各由一个关键词生成，I/J 合并）。
   加密：明文两两成组。P1 在左方阵定位 (行1,列1)，P2 在右方阵定位 (行2,列2)；
   取对角矩形——C1 = 右方阵[行1,列2]，C2 = 左方阵[行2,列1]。
   本实现采用无歧义的「对角矩形」规则：即使两字同行，矩形规则也自然成立
   （不设同行特例），因此加密与解密严格互逆。
   解密：C1 在右方阵定位 (行1,列2)，C2 在左方阵定位 (行2,列1)，
   P1 = 左方阵[行1,列1]，P2 = 右方阵[行2,列2]。
   5 题一局：看双方阵与密文（两两分组），还原明文单词。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.twosquare.tut1t'), d: T('gs.twosquare.tut1') },
  { t: T('gs.twosquare.tut2t'), d: T('gs.twosquare.tut2') },
  { t: T('gs.twosquare.tut3t'), d: T('gs.twosquare.tut3') },
  { t: T('gs.twosquare.tut4t'), d: T('gs.twosquare.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  /* 全部 6 字母词（偶数长免填充），不含 J */
  var WORDS = ['CIPHER', 'SECRET', 'ARCADE', 'ENIGMA', 'SIGNAL', 'PUZZLE', 'BATTLE', 'DECODE', 'FORCES', 'VAULTS'];
  var KW_LEFT = ['CRYPTO', 'SECRET', 'CIPHER'];
  var KW_RIGHT = ['PUZZLE', 'SIGNAL', 'ENIGMA'];
  var STD25 = 'ABCDEFGHIKLMNOPQRSTUVWXYZ'; /* I/J 合并 */
  var TOTAL = 5, idx = 0, correct = 0;

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

  function find(g, ch) {
    for (var r = 0; r < 5; r++) for (var c = 0; c < 5; c++) if (g[r][c] === ch) return [r, c];
    return [0, 0];
  }

  /* 加密一组：P1 在左阵、P2 在右阵 → 对角矩形 */
  function encPair(p1, p2, L, R) {
    var t = (p1 === 'J' ? 'I' : p1), u = (p2 === 'J' ? 'I' : p2);
    var a = find(L, t), b = find(R, u);
    return R[a[0]][b[1]] + L[b[0]][a[1]];
  }

  /* 解密一组：C1 在右阵 (行1,列2)、C2 在左阵 (行2,列1) → P1 = 左阵[行1,列1]，P2 = 右阵[行2,列2] */
  function decPair(c1, c2, L, R) {
    var a = find(R, c1), b = find(L, c2);
    return L[a[0]][b[1]] + R[b[0]][a[1]];
  }

  function encrypt(word, L, R) {
    var o = '';
    for (var i = 0; i < word.length; i += 2) o += encPair(word.charAt(i), word.charAt(i + 1), L, R);
    return o;
  }

  function decrypt(ct, L, R) {
    var o = '';
    for (var i = 0; i < ct.length; i += 2) o += decPair(ct.charAt(i), ct.charAt(i + 1), L, R);
    return o;
  }

  var wrap = document.createElement('div');
  wrap.className = 'ts-wrap';
  wrap.innerHTML =
    '<div class="ts-progress" id="ts-prog"></div>' +
    '<div class="ts-cipher" id="ts-cipher"></div>' +
    '<div class="ts-key">' + T('gs.twosquare.keyLabel') + ' <b id="ts-key"></b></div>' +
    '<div class="ts-squares" id="ts-squares"></div>' +
    '<div class="ts-hint" id="ts-hint"></div>' +
    '<input class="ts-input" id="ts-in" maxlength="10" autocomplete="off" spellcheck="false">' +
    '<div class="ts-msg" id="ts-msg"></div>' +
    '<button class="btn accent" id="ts-sub">' + T('gs.twosquare.submit') + '</button>' +
    '<div class="ts-help">' + T('gs.twosquare.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#ts-prog'), cipherEl = wrap.querySelector('#ts-cipher'),
      keyEl = wrap.querySelector('#ts-key'), squaresEl = wrap.querySelector('#ts-squares'),
      hint = wrap.querySelector('#ts-hint'),
      input = wrap.querySelector('#ts-in'), msg = wrap.querySelector('#ts-msg'), sub = wrap.querySelector('#ts-sub');

  var answer = '', L = [], R = [], nextTimer = null;

  function renderSquare(label, g, cls) {
    var h = '<div class="ts-sq ' + cls + '"><span class="ts-lab">' + label + '</span>';
    for (var r = 0; r < 5; r++) for (var c = 0; c < 5; c++) h += '<span class="ts-cell">' + g[r][c] + '</span>';
    return h + '</div>';
  }

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    answer = WORDS[Math.floor(Math.random() * WORDS.length)];
    var kwl = KW_LEFT[Math.floor(Math.random() * KW_LEFT.length)];
    var kwr = KW_RIGHT[Math.floor(Math.random() * KW_RIGHT.length)];
    L = keyedSquare(kwl); R = keyedSquare(kwr);
    cipherEl.textContent = encrypt(answer, L, R);
    keyEl.textContent = T('gs.twosquare.left') + ' ' + kwl + ' · ' + T('gs.twosquare.right') + ' ' + kwr;
    squaresEl.innerHTML = renderSquare(T('gs.twosquare.leftSq'), L, 'l') + renderSquare(T('gs.twosquare.rightSq'), R, 'r');
    hint.textContent = answer.replace(/./g, '_ ').trim();
    input.value = ''; input.maxLength = answer.length;
    prog.textContent = T('gs.twosquare.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'ts-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.toUpperCase().trim();
    if (!v) { msg.textContent = T('gs.twosquare.msgEmpty'); msg.className = 'ts-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.twosquare.msgRight'); msg.className = 'ts-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.twosquare.msgWrong').replace('{answer}', answer); msg.className = 'ts-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 900);
  }

  function finish() {
    cipherEl.textContent = T('gs.twosquare.done');
    keyEl.textContent = ''; squaresEl.innerHTML = ''; hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.twosquare.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.twosquare.perfect') : T('gs.twosquare.goodJob');
    msg.className = 'ts-msg ok';
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

  window.__tsEncrypt = encrypt; window.__tsDecrypt = decrypt; window.__tsKeyed = keyedSquare;
})();
