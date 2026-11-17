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
    if (m.type === 'pose') { s.people = (m.people || []).length; s.list = m.people || []; }
    s.alerts = s.alerts || [];
    if (m.type === 'alert' && m.aid) { s.alerts = s.alerts.filter(function (a) { return a.aid !== m.aid; }); s.alerts.unshift({ aid: m.aid, level: m.level, msg: m.msg, at: Date.now() }); s.alerts.length = Math.min(s.alerts.length, 20); }
    if (m.type === 'clear' && m.aid) { s.alerts.forEach(function (a) { if (a.aid === m.aid) a.cleared = true; }); }
    window.__shk3Sites = sites;
    if (m.type === 'vitals' && m.hr != null) s.hr = [m.hr];
    if (m.type === 'vitals' && m.wid) { var D = window.__shk3Dev || (window.__shk3Dev = {}); D[m.site + '/' + m.wid] = { d: m, at: Date.now() }; }
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
    var els = document.querySelectorAll('#shk3-live-status,[data-shk3-live]'); if (!els.length) return;
    var now = Date.now(), keys = Object.keys(sites).filter(function (k) { return now - sites[k].last < 5000; });
    var on = function (id) { var e = document.getElementById(id); return e && e.classList.contains('on'); };
    var l = (on('app-btn-ko') || on('btn-ko')) ? 'ko' : (on('app-btn-en') || on('btn-en')) ? 'en' : 'zh';
    var W = { zh: [' 人', '○ 现场端未运行（打开现场端并开启摄像头后，这里显示实时状态）'],
              ko: ['명', '○ 현장 화면이 꺼져 있습니다 (현장 화면에서 카메라를 켜면 여기에 실시간 상태가 표시됩니다)'],
              en: [' people', '○ Field page not running (open it and start the camera to see live status here)'] }[l];
    var html = keys.length
      ? keys.map(function (k) { var s = sites[k]; return '● <b>' + k + '</b> · ' + s.people + W[0] + (s.hr.length ? ' · ❤ ' + s.hr[0] : ''); }).join('&nbsp;&nbsp;&nbsp;')
      : W[1];
    els.forEach(function (el) { el.innerHTML = html; if (el.id) el.style.color = keys.length ? 'var(--g)' : 'var(--ink4)'; });
  }
  setInterval(render, 2000);
  if (document.readyState !== 'loading') render(); else document.addEventListener('DOMContentLoaded', render);
})();
