/* Nicodemus 密码（ACA 经典乘积密码）——
   两步一条链，同一个关键词：
   ① 维吉尼亚替换：C = (P 序号 + K 序号) mod 26；
   ② 列换位：把替换结果写进与关键词等长的网格，按关键词字母序逐列读出。
   解密反过来：先按密钥序把密文切回各列、按行读出，再做维吉尼亚减法。
   5 题一局：看密文与关键词，还原明文单词。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.nicodemus.tut1t'), d: T('gs.nicodemus.tut1') },
  { t: T('gs.nicodemus.tut2t'), d: T('gs.nicodemus.tut2') },
  { t: T('gs.nicodemus.tut3t'), d: T('gs.nicodemus.tut3') },
  { t: T('gs.nicodemus.tut4t'), d: T('gs.nicodemus.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var WORDS = ['CIPHER', 'SECRET', 'ENIGMA', 'SIGNAL', 'PUZZLE', 'PATROL', 'RADIO', 'VAULT', 'AGENT', 'MORSE'];
  /* 密钥池按词长配对，保证词长 ÷ 列数整除——永不填充，也就永远不需要去尾 */
  var KW5 = ['DELTA', 'ROUTE', 'TABLE'];                 /* 5 列：配 5 字母词 */
  var KW63 = ['CIPHER', 'SECRET', 'SIGNAL', 'ENIGMA', 'KEY', 'BOX']; /* 6 列或 3 列：配 6 字母词 */
  var STD = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var TOTAL = 5, idx = 0, correct = 0;

  /* 关键词列序（相同字母按出现顺序） */
  function keyPairs(kw) {
    var pairs = [];
    for (var c = 0; c < kw.length; c++) pairs.push([kw.charAt(c), c]);
    pairs.sort(function (a, b) { return a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 : a[1] - b[1]); });
    return pairs;
  }

  function vigenere(word, kw, sign) {
    var o = '';
    for (var i = 0; i < word.length; i++) {
      var k = STD.indexOf(kw.charAt(i % kw.length));
      var p = STD.indexOf(word.charAt(i));
      o += STD.charAt((((p + sign * k) % 26) + 26) % 26);
    }
    return o;
  }

  /* 列换位（写行序、读列序；调用方保证长度整除列数，无填充） */
  function transpose(text, kw) {
    var N = kw.length, rows = text.length / N, o = '';
    var pairs = keyPairs(kw);
    for (var k = 0; k < N; k++) {
      var col = pairs[k][1];
      for (var r = 0; r < rows; r++) o += text.charAt(r * N + col);
    }
    return o;
  }

  /* 逆列换位（无填充，无需去尾） */
  function untranspose(ct, kw) {
    var N = kw.length, rows = ct.length / N, cols = new Array(N), pos = 0;
    var pairs = keyPairs(kw);
    for (var k = 0; k < N; k++) {
      cols[pairs[k][1]] = ct.substr(pos, rows);
      pos += rows;
    }
    var o = '';
    for (var r = 0; r < rows; r++) for (var c = 0; c < N; c++) o += cols[c].charAt(r);
    return o;
  }

  function encrypt(word, kw) {
    return transpose(vigenere(word, kw, 1), kw);
  }

  function decrypt(ct, kw) {
    return vigenere(untranspose(ct, kw), kw, -1);
  }

  var wrap = document.createElement('div');
  wrap.className = 'nc-wrap';
  wrap.innerHTML =
    '<div class="nc-progress" id="nc-prog"></div>' +
    '<div class="nc-cipher" id="nc-cipher"></div>' +
    '<div class="nc-key">' + T('gs.nicodemus.keyLabel') + ' <b id="nc-key"></b></div>' +
    '<div class="nc-hint" id="nc-hint"></div>' +
    '<input class="nc-input" id="nc-in" maxlength="10" autocomplete="off" spellcheck="false">' +
    '<div class="nc-msg" id="nc-msg"></div>' +
    '<button class="btn accent" id="nc-sub">' + T('gs.nicodemus.submit') + '</button>' +
    '<div class="nc-help">' + T('gs.nicodemus.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#nc-prog'), cipherEl = wrap.querySelector('#nc-cipher'),
      keyEl = wrap.querySelector('#nc-key'), hint = wrap.querySelector('#nc-hint'),
      input = wrap.querySelector('#nc-in'), msg = wrap.querySelector('#nc-msg'), sub = wrap.querySelector('#nc-sub');

  var answer = '', keyword = '', nextTimer = null;

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    answer = WORDS[Math.floor(Math.random() * WORDS.length)];
    var pool = answer.length === 5 ? KW5 : KW63;
    keyword = pool[Math.floor(Math.random() * pool.length)];
    cipherEl.textContent = encrypt(answer, keyword);
    keyEl.textContent = keyword + '（' + keyword.length + ' ' + T('gs.nicodemus.cols') + '）';
    hint.textContent = answer.replace(/./g, '_ ').trim();
    input.value = ''; input.maxLength = answer.length;
    prog.textContent = T('gs.nicodemus.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'nc-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.toUpperCase().trim();
    if (!v) { msg.textContent = T('gs.nicodemus.msgEmpty'); msg.className = 'nc-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.nicodemus.msgRight'); msg.className = 'nc-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.nicodemus.msgWrong').replace('{answer}', answer); msg.className = 'nc-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 1000);
  }

  function finish() {
    cipherEl.textContent = T('gs.nicodemus.done');
    keyEl.textContent = ''; hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.nicodemus.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.nicodemus.perfect') : T('gs.nicodemus.goodJob');
    msg.className = 'nc-msg ok';
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

  window.__ncEncrypt = encrypt; window.__ncDecrypt = decrypt;
})();
