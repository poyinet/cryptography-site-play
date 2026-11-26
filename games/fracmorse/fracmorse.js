/* 分馏摩斯密码 Fractionated Morse（ACA 1960，FIDDLE 发表）——
   第一步：明文 → 摩斯电码，字母间用 x 分隔，词间用 xx（本题均为单词）。
   第二步：摩斯流按 3 个符号一组切分；每组（., -, x）按 9·v1+3·v2+v3 得到 0..25 的序号
   （v('.')=0, v('-')=1, v('x')=2；'xxx'=26 永不出现）。
   第三步：序号在关键词混字母表里取对应字母作密文。一个密文字母混着多个明文字母的片段，
   频率分析就此失效。5 题一局：看密钥表（混字母 + 三行符号）与密文，还原明文单词。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.fracmorse.tut1t'), d: T('gs.fracmorse.tut1') },
  { t: T('gs.fracmorse.tut2t'), d: T('gs.fracmorse.tut2') },
  { t: T('gs.fracmorse.tut3t'), d: T('gs.fracmorse.tut3') },
  { t: T('gs.fracmorse.tut4t'), d: T('gs.fracmorse.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var WORDS = ['CIPHER', 'SECRET', 'ENIGMA', 'SIGNAL', 'PUZZLE', 'MORSE', 'AGENT', 'VAULT', 'PATROL', 'RADIO'];
  var KEYS = ['CROWDED', 'ROUNDTABLE', 'CIPHER', 'SIGNAL'];
  var ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var MORSE = {
    A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....',
    I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.',
    Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
    Y: '-.--', Z: '--..'
  };
  var TOTAL = 5, idx = 0, correct = 0;

  /* 关键词 → 26 字母混字母表 */
  function keyedAlpha(keyword) {
    var seen = {}, out = '';
    for (var i = 0; i < keyword.length; i++) {
      var c = keyword.charAt(i);
      if (!seen[c]) { seen[c] = 1; out += c; }
    }
    for (var j = 0; j < ALPHA.length; j++) {
      var c2 = ALPHA.charAt(j);
      if (!seen[c2]) { seen[c2] = 1; out += c2; }
    }
    return out;
  }

  /* 符号 → 数值 */
  function v(s) { return s === '.' ? 0 : (s === '-' ? 1 : 2); }
  function sym(n) { return n === 0 ? '.' : (n === 1 ? '-' : 'x'); }

  /* 序号 0..25 → 三元组（表的第一/第二/第三个符号） */
  function tri(n) { return sym(Math.floor(n / 9)) + sym(Math.floor(n / 3) % 3) + sym(n % 3); }

  function toMorse(word) {
    var parts = [];
    for (var i = 0; i < word.length; i++) parts.push(MORSE[word.charAt(i)]);
    return parts.join('x');
  }

  /* 加密：摩斯流补齐到 3 的倍数（补 x），每组换成混字母表字母 */
  function encrypt(word, alpha) {
    var stream = toMorse(word);
    while (stream.length % 3 !== 0) stream += 'x';
    var o = '';
    for (var i = 0; i < stream.length; i += 3) {
      var n = 9 * v(stream.charAt(i)) + 3 * v(stream.charAt(i + 1)) + v(stream.charAt(i + 2));
      o += alpha.charAt(n);
    }
    return o;
  }

  /* 解密：密文字母 → 序号 → 三元组 → 摩斯流 → 去尾部补位 x → 按 x 切分 → 字母 */
  function decrypt(ct, alpha) {
    var stream = '';
    for (var i = 0; i < ct.length; i++) {
      stream += tri(alpha.indexOf(ct.charAt(i)));
    }
    while (stream.length > 0 && stream.charAt(stream.length - 1) === 'x') stream = stream.slice(0, -1);
    var groups = stream.split('x'), o = '';
    for (var g = 0; g < groups.length; g++) {
      for (var c in MORSE) if (MORSE[c] === groups[g]) { o += c; break; }
    }
    return o;
  }

  var wrap = document.createElement('div');
  wrap.className = 'fm-wrap';
  wrap.innerHTML =
    '<div class="fm-progress" id="fm-prog"></div>' +
    '<div class="fm-cipher" id="fm-cipher"></div>' +
    '<div class="fm-scroll"><div class="fm-table" id="fm-table"></div></div>' +
    '<div class="fm-hint" id="fm-hint"></div>' +
    '<input class="fm-input" id="fm-in" maxlength="10" autocomplete="off" spellcheck="false">' +
    '<div class="fm-msg" id="fm-msg"></div>' +
    '<button class="btn accent" id="fm-sub">' + T('gs.fracmorse.submit') + '</button>' +
    '<div class="fm-help">' + T('gs.fracmorse.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#fm-prog'), cipherEl = wrap.querySelector('#fm-cipher'),
      tableEl = wrap.querySelector('#fm-table'), hint = wrap.querySelector('#fm-hint'),
      input = wrap.querySelector('#fm-in'), msg = wrap.querySelector('#fm-msg'), sub = wrap.querySelector('#fm-sub');

  var answer = '', alpha = '', nextTimer = null;

  function renderTable() {
    var h = '';
    for (var i = 0; i < 26; i++) h += '<span class="fm-cell a">' + alpha.charAt(i) + '</span>';
    for (var j = 0; j < 26; j++) h += '<span class="fm-cell s">' + tri(j).charAt(0) + '</span>';
    for (var k = 0; k < 26; k++) h += '<span class="fm-cell s">' + tri(k).charAt(1) + '</span>';
    for (var m = 0; m < 26; m++) h += '<span class="fm-cell s">' + tri(m).charAt(2) + '</span>';
    tableEl.innerHTML = h;
  }

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    answer = WORDS[Math.floor(Math.random() * WORDS.length)];
    var kw = KEYS[Math.floor(Math.random() * KEYS.length)];
    alpha = keyedAlpha(kw);
    cipherEl.textContent = encrypt(answer, alpha);
    renderTable();
    hint.textContent = answer.replace(/./g, '_ ').trim();
    input.value = ''; input.maxLength = answer.length;
    prog.textContent = T('gs.fracmorse.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'fm-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v2 = input.value.toUpperCase().trim();
    if (!v2) { msg.textContent = T('gs.fracmorse.msgEmpty'); msg.className = 'fm-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v2 === answer) {
      correct++;
      msg.textContent = T('gs.fracmorse.msgRight'); msg.className = 'fm-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.fracmorse.msgWrong').replace('{answer}', answer); msg.className = 'fm-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 1000);
  }

  function finish() {
    cipherEl.textContent = T('gs.fracmorse.done');
    tableEl.innerHTML = ''; hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.fracmorse.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.fracmorse.perfect') : T('gs.fracmorse.goodJob');
    msg.className = 'fm-msg ok';
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

  window.__fmEncrypt = encrypt; window.__fmDecrypt = decrypt; window.__fmKeyed = keyedAlpha;
})();
