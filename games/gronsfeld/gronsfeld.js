/* 格朗斯菲尔德密码 Gronsfeld —— 维吉尼亚的数字变体：密钥只用 0-9 的数位，
   明文只沿 Vigenère 表首行平移 K 位（密文 = 明文 + 密钥数字）。
   相传 1628 年荷兰一位修女用它「预言」了战役胜负。5 题一局：看密文与数字密钥，反推明文。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.gronsfeld.tut1t'), d: T('gs.gronsfeld.tut1') },
  { t: T('gs.gronsfeld.tut2t'), d: T('gs.gronsfeld.tut2') },
  { t: T('gs.gronsfeld.tut3t'), d: T('gs.gronsfeld.tut3') },
  { t: T('gs.gronsfeld.tut4t'), d: T('gs.gronsfeld.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var WORDS = ['ARCADE', 'CIPHER', 'SECRET', 'BATTLE', 'ARMY', 'FLEET', 'CODE', 'SIGNAL', 'VAULT', 'PATROL'];
  var TOTAL = 5, idx = 0, correct = 0;

  /* 格朗斯菲尔德加密：明文沿首行平移「密钥数字」位（0-9） */
  function encode(word, key) {
    var o = '';
    for (var i = 0; i < word.length; i++) {
      var p = word.charCodeAt(i) - 65;
      var k = (key.charCodeAt(i) - 48) % 10;
      o += String.fromCharCode(65 + (p + k) % 26);
    }
    return o;
  }

  function digits(len) {
    var s = '';
    for (var i = 0; i < len; i++) s += Math.floor(Math.random() * 10);
    return s;
  }

  var wrap = document.createElement('div');
  wrap.className = 'gf-wrap';
  wrap.innerHTML =
    '<div class="gf-progress" id="gf-prog"></div>' +
    '<div class="gf-cipher" id="gf-cipher"></div>' +
    '<div class="gf-key">' + T('gs.gronsfeld.keyLabel') + ' <span class="gf-keyv" id="gf-key"></span></div>' +
    '<div class="gf-hint" id="gf-hint"></div>' +
    '<input class="gf-input" id="gf-in" maxlength="10" autocomplete="off" spellcheck="false">' +
    '<div class="gf-msg" id="gf-msg"></div>' +
    '<button class="btn accent" id="gf-sub">' + T('gs.gronsfeld.submit') + '</button>' +
    '<div class="gf-help">' + T('gs.gronsfeld.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#gf-prog'), cipherEl = wrap.querySelector('#gf-cipher'),
      keyEl = wrap.querySelector('#gf-key'), hint = wrap.querySelector('#gf-hint'),
      input = wrap.querySelector('#gf-in'), msg = wrap.querySelector('#gf-msg'), sub = wrap.querySelector('#gf-sub');

  var answer = '', key = '', nextTimer = null;

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    answer = WORDS[Math.floor(Math.random() * WORDS.length)];
    key = digits(answer.length);
    cipherEl.textContent = encode(answer, key);
    keyEl.textContent = key;
    hint.textContent = answer.replace(/./g, '_ ').trim();
    input.value = ''; input.maxLength = answer.length;
    prog.textContent = T('gs.gronsfeld.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'gf-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.toUpperCase().trim();
    if (!v) { msg.textContent = T('gs.gronsfeld.msgEmpty'); msg.className = 'gf-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.gronsfeld.msgRight'); msg.className = 'gf-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.gronsfeld.msgWrong').replace('{answer}', answer); msg.className = 'gf-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 700);
  }

  function finish() {
    cipherEl.textContent = T('gs.gronsfeld.done');
    keyEl.textContent = ''; hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.gronsfeld.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.gronsfeld.perfect') : T('gs.gronsfeld.goodJob');
    msg.className = 'gf-msg ok';
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
})();
