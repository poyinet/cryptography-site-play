/* Pollux 密码（ACA 经典，摩斯同音替换）——
   密钥是 10 个数字（1-0）到摩斯三符号的混排：点(.)、划(-)、字母间隔(x)，
   惯例 4 个数字给点、3 个给划、3 个给间隔（点最常见）。
   加密：明文 → 摩斯电码（字母间插 x，单词间 xx）→ 每个符号从密钥表里
   属于它的数字中任选一个换上 → 数字串密文。同音替换：同一份明文两次加密
   可以得到不同数字串，但解密唯一——每个数字只对应一个符号。
   5 题一局：看数字密钥表与密文数字串，还原明文单词。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.pollux.tut1t'), d: T('gs.pollux.tut1') },
  { t: T('gs.pollux.tut2t'), d: T('gs.pollux.tut2') },
  { t: T('gs.pollux.tut3t'), d: T('gs.pollux.tut3') },
  { t: T('gs.pollux.tut4t'), d: T('gs.pollux.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var WORDS = ['CIPHER', 'SECRET', 'ENIGMA', 'SIGNAL', 'PUZZLE', 'PATROL', 'RADIO', 'VAULT', 'AGENT', 'MORSE'];
  /* 10 位密钥串：每位对应 1-0 的数字，符号为 . - x（4 点 / 3 划 / 3 间隔） */
  var KEYS = ['x.--.x.-x.', '..--.x.-xx', '.-.-x.x.-x', '--..xx.x-.', '..x-x.-x-.'];
  var MORSE = {
    A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....',
    I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.',
    Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
    Y: '-.--', Z: '--..'
  };
  var DIGITS = '1234567890'; /* 密钥表从左到右对应 1..9,0 */
  var TOTAL = 5, idx = 0, correct = 0;

  /* 密钥串 → { symbol: [digits...] } */
  function pools(key) {
    var p = { '.': [], '-': [], 'x': [] };
    for (var i = 0; i < key.length; i++) p[key.charAt(i)].push(DIGITS.charAt(i));
    return p;
  }
  /* 密钥串 → { digit: symbol } */
  function digitMap(key) {
    var m = {};
    for (var i = 0; i < key.length; i++) m[DIGITS.charAt(i)] = key.charAt(i);
    return m;
  }

  function toMorse(word) {
    var parts = [];
    for (var i = 0; i < word.length; i++) parts.push(MORSE[word.charAt(i)]);
    return parts.join('x');
  }

  /* 加密：每个摩斯符号从它的数字池里随机选一个 */
  function encrypt(word, key) {
    var p = pools(key), stream = toMorse(word), o = '';
    for (var i = 0; i < stream.length; i++) {
      var pool = p[stream.charAt(i)];
      o += pool[Math.floor(Math.random() * pool.length)];
    }
    return o;
  }

  /* 解密：数字 → 符号 → 摩斯流 → 按 x 切分 → 字母 */
  function decrypt(ct, key) {
    var m = digitMap(key), stream = '';
    for (var i = 0; i < ct.length; i++) stream += m[ct.charAt(i)];
    var groups = stream.split('x'), o = '';
    for (var g = 0; g < groups.length; g++) {
      for (var c in MORSE) if (MORSE[c] === groups[g]) { o += c; break; }
    }
    return o;
  }

  var wrap = document.createElement('div');
  wrap.className = 'px-wrap';
  wrap.innerHTML =
    '<div class="px-progress" id="px-prog"></div>' +
    '<div class="px-cipher" id="px-cipher"></div>' +
    '<div class="px-table" id="px-table"></div>' +
    '<div class="px-lab">' + T('gs.pollux.tableLabel') + '</div>' +
    '<div class="px-hint" id="px-hint"></div>' +
    '<input class="px-input" id="px-in" maxlength="10" autocomplete="off" spellcheck="false">' +
    '<div class="px-msg" id="px-msg"></div>' +
    '<button class="btn accent" id="px-sub">' + T('gs.pollux.submit') + '</button>' +
    '<div class="px-help">' + T('gs.pollux.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#px-prog'), cipherEl = wrap.querySelector('#px-cipher'),
      tableEl = wrap.querySelector('#px-table'), hint = wrap.querySelector('#px-hint'),
      input = wrap.querySelector('#px-in'), msg = wrap.querySelector('#px-msg'), sub = wrap.querySelector('#px-sub');

  var answer = '', key = '', nextTimer = null;

  function renderTable() {
    var h = '';
    for (var i = 0; i < 10; i++) {
      h += '<span class="px-d">' + DIGITS.charAt(i) + '</span>';
    }
    for (var j = 0; j < 10; j++) {
      var s = key.charAt(j);
      var cls = s === '.' ? 'dot' : (s === '-' ? 'dash' : 'sep');
      h += '<span class="px-s ' + cls + '">' + s + '</span>';
    }
    tableEl.innerHTML = h;
  }

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    answer = WORDS[Math.floor(Math.random() * WORDS.length)];
    key = KEYS[Math.floor(Math.random() * KEYS.length)];
    cipherEl.textContent = encrypt(answer, key);
    renderTable();
    hint.textContent = answer.replace(/./g, '_ ').trim();
    input.value = ''; input.maxLength = answer.length;
    prog.textContent = T('gs.pollux.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'px-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.toUpperCase().trim();
    if (!v) { msg.textContent = T('gs.pollux.msgEmpty'); msg.className = 'px-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.pollux.msgRight'); msg.className = 'px-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.pollux.msgWrong').replace('{answer}', answer); msg.className = 'px-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 1000);
  }

  function finish() {
    cipherEl.textContent = T('gs.pollux.done');
    tableEl.innerHTML = ''; hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.pollux.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.pollux.perfect') : T('gs.pollux.goodJob');
    msg.className = 'px-msg ok';
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

  window.__pxEncrypt = encrypt; window.__pxDecrypt = decrypt; window.__pxPools = pools;
})();
