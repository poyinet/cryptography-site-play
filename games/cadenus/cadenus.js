/* 卡德纳斯换位密码 Cadenus —— 19 世纪古典换位法。
   加密：明文按行写进 N 列网格（N=密钥长度，不足补 X）；每一列按密钥号向上旋转
   （密钥号 k 的列，其第 k 个字母转到列顶，即上旋 k-1 格）；然后按密钥顺序
   （密钥号 1 的列先读）逐列自上而下读出成密文。
   解密：把密文按密钥顺序切成 N 段列，每列下旋 k-1 格还原，再按行读出。
   5 题一局：看密文与数字密钥，还原明文单词。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.cadenus.tut1t'), d: T('gs.cadenus.tut1') },
  { t: T('gs.cadenus.tut2t'), d: T('gs.cadenus.tut2') },
  { t: T('gs.cadenus.tut3t'), d: T('gs.cadenus.tut3') },
  { t: T('gs.cadenus.tut4t'), d: T('gs.cadenus.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var WORDS = ['CIPHER', 'SECRET', 'ENIGMA', 'SIGNAL', 'PUZZLE', 'PATROL', 'RADIO', 'VAULT', 'AGENT', 'MORSE'];
  /* 4-5 列的数字密钥（1..N 的排列） */
  var KEYS = [
    [3, 1, 4, 2], [2, 4, 1, 3], [4, 2, 3, 1],
    [2, 5, 1, 4, 3], [3, 1, 5, 2, 4], [5, 3, 1, 4, 2]
  ];
  var TOTAL = 5, idx = 0, correct = 0;

  /* 列上旋 k 格 */
  function rotUp(col, k) {
    var n = col.length; k = ((k % n) + n) % n;
    return col.slice(k).concat(col.slice(0, k));
  }
  /* 列下旋 k 格 */
  function rotDown(col, k) {
    var n = col.length; k = ((k % n) + n) % n;
    return col.slice(n - k).concat(col.slice(0, n - k));
  }

  /* 加密：写网格 → 每列上旋 (k-1) → 按密钥顺序逐列读出 */
  function encrypt(word, key) {
    var N = key.length;
    var padded = word;
    while (padded.length % N !== 0) padded += 'X';
    var rows = padded.length / N, cols = [];
    for (var c = 0; c < N; c++) {
      var col = [];
      for (var r = 0; r < rows; r++) col.push(padded.charAt(r * N + c));
      cols.push(rotUp(col, key[c] - 1));
    }
    /* 按密钥号顺序读列（密钥号 1 的列先读） */
    var order = [];
    for (var v = 1; v <= N; v++) order.push(key.indexOf(v));
    var o = '';
    for (var i = 0; i < N; i++) o += cols[order[i]].join('');
    return o;
  }

  /* 解密：按密钥顺序切列 → 每列下旋 (k-1) → 按行读出 → 去尾部补位 X */
  function decrypt(ct, key) {
    var N = key.length, rows = ct.length / N, cols = new Array(N);
    var order = [];
    for (var v = 1; v <= N; v++) order.push(key.indexOf(v));
    for (var i = 0; i < N; i++) {
      var col = ct.substr(i * rows, rows).split('');
      cols[order[i]] = rotDown(col, key[order[i]] - 1);
    }
    var o = '';
    for (var r = 0; r < rows; r++) for (var c = 0; c < N; c++) o += cols[c][r];
    while (o.length > 0 && o.charAt(o.length - 1) === 'X') o = o.slice(0, -1);
    return o;
  }

  var wrap = document.createElement('div');
  wrap.className = 'cd-wrap';
  wrap.innerHTML =
    '<div class="cd-progress" id="cd-prog"></div>' +
    '<div class="cd-cipher" id="cd-cipher"></div>' +
    '<div class="cd-key">' + T('gs.cadenus.keyLabel') + ' <b id="cd-key"></b></div>' +
    '<div class="cd-hint" id="cd-hint"></div>' +
    '<input class="cd-input" id="cd-in" maxlength="10" autocomplete="off" spellcheck="false">' +
    '<div class="cd-msg" id="cd-msg"></div>' +
    '<button class="btn accent" id="cd-sub">' + T('gs.cadenus.submit') + '</button>' +
    '<div class="cd-help">' + T('gs.cadenus.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#cd-prog'), cipherEl = wrap.querySelector('#cd-cipher'),
      keyEl = wrap.querySelector('#cd-key'), hint = wrap.querySelector('#cd-hint'),
      input = wrap.querySelector('#cd-in'), msg = wrap.querySelector('#cd-msg'), sub = wrap.querySelector('#cd-sub');

  var answer = '', key = null, nextTimer = null;

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    answer = WORDS[Math.floor(Math.random() * WORDS.length)];
    key = KEYS[Math.floor(Math.random() * KEYS.length)];
    cipherEl.textContent = encrypt(answer, key);
    keyEl.textContent = key.join(' ') + '（' + key.length + ' ' + T('gs.cadenus.cols') + '）';
    hint.textContent = answer.replace(/./g, '_ ').trim();
    input.value = ''; input.maxLength = answer.length;
    prog.textContent = T('gs.cadenus.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'cd-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.toUpperCase().trim();
    if (!v) { msg.textContent = T('gs.cadenus.msgEmpty'); msg.className = 'cd-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.cadenus.msgRight'); msg.className = 'cd-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.cadenus.msgWrong').replace('{answer}', answer); msg.className = 'cd-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 900);
  }

  function finish() {
    cipherEl.textContent = T('gs.cadenus.done');
    keyEl.textContent = ''; hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.cadenus.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.cadenus.perfect') : T('gs.cadenus.goodJob');
    msg.className = 'cd-msg ok';
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

  window.__cdEncrypt = encrypt; window.__cdDecrypt = decrypt;
})();
