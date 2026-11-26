/* Myszkowski 换位密码（ACA 经典列换位变体）——
   与普通列换位的唯一区别：密钥里允许重复字母。
   排序时，相同字母的列绑成一组：按字母序处理各组，
   组内各列不分先后，按行并排读出（第 1 行从左到右过一遍组内各列，再第 2 行……）。
   解密：按同样分组把密文切回各列（每列等高），按行读出，去掉补位 X。
   5 题一局：看密文与密钥单词，还原明文单词。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.myszkowski.tut1t'), d: T('gs.myszkowski.tut1') },
  { t: T('gs.myszkowski.tut2t'), d: T('gs.myszkowski.tut2') },
  { t: T('gs.myszkowski.tut3t'), d: T('gs.myszkowski.tut3') },
  { t: T('gs.myszkowski.tut4t'), d: T('gs.myszkowski.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var WORDS = ['CIPHER', 'SECRET', 'ENIGMA', 'SIGNAL', 'PUZZLE', 'PATROL', 'RADIO', 'VAULT', 'AGENT', 'MORSE'];
  /* 带重复字母的密钥单词 */
  var KEYWORDS = ['TOMATO', 'BALLOON', 'CANNON', 'LETTER', 'BANANA', 'POSSES'];
  var TOTAL = 5, idx = 0, correct = 0;

  /* 按字母序分组：返回 [[colIdx...], ...]（组内按下标升序） */
  function groupsOf(key) {
    var N = key.length, letters = key.split('').slice().sort();
    var groups = [], i = 0;
    while (i < N) {
      var L = letters[i], group = [];
      for (var c = 0; c < N; c++) if (key.charAt(c) === L) group.push(c);
      groups.push(group);
      i += group.length;
    }
    return groups;
  }

  function encrypt(word, key) {
    var N = key.length;
    var padded = word;
    while (padded.length % N !== 0) padded += 'X';
    var rows = padded.length / N;
    var grid = [];
    for (var r = 0; r < rows; r++) {
      grid[r] = [];
      for (var c = 0; c < N; c++) grid[r][c] = padded.charAt(r * N + c);
    }
    var groups = groupsOf(key), o = '';
    for (var g = 0; g < groups.length; g++) {
      for (var r2 = 0; r2 < rows; r2++) {
        for (var k = 0; k < groups[g].length; k++) o += grid[r2][groups[g][k]];
      }
    }
    return o;
  }

  function decrypt(ct, key) {
    var N = key.length, rows = ct.length / N;
    var cols = new Array(N), pos = 0;
    var groups = groupsOf(key);
    for (var g = 0; g < groups.length; g++) {
      var group = groups[g];
      var chunk = ct.substr(pos, rows * group.length);
      pos += rows * group.length;
      var k = 0;
      for (var r = 0; r < rows; r++) {
        for (var j = 0; j < group.length; j++) {
          if (!cols[group[j]]) cols[group[j]] = [];
          cols[group[j]][r] = chunk.charAt(k++);
        }
      }
    }
    var o = '';
    for (var r2 = 0; r2 < rows; r2++) for (var c = 0; c < N; c++) o += cols[c][r2];
    while (o.length > 0 && o.charAt(o.length - 1) === 'X') o = o.slice(0, -1);
    return o;
  }

  var wrap = document.createElement('div');
  wrap.className = 'my-wrap';
  wrap.innerHTML =
    '<div class="my-progress" id="my-prog"></div>' +
    '<div class="my-cipher" id="my-cipher"></div>' +
    '<div class="my-key">' + T('gs.myszkowski.keyLabel') + ' <b id="my-key"></b></div>' +
    '<div class="my-hint" id="my-hint"></div>' +
    '<input class="my-input" id="my-in" maxlength="10" autocomplete="off" spellcheck="false">' +
    '<div class="my-msg" id="my-msg"></div>' +
    '<button class="btn accent" id="my-sub">' + T('gs.myszkowski.submit') + '</button>' +
    '<div class="my-help">' + T('gs.myszkowski.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#my-prog'), cipherEl = wrap.querySelector('#my-cipher'),
      keyEl = wrap.querySelector('#my-key'), hint = wrap.querySelector('#my-hint'),
      input = wrap.querySelector('#my-in'), msg = wrap.querySelector('#my-msg'), sub = wrap.querySelector('#my-sub');

  var answer = '', key = '', nextTimer = null;

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    answer = WORDS[Math.floor(Math.random() * WORDS.length)];
    key = KEYWORDS[Math.floor(Math.random() * KEYWORDS.length)];
    cipherEl.textContent = encrypt(answer, key);
    var groups = groupsOf(key).map(function (g) { return key.charAt(g[0]); }).join(' ');
    keyEl.textContent = key + '（' + key.length + ' ' + T('gs.myszkowski.cols') + ' · ' + T('gs.myszkowski.groups') + ' ' + groups + '）';
    hint.textContent = answer.replace(/./g, '_ ').trim();
    input.value = ''; input.maxLength = answer.length;
    prog.textContent = T('gs.myszkowski.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'my-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.toUpperCase().trim();
    if (!v) { msg.textContent = T('gs.myszkowski.msgEmpty'); msg.className = 'my-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.myszkowski.msgRight'); msg.className = 'my-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.myszkowski.msgWrong').replace('{answer}', answer); msg.className = 'my-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 900);
  }

  function finish() {
    cipherEl.textContent = T('gs.myszkowski.done');
    keyEl.textContent = ''; hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.myszkowski.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.myszkowski.perfect') : T('gs.myszkowski.goodJob');
    msg.className = 'my-msg ok';
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

  window.__myEncrypt = encrypt; window.__myDecrypt = decrypt;
})();
