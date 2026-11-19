/* SHine-K 3.0 · 按功能重排导航 + 首页功能目录
 * 侧栏：总览 → 现场监测 → 人员与健康 → 培训与应急 → 管理与合规 → 系统，只移动原有的菜单项，不改功能。
 * 首页：保留横幅（真实现场监测）+ 今日概况 + 最新警报，下面换成按同样分组的「功能目录」；
 *       隐藏原来的模块卡片、分类筛选和功能卡片网格。
 */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  function lang() { var on = function (id) { var e = $(id); return e && e.classList.contains('on'); }; return (on('app-btn-ko') || on('btn-ko')) ? 'ko' : (on('app-btn-en') || on('btn-en')) ? 'en' : 'zh'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  var G = [
    { k: 'ov', ic: '📊', items: ['overview', 'alerts', 'ai'],
      n: { zh: '总览与预警', ko: '개요·경보', en: 'Overview' }, d: { zh: '今天的整体情况、警报和趋势', ko: '오늘 현황, 경보, 추세', en: 'Today at a glance, alerts and trends' } },
    { k: 'site', ic: '📹', items: ['monitor', 'camera', 'iot', 'pxnearfall', 'pxfusion', 'pxergo', 'pxheatlaw', 'pxdust', 'pxnoise'],
      n: { zh: '现场监测', ko: '현장 모니터링', en: 'Site monitoring' }, d: { zh: '摄像头、手表和传感器实时看现场', ko: '카메라·워치·센서로 현장을 실시간 확인', en: 'Cameras, watches and sensors in real time' },
      ext: [['live.html', { zh: '现场端', ko: '현장 화면', en: 'Field app' }], ['center.html', { zh: '监控端', ko: '관제 화면', en: 'Control center' }], ['twin.html', { zh: '数字孪生', ko: '디지털 트윈', en: 'Digital twin' }]] },
    { k: 'ppl', ic: '👷', items: ['register', 'pxpeople', 'elderly', 'pxjobfit', 'pxfitcheck'],
      n: { zh: '人员与健康', ko: '인력·건강', en: 'People & health' }, d: { zh: '谁在岗、谁需要多关注、今天适不适合上岗', ko: '누가 일하는지, 누구를 더 살펴야 하는지, 오늘 작업 적합성', en: 'Who is on site, who needs attention, fit for duty today' },
      ext: [['worker.html', { zh: '工人手机端', ko: '근로자 휴대폰', en: 'Worker phone' }]] },
    { k: 'emg', ic: '✚', items: ['pxaid', 'pxdrill', 'briefing', 'pxlingo'],
      n: { zh: '培训与应急', ko: '교육·비상 대응', en: 'Training & emergency' }, d: { zh: '岗前培训、应急演练和多语言沟通', ko: '작업 전 교육, 비상 훈련, 다국어 소통', en: 'Induction, drills and multilingual communication' },
      ext: [['firstaid.html', { zh: '急救培训页', ko: '응급처치 교육', en: 'First-aid course' }]] },
    { k: 'mgmt', ic: '📋', items: ['checklist', 'pxra', 'pxcapa', 'pxhandover', 'pxexpiry', 'pxevidence'],
      n: { zh: '管理与合规', ko: '관리·법규 준수', en: 'Management & compliance' }, d: { zh: '风险评估 → 整改 → 记录，证明尽到安全义务', ko: '위험성평가 → 개선 → 기록, 안전 의무 이행 증빙', en: 'Assess → fix → record, proving the duty of care' },
      ext: [['ops.html', { zh: '作业管理', ko: '작업 관리', en: 'Operations' }], ['assistant.html', { zh: 'AI 安全助手', ko: 'AI 안전 도우미', en: 'AI assistant' }]] },
    { k: 'sys', ic: '⚙', items: ['settings', 'audit', 'reports', 'pxroadmap'],
      n: { zh: '系统', ko: '시스템', en: 'System' }, d: { zh: '设置、审计、报表和研究依据', ko: '설정, 감사, 리포트, 연구 근거', en: 'Settings, audit, reports and evidence' } }
  ];
  var IC = { overview: '📊', alerts: '🚨', ai: '🔮', monitor: '❤️', camera: '📹', iot: '⌚', register: '🪪', elderly: '👴', checklist: '✅', briefing: '📢', settings: '⚙️', audit: '📜', reports: '🧾',
    pxnearfall: '🦶', pxfusion: '🔗', pxergo: '🧍', pxheatlaw: '🌡', pxdust: '🌫', pxnoise: '🔊', pxpeople: '👷', pxjobfit: '👵', pxfitcheck: '⏱', pxaid: '✚', pxdrill: '🚨', pxlingo: '🌏',
    pxra: '📋', pxcapa: '🧾', pxhandover: '🔁', pxexpiry: '📦', pxevidence: '⚖', pxroadmap: '📚' };

  var css = document.createElement('style');
  css.textContent = [
    /* 侧栏：隐藏原来的分组标题 */
    '#sb-s1,#sb-s2,#px-sb-sec,#ent-sb-sec{display:none!important}',
    '#app .sb-section.nv-sec{display:flex;align-items:center;gap:6px}',
    'body.shk-mini #app .sb-section.nv-sec{display:none!important}',
    /* 首页：隐藏原来的模块卡片、第 3/4 个磁贴、分类筛选和卡片网格 */
    '#panel-home .home-wrap > .shk-sec, #panel-home #shk-mods, #panel-home #shk-chips, #panel-home #shk-grid{display:none!important}',
    '#panel-home .shk-tiles{grid-template-columns:repeat(2,minmax(0,1fr))!important}',
    '#panel-home .shk-tiles .shk-tile:nth-child(n+3){display:none!important}',
    '@media(max-width:700px){#panel-home .shk-tiles{grid-template-columns:1fr!important}}',
    /* 功能目录 */
    '.nv-head{display:flex;align-items:baseline;gap:10px;margin:6px 0 14px}.nv-head h3{font-size:1.15rem;font-weight:900}.nv-head span{font-size:.8rem;color:var(--ink4)}',
    '.nv-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-bottom:30px}',
    '@media(max-width:1200px){.nv-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:700px){.nv-grid{grid-template-columns:1fr}}',
    '.nv-card{background:#fff;border:1px solid #E6E9F0;border-radius:14px;padding:16px 16px 12px;display:flex;flex-direction:column}',
    '.nv-card h4{display:flex;align-items:center;gap:8px;font-size:1rem;font-weight:900;margin:0}',
    '.nv-card h4 i{font-style:normal;width:30px;height:30px;border-radius:9px;background:#F1F4F9;display:grid;place-items:center;font-size:1rem}',
    '.nv-card p{font-size:.78rem;color:var(--ink4);margin:4px 0 10px}',
    '.nv-list{display:flex;flex-direction:column;gap:2px;flex:1}',
    '.nv-it{display:flex;align-items:center;gap:10px;padding:8px 8px;border-radius:9px;cursor:pointer;font-size:.88rem;font-weight:700;color:var(--ink2)}',
    '.nv-it:hover{background:var(--abg);color:var(--a)}.nv-it span{width:20px;text-align:center}',
    '.nv-ext{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;padding-top:10px;border-top:1px solid #F0F2F6}',
    '.nv-ext a{font-size:.75rem;font-weight:700;color:var(--ink3);background:#F4F6FA;border-radius:8px;padding:5px 10px;text-decoration:none}.nv-ext a:hover{color:var(--a);background:var(--abg)}'
  ].join('\n');
  document.head.appendChild(css);

  function itemOf(id) { return $('sb-' + id); }
  function visible(el) { return el && el.style.display !== 'none'; }
  function label(id) { var el = itemOf(id), l = el && el.querySelector('.sb-item-label'); return l ? l.textContent.trim() : id; }

  /* ---------- 侧栏重排 ---------- */
  function organize() {
    var aside = $('sidebar'), foot = aside && aside.querySelector('.sb-footer'); if (!aside || !foot) return;
    var L = lang(), placed = {};
    G.forEach(function (g) {
      var h = $('nv-sec-' + g.k);
      if (!h) { h = document.createElement('div'); h.className = 'sb-section nv-sec'; h.id = 'nv-sec-' + g.k; }
      h.textContent = g.n[L];
      aside.insertBefore(h, foot);
      var any = false;
      g.items.forEach(function (id) { var el = itemOf(id); if (!el) return; aside.insertBefore(el, foot); placed[el.id] = 1; if (visible(el)) any = true; });
      if (g.k === 'sys') aside.querySelectorAll('.sb-item').forEach(function (el) { if (!placed[el.id] && el.id !== 'sb-home') { aside.insertBefore(el, foot); if (visible(el)) any = true; } });
      h.style.display = any ? '' : 'none';
    });
    var home = $('sb-home'), first = $('nv-sec-ov'); if (home && first) aside.insertBefore(home, first);
  }

  /* ---------- 首页功能目录 ---------- */
  function homeDir() {
    var tiles = document.querySelector('#panel-home .shk-tiles'); if (!tiles) return;
    var box = $('nv-home');
    if (!box) { box = document.createElement('div'); box.id = 'nv-home'; tiles.parentNode.insertBefore(box, tiles.nextSibling); }
    var L = lang();
    var head = { zh: ['全部功能', '按用途分组，点名称直接进入'], ko: ['전체 기능', '용도별로 묶었습니다. 이름을 누르면 바로 이동'], en: ['All features', 'Grouped by purpose — click a name to open it'] }[L];
    box.innerHTML = '<div class="nv-head"><h3>' + head[0] + '</h3><span>' + head[1] + '</span></div><div class="nv-grid">' +
      G.filter(function (g) { return g.k !== 'sys'; }).map(function (g) {
        var its = g.items.filter(function (id) { var el = itemOf(id); return el && visible(el); });
        if (!its.length && !g.ext) return '';
        return '<div class="nv-card"><h4><i>' + g.ic + '</i>' + esc(g.n[L]) + '</h4><p>' + esc(g.d[L]) + '</p><div class="nv-list">' +
          its.map(function (id) { return '<div class="nv-it" data-go="' + id + '"><span>' + (IC[id] || '•') + '</span>' + esc(label(id)) + '</div>'; }).join('') + '</div>' +
          (g.ext ? '<div class="nv-ext">' + g.ext.map(function (x) { return '<a href="' + x[0] + '" target="_blank" rel="noopener">' + esc(x[1][L]) + ' ↗</a>'; }).join('') + '</div>' : '') + '</div>';
      }).join('') + '</div>';
    box.querySelectorAll('[data-go]').forEach(function (d) { d.onclick = function () { window.showPanel(d.dataset.go); }; });
  }

  var sig = '';
  function tick() {
    var aside = $('sidebar'); if (!aside) return;
    var s = lang() + '|' + Array.prototype.map.call(aside.querySelectorAll('.sb-item'), function (e) { return e.id + (visible(e) ? '' : '-'); }).join(',');
    if (s !== sig) { sig = s; organize(); homeDir(); }
    else if ($('panel-home') && !$('nv-home')) homeDir();
  }
  function boot() {
    tick(); setInterval(tick, 800);
    ['app-btn-zh', 'app-btn-ko', 'app-btn-en', 'btn-zh', 'btn-ko', 'btn-en'].forEach(function (id) { var e = $(id); if (e) new MutationObserver(function () { setTimeout(function () { sig = ''; tick(); }, 60); }).observe(e, { attributes: true, attributeFilter: ['class'] }); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 50); }); else setTimeout(boot, 50);
})();
