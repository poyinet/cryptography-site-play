/* 列换位密码 Columnar Transposition —— 最经典的换位密码：
   把明文按 N 列写成矩形，逐列读出成密文（不替换、只重排字母）。
   解码 = 把密文按列写入矩形、逐行读出。美国陆军 M-94 等机器即用此结构。
   5 题一局：看乱序密文与列数，还原成按行读取的明文。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.columnar.tut1t'), d: T('gs.columnar.tut1') },
  { t: T('gs.columnar.tut2t'), d: T('gs.columnar.tut2') },
  { t: T('gs.columnar.tut3t'), d: T('gs.columnar.tut3') },
  { t: T('gs.columnar.tut4t'), d: T('gs.columnar.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  /* 词长必须被列数整除（4/6 字母，2 或 3 列），保证矩形网格可手推 */
  var WORDS = ['ARMY', 'CODE', 'SEAL', 'RACE', 'FORT', 'GATE', 'LOCK', 'TRAP',
    'ARCADE', 'CIPHER', 'SECRET', 'BATTLE', 'SIGNAL', 'PATROL', 'ROTATE', 'ENIGMA'];
  var TOTAL = 5, idx = 0, correct = 0;

  /* 列换位加密：按 cols 列写入矩形，逐列读出 */
  function encode(word, cols) {
    var rows = word.length / cols;
    var grid = [];
    for (var r = 0; r < rows; r++) grid.push([]);
    for (var i = 0; i < word.length; i++) grid[Math.floor(i / cols)].push(word.charAt(i));
    var o = '';
    for (var c = 0; c < cols; c++)
      for (var r2 = 0; r2 < rows; r2++) o += grid[r2][c];
    return o;
  }

  function pickCols(len) {
    var opts = [2];
    if (len % 3 === 0) opts.push(3);
    return opts[Math.floor(Math.random() * opts.length)];
  }

  var wrap = document.createElement('div');
  wrap.className = 'cl-wrap';
  wrap.innerHTML =
    '<div class="cl-progress" id="cl-prog"></div>' +
    '<div class="cl-cipher" id="cl-cipher"></div>' +
    '<div class="cl-key">' + T('gs.columnar.keyLabel') + ' <span class="cl-keyv" id="cl-key"></span></div>' +
    '<div class="cl-hint" id="cl-hint"></div>' +
    '<input class="cl-input" id="cl-in" maxlength="10" autocomplete="off" spellcheck="false">' +
    '<div class="cl-msg" id="cl-msg"></div>' +
    '<button class="btn accent" id="cl-sub">' + T('gs.columnar.submit') + '</button>' +
    '<div class="cl-help">' + T('gs.columnar.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#cl-prog'), cipherEl = wrap.querySelector('#cl-cipher'),
      keyEl = wrap.querySelector('#cl-key'), hint = wrap.querySelector('#cl-hint'),
      input = wrap.querySelector('#cl-in'), msg = wrap.querySelector('#cl-msg'), sub = wrap.querySelector('#cl-sub');

  var answer = '', cols = 0, nextTimer = null;

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    answer = WORDS[Math.floor(Math.random() * WORDS.length)];
    cols = pickCols(answer.length);
    cipherEl.textContent = encode(answer, cols);
    keyEl.textContent = cols;
    hint.textContent = answer.replace(/./g, '_ ').trim();
    input.value = ''; input.maxLength = answer.length;
    prog.textContent = T('gs.columnar.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'cl-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.toUpperCase().trim();
    if (!v) { msg.textContent = T('gs.columnar.msgEmpty'); msg.className = 'cl-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.columnar.msgRight'); msg.className = 'cl-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.columnar.msgWrong').replace('{answer}', answer); msg.className = 'cl-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 700);
  }

  function finish() {
    cipherEl.textContent = T('gs.columnar.done');
    keyEl.textContent = ''; hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.columnar.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.columnar.perfect') : T('gs.columnar.goodJob');
    msg.className = 'cl-msg ok';
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
