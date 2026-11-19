/* SHine-K 3.0 · 岗前急救培训 + 急救物品位置 + 粉尘个人吸入量（平台端，依赖 js/shk-plus.js）
 *  · 急救：新员工在手机上完成 firstaid.html（CPR / AED / 常见伤害 / 节奏练习 / 测验）→ 结业记录回到这里；
 *          登记 AED、急救箱、洗眼器、担架的位置；现场发生紧急情况时，现场端把最近的急救物品推送到所有工人手机（安卓转发到手表）。
 *  · 粉尘：每个区域设浓度和暴露限值；现场端按“谁在哪个区域待了多久、有没有戴口罩”累计；
 *          这里算出每人今天的 8 小时时间加权平均（TWA）占限值的比例、估算吸入量，并按 50 / 80 / 100 % 通知本人。
 */
(function () {
  'use strict';
  if (!window.SHKPlus) return;
  var P = window.SHKPlus, H = P.h, esc = H.esc, jget = H.jget, jset = H.jset, lang = H.lang, DAY = H.DAY;
  var $ = function (id) { return document.getElementById(id); };
  function T(o) { return o[lang()] || o.zh; }
  var tr = null; try { tr = new SHKTransport('dash'); } catch (e) {}
  function send(m) { if (tr) try { tr.send(m); } catch (e) {} }

  /* =================== 急救 =================== */
  var AT = { aed: ['❤️‍🩹', { zh: 'AED', ko: 'AED', en: 'AED' }], kit: ['🩹', { zh: '急救箱', ko: '구급함', en: 'First-aid kit' }], eyewash: ['🚿', { zh: '洗眼器 / 紧急淋浴', ko: '세안기·긴급샤워', en: 'Eyewash / shower' }],
    stretcher: ['🛏', { zh: '担架', ko: '들것', en: 'Stretcher' }], ext: ['🧯', { zh: '灭火器', ko: '소화기', en: 'Extinguisher' }] };
  var CELLS = ['A1', 'B1', 'C1', 'A2', 'B2', 'C2', 'A3', 'B3', 'C3'];
  function cellXY(c) { var i = CELLS.indexOf(c); return { x: ((i % 3) + 0.5) / 3, y: (Math.floor(i / 3) + 0.5) / 3 }; }
  function xyCell(x, y) { return 'ABC'.charAt(Math.min(2, Math.floor(x * 3))) + (1 + Math.min(2, Math.floor(y * 3))); }
  var DEMO_AID = [{ id: 'd1', type: 'aed', name: '休息室门口 / 휴게실 입구', site: 'SITE-A', x: 0.17, y: 0.17, check: Date.now() - 12 * DAY }, { id: 'd2', type: 'kit', name: '冲压线 B 柱 / 프레스 라인 B기둥', site: 'SITE-A', x: 0.5, y: 0.5, check: null },
    { id: 'd3', type: 'eyewash', name: '喷涂间出口 / 도장실 출구', site: 'SITE-A', x: 0.83, y: 0.83, check: null }, { id: 'd4', type: 'stretcher', name: '安全室 / 안전실', site: 'SITE-A', x: 0.17, y: 0.83, check: null }];
  function aidPts() { var a = jget('shk3_aidpts', null); return a && a.length ? { list: a, real: true } : { list: DEMO_AID, real: false }; }
  function syncAid() { var a = aidPts(); send({ type: 'aidpts', list: a.list, scale: jget('shk3_aid_scale', 20) }); send({ type: 'fa_sync', list: jget('shk3_fa_records', []).slice(-300) }); }
  setInterval(syncAid, 20000);
  if (tr) tr.on(function (m) {
    if (m.type === 'fa_cert' && m.rec) { var all = jget('shk3_fa_records', []); if (!all.some(function (r) { return r.ts === m.rec.ts && r.name === m.rec.name; })) { all.push(m.rec); jset('shk3_fa_records', all.slice(-1000)); } if (P.current() === 'aid') P.render('aid'); }
    if (m.type === 'event' && (m.kind === 'dust_dose' || m.kind === 'aid_route') && P.current() === (m.kind === 'aid_route' ? 'aid' : 'dust')) P.render(P.current());
  });
  function nearest(site, x, y, list) {
    var out = {}; list.forEach(function (p) { var d = p.site === site ? Math.hypot(p.x - x, p.y - y) : 9; if (!out[p.type] || d < out[p.type].d) out[p.type] = { p: p, d: d }; }); return out;
  }
  var AID = {
    zh: { t: '岗前急救培训 · 急救物品', s: '新员工上岗前在手机上完成急救培训（CPR、AED、常见伤害、按压节奏练习、测验）；登记 AED 和急救箱的位置，出事时把最近的急救物品推送到每个人的手机和手表',
      open: '📱 打开培训页（发给新员工）', copy: '复制链接', copied: '已复制', k1: '培训完成率', k2: '未培训（需上岗前完成）', k3: '本月结业', k4: '平均按压频率',
      tw: '员工培训状态', c_w: '员工', c_st: '状态', c_d: '日期', c_sc: '测验', c_r: '按压频率', c_exp: '复训期限', st_ok: '✓ 已结业', st_no: '✕ 未培训', st_exp: '⚠ 需复训', st_fail: '✕ 未通过',
      pts: '急救物品位置', add: '＋ 添加', type: '类型', name: '位置描述', site: '现场', cell: '画面位置', del: '删除', check: '本月已检查', checked: '检查于 {d}', due: '⚠ 本月未检查',
      scale: '画面宽度约（米）', test: '📲 测试：假设事故发生在', test_go: '发送到手机 / 手表', test_sent: '已发送：{b}', map: '位置图', demo: '演示位置（还没有登记）',
      how: '现场端检测到跌倒无回应、双源确认跌倒、SOS、呼救、疑似晕倒、手进入机器危险点时，会自动计算离事故最近的 AED / 急救箱 / 洗眼器 / 担架，连同已结业急救员名单一起推送到所有工人手机；安卓手机在手表 App 里打开 Chrome 通知转发后，手表会振动显示。距离按画面九宫格估算。',
      ev: 'CPR 要点依据《2025 年韩国心肺复苏指南》：成人约 5 cm、每分钟 100–120 次。依《应急医疗法》第 47 条之 2，须配置保健管理人员的事业场中常时劳动者 300 人以上的须配备 AED，且设置后须每月至少检查 1 次并通报。培训页是岗前入门，不能代替有资质机构的实操课程。' },
    ko: { t: '작업 전 응급처치 교육 · 응급용품', s: '신규 입사자가 작업 전에 휴대폰으로 응급처치 교육(CPR·AED·흔한 부상·압박 리듬·퀴즈)을 마칩니다. AED와 구급함 위치를 등록해 사고 시 가장 가까운 응급용품을 모두의 휴대폰·워치로 보냅니다',
      open: '📱 교육 페이지 열기(신규자에게 전달)', copy: '링크 복사', copied: '복사됨', k1: '교육 이수율', k2: '미이수(작업 전 필수)', k3: '이번 달 수료', k4: '평균 압박 속도',
      tw: '직원 교육 현황', c_w: '직원', c_st: '상태', c_d: '날짜', c_sc: '퀴즈', c_r: '압박 속도', c_exp: '재교육 기한', st_ok: '✓ 수료', st_no: '✕ 미이수', st_exp: '⚠ 재교육 필요', st_fail: '✕ 불합격',
      pts: '응급용품 위치', add: '＋ 추가', type: '종류', name: '위치 설명', site: '현장', cell: '화면 위치', del: '삭제', check: '이번 달 점검', checked: '점검 {d}', due: '⚠ 이번 달 미점검',
      scale: '화면 폭 약(m)', test: '📲 테스트: 사고 위치를', test_go: '휴대폰·워치로 보내기', test_sent: '보냄: {b}', map: '위치도', demo: '데모 위치(아직 등록 없음)',
      how: '현장 화면이 넘어짐 무응답, 이중 확인 넘어짐, SOS, 구조 요청, 실신 의심, 기계 위험점 손 진입을 감지하면 사고 위치에서 가장 가까운 AED·구급함·세안기·들것과 수료한 응급요원 명단을 모든 근로자 휴대폰으로 보냅니다. 안드로이드는 워치 앱에서 Chrome 알림 전달을 켜면 워치가 진동합니다. 거리는 화면 9칸 기준 추정입니다.',
      ev: '심폐소생술 요점은 2025년 한국 심폐소생술 가이드라인(성인 약 5 cm, 분당 100–120회). 응급의료법 제47조의2: 보건관리자를 두어야 하는 사업장 중 상시근로자 300명 이상은 AED 등 응급장비를 갖추어야 하며, 설치 후 매월 1회 이상 점검·통보해야 합니다. 이 교육은 작업 전 기초 교육이며 공인 실습 교육을 대신하지 않습니다.' },
    en: { t: 'Pre-shift first aid · equipment', s: 'New starters finish first-aid training on their phone before work (CPR, AED, common injuries, rhythm drill, quiz). Register where the AEDs and kits are, so the nearest one is pushed to every phone and watch in an emergency',
      open: '📱 Open training page (send to new starters)', copy: 'Copy link', copied: 'Copied', k1: 'Training completion', k2: 'Not trained (required before work)', k3: 'Completed this month', k4: 'Mean compression rate',
      tw: 'Staff training status', c_w: 'Staff', c_st: 'Status', c_d: 'Date', c_sc: 'Quiz', c_r: 'Rate', c_exp: 'Refresher due', st_ok: '✓ Completed', st_no: '✕ Not trained', st_exp: '⚠ Refresher due', st_fail: '✕ Not passed',
      pts: 'First-aid equipment locations', add: '＋ Add', type: 'Type', name: 'Location', site: 'Site', cell: 'View cell', del: 'Delete', check: 'Checked this month', checked: 'Checked {d}', due: '⚠ Not checked this month',
      scale: 'View width ≈ (m)', test: '📲 Test: incident at', test_go: 'Send to phones / watches', test_sent: 'Sent: {b}', map: 'Map', demo: 'Demo locations (none registered yet)',
      how: 'When the field app detects a fall with no response, a two-source fall, SOS, a call for help, a suspected collapse or a hand in a machine zone, it works out the nearest AED / kit / eyewash / stretcher and pushes it, with the names of trained first aiders, to every worker\'s phone; Android phones forward Chrome notifications to the watch. Distance is estimated from the 3×3 view grid.',
      ev: 'CPR points follow the 2025 Korean CPR Guidelines (adults about 5 cm, 100–120/min). Under Art. 47-2 of Korea\'s Emergency Medical Service Act, workplaces that must have a health manager and employ 300+ workers must install an AED and check it at least monthly. The training page is an induction, not a certified hands-on course.' }
  };
  function people() {
    var ws = (window.WORKERS || []).map(function (w) { return { id: w.id, name: w.name, age: w.age }; });
    var db = jget('shk3_store', {}), ro = db.roster || {};
    Object.keys(ro).forEach(function (k) { var r = ro[k]; if (r && !r._del && !ws.some(function (w) { return w.id === r.id; })) ws.push({ id: r.id, name: { zh: r.name || r.id, ko: r.name || r.id, en: r.name || r.id }, age: r.age }); });
    return ws;
  }
  function recFor(w, recs) {
    var names = [w.name.zh, w.name.ko, w.name.en].filter(Boolean).map(function (x) { return x.toLowerCase(); });
    var mine = recs.filter(function (r) { return (r.code && r.code === w.id) || names.indexOf(String(r.name || '').toLowerCase()) >= 0; });
    return mine.sort(function (a, b) { return b.ts - a.ts; })[0] || null;
  }
  function renderAid(p, s0) {
    var s = AID[lang()], recs = jget('shk3_fa_records', []), ws = people(), a = aidPts(), scale = jget('shk3_aid_scale', 20);
    var url = location.href.replace(/[#?].*$/, '').replace(/[^/]*$/, '') + 'firstaid.html';
    var rows = ws.map(function (w) { var r = recFor(w, recs), st = !r ? 'no' : !r.pass ? 'fail' : (Date.now() - r.ts > 365 * DAY ? 'exp' : 'ok'); return { w: w, r: r, st: st }; });
    var done = rows.filter(function (x) { return x.st === 'ok'; }).length, month = new Date(); month = new Date(month.getFullYear(), month.getMonth(), 1).getTime();
    var passed = recs.filter(function (r) { return r.pass; }), avgRate = passed.length ? Math.round(passed.reduce(function (t, r) { return t + r.rate; }, 0) / passed.length) : 0;
    var stCol = { ok: 'var(--g)', no: 'var(--r)', fail: 'var(--r)', exp: 'var(--w)' };
    var sites = {}; a.list.forEach(function (x) { sites[x.site] = 1; }); var siteList = Object.keys(sites); if (!siteList.length) siteList = [jget('shk3_site', 'SITE-A')];
    p.innerHTML = H.hd(s.t, s.s, '<a class="px-btn" href="firstaid.html" target="_blank">' + s.open + '</a>') +
      '<div class="card rv" style="margin-bottom:16px;display:flex;gap:8px;align-items:center;flex-wrap:wrap"><code style="flex:1;min-width:220px;font-size:.8rem;background:var(--bg2);padding:8px 10px;border-radius:8px;word-break:break-all">' + esc(url) + '</code><button class="px-btn g" id="aid-copy">' + s.copy + '</button></div>' +
      '<div class="kpi-row rv">' + H.kpi('green', s.k1, (ws.length ? Math.round(done / ws.length * 100) : 0) + '<small style="font-size:1rem">%</small>', done + ' / ' + ws.length) + H.kpi('red', s.k2, rows.filter(function (x) { return x.st !== 'ok'; }).length) +
      H.kpi('blue', s.k3, recs.filter(function (r) { return r.pass && r.ts >= month; }).length) + H.kpi('amber', s.k4, avgRate || '—', avgRate ? '100–120' : '') + '</div>' +
      '<div class="grid-2 rv"><div class="card"><div class="card-title">' + s.tw + '</div><table class="px-t"><tr><th>' + s.c_w + '</th><th>' + s.c_st + '</th><th>' + s.c_d + '</th><th>' + s.c_sc + '</th><th>' + s.c_r + '</th><th>' + s.c_exp + '</th></tr>' +
      rows.map(function (x) { var r = x.r; return '<tr><td><b>' + esc(x.w.name[lang()] || x.w.name.zh) + '</b><br><small style="color:var(--ink4)">' + esc(x.w.id) + '</small></td><td><span class="px-pill" style="background:' + stCol[x.st] + ';color:#fff">' + s['st_' + x.st] + '</span></td>' +
        '<td style="font-size:.76rem">' + (r ? new Date(r.ts).toLocaleDateString() : '—') + '</td><td>' + (r ? r.score + '/' + r.total : '—') + '</td><td>' + (r ? r.rate : '—') + '</td><td style="font-size:.76rem">' + (r && r.pass ? new Date(r.ts + 365 * DAY).toLocaleDateString() : '—') + '</td></tr>'; }).join('') +
      '</table></div>' +
      '<div class="card"><div class="card-title">' + s.pts + (a.real ? '' : ' <span class="px-src">' + s.demo + '</span>') + '</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:end;margin:8px 0">' +
      '<select class="px-in" id="aid-type">' + Object.keys(AT).map(function (k) { return '<option value="' + k + '">' + AT[k][0] + ' ' + esc(T(AT[k][1])) + '</option>'; }).join('') + '</select>' +
      '<input class="px-in" id="aid-name" placeholder="' + esc(s.name) + '" style="width:150px"><input class="px-in" id="aid-site" value="' + esc(siteList[0]) + '" style="width:90px">' +
      '<select class="px-in" id="aid-cell">' + CELLS.map(function (c) { return '<option>' + c + '</option>'; }).join('') + '</select><button class="px-btn" id="aid-add">' + s.add + '</button></div>' +
      '<table class="px-t">' + a.list.map(function (x) {
        var thisMonth = x.check && x.check >= month;
        return '<tr><td>' + AT[x.type][0] + ' <b>' + esc(T(AT[x.type][1])) + '</b><br><small>' + esc(x.name) + ' · ' + esc(x.site) + ' ' + xyCell(x.x, x.y) + '</small></td><td style="font-size:.74rem">' +
          (x.type === 'aed' ? (thisMonth ? '<span style="color:var(--g)">' + esc(s.checked.replace('{d}', new Date(x.check).toLocaleDateString())) + '</span>' : '<span style="color:var(--w)">' + s.due + '</span><br><button class="px-btn g" style="padding:3px 8px;font-size:.7rem" data-chk="' + x.id + '">' + s.check + '</button>') : '') +
          '</td><td>' + (a.real ? '<button class="px-btn g" style="padding:3px 8px;font-size:.7rem" data-del="' + x.id + '">' + s.del + '</button>' : '') + '</td></tr>';
      }).join('') + '</table>' +
      '<div class="card-title" style="margin-top:12px">' + s.map + ' · ' + esc(siteList[0]) + '</div><div class="px-grid" style="max-width:360px">' +
      CELLS.map(function (c) { var here = a.list.filter(function (x) { return x.site === siteList[0] && xyCell(x.x, x.y) === c; }); return '<div class="px-cell" style="background:' + (here.length ? 'var(--rbg)' : 'var(--bg2)') + ';font-size:1.1rem">' + (here.map(function (x) { return AT[x.type][0]; }).join('') || '') + '<small>' + c + '</small></div>'; }).join('') + '</div>' +
      '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:10px"><span style="font-size:.78rem">' + s.scale + '</span><input class="px-in" id="aid-scale" type="number" value="' + scale + '" style="width:70px"></div>' +
      '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:10px"><span style="font-size:.78rem">' + s.test + '</span><select class="px-in" id="aid-tcell">' + CELLS.map(function (c) { return '<option' + (c === 'C3' ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select><button class="px-btn w" id="aid-test">' + s.test_go + '</button></div><div id="aid-msg" class="px-how"></div></div></div>' +
      '<div class="card rv" style="margin-top:16px"><div class="px-how" style="margin:0">' + esc(s.how) + '</div></div>' + H.ev(s0, s.ev);
    function save(list) { jset('shk3_aidpts', list); syncAid(); P.render('aid'); }
    $('aid-copy').onclick = function () { try { navigator.clipboard.writeText(url); this.textContent = s.copied; } catch (e) {} };
    $('aid-add').onclick = function () { var nm = $('aid-name').value.trim(); if (!nm) { $('aid-name').focus(); return; } var xy = cellXY($('aid-cell').value), list = a.real ? a.list.slice() : []; list.push({ id: 'A' + Date.now().toString(36), type: $('aid-type').value, name: nm, site: $('aid-site').value.trim() || 'SITE-A', x: xy.x, y: xy.y, check: null }); save(list); };
    p.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { save(a.list.filter(function (x) { return x.id !== b.dataset.del; })); }; });
    p.querySelectorAll('[data-chk]').forEach(function (b) { b.onclick = function () { var list = a.list.map(function (x) { return x.id === b.dataset.chk ? Object.assign({}, x, { check: Date.now() }) : x; }); if (a.real) save(list); else { DEMO_AID.forEach(function (x) { if (x.id === b.dataset.chk) x.check = Date.now(); }); P.render('aid'); } }; });
    $('aid-scale').onchange = function () { jset('shk3_aid_scale', +this.value || 20); syncAid(); };
    $('aid-test').onclick = function () {
      var xy = cellXY($('aid-tcell').value), near = nearest(siteList[0], xy.x, xy.y, a.list), m = +jget('shk3_aid_scale', 20) || 20, zh = lang() === 'zh';
      var list = ['aed', 'kit', 'eyewash', 'stretcher'].filter(function (k) { return near[k]; }).map(function (k) { var n = near[k]; return T(AT[k][1]) + (zh ? '：' : ': ') + n.p.name + (n.d < 5 ? ' (≈' + Math.max(1, Math.round(n.d * m)) + ' m)' : ''); }).join(zh ? '；' : '; ');
      var trained = jget('shk3_fa_records', []).filter(function (r) { return r.pass; }).map(function (r) { return r.name; }).filter(function (v, i, arr) { return arr.indexOf(v) === i; }).slice(0, 4);
      var body = T({ zh: '【测试】事故位置 ', ko: '[테스트] 사고 위치 ', en: '[TEST] Incident at ' }) + siteList[0] + ' ' + $('aid-tcell').value + (zh ? '。最近的 ' : '. Nearest: ') + list + (trained.length ? (zh ? '。已培训急救员：' : '. Trained first aiders: ') + trained.join(', ') : '');
      send({ type: 'notify', to: '*', level: 'warn', title: T({ zh: '🩹 最近的急救物品', ko: '🩹 가장 가까운 응급용품', en: '🩹 Nearest first-aid equipment' }), body: body, aid: true });
      $('aid-msg').textContent = s.test_sent.replace('{b}', body);
    };
    syncAid();
  }

  /* =================== 粉尘个人吸入量 =================== */
  var SUB = { other: { oel: 10, n: { zh: '其他粉尘（总粉尘）', ko: '기타 분진', en: 'Other dust (total)' } }, weld: { oel: 5, n: { zh: '焊接烟尘', ko: '용접흄', en: 'Welding fume' } },
    resp: { oel: 5, n: { zh: '可吸入（呼吸性）粉尘', ko: '호흡성 분진', en: 'Respirable dust' } }, silica: { oel: 0.05, n: { zh: '结晶型游离二氧化硅', ko: '결정형 유리규산', en: 'Crystalline silica' } }, custom: { oel: 1, n: { zh: '自定义', ko: '직접 입력', en: 'Custom' } } };
  var BREATH = 1.25;   // m³/h
  var DEMO_DZ = { '焊接区 / Welding': { sub: 'weld', oel: 5, c: 6, apf: 10 }, '冲压 1号线 / Press 1': { sub: 'other', oel: 10, c: 4, apf: 10 }, '打磨间 / Grinding': { sub: 'resp', oel: 5, c: 3, apf: 10 } };
  function dayKey(t) { var d = new Date(t); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function demoExpo() {
    var out = {}, base = [['W001', '张伟明 / 장웨이밍', { '焊接区 / Welding': [5.5, 0.4] }], ['W002', '李敏俊 / 이민준', { '冲压 1号线 / Press 1': [7, 0.9] }], ['W003', '郑英淑 / 정영숙', { '焊接区 / Welding': [1, 1], '打磨间 / Grinding': [2.5, 0.2] }], ['W004', '金东赫 / 김동혁', { '打磨间 / Grinding': [3, 0.95] }]];
    for (var d = 0; d < 7; d++) {
      var k = dayKey(Date.now() - d * DAY), f = [1, 0.8, 0.9, 1.1, 0.7, 0.95, 0.6][d]; out[k] = {};
      base.forEach(function (b) { var z = {}; Object.keys(b[2]).forEach(function (zn) { var h = b[2][zn][0] * f; z[zn] = { t: h * 3600, tm: h * 3600 * b[2][zn][1] }; }); out[k][b[0]] = { who: b[1], zones: z }; });
    }
    return out;
  }
  function calc(rec, cfg) {
    var twa = 0, frac = 0, inh = 0, t = 0, tm = 0, ref = 0;
    Object.keys(rec.zones).forEach(function (z) { var c = cfg[z], r = rec.zones[z]; if (!c || !(c.c > 0)) return; var h = r.t / 3600, hm = r.tm / 3600, apf = c.apf || 10;
      t += r.t; tm += r.tm; twa += c.c * h / 8; frac += c.oel > 0 ? c.c * h / 8 / c.oel : 0; inh += c.c * ((h - hm) + hm / apf) * BREATH; });
    return { t: t, mask: t ? tm / t : 0, twa: twa, pct: Math.round(frac * 100), inh: inh };
  }
  var DU = {
    zh: { t: '粉尘个人吸入量 · 职业健康档案', s: '墙上的仪器只知道车间浓度，工人却是走动的：按“谁在哪个区域待了多久、有没有戴口罩”算出每人今天的 8 小时加权平均暴露（TWA）占限值多少、估算实际吸入量，到 50 / 80 / 100 % 自动通知本人手机和手表',
      k1: '今日超过 80 % 的人', k2: '今日最高', k3: '粉尘区口罩佩戴率', k4: '今日通知', zc: '粉尘区域设置', c_z: '区域（与现场端区域名一致）', c_sub: '物质', c_oel: '限值 TWA mg/m³', c_c: '浓度 mg/m³', c_apf: '口罩防护系数', add: '＋ 添加区域', save: '保存并同步到现场端', del: '删除',
      ex: '今日个人暴露', c_w: '工人', c_t: '粉尘区停留', c_m: '戴口罩', c_twa: 'TWA mg/m³', c_p: '占限值', c_i: '估算吸入量', c_s: '状态', c_n: '通知',
      s0: '正常', s50: '≥50 %：全程戴口罩', s80: '≥80 %：建议调岗 / 休息', s100: '≥100 %：立即离开粉尘区', notify: '📲 通知', sent: '已发送', wk: '近 7 天职业健康档案', wk_avg: '7 天平均',
      n50: '今日粉尘暴露已达限值一半，请全程佩戴防尘口罩。', n80: '今日粉尘暴露已达限值 80%，建议离开粉尘区休息或调岗。', n100: '今日粉尘暴露已达到限值，请立即离开粉尘区。', n0: '今日粉尘暴露正常，请继续佩戴口罩。',
      how: 'TWA = Σ(区域浓度 × 停留小时) ÷ 8；不同物质按各自限值折算后相加。估算吸入量 = 浓度 × 呼吸量 1.25 m³/h（约 8 小时 10 m³，轻中度劳动假设）× 时间；戴口罩的时间按防护系数折算（半面型防尘口罩默认 10，可改）。停留时间来自现场端摄像头（区域 = 画的危险区域名或画面九宫格），口罩来自 PPE 模型的 Mask / NO-Mask。',
      ev: 'TWA 定义与计算式依据韩国《化学物质及物理因子暴露标准》：以 1 日 8 小时为基准，测定值乘以发生时间之和再除以 8。默认限值请按本国最新标准确认；本页是基于传感器的估算，不能代替依法委托机构进行的作业环境测定。' },
    ko: { t: '분진 개인 흡입량 · 직업건강 기록', s: '벽에 단 측정기는 공정 농도만 알지만 근로자는 움직입니다. "누가 어느 구역에 얼마나 있었고 마스크를 썼는지"로 오늘 8시간 시간가중평균(TWA)이 기준의 몇 %인지, 실제 흡입량을 추정하고 50/80/100%에서 본인 휴대폰·워치로 알립니다',
      k1: '오늘 80% 초과 인원', k2: '오늘 최고', k3: '분진 구역 마스크 착용률', k4: '오늘 알림', zc: '분진 구역 설정', c_z: '구역(현장 화면 구역명과 동일)', c_sub: '물질', c_oel: '노출기준 TWA mg/m³', c_c: '농도 mg/m³', c_apf: '마스크 보호계수', add: '＋ 구역 추가', save: '저장·현장 동기화', del: '삭제',
      ex: '오늘 개인 노출', c_w: '근로자', c_t: '분진 구역 체류', c_m: '마스크', c_twa: 'TWA mg/m³', c_p: '기준 대비', c_i: '추정 흡입량', c_s: '상태', c_n: '알림',
      s0: '정상', s50: '50% 이상: 마스크 계속 착용', s80: '80% 이상: 작업 전환·휴식 권고', s100: '100% 이상: 즉시 분진 구역 이탈', notify: '📲 알림', sent: '보냄', wk: '최근 7일 직업건강 기록', wk_avg: '7일 평균',
      n50: '오늘 분진 노출이 기준의 절반입니다. 방진마스크를 계속 착용하세요.', n80: '오늘 분진 노출이 기준의 80%입니다. 분진 구역을 벗어나 쉬거나 작업 전환을 권합니다.', n100: '오늘 분진 노출이 기준에 도달했습니다. 즉시 분진 구역을 벗어나세요.', n0: '오늘 분진 노출은 정상입니다. 마스크를 계속 착용하세요.',
      how: 'TWA = Σ(구역 농도 × 체류 시간) ÷ 8. 물질이 다르면 각 기준으로 환산해 합산. 추정 흡입량 = 농도 × 호흡량 1.25 m³/h(8시간 약 10 m³, 경·중등도 작업 가정) × 시간, 마스크 착용 시간은 보호계수로 나눔(반면형 방진마스크 기본 10, 변경 가능). 체류 시간은 현장 화면 카메라(구역 = 그린 위험구역명 또는 화면 9칸), 마스크는 PPE 모델 Mask / NO-Mask.',
      ev: 'TWA 정의·계산식은 「화학물질 및 물리적인자의 노출기준」: 1일 8시간 기준으로 측정치에 발생시간을 곱해 더한 뒤 8로 나눕니다. 기본 노출기준 값은 최신 고시로 확인하세요. 이 페이지는 센서 기반 추정이며 법정 작업환경측정을 대신하지 않습니다.' },
    en: { t: 'Personal dust intake · health record', s: 'A wall monitor knows the room, but workers move. From who stayed in which zone, for how long and with or without a mask, we estimate each worker\'s 8-hour TWA as a share of the limit and their inhaled dose, and notify their phone and watch at 50 / 80 / 100 %',
      k1: 'Over 80 % today', k2: 'Highest today', k3: 'Mask wear in dust zones', k4: 'Notifications today', zc: 'Dust zone settings', c_z: 'Zone (same name as in the field app)', c_sub: 'Substance', c_oel: 'Limit TWA mg/m³', c_c: 'Conc. mg/m³', c_apf: 'Mask protection factor', add: '＋ Add zone', save: 'Save & sync to field', del: 'Delete',
      ex: 'Personal exposure today', c_w: 'Worker', c_t: 'Time in dust', c_m: 'Mask', c_twa: 'TWA mg/m³', c_p: '% of limit', c_i: 'Est. inhaled', c_s: 'Status', c_n: 'Notify',
      s0: 'Normal', s50: '≥50 %: keep mask on', s80: '≥80 %: rotate / rest', s100: '≥100 %: leave dust area now', notify: '📲 Notify', sent: 'Sent', wk: '7-day occupational health record', wk_avg: '7-day mean',
      n50: 'Your dust exposure today is half the limit. Keep your dust mask on.', n80: 'Your dust exposure today is 80% of the limit. Leave the dust area for a break or switch tasks.', n100: 'Your dust exposure today has reached the limit. Leave the dust area now.', n0: 'Your dust exposure today is normal. Keep wearing your mask.',
      how: 'TWA = Σ(zone concentration × hours) ÷ 8; different substances are each scaled to their own limit and summed. Estimated intake = concentration × breathing 1.25 m³/h (≈10 m³ per 8 h, light–moderate work) × time; masked time is divided by the protection factor (half-mask default 10, editable). Time comes from the field camera (zone = drawn danger-zone name or 3×3 cell); mask from the PPE model\'s Mask / NO-Mask.',
      ev: 'TWA definition and formula follow Korea\'s exposure standards for chemical and physical agents: over an 8-hour day, the sum of each measured level times its duration, divided by 8. Check default limits against the latest national standard; this is a sensor-based estimate, not the statutory workplace environment measurement.' }
  };
  function renderDust(p, s0) {
    var s = DU[lang()], cfgR = jget('shk3_dust_zones', null), real = !!(cfgR && Object.keys(cfgR).length), cfg = real ? cfgR : DEMO_DZ;
    var expR = jget('shk3_dust_expo', {}), expReal = Object.keys(expR).length > 0, exp = expReal ? expR : demoExpo(), today = exp[dayKey(Date.now())] || {};
    var rows = Object.keys(today).map(function (k) { var c = calc(today[k], cfg); c.k = k; c.who = today[k].who || k; return c; }).sort(function (a, b) { return b.pct - a.pct; });
    var stOf = function (pct) { return pct >= 100 ? 100 : pct >= 80 ? 80 : pct >= 50 ? 50 : 0; }, col = { 0: 'var(--g)', 50: '#F5B400', 80: 'var(--w)', 100: 'var(--r)' };
    var tAll = rows.reduce(function (a, r) { return a + r.t; }, 0), mAll = rows.reduce(function (a, r) { return a + r.t * r.mask; }, 0);
    var notes = jget('shk3_px_events', []).filter(function (e) { return (e.kind === 'dust_dose' || e.kind === 'dust_mask') && e.ts >= new Date(new Date().toDateString()).getTime(); }).length + jget('shk3_px_dustnt', []).filter(function (x) { return x.ts >= new Date(new Date().toDateString()).getTime(); }).length;
    var known = {}; Object.keys(cfg).forEach(function (z) { known[z] = 1; }); Object.keys(exp).forEach(function (d) { Object.keys(exp[d]).forEach(function (k) { Object.keys(exp[d][k].zones || {}).forEach(function (z) { known[z] = 1; }); }); });
    ['A1', 'B1', 'C1', 'A2', 'B2', 'C2', 'A3', 'B3', 'C3'].forEach(function (c) { known[jget('shk3_site', 'SITE-A') + ' · ' + c] = 1; });
    var days = []; for (var d = 6; d >= 0; d--) days.push(dayKey(Date.now() - d * DAY));
    var hrs = function (sec) { var m = Math.round(sec / 60); return Math.floor(m / 60) + ':' + ('0' + (m % 60)).slice(-2); };
    p.innerHTML = H.hd(s.t, s.s, H.srcBadge(expReal ? rows.length : 0, s0)) +
      '<div class="kpi-row rv">' + H.kpi('red', s.k1, rows.filter(function (r) { return r.pct >= 80; }).length) + H.kpi('amber', s.k2, (rows[0] ? rows[0].pct : 0) + '<small style="font-size:1rem">%</small>', rows[0] ? esc(rows[0].who) : '') +
      H.kpi('blue', s.k3, (tAll ? Math.round(mAll / tAll * 100) : 0) + '<small style="font-size:1rem">%</small>') + H.kpi('green', s.k4, notes) + '</div>' +
      '<div class="worker-table-wrap rv"><table class="px-t"><tr><th>' + s.c_w + '</th><th>' + s.c_t + '</th><th>' + s.c_m + '</th><th>' + s.c_twa + '</th><th>' + s.c_p + '</th><th>' + s.c_i + '</th><th>' + s.c_s + '</th><th>' + s.c_n + '</th></tr>' +
      (rows.length ? rows.map(function (r) { var st = stOf(r.pct); return '<tr><td><b>' + esc(r.who) + '</b><br><small style="color:var(--ink4)">' + esc(r.k) + '</small></td><td>' + hrs(r.t) + '</td><td>' + Math.round(r.mask * 100) + '%</td><td>' + r.twa.toFixed(2) + '</td>' +
        '<td><div style="display:flex;gap:6px;align-items:center"><div class="px-bar" style="width:90px"><i style="width:' + Math.min(100, r.pct) + '%;background:' + col[st] + '"></i></div><b style="color:' + col[st] + '">' + r.pct + '%</b></div></td><td>' + r.inh.toFixed(1) + ' mg</td>' +
        '<td><span class="px-pill" style="background:' + col[st] + ';color:#fff">' + s['s' + st] + '</span></td><td><button class="px-btn g" style="padding:4px 9px;font-size:.72rem" data-nt="' + esc(r.k) + '" data-p="' + st + '">' + s.notify + '</button></td></tr>'; }).join('') : '<tr><td colspan="8">—</td></tr>') + '</table></div>' +
      '<div class="rv" style="display:grid;gap:16px;margin-top:16px"><div class="card" style="overflow-x:auto"><div class="card-title">' + s.wk + '</div><table class="px-t"><tr><th></th>' + days.map(function (d) { return '<th style="font-size:.66rem">' + d.split('-').slice(1).join('/') + '</th>'; }).join('') + '<th>' + s.wk_avg + '</th></tr>' +
      Object.keys(today).concat(Object.keys(exp[days[0]] || {})).filter(function (v, i, a) { return a.indexOf(v) === i; }).map(function (k) {
        var ps = days.map(function (d) { var r = exp[d] && exp[d][k]; return r ? calc(r, cfg).pct : null; }), vals = ps.filter(function (x) { return x != null; }), avg = vals.length ? Math.round(vals.reduce(function (a, b) { return a + b; }, 0) / vals.length) : 0;
        var who = (today[k] || (exp[days[0]] || {})[k] || {}).who || k;
        return '<tr><td style="font-size:.76rem;min-width:140px"><b>' + esc(who) + '</b></td>' + ps.map(function (v) { return '<td style="text-align:center">' + (v == null ? '·' : '<div style="height:34px;width:12px;margin:auto;background:var(--bg2);border-radius:3px;position:relative;overflow:hidden"><i style="position:absolute;bottom:0;left:0;right:0;height:' + Math.min(100, v) + '%;background:' + col[stOf(v)] + '"></i></div><small style="font-size:.6rem">' + v + '</small>') + '</td>'; }).join('') + '<td><b style="color:' + col[stOf(avg)] + '">' + avg + '%</b></td></tr>';
      }).join('') + '</table></div>' +
      '<div class="card" style="overflow-x:auto"><div class="card-title">' + s.zc + (real ? '' : ' <span class="px-src">' + esc(s0.demo) + '</span>') + '</div><datalist id="dz-known">' + Object.keys(known).map(function (z) { return '<option value="' + esc(z) + '">'; }).join('') + '</datalist>' +
      '<table class="px-t" id="dz-t"><tr><th>' + s.c_z + '</th><th>' + s.c_sub + '</th><th>' + s.c_oel + '</th><th>' + s.c_c + '</th><th>' + s.c_apf + '</th><th></th></tr>' +
      Object.keys(cfg).map(function (z) { return dzRow(z, cfg[z], s); }).join('') + '</table>' +
      '<div style="display:flex;gap:8px;margin-top:10px"><button class="px-btn g" id="dz-add">' + s.add + '</button><button class="px-btn" id="dz-save">' + s.save + '</button><span id="dz-msg" style="font-size:.78rem;color:var(--ink3);align-self:center"></span></div></div></div>' +
      '<div class="card rv" style="margin-top:16px"><div class="px-how" style="margin:0">' + esc(s.how) + '</div></div>' + H.ev(s0, s.ev);
    function bindRows() {
      p.querySelectorAll('[data-dzsub]').forEach(function (sel) { sel.onchange = function () { var o = sel.closest('tr').querySelector('[data-dzoel]'); if (SUB[sel.value] && sel.value !== 'custom') o.value = SUB[sel.value].oel; }; });
      p.querySelectorAll('[data-dzdel]').forEach(function (b) { b.onclick = function () { b.closest('tr').remove(); }; });
    }
    bindRows();
    $('dz-add').onclick = function () { $('dz-t').insertAdjacentHTML('beforeend', dzRow('', { sub: 'other', oel: 10, c: 1, apf: 10 }, s)); bindRows(); };
    $('dz-save').onclick = function () {
      var out = {}; p.querySelectorAll('#dz-t tr[data-dz]').forEach(function (tr2) { var z = tr2.querySelector('[data-dzz]').value.trim(); if (!z) return; out[z] = { sub: tr2.querySelector('[data-dzsub]').value, oel: +tr2.querySelector('[data-dzoel]').value || 1, c: +tr2.querySelector('[data-dzc]').value || 0, apf: +tr2.querySelector('[data-dzapf]').value || 10 }; });
      jset('shk3_dust_zones', out); send({ type: 'dustcfg', cfg: out }); P.render('dust');
    };
    p.querySelectorAll('[data-nt]').forEach(function (b) { b.onclick = function () {
      var lv = +b.dataset.p, body = s['n' + lv]; send({ type: 'notify', to: b.dataset.nt, level: lv >= 100 ? 'danger' : lv ? 'warn' : 'info', title: '🌫 ' + T({ zh: '粉尘暴露', ko: '분진 노출', en: 'Dust exposure' }), body: body, sticky: lv >= 100 });
      var l = jget('shk3_px_dustnt', []); l.push({ ts: Date.now(), to: b.dataset.nt, lv: lv }); jset('shk3_px_dustnt', l.slice(-500)); b.textContent = s.sent; b.disabled = true;
    }; });
  }
  function dzRow(z, c, s) {
    return '<tr data-dz><td><input class="px-in" data-dzz list="dz-known" value="' + esc(z) + '" style="width:170px;padding:5px 8px"></td><td><select class="px-in" data-dzsub style="padding:5px">' + Object.keys(SUB).map(function (k) { return '<option value="' + k + '"' + (k === c.sub ? ' selected' : '') + '>' + esc(T(SUB[k].n)) + '</option>'; }).join('') + '</select></td>' +
      '<td><input class="px-in" data-dzoel type="number" step="0.01" value="' + c.oel + '" style="width:70px;padding:5px"></td><td><input class="px-in" data-dzc type="number" step="0.01" value="' + c.c + '" style="width:70px;padding:5px"></td><td><input class="px-in" data-dzapf type="number" step="1" value="' + (c.apf || 10) + '" style="width:55px;padding:5px"></td><td><button class="px-btn g" style="padding:3px 8px;font-size:.7rem" data-dzdel>' + s.del + '</button></td></tr>';
  }

  P.register({ key: 'aid', icon: '✚', bg: 'linear-gradient(135deg,#FFE8EC,#FFC7D1)', cat: 'people', render: renderAid,
    nav: { zh: ['岗前急救培训', 'CPR · AED · 最近急救物品推送手表'], ko: ['작업 전 응급처치', 'CPR · AED · 가까운 응급용품 워치 알림'], en: ['Pre-shift first aid', 'CPR · AED · nearest kit to the watch'] } });
  P.register({ key: 'dust', icon: '🌫', bg: 'linear-gradient(135deg,#F1F4F8,#D3DAE6)', cat: 'real', render: renderDust,
    nav: { zh: ['粉尘个人吸入量', '个体 TWA · 口罩 · 50/80/100% 通知'], ko: ['분진 개인 흡입량', '개인 TWA · 마스크 · 50/80/100% 알림'], en: ['Personal dust intake', 'Personal TWA · mask · 50/80/100% alerts'] } });
  var RM = { zh: [['岗前急救培训 + 最近急救物品推送', 'done', '本平台 · 岗前急救培训；firstaid.html', '2025 韩国心肺复苏指南；应急医疗法第 47 条之 2'], ['粉尘个人吸入量（个体 TWA）', 'done', '本平台 · 粉尘个人吸入量；现场端口罩识别', '韩国暴露标准 TWA 计算式']],
    ko: [['작업 전 응급처치 + 가까운 응급용품 알림', 'done', '플랫폼 · 작업 전 응급처치; firstaid.html', '2025 한국 심폐소생술 가이드라인; 응급의료법 제47조의2'], ['분진 개인 흡입량(개인 TWA)', 'done', '플랫폼 · 분진 개인 흡입량; 현장 마스크 인식', '노출기준 TWA 계산식']],
    en: [['Pre-shift first aid + nearest equipment alert', 'done', 'Platform · Pre-shift first aid; firstaid.html', '2025 Korean CPR Guidelines; Emergency Medical Service Act Art. 47-2'], ['Personal dust intake (individual TWA)', 'done', 'Platform · Dust intake; field mask detection', 'Korean exposure-standard TWA formula']] };
  ['zh', 'ko', 'en'].forEach(function (l) { P.STR[l].rm_items = RM[l].concat(P.STR[l].rm_items); });
})();
