/* Progressive Key 渐进密钥——
   维吉尼亚密码的加强版：密钥每用满一个周期，就整体向后位移一位。
   例如密钥 CIPHER，明文 ATTACKATDAWN（密钥长 6，分两块）：
   块1 ATTACK 用 CIPHER，块2 ATDAWN 用 DJQIFS（每位 +1），
   若还有块3，则用 EKRJGT（每位 +2）……以此类推。
   块数越多，密钥漂得越远——频率分析从此对不上。
   本机负责编码：给你明文和基础密钥，你按块逐位加密。
   5 题一局。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.progressive-key.tut1t'), d: T('gs.progressive-key.tut1') },
  { t: T('gs.progressive-key.tut2t'), d: T('gs.progressive-key.tut2') },
  { t: T('gs.progressive-key.tut3t'), d: T('gs.progressive-key.tut3') },
  { t: T('gs.progressive-key.tut4t'), d: T('gs.progressive-key.tut4') }
];

(function () {
  var KEY = 'CIPHER';
  var WORDS = ['ATTACKATDAWN', 'SENDRELIEF', 'HOLDTHESIGNAL', 'FIRETHREEVOLLEYS', 'WITHDRAWATDARK', 'MEETATNOON', 'CROSSTHELINE'];
  var TOTAL = 5, idx = 0, correct = 0;

  /* 密钥整体向后位移 n 位 */
  function shiftKey(key, n) {
    var out = '';
    for (var i = 0; i < key.length; i++) {
      out += String.fromCharCode(65 + ((key.charCodeAt(i) - 65 + n) % 26));
    }
    return out;
  }

  /* 维吉尼亚块加密 */
  function encBlock(block, key) {
    var out = '';
    for (var i = 0; i < block.length; i++) {
      var p = block.charCodeAt(i) - 65, k = key.charCodeAt(i % key.length) - 65;
      out += String.fromCharCode(65 + ((p + k) % 26));
    }
    return out;
  }

  /* 维吉尼亚块解密 */
  function decBlock(block, key) {
    var out = '';
    for (var i = 0; i < block.length; i++) {
      var c = block.charCodeAt(i) - 65, k = key.charCodeAt(i % key.length) - 65;
      out += String.fromCharCode(65 + ((c - k + 26) % 26));
    }
    return out;
  }

  function norm(s) { return String(s || '').toUpperCase().replace(/[^A-Z]/g, ''); }

  function encode(text, key) {
    var t = norm(text), k = norm(key);
    if (!t || !k) return '';
    var out = '', block = 0;
    while (block * k.length < t.length) {
      out += encBlock(t.substr(block * k.length, k.length), shiftKey(k, block));
      block++;
    }
    return out;
  }

  function decode(code, key) {
    var c = norm(code), k = norm(key);
    if (!c || !k) return '';
    var out = '', block = 0;
    while (block * k.length < c.length) {
      out += decBlock(c.substr(block * k.length, k.length), shiftKey(k, block));
      block++;
    }
    return out;
  }

  /* 当前明文分几块、每块的位移密钥（供 UI 展示） */
  function blockKeys(word) {
    var t = norm(word), keys = [], block = 0;
    while (block * KEY.length < t.length) {
      keys.push(shiftKey(KEY, block));
      block++;
    }
    return keys;
  }

  /* ---------- DOM ---------- */
  var root = document.getElementById('game-root');
  var wrap = document.createElement('div');
  wrap.className = 'pk-wrap';
  wrap.innerHTML =
    '<div class="pk-progress" id="pk-prog"></div>' +
    '<div class="pk-lbl">' + T('gs.progressive-key.plainLbl') + '</div>' +
    '<div class="pk-plain" id="pk-plain"></div>' +
    '<div class="pk-key">' + T('gs.progressive-key.keyLbl') + ' <b>' + KEY + '</b></div>' +
    '<div class="pk-blocks" id="pk-blocks"></div>' +
    '<input class="pk-input" id="pk-in" maxlength="20" autocomplete="off" spellcheck="false">' +
    '<div class="pk-msg" id="pk-msg"></div>' +
    '<button class="btn accent" id="pk-sub">' + T('gs.progressive-key.submit') + '</button>' +
    '<div class="pk-help">' + T('gs.progressive-key.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#pk-prog'), plainEl = wrap.querySelector('#pk-plain'),
      blocksEl = wrap.querySelector('#pk-blocks'), input = wrap.querySelector('#pk-in'),
      msg = wrap.querySelector('#pk-msg'), sub = wrap.querySelector('#pk-sub');

  var answer = '', nextTimer = null;

  function renderBlocks(word) {
    var keys = blockKeys(word), t = norm(word), h = '';
    for (var b = 0; b < keys.length; b++) {
      var seg = t.substr(b * KEY.length, KEY.length);
      h += '<div class="pk-block"><span class="pk-bn">' + T('gs.progressive-key.blockN').replace('{n}', b + 1) + '</span>' +
           '<span class="pk-seg">' + seg + '</span><span class="pk-arrow">⇒</span>' +
           '<span class="pk-bk">' + keys[b] + '</span></div>';
    }
    blocksEl.innerHTML = h;
  }

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    var word = WORDS[Math.floor(Math.random() * WORDS.length)];
    answer = encode(word, KEY);
    plainEl.textContent = word;
    renderBlocks(word);
    input.value = ''; input.maxLength = answer.length;
    input.placeholder = T('gs.progressive-key.hintLen').replace('{n}', answer.length);
    prog.textContent = T('gs.progressive-key.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'pk-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.toUpperCase().replace(/[^A-Z]/g, '');
    if (!v) { msg.textContent = T('gs.progressive-key.msgEmpty'); msg.className = 'pk-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.progressive-key.msgRight'); msg.className = 'pk-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.progressive-key.msgWrong').replace('{answer}', answer); msg.className = 'pk-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 900);
  }

  function finish() {
    plainEl.textContent = T('gs.progressive-key.done');
    input.style.display = 'none'; sub.style.display = 'none';
    blocksEl.innerHTML = '';
    prog.textContent = T('gs.progressive-key.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.progressive-key.perfect') : T('gs.progressive-key.goodJob');
    msg.className = 'pk-msg ok';
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

  window.__progkeyEnc = encode; window.__progkeyDec = decode;
  window.__progkeyShift = shiftKey; window.__progkeyWords = WORDS; window.__progkeyKey = KEY;
})();
