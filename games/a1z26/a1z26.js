/* 字母序号密码 A1Z26 —— 每个字母变成它在字母表里的序号：A=1, B=2, … Z=26。
   最朴素的「字母→数字」编码，是一切数字密码的起点。5 题一局：看数字串，反推出英文单词。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.a1z26.tut1t'), d: T('gs.a1z26.tut1') },
  { t: T('gs.a1z26.tut2t'), d: T('gs.a1z26.tut2') },
  { t: T('gs.a1z26.tut3t'), d: T('gs.a1z26.tut3') },
  { t: T('gs.a1z26.tut4t'), d: T('gs.a1z26.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var WORDS = ['ARCADE', 'CIPHER', 'SECRET', 'BATTLE', 'ARMY', 'FLEET', 'SIGNAL', 'PATROL', 'ENIGMA', 'CODE'];
  var TOTAL = 5, idx = 0, correct = 0;

  /* A1Z26：字母 → 1-26 序号 */
  function encode(word) {
    var out = [];
    for (var i = 0; i < word.length; i++) out.push(word.charCodeAt(i) - 64);
    return out.join(' ');
  }

  var wrap = document.createElement('div');
  wrap.className = 'a1-wrap';
  wrap.innerHTML =
    '<div class="a1-progress" id="a1-prog"></div>' +
    '<div class="a1-cipher" id="a1-cipher"></div>' +
    '<div class="a1-hint" id="a1-hint"></div>' +
    '<input class="a1-input" id="a1-in" maxlength="10" autocomplete="off" spellcheck="false">' +
    '<div class="a1-msg" id="a1-msg"></div>' +
    '<button class="btn accent" id="a1-sub">' + T('gs.a1z26.submit') + '</button>' +
    '<div class="a1-help">' + T('gs.a1z26.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#a1-prog'), cipherEl = wrap.querySelector('#a1-cipher'),
      hint = wrap.querySelector('#a1-hint'), input = wrap.querySelector('#a1-in'),
      msg = wrap.querySelector('#a1-msg'), sub = wrap.querySelector('#a1-sub');

  var answer = '', nextTimer = null;

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    answer = WORDS[Math.floor(Math.random() * WORDS.length)];
    cipherEl.textContent = encode(answer);
    hint.textContent = answer.replace(/./g, '_ ').trim();
    input.value = ''; input.maxLength = answer.length;
    prog.textContent = T('gs.a1z26.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'a1-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.toUpperCase().trim();
    if (!v) { msg.textContent = T('gs.a1z26.msgEmpty'); msg.className = 'a1-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.a1z26.msgRight'); msg.className = 'a1-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.a1z26.msgWrong').replace('{answer}', answer); msg.className = 'a1-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 700);
  }

  function finish() {
    cipherEl.textContent = T('gs.a1z26.done');
    hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.a1z26.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.a1z26.perfect') : T('gs.a1z26.goodJob');
    msg.className = 'a1-msg ok';
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
