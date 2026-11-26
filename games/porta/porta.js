/* 波特密码 Porta —— 波特表行查法：密钥字母选定波特表中的某一行，
   明文是列、密文是那一行里对应列的字母。波特表本质是维吉尼亚表，
   但「行查法」把它当作一张可查的替代表来用。5 题一局：看密文与关键词，反推明文。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.porta.tut1t'), d: T('gs.porta.tut1') },
  { t: T('gs.porta.tut2t'), d: T('gs.porta.tut2') },
  { t: T('gs.porta.tut3t'), d: T('gs.porta.tut3') },
  { t: T('gs.porta.tut4t'), d: T('gs.porta.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var WORDS = ['ARCADE', 'CIPHER', 'SECRET', 'BATTLE', 'ARMY', 'FLEET', 'CODE', 'SIGNAL', 'VAULT', 'PATROL'];
  var KEYS = ['ENIGMA', 'ROTOR', 'MILTON', 'DASCH', 'TURKEY', 'BOMBE', 'ULTRA', 'SIGINT'];
  var TOTAL = 5, idx = 0, correct = 0;

  /* 波特表：密钥行 K，明文 P → 密文 (P + K) mod 26（波特表 = 维吉尼亚表，行查法） */
  function encode(word, key) {
    var o = '';
    for (var i = 0; i < word.length; i++) {
      var p = word.charCodeAt(i) - 65;
      var k = key.charCodeAt(i % key.length) - 65;
      o += String.fromCharCode(65 + (p + k) % 26);
    }
    return o;
  }

  var wrap = document.createElement('div');
  wrap.className = 'po-wrap';
  wrap.innerHTML =
    '<div class="po-progress" id="po-prog"></div>' +
    '<div class="po-cipher" id="po-cipher"></div>' +
    '<div class="po-key">' + T('gs.porta.keyLabel') + ' <span class="po-keyv" id="po-key"></span></div>' +
    '<div class="po-hint" id="po-hint"></div>' +
    '<input class="po-input" id="po-in" maxlength="10" autocomplete="off" spellcheck="false">' +
    '<div class="po-msg" id="po-msg"></div>' +
    '<button class="btn accent" id="po-sub">' + T('gs.porta.submit') + '</button>' +
    '<div class="po-help">' + T('gs.porta.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#po-prog'), cipherEl = wrap.querySelector('#po-cipher'),
      keyEl = wrap.querySelector('#po-key'), hint = wrap.querySelector('#po-hint'),
      input = wrap.querySelector('#po-in'), msg = wrap.querySelector('#po-msg'), sub = wrap.querySelector('#po-sub');

  var answer = '', key = '', nextTimer = null;

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    answer = WORDS[Math.floor(Math.random() * WORDS.length)];
    key = KEYS[Math.floor(Math.random() * KEYS.length)];
    cipherEl.textContent = encode(answer, key);
    keyEl.textContent = key;
    hint.textContent = answer.replace(/./g, '_ ').trim();
    input.value = ''; input.maxLength = answer.length;
    prog.textContent = T('gs.porta.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'po-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.toUpperCase().trim();
    if (!v) { msg.textContent = T('gs.porta.msgEmpty'); msg.className = 'po-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.porta.msgRight'); msg.className = 'po-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.porta.msgWrong').replace('{answer}', answer); msg.className = 'po-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 700);
  }

  function finish() {
    cipherEl.textContent = T('gs.porta.done');
    keyEl.textContent = ''; hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.porta.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.porta.perfect') : T('gs.porta.goodJob');
    msg.className = 'po-msg ok';
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
