/* ROT47 —— 可打印 ASCII 的半圈旋转
   把 94 个可打印字符（ASCII 33 '!' 到 126 '~'）排成一圈，
   每个字符向后旋转 47 位（正好半圈）。不在这个范围内的字符（空格、制表符）原样留下。
   47 = 94 ÷ 2，所以旋转两次就回到原文——加密解密是同一个函数。
   权威算例：Hello → w6==@，ABCDEF → pqrstu。
   本机负责编码：给你明文，你逐字符旋转后输入密文。
   5 题一局。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.rot47.tut1t'), d: T('gs.rot47.tut1') },
  { t: T('gs.rot47.tut2t'), d: T('gs.rot47.tut2') },
  { t: T('gs.rot47.tut3t'), d: T('gs.rot47.tut3') },
  { t: T('gs.rot47.tut4t'), d: T('gs.rot47.tut4') }
];

(function () {
  var SENTENCES = ['Hello World', 'The quick brown fox', 'Attack at dawn', 'ROT47 is fun', 'Code 47!', 'Meet me at noon', 'Bravo Zulu', 'Enigma machine', 'Secret message 42', 'Well done agent'];
  var TOTAL = 5, idx = 0, correct = 0;

  /* 核心：33-126 循环位移 47 */
  function rot47(s) {
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if (c >= 33 && c <= 126) {
        out += String.fromCharCode(33 + ((c - 33 + 47) % 94));
      } else {
        out += s.charAt(i);
      }
    }
    return out;
  }

  /* ---------- DOM ---------- */
  var root = document.getElementById('game-root');
  var wrap = document.createElement('div');
  wrap.className = 'r7-wrap';
  wrap.innerHTML =
    '<div class="r7-progress" id="r7-prog"></div>' +
    '<div class="r7-lbl">' + T('gs.rot47.plainLbl') + '</div>' +
    '<div class="r7-plain" id="r7-plain"></div>' +
    '<div class="r7-strip" id="r7-strip"></div>' +
    '<input class="r7-input" id="r7-in" maxlength="24" autocomplete="off" spellcheck="false">' +
    '<div class="r7-msg" id="r7-msg"></div>' +
    '<button class="btn accent" id="r7-sub">' + T('gs.rot47.submit') + '</button>' +
    '<div class="r7-help">' + T('gs.rot47.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#r7-prog'), plainEl = wrap.querySelector('#r7-plain'),
      stripEl = wrap.querySelector('#r7-strip'), input = wrap.querySelector('#r7-in'),
      msg = wrap.querySelector('#r7-msg'), sub = wrap.querySelector('#r7-sub');

  var answer = '', nextTimer = null;

  /* 可打印 ASCII 参考条：33-126，旋转半圈高亮 */
  function renderStrip() {
    var h = '';
    for (var c = 33; c <= 126; c++) {
      var ch = String.fromCharCode(c);
      var disp = (ch === '<' || ch === '>' || ch === '&') ? '&#' + c + ';' : ch;
      h += '<span class="r7-ch">' + disp + '</span>';
    }
    stripEl.innerHTML = h;
  }

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    var s = SENTENCES[Math.floor(Math.random() * SENTENCES.length)];
    answer = rot47(s);
    plainEl.textContent = s;
    input.value = ''; input.maxLength = answer.length;
    input.placeholder = T('gs.rot47.hintLen').replace('{n}', answer.length);
    prog.textContent = T('gs.rot47.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'r7-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    if (input.value === '') { msg.textContent = T('gs.rot47.msgEmpty'); msg.className = 'r7-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (input.value === answer) {
      correct++;
      msg.textContent = T('gs.rot47.msgRight'); msg.className = 'r7-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.rot47.msgWrong').replace('{answer}', answer); msg.className = 'r7-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 900);
  }

  function finish() {
    plainEl.textContent = T('gs.rot47.done');
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.rot47.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.rot47.perfect') : T('gs.rot47.goodJob');
    msg.className = 'r7-msg ok';
    if (Arcade.juice && correct > 0) Arcade.juice.win();
    if (Arcade.shell) Arcade.shell.submitScore(correct);
  }

  sub.addEventListener('click', submit);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
  renderStrip();
  next();

  window.GAME_RESTART = function () {
    if (nextTimer) { clearTimeout(nextTimer); nextTimer = null; }
    idx = 0; correct = 0;
    input.style.display = ''; sub.style.display = '';
    next();
  };

  window.__rot47Enc = rot47; window.__rot47Dec = rot47; window.__rot47Sentences = SENTENCES;
})();
