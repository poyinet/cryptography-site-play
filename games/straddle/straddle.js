/* 跨栏棋盘密码 Straddling Checkerboard —— 间谍与游击队的经典压缩编码。
   结构：顶行 10 格（数字 0-9），其中 8 格放高频字母（一位数字编码）；
   空出的 2 格数字是「跨栏选择子」，第二、三行的字母用「选择子数字 + 列数字」两位编码。
   26 = 8 + 10 + 8。5 题一局：看棋盘与数字串，还原明文单词。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.straddle.tut1t'), d: T('gs.straddle.tut1') },
  { t: T('gs.straddle.tut2t'), d: T('gs.straddle.tut2') },
  { t: T('gs.straddle.tut3t'), d: T('gs.straddle.tut3') },
  { t: T('gs.straddle.tut4t'), d: T('gs.straddle.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var WORDS = ['AGENT', 'VAULT', 'MORSE', 'CIPHER', 'SIGNAL', 'ENIGMA', 'SECRET', 'PUZZLE', 'PATROL', 'RADIO'];
  var KEYS = ['SHADOW', 'CIPHER', 'AGENT', 'SIGNAL'];
  var ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var SEL = [8, 9]; /* 两个跨栏选择子数字 */
  var TOTAL = 5, idx = 0, correct = 0;

  /* 关键词 → 26 字母混字母序列 */
  function keyedAlpha(keyword) {
    var seen = {}, out = '';
    for (var i = 0; i < keyword.length; i++) {
      var c = keyword.charAt(i);
      if (!seen[c]) { seen[c] = 1; out += c; }
    }
    for (var j = 0; j < ALPHA.length; j++) {
      var c2 = ALPHA.charAt(j);
      if (!seen[c2]) { seen[c2] = 1; out += c2; }
    }
    return out;
  }

  /* 构建棋盘：返回 { top: [8 字母], row2: [10], row3: [8], map: 字母→编码 } */
  function buildBoard(keyword) {
    var seq = keyedAlpha(keyword);
    var top = seq.slice(0, 8), row2 = seq.slice(8, 18), row3 = seq.slice(18, 26);
    var map = {};
    for (var i = 0; i < 8; i++) map[top[i]] = String(i);            /* 一位数字 0-7 */
    for (var j = 0; j < 10; j++) map[row2[j]] = '8' + j;            /* 两位 80-89 */
    for (var k = 0; k < 8; k++) map[row3[k]] = '9' + k;             /* 两位 90-97 */
    return { top: top, row2: row2, row3: row3, map: map };
  }

  function encode(word, board) {
    var o = '';
    for (var i = 0; i < word.length; i++) o += board.map[word.charAt(i)];
    return o;
  }

  /* 从左到右解析数字串：8/9 开头取两位，其余取一位 */
  function decode(digits, board) {
    var o = '', i = 0;
    while (i < digits.length) {
      var d = digits.charAt(i);
      if (d === '8' || d === '9') {
        var code = d + digits.charAt(i + 1);
        o += (d === '8' ? board.row2 : board.row3)[Number(digits.charAt(i + 1))];
        i += 2;
      } else {
        o += board.top[Number(d)];
        i += 1;
      }
    }
    return o;
  }

  var wrap = document.createElement('div');
  wrap.className = 'st-wrap';
  wrap.innerHTML =
    '<div class="st-progress" id="st-prog"></div>' +
    '<div class="st-cipher" id="st-cipher"></div>' +
    '<div class="st-board" id="st-board"></div>' +
    '<div class="st-hint" id="st-hint"></div>' +
    '<input class="st-input" id="st-in" maxlength="10" autocomplete="off" spellcheck="false">' +
    '<div class="st-msg" id="st-msg"></div>' +
    '<button class="btn accent" id="st-sub">' + T('gs.straddle.submit') + '</button>' +
    '<div class="st-help">' + T('gs.straddle.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#st-prog'), cipherEl = wrap.querySelector('#st-cipher'),
      boardEl = wrap.querySelector('#st-board'), hint = wrap.querySelector('#st-hint'),
      input = wrap.querySelector('#st-in'), msg = wrap.querySelector('#st-msg'), sub = wrap.querySelector('#st-sub');

  var answer = '', board = null, nextTimer = null;

  function renderBoard() {
    var h = '<span class="st-h"></span>';
    for (var d = 0; d < 10; d++) h += '<span class="st-h">' + d + '</span>';
    h += '<span class="st-cell lab">·</span>';
    /* 顶行：8 字母 + 2 个选择子空格 */
    for (var i = 0; i < 10; i++) {
      if (i < 8) h += '<span class="st-cell">' + board.top[i] + '</span>';
      else h += '<span class="st-cell sel">' + SEL[i - 8] + '</span>';
    }
    /* 第二行（选择子 8） */
    h += '<span class="st-cell lab">8</span>';
    for (var j = 0; j < 10; j++) h += '<span class="st-cell">' + board.row2[j] + '</span>';
    /* 第三行（选择子 9，8 字母 + 2 空） */
    h += '<span class="st-cell lab">9</span>';
    for (var k = 0; k < 8; k++) h += '<span class="st-cell">' + board.row3[k] + '</span>';
    h += '<span class="st-cell empty"></span><span class="st-cell empty"></span>';
    boardEl.innerHTML = h;
  }

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    answer = WORDS[Math.floor(Math.random() * WORDS.length)];
    var kw = KEYS[Math.floor(Math.random() * KEYS.length)];
    board = buildBoard(kw);
    cipherEl.textContent = encode(answer, board);
    renderBoard();
    hint.textContent = answer.replace(/./g, '_ ').trim();
    input.value = ''; input.maxLength = answer.length;
    prog.textContent = T('gs.straddle.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'st-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.toUpperCase().trim();
    if (!v) { msg.textContent = T('gs.straddle.msgEmpty'); msg.className = 'st-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.straddle.msgRight'); msg.className = 'st-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.straddle.msgWrong').replace('{answer}', answer); msg.className = 'st-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 900);
  }

  function finish() {
    cipherEl.textContent = T('gs.straddle.done');
    boardEl.innerHTML = ''; hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.straddle.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.straddle.perfect') : T('gs.straddle.goodJob');
    msg.className = 'st-msg ok';
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

  window.__stEncode = encode; window.__stDecode = decode; window.__stBuild = buildBoard;
})();
