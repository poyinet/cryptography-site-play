/* 旗语密码 Semaphore —— 夏佩（Chappe）双臂旗语：
   两只旗各取 6 个方位，每个字母占一个「方位组合」。看方位码序列，对照旗语表还原单词。
   1790s 的法国「信号塔」靠它跨海传信，早于电报。5 题一局：看方位码，反推出明文单词。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.semaphore.tut1t'), d: T('gs.semaphore.tut1') },
  { t: T('gs.semaphore.tut2t'), d: T('gs.semaphore.tut2') },
  { t: T('gs.semaphore.tut3t'), d: T('gs.semaphore.tut3') },
  { t: T('gs.semaphore.tut4t'), d: T('gs.semaphore.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var WORDS = ['ARCADE', 'CIPHER', 'SECRET', 'BATTLE', 'ARMY', 'FLEET', 'SIGNAL', 'PATROL', 'ENIGMA', 'CODE'];
  /* 双臂方位：每臂 6 个方位，26 字母各占一个组合（左臂 = i%6，右臂 = i/6） */
  var ARM = ['⬇', '↙', '←', '↖', '⬆', '↗'];
  var SEM = {};
  for (var i = 0; i < 26; i++) SEM[String.fromCharCode(65 + i)] = ARM[i % 6] + ARM[(i / 6) | 0];
  var TOTAL = 5, idx = 0, correct = 0;

  function buildTable() {
    var html = '';
    for (var k in SEM) html += '<span><b>' + k + '</b> ' + SEM[k] + '</span>';
    return html;
  }
  function encode(word) {
    var out = [];
    for (var i = 0; i < word.length; i++) out.push(SEM[word.charAt(i)] || '·');
    return out.join('  ');
  }

  var wrap = document.createElement('div');
  wrap.className = 'sp-wrap';
  wrap.innerHTML =
    '<div class="sp-progress" id="sp-prog"></div>' +
    '<div class="sp-cipher" id="sp-cipher"></div>' +
    '<div class="sp-hint" id="sp-hint"></div>' +
    '<div class="sp-table">' + buildTable() + '</div>' +
    '<input class="sp-input" id="sp-in" maxlength="10" autocomplete="off" spellcheck="false">' +
    '<div class="sp-msg" id="sp-msg"></div>' +
    '<button class="btn accent" id="sp-sub">' + T('gs.semaphore.submit') + '</button>' +
    '<div class="sp-help">' + T('gs.semaphore.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#sp-prog'), cipherEl = wrap.querySelector('#sp-cipher'),
      hint = wrap.querySelector('#sp-hint'), input = wrap.querySelector('#sp-in'),
      msg = wrap.querySelector('#sp-msg'), sub = wrap.querySelector('#sp-sub');

  var answer = '', nextTimer = null;

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    answer = WORDS[Math.floor(Math.random() * WORDS.length)];
    cipherEl.textContent = encode(answer);
    hint.textContent = answer.replace(/./g, '_ ').trim();
    input.value = ''; input.maxLength = answer.length;
    prog.textContent = T('gs.semaphore.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'sp-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.toUpperCase().trim();
    if (!v) { msg.textContent = T('gs.semaphore.msgEmpty'); msg.className = 'sp-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.semaphore.msgRight'); msg.className = 'sp-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.semaphore.msgWrong').replace('{answer}', answer); msg.className = 'sp-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 700);
  }

  function finish() {
    cipherEl.textContent = T('gs.semaphore.done');
    hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.semaphore.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.semaphore.perfect') : T('gs.semaphore.goodJob');
    msg.className = 'sp-msg ok';
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
