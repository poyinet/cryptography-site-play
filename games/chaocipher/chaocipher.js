/* 混沌密码 Chaocipher（John F. Byrne，1918；算法 2010 年由其家族捐赠档案才公开）——
   两个 26 字母轮：右轮（明文侧）定位明文，左轮（密文侧）同位置读密文；
   每加密一个字母，两轮各自按固定规则置换一次——密钥自己会走路。
   左轮置换：① 整体左旋使密文字母到第 1 位；② 取出第 2 位；
   ③ 第 3-14 位整体左移一格；④ 取出的字母放到第 14 位。
   右轮置换：① 整体左旋使明文字母到第 1 位；② 再左旋一格；
   ③ 取出第 3 位；④ 第 4-14 位整体左移一格；⑤ 取出的字母放到第 14 位。
   解密同构：在左轮找密文字母，右轮同位置即明文，然后走同样的两步置换。
   5 题一局：下方轨迹表给出每个字母加密前两轮的状态，逐位对照查读还原单词。 */
window.GAME_TUTORIAL_STEPS = [
  { t: T('gs.chaocipher.tut1t'), d: T('gs.chaocipher.tut1') },
  { t: T('gs.chaocipher.tut2t'), d: T('gs.chaocipher.tut2') },
  { t: T('gs.chaocipher.tut3t'), d: T('gs.chaocipher.tut3') },
  { t: T('gs.chaocipher.tut4t'), d: T('gs.chaocipher.tut4') }
];

