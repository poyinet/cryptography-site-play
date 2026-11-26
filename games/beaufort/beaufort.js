/* 博福特密码 Beaufort —— 与维吉尼亚方向相反的互易密码：
   密文 = 密钥 − 明文（mod 26），因此解密 = 再用同一密钥加密一次（自反）。
   以发明者弗朗西斯·博福特爵士命名，曾用于 M-94 等机械机。5 题一局：看密文与关键词，反推明文。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.beaufort.tut1t'), d: T('gs.beaufort.tut1') },
  { t: T('gs.beaufort.tut2t'), d: T('gs.beaufort.tut2') },
  { t: T('gs.beaufort.tut3t'), d: T('gs.beaufort.tut3') },
  { t: T('gs.beaufort.tut4t'), d: T('gs.beaufort.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var WORDS = ['ARCADE', 'CIPHER', 'SECRET', 'BATTLE', 'ARMY', 'FLEET', 'CODE', 'SIGNAL', 'VAULT', 'PATROL'];
  var KEYS = ['ENIGMA', 'ROTOR', 'MILTON', 'DASCH', 'TURKEY', 'BOMBE', 'ULTRA', 'SIGINT'];
  var TOTAL = 5, idx = 0, correct = 0;

  /* 博福特加密（自反）：密文 = 密钥 − 明文（mod 26） */
  function encode(word, key) {
    var o = '';
    for (var i = 0; i < word.length; i++) {
      var p = word.charCodeAt(i) - 65;
      var k = key.charCodeAt(i % key.length) - 65;
      o += String.fromCharCode(65 + (k - p + 26) % 26);
    }
    return o;
  }

  var wrap = document.createElement('div');
  wrap.className = 'bf-wrap';
  wrap.innerHTML =
    '<div class="bf-progress" id="bf-prog"></div>' +
    '<div class="bf-cipher" id="bf-cipher"></div>' +
    '<div class="bf-key">' + T('gs.beaufort.keyLabel') + ' <span class="bf-keyv" id="bf-key"></span></div>' +
    '<div class="bf-hint" id="bf-hint"></div>' +
    '<input class="bf-input" id="bf-in" maxlength="10" autocomplete="off" spellcheck="false">' +
    '<div class="bf-msg" id="bf-msg"></div>' +
    '<button class="btn accent" id="bf-sub">' + T('gs.beaufort.submit') + '</button>' +
    '<div class="bf-help">' + T('gs.beaufort.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#bf-prog'), cipherEl = wrap.querySelector('#bf-cipher'),
      keyEl = wrap.querySelector('#bf-key'), hint = wrap.querySelector('#bf-hint'),
      input = wrap.querySelector('#bf-in'), msg = wrap.querySelector('#bf-msg'), sub = wrap.querySelector('#bf-sub');

  var answer = '', key = '', nextTimer = null;

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    answer = WORDS[Math.floor(Math.random() * WORDS.length)];
    key = KEYS[Math.floor(Math.random() * KEYS.length)];
    cipherEl.textContent = encode(answer, key);
    keyEl.textContent = key;
    hint.textContent = answer.replace(/./g, '_ ').trim();
    input.value = ''; input.maxLength = answer.length;
    prog.textContent = T('gs.beaufort.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'bf-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.toUpperCase().trim();
    if (!v) { msg.textContent = T('gs.beaufort.msgEmpty'); msg.className = 'bf-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.beaufort.msgRight'); msg.className = 'bf-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.beaufort.msgWrong').replace('{answer}', answer); msg.className = 'bf-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 700);
  }

  function finish() {
    cipherEl.textContent = T('gs.beaufort.done');
    keyEl.textContent = ''; hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.beaufort.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.beaufort.perfect') : T('gs.beaufort.goodJob');
    msg.className = 'bf-msg ok';
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
