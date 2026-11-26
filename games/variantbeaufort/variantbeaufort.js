/* 变体波特密码 Variant Beaufort——
   波特家族三兄弟的镜像版（都靠维吉尼亚方阵，只是加减方向不同）：
   维吉尼亚：C = P + K；波特：C = K − P；变体波特：C = P − K。
   本机负责「倒退」：每个明文字母往左数密钥字母的格数（A=0、B=1……）得到密文。
   解密同构：密文字母往右数密钥格数即明文。
   5 题一局：看密文、密钥与逐位密钥字母，还原明文单词。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.variantbeaufort.tut1t'), d: T('gs.variantbeaufort.tut1') },
  { t: T('gs.variantbeaufort.tut2t'), d: T('gs.variantbeaufort.tut2') },
  { t: T('gs.variantbeaufort.tut3t'), d: T('gs.variantbeaufort.tut3') },
  { t: T('gs.variantbeaufort.tut4t'), d: T('gs.variantbeaufort.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var WORDS = ['CIPHER', 'SECRET', 'ENIGMA', 'SIGNAL', 'PUZZLE', 'PATROL', 'RADIO', 'VAULT', 'AGENT', 'MORSE'];
  var KEYWORDS = ['VIGENERE', 'CIPHER', 'SECRET', 'ENIGMA'];
  var STD = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var TOTAL = 5, idx = 0, correct = 0;

  /* 加密：C = (P − K) mod 26 */
  function encrypt(word, kw) {
    var o = '';
    for (var i = 0; i < word.length; i++) {
      var p = STD.indexOf(word.charAt(i));
      var k = STD.indexOf(kw.charAt(i % kw.length));
      o += STD.charAt((((p - k) % 26) + 26) % 26);
    }
    return o;
  }

  /* 解密：P = (C + K) mod 26 */
  function decrypt(ct, kw) {
    var o = '';
    for (var i = 0; i < ct.length; i++) {
      var c = STD.indexOf(ct.charAt(i));
      var k = STD.indexOf(kw.charAt(i % kw.length));
      o += STD.charAt((c + k) % 26);
    }
    return o;
  }

  var wrap = document.createElement('div');
  wrap.className = 'vb-wrap';
  wrap.innerHTML =
    '<div class="vb-progress" id="vb-prog"></div>' +
    '<div class="vb-cipher" id="vb-cipher"></div>' +
    '<div class="vb-keyrow" id="vb-keyrow"></div>' +
    '<div class="vb-key">' + T('gs.variantbeaufort.keyLabel') + ' <b id="vb-key"></b></div>' +
    '<div class="vb-hint" id="vb-hint"></div>' +
    '<input class="vb-input" id="vb-in" maxlength="10" autocomplete="off" spellcheck="false">' +
    '<div class="vb-msg" id="vb-msg"></div>' +
    '<button class="btn accent" id="vb-sub">' + T('gs.variantbeaufort.submit') + '</button>' +
    '<div class="vb-help">' + T('gs.variantbeaufort.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#vb-prog'), cipherEl = wrap.querySelector('#vb-cipher'),
      keyrowEl = wrap.querySelector('#vb-keyrow'), keyEl = wrap.querySelector('#vb-key'),
      hint = wrap.querySelector('#vb-hint'),
      input = wrap.querySelector('#vb-in'), msg = wrap.querySelector('#vb-msg'), sub = wrap.querySelector('#vb-sub');

  var answer = '', keyword = '', nextTimer = null;

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    answer = WORDS[Math.floor(Math.random() * WORDS.length)];
    keyword = KEYWORDS[Math.floor(Math.random() * KEYWORDS.length)];
    cipherEl.textContent = encrypt(answer, keyword);
    var kr = '';
    for (var i = 0; i < answer.length; i++) kr += keyword.charAt(i % keyword.length) + ' ';
    keyrowEl.textContent = kr.trim();
    keyEl.textContent = keyword;
    hint.textContent = answer.replace(/./g, '_ ').trim();
    input.value = ''; input.maxLength = answer.length;
    prog.textContent = T('gs.variantbeaufort.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'vb-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.toUpperCase().trim();
    if (!v) { msg.textContent = T('gs.variantbeaufort.msgEmpty'); msg.className = 'vb-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.variantbeaufort.msgRight'); msg.className = 'vb-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.variantbeaufort.msgWrong').replace('{answer}', answer); msg.className = 'vb-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 900);
  }

  function finish() {
    cipherEl.textContent = T('gs.variantbeaufort.done');
    keyrowEl.textContent = ''; keyEl.textContent = ''; hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.variantbeaufort.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.variantbeaufort.perfect') : T('gs.variantbeaufort.goodJob');
    msg.className = 'vb-msg ok';
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

  window.__vbEncrypt = encrypt; window.__vbDecrypt = decrypt;
})();
