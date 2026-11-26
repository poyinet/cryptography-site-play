/* 三位数字密码 Tridigital——
   ACA 数字替换密码：密钥词去重后 + 剩余字母按序，写成 3 行 × 9 列的混字母表，
   表头顶着一排 0-9 的数字键（10 位排列，末位留给空格）。每个明文字母 → 它正上方的数字。
   本机是「编码方向」：给你密钥表 + 明文单词，你算出它的三位数字码。
   5 题一局：看表与明文，写出数字串。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.tridigital.tut1t'), d: T('gs.tridigital.tut1') },
  { t: T('gs.tridigital.tut2t'), d: T('gs.tridigital.tut2') },
  { t: T('gs.tridigital.tut3t'), d: T('gs.tridigital.tut3') },
  { t: T('gs.tridigital.tut4t'), d: T('gs.tridigital.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var WORDS = ['CIPHER', 'SECRET', 'ENIGMA', 'SIGNAL', 'PUZZLE', 'PATROL', 'VAULT', 'AGENT', 'RADAR', 'MORSE'];
  var KEYWORDS = ['CIPHER', 'SECRET', 'ENIGMA', 'SIGNAL', 'TRITHE', 'GRONSF'];
  var NUMKEYS = ['0915874362', '3607514289', '5823091746', '7492068351', '2580379416', '9361482075'];
  var TOTAL = 5, idx = 0, correct = 0;

  /* 密钥词去重 + 剩余字母按序 = 26 字母混表 */
  function keyedAlphabet(keyword) {
    var kw = keyword.toUpperCase().replace(/[^A-Z]/g, '');
    var seen = {}, seq = [];
    for (var i = 0; i < kw.length; i++) { var c = kw.charAt(i); if (!seen[c]) { seen[c] = true; seq.push(c); } }
    for (var j = 0; j < 26; j++) { var c2 = String.fromCharCode(65 + j); if (!seen[c2]) seq.push(c2); }
    return seq.join('');
  }

  /* 单词 -> 数字码（每字母取所在列上方的数字） */
  function encode(word, seq, numkey) {
    var out = '';
    for (var i = 0; i < word.length; i++) {
      var p = seq.indexOf(word.charAt(i));
      if (p < 0) continue;
      var col = p % 9;
      out += numkey.charAt(col);
    }
    return out;
  }

  var wrap = document.createElement('div');
  wrap.className = 'td-wrap';
  wrap.innerHTML =
    '<div class="td-progress" id="td-prog"></div>' +
    '<div class="td-plain" id="td-plain"></div>' +
    '<div class="td-grid" id="td-grid"></div>' +
    '<div class="td-hint" id="td-hint"></div>' +
    '<input class="td-input" id="td-in" maxlength="12" autocomplete="off" spellcheck="false">' +
    '<div class="td-msg" id="td-msg"></div>' +
    '<button class="btn accent" id="td-sub">' + T('gs.tridigital.submit') + '</button>' +
    '<div class="td-help">' + T('gs.tridigital.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#td-prog'), plainEl = wrap.querySelector('#td-plain'),
      gridEl = wrap.querySelector('#td-grid'), hint = wrap.querySelector('#td-hint'),
      input = wrap.querySelector('#td-in'), msg = wrap.querySelector('#td-msg'), sub = wrap.querySelector('#td-sub');

  var seq = [], numkey = '', answerDigits = '', nextTimer = null;

  function renderTable() {
    var h = '';
    /* 表头：10 个数字（末位是空格分隔符） */
    for (var c = 0; c < 10; c++) h += '<span class="td-cell head">' + numkey.charAt(c) + '</span>';
    /* 3 行 × 9 列字母（第 10 列留空） */
    for (var r = 0; r < 3; r++) {
      for (var c2 = 0; c2 < 10; c2++) {
        var p = r * 9 + c2;
        if (c2 === 9) { h += '<span class="td-cell empty">·</span>'; }
        else if (p < seq.length) { h += '<span class="td-cell">' + seq.charAt(p) + '</span>'; }
        else { h += '<span class="td-cell empty">·</span>'; }
      }
    }
    gridEl.innerHTML = h;
  }

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    var word = WORDS[Math.floor(Math.random() * WORDS.length)];
    var kw = KEYWORDS[Math.floor(Math.random() * KEYWORDS.length)];
    numkey = NUMKEYS[Math.floor(Math.random() * NUMKEYS.length)];
    seq = keyedAlphabet(kw);
    answerDigits = encode(word, seq, numkey);
    plainEl.textContent = word;
    renderTable();
    hint.textContent = word.length + ' ' + T('gs.tridigital.digits').replace('{n}', answerDigits.length);
    input.value = ''; input.maxLength = answerDigits.length;
    prog.textContent = T('gs.tridigital.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'td-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.replace(/[^0-9]/g, '');
    if (!v) { msg.textContent = T('gs.tridigital.msgEmpty'); msg.className = 'td-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answerDigits) {
      correct++;
      msg.textContent = T('gs.tridigital.msgRight'); msg.className = 'td-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.tridigital.msgWrong').replace('{answer}', answerDigits); msg.className = 'td-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 900);
  }

  function finish() {
    plainEl.textContent = T('gs.tridigital.done');
    hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.tridigital.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.tridigital.perfect') : T('gs.tridigital.goodJob');
    msg.className = 'td-msg ok';
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

  window.__tdKeyed = keyedAlphabet; window.__tdEncode = encode;
})();
