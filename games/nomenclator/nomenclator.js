/* 代号电码本 Nomenclator —— 最古老的「词级」密码：
   每个单词（或词组）对应一个四位代号，电文是代号串，对照电码本才能还原。
   区别于字母密码：它不逐字母替换，而是以整词为单位编码。
   5 题一局：看代号串与电码本，反推出明文单词。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.nomenclator.tut1t'), d: T('gs.nomenclator.tut1') },
  { t: T('gs.nomenclator.tut2t'), d: T('gs.nomenclator.tut2') },
  { t: T('gs.nomenclator.tut3t'), d: T('gs.nomenclator.tut3') },
  { t: T('gs.nomenclator.tut4t'), d: T('gs.nomenclator.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  /* 电码本：单词 → 四位代号（固定，双方事先约定） */
  var CODEBOOK = {
    'ARCADE': '7392', 'CIPHER': '4051', 'SECRET': '8821', 'BATTLE': '2214',
    'ARMY': '5519', 'FLEET': '9034', 'CODE': '1127', 'SIGNAL': '6640',
    'VAULT': '3385', 'PATROL': '8876'
  };
  var TOTAL = 5, idx = 0, correct = 0;

  function buildBook() {
    var html = '';
    for (var w in CODEBOOK) html += '<span><b>' + CODEBOOK[w] + '</b> ' + w + '</span>';
    return html;
  }

  var wrap = document.createElement('div');
  wrap.className = 'nm-wrap';
  wrap.innerHTML =
    '<div class="nm-progress" id="nm-prog"></div>' +
    '<div class="nm-cipher" id="nm-cipher"></div>' +
    '<div class="nm-hint" id="nm-hint"></div>' +
    '<div class="nm-book">' + buildBook() + '</div>' +
    '<input class="nm-input" id="nm-in" maxlength="16" autocomplete="off" spellcheck="false">' +
    '<div class="nm-msg" id="nm-msg"></div>' +
    '<button class="btn accent" id="nm-sub">' + T('gs.nomenclator.submit') + '</button>' +
    '<div class="nm-help">' + T('gs.nomenclator.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#nm-prog'), cipherEl = wrap.querySelector('#nm-cipher'),
      hint = wrap.querySelector('#nm-hint'), input = wrap.querySelector('#nm-in'),
      msg = wrap.querySelector('#nm-msg'), sub = wrap.querySelector('#nm-sub');

  var answer = '', nextTimer = null;

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    var words = Object.keys(CODEBOOK);
    var w1 = words[Math.floor(Math.random() * words.length)];
    var w2 = words[Math.floor(Math.random() * words.length)];
    if (w1 === w2) w2 = words[(words.indexOf(w1) + 1) % words.length];
    answer = w1 + ' ' + w2;
    cipherEl.textContent = CODEBOOK[w1] + '  ' + CODEBOOK[w2];
    hint.textContent = w1.replace(/./g, '_') + '  ' + w2.replace(/./g, '_');
    input.value = '';
    prog.textContent = T('gs.nomenclator.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'nm-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.toUpperCase().trim().replace(/\s+/g, ' ');
    if (!v) { msg.textContent = T('gs.nomenclator.msgEmpty'); msg.className = 'nm-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.nomenclator.msgRight'); msg.className = 'nm-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.nomenclator.msgWrong').replace('{answer}', answer); msg.className = 'nm-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 700);
  }

  function finish() {
    cipherEl.textContent = T('gs.nomenclator.done');
    hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.nomenclator.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.nomenclator.perfect') : T('gs.nomenclator.goodJob');
    msg.className = 'nm-msg ok';
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
