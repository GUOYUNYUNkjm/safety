/* SHine-K 3.0 · 平台首页桥接：把现场端（live.html）的真实警报接入本平台的“警报中心”，
 * 并在“AI视频分析”面板显示现场端的实时状态。只在同一浏览器内通过 BroadcastChannel 接收。 */
(function () {
  'use strict';
  if (!window.SHKTransport) return;
  var tr = new SHKTransport('dash'), seen = {}, sites = {};
  tr.on(function (m) {
    if (!m.site) return;
    var s = sites[m.site] || (sites[m.site] = { people: 0, last: 0, hr: [] });
    s.last = Date.now();
    if (m.type === 'pose') s.people = (m.people || []).length;
    if (m.type === 'vitals' && m.hr != null) s.hr = [m.hr];
    if (m.type === 'alert' && m.aid) {
      var k = m.aid + ':' + m.level;
      if (seen[k]) return; seen[k] = 1;
      try {
        if (window.ENT && window.ENT.fireAlert) window.ENT.fireAlert('[实测] ' + m.msg, m.site, m.level === 'danger' ? 'danger' : 'warn');
      } catch (e) {}
    }
    render();
  });
  function render() {
    var el = document.getElementById('shk3-live-status'); if (!el) return;
    var now = Date.now(), keys = Object.keys(sites).filter(function (k) { return now - sites[k].last < 5000; });
    el.innerHTML = keys.length
      ? keys.map(function (k) { var s = sites[k]; return '● <b>' + k + '</b> · ' + s.people + ' 人' + (s.hr.length ? ' · ❤ ' + s.hr[0] : ''); }).join('&nbsp;&nbsp;&nbsp;')
      : '○ 现场端未运行（打开现场端并开启摄像头后，这里显示实时状态）';
    el.style.color = keys.length ? 'var(--g)' : 'var(--ink4)';
  }
  setInterval(render, 2000);
  if (document.readyState !== 'loading') render(); else document.addEventListener('DOMContentLoaded', render);
})();
