/* 双重换位密码 Double Transposition —— 列换位连做两次：
   明文先按 N 列写矩形、逐列读出，再对结果按 M 列做一次同样的换位。
   解码要分两步反向：先解 M、再解 N。比单次换位难破，二战广泛使用。
   5 题一局：看密文与两个列数，反推出明文。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.double.tut1t'), d: T('gs.double.tut1') },
  { t: T('gs.double.tut2t'), d: T('gs.double.tut2') },
  { t: T('gs.double.tut3t'), d: T('gs.double.tut3') },
  { t: T('gs.double.tut4t'), d: T('gs.double.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var WORDS = ['ARCADE', 'CIPHER', 'SECRET', 'BATTLE', 'SIGNAL', 'PATROL', 'ROTATE', 'ENIGMA'];
  var TOTAL = 5, idx = 0, correct = 0;

  /* 单次列换位：按 cols 列写入矩形、逐列读出 */
  function colEnc(word, cols) {
    var rows = word.length / cols;
    var grid = [];
    for (var r = 0; r < rows; r++) grid.push([]);
    for (var i = 0; i < word.length; i++) grid[Math.floor(i / cols)].push(word.charAt(i));
    var o = '';
    for (var c = 0; c < cols; c++)
      for (var r2 = 0; r2 < rows; r2++) o += grid[r2][c];
    return o;
  }
  /* 双重换位：先按 N 列、再按 M 列 */
  function doubleEnc(word, n, m) { return colEnc(colEnc(word, n), m); }

  function pickCol(len) {
    var opts = [2];
    if (len % 3 === 0) opts.push(3);
    return opts[Math.floor(Math.random() * opts.length)];
  }

  var wrap = document.createElement('div');
  wrap.className = 'db-wrap';
  wrap.innerHTML =
    '<div class="db-progress" id="db-prog"></div>' +
    '<div class="db-cipher" id="db-cipher"></div>' +
    '<div class="db-key">' + T('gs.double.keyLabel') + ' <span class="db-keyv" id="db-key"></span></div>' +
    '<div class="db-hint" id="db-hint"></div>' +
    '<input class="db-input" id="db-in" maxlength="10" autocomplete="off" spellcheck="false">' +
    '<div class="db-msg" id="db-msg"></div>' +
    '<button class="btn accent" id="db-sub">' + T('gs.double.submit') + '</button>' +
    '<div class="db-help">' + T('gs.double.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#db-prog'), cipherEl = wrap.querySelector('#db-cipher'),
      keyEl = wrap.querySelector('#db-key'), hint = wrap.querySelector('#db-hint'),
      input = wrap.querySelector('#db-in'), msg = wrap.querySelector('#db-msg'), sub = wrap.querySelector('#db-sub');

  var answer = '', n = 2, m = 2, nextTimer = null;

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    answer = WORDS[Math.floor(Math.random() * WORDS.length)];
    n = pickCol(answer.length);
    m = pickCol(answer.length);
    cipherEl.textContent = doubleEnc(answer, n, m);
    keyEl.textContent = n + ' 列 → ' + m + ' 列';
    hint.textContent = answer.replace(/./g, '_ ').trim();
    input.value = ''; input.maxLength = answer.length;
    prog.textContent = T('gs.double.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'db-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.toUpperCase().trim();
    if (!v) { msg.textContent = T('gs.double.msgEmpty'); msg.className = 'db-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.double.msgRight'); msg.className = 'db-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.double.msgWrong').replace('{answer}', answer); msg.className = 'db-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 700);
  }

  function finish() {
    cipherEl.textContent = T('gs.double.done');
    keyEl.textContent = ''; hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.double.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.double.perfect') : T('gs.double.goodJob');
    msg.className = 'db-msg ok';
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
