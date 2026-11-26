/* 滑尺密码 Slidefair（Helen Fouché Gaines《Cryptanalysis》1939，ACA 经典）——
   维吉尼亚方阵 + Playfair 矩形法则的混合：明文两两成组，每组消费一个周期密钥字母。
   加密（密钥字母 K 的移位量 s）：P1 在顶行（标准字母表）列 c1，P2 在 K 行列 c2；
   密文取矩形另外两个角——顶行[c2] 与 K 行[c1]，顶行字母在前。
   若两字同列（c1 == c2），取各自右边一格（解密取左边）。
   本实现即 ACA 官方口径：c2 = P2 序号 - s，C1 = 标准[c2]，C2 = 标准[(c1 + s) mod 26]。
   5 题一局：看方阵、周期密钥与密文（两两分组），还原明文单词。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.slidefair.tut1t'), d: T('gs.slidefair.tut1') },
  { t: T('gs.slidefair.tut2t'), d: T('gs.slidefair.tut2') },
  { t: T('gs.slidefair.tut3t'), d: T('gs.slidefair.tut3') },
  { t: T('gs.slidefair.tut4t'), d: T('gs.slidefair.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  /* 全部 6 字母词（偶数长免填充） */
  var WORDS = ['CIPHER', 'SECRET', 'ARCADE', 'ENIGMA', 'SIGNAL', 'PUZZLE', 'BATTLE', 'DECODE', 'FORCES', 'VAULTS'];
  var KEYWORDS = ['DIGRAPH', 'CIPHER', 'SECRET', 'SLIDE'];
  var STD = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var TOTAL = 5, idx = 0, correct = 0;

  /* 维吉尼亚表第 s 行：标准字母表左移 s 位 */
  function rowOf(s) { return STD.slice(s) + STD.slice(0, s); }

  /* 加密一组（digraph），s = 密钥移位量 */
  function encPair(p1, p2, s) {
    var c1 = STD.indexOf(p1);
    var c2 = ((STD.indexOf(p2) - s) % 26 + 26) % 26;
    if (c1 === c2) return STD.charAt((c1 + 1) % 26) + STD.charAt((c1 + 1 + s) % 26);
    return STD.charAt(c2) + STD.charAt((c1 + s) % 26);
  }

  /* 解密一组 */
  function decPair(c1x, c2x, s) {
    var cc2 = STD.indexOf(c1x);
    var cc1 = ((STD.indexOf(c2x) - s) % 26 + 26) % 26;
    if (cc1 === cc2) return STD.charAt(((cc1 - 1) % 26 + 26) % 26) + STD.charAt(((cc1 - 1 + s) % 26 + 26) % 26);
    return STD.charAt(cc1) + STD.charAt((cc2 + s) % 26);
  }

  function encrypt(word, keyword) {
    var o = '';
    for (var i = 0; i < word.length; i += 2) {
      var s = STD.indexOf(keyword.charAt((i / 2) % keyword.length));
      o += encPair(word.charAt(i), word.charAt(i + 1), s);
    }
    return o;
  }

  function decrypt(ct, keyword) {
    var o = '';
    for (var i = 0; i < ct.length; i += 2) {
      var s = STD.indexOf(keyword.charAt((i / 2) % keyword.length));
      o += decPair(ct.charAt(i), ct.charAt(i + 1), s);
    }
    return o;
  }

  var wrap = document.createElement('div');
  wrap.className = 'sf-wrap';
  wrap.innerHTML =
    '<div class="sf-progress" id="sf-prog"></div>' +
    '<div class="sf-cipher" id="sf-cipher"></div>' +
    '<div class="sf-key">' + T('gs.slidefair.keyLabel') + ' <b id="sf-key"></b></div>' +
    '<div class="sf-scroll"><div class="sf-table" id="sf-table"></div></div>' +
    '<div class="sf-lab">' + T('gs.slidefair.tableLabel') + '</div>' +
    '<div class="sf-hint" id="sf-hint"></div>' +
    '<input class="sf-input" id="sf-in" maxlength="10" autocomplete="off" spellcheck="false">' +
    '<div class="sf-msg" id="sf-msg"></div>' +
    '<button class="btn accent" id="sf-sub">' + T('gs.slidefair.submit') + '</button>' +
    '<div class="sf-help">' + T('gs.slidefair.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#sf-prog'), cipherEl = wrap.querySelector('#sf-cipher'),
      keyEl = wrap.querySelector('#sf-key'), tableEl = wrap.querySelector('#sf-table'),
      hint = wrap.querySelector('#sf-hint'),
      input = wrap.querySelector('#sf-in'), msg = wrap.querySelector('#sf-msg'), sub = wrap.querySelector('#sf-sub');

  var answer = '', keyword = '', nextTimer = null;

  function renderTable() {
    var h = '<span class="sf-cell h"></span>';
    for (var c = 0; c < 26; c++) h += '<span class="sf-cell h">' + STD.charAt(c) + '</span>';
    for (var r = 0; r < 26; r++) {
      h += '<span class="sf-cell row">' + STD.charAt(r) + '</span>';
      for (var c2 = 0; c2 < 26; c2++) {
        var isKey = keyword.indexOf(STD.charAt(r)) >= 0;
        h += '<span class="sf-cell ' + (r === 0 ? 'a' : (isKey ? 'k' : '')) + '">' + rowOf(r).charAt(c2) + '</span>';
      }
    }
    tableEl.innerHTML = h;
  }

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    answer = WORDS[Math.floor(Math.random() * WORDS.length)];
    keyword = KEYWORDS[Math.floor(Math.random() * KEYWORDS.length)];
    cipherEl.textContent = encrypt(answer, keyword);
    keyEl.textContent = keyword + '（' + T('gs.slidefair.period') + ' ' + keyword.length + '）';
    renderTable();
    hint.textContent = answer.replace(/./g, '_ ').trim();
    input.value = ''; input.maxLength = answer.length;
    prog.textContent = T('gs.slidefair.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'sf-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.toUpperCase().trim();
    if (!v) { msg.textContent = T('gs.slidefair.msgEmpty'); msg.className = 'sf-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.slidefair.msgRight'); msg.className = 'sf-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.slidefair.msgWrong').replace('{answer}', answer); msg.className = 'sf-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 1000);
  }

  function finish() {
    cipherEl.textContent = T('gs.slidefair.done');
    keyEl.textContent = ''; tableEl.innerHTML = ''; hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.slidefair.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.slidefair.perfect') : T('gs.slidefair.goodJob');
    msg.className = 'sf-msg ok';
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

  window.__sfEncrypt = encrypt; window.__sfDecrypt = decrypt;
})();
