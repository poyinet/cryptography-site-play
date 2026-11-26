/* 音节方阵密码 Syllabary——
   美军 FM 34-40-2 的音节方阵：10×10 方阵装 A-Z、0-9 与 64 个双字音节，
   行和列都标着 0-9。每个明文字母/数字/音节 → 「行号 + 列号」两个数字。
   本机负责编码：给你方阵与明文（字母+数字），你算出坐标码。
   5 题一局：看方阵与明文，写出数字串。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.syllabary.tut1t'), d: T('gs.syllabary.tut1') },
  { t: T('gs.syllabary.tut2t'), d: T('gs.syllabary.tut2') },
  { t: T('gs.syllabary.tut3t'), d: T('gs.syllabary.tut3') },
  { t: T('gs.syllabary.tut4t'), d: T('gs.syllabary.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  /* 固定 10×10 音节方阵：A-Z、0-9、64 双字音节 */
  var GRID = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
    'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
    'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3',
    '4', '5', '6', '7', '8', '9', 'TH', 'HE', 'IN', 'ER',
    'RE', 'AN', 'ON', 'AT', 'EN', 'ND', 'TI', 'OR', 'DE', 'OF',
    'HI', 'ST', 'ED', 'NG', 'RT', 'EA', 'EM', 'EL', 'ES', 'AS',
    'IS', 'IT', 'BE', 'TO', 'WE', 'DO', 'NO', 'SO', 'PE', 'CE',
    'ME', 'AG', 'OL', 'AY', 'AW', 'IO', 'OU', 'UI', 'EI', 'IE',
    'OI', 'QU', 'CH', 'SH', 'PH', 'WH', 'GH', 'LL', 'SS', 'EE',
    'OO', 'AA', 'II', 'RR', 'TT', 'UU', 'WW', 'ZZ', 'AB', 'AC'
  ];
  /* 明文词（字母 + 数字），避免音节二义，只用单字符 */
  var WORDS = ['CIPHER42', 'SECRET07', 'ENIGMA23', 'SIGNAL88', 'CODE99', 'KEY101', 'ROUTE25', 'PATROL3', 'VAULT77', 'MORSE5'];
  var TOTAL = 5, idx = 0, correct = 0;

  /* 明文字符串 -> 坐标码（每字符两个数字：行+列） */
  function encode(text) {
    var out = '';
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      var p = GRID.indexOf(ch);
      if (p < 0) continue;
      out += String(Math.floor(p / 10)) + String(p % 10);
    }
    return out;
  }

  var wrap = document.createElement('div');
  wrap.className = 'sy-wrap';
  wrap.innerHTML =
    '<div class="sy-progress" id="sy-prog"></div>' +
    '<div class="sy-plain" id="sy-plain"></div>' +
    '<div class="sy-grid" id="sy-grid"></div>' +
    '<div class="sy-hint" id="sy-hint"></div>' +
    '<input class="sy-input" id="sy-in" maxlength="24" autocomplete="off" spellcheck="false">' +
    '<div class="sy-msg" id="sy-msg"></div>' +
    '<button class="btn accent" id="sy-sub">' + T('gs.syllabary.submit') + '</button>' +
    '<div class="sy-help">' + T('gs.syllabary.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#sy-prog'), plainEl = wrap.querySelector('#sy-plain'),
      gridEl = wrap.querySelector('#sy-grid'), hint = wrap.querySelector('#sy-hint'),
      input = wrap.querySelector('#sy-in'), msg = wrap.querySelector('#sy-msg'), sub = wrap.querySelector('#sy-sub');

  var answerCode = '', nextTimer = null;

  function renderGrid() {
    var h = '<span class="sy-cell head"></span>';
    for (var c = 0; c < 10; c++) h += '<span class="sy-cell head">' + c + '</span>';
    for (var r = 0; r < 10; r++) {
      h += '<span class="sy-cell head">' + r + '</span>';
      for (var c2 = 0; c2 < 10; c2++) h += '<span class="sy-cell">' + GRID[r * 10 + c2] + '</span>';
    }
    gridEl.innerHTML = h;
  }

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    var word = WORDS[Math.floor(Math.random() * WORDS.length)];
    answerCode = encode(word);
    plainEl.textContent = word;
    hint.textContent = T('gs.syllabary.hintDigits').replace('{n}', answerCode.length);
    input.value = ''; input.maxLength = answerCode.length;
    prog.textContent = T('gs.syllabary.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'sy-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.replace(/[^0-9]/g, '');
    if (!v) { msg.textContent = T('gs.syllabary.msgEmpty'); msg.className = 'sy-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answerCode) {
      correct++;
      msg.textContent = T('gs.syllabary.msgRight'); msg.className = 'sy-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.syllabary.msgWrong').replace('{answer}', answerCode); msg.className = 'sy-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 900);
  }

  function finish() {
    plainEl.textContent = T('gs.syllabary.done');
    hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.syllabary.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.syllabary.perfect') : T('gs.syllabary.goodJob');
    msg.className = 'sy-msg ok';
    if (Arcade.juice && correct > 0) Arcade.juice.win();
    if (Arcade.shell) Arcade.shell.submitScore(correct);
  }

  sub.addEventListener('click', submit);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
  renderGrid();
  next();

  window.GAME_RESTART = function () {
    if (nextTimer) { clearTimeout(nextTimer); nextTimer = null; }
    idx = 0; correct = 0;
    input.style.display = ''; sub.style.display = '';
    next();
  };

  window.__syEncode = encode; window.__syGrid = GRID;
})();
