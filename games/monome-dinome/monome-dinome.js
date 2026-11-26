/* 单双码密码 Monome-Dinome——
   ACA 1996 数字密码：3×8 密钥阵（J→I、Z→Y，共 24 字母）。
   顶行字母 → 单数字（monome，该列的数字）；下面两行 → 「行数字 + 列数字」（dinome）。
   数字键 10 位：第 1 位给第 2 行、第 2 位给第 3 行、后 8 位给 8 列。
   本机负责解码：看方阵与数字串，还原英文单词。5 题一局。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.monome-dinome.tut1t'), d: T('gs.monome-dinome.tut1') },
  { t: T('gs.monome-dinome.tut2t'), d: T('gs.monome-dinome.tut2') },
  { t: T('gs.monome-dinome.tut3t'), d: T('gs.monome-dinome.tut3') },
  { t: T('gs.monome-dinome.tut4t'), d: T('gs.monome-dinome.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var WORDS = ['CIPHER', 'SECRET', 'ENIGMA', 'SIGNAL', 'CRYPT', 'PATROL', 'VAULT', 'AGENT', 'RADAR', 'MORSE'];
  var KEYWORDS = ['GROUCHO', 'CIPHER', 'SECRET', 'ENIGMA', 'SIGNAL', 'TRITHE'];
  var NUMKEYS = ['3607514289', '5823091746', '7492068351', '2580379416', '9361482075', '1472590368'];
  var TOTAL = 5, idx = 0, correct = 0;

  /* 密钥词 -> 24 字母混表（J→I、Z→Y，去重 + 剩余按序） */
  function keyed24(keyword) {
    var kw = keyword.toUpperCase().replace(/J/g, 'I').replace(/Z/g, 'Y').replace(/[^A-Z]/g, '');
    var seen = {}, seq = [];
    for (var i = 0; i < kw.length; i++) { var c = kw.charAt(i); if (!seen[c]) { seen[c] = true; seq.push(c); } }
    for (var j = 0; j < 26; j++) {
      var c2 = String.fromCharCode(65 + j);
      if (c2 === 'J' || c2 === 'Z') continue;
      if (!seen[c2]) seq.push(c2);
    }
    return seq.slice(0, 24).join('');
  }

  /* 编码一个词 -> 数字串（空格分隔） */
  function encodeWord(word, seq, numkey) {
    var row2 = numkey.charAt(0), row3 = numkey.charAt(1);
    var out = [];
    for (var i = 0; i < word.length; i++) {
      var p = seq.indexOf(word.charAt(i));
      if (p < 0) continue;
      var col = p % 8;
      var colDig = numkey.charAt(2 + col);
      if (p < 8) out.push(colDig);            /* 顶行 monome */
      else if (p < 16) out.push(row2 + colDig); /* 第 2 行 dinome */
      else out.push(row3 + colDig);               /* 第 3 行 dinome */
    }
    return out.join(' ');
  }

  var wrap = document.createElement('div');
  wrap.className = 'md-wrap';
  wrap.innerHTML =
    '<div class="md-progress" id="md-prog"></div>' +
    '<div class="md-cipher" id="md-cipher"></div>' +
    '<div class="md-grid" id="md-grid"></div>' +
    '<div class="md-hint" id="md-hint"></div>' +
    '<input class="md-input" id="md-in" maxlength="10" autocomplete="off" spellcheck="false">' +
    '<div class="md-msg" id="md-msg"></div>' +
    '<button class="btn accent" id="md-sub">' + T('gs.monome-dinome.submit') + '</button>' +
    '<div class="md-help">' + T('gs.monome-dinome.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#md-prog'), cipherEl = wrap.querySelector('#md-cipher'),
      gridEl = wrap.querySelector('#md-grid'), hint = wrap.querySelector('#md-hint'),
      input = wrap.querySelector('#md-in'), msg = wrap.querySelector('#md-msg'), sub = wrap.querySelector('#md-sub');

  var answer = '', seq = [], numkey = '', nextTimer = null;

  function renderTable() {
    var h = '<span class="md-cell"></span>';
    for (var c = 0; c < 8; c++) h += '<span class="md-cell col">' + numkey.charAt(2 + c) + '</span>';
    var rowLabs = ['', numkey.charAt(0), numkey.charAt(1)];
    for (var r = 0; r < 3; r++) {
      h += '<span class="md-cell rowlab">' + (rowLabs[r] || '·') + '</span>';
      for (var c2 = 0; c2 < 8; c2++) {
        var p = r * 8 + c2;
        h += '<span class="md-cell">' + seq.charAt(p) + '</span>';
      }
    }
    gridEl.innerHTML = h;
  }

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    answer = WORDS[Math.floor(Math.random() * WORDS.length)];
    var kw = KEYWORDS[Math.floor(Math.random() * KEYWORDS.length)];
    numkey = NUMKEYS[Math.floor(Math.random() * NUMKEYS.length)];
    seq = keyed24(kw);
    cipherEl.textContent = encodeWord(answer, seq, numkey);
    renderTable();
    hint.textContent = answer.replace(/./g, '_ ').trim();
    input.value = ''; input.maxLength = answer.length;
    prog.textContent = T('gs.monome-dinome.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'md-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.toUpperCase().replace(/[^A-Z]/g, '');
    if (!v) { msg.textContent = T('gs.monome-dinome.msgEmpty'); msg.className = 'md-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.monome-dinome.msgRight'); msg.className = 'md-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.monome-dinome.msgWrong').replace('{answer}', answer); msg.className = 'md-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 900);
  }

  function finish() {
    cipherEl.textContent = T('gs.monome-dinome.done');
    hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.monome-dinome.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.monome-dinome.perfect') : T('gs.monome-dinome.goodJob');
    msg.className = 'md-msg ok';
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

  window.__mdKeyed = keyed24; window.__mdEncode = encodeWord;
})();
