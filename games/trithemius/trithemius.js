/* 特里特米乌斯密码 Trithemius（Johannes Trithemius，1518《Polygraphia》）——
   人类印刷史上第一种多表密码：密钥不用人给，它自己会走路。
   第 i 个字母（从 0 数起）的移位量就是 i mod 26：移 0、1、2……25，再从头开始。
   加密：C = 标准表[(P 序号 + i) mod 26]；解密反向。
   5 题一局：看密文与逐位移位序号，还原明文单词。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.trithemius.tut1t'), d: T('gs.trithemius.tut1') },
  { t: T('gs.trithemius.tut2t'), d: T('gs.trithemius.tut2') },
  { t: T('gs.trithemius.tut3t'), d: T('gs.trithemius.tut3') },
  { t: T('gs.trithemius.tut4t'), d: T('gs.trithemius.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var WORDS = ['CIPHER', 'SECRET', 'ENIGMA', 'SIGNAL', 'PUZZLE', 'PATROL', 'RADIO', 'VAULT', 'AGENT', 'MORSE'];
  var STD = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var TOTAL = 5, idx = 0, correct = 0;

  /* 第 i 位的移位量 = i mod 26 */
  function shiftAt(i) { return i % 26; }

  function encrypt(word) {
    var o = '';
    for (var i = 0; i < word.length; i++) {
      o += STD.charAt((STD.indexOf(word.charAt(i)) + shiftAt(i)) % 26);
    }
    return o;
  }

  function decrypt(ct) {
    var o = '';
    for (var i = 0; i < ct.length; i++) {
      o += STD.charAt(((STD.indexOf(ct.charAt(i)) - shiftAt(i)) % 26 + 26) % 26);
    }
    return o;
  }

  var wrap = document.createElement('div');
  wrap.className = 'tr-wrap';
  wrap.innerHTML =
    '<div class="tr-progress" id="tr-prog"></div>' +
    '<div class="tr-cipher" id="tr-cipher"></div>' +
    '<div class="tr-shifts" id="tr-shifts"></div>' +
    '<div class="tr-strip"><div class="tr-row" id="tr-std"></div><div class="tr-row" id="tr-key"></div></div>' +
    '<div class="tr-lab">' + T('gs.trithemius.alphaLabel') + '</div>' +
    '<div class="tr-hint" id="tr-hint"></div>' +
    '<input class="tr-input" id="tr-in" maxlength="10" autocomplete="off" spellcheck="false">' +
    '<div class="tr-msg" id="tr-msg"></div>' +
    '<button class="btn accent" id="tr-sub">' + T('gs.trithemius.submit') + '</button>' +
    '<div class="tr-help">' + T('gs.trithemius.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#tr-prog'), cipherEl = wrap.querySelector('#tr-cipher'),
      shiftsEl = wrap.querySelector('#tr-shifts'), stdEl = wrap.querySelector('#tr-std'),
      keyEl = wrap.querySelector('#tr-key'), hint = wrap.querySelector('#tr-hint'),
      input = wrap.querySelector('#tr-in'), msg = wrap.querySelector('#tr-msg'), sub = wrap.querySelector('#tr-sub');

  var answer = '', nextTimer = null;

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    answer = WORDS[Math.floor(Math.random() * WORDS.length)];
    var ct = encrypt(answer);
    cipherEl.textContent = ct;
    var sh = '';
    for (var i = 0; i < ct.length; i++) sh += shiftAt(i) + ' ';
    shiftsEl.textContent = sh.trim();
    var hs = '', hk = '';
    for (var s = 0; s < 26; s++) {
      hs += '<span class="tr-cell std">' + STD.charAt(s) + '</span>';
      hk += '<span class="tr-cell key">' + STD.charAt((s + 1) % 26) + '</span>';
    }
    stdEl.innerHTML = hs; keyEl.innerHTML = hk;
    hint.textContent = answer.replace(/./g, '_ ').trim();
    input.value = ''; input.maxLength = answer.length;
    prog.textContent = T('gs.trithemius.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'tr-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.toUpperCase().trim();
    if (!v) { msg.textContent = T('gs.trithemius.msgEmpty'); msg.className = 'tr-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.trithemius.msgRight'); msg.className = 'tr-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.trithemius.msgWrong').replace('{answer}', answer); msg.className = 'tr-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 900);
  }

  function finish() {
    cipherEl.textContent = T('gs.trithemius.done');
    shiftsEl.textContent = ''; stdEl.innerHTML = ''; keyEl.innerHTML = ''; hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.trithemius.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.trithemius.perfect') : T('gs.trithemius.goodJob');
    msg.className = 'tr-msg ok';
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

  window.__trEncrypt = encrypt; window.__trDecrypt = decrypt;
})();
