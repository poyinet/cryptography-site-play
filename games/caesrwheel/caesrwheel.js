/* 凯撒轮盘 Caesar Wheel —— 凯撒密码的「轮盘」形态：
   外圈是密文、内圈是可旋转的字母轮。读出轮盘的偏移（密文比明文转了几格），
   把每个字母往回转相同的格数即得明文。5 题一局：看密文与轮盘偏移，反推明文。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.caesrwheel.tut1t'), d: T('gs.caesrwheel.tut1') },
  { t: T('gs.caesrwheel.tut2t'), d: T('gs.caesrwheel.tut2') },
  { t: T('gs.caesrwheel.tut3t'), d: T('gs.caesrwheel.tut3') },
  { t: T('gs.caesrwheel.tut4t'), d: T('gs.caesrwheel.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var WORDS = ['ARCADE', 'CIPHER', 'SECRET', 'BATTLE', 'ARMY', 'FLEET', 'CODE', 'SIGNAL', 'VAULT', 'PATROL'];
  var TOTAL = 5, idx = 0, correct = 0;

  /* 凯撒轮盘：明文转 shift 格得密文 */
  function encode(word, shift) {
    var o = '';
    for (var i = 0; i < word.length; i++) o += String.fromCharCode(65 + (word.charCodeAt(i) - 65 + shift) % 26);
    return o;
  }

  var wrap = document.createElement('div');
  wrap.className = 'cw-wrap';
  wrap.innerHTML =
    '<div class="cw-progress" id="cw-prog"></div>' +
    '<div class="cw-cipher" id="cw-cipher"></div>' +
    '<div class="cw-key">' + T('gs.caesrwheel.keyLabel') + ' <span class="cw-keyv" id="cw-key"></span></div>' +
    '<div class="cw-hint" id="cw-hint"></div>' +
    '<input class="cw-input" id="cw-in" maxlength="10" autocomplete="off" spellcheck="false">' +
    '<div class="cw-msg" id="cw-msg"></div>' +
    '<button class="btn accent" id="cw-sub">' + T('gs.caesrwheel.submit') + '</button>' +
    '<div class="cw-help">' + T('gs.caesrwheel.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#cw-prog'), cipherEl = wrap.querySelector('#cw-cipher'),
      keyEl = wrap.querySelector('#cw-key'), hint = wrap.querySelector('#cw-hint'),
      input = wrap.querySelector('#cw-in'), msg = wrap.querySelector('#cw-msg'), sub = wrap.querySelector('#cw-sub');

  var answer = '', shift = 0, nextTimer = null;

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    answer = WORDS[Math.floor(Math.random() * WORDS.length)];
    shift = 1 + Math.floor(Math.random() * 25);
    cipherEl.textContent = encode(answer, shift);
    keyEl.textContent = T('gs.caesrwheel.shiftTag').replace('{n}', shift);
    hint.textContent = answer.replace(/./g, '_ ').trim();
    input.value = ''; input.maxLength = answer.length;
    prog.textContent = T('gs.caesrwheel.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'cw-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.toUpperCase().trim();
    if (!v) { msg.textContent = T('gs.caesrwheel.msgEmpty'); msg.className = 'cw-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.caesrwheel.msgRight'); msg.className = 'cw-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.caesrwheel.msgWrong').replace('{answer}', answer); msg.className = 'cw-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 700);
  }

  function finish() {
    cipherEl.textContent = T('gs.caesrwheel.done');
    keyEl.textContent = ''; hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.caesrwheel.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.caesrwheel.perfect') : T('gs.caesrwheel.goodJob');
    msg.className = 'cw-msg ok';
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
