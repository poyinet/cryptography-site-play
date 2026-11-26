/* 格罗马克密码 GROMARK（GROnsfeld with Mixed Alphabet and Running Key，ACA 1969）——
   两件套密钥：① 混字母表：关键词去重后接剩余字母，写进宽=词长的换位块，
   再按关键词字母的字母序逐列读出（K2M）；② 5 位 primers 扩展的流水数字键：
   第 n 位 = (第 n-5 位 + 第 n-4 位) mod 10，1st+2nd 得 6th、2nd+3rd 得 7th……
   加密：明文侧是标准字母表，P 的序号往右数 k 格（k=该位流水键数字），
   在混字母表同一位置读出密文 C。解密反向。
   5 题一局：看两张对照字母表、逐位密钥数字与密文，还原明文单词。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.gromark.tut1t'), d: T('gs.gromark.tut1') },
  { t: T('gs.gromark.tut2t'), d: T('gs.gromark.tut2') },
  { t: T('gs.gromark.tut3t'), d: T('gs.gromark.tut3') },
  { t: T('gs.gromark.tut4t'), d: T('gs.gromark.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var WORDS = ['CIPHER', 'SECRET', 'ENIGMA', 'SIGNAL', 'PUZZLE', 'PATROL', 'RADIO', 'VAULT', 'AGENT', 'MORSE'];
  var KEYWORDS = ['ENIGMA', 'CIPHER', 'SECRET', 'PUZZLE'];
  var PRIMERS = ['23452', '64317', '37526', '51842', '20916'];
  var STD = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var TOTAL = 5, idx = 0, correct = 0;

  /* K2M：关键词 → 换位块 → 按关键词字母序列逐列读出 */
  function k2m(keyword) {
    var seen = {}, kw = '';
    for (var i = 0; i < keyword.length; i++) {
      var c = keyword.charAt(i);
      if (!seen[c]) { seen[c] = 1; kw += c; }
    }
    var W = kw.length, seq = kw;
    for (var j = 0; j < 26; j++) {
      var c2 = STD.charAt(j);
      if (!seen[c2]) seq += c2;
    }
    var cols = [];
    for (var col = 0; col < W; col++) {
      var s = '';
      for (var r = col; r < 26; r += W) s += seq.charAt(r);
      cols.push(s);
    }
    var order = [];
    for (var o = 0; o < W; o++) order.push(o);
    order.sort(function (a, b) { return kw.charAt(a) < kw.charAt(b) ? -1 : 1; });
    var out = '';
    for (var k = 0; k < W; k++) out += cols[order[k]];
    return out;
  }

  /* 流水数字键：primer 5 位起，每位 = 前第 5 位 + 前第 4 位（mod 10） */
  function runningKey(primer, len) {
    var k = [];
    for (var i = 0; i < primer.length; i++) k.push(Number(primer.charAt(i)));
    while (k.length < len) k.push((k[k.length - 5] + k[k.length - 4]) % 10);
    return k;
  }

  /* 加密：标准序号 + k → 混字母表取字 */
  function encrypt(word, mixed, key) {
    var o = '';
    for (var i = 0; i < word.length; i++) {
      var j = STD.indexOf(word.charAt(i));
      o += mixed.charAt((j + key[i]) % 26);
    }
    return o;
  }

  /* 解密：混字母表序号 - k → 标准字母表取字 */
  function decrypt(ct, mixed, key) {
    var o = '';
    for (var i = 0; i < ct.length; i++) {
      var j = mixed.indexOf(ct.charAt(i));
      o += STD.charAt(((j - key[i]) % 26 + 26) % 26);
    }
    return o;
  }

  var wrap = document.createElement('div');
  wrap.className = 'gm-wrap';
  wrap.innerHTML =
    '<div class="gm-progress" id="gm-prog"></div>' +
    '<div class="gm-cipher" id="gm-cipher"></div>' +
    '<div class="gm-keydigits" id="gm-kd"></div>' +
    '<div class="gm-alpha"><div class="gm-row" id="gm-std"></div><div class="gm-row" id="gm-mix"></div></div>' +
    '<div class="gm-lab">' + T('gs.gromark.alphaLabel') + '</div>' +
    '<div class="gm-key">' + T('gs.gromark.keyLabel') + ' <b id="gm-key"></b></div>' +
    '<div class="gm-hint" id="gm-hint"></div>' +
    '<input class="gm-input" id="gm-in" maxlength="10" autocomplete="off" spellcheck="false">' +
    '<div class="gm-msg" id="gm-msg"></div>' +
    '<button class="btn accent" id="gm-sub">' + T('gs.gromark.submit') + '</button>' +
    '<div class="gm-help">' + T('gs.gromark.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#gm-prog'), cipherEl = wrap.querySelector('#gm-cipher'),
      kdEl = wrap.querySelector('#gm-kd'), stdEl = wrap.querySelector('#gm-std'),
      mixEl = wrap.querySelector('#gm-mix'), keyEl = wrap.querySelector('#gm-key'),
      hint = wrap.querySelector('#gm-hint'),
      input = wrap.querySelector('#gm-in'), msg = wrap.querySelector('#gm-msg'), sub = wrap.querySelector('#gm-sub');

  var answer = '', mixed = '', primer = '', nextTimer = null;

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    answer = WORDS[Math.floor(Math.random() * WORDS.length)];
    var kw = KEYWORDS[Math.floor(Math.random() * KEYWORDS.length)];
    primer = PRIMERS[Math.floor(Math.random() * PRIMERS.length)];
    mixed = k2m(kw);
    var key = runningKey(primer, answer.length);
    cipherEl.textContent = encrypt(answer, mixed, key);
    var kd = '';
    for (var i = 0; i < answer.length; i++) kd += key[i] + ' ';
    kdEl.textContent = kd.trim();
    var hs = '', hm = '';
    for (var s = 0; s < 26; s++) { hs += '<span class="gm-cell std">' + STD.charAt(s) + '</span>'; hm += '<span class="gm-cell mix">' + mixed.charAt(s) + '</span>'; }
    stdEl.innerHTML = hs; mixEl.innerHTML = hm;
    keyEl.textContent = primer + ' → ' + key.join('');
    hint.textContent = answer.replace(/./g, '_ ').trim();
    input.value = ''; input.maxLength = answer.length;
    prog.textContent = T('gs.gromark.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'gm-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.toUpperCase().trim();
    if (!v) { msg.textContent = T('gs.gromark.msgEmpty'); msg.className = 'gm-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.gromark.msgRight'); msg.className = 'gm-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.gromark.msgWrong').replace('{answer}', answer); msg.className = 'gm-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 1000);
  }

  function finish() {
    cipherEl.textContent = T('gs.gromark.done');
    kdEl.textContent = ''; stdEl.innerHTML = ''; mixEl.innerHTML = ''; keyEl.textContent = ''; hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.gromark.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.gromark.perfect') : T('gs.gromark.goodJob');
    msg.className = 'gm-msg ok';
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

  window.__gmK2m = k2m; window.__gmEncrypt = encrypt; window.__gmDecrypt = decrypt; window.__gmRunningKey = runningKey;
})();
