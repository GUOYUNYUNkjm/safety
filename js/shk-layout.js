/* SHine-K 3.0 · 平台布局整理
 * 顶栏：菜单 + 标志 + 大搜索框 + 现场监测 + 通知 + 头像菜单（原来的小按钮都收进头像菜单）
 * 侧栏：首页置顶，可收起为图标栏
 * 首页：横幅（真实现场监测）+ 四张磁贴卡片 + 分类筛选 + 功能卡片网格（标明“实测 / 演示数据”）
 * 不改变原有功能、登录与权限逻辑。 */
(function () {
  'use strict';
  var STR = {
    zh: {
      home: '首页',
      ov_bc: '总览仪表盘', ov_base: '基准 · 每 1.2 秒更新', refresh: '刷新', more2: '更多', al_board: '实时警报现况', c_no: '编号', c_type: '分类', c_msg: '内容', c_zone: '区域', c_time: '时间', c_status: '状态', s_pending: '处理中', s_acked: '已确认', s_escalated: '已上报', lv_danger: '危险', lv_warn: '警告', quick: '快捷菜单', u_person: '名', u_case: '件', wd: ['日','一','二','三','四','五','六'], cmp_t: '教育 · 体检到期',
      mon_real: '现场实测工人', mon_real_d: '来自现场端：摄像头识别到的人 + 蓝牙心率设备。佩戴者在现场端的设备卡片里选择。', mon_demo: '演示数据（模拟工人：心率·血氧·体温·疲劳为随机生成）', mon_none: '现场端未运行或没有识别到人。', c_worker: '工人', c_state: '状态', c_hr: '心率', c_dev: '设备', c_ppe: '安全帽 / 背心', notin: '不在画面中', iot_demo2: '演示数据（环境传感器：温度 · CO · 粉尘，模拟）',
      cam_people: '画面中的工人（实测）', cam_alerts: '实时警报（实测）', cam_none: '现场端未运行或画面中没有人。', cam_noal: '暂无警报', cam_demo: '演示数据（模拟画面，不是真实摄像头）', helmet: '安全帽', vest: '背心', y: '已戴', n: '未戴', u: '无法确认', st: { normal: '正常', suspect: '疑似跌倒', ask: '等待回应', danger: '无回应·危险', sos: 'SOS' }, nopose: '只检查安全帽/背心',
      iot_real: '真实设备（实测）', iot_real_d: '蓝牙设备只能连在开着摄像头的现场电脑上。请在现场端点“＋ 蓝牙心率带 / ＋ EmoConnect 手表”，连上后这里每秒更新。', iot_go: '去现场端连接设备 ↗', iot_none: '还没有连接真实设备。', iot_demo: '演示数据（模拟设备，数值随机生成）', iot_wearer: '佩戴者', iot_battery: '电量', iot_motion: '手腕活动', iot_off: '已断开', iot_nosig: '无信号',
      live: '现场监测', search: '搜索功能或工人姓名…', menu_lang: '语言', menu_a11y: '字号 / 主题 / 声音',
      menu_mode: '数据模式', menu_brochure: '宣传册 PDF', menu_landing: '返回介绍页', menu_logout: '退出登录', user: 'SHine-K 用户',
      hero_tag: '实测 · 视频不上传', hero_t: '真实现场监测', hero_d: '电脑摄像头 AI 识别安全帽、背心、跌倒和 SOS；连接蓝牙心率带、EmoConnect 手表和警示灯，现场立即发出警报和语音。监控端只接收骨架和数字。',
      hero_b1: '▶ 打开现场端', hero_b2: '打开监控端', hero_b3: '⧉ 分屏演示', hero_now: '现场端状态',
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
      home: '홈',
      ov_bc: '메인 대시보드', ov_base: '기준 · 1.2초마다 갱신', refresh: '새로고침', more2: '더보기', al_board: '실시간 경보 현황', c_no: '번호', c_type: '구분', c_msg: '내용', c_zone: '구역', c_time: '시간', c_status: '상태', s_pending: '처리중', s_acked: '확인', s_escalated: '상향보고', lv_danger: '위험', lv_warn: '경고', quick: '바로가기', u_person: '명', u_case: '건', wd: ['일','월','화','수','목','금','토'], cmp_t: '교육 · 검진 만료',
      mon_real: '현장 실측 작업자', mon_real_d: '현장 화면에서: 카메라가 인식한 사람 + 블루투스 심박 장치. 착용자는 현장 화면의 장치 카드에서 고릅니다.', mon_demo: '시연 데이터 (모의 작업자: 심박·산소·체온·피로는 무작위)', mon_none: '현장 화면이 꺼져 있거나 사람이 없습니다.', c_worker: '작업자', c_state: '상태', c_hr: '심박', c_dev: '장치', c_ppe: '안전모 / 조끼', notin: '화면 밖', iot_demo2: '시연 데이터 (환경 센서: 온도 · CO · 분진, 모의)',
      cam_people: '화면 속 작업자 (실측)', cam_alerts: '실시간 경보 (실측)', cam_none: '현장 화면이 꺼져 있거나 화면에 사람이 없습니다.', cam_noal: '경보 없음', cam_demo: '시연 데이터 (모의 화면, 실제 카메라 아님)', helmet: '안전모', vest: '조끼', y: '착용', n: '미착용', u: '확인 불가', st: { normal: '정상', suspect: '넘어짐 의심', ask: '응답 대기', danger: '무응답·위험', sos: 'SOS' }, nopose: '안전모·조끼만 검사',
      iot_real: '실제 장치 (실측)', iot_real_d: '블루투스 장치는 카메라가 켜진 현장 컴퓨터에서만 연결됩니다. 현장 화면에서 “＋ 블루투스 심박 밴드 / ＋ EmoConnect 워치”를 누르면 여기서 1초마다 갱신됩니다.', iot_go: '현장 화면에서 연결 ↗', iot_none: '아직 연결된 실제 장치가 없습니다.', iot_demo: '시연 데이터 (모의 장치, 무작위 값)', iot_wearer: '착용자', iot_battery: '배터리', iot_motion: '손목 움직임', iot_off: '연결 끊김', iot_nosig: '신호 없음',
      live: '현장 모니터링', search: '기능 또는 근로자 이름 검색…', menu_lang: '언어', menu_a11y: '글자 / 테마 / 소리',
      menu_mode: '데이터 모드', menu_brochure: '브로슈어 PDF', menu_landing: '소개 페이지', menu_logout: '로그아웃', user: 'SHine-K 사용자',
      hero_tag: '실측 · 영상 미전송', hero_t: '실제 현장 모니터링', hero_d: '카메라 AI가 안전모·조끼·넘어짐·SOS를 인식하고, 블루투스 심박 밴드·EmoConnect 워치·경광등과 연결해 현장에서 바로 경보와 음성을 냅니다. 관제는 골격과 숫자만 받습니다.',
      hero_b1: '▶ 현장 화면 열기', hero_b2: '관제 화면 열기', hero_b3: '⧉ 분할 화면', hero_now: '현장 상태',
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
      home: 'Home',
      ov_bc: 'Dashboard', ov_base: 'as of · updates every 1.2 s', refresh: 'Refresh', more2: 'More', al_board: 'Live alert board', c_no: 'No.', c_type: 'Type', c_msg: 'Details', c_zone: 'Zone', c_time: 'Time', c_status: 'Status', s_pending: 'Open', s_acked: 'Acked', s_escalated: 'Escalated', lv_danger: 'Danger', lv_warn: 'Warning', quick: 'Quick menu', u_person: '', u_case: '', wd: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], cmp_t: 'Training · check-up due',
      mon_real: 'Real workers on site', mon_real_d: 'From the field page: people seen by the camera + Bluetooth HR devices. Pick the wearer on the field page device card.', mon_demo: 'Demo data (simulated workers: HR, SpO2, temperature, fatigue are random)', mon_none: 'Field page not running, or nobody detected.', c_worker: 'Worker', c_state: 'Status', c_hr: 'HR', c_dev: 'Device', c_ppe: 'Helmet / vest', notin: 'not in view', iot_demo2: 'Demo data (environment sensors: temperature · CO · dust, simulated)',
      cam_people: 'Workers in view (real)', cam_alerts: 'Live alerts (real)', cam_none: 'Field page not running, or nobody in view.', cam_noal: 'No alerts', cam_demo: 'Demo data (simulated view, not a real camera)', helmet: 'Helmet', vest: 'Vest', y: 'on', n: 'missing', u: 'unsure', st: { normal: 'normal', suspect: 'possible fall', ask: 'waiting reply', danger: 'no reply · danger', sos: 'SOS' }, nopose: 'helmet/vest only',
      iot_real: 'Real devices', iot_real_d: 'Bluetooth devices connect only on the field computer that runs the camera. On the field page click “＋ Bluetooth HR strap / ＋ EmoConnect watch”; this list then updates every second.', iot_go: 'Connect on the field page ↗', iot_none: 'No real device connected yet.', iot_demo: 'Demo data (simulated devices, random values)', iot_wearer: 'Wearer', iot_battery: 'Battery', iot_motion: 'Wrist motion', iot_off: 'disconnected', iot_nosig: 'no signal',
      live: 'Live monitoring', search: 'Search features or worker names…', menu_lang: 'Language', menu_a11y: 'Text / theme / sound',
      menu_mode: 'Data mode', menu_brochure: 'Brochure PDF', menu_landing: 'Intro page', menu_logout: 'Sign out', user: 'SHine-K user',
      hero_tag: 'Real · no video upload', hero_t: 'Real field monitoring', hero_d: 'Camera AI detects helmets, vests, falls and SOS; Bluetooth HR straps, the EmoConnect watch and a beacon trigger alarms and voice on site. The center receives only skeletons and numbers.',
      hero_b1: '▶ Open field page', hero_b2: 'Open center page', hero_b3: '⧉ Split view', hero_now: 'Field status',
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
    ['overview', '📊', 'linear-gradient(135deg,#E9F0FF,#C9DAFF)', 'watch', 0],
    ['monitor', '❤️', 'linear-gradient(135deg,#FFE8EC,#FFC7D1)', 'watch', 0],
    ['camera', '📹', 'linear-gradient(135deg,#E0F7FC,#B4ECF7)', 'real', 1],
    ['alerts', '🚨', 'linear-gradient(135deg,#FFF1E0,#FFD9A8)', 'watch', 0],
    ['iot', '⌚', 'linear-gradient(135deg,#EEF0FF,#D5D9FF)', 'real', 1],
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
    var md = $('shk-mon-demo'); if (md) md.open = true;
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
    aside.insertBefore(home, first);
    // 侧栏底部：不显示个人姓名
    var info = aside.querySelector('.sb-user-info'), role = aside.querySelector('.sb-user-role'), avt = aside.querySelector('.sb-avatar');
    if (avt) avt.textContent = 'SK';
    if (info && info.firstChild && info.firstChild.nodeType === 3) info.firstChild.textContent = 'SHine-K ';
    if (role) role.textContent = 'SHine-K 3.0';
    try { if (localStorage.getItem('shk3_mini')) document.body.classList.add('shk-mini'); } catch (x) {}
  }

  /* ---------- 首页 ---------- */
  function buildHome() {
    var pc = $('pageContent'); if (!pc || $('panel-home')) return;
    var p = document.createElement('div'); p.className = 'panel'; p.id = 'panel-home';
    p.innerHTML = '<div class="home-wrap">' +
      '<div class="shk-hero"><div style="position:relative;z-index:1"><div class="tag"><b></b><span data-s="hero_tag"></span></div>' +
      '<h2 data-s="hero_t"></h2><p data-s="hero_d"></p><div class="btns"><a class="p" href="live.html" target="_blank" data-s="hero_b1"></a><a class="s" href="center.html" target="_blank" data-s="hero_b2"></a><a class="s" href="split.html" target="_blank" data-s="hero_b3"></a></div></div>' +
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
    var info = document.querySelector('#sidebar .sb-user-info'); if (info && info.firstChild && info.firstChild.nodeType === 3) info.firstChild.textContent = 'SHine-K ';
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

  /* ---------- IoT 页：真实设备在上，模拟设备折叠 ---------- */
  function buildIot() {
    var p = $('panel-iot'); if (!p || $('shk-iot-real')) return;
    var hd = p.querySelector('.mod-hd');
    var real = document.createElement('div'); real.id = 'shk-iot-real';
    real.style.cssText = 'background:#fff;border:2px solid var(--a);border-radius:14px;padding:16px 18px;margin-bottom:16px';
    real.innerHTML = '<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><div style="flex:1;min-width:240px"><div style="font-weight:900;font-size:1rem" data-s="iot_real"></div>' +
      '<div style="font-size:.8rem;color:var(--ink3);margin-top:3px" data-s="iot_real_d"></div></div>' +
      '<a href="live.html" target="_blank" class="shk-live-btn" style="height:40px"><b></b><span data-s="iot_go"></span></a></div>' +
      '<div id="shk-iot-list" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;margin-top:14px"></div>';
    hd.after(real);
    var det = document.createElement('details'); det.id = 'shk-iot-demo';
    det.innerHTML = '<summary style="cursor:pointer;font-weight:800;color:var(--ink3);padding:10px 4px;font-size:.9rem" data-s="iot_demo2"></summary>';
    var nodes = []; for (var n = real.nextSibling; n; n = n.nextSibling) nodes.push(n);
    nodes.forEach(function (n) { det.appendChild(n); });
    p.appendChild(det);
    relabel(); renderIot();
  }
  function renderIot() {
    var box = $('shk-iot-list'); if (!box) return;
    var s = S(), D = window.__shk3Dev || {}, now = Date.now();
    var keys = Object.keys(D).filter(function (k) { return now - D[k].at < 15000; });
    if (!keys.length) { box.innerHTML = '<div style="color:var(--ink4);font-size:.85rem">' + s.iot_none + '</div>'; return; }
    box.innerHTML = keys.map(function (k) {
      var d = D[k].d, stale = now - D[k].at > 4000 || d.conn === false;
      var hr = d.hr != null && !stale ? d.hr + '<small style="font-size:.75rem;color:var(--ink3)"> bpm</small>' : '<small style="font-size:.8rem;color:var(--ink4)">' + (stale ? s.iot_off : s.iot_nosig) + '</small>';
      var x = [];
      if (d.wearer) x.push(s.iot_wearer + ' #' + String(d.wearer).replace('P', ''));
      if (d.battery != null) x.push(s.iot_battery + ' ' + d.battery + '%');
      if (d.motion != null) x.push(s.iot_motion + ' ' + d.motion + '%');
      if (d.hrv != null) x.push('HRV ' + d.hrv + ' ms');
      return '<div style="border:1px solid #E6E9F0;border-left:4px solid ' + (stale ? 'var(--ink4)' : 'var(--g)') + ';border-radius:10px;padding:10px 12px">' +
        '<div style="display:flex;justify-content:space-between;gap:8px"><b style="font-size:.88rem">' + esc(d.name || d.wid) + '</b><span style="font-size:.7rem;font-weight:800;color:#E8133A">● ' + s.real + '</span></div>' +
        '<div style="font-size:.72rem;color:var(--ink4)">' + esc(d.site) + ' · ' + esc(d.wid) + '</div>' +
        '<div style="font-size:1.6rem;font-weight:900;font-family:var(--mono);margin:6px 0 2px">' + hr + '</div>' +
        '<div style="font-size:.75rem;color:var(--ink3)">' + esc(x.join(' · ')) + '</div></div>';
    }).join('');
  }

  /* ---------- AI视频分析页：真实摄像头结果在上，模拟画面折叠 ---------- */
  function buildCam() {
    var card = $('shk3-cam-card'); if (!card || $('shk-cam-real')) return;
    var box = document.createElement('div'); box.id = 'shk-cam-real';
    box.style.cssText = 'flex-basis:100%;display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:14px;margin-top:6px';
    box.innerHTML = '<div><div style="font-weight:800;font-size:.85rem;margin-bottom:6px" data-s="cam_people"></div><div id="shk-cam-people"></div></div>' +
      '<div><div style="font-weight:800;font-size:.85rem;margin-bottom:6px" data-s="cam_alerts"></div><div id="shk-cam-alerts"></div></div>';
    card.appendChild(box);
    var det = document.createElement('details'); det.id = 'shk-cam-demo';
    det.innerHTML = '<summary style="cursor:pointer;font-weight:800;color:var(--ink3);padding:10px 4px;font-size:.9rem" data-s="cam_demo"></summary>';
    var nodes = []; for (var n = card.nextSibling; n; n = n.nextSibling) nodes.push(n);
    nodes.forEach(function (n) { det.appendChild(n); });
    card.parentNode.appendChild(det);
    det.addEventListener('toggle', function () { if (det.open) setTimeout(function () { try { window.initCamera && window.initCamera(); window.dispatchEvent(new Event('resize')); } catch (e) {} }, 50); });
    relabel(); renderCam();
  }
  function renderCam() {
    var pb = $('shk-cam-people'), ab = $('shk-cam-alerts'); if (!pb) return;
    var s = S(), now = Date.now(), sites = window.__shk3Sites || {}, rows = [], als = [];
    Object.keys(sites).forEach(function (k) {
      var x = sites[k]; if (now - x.last > 5000) return;
      (x.list || []).forEach(function (p) { rows.push([k, p]); });
      (x.alerts || []).forEach(function (a) { if (!a.cleared) als.push([k, a]); });
    });
    var tag = function (v) { var c = v === true ? 'var(--g)' : v === false ? 'var(--r)' : 'var(--w)'; return '<b style="color:' + c + '">' + (v === true ? s.y : v === false ? s.n : s.u) + '</b>'; };
    pb.innerHTML = rows.length ? '<table style="width:100%;border-collapse:collapse;font-size:.8rem">' + rows.map(function (r) {
      var p = r[1], st = p.st || 'normal';
      return '<tr style="border-bottom:1px solid #EEF1F6"><td style="padding:5px 4px;font-family:var(--mono);font-weight:800">' + esc(p.id) + '</td><td>' + s.helmet + ' ' + tag(p.helmet) + '</td><td>' + s.vest + ' ' + tag(p.vest) + '</td>' +
        '<td style="color:' + (st === 'normal' ? 'var(--ink3)' : 'var(--r)') + ';font-weight:700">' + (p.po === 'nopose' ? s.nopose : (s.st[st] || st)) + '</td><td style="font-family:var(--mono)">' + (p.hr != null ? '❤ ' + p.hr : '') + '</td></tr>';
    }).join('') + '</table>' : '<div style="color:var(--ink4);font-size:.8rem">' + s.cam_none + '</div>';
    ab.innerHTML = als.length ? als.slice(0, 6).map(function (r) {
      var a = r[1];
      return '<div style="display:flex;gap:8px;font-size:.8rem;padding:4px 0;border-bottom:1px solid #EEF1F6"><i style="width:8px;height:8px;border-radius:50%;margin-top:6px;flex-shrink:0;background:' + (a.level === 'danger' ? 'var(--r)' : 'var(--w)') + '"></i><span>' + esc(a.msg) + '<small style="display:block;color:var(--ink4)">' + esc(r[0]) + ' · ' + new Date(a.at).toLocaleTimeString() + '</small></span></div>';
    }).join('') : '<div style="color:var(--ink4);font-size:.8rem">' + s.cam_noal + '</div>';
  }

  /* ---------- 实时监控页：现场实测工人在上，模拟工人折叠 ---------- */
  function buildMon() {
    var p = $('panel-monitor'); if (!p || $('shk-mon-real')) return;
    var hd = p.querySelector('.mod-hd');
    var real = document.createElement('div'); real.id = 'shk-mon-real';
    real.style.cssText = 'background:#fff;border:2px solid var(--a);border-radius:14px;padding:16px 18px;margin-bottom:16px';
    real.innerHTML = '<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><div style="flex:1;min-width:240px"><div style="font-weight:900;font-size:1rem" data-s="mon_real"></div>' +
      '<div style="font-size:.8rem;color:var(--ink3);margin-top:3px" data-s="mon_real_d"></div></div>' +
      '<a href="live.html" target="_blank" class="shk-live-btn" style="height:40px"><b></b><span data-s="hero_b1"></span></a></div><div id="shk-mon-list" style="margin-top:12px;overflow-x:auto"></div>';
    hd.after(real);
    var det = document.createElement('details'); det.id = 'shk-mon-demo';
    det.innerHTML = '<summary style="cursor:pointer;font-weight:800;color:var(--ink3);padding:10px 4px;font-size:.9rem" data-s="mon_demo"></summary>';
    var nodes = []; for (var n = real.nextSibling; n; n = n.nextSibling) nodes.push(n);
    nodes.forEach(function (n) { det.appendChild(n); });
    p.appendChild(det);
    det.addEventListener('toggle', function () { if (det.open) setTimeout(function () { try { window.renderTable && window.renderTable(); window.initBiometrics && window.initBiometrics(); window.dispatchEvent(new Event('resize')); } catch (e) {} }, 50); });
    relabel(); renderMon();
  }
  function renderMon() {
    var box = $('shk-mon-list'); if (!box) return;
    var s = S(), now = Date.now(), sites = window.__shk3Sites || {}, D = window.__shk3Dev || {}, rows = [], used = {};
    var tag = function (v) { var c = v === true ? 'var(--g)' : v === false ? 'var(--r)' : 'var(--w)'; return '<b style="color:' + c + '">' + (v === true ? s.y : v === false ? s.n : s.u) + '</b>'; };
    var devFor = function (site, wid) { var r = null; Object.keys(D).forEach(function (k) { var d = D[k].d; if (d.site === site && d.wearer === wid && now - D[k].at < 5000) { r = d; used[k] = 1; } }); return r; };
    Object.keys(sites).forEach(function (site) {
      var x = sites[site]; if (now - x.last > 5000) return;
      (x.list || []).forEach(function (p) {
        var d = devFor(site, p.id), st = p.st || 'normal';
        rows.push([site, p.id, '<span style="color:' + (st === 'normal' ? 'var(--ink3)' : 'var(--r)') + ';font-weight:700">' + (p.po === 'nopose' ? s.nopose : (s.st[st] || st)) + '</span>',
          d && d.hr != null ? d.hr : (p.hr != null ? p.hr : '—'), d ? esc(d.name || d.wid) + (d.battery != null ? ' · ' + d.battery + '%' : '') : '—', tag(p.helmet) + ' / ' + tag(p.vest)]);
      });
    });
    Object.keys(D).forEach(function (k) {
      if (used[k] || now - D[k].at > 5000) return; var d = D[k].d;
      rows.push([d.site, esc(d.wid), '<span style="color:var(--ink4)">' + s.notin + '</span>', d.hr != null ? d.hr : '—', esc(d.name || d.wid) + (d.battery != null ? ' · ' + d.battery + '%' : ''), '—']);
    });
    if (!rows.length) { box.innerHTML = '<div style="color:var(--ink4);font-size:.85rem">' + s.mon_none + '</div>'; return; }
    var th = 'style="text-align:left;font-size:.72rem;color:var(--ink4);padding:6px 8px;border-bottom:1px solid #E6E9F0"';
    box.innerHTML = '<table style="width:100%;border-collapse:collapse;font-size:.84rem"><tr><th ' + th + '>' + s.c_worker + '</th><th ' + th + '>' + s.c_state + '</th><th ' + th + '>' + s.c_hr + '</th><th ' + th + '>' + s.c_dev + '</th><th ' + th + '>' + s.c_ppe + '</th></tr>' +
      rows.map(function (r) { return '<tr style="border-bottom:1px solid #EEF1F6"><td style="padding:7px 8px;font-family:var(--mono);font-weight:800">' + r[1] + ' <small style="color:var(--ink4);font-weight:500">' + esc(r[0]) + '</small></td><td style="padding:7px 8px">' + r[2] + '</td><td style="padding:7px 8px;font-family:var(--mono);font-weight:800">' + (r[3] !== '—' ? '❤ ' + r[3] : '—') + '</td><td style="padding:7px 8px">' + r[4] + '</td><td style="padding:7px 8px">' + r[5] + '</td></tr>'; }).join('') + '</table>';
  }

  /* ---------- 总览仪表盘：韩国门户/管理系统常见版式 ----------
   * 标题 + 导航路径 + 基准时间 → 现况要约带（竖线分隔）→ 警报公告板 + 快捷菜单 → 四个小图表 → 到期提醒 + 区域上报 */
  var OV_MORE = { cTime: 'ai', cWorker: 'monitor', cAge: 'elderly', cPPE: 'camera', cZoneHaz: 'alerts' };
  function buildOverview() {
    var p = $('panel-overview'); if (!p || $('shk-ov-board')) return;
    p.classList.add('shk-ov');
    var hd = p.querySelector('.mod-hd');
    var bc = document.createElement('div'); bc.className = 'shk-bc';
    bc.innerHTML = '<span class="ic">⌂</span> <span data-s="home"></span> <span class="sep">›</span> <b data-s="ov_bc"></b>';
    hd.appendChild(bc);
    var base = document.createElement('div'); base.className = 'shk-base';
    base.innerHTML = '<span id="shk-ov-time"></span> <span data-s="ov_base"></span> <button id="shk-ov-ref">⟳ <span data-s="refresh"></span></button>';
    hd.after(base);
    $('shk-ov-ref').onclick = function () { try { window.updateKPIs && window.updateKPIs(); window.initOverviewCharts && window.initOverviewCharts(); window.initZoneHazChart && window.initZoneHazChart(); window.renderCompliance && window.renderCompliance(); } catch (e) {} renderOverview(); };
    var kr = p.querySelector('.kpi-row'); kr.classList.add('shk-sum');
    var icons = ['👷', '✅', '🧓', '🚨'];
    kr.querySelectorAll('.kpi-card').forEach(function (c, i) { c.setAttribute('data-ic', icons[i]); });
    // 警报公告板 + 快捷菜单
    var row = document.createElement('div'); row.className = 'shk-ov-row2';
    row.innerHTML = '<div class="shk-box" id="shk-ov-board"><div class="bh"><b data-s="al_board"></b><a data-go="alerts"><span data-s="more2"></span> +</a></div><div id="shk-ov-alerts"></div></div>' +
      '<div class="shk-box"><div class="bh"><b data-s="quick"></b></div><div class="shk-quick" id="shk-ov-quick"></div></div>';
    kr.after(row);
    // 四个图表一行
    var g4 = document.createElement('div'); g4.className = 'shk-ov-g4';
    ['cTime', 'cWorker', 'cAge', 'cPPE'].forEach(function (id) { var cv = $(id); if (cv) g4.appendChild(cv.closest('.card')); });
    row.after(g4);
    // 原来的两行 grid-2 中剩下的：到期提醒 + 区域上报
    var bottom = document.createElement('div'); bottom.className = 'shk-ov-row3';
    var cmp = p.querySelector('.cmp-card'), hz = $('cZoneHaz') && $('cZoneHaz').closest('.card');
    if (cmp) bottom.appendChild(cmp); if (hz) bottom.appendChild(hz);
    g4.after(bottom);
    p.querySelectorAll('.grid-2').forEach(function (g) { if (!g.children.length) g.remove(); });
    // 每个图表卡片加“更多 +”
    Object.keys(OV_MORE).forEach(function (id) {
      var c = $(id) && $(id).closest('.card'); if (!c || c.querySelector('.shk-more')) return;
      var a = document.createElement('a'); a.className = 'shk-more'; a.dataset.go = OV_MORE[id]; a.innerHTML = '<span data-s="more2"></span> +';
      c.insertBefore(a, c.firstChild);
    });
    if (cmp && !cmp.querySelector('.shk-more')) { var a2 = document.createElement('a'); a2.className = 'shk-more'; a2.dataset.go = 'register'; a2.innerHTML = '<span data-s="more2"></span> +'; cmp.querySelector('.cmp-hd').appendChild(a2); }
    p.querySelectorAll('[data-go]').forEach(function (a) { a.onclick = function () { window.showPanel(a.dataset.go); }; });
    relabel(); renderOverview();
    setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 60);
  }
  var OV_TXT = {
    zh: { 'shk-kmt1': '在线', 'shk-kmt3': '高风险', 'cs-work': '按状态 · 实时', 'cs-time': 'AI 预测高风险：06-08 时 / 14-16 时', 'cs-age': '55 岁以上风险明显偏高', 'cs-ppe': '安全帽未佩戴占 44%' },
    ko: { 'shk-kmt1': '접속', 'shk-kmt3': '고위험', 'cs-work': '상태별 · 실시간', 'cs-time': 'AI 예측 고위험: 06-08시 / 14-16시', 'cs-age': '55세 이상 위험이 뚜렷이 높음', 'cs-ppe': '안전모 미착용 44%' },
    en: { 'shk-kmt1': 'Online', 'shk-kmt3': 'High risk', 'cs-work': 'By status · live', 'cs-time': 'AI high-risk hours: 06-08 / 14-16', 'cs-age': 'Risk clearly higher at 55+', 'cs-ppe': 'No helmet: 44%' }
  };
  function renderOverview() {
    var s = S(), d = new Date(), pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var tx = OV_TXT[L()]; Object.keys(tx).forEach(function (id) { var e = $(id); if (e && e.textContent !== tx[id]) e.textContent = tx[id]; });
    var t = $('shk-ov-time'); if (!t) return;
    t.textContent = d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate()) + '(' + s.wd[d.getDay()] + ') ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    // 要约带单位
    ['km1', 'km2', 'km3'].forEach(function (id) { var e = $(id); if (e) e.setAttribute('data-u', s.u_person); });
    var e4 = $('km4'); if (e4) e4.setAttribute('data-u', s.u_case);
    // 公告板
    var al = []; try { al = JSON.parse(localStorage.getItem('shk_alerts') || '[]'); } catch (x) {}
    var box = $('shk-ov-alerts');
    if (!al.length) box.innerHTML = '<div class="empty">' + s.no_alert + '</div>';
    else box.innerHTML = '<table class="shk-tb"><thead><tr><th style="width:52px">' + s.c_no + '</th><th style="width:70px">' + s.c_type + '</th><th>' + s.c_msg + '</th><th style="width:70px">' + s.c_zone + '</th><th style="width:76px">' + s.c_time + '</th><th style="width:76px">' + s.c_status + '</th></tr></thead><tbody>' +
      al.slice(0, 6).map(function (a, i) {
        var real = /^\[(实测|실측|REAL)\]/.test(a.title || ''), title = String(a.title || '').replace(/^\[[^\]]+\]\s*/, '');
        var st = a.status === 'acked' ? s.s_acked : a.status === 'escalated' ? s.s_escalated : s.s_pending;
        var tm = new Date(a.ts); 
        return '<tr><td class="c">' + (al.length - i) + '</td><td class="c"><span class="lv ' + (a.level === 'danger' ? 'd' : 'w') + '">' + (a.level === 'danger' ? s.lv_danger : s.lv_warn) + '</span></td>' +
          '<td class="m">' + (real ? '<span class="rl">' + s.real + '</span> ' : '') + esc(title) + '</td><td class="c">' + esc(a.zone || '-') + '</td><td class="c mono">' + pad(tm.getHours()) + ':' + pad(tm.getMinutes()) + '</td>' +
          '<td class="c"><span class="st ' + (a.status || 'pending') + '">' + st + '</span></td></tr>';
      }).join('') + '</tbody></table>';
    // 快捷菜单
    var q = $('shk-ov-quick');
    if (q && !q.dataset.lang || q.dataset.lang !== L()) {
      q.dataset.lang = L();
      var items = [['register', '🪪'], ['monitor', '❤️'], ['checklist', '✅'], ['camera', '📹'], ['alerts', '🚨'], ['briefing', '📢'], ['reports', '🧾'], ['elderly', '👴']];
      q.innerHTML = items.filter(function (it) { return allowed(it[0]); }).map(function (it) { return '<a data-go="' + it[0] + '"><i>' + it[1] + '</i><span>' + esc(s.cards[it[0]][0]) + '</span></a>'; }).join('');
      q.querySelectorAll('[data-go]').forEach(function (a) { a.onclick = function () { window.showPanel(a.dataset.go); }; });
    }
  }

  function isHome() { var p = $('panel-home'); return !!(p && p.classList.contains('active')); }

  function setup() {
    if (!$('app')) return;
    buildTopbar(); buildSidebar(); buildHome(); buildIot(); buildCam(); buildMon(); buildOverview(); wrapShow(); relabel();
  }

  function boot() {
    setup();
    ['app-btn-zh', 'app-btn-ko', 'app-btn-en'].forEach(function (id) { var e = $(id); if (e) e.addEventListener('click', function () { setTimeout(function () { relabel(); if (isHome()) renderHome(); }, 80); }); });
    setInterval(function () { if (isHome()) renderHome(); }, 4000);
    setInterval(function () { var p = $('panel-iot'); if (p && p.classList.contains('active')) renderIot(); var c = $('panel-camera'); if (c && c.classList.contains('active')) renderCam(); var mo = $('panel-monitor'); if (mo && mo.classList.contains('active')) renderMon(); var ov = $('panel-overview'); if (ov && ov.classList.contains('active')) renderOverview(); }, 1000);
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