(function () {
  var root = document.getElementById('game-root');
  var WORDS = ['CIPHER', 'SECRET', 'ENIGMA', 'SIGNAL', 'PUZZLE', 'PATROL', 'RADIO', 'VAULT', 'AGENT', 'MORSE'];
  /* 起始双轮（第一组为 Byrne  Exhibit 1 的历史起始态） */
  var WHEELS = [
    { left: 'HXUCZVAMDSLKPEFJRIGTWOBNYQ', right: 'PTLNBQDEOYSFAVZKGJRIHWXUMC' },
    { left: 'CXPBFLWSDHYKMAURGTOVQZNEIJ', right: 'MKVGWDCPBELZUAHYRFNTSJIXQO' },
    { left: 'BWXTJAZKMCNDQYFOGLPHVRSIUE', right: 'AFNUSGTDLBWYCXRKHEQPMVIZOJ' }
  ];
  var TOTAL = 5, idx = 0, correct = 0;

  /* 左轮置换（0 基位置） */
  function permuteLeft(a, ct) {
    var i = a.indexOf(ct);
    var rot = a.slice(i).concat(a.slice(0, i));        /* ct 到第 1 位 */
    var taken = rot.charAt(1);
    var head = rot.charAt(0), mid = rot.slice(2, 14), tail = rot.slice(14);
    return head + mid + taken + tail;                  /* 取出位 1 的字母 → 位 14 */
  }

  /* 右轮置换 */
  function permuteRight(a, pt) {
    var i = a.indexOf(pt);
    var rot = a.slice(i + 1).concat(a.slice(0, i + 1)); /* pt 到第 1 位后再左旋一格 */
    var taken = rot.charAt(2);
    var head = rot.slice(0, 2), mid = rot.slice(3, 14), tail = rot.slice(14);
    return head + mid + taken + tail;
  }

  /* 加密：返回 { ct, trace:[{left,right,ct}...] }，trace 为每字母加密前的轮状态 */
  function encrypt(word, w0) {
    var left = w0.left, right = w0.right, ct = '', trace = [];
    for (var i = 0; i < word.length; i++) {
      var p = word.charAt(i);
      var j = right.indexOf(p);
      var c = left.charAt(j);
      trace.push({ left: left, right: right, ct: c });
      ct += c;
      left = permuteLeft(left, c);
      right = permuteRight(right, p);
    }
    return { ct: ct, trace: trace };
  }

  /* 解密（同构：左轮找密文、右轮读明文，置换规则相同） */
  function decrypt(ct, w0) {
    var left = w0.left, right = w0.right, out = '';
    for (var i = 0; i < ct.length; i++) {
      var c = ct.charAt(i);
      var j = left.indexOf(c);
      var p = right.charAt(j);
      out += p;
      left = permuteLeft(left, c);
      right = permuteRight(right, p);
    }
    return out;
  }

  var wrap = document.createElement('div');
  wrap.className = 'cc-wrap';
  wrap.innerHTML =
    '<div class="cc-progress" id="cc-prog"></div>' +
    '<div class="cc-cipher" id="cc-cipher"></div>' +
    '<div class="cc-scroll"><div class="cc-table" id="cc-table"></div></div>' +
    '<div class="cc-lab">' + T('gs.chaocipher.traceLabel') + '</div>' +
    '<div class="cc-hint" id="cc-hint"></div>' +
    '<input class="cc-input" id="cc-in" maxlength="10" autocomplete="off" spellcheck="false">' +
    '<div class="cc-msg" id="cc-msg"></div>' +
    '<button class="btn accent" id="cc-sub">' + T('gs.chaocipher.submit') + '</button>' +
    '<div class="cc-help">' + T('gs.chaocipher.helpText') + '</div>';
  root.appendChild(wrap);
  var prog = wrap.querySelector('#cc-prog'), cipherEl = wrap.querySelector('#cc-cipher'),
      tableEl = wrap.querySelector('#cc-table'), hint = wrap.querySelector('#cc-hint'),
      input = wrap.querySelector('#cc-in'), msg = wrap.querySelector('#cc-msg'), sub = wrap.querySelector('#cc-sub');

  var answer = '', trace = [], nextTimer = null;

  function renderTrace() {
    var h = '<span class="cc-h">#</span><span class="cc-h">' + T('gs.chaocipher.leftWheel') + '</span><span class="cc-h">' + T('gs.chaocipher.rightWheel') + '</span><span class="cc-h">' + T('gs.chaocipher.ct') + '</span>';
    for (var i = 0; i < trace.length; i++) {
      h += '<span class="cc-step">' + (i + 1) + '</span>' +
        '<span class="cc-left">' + trace[i].left + '</span>' +
        '<span class="cc-right">' + trace[i].right + '</span>' +
        '<span class="cc-ct">' + trace[i].ct + '</span>';
    }
    tableEl.innerHTML = h;
  }

  function next() {
    if (idx >= TOTAL) { finish(); return; }
    answer = WORDS[Math.floor(Math.random() * WORDS.length)];
    var w0 = WHEELS[Math.floor(Math.random() * WHEELS.length)];
    var r = encrypt(answer, w0);
    trace = r.trace;
    cipherEl.textContent = r.ct;
    renderTrace();
    hint.textContent = answer.replace(/./g, '_ ').trim();
    input.value = ''; input.maxLength = answer.length;
    prog.textContent = T('gs.chaocipher.progress').replace('{n}', idx + 1).replace('{total}', TOTAL).replace('{correct}', correct);
    msg.textContent = ''; msg.className = 'cc-msg';
    setTimeout(function () { input.focus(); }, 60);
  }

  function submit() {
    if (idx >= TOTAL) return;
    var v = input.value.toUpperCase().trim();
    if (!v) { msg.textContent = T('gs.chaocipher.msgEmpty'); msg.className = 'cc-msg no'; if (Arcade.audio) Arcade.audio.play('error'); return; }
    if (v === answer) {
      correct++;
      msg.textContent = T('gs.chaocipher.msgRight'); msg.className = 'cc-msg ok';
      if (Arcade.juice) Arcade.juice.coin(null, null, 'var(--neon-green)');
    } else {
      msg.textContent = T('gs.chaocipher.msgWrong').replace('{answer}', answer); msg.className = 'cc-msg no';
      if (Arcade.audio) Arcade.audio.play('error');
    }
    idx++;
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(next, 1200);
  }

  function finish() {
    cipherEl.textContent = T('gs.chaocipher.done');
    tableEl.innerHTML = ''; hint.textContent = '';
    input.style.display = 'none'; sub.style.display = 'none';
    prog.textContent = T('gs.chaocipher.summary').replace('{n}', correct).replace('{total}', TOTAL);
    msg.textContent = correct === TOTAL ? T('gs.chaocipher.perfect') : T('gs.chaocipher.goodJob');
    msg.className = 'cc-msg ok';
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

  window.__ccEncrypt = encrypt; window.__ccDecrypt = decrypt;
  window.__ccPermuteLeft = permuteLeft; window.__ccPermuteRight = permuteRight;
})();
