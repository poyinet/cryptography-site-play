/* 猪圈密码 Pigpen（共济会密码 / Freemason's Cipher，18 世纪起）——
   字母不变字母，变成几何碎片：
   井字阵（无点）：A-I —— 符号 = 该格子与邻格共享的内缘线（角格 2 线、边格 3 线、中心 4 线成方框）；
   井字阵（加点）：J-R —— 同样形状，中心加一个点；
   叉形（无点）：S-V —— 叉子分出的四个楔形，S 上 ∧、T 右 >、U 下 ∨、V 左 <；
   叉形（加点）：W-Z —— 同样楔形加一个点。
   9×2 + 4×2 = 26，一符一字。5 题一局：看符号串对照密钥表，还原明文单词。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.pigpen.tut1t'), d: T('gs.pigpen.tut1') },
  { t: T('gs.pigpen.tut2t'), d: T('gs.pigpen.tut2') },
  { t: T('gs.pigpen.tut3t'), d: T('gs.pigpen.tut3') },
  { t: T('gs.pigpen.tut4t'), d: T('gs.pigpen.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var WORDS = ['CIPHER', 'SECRET', 'ENIGMA', 'SIGNAL', 'PUZZLE', 'PATROL', 'RADIO', 'VAULT', 'AGENT', 'MORSE'];
  var TOTAL = 5, idx = 0, correct = 0;

  /* 生成某字母的 SVG 符号（40×40 视框） */
  function glyph(letter) {
    var code = letter.charCodeAt(0) - 65; /* 0..25 */
    var lines = '', dot = false, wedge = -1;
    if (code < 18) {
      /* 两个井字阵：A-I 无点，J-R 加点；位置 = code % 9 → (r,c) */
      var p = code % 9, r = Math.floor(p / 3), c = p % 3;
      dot = code >= 9;
      var x0 = 10 + c * 10, y0 = 10 + r * 10, x1 = x0 + 10, y1 = y0 + 10;
      if (r > 0) lines += '<line x1="' + x0 + '" y1="' + y0 + '" x2="' + x1 + '" y2="' + y0 + '"/>'; /* 上（与上行共享） */
      if (r < 2) lines += '<line x1="' + x0 + '" y1="' + y1 + '" x2="' + x1 + '" y2="' + y1 + '"/>'; /* 下 */
      if (c > 0) lines += '<line x1="' + x0 + '" y1="' + y0 + '" x2="' + x0 + '" y2="' + y1 + '"/>'; /* 左 */
      if (c < 2) lines += '<line x1="' + x1 + '" y1="' + y0 + '" x2="' + x1 + '" y2="' + y1 + '"/>'; /* 右 */
    } else {
      /* 两个叉形：S-V 无点，W-Z 加点；楔形序号 = (code - 18) % 4：0 上 1 右 2 下 3 左 */
      var w = (code - 18) % 4;
      dot = code >= 22;
      wedge = w;
      var cx = 20, cy = 20;
      if (w === 0) lines = '<line x1="' + cx + '" y1="8" x2="8" y2="' + cy + '"/><line x1="' + cx + '" y1="8" x2="32" y2="' + cy + '"/>';
      if (w === 1) lines = '<line x1="32" y1="8" x2="' + cx + '" y2="' + cy + '"/><line x1="32" y1="32" x2="' + cx + '" y2="' + cy + '"/>';
      if (w === 2) lines = '<line x1="8" y1="32" x2="' + cx + '" y2="' + cy + '"/><line x1="32" y1="32" x2="' + cx + '" y2="' + cy + '"/>';
      if (w === 3) lines = '<line x1="8" y1="8" x2="' + cx + '" y2="' + cy + '"/><line x1="8" y1="32" x2="' + cx + '" y2="' + cy + '"/>';
    }
    var dotSvg = dot ? '<circle cx="20" cy="20" r="2.6" fill="var(--neon-cyan)" stroke="none"/>' : '';
    return '<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><g stroke="var(--neon-pink)" stroke-width="2.4" stroke-linecap="round">' + lines + '</g>' + dotSvg + '</svg>';
  }

  /* 字母 → 符号（供 QA 与调试） */
  function encode(word) {
    var o = [];
    for (var i = 0; i < word.length; i++) o.push(glyph(word.charAt(i)));
    return o;
  }

  var wrap = document.createElement('div');
  wrap.className = 'pp-wrap';
  wrap.innerHTML =
    '<div class="pp-progress" id="pp-prog"></div>' +
    '<div class="pp-cipher" id="pp-cipher"></div>' +
    '<div class="pp-hint" id="pp-hint"></div>' +
    '<input class="pp-input" id="pp-in" maxlength="10" autocomplete="off" spellcheck="false">' +
    '<div class="pp-msg" id="pp-msg"></div>' +
    '<button class="btn accent" id="pp-sub">' + T('gs.pigpen.submit') + '</button>' +
    '<div class="pp-chart" id="pp-chart"></div>' +
    '<div class="pp-help">' + T('gs.pigpen.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#pp-prog'), cipherEl = wrap.querySelector('#pp-cipher'),
      hint = wrap.querySelector('#pp-hint'),
      input = wrap.querySelector('#pp-in'), msg = wrap.querySelector('#pp-msg'), sub = wrap.querySelector('#pp-sub'),
      chartEl = wrap.querySelector('#pp-chart');

  var answer = '', nextTimer = null;

  function renderChart() {
    var h = '';
    for (var i = 0; i < 26; i++) {
      var L = String.fromCharCode(65 + i);
      h += '<div class="pp-key">' + glyph(L) + '<span>' + L + '</span></div>';
    }
    chartEl.innerHTML = h;
  }

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    answer = WORDS[Math.floor(Math.random() * WORDS.length)];
    cipherEl.innerHTML = encode(answer).join('');
    hint.textContent = answer.replace(/./g, '_ ').trim();
    input.value = ''; input.maxLength = answer.length;
    prog.textContent = T('gs.pigpen.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'pp-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.toUpperCase().trim();
    if (!v) { msg.textContent = T('gs.pigpen.msgEmpty'); msg.className = 'pp-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.pigpen.msgRight'); msg.className = 'pp-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.pigpen.msgWrong').replace('{answer}', answer); msg.className = 'pp-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 900);
  }

  function finish() {
    cipherEl.innerHTML = '<span style="font-size:26px">🐖</span>';
    hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.pigpen.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.pigpen.perfect') : T('gs.pigpen.goodJob');
    msg.className = 'pp-msg ok';
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

  window.__ppGlyph = glyph; window.__ppEncode = encode;
})();
