/* Morbit 密码（ACA 1964，EUREKA 发表；Mor-se + b-it）——
   Pollux 的「成对」表亲：摩斯流按两个符号一组切分。
   9 种组合固定顺序：.., .-, .x, -., --, -x, x., x-, xx，
   各配一个数字 1-9（一个 1-9 的排列即为密钥）。
   加密：明文 → 摩斯（字母间 x 分隔；长度为奇则在末尾补一个 x）→ 两两成组 → 查表得数字串。
   解密：数字 → 符号对 → 接回电码流 → 去掉末尾补位 x → 按 x 切分 → 译回字母。
   5 题一局：看密钥表（符号对 → 数字）与密文数字串，还原明文单词。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.morbit.tut1t'), d: T('gs.morbit.tut1') },
  { t: T('gs.morbit.tut2t'), d: T('gs.morbit.tut2') },
  { t: T('gs.morbit.tut3t'), d: T('gs.morbit.tut3') },
  { t: T('gs.morbit.tut4t'), d: T('gs.morbit.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var WORDS = ['CIPHER', 'SECRET', 'ENIGMA', 'SIGNAL', 'PUZZLE', 'PATROL', 'RADIO', 'VAULT', 'AGENT', 'MORSE'];
  /* 1-9 的排列密钥：第 i 位 = PAIRS[i] 这一对的数字 */
  var KEYS = ['569314728', '712635849', '349217568', '867452913', '521483976'];
  var PAIRS = ['..', '.-', '.x', '-.', '--', '-x', 'x.', 'x-', 'xx'];
  var MORSE = {
    A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....',
    I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.',
    Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
    Y: '-.--', Z: '--..'
  };
  var TOTAL = 5, idx = 0, correct = 0;

  /* 密钥串 → { pair: digit } */
  function pairMap(key) {
    var m = {};
    for (var i = 0; i < 9; i++) m[PAIRS[i]] = key.charAt(i);
    return m;
  }
  /* 密钥串 → { digit: pair } */
  function digitMap(key) {
    var m = {};
    for (var i = 0; i < 9; i++) m[key.charAt(i)] = PAIRS[i];
    return m;
  }

  function toMorse(word) {
    var parts = [];
    for (var i = 0; i < word.length; i++) parts.push(MORSE[word.charAt(i)]);
    return parts.join('x');
  }

  /* 加密：摩斯流补齐到偶数长（补 x），两两成组查表 */
  function encrypt(word, key) {
    var m = pairMap(key), stream = toMorse(word);
    if (stream.length % 2 !== 0) stream += 'x';
    var o = '';
    for (var i = 0; i < stream.length; i += 2) o += m[stream.substr(i, 2)];
    return o;
  }

  /* 解密：数字 → 符号对 → 电码流 → 去末尾补位 x → 按 x 切分 → 字母 */
  function decrypt(ct, key) {
    var m = digitMap(key), stream = '';
    for (var i = 0; i < ct.length; i++) stream += m[ct.charAt(i)];
    while (stream.length > 0 && stream.charAt(stream.length - 1) === 'x') stream = stream.slice(0, -1);
    var groups = stream.split('x'), o = '';
    for (var g = 0; g < groups.length; g++) {
      for (var c in MORSE) if (MORSE[c] === groups[g]) { o += c; break; }
    }
    return o;
  }

  var wrap = document.createElement('div');
  wrap.className = 'mb-wrap';
  wrap.innerHTML =
    '<div class="mb-progress" id="mb-prog"></div>' +
    '<div class="mb-cipher" id="mb-cipher"></div>' +
    '<div class="mb-table" id="mb-table"></div>' +
    '<div class="mb-lab">' + T('gs.morbit.tableLabel') + '</div>' +
    '<div class="mb-hint" id="mb-hint"></div>' +
    '<input class="mb-input" id="mb-in" maxlength="10" autocomplete="off" spellcheck="false">' +
    '<div class="mb-msg" id="mb-msg"></div>' +
    '<button class="btn accent" id="mb-sub">' + T('gs.morbit.submit') + '</button>' +
    '<div class="mb-help">' + T('gs.morbit.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#mb-prog'), cipherEl = wrap.querySelector('#mb-cipher'),
      tableEl = wrap.querySelector('#mb-table'), hint = wrap.querySelector('#mb-hint'),
      input = wrap.querySelector('#mb-in'), msg = wrap.querySelector('#mb-msg'), sub = wrap.querySelector('#mb-sub');

  var answer = '', key = '', nextTimer = null;

  function renderTable() {
    var h = '';
    for (var i = 0; i < 9; i++) h += '<span class="mb-p">' + PAIRS[i] + '</span>';
    for (var j = 0; j < 9; j++) h += '<span class="mb-d">' + key.charAt(j) + '</span>';
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
    prog.textContent = T('gs.morbit.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'mb-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.toUpperCase().trim();
    if (!v) { msg.textContent = T('gs.morbit.msgEmpty'); msg.className = 'mb-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.morbit.msgRight'); msg.className = 'mb-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.morbit.msgWrong').replace('{answer}', answer); msg.className = 'mb-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 1000);
  }

  function finish() {
    cipherEl.textContent = T('gs.morbit.done');
    tableEl.innerHTML = ''; hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.morbit.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.morbit.perfect') : T('gs.morbit.goodJob');
    msg.className = 'mb-msg ok';
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

  window.__mbEncrypt = encrypt; window.__mbDecrypt = decrypt;
})();
