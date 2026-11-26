/* 本地预览：把生产域名链接改写到本机三个端口；线上运行时不做任何事。 */
(function () {
  if (!window.__siteEnhanceLoader) {
    window.__siteEnhanceLoader = 1;
    var s = document.createElement('script');
    s.src = /^(127\.0\.0\.1|localhost)$/.test(location.hostname) ? 'http://127.0.0.1:8789/assets/site-enhance.js' : 'https://poyi.net/assets/site-enhance.js';
    s.defer = true;
    document.head.appendChild(s);
  }
  var hosts = {
    'https://poyi.net': 'http://127.0.0.1:8789',
    'https://learn.poyi.net': 'http://127.0.0.1:8790',
    'https://play.poyi.net': 'http://127.0.0.1:8791'
  };
  if (!/^(127\.0\.0\.1|localhost)$/.test(location.hostname)) return;
  function rewrite(href) {
    for (var origin in hosts) {
      if (href.indexOf(origin) === 0) return hosts[origin] + href.slice(origin.length);
    }
    return href;
  }
  function apply(root) {
    var links = (root || document).querySelectorAll('a[href]');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href');
      if (href && href.indexOf('http') === 0) links[i].setAttribute('href', rewrite(href));
    }
  }
  apply(document);
  document.addEventListener('DOMContentLoaded', function () { apply(document); });
})();
