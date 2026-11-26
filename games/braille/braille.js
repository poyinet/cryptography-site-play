/* 盲文 Braille（Louis Braille，1829；六点编码）——
   每个字母是 2×3 点阵里若干凸起的点：左列 1-2-3，右列 4-5-6。
   点位编号约定：1 左上、2 左中、3 左下、4 右上、5 右中、6 右下。
   A-Z 标准点位（一级盲文）：
   A=1 B=12 C=14 D=145 E=15 F=124 G=1245 H=125 I=24 J=245
   K=13 L=123 M=134 N=1345 O=135 P=1234 Q=12345 R=1235 S=234 T=2345
   U=136 V=1236 W=2456 X=1346 Y=13456 Z=1356
   5 题一局：看点阵图案对照下方点位表，还原明文单词。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.braille.tut1t'), d: T('gs.braille.tut1') },
  { t: T('gs.braille.tut2t'), d: T('gs.braille.tut2') },
  { t: T('gs.braille.tut3t'), d: T('gs.braille.tut3') },
  { t: T('gs.braille.tut4t'), d: T('gs.braille.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var WORDS = ['CIPHER', 'SECRET', 'ENIGMA', 'SIGNAL', 'PUZZLE', 'PATROL', 'RADIO', 'VAULT', 'AGENT', 'MORSE'];
  var TOTAL = 5, idx = 0, correct = 0;

  /* A-Z 的点位表 */
  var PATTERNS = {
    A: '1', B: '12', C: '14', D: '145', E: '15', F: '124', G: '1245', H: '125', I: '24', J: '245',
    K: '13', L: '123', M: '134', N: '1345', O: '135', P: '1234', Q: '12345', R: '1235', S: '234', T: '2345',
    U: '136', V: '1236', W: '2456', X: '1346', Y: '13456', Z: '1356'
  };

  /* 渲染一个盲文单元格（点位号集合） */
  function cell(pattern, small) {
    var set = {};
    for (var i = 0; i < pattern.length; i++) set[pattern.charAt(i)] = true;
    var h = '<div class="bl-cell">';
    for (var d = 1; d <= 6; d++) h += '<span class="bl-dot' + (set[d] ? ' on' : '') + '"></span>';
    return h + '</div>';
  }

  function encode(word) {
    var o = [];
    for (var i = 0; i < word.length; i++) o.push(cell(PATTERNS[word.charAt(i)]));
    return o;
  }

  var wrap = document.createElement('div');
  wrap.className = 'bl-wrap';
  wrap.innerHTML =
    '<div class="bl-progress" id="bl-prog"></div>' +
    '<div class="bl-cipher" id="bl-cipher"></div>' +
    '<div class="bl-hint" id="bl-hint"></div>' +
    '<input class="bl-input" id="bl-in" maxlength="10" autocomplete="off" spellcheck="false">' +
    '<div class="bl-msg" id="bl-msg"></div>' +
    '<button class="btn accent" id="bl-sub">' + T('gs.braille.submit') + '</button>' +
    '<div class="bl-chart" id="bl-chart"></div>' +
    '<div class="bl-help">' + T('gs.braille.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#bl-prog'), cipherEl = wrap.querySelector('#bl-cipher'),
      hint = wrap.querySelector('#bl-hint'),
      input = wrap.querySelector('#bl-in'), msg = wrap.querySelector('#bl-msg'), sub = wrap.querySelector('#bl-sub'),
      chartEl = wrap.querySelector('#bl-chart');

  var answer = '', nextTimer = null;

  function renderChart() {
    var h = '';
    for (var i = 0; i < 26; i++) {
      var L = String.fromCharCode(65 + i);
      h += '<div class="bl-key">' + cell(PATTERNS[L]) + '<span>' + L + '</span></div>';
    }
    chartEl.innerHTML = h;
  }

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    answer = WORDS[Math.floor(Math.random() * WORDS.length)];
    cipherEl.innerHTML = encode(answer).join('');
    hint.textContent = answer.replace(/./g, '_ ').trim();
    input.value = ''; input.maxLength = answer.length;
    prog.textContent = T('gs.braille.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'bl-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.toUpperCase().trim();
    if (!v) { msg.textContent = T('gs.braille.msgEmpty'); msg.className = 'bl-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.braille.msgRight'); msg.className = 'bl-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.braille.msgWrong').replace('{answer}', answer); msg.className = 'bl-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 900);
  }

  function finish() {
    cipherEl.innerHTML = '<span style="font-size:26px">⠿</span>';
    hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.braille.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.braille.perfect') : T('gs.braille.goodJob');
    msg.className = 'bl-msg ok';
    if (Arcade.juice && correct > 0) Arcade.juice.win();
    if (Arcade.shell) Arcade.shell.submitScore(correct);
  }

  sub.addEventListener('click', submit);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
  renderChart();
  next();

  window.GAME_RESTART = function () {
    if (nextTimer) { clearTimeout(nextTimer); nextTimer = null; }
    idx = 0; correct = 0;
    input.style.display = ''; sub.style.display = '';
    next();
  };

  window.__blPatterns = PATTERNS; window.__blEncode = encode;
})();
