/* 巴泽里斯密码 Bazeries（Étienne Bazeries，1898）——一个数字密钥身兼两职的乘积密码：
   ① 密钥数字拼成英文单词，去重后生成 25 字母混序表（I/J 合并），横着填进 5×5 密方阵；
      明方阵则是标准字母表竖着填（A F L Q V / B G M R W / C H N S X / D I O T Y / E K P U Z）。
   ② 密钥数字本身循环决定分组长度，每组字母倒置。
   加密顺序（ACA 口径）：先按数字分组倒置，再经双方阵同位替换。
   解密：先把密文字母从密方阵同位查回明方阵，再按同样分组倒置回来。
   5 题一局：看双方阵、分组规律与密文，还原明文单词。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.bazeries.tut1t'), d: T('gs.bazeries.tut1') },
  { t: T('gs.bazeries.tut2t'), d: T('gs.bazeries.tut2') },
  { t: T('gs.bazeries.tut3t'), d: T('gs.bazeries.tut3') },
  { t: T('gs.bazeries.tut4t'), d: T('gs.bazeries.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var WORDS = ['CIPHER', 'SECRET', 'ENIGMA', 'SIGNAL', 'PUZZLE', 'PATROL', 'RADIO', 'VAULT', 'AGENT', 'MORSE'];
  /* 数字密钥（均无 0 位）：81257 / 3752 / 24613 / 53719 / 41728 */
  var NUMKEYS = [81257, 3752, 24613, 53719, 41728];
  var STD25 = 'ABCDEFGHIKLMNOPQRSTUVWXYZ'; /* I/J 合并，无 J */
  var TOTAL = 5, idx = 0, correct = 0;

  /* 数字 → 英文单词串（< 100 万） */
  var ONES = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
  var TEENS = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
  var TENS = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
  function twoDigits(n) {
    if (n < 10) return ONES[n];
    if (n < 20) return TEENS[n - 10];
    return TENS[Math.floor(n / 10)] + (n % 10 ? ONES[n % 10] : '');
  }
  function threeDigits(n) {
    var h = Math.floor(n / 100), r = n % 100;
    return (h ? ONES[h] + 'HUNDRED' : '') + (r ? twoDigits(r) : '');
  }
  function numberToWords(num) {
    var parts = [];
    var th = Math.floor(num / 1000), rest = num % 1000;
    if (th) parts.push(threeDigits(th) + 'THOUSAND');
    if (rest) parts.push(threeDigits(rest));
    return parts.join('');
  }

  /* 单词串 → 25 字母混序表（去重 + 补剩余） */
  function keyed25(words) {
    var seen = {}, out = '';
    for (var i = 0; i < words.length; i++) {
      var c = words.charAt(i);
      if (!seen[c]) { seen[c] = 1; out += c; }
    }
    for (var j = 0; j < STD25.length; j++) {
      var c2 = STD25.charAt(j);
      if (!seen[c2]) { seen[c2] = 1; out += c2; }
    }
    return out;
  }

  /* 明方阵：标准 25 字母竖填（列优先） */
  function plainSquare() {
    var g = [], k = 0;
    for (var c = 0; c < 5; c++) for (var r = 0; r < 5; r++) { if (!g[r]) g[r] = []; g[r][c] = STD25.charAt(k++); }
    return g;
  }
  /* 密方阵：混序表横填（行优先） */
  function cipherSquare(mixed) {
    var g = [], k = 0;
    for (var r = 0; r < 5; r++) { g[r] = []; for (var c = 0; c < 5; c++) g[r][c] = mixed.charAt(k++); }
    return g;
  }
  function find(grid, ch) {
    for (var r = 0; r < 5; r++) for (var c = 0; c < 5; c++) if (grid[r][c] === ch) return [r, c];
    return [0, 0];
  }

  /* 按密钥数字循环分组并倒置每组 */
  function reverseGroups(text, digits) {
    var out = '', i = 0, di = 0;
    while (i < text.length) {
      var n = digits[di % digits.length];
      var group = text.substr(i, n);
      out += group.split('').reverse().join('');
      i += n; di++;
    }
    return out;
  }

  /* 加密：分组倒置 → 双方阵同位替换（J 按 I 处理） */
  function encrypt(word, mixed, digits) {
    var PT = plainSquare(), CT = cipherSquare(mixed);
    var t = word.replace(/J/g, 'I');
    t = reverseGroups(t, digits);
    var o = '';
    for (var i = 0; i < t.length; i++) {
      var p = find(PT, t.charAt(i));
      o += CT[p[0]][p[1]];
    }
    return o;
  }

  /* 解密：密方阵同位查回明方阵 → 分组倒置还原 */
  function decrypt(ct, mixed, digits) {
    var PT = plainSquare(), CT = cipherSquare(mixed);
    var t = '';
    for (var i = 0; i < ct.length; i++) {
      var p = find(CT, ct.charAt(i));
      t += PT[p[0]][p[1]];
    }
    return reverseGroups(t, digits);
  }

  function digitsOf(num) {
    return String(num).split('').map(Number);
  }

  var wrap = document.createElement('div');
  wrap.className = 'bz-wrap';
  wrap.innerHTML =
    '<div class="bz-progress" id="bz-prog"></div>' +
    '<div class="bz-cipher" id="bz-cipher"></div>' +
    '<div class="bz-key">' + T('gs.bazeries.keyLabel') + ' <b id="bz-key"></b></div>' +
    '<div class="bz-squares" id="bz-squares"></div>' +
    '<div class="bz-hint" id="bz-hint"></div>' +
    '<input class="bz-input" id="bz-in" maxlength="10" autocomplete="off" spellcheck="false">' +
    '<div class="bz-msg" id="bz-msg"></div>' +
    '<button class="btn accent" id="bz-sub">' + T('gs.bazeries.submit') + '</button>' +
    '<div class="bz-help">' + T('gs.bazeries.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#bz-prog'), cipherEl = wrap.querySelector('#bz-cipher'),
      keyEl = wrap.querySelector('#bz-key'), squaresEl = wrap.querySelector('#bz-squares'),
      hint = wrap.querySelector('#bz-hint'),
      input = wrap.querySelector('#bz-in'), msg = wrap.querySelector('#bz-msg'), sub = wrap.querySelector('#bz-sub');

  var answer = '', mixed = '', digits = null, nextTimer = null;

  function renderSquare(label, grid, keyed) {
    var h = '<div class="bz-sq' + (keyed ? ' k' : '') + '"><span class="bz-lab' + (keyed ? ' k' : '') + '">' + label + '</span>';
    for (var r = 0; r < 5; r++) for (var c = 0; c < 5; c++) h += '<span class="bz-cell">' + grid[r][c] + '</span>';
    return h + '</div>';
  }

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    answer = WORDS[Math.floor(Math.random() * WORDS.length)];
    var num = NUMKEYS[Math.floor(Math.random() * NUMKEYS.length)];
    digits = digitsOf(num);
    mixed = keyed25(numberToWords(num));
    cipherEl.textContent = encrypt(answer, mixed, digits);
    keyEl.textContent = num + '（' + numberToWords(num) + '）· ' + T('gs.bazeries.groups') + ' ' + digits.join('-');
    squaresEl.innerHTML =
      renderSquare(T('gs.bazeries.ptSq'), plainSquare(), false) +
      renderSquare(T('gs.bazeries.ctSq'), cipherSquare(mixed), true);
    hint.textContent = answer.replace(/./g, '_ ').trim();
    input.value = ''; input.maxLength = answer.length;
    prog.textContent = T('gs.bazeries.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'bz-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.toUpperCase().trim();
    if (!v) { msg.textContent = T('gs.bazeries.msgEmpty'); msg.className = 'bz-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.bazeries.msgRight'); msg.className = 'bz-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.bazeries.msgWrong').replace('{answer}', answer); msg.className = 'bz-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 1000);
  }

  function finish() {
    cipherEl.textContent = T('gs.bazeries.done');
    keyEl.textContent = ''; squaresEl.innerHTML = ''; hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.bazeries.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.bazeries.perfect') : T('gs.bazeries.goodJob');
    msg.className = 'bz-msg ok';
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

  window.__bzEncrypt = encrypt; window.__bzDecrypt = decrypt; window.__bzNumberToWords = numberToWords;
})();
