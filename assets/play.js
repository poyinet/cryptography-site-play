/* 游戏站：主题切换、搜索/分类/难度筛选、最近游玩、成绩桥（本机）。 */
(function () {
  var root = document.documentElement;

  function themeInit() {
    try {
      var t = localStorage.getItem('crypto-theme');
      if (t === 'dark' || t === 'light') root.setAttribute('data-theme', t);
    } catch (e) {}
    var btn = document.querySelector('[data-theme-toggle]');
    if (btn) btn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('crypto-theme', next); } catch (e) {}
      var icon = btn.querySelector('[data-theme-icon]');
      if (icon) icon.textContent = next === 'dark' ? '☾' : '☀';
    });
  }

  function filters() {
    var grid = document.querySelector('[data-game-grid]');
    if (!grid) return;
    var input = document.querySelector('[data-game-search]');
    var cat = '';
    var lvl = '';
    var count = document.querySelector('[data-game-count]');
    var cards = [].slice.call(grid.querySelectorAll('[data-game-card]'));
    function apply() {
      var q = (input && input.value || '').trim().toLowerCase();
      var shown = 0;
      cards.forEach(function (card) {
        var text = (card.getAttribute('data-search') || '').toLowerCase();
        var ok = (!q || text.indexOf(q) >= 0) && (!cat || card.getAttribute('data-category') === cat) && (!lvl || card.getAttribute('data-level') === lvl);
        card.hidden = !ok;
        if (ok) shown++;
      });
      if (count) count.textContent = shown + ' / ' + cards.length + ' 款';
      var empty = document.querySelector('[data-game-empty]');
      if (empty) empty.hidden = shown > 0;
    }
    if (input) input.addEventListener('input', apply);
    document.querySelectorAll('[data-filter-cat]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('[data-filter-cat]').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        btn.setAttribute('aria-pressed', 'true');
        cat = btn.getAttribute('data-filter-cat');
        apply();
      });
    });
    document.querySelectorAll('[data-filter-level]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('[data-filter-level]').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        var v = btn.getAttribute('data-filter-level');
        if (lvl === v) { lvl = ''; btn.setAttribute('aria-pressed', 'false'); }
        else { lvl = v; btn.setAttribute('aria-pressed', 'true'); }
        apply();
      });
    });
    apply();
  }

  function remember() {
    document.querySelectorAll('[data-game-link]').forEach(function (a) {
      a.addEventListener('click', function () {
        try { localStorage.setItem('crypto-last-game', a.getAttribute('data-game-link')); } catch (e) {}
        track('game_click', {game: a.getAttribute('data-game-link')});
      });
    });
  }

  function fullscreen() {
    var btn = document.querySelector('[data-fullscreen]');
    var frame = document.querySelector('.player-frame');
    if (!btn || !frame) return;
    btn.addEventListener('click', function () {
      var el = frame;
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (el.requestFullscreen) el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      }
    });
  }

  function readableKnowledge() {
    document.querySelectorAll('.game-know').forEach(function (el) {
      var text = (el.textContent || '').trim();
      if (text.indexOf('知识：') === 0) el.textContent = '相关知识条目';
      else if (text.indexOf('对应课程：') === 0) el.textContent = '对应课程';
    });
  }

  var SCORE_KEY = 'crypto-game-scores-v1';
  var SCORE_COOKIE = 'crypto_game_scores';
  var manifestCache = null;

  function readCookieName(name) {
    var hit = document.cookie.split(';').filter(function (x) { return x.trim().indexOf(name + '=') === 0; })[0];
    if (!hit) return {};
    try { return JSON.parse(decodeURIComponent(hit.split('=').slice(1).join('='))); } catch (e) { return {}; }
  }
  function readScores() {
    var out = {};
    try { out = JSON.parse(localStorage.getItem(SCORE_KEY) || '{}') || {}; } catch (e) {}
    var c = readCookieName(SCORE_COOKIE);
    for (var k in c) if (!out[k]) out[k] = c[k];
    return out;
  }
  function writeScores(data) {
    try { localStorage.setItem(SCORE_KEY, JSON.stringify(data)); } catch (e) {}
    try {
      var cookie = SCORE_COOKIE + '=' + encodeURIComponent(JSON.stringify(data)) + '; Path=/; Max-Age=31536000; SameSite=Lax';
      if (/(^|\.)poyi\.net$/.test(location.hostname)) cookie += '; Domain=.poyi.net';
      document.cookie = cookie;
    } catch (e) {}
  }
  function currentSlug() {
    var frame = document.querySelector('.player-frame iframe');
    if (frame) {
      var src = frame.getAttribute('src') || '';
      var m = src.match(/\/games\/([^/]+)\//);
      if (m) return m[1];
    }
    var m2 = location.pathname.match(/\/game\/([^/]+)/);
    return m2 ? m2[1] : '';
  }
  function manifestFor(slug) {
    if (!manifestCache || !manifestCache.games) return null;
    for (var i = 0; i < manifestCache.games.length; i++) if (manifestCache.games[i].id === slug) return manifestCache.games[i];
    return null;
  }
  function toast(msg) {
    var el = document.querySelector('[data-player-toast]');
    if (!el) {
      el = document.createElement('div');
      el.setAttribute('data-player-toast', '1');
      el.className = 'player-toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(window.__playerToast);
    window.__playerToast = setTimeout(function () { el.classList.remove('show'); }, 2200);
  }
  function track(name, data) {
    try {
      if (window.CryptoEvents && window.CryptoEvents.track) window.CryptoEvents.track(name, data || {});
      else {
        var q = window.__cryptoEventsQueue || (window.__cryptoEventsQueue = []);
        q.push([name, data || {}]);
      }
    } catch (e) {}
  }
  function saveScore(slug, score, isNew, bestMode) {
    if (!slug || !isFinite(score)) return;
    var scores = readScores();
    var rec = scores[slug] || {plays: 0, best: null, bestMode: bestMode || 'max'};
    rec.bestMode = bestMode || rec.bestMode || 'max';
    var becameBest = rec.best == null || (rec.bestMode === 'min' ? score < rec.best : score > rec.best);
    if (becameBest) rec.best = score;
    rec.last = score;
    rec.plays = (rec.plays || 0) + 1;
    rec.lastAt = Date.now();
    scores[slug] = rec;
    writeScores(scores);
    renderPlayerScore(slug);
    toast((becameBest ? '新纪录：' : '本局：') + score + ' · 本机最佳 ' + rec.best);
    track('game_score', {game: slug, score: score, best: rec.best, isNew: !!isNew});
  }
  function renderPlayerScore(slug) {
    var panel = document.querySelector('[data-player-score]');
    if (!panel) return;
    var rec = readScores()[slug] || {plays: 0, best: null};
    var best = panel.querySelector('[data-player-best]');
    var plays = panel.querySelector('[data-player-plays]');
    if (best) best.textContent = rec.best == null ? '—' : rec.best;
    if (plays) plays.textContent = rec.plays || 0;
  }
  function buildPlayerScore() {
    var top = document.querySelector('.player-top');
    var frame = document.querySelector('.player-frame');
    if (!top || !frame || document.querySelector('[data-player-score]')) return;
    var slug = currentSlug();
    var panel = document.createElement('div');
    panel.className = 'player-score';
    panel.setAttribute('data-player-score', '1');
    panel.innerHTML = '<span>本机最佳 <strong data-player-best>—</strong></span><span>完成局数 <strong data-player-plays>0</strong></span><span class="player-score-note">成绩保存在本机，并用 .poyi.net cookie 共享。</span>';
    top.parentNode.insertBefore(panel, top.nextSibling);
    renderPlayerScore(slug);
  }
  function bridgeEvents() {
    var slug = currentSlug();
    if (!slug) return;
    window.addEventListener('message', function (ev) {
      if (ev.origin !== location.origin) return;
      var d = ev.data || {};
      if (d.type !== 'crypto:game-event') return;
      if (d.event === 'game_start') {
        track('game_start', {game: d.game || slug});
      } else if (d.event === 'score') {
        var payload = d.data || {};
        saveScore(d.game || slug, +payload.score, !!payload.isNew, d.bestMode);
      }
    });
    window.addEventListener('beforeunload', function () {
      track('game_exit', {game: slug});
    });
  }

  themeInit();
  filters();
  remember();
  fullscreen();
  readableKnowledge();
  buildPlayerScore();
  bridgeEvents();
  try {
    fetch('/games-manifest.json', {cache: 'no-store'}).then(function (r) { return r.ok ? r.json() : null; }).then(function (m) {
      manifestCache = m;
      renderPlayerScore(currentSlug());
    }).catch(function () {});
  } catch (e) {}
})();
