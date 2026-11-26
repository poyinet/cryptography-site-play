/* AMSCO 换位密码（ACA 经典，20 世纪初）——
   与普通列换位的区别：格子宽度交替——第 1 列每格装 1 个字母、第 2 列装 2 个、
   第 3 列装 1 个……明文按行写进这些宽窄不一的格子；
   然后按数字密钥的顺序逐列读出（每列自上而下），得到密文。
   解密：按同样规则推出每列的字母数，把密文按密钥顺序切回各列，再按行读出。
   5 题一局：看密文与数字密钥，还原明文单词。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.amsco.tut1t'), d: T('gs.amsco.tut1') },
  { t: T('gs.amsco.tut2t'), d: T('gs.amsco.tut2') },
  { t: T('gs.amsco.tut3t'), d: T('gs.amsco.tut3') },
  { t: T('gs.amsco.tut4t'), d: T('gs.amsco.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var WORDS = ['CIPHER', 'SECRET', 'ENIGMA', 'SIGNAL', 'PUZZLE', 'PATROL', 'RADIO', 'VAULT', 'AGENT', 'MORSE'];
  var KEYS = [[2, 1, 3], [3, 1, 2], [1, 3, 2], [2, 1, 4, 3], [3, 4, 1, 2], [4, 2, 3, 1], [2, 5, 1, 4, 3], [3, 1, 5, 2, 4]];
  var TOTAL = 5, idx = 0, correct = 0;

  /* 列宽交替 1,2,1,2… */
  function widths(N) {
    var w = [];
    for (var c = 0; c < N; c++) w.push(c % 2 === 0 ? 1 : 2);
    return w;
  }

  /* 按行填入：每列是一个「格串」数组（格串长 1 或 2，末格可能不足） */
  function fill(word, N) {
    var w = widths(N), cols = [];
    for (var c = 0; c < N; c++) cols.push([]);
    var i = 0;
    while (i < word.length) {
      for (var c2 = 0; c2 < N && i < word.length; c2++) {
        var take = Math.min(w[c2], word.length - i);
        cols[c2].push(word.substr(i, take));
        i += take;
      }
    }
    return cols;
  }

  function encrypt(word, key) {
    var N = key.length, cols = fill(word, N), o = '';
    for (var v = 1; v <= N; v++) {
      var ci = key.indexOf(v);
      o += cols[ci].join('');
    }
    return o;
  }

  function decrypt(ct, key) {
    var N = key.length, w = widths(N);
    var shape = fill('X'.repeat(ct.length), N); /* 同长度同形状 */
    var order = [];
    for (var v = 1; v <= N; v++) order.push(key.indexOf(v));
    var colText = new Array(N), pos = 0;
    for (var k = 0; k < N; k++) {
      var ci = order[k], len = shape[ci].join('').length;
      colText[ci] = ct.substr(pos, len);
      pos += len;
    }
    /* 按行读回：每行每列取 w[c] 个（末格不足则少取） */
    var out = '';
    for (var r = 0; ; r++) {
      var any = false;
      for (var c = 0; c < N; c++) {
        if (colText[c].length > 0) {
          var take = Math.min(w[c], colText[c].length);
          out += colText[c].substr(0, take);
          colText[c] = colText[c].substr(take);
          any = true;
        }
      }
      if (!any) break;
    }
    return out;
  }

  var wrap = document.createElement('div');
  wrap.className = 'am-wrap';
  wrap.innerHTML =
    '<div class="am-progress" id="am-prog"></div>' +
    '<div class="am-cipher" id="am-cipher"></div>' +
    '<div class="am-key">' + T('gs.amsco.keyLabel') + ' <b id="am-key"></b></div>' +
    '<div class="am-hint" id="am-hint"></div>' +
    '<input class="am-input" id="am-in" maxlength="10" autocomplete="off" spellcheck="false">' +
    '<div class="am-msg" id="am-msg"></div>' +
    '<button class="btn accent" id="am-sub">' + T('gs.amsco.submit') + '</button>' +
    '<div class="am-help">' + T('gs.amsco.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#am-prog'), cipherEl = wrap.querySelector('#am-cipher'),
      keyEl = wrap.querySelector('#am-key'), hint = wrap.querySelector('#am-hint'),
      input = wrap.querySelector('#am-in'), msg = wrap.querySelector('#am-msg'), sub = wrap.querySelector('#am-sub');

  var answer = '', key = null, nextTimer = null;

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    answer = WORDS[Math.floor(Math.random() * WORDS.length)];
    key = KEYS[Math.floor(Math.random() * KEYS.length)];
    cipherEl.textContent = encrypt(answer, key);
    keyEl.textContent = key.join(' ') + '（' + key.length + ' ' + T('gs.amsco.cols') + '）';
    hint.textContent = answer.replace(/./g, '_ ').trim();
    input.value = ''; input.maxLength = answer.length;
    prog.textContent = T('gs.amsco.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'am-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.toUpperCase().trim();
    if (!v) { msg.textContent = T('gs.amsco.msgEmpty'); msg.className = 'am-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.amsco.msgRight'); msg.className = 'am-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.amsco.msgWrong').replace('{answer}', answer); msg.className = 'am-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 900);
  }

  function finish() {
    cipherEl.textContent = T('gs.amsco.done');
    keyEl.textContent = ''; hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.amsco.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.amsco.perfect') : T('gs.amsco.goodJob');
    msg.className = 'am-msg ok';
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

  window.__amEncrypt = encrypt; window.__amDecrypt = decrypt;
})();
