/* SHine-K 3.0 · 平台布局整理
 * 顶栏：菜单 + 标志 + 大搜索框 + 现场监测 + 通知 + 头像菜单（原来的小按钮都收进头像菜单）
 * 侧栏：首页置顶，可收起为图标栏
 * 首页：横幅（真实现场监测）+ 四张磁贴卡片 + 分类筛选 + 功能卡片网格（标明“实测 / 演示数据”）
 * 不改变原有功能、登录与权限逻辑。 */
(function () {
  'use strict';
  var STR = {
    zh: {
      home: '首页', live: '现场监测', search: '搜索功能或工人姓名…', menu_lang: '语言', menu_a11y: '字号 / 主题 / 声音',
      menu_mode: '数据模式', menu_brochure: '宣传册 PDF', menu_landing: '返回介绍页', menu_logout: '退出登录', user: 'SHine-K 用户',
      hero_tag: '实测 · 视频不上传', hero_t: '真实现场监测', hero_d: '电脑摄像头 AI 识别安全帽、背心、跌倒和 SOS；连接蓝牙心率带、EmoConnect 手表和警示灯，现场立即发出警报和语音。监控端只接收骨架和数字。',
      hero_b1: '▶ 打开现场端', hero_b2: '打开监控端', hero_now: '现场端状态',
      hero_li: ['摔倒 5 秒内站起：只记录', '5 秒未起：语音询问，请举手', '12 秒无回应：红色警报'],
      t_today: '今日概况', t_alerts: '最新警报', t_workers: '工人管理', t_tools: '工具与报表', more: '查看全部 →',
      k1: '全部工人', k2: '安全状态', k3: '老龄 55+', k4: '警报', no_alert: '暂无警报',
      chips: { all: '全部', real: '实测', watch: '监控', people: '工人', manage: '管理' },
      sec: '全部功能', sec_d: '点击卡片进入', real: '实测', demo: '演示数据',
      cards: {
        live: ['现场端：摄像头 AI + 设备', '安全帽 · 背心 · 跌倒 · SOS · 心率'], center: ['监控端：骨架数字孪生', '确认 · 举手确认 · 广播'],
        overview: ['数据仪表盘', '工人状态 · 风险趋势 · PPE'], monitor: ['实时生命体征', '心率 · 血氧 · 体温 · 疲劳'], camera: ['AI 视频分析', '区域画面 · PPE · 危险行为'],
        iot: ['IoT 传感器', '可穿戴设备 · 环境传感器'], alerts: ['警报中心', '送达 · 升级 · 一线隐患快报'], register: ['工人注册', '表单 · QR 码 · NFC'],
        elderly: ['老龄工人', '骨骼 · 热应激 · 反应时间'], checklist: ['巡检清单', '每日检查 · 离线填写'], briefing: ['安全须知推送', '多语言 · 语音播报'],
        ai: ['AI 预测', '历史 + 生命体征 + 环境'], reports: ['报表导出', 'CSV · 打印'], settings: ['设置 / 管理', '阈值 · 通道 · 数据源'], audit: ['审计日志', '谁 · 何时 · 做了什么']
      }
    },
    ko: {
      home: '홈', live: '현장 모니터링', search: '기능 또는 근로자 이름 검색…', menu_lang: '언어', menu_a11y: '글자 / 테마 / 소리',
      menu_mode: '데이터 모드', menu_brochure: '브로슈어 PDF', menu_landing: '소개 페이지', menu_logout: '로그아웃', user: 'SHine-K 사용자',
      hero_tag: '실측 · 영상 미전송', hero_t: '실제 현장 모니터링', hero_d: '카메라 AI가 안전모·조끼·넘어짐·SOS를 인식하고, 블루투스 심박 밴드·EmoConnect 워치·경광등과 연결해 현장에서 바로 경보와 음성을 냅니다. 관제는 골격과 숫자만 받습니다.',
      hero_b1: '▶ 현장 화면 열기', hero_b2: '관제 화면 열기', hero_now: '현장 상태',
      hero_li: ['넘어진 뒤 5초 안에 일어남: 기록만', '5초 지나도 그대로: 음성 확인, 손 들기', '12초 무응답: 빨간 경보'],
      t_today: '오늘 현황', t_alerts: '최근 경보', t_workers: '근로자 관리', t_tools: '도구·보고서', more: '모두 보기 →',
      k1: '전체 근로자', k2: '안전 상태', k3: '고령 55+', k4: '경보', no_alert: '경보 없음',
      chips: { all: '전체', real: '실측', watch: '모니터링', people: '근로자', manage: '관리' },
      sec: '전체 기능', sec_d: '카드를 눌러 이동', real: '실측', demo: '시연 데이터',
      cards: {
        live: ['현장: 카메라 AI + 장치', '안전모 · 조끼 · 넘어짐 · SOS · 심박'], center: ['관제: 골격 디지털 트윈', '확인 · 손 들기 요청 · 방송'],
        overview: ['데이터 대시보드', '근로자 상태 · 위험 추세 · PPE'], monitor: ['실시간 생체신호', '심박 · 산소 · 체온 · 피로'], camera: ['AI 영상 분석', '구역 화면 · PPE · 위험 행동'],
        iot: ['IoT 센서', '웨어러블 · 환경 센서'], alerts: ['경보 센터', '전달 · 상향 · 위험 제보'], register: ['근로자 등록', '양식 · QR · NFC'],
        elderly: ['고령 근로자', '근골격 · 열스트레스 · 반응시간'], checklist: ['점검표', '일일 점검 · 오프라인'], briefing: ['안전 공지', '다국어 · 음성'],
        ai: ['AI 예측', '이력 + 생체 + 환경'], reports: ['보고서 내보내기', 'CSV · 인쇄'], settings: ['설정 / 관리', '임계값 · 채널 · 데이터'], audit: ['감사 로그', '누가 · 언제 · 무엇을']
      }
    },
    en: {
      home: 'Home', live: 'Live monitoring', search: 'Search features or worker names…', menu_lang: 'Language', menu_a11y: 'Text / theme / sound',
      menu_mode: 'Data mode', menu_brochure: 'Brochure PDF', menu_landing: 'Intro page', menu_logout: 'Sign out', user: 'SHine-K user',
      hero_tag: 'Real · no video upload', hero_t: 'Real field monitoring', hero_d: 'Camera AI detects helmets, vests, falls and SOS; Bluetooth HR straps, the EmoConnect watch and a beacon trigger alarms and voice on site. The center receives only skeletons and numbers.',
      hero_b1: '▶ Open field page', hero_b2: 'Open center page', hero_now: 'Field status',
      hero_li: ['Up within 5 s after a fall: logged only', 'Still down after 5 s: voice check, raise a hand', 'No reply in 12 s: red alarm'],
      t_today: 'Today', t_alerts: 'Latest alerts', t_workers: 'Workers', t_tools: 'Tools & reports', more: 'See all →',
      k1: 'Workers', k2: 'Safe', k3: 'Aged 55+', k4: 'Alerts', no_alert: 'No alerts',
      chips: { all: 'All', real: 'Real', watch: 'Monitoring', people: 'Workers', manage: 'Admin' },
      sec: 'All features', sec_d: 'Click a card to open', real: 'REAL', demo: 'Demo data',
      cards: {
        live: ['Field: camera AI + devices', 'Helmet · vest · fall · SOS · HR'], center: ['Center: skeleton twin', 'Acknowledge · ask · broadcast'],
        overview: ['Data dashboard', 'Status · risk trend · PPE'], monitor: ['Live vitals', 'HR · SpO2 · temp · fatigue'], camera: ['AI video analysis', 'Zones · PPE · unsafe acts'],
        iot: ['IoT sensors', 'Wearables · environment'], alerts: ['Alert center', 'Delivery · escalation · reports'], register: ['Register workers', 'Form · QR · NFC'],
        elderly: ['Older workers', 'MSK · heat stress · reaction'], checklist: ['Checklist', 'Daily checks · offline'], briefing: ['Safety briefing', 'Multilingual · voice'],
        ai: ['AI prediction', 'History + vitals + environment'], reports: ['Reports', 'CSV · print'], settings: ['Settings', 'Thresholds · channels · sources'], audit: ['Audit log', 'Who · when · what']
      }
    }
  };
  // 卡片：[id, 图标, 背景, 分类, 是否实测, 外部链接]
  var CARDS = [
    ['live', '🎥', 'linear-gradient(135deg,#0A1E4A,#0F62FE)', 'real', 1, 'live.html'],
    ['center', '🛰', 'linear-gradient(135deg,#0B3B5C,#00B4D8)', 'real', 1, 'center.html'],
    ['overview', '📊', 'linear-gradient(135deg,#E9F0FF,#C9DAFF)', 'watch', 0],
    ['monitor', '❤️', 'linear-gradient(135deg,#FFE8EC,#FFC7D1)', 'watch', 0],
    ['camera', '📹', 'linear-gradient(135deg,#E0F7FC,#B4ECF7)', 'watch', 0],
    ['alerts', '🚨', 'linear-gradient(135deg,#FFF1E0,#FFD9A8)', 'watch', 0],
    ['iot', '⌚', 'linear-gradient(135deg,#EEF0FF,#D5D9FF)', 'watch', 0],
    ['register', '🪪', 'linear-gradient(135deg,#E0FAF3,#B5F0DE)', 'people', 0],
    ['elderly', '👴', 'linear-gradient(135deg,#F3EFFE,#DED2FC)', 'people', 0],
    ['checklist', '✅', 'linear-gradient(135deg,#EAF7E6,#C9EBBF)', 'people', 0],
    ['briefing', '📢', 'linear-gradient(135deg,#FFF6D6,#FFE79A)', 'people', 0],
    ['ai', '🔮', 'linear-gradient(135deg,#ECEFF5,#D3DAE6)', 'manage', 0],
    ['reports', '🧾', 'linear-gradient(135deg,#F1F4F8,#DCE3EC)', 'manage', 0],
    ['settings', '⚙️', 'linear-gradient(135deg,#F1F4F8,#DCE3EC)', 'manage', 0],
    ['audit', '📜', 'linear-gradient(135deg,#F1F4F8,#DCE3EC)', 'manage', 0]
  ];
  var chip = 'all';
  function L() {
    var on = function (id) { var e = document.getElementById(id); return e && e.classList.contains('on'); };
    if (on('app-btn-ko') || on('btn-ko')) return 'ko'; if (on('app-btn-en') || on('btn-en')) return 'en'; return 'zh';
  }
  function S() { return STR[L()]; }
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function allowed(id) { var sb = $('sb-' + id); return !sb || sb.style.display !== 'none'; }

  /* ---------- 顶栏 ---------- */
  function buildTopbar() {
    var bar = document.querySelector('#app .topbar-app'); if (!bar || bar.dataset.shk) return;
    bar.dataset.shk = '1';
    var ham = bar.querySelector('.hamburger');
    ham.onclick = function (e) {
      e.preventDefault();
      if (innerWidth > 768) { document.body.classList.toggle('shk-mini'); try { localStorage.setItem('shk3_mini', document.body.classList.contains('shk-mini') ? '1' : ''); } catch (x) {} }
      else if (window.toggleSidebar) window.toggleSidebar();
    };
    var brand = document.createElement('div'); brand.className = 'shk-brand';
    brand.innerHTML = '<i>SK</i><span>SHine-K<small>3.0</small></span>';
    brand.onclick = function () { window.showPanel('home'); };
    ham.after(brand);
    // 搜索按钮
    var sr = bar.querySelector('.topbar-search'), inp = $('global-search');
    if (sr && !sr.querySelector('.shk-search-btn')) {
      var sb = document.createElement('button'); sb.className = 'shk-search-btn'; sb.title = 'Search';
      sb.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
      sb.onclick = function () { doSearch(inp.value); };
      sr.appendChild(sb);
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') doSearch(inp.value); });
    }
    // 手机：搜索图标，点开后搜索框铺满顶栏
    var ms = document.createElement('button'); ms.className = 'shk-msearch'; ms.title = 'Search';
    ms.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
    ms.onclick = function (e) { e.stopPropagation(); document.body.classList.add('shk-search-open'); inp && inp.focus(); };
    sr.after(ms);
    inp && inp.addEventListener('blur', function () { setTimeout(function () { document.body.classList.remove('shk-search-open'); }, 150); });
    // 右侧：现场监测 + 头像菜单
    var acts = bar.querySelector('.topbar-actions');
    var live = document.createElement('a'); live.className = 'shk-live-btn'; live.href = 'live.html'; live.target = '_blank';
    live.innerHTML = '<b></b><span data-s="live"></span>';
    acts.insertBefore(live, acts.firstChild);
    var av = document.createElement('div'); av.className = 'shk-avatar'; av.id = 'shk-avatar'; av.textContent = 'SK';
    av.innerHTML = 'SK<div class="shk-menu" id="shk-menu"></div>';
    acts.appendChild(av);
    av.addEventListener('click', function (e) { if (e.target === av) { $('shk-menu').classList.toggle('open'); buildMenu(); } });
    document.addEventListener('click', function (e) { if (!av.contains(e.target)) $('shk-menu').classList.remove('open'); });
  }

  function buildMenu() {
    var m = $('shk-menu'), s = S(); if (!m) return;
    var acts = document.querySelector('#app .topbar-actions');
    if (!m.dataset.built) {
      m.dataset.built = '1';
      m.innerHTML = '<div class="mh"><b data-s="user"></b><span id="shk-role"></span></div>' +
        '<div class="row"><span class="lbl" data-s="menu_lang"></span><span class="slot" id="shk-slot-lang"></span></div>' +
        '<div class="row"><span class="lbl" data-s="menu_a11y"></span><span class="slot" id="shk-slot-a11y"></span></div>' +
        '<div class="row"><span class="lbl" data-s="menu_mode"></span><span class="slot" id="shk-slot-mode"></span></div><hr>' +
        '<div class="row click" id="shk-m-bro">📄 <span data-s="menu_brochure"></span></div>' +
        '<div class="row click" id="shk-m-land">🏠 <span data-s="menu_landing"></span></div>' +
        '<div class="row click" id="shk-m-out">⎋ <span data-s="menu_logout"></span></div>';
      var mv = function (sel, slot) { var n = acts.querySelector(sel); if (n) $(slot).appendChild(n); };
      mv('.topbar-lang', 'shk-slot-lang'); mv('.ent-a11y', 'shk-slot-a11y'); mv('#ent-health', 'shk-slot-mode');
      $('shk-m-bro').onclick = function () { window.open('brochure.pdf', '_blank'); };
      $('shk-m-land').onclick = function () { window.showLanding && window.showLanding(); };
      $('shk-m-out').onclick = function () { window.ENT_logout ? window.ENT_logout() : location.reload(); };
      m.querySelectorAll('.topbar-lang button').forEach(function (b) { b.addEventListener('click', function () { setTimeout(relabel, 60); }); });
    }
    var pill = $('ent-role-pill'); $('shk-role').textContent = pill ? pill.textContent : '';
    relabel();
  }

  function doSearch(q) {
    q = String(q || '').trim().toLowerCase(); if (!q) return;
    var s = S(), hit = null;
    Object.keys(STR).forEach(function (l) {
      Object.keys(STR[l].cards).forEach(function (id) { if (!hit && (STR[l].cards[id][0] + ' ' + STR[l].cards[id][1]).toLowerCase().indexOf(q) >= 0) hit = id; });
    });
    if (hit === 'live' || hit === 'center') { window.open(hit + '.html', '_blank'); return; }
    if (hit) { window.showPanel(hit); return; }
    // 否则当作工人姓名，在实时监控里筛选
    window.showPanel('monitor');
    var ws = $('ws'); if (ws) { ws.value = q; ws.dispatchEvent(new Event('input', { bubbles: true })); ws.dispatchEvent(new Event('keyup', { bubbles: true })); }
  }

  /* ---------- 侧栏 ---------- */
  function buildSidebar() {
    var aside = $('sidebar'); if (!aside || $('sb-home')) return;
    var first = aside.querySelector('.sb-section');
    var mk = function (id, icon, key, href) {
      var d = document.createElement('div'); d.className = 'sb-item'; d.id = id;
      d.innerHTML = icon + '<span class="sb-item-label" data-s="' + key + '"></span>' + (href ? '<span class="shk-ext">↗</span>' : '');
      d.onclick = href ? function () { window.open(href, '_blank'); } : function () { window.showPanel('home'); };
      return d;
    };
    var home = mk('sb-home', '<svg viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z"/></svg>', 'home');
    var live = mk('shk-sb-live', '<svg viewBox="0 0 24 24"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>', 'live', 'live.html');
    aside.insertBefore(home, first); aside.insertBefore(live, first);
    // 侧栏底部：不显示个人姓名
    var info = aside.querySelector('.sb-user-info'), role = aside.querySelector('.sb-user-role'), avt = aside.querySelector('.sb-avatar');
    if (avt) avt.textContent = 'SK';
    if (info && info.firstChild && info.firstChild.nodeType === 3) info.firstChild.textContent = S().user + ' ';
    if (role) role.textContent = 'SHine-K 3.0';
    try { if (localStorage.getItem('shk3_mini')) document.body.classList.add('shk-mini'); } catch (x) {}
  }

  /* ---------- 首页 ---------- */
  function buildHome() {
    var pc = $('pageContent'); if (!pc || $('panel-home')) return;
    var p = document.createElement('div'); p.className = 'panel'; p.id = 'panel-home';
    p.innerHTML = '<div class="home-wrap">' +
      '<div class="shk-hero"><div style="position:relative;z-index:1"><div class="tag"><b></b><span data-s="hero_tag"></span></div>' +
      '<h2 data-s="hero_t"></h2><p data-s="hero_d"></p><div class="btns"><a class="p" href="live.html" target="_blank" data-s="hero_b1"></a><a class="s" href="center.html" target="_blank" data-s="hero_b2"></a></div></div>' +
      '<div class="live"><h4 data-s="hero_now"></h4><div data-shk3-live></div><ul id="shk-hero-li"></ul></div></div>' +
      '<div class="shk-tiles">' +
        '<div class="shk-tile"><h3 data-s="t_today"></h3><div class="q" id="shk-q-today"></div><div class="more" data-go="overview" data-s="more"></div></div>' +
        '<div class="shk-tile"><h3 data-s="t_alerts"></h3><div class="lst" id="shk-q-alerts"></div><div class="more" data-go="alerts" data-s="more"></div></div>' +
        '<div class="shk-tile"><h3 data-s="t_workers"></h3><div class="q" id="shk-q-workers"></div></div>' +
        '<div class="shk-tile"><h3 data-s="t_tools"></h3><div class="q" id="shk-q-tools"></div></div>' +
      '</div>' +
      '<div class="shk-chips" id="shk-chips"></div>' +
      '<div class="shk-sec"><h3 data-s="sec"></h3><span data-s="sec_d"></span></div>' +
      '<div class="shk-grid" id="shk-grid"></div></div>';
    pc.insertBefore(p, pc.firstChild);
    p.querySelectorAll('[data-go]').forEach(function (a) { a.onclick = function () { window.showPanel(a.dataset.go); }; });
  }

  function quad(box, items) {
    var s = S();
    box.innerHTML = items.filter(function (it) { return allowed(it[0]); }).map(function (it) {
      return '<div data-go="' + it[0] + '">' + (it[2] != null ? '<b>' + esc(it[2]) + '</b>' : '<span class="ic">' + it[1] + '</span>') + '<span>' + esc(it[3] || s.cards[it[0]][0]) + '</span></div>';
    }).join('');
    box.querySelectorAll('[data-go]').forEach(function (d) { d.onclick = function () { window.showPanel(d.dataset.go); }; });
  }

  function renderHome() {
    var s = S(); if (!$('panel-home')) return;
    relabel();
    $('shk-hero-li').innerHTML = s.hero_li.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
    var kv = function (id) { var e = $(id); return e ? e.textContent.trim() : '—'; };
    quad($('shk-q-today'), [['overview', '', kv('km1'), s.k1], ['monitor', '', kv('km2'), s.k2], ['elderly', '', kv('km3'), s.k3], ['alerts', '', kv('km4'), s.k4]]);
    quad($('shk-q-workers'), [['register', '🪪'], ['monitor', '❤️'], ['elderly', '👴'], ['checklist', '✅']]);
    quad($('shk-q-tools'), [['briefing', '📢'], ['ai', '🔮'], ['reports', '🧾'], ['settings', '⚙️']]);
    var al = [];
    try { al = JSON.parse(localStorage.getItem('shk_alerts') || '[]'); } catch (e) {}
    $('shk-q-alerts').innerHTML = al.length ? al.slice(0, 4).map(function (a) {
      return '<div><i class="' + (a.level === 'danger' ? 'd' : '') + '"></i><span>' + esc(a.title) + '<small>' + esc(a.zone || '') + ' · ' + new Date(a.ts).toLocaleTimeString() + '</small></span></div>';
    }).join('') : '<div style="color:var(--ink4)">' + s.no_alert + '</div>';
    // 分类筛选
    $('shk-chips').innerHTML = Object.keys(s.chips).map(function (k) { return '<button data-c="' + k + '" class="' + (k === chip ? 'on' : '') + '">' + s.chips[k] + '</button>'; }).join('');
    $('shk-chips').querySelectorAll('button').forEach(function (b) { b.onclick = function () { chip = b.dataset.c; renderHome(); }; });
    // 卡片网格
    $('shk-grid').innerHTML = CARDS.filter(function (c) { return c[5] || allowed(c[0]); }).map(function (c) {
      var t = s.cards[c[0]], show = chip === 'all' || chip === c[3];
      return '<div class="shk-card' + (show ? '' : ' hide') + '" data-id="' + c[0] + '"><div class="th" style="background:' + c[2] + '">' +
        '<span class="ic">' + c[1] + '</span>' + (c[5] ? '<span class="tl">↗ ' + c[5] + '</span>' : '') +
        '<span class="bd' + (c[4] ? ' real' : '') + '">' + (c[4] ? '● ' + s.real : s.demo) + '</span></div>' +
        '<div class="meta"><div class="av">' + c[1] + '</div><div><b>' + esc(t[0]) + '</b><span>' + esc(t[1]) + '</span></div></div></div>';
    }).join('');
    $('shk-grid').querySelectorAll('.shk-card').forEach(function (d) {
      var c = CARDS.find(function (x) { return x[0] === d.dataset.id; });
      d.onclick = function () { if (c[5]) window.open(c[5], '_blank'); else window.showPanel(c[0]); };
    });
  }

  function relabel() {
    var s = S();
    document.querySelectorAll('[data-s]').forEach(function (e) { if (s[e.dataset.s] != null) e.textContent = s[e.dataset.s]; });
    var inp = $('global-search'); if (inp) inp.placeholder = s.search;
    var info = document.querySelector('#sidebar .sb-user-info'); if (info && info.firstChild && info.firstChild.nodeType === 3) info.firstChild.textContent = s.user + ' ';
  }

  /* ---------- showPanel：加入“首页”，并始终保持在最外层 ---------- */
  var inner = null, lastUserClick = 0, pendingEnter = null;
  /* 打开网站时先不弹登录框（见 CSS），点“进入平台”时才登录 */
  function checkPending() {
    if (pendingEnter && !$('ent-login') && !$('ent-consent')) { var p = pendingEnter; pendingEnter = null; window.enterApp(p); }
  }
  function myShow(id) {
    // 登录后系统自动打开的“总览”改为首页；用户自己点击的照常打开
    if (id === 'overview' && Date.now() - lastUserClick > 400) id = 'home';
    if (id === 'home') {
      document.querySelectorAll('.panel').forEach(function (p) { p.classList.remove('active'); });
      document.querySelectorAll('.sb-item').forEach(function (x) { x.classList.remove('active'); });
      var p = $('panel-home'); if (p) p.classList.add('active');
      var sb = $('sb-home'); if (sb) sb.classList.add('active');
      renderHome();
      var pc = $('pageContent'); if (pc) pc.scrollTop = 0;
      return;
    }
    if (inner) inner(id);
  }
  function wrapShow() {
    if (typeof window.showPanel === 'function' && window.showPanel !== myShow) { inner = window.showPanel; window.showPanel = myShow; }
    if (typeof window.enterApp === 'function' && !window.enterApp.__shk) {
      var oe = window.enterApp;
      window.enterApp = function (panel) {
        // 还没登录：先显示登录框，登录（和同意）完成后再自动进入
        var lg = $('ent-login');
        if (lg) { document.body.classList.add('shk-login'); pendingEnter = panel || 'home'; return; }
        oe(panel); setup(); window.showPanel(panel && panel !== 'overview' ? panel : 'home');
      };
      window.enterApp.__shk = true;
    }
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('#sidebar,#pageContent,.topbar-app')) lastUserClick = Date.now();
  }, true);

  function isHome() { var p = $('panel-home'); return !!(p && p.classList.contains('active')); }

  function setup() {
    if (!$('app')) return;
    buildTopbar(); buildSidebar(); buildHome(); wrapShow(); relabel();
  }

  function boot() {
    setup();
    ['app-btn-zh', 'app-btn-ko', 'app-btn-en'].forEach(function (id) { var e = $(id); if (e) e.addEventListener('click', function () { setTimeout(function () { relabel(); if (isHome()) renderHome(); }, 80); }); });
    setInterval(function () { if (isHome()) renderHome(); }, 4000);
    var shown = false;
    setInterval(function () {
      wrapShow(); checkPending();
      var vis = $('app') && getComputedStyle($('app')).display !== 'none';
      if (vis) {
        setup();
        // 进入控制台（包括登录后直接显示）时，第一次默认显示首页
        if (!shown) { shown = true; var a = document.querySelector('#pageContent > .panel.active'); if (!a || a.id === 'panel-overview') window.showPanel('home'); }
      } else shown = false;
    }, 300);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 300); });
  else setTimeout(boot, 300);
})();
