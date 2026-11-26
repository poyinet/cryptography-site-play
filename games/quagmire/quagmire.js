/* 夸格迈尔密码 Quagmire I（美国密码协会 ACA 的经典周期多表密码）——
   与普通维吉尼亚的区别：明文侧不是标准字母表，而是关键词混字母表。
   加密：第 i 个明文字母 P，取周期密钥数字 k = key[i % keyLen]；
   P 在混字母表里的序号 j，密文 C = 标准字母表[(j + k) mod 26]。
   解密：C 在标准表里的序号 j，P = 混字母表[(j - k) mod 26]。
   5 题一局：看两张对照字母表、周期密钥与密文，还原明文单词。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.quagmire.tut1t'), d: T('gs.quagmire.tut1') },
  { t: T('gs.quagmire.tut2t'), d: T('gs.quagmire.tut2') },
  { t: T('gs.quagmire.tut3t'), d: T('gs.quagmire.tut3') },
  { t: T('gs.quagmire.tut4t'), d: T('gs.quagmire.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var WORDS = ['CIPHER', 'SECRET', 'ENIGMA', 'SIGNAL', 'PUZZLE', 'PATROL', 'RADIO', 'VAULT', 'AGENT', 'MORSE'];
  var KEYWORDS = ['CRYPTO', 'SECRET', 'PUZZLE', 'CIPHER'];
  var KEYS = [
    [3, 1, 4, 1, 5], [2, 7, 1, 8, 2], [5, 5, 2, 1, 9],
    [4, 3, 2, 1], [8, 1, 3, 7, 2], [1, 9, 6, 4]
  ];
  var STD = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var TOTAL = 5, idx = 0, correct = 0;

  /* 关键词 → 26 字母混字母表 */
  function keyedAlpha(keyword) {
    var seen = {}, out = '';
    for (var i = 0; i < keyword.length; i++) {
      var c = keyword.charAt(i);
      if (!seen[c]) { seen[c] = 1; out += c; }
    }
    for (var j = 0; j < STD.length; j++) {
      var c2 = STD.charAt(j);
      if (!seen[c2]) { seen[c2] = 1; out += c2; }
    }
    return out;
  }

  function encrypt(word, alpha, key) {
    var o = '';
    for (var i = 0; i < word.length; i++) {
      var k = key[i % key.length];
      var j = alpha.indexOf(word.charAt(i));
      o += STD.charAt((j + k) % 26);
    }
    return o;
  }

  function decrypt(ct, alpha, key) {
    var o = '';
    for (var i = 0; i < ct.length; i++) {
      var k = key[i % key.length];
      var j = STD.indexOf(ct.charAt(i));
      o += alpha.charAt(((j - k) % 26 + 26) % 26);
    }
    return o;
  }

  var wrap = document.createElement('div');
  wrap.className = 'qm-wrap';
  wrap.innerHTML =
    '<div class="qm-progress" id="qm-prog"></div>' +
    '<div class="qm-cipher" id="qm-cipher"></div>' +
    '<div class="qm-keydigits" id="qm-kd"></div>' +
    '<div class="qm-alpha"><div class="qm-row" id="qm-std"></div><div class="qm-row" id="qm-mix"></div></div>' +
    '<div class="qm-lab">' + T('gs.quagmire.alphaLabel') + '</div>' +
    '<div class="qm-key">' + T('gs.quagmire.keyLabel') + ' <b id="qm-key"></b></div>' +
    '<div class="qm-hint" id="qm-hint"></div>' +
    '<input class="qm-input" id="qm-in" maxlength="10" autocomplete="off" spellcheck="false">' +
    '<div class="qm-msg" id="qm-msg"></div>' +
    '<button class="btn accent" id="qm-sub">' + T('gs.quagmire.submit') + '</button>' +
    '<div class="qm-help">' + T('gs.quagmire.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#qm-prog'), cipherEl = wrap.querySelector('#qm-cipher'),
      kdEl = wrap.querySelector('#qm-kd'), stdEl = wrap.querySelector('#qm-std'),
      mixEl = wrap.querySelector('#qm-mix'), keyEl = wrap.querySelector('#qm-key'),
      hint = wrap.querySelector('#qm-hint'),
      input = wrap.querySelector('#qm-in'), msg = wrap.querySelector('#qm-msg'), sub = wrap.querySelector('#qm-sub');

  var answer = '', alpha = '', key = null, nextTimer = null;

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    answer = WORDS[Math.floor(Math.random() * WORDS.length)];
    var kw = KEYWORDS[Math.floor(Math.random() * KEYWORDS.length)];
    key = KEYS[Math.floor(Math.random() * KEYS.length)];
    alpha = keyedAlpha(kw);
    var ct = encrypt(answer, alpha, key);
    cipherEl.textContent = ct;
    /* 密钥数字逐位对齐显示在密文下方 */
    var kd = '';
    for (var i = 0; i < ct.length; i++) kd += key[i % key.length] + ' ';
    kdEl.textContent = kd.trim();
    var hs = '', hm = '';
    for (var s = 0; s < 26; s++) { hs += '<span class="qm-cell std">' + STD.charAt(s) + '</span>'; hm += '<span class="qm-cell mix">' + alpha.charAt(s) + '</span>'; }
    stdEl.innerHTML = hs; mixEl.innerHTML = hm;
    keyEl.textContent = key.join(' ');
    hint.textContent = answer.replace(/./g, '_ ').trim();
    input.value = ''; input.maxLength = answer.length;
    prog.textContent = T('gs.quagmire.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'qm-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.toUpperCase().trim();
    if (!v) { msg.textContent = T('gs.quagmire.msgEmpty'); msg.className = 'qm-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.quagmire.msgRight'); msg.className = 'qm-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.quagmire.msgWrong').replace('{answer}', answer); msg.className = 'qm-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 1000);
  }

  function finish() {
    cipherEl.textContent = T('gs.quagmire.done');
    kdEl.textContent = ''; stdEl.innerHTML = ''; mixEl.innerHTML = ''; keyEl.textContent = ''; hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.quagmire.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.quagmire.perfect') : T('gs.quagmire.goodJob');
    msg.className = 'qm-msg ok';
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

  window.__qmEncrypt = encrypt; window.__qmDecrypt = decrypt; window.__qmKeyed = keyedAlpha;
})();
