/* 流水文本键密码 Running Key Cipher（19 世纪外交圈）——
   维吉尼亚密码的变体：密钥不是短单词，而是一整段文字（本馆用传世名言），
   从段落开头依次取字母（跳过空格与标点），与明文对齐做维吉尼亚加减。
   加密：C = (P 序号 + K 序号) mod 26；解密反向。
   5 题一局：看密钥文本与密文，还原明文单词。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.runningkey.tut1t'), d: T('gs.runningkey.tut1') },
  { t: T('gs.runningkey.tut2t'), d: T('gs.runningkey.tut2') },
  { t: T('gs.runningkey.tut3t'), d: T('gs.runningkey.tut3') },
  { t: T('gs.runningkey.tut4t'), d: T('gs.runningkey.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var WORDS = ['CIPHER', 'SECRET', 'ENIGMA', 'SIGNAL', 'PUZZLE', 'PATROL', 'RADIO', 'VAULT', 'AGENT', 'MORSE'];
  /* 密钥文本（显示用，含空格）；加密时取字母序列 */
  var QUOTES = [
    { text: 'THE SECRET OF GETTING AHEAD IS GETTING STARTED', by: 'Mark Twain' },
    { text: 'IN THE MIDDLE OF DIFFICULTY LIES OPPORTUNITY', by: 'Albert Einstein' },
    { text: 'THE ONLY THING WE HAVE TO FEAR IS FEAR ITSELF', by: 'Franklin D. Roosevelt' },
    { text: 'IMAGINATION IS MORE IMPORTANT THAN KNOWLEDGE', by: 'Albert Einstein' },
    { text: 'LIFE CAN ONLY BE UNDERSTOOD BACKWARDS', by: 'Søren Kierkegaard' }
  ];
  var STD = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var TOTAL = 5, idx = 0, correct = 0;

  /* 取段落前 n 个字母（跳过空格标点） */
  function keyLetters(quote, n) {
    var out = '';
    for (var i = 0; i < quote.length && out.length < n; i++) {
      var c = quote.charAt(i);
      if (STD.indexOf(c) >= 0) out += c;
    }
    return out;
  }

  function encrypt(word, quote) {
    var k = keyLetters(quote, word.length), o = '';
    for (var i = 0; i < word.length; i++) {
      o += STD.charAt((STD.indexOf(word.charAt(i)) + STD.indexOf(k.charAt(i))) % 26);
    }
    return o;
  }

  function decrypt(ct, quote) {
    var k = keyLetters(quote, ct.length), o = '';
    for (var i = 0; i < ct.length; i++) {
      o += STD.charAt(((STD.indexOf(ct.charAt(i)) - STD.indexOf(k.charAt(i))) % 26 + 26) % 26);
    }
    return o;
  }

  var wrap = document.createElement('div');
  wrap.className = 'rk-wrap';
  wrap.innerHTML =
    '<div class="rk-progress" id="rk-prog"></div>' +
    '<div class="rk-cipher" id="rk-cipher"></div>' +
    '<div class="rk-key"><b>' + T('gs.runningkey.keyLabel') + '</b><br><span class="rk-quote" id="rk-quote"></span><br><span id="rk-by" style="font-size:11px"></span></div>' +
    '<div class="rk-hint" id="rk-hint"></div>' +
    '<input class="rk-input" id="rk-in" maxlength="10" autocomplete="off" spellcheck="false">' +
    '<div class="rk-msg" id="rk-msg"></div>' +
    '<button class="btn accent" id="rk-sub">' + T('gs.runningkey.submit') + '</button>' +
    '<div class="rk-help">' + T('gs.runningkey.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#rk-prog'), cipherEl = wrap.querySelector('#rk-cipher'),
      quoteEl = wrap.querySelector('#rk-quote'), byEl = wrap.querySelector('#rk-by'),
      hint = wrap.querySelector('#rk-hint'),
      input = wrap.querySelector('#rk-in'), msg = wrap.querySelector('#rk-msg'), sub = wrap.querySelector('#rk-sub');

  var answer = '', quote = '', nextTimer = null;

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    answer = WORDS[Math.floor(Math.random() * WORDS.length)];
    var q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    quote = q.text;
    cipherEl.textContent = encrypt(answer, quote);
    quoteEl.textContent = q.text;
    byEl.textContent = '— ' + q.by;
    hint.textContent = answer.replace(/./g, '_ ').trim();
    input.value = ''; input.maxLength = answer.length;
    prog.textContent = T('gs.runningkey.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'rk-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.toUpperCase().trim();
    if (!v) { msg.textContent = T('gs.runningkey.msgEmpty'); msg.className = 'rk-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.runningkey.msgRight'); msg.className = 'rk-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.runningkey.msgWrong').replace('{answer}', answer); msg.className = 'rk-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 1000);
  }

  function finish() {
    cipherEl.textContent = T('gs.runningkey.done');
    quoteEl.textContent = ''; byEl.textContent = ''; hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.runningkey.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.runningkey.perfect') : T('gs.runningkey.goodJob');
    msg.className = 'rk-msg ok';
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

  window.__rkEncrypt = encrypt; window.__rkDecrypt = decrypt; window.__rkKeyLetters = keyLetters;
})();
