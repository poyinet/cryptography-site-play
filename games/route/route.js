/* 路线换位密码 Route Cipher —— 把明文写进矩形网格，再按一条「编号路线」读出成密文。
   路线是一条位置排列（如 1,4,2,5,3,6）。解码：把密文按路线放回网格、逐行读出。
   二战陆军电报常用，路线本身即密钥。5 题一局：看密文与路线编号，还原明文。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.route.tut1t'), d: T('gs.route.tut1') },
  { t: T('gs.route.tut2t'), d: T('gs.route.tut2') },
  { t: T('gs.route.tut3t'), d: T('gs.route.tut3') },
  { t: T('gs.route.tut4t'), d: T('gs.route.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var WORDS = ['ARCADE', 'CIPHER', 'SECRET', 'BATTLE', 'ARMY', 'FLEET', 'SIGNAL', 'PATROL', 'ENIGMA', 'CODE'];
  /* 标准路线（1-based 网格位置）：4 字=2×2，6 字=2×3 */
  var ROUTES4 = [[1, 3, 2, 4], [1, 2, 4, 3], [3, 1, 4, 2], [4, 2, 3, 1]];
  var ROUTES6 = [[1, 4, 2, 5, 3, 6], [1, 2, 3, 6, 5, 4], [1, 3, 5, 2, 4, 6], [2, 5, 3, 6, 1, 4]];
  var TOTAL = 5, idx = 0, correct = 0;

  /* 按 cols 列写入网格，再按 route（位置排列）读出 */
  function encode(word, cols, route) {
    var rows = word.length / cols;
    var grid = [];
    for (var i = 0; i < word.length; i++) grid[i] = word.charAt(i); /* 位置 i = 字母 */
    var o = '';
    for (var r = 0; r < route.length; r++) o += grid[route[r] - 1];
    return o;
  }

  var wrap = document.createElement('div');
  wrap.className = 'rt-wrap';
  wrap.innerHTML =
    '<div class="rt-progress" id="rt-prog"></div>' +
    '<div class="rt-cipher" id="rt-cipher"></div>' +
    '<div class="rt-route">' + T('gs.route.routeLabel') + ' <span class="rt-routev" id="rt-route"></span></div>' +
    '<div class="rt-hint" id="rt-hint"></div>' +
    '<input class="rt-input" id="rt-in" maxlength="10" autocomplete="off" spellcheck="false">' +
    '<div class="rt-msg" id="rt-msg"></div>' +
    '<button class="btn accent" id="rt-sub">' + T('gs.route.submit') + '</button>' +
    '<div class="rt-help">' + T('gs.route.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#rt-prog'), cipherEl = wrap.querySelector('#rt-cipher'),
      routeEl = wrap.querySelector('#rt-route'), hint = wrap.querySelector('#rt-hint'),
      input = wrap.querySelector('#rt-in'), msg = wrap.querySelector('#rt-msg'), sub = wrap.querySelector('#rt-sub');

  var answer = '', nextTimer = null;

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    answer = WORDS[Math.floor(Math.random() * WORDS.length)];
    var is4 = answer.length === 4;
    var pool = is4 ? ROUTES4 : ROUTES6;
    var cols = is4 ? 2 : 3;
    var route = pool[Math.floor(Math.random() * pool.length)];
    cipherEl.textContent = encode(answer, cols, route);
    routeEl.textContent = (is4 ? '2×2 · ' : '2×3 · ') + route.join(', ');
    hint.textContent = answer.replace(/./g, '_ ').trim();
    input.value = ''; input.maxLength = answer.length;
    prog.textContent = T('gs.route.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'rt-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.toUpperCase().trim();
    if (!v) { msg.textContent = T('gs.route.msgEmpty'); msg.className = 'rt-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.route.msgRight'); msg.className = 'rt-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.route.msgWrong').replace('{answer}', answer); msg.className = 'rt-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 700);
  }

  function finish() {
    cipherEl.textContent = T('gs.route.done');
    routeEl.textContent = ''; hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.route.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.route.perfect') : T('gs.route.goodJob');
    msg.className = 'rt-msg ok';
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
