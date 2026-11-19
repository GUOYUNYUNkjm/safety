/* SHine-K 3.0 · 作业管理：电子作业票 · 人员名单 · 隐患 / 未遂上报 · 安全积分 · 系统对接 · 设置
 * 所有数据在 SHKStore（每台电脑浏览器一份，同一房间码自动同步）。没有后台服务器。
 */
(function () {
  'use strict';
  var t = SHKI18N.t, $ = function (id) { return document.getElementById(id); };
  var Z = {
    zh: { ops: '作业管理', tab_permits: '📄 电子作业票', tab_roster: '👷 人员名单', tab_reports: '⚠ 隐患 / 未遂', tab_points: '🏆 积分排名', tab_api: '🔌 系统对接', tab_cfg: '⚙ 设置',
      p_new: '＋ 新建作业票', p_type: '作业类型', p_zone: '作业区域', p_title: '作业内容', p_app: '申请人', p_workers: '作业人员（只有他们进入作业区不告警）', p_guard: '监护人', p_start: '开始', p_end: '结束',
      p_measures: '安全措施确认', p_gas: '气体检测', p_gas_at: '检测时间', p_gas_by: '检测人', p_save: '保存草稿', p_submit: '提交审批', p_approve: '批准并开始作业', p_approver: '审批人',
      p_freeze: '冻结', p_resume: '恢复作业', p_close: '关闭（验收）', p_reason: '原因', p_log: '记录', p_none: '还没有作业票。先在现场端画好危险区域并勾选「需要作业票」。',
      p_need_zone: '请先在现场端画危险区域（勾选「需要作业票」），这里才能选区域。', p_gas_bad: '气体不合格：{x}', p_gas_old: '气体检测超过 {m} 分钟，请重新检测', p_need_gas: '这类作业要先录入合格的气体检测',
      p_need_workers: '至少选一名作业人员', p_need_guard: '这类作业必须指定监护人', p_all: '全部', p_open: '进行中', p_add_gas: '录入新的检测值', p_filter: '筛选',
      r_add: '＋ 添加人员', r_import: '导入 CSV', r_export: '导出 CSV', r_code: '工号', r_name: '姓名', r_team: '班组', r_role: '岗位', r_age: '年龄', r_rest: '静息心率', r_watch: '手表编号',
      role_worker: '作业人员', role_guardian: '监护人', role_leader: '班组长', role_safety: '安全员', r_csv_hint: 'CSV 第一行：工号,姓名,班组,岗位,年龄,静息心率,手表编号。姓名只保存在本机浏览器，不发到公共服务器。', r_save: '保存', r_del: '删除', r_none: '名单为空',
      rp_new: '新上报', rp_accept: '采纳（加分）', rp_reject: '驳回', rp_fixed: '已整改', rp_none: '还没有上报。工人在手机端提交后会出现在这里。', rp_hazard: '隐患', rp_nearmiss: '未遂事件', st_new: '待审核', st_accepted: '已采纳', st_rejected: '已驳回', st_fixed: '已整改',
      sev_low: '一般', sev_mid: '较大', sev_high: '重大', pt_rank_w: '个人排名', pt_rank_t: '班组排名', pt_ledger: '积分记录', pt_award: '手动加减分', pt_delta: '分数', pt_add: '记录', pt_rules: '积分规则',
      pt_r1: '隐患上报被采纳：一般 +5，较大 +10，重大 +20', pt_r2: '未遂事件上报被采纳：一般 +10，较大 +15，重大 +30（鼓励主动上报）', pt_r3: '作业票正常关闭：每名作业人员 +5，监护人 +5', pt_r4: '进入危险区域违规且升级为红色（身份已识别）：−5',
      api_title: '和企业现有系统对接', api_intro: '本平台没有自己的服务器，对外的接口是：① Webhook（事件发生时 POST 到你的系统）② MQTT 主题（双向，实时）③ JSON / CSV 导入导出。正式使用时请用企业自己的 MQTT 服务器和网关。',
      api_sys: '系统', api_out: '本平台发出', api_in: '本平台接收', api_how: '方式', api_hook: 'Webhook 地址', api_ev: '推送哪些事件', api_test: '发送测试', api_sim: '模拟外部系统发来的数据', api_topics: 'MQTT 主题', api_export: '导出全部数据 JSON', api_importj: '导入 JSON',
      sim_gas: '气体检测仪：硫化氢 12 ppm', sim_gas_ok: '气体检测仪：正常', sim_fire: '消防主机：火警', sim_access: '门禁：刷卡进入', sim_zone: '区域', sim_worker: '工号',
      cfg_gas: '气体合格范围', cfg_wind: '高处 / 吊装停止作业风速（m/s）', cfg_gasmin: '气体检测有效时间（分钟）', cfg_saved: '已保存', cfg_save: '保存设置',
      ok: '确定', cancel: '取消', edit: '编辑', at: '时间', by: '操作人', note_local: '数据保存在这台电脑的浏览器里；输入房间码后与其他电脑同步。' },
    ko: { ops: '작업 관리', tab_permits: '📄 전자 작업허가', tab_roster: '👷 인원 명단', tab_reports: '⚠ 위험요인 / 아차사고', tab_points: '🏆 포인트 순위', tab_api: '🔌 시스템 연계', tab_cfg: '⚙ 설정',
      p_new: '＋ 작업허가 작성', p_type: '작업 유형', p_zone: '작업 구역', p_title: '작업 내용', p_app: '신청자', p_workers: '작업자 (이들만 들어가도 경보 없음)', p_guard: '감시자', p_start: '시작', p_end: '종료',
      p_measures: '안전조치 확인', p_gas: '가스 측정', p_gas_at: '측정 시각', p_gas_by: '측정자', p_save: '임시저장', p_submit: '승인 요청', p_approve: '승인 후 작업 시작', p_approver: '승인자',
      p_freeze: '동결', p_resume: '작업 재개', p_close: '종료 (완료 확인)', p_reason: '사유', p_log: '기록', p_none: '작업허가가 없습니다. 먼저 현장 화면에서 위험구역을 그리고 「작업허가 필요」를 체크하세요.',
      p_need_zone: '현장 화면에서 위험구역(작업허가 필요)을 먼저 그려야 구역을 고를 수 있습니다.', p_gas_bad: '가스 부적합: {x}', p_gas_old: '가스 측정 후 {m}분 경과, 다시 측정하세요', p_need_gas: '이 작업은 적합한 가스 측정값이 먼저 필요합니다',
      p_need_workers: '작업자를 한 명 이상 선택하세요', p_need_guard: '이 작업은 감시자가 필요합니다', p_all: '전체', p_open: '진행 중', p_add_gas: '새 측정값 입력', p_filter: '필터',
      r_add: '＋ 인원 추가', r_import: 'CSV 가져오기', r_export: 'CSV 내보내기', r_code: '사번', r_name: '이름', r_team: '반', r_role: '직무', r_age: '나이', r_rest: '안정 심박', r_watch: '워치 번호',
      role_worker: '작업자', role_guardian: '감시자', role_leader: '반장', role_safety: '안전관리자', r_csv_hint: 'CSV 첫 줄: 사번,이름,반,직무,나이,안정심박,워치번호. 이름은 이 브라우저에만 저장되고 공용 서버로 보내지 않습니다.', r_save: '저장', r_del: '삭제', r_none: '명단 없음',
      rp_new: '신규', rp_accept: '채택 (포인트)', rp_reject: '반려', rp_fixed: '조치 완료', rp_none: '신고가 없습니다. 작업자가 휴대폰에서 제출하면 여기에 표시됩니다.', rp_hazard: '위험요인', rp_nearmiss: '아차사고', st_new: '검토 대기', st_accepted: '채택', st_rejected: '반려', st_fixed: '조치 완료',
      sev_low: '일반', sev_mid: '중대', sev_high: '심각', pt_rank_w: '개인 순위', pt_rank_t: '반 순위', pt_ledger: '포인트 기록', pt_award: '수동 가감점', pt_delta: '점수', pt_add: '기록', pt_rules: '포인트 규칙',
      pt_r1: '위험요인 신고 채택: 일반 +5, 중대 +10, 심각 +20', pt_r2: '아차사고 신고 채택: 일반 +10, 중대 +15, 심각 +30 (자발적 신고 장려)', pt_r3: '작업허가 정상 종료: 작업자 +5, 감시자 +5', pt_r4: '위험구역 위반이 빨간 경보로 격상 (신원 확인): −5',
      api_title: '기존 시스템과 연계', api_intro: '이 플랫폼은 자체 서버가 없습니다. 외부 인터페이스: ① Webhook(이벤트 발생 시 POST) ② MQTT 토픽(양방향 실시간) ③ JSON / CSV 가져오기·내보내기. 실제 운영에서는 회사 MQTT 서버와 게이트웨이를 사용하세요.',
      api_sys: '시스템', api_out: '보내는 데이터', api_in: '받는 데이터', api_how: '방식', api_hook: 'Webhook 주소', api_ev: '보낼 이벤트', api_test: '테스트 전송', api_sim: '외부 시스템 데이터 시뮬레이션', api_topics: 'MQTT 토픽', api_export: '전체 데이터 JSON 내보내기', api_importj: 'JSON 가져오기',
      sim_gas: '가스 측정기: 황화수소 12 ppm', sim_gas_ok: '가스 측정기: 정상', sim_fire: '소방 수신기: 화재', sim_access: '출입통제: 카드 출입', sim_zone: '구역', sim_worker: '사번',
      cfg_gas: '가스 적합 범위', cfg_wind: '고소 / 양중 작업 중지 풍속 (m/s)', cfg_gasmin: '가스 측정 유효 시간 (분)', cfg_saved: '저장됨', cfg_save: '설정 저장',
      ok: '확인', cancel: '취소', edit: '편집', at: '시각', by: '처리자', note_local: '데이터는 이 컴퓨터 브라우저에 저장되며, 방 코드를 입력하면 다른 컴퓨터와 동기화됩니다.' },
    en: { ops: 'Operations', tab_permits: '📄 Work permits', tab_roster: '👷 Roster', tab_reports: '⚠ Hazards / near misses', tab_points: '🏆 Points', tab_api: '🔌 Integration', tab_cfg: '⚙ Settings',
      p_new: '＋ New permit', p_type: 'Work type', p_zone: 'Work area', p_title: 'Work description', p_app: 'Applicant', p_workers: 'Workers (only they may enter without alarm)', p_guard: 'Guardian', p_start: 'Start', p_end: 'End',
      p_measures: 'Safety measures', p_gas: 'Gas test', p_gas_at: 'Tested at', p_gas_by: 'Tested by', p_save: 'Save draft', p_submit: 'Submit for approval', p_approve: 'Approve and start', p_approver: 'Approver',
      p_freeze: 'Freeze', p_resume: 'Resume work', p_close: 'Close (sign off)', p_reason: 'Reason', p_log: 'Log', p_none: 'No permits yet. First draw a danger zone on the field page and tick “Permit required”.',
      p_need_zone: 'Draw a danger zone with “Permit required” on the field page first.', p_gas_bad: 'Gas out of range: {x}', p_gas_old: 'Gas test is over {m} min old, test again', p_need_gas: 'This work type needs a passing gas test first',
      p_need_workers: 'Select at least one worker', p_need_guard: 'This work type needs a guardian', p_all: 'All', p_open: 'Open', p_add_gas: 'Enter new reading', p_filter: 'Filter',
      r_add: '＋ Add person', r_import: 'Import CSV', r_export: 'Export CSV', r_code: 'ID', r_name: 'Name', r_team: 'Team', r_role: 'Role', r_age: 'Age', r_rest: 'Resting HR', r_watch: 'Watch ID',
      role_worker: 'Worker', role_guardian: 'Guardian', role_leader: 'Team leader', role_safety: 'Safety officer', r_csv_hint: 'CSV header: id,name,team,role,age,resting_hr,watch. Names stay in this browser and are never sent to the public broker.', r_save: 'Save', r_del: 'Delete', r_none: 'Roster is empty',
      rp_new: 'New', rp_accept: 'Accept (award points)', rp_reject: 'Reject', rp_fixed: 'Fixed', rp_none: 'No reports yet. They appear here when workers submit them on their phones.', rp_hazard: 'Hazard', rp_nearmiss: 'Near miss', st_new: 'To review', st_accepted: 'Accepted', st_rejected: 'Rejected', st_fixed: 'Fixed',
      sev_low: 'Minor', sev_mid: 'Major', sev_high: 'Serious', pt_rank_w: 'Individuals', pt_rank_t: 'Teams', pt_ledger: 'Ledger', pt_award: 'Manual adjustment', pt_delta: 'Points', pt_add: 'Record', pt_rules: 'Rules',
      pt_r1: 'Hazard report accepted: minor +5, major +10, serious +20', pt_r2: 'Near-miss report accepted: minor +10, major +15, serious +30 (to encourage reporting)', pt_r3: 'Permit closed normally: each worker +5, guardian +5', pt_r4: 'Danger-zone violation escalated to red (identified person): −5',
      api_title: 'Connect to existing systems', api_intro: 'This platform has no server of its own. Interfaces: ① Webhook (POST when events happen) ② MQTT topics (two-way, real time) ③ JSON / CSV import and export. In production use your own MQTT broker and gateway.',
      api_sys: 'System', api_out: 'We send', api_in: 'We receive', api_how: 'How', api_hook: 'Webhook URL', api_ev: 'Events to push', api_test: 'Send test', api_sim: 'Simulate data from external systems', api_topics: 'MQTT topics', api_export: 'Export all data (JSON)', api_importj: 'Import JSON',
      sim_gas: 'Gas detector: H₂S 12 ppm', sim_gas_ok: 'Gas detector: normal', sim_fire: 'Fire panel: fire alarm', sim_access: 'Access control: badge in', sim_zone: 'Zone', sim_worker: 'Worker ID',
      cfg_gas: 'Gas limits', cfg_wind: 'Stop height / lifting work at wind (m/s)', cfg_gasmin: 'Gas test valid for (min)', cfg_saved: 'Saved', cfg_save: 'Save settings',
      ok: 'OK', cancel: 'Cancel', edit: 'Edit', at: 'Time', by: 'By', note_local: 'Data is stored in this computer’s browser and synced with others after entering a room code.' }
  };
  SHKI18N.add(Z);
  var MEASURES = {
    zh: { hot: ['动火点周围可燃物已清理', '动火分析合格', '灭火器 / 消防水带到位', '与设备管道隔离、吹扫置换', '监护人在场'], confined: ['与相连管道隔离（盲板 / 断开）、断电挂牌', '清洗置换并强制通风', '气体检测合格并持续监测', '救援器材（三脚架、正压呼吸器）到位', '监护人守在出入口'],
      blind: ['管道已降压、排空', '盲板位置有编号和标识', '气体检测合格', '佩戴防毒 / 防酸碱防护用品'], height: ['安全带 / 防坠器挂在牢固处', '脚手架或作业平台已验收', '下方设警戒区', '确认风速和天气'],
      lift: ['吊具、钢丝绳检查合格', '设置吊装警戒区，无人员停留', '指挥人员到位', '确认风速'], elec: ['由持证电工接线', '装漏电保护器', '线路和接地检查'], dig: ['已确认地下管线 / 电缆位置', '边坡支护或放坡', '设置警戒标识'],
      break: ['设置交通警示和绕行标志', '确认不影响消防通道', '夜间设警示灯'], danger: ['已进行风险辨识', '已对作业人员安全交底'] },
    ko: { hot: ['화기 주변 가연물 제거', '화기작업 가스 분석 적합', '소화기 / 소방호스 배치', '설비·배관 격리, 퍼지·치환', '감시자 현장 배치'], confined: ['연결 배관 격리(맹판/분리), 전원 차단·잠금표지', '세정·치환 및 강제 환기', '가스 측정 적합, 연속 측정', '구조장비(삼각대, 공기호흡기) 비치', '감시자 출입구 대기'],
      blind: ['배관 감압·배출 완료', '맹판 위치 번호·표식', '가스 측정 적합', '방독 / 내산·내알칼리 보호구 착용'], height: ['안전대 / 추락방지대 견고한 곳에 체결', '비계·작업발판 검수 완료', '하부 출입 통제', '풍속·날씨 확인'],
      lift: ['달기구·와이어로프 점검 적합', '양중 작업반경 출입 통제', '신호수 배치', '풍속 확인'], elec: ['자격 있는 전기공이 결선', '누전차단기 설치', '선로·접지 점검'], dig: ['지하 매설물 위치 확인', '흙막이 또는 경사면 확보', '경고 표지 설치'],
      break: ['교통 경고·우회 표지 설치', '소방 통로 확보 확인', '야간 경광등 설치'], danger: ['위험성 평가 실시', '작업자 안전교육 실시'] },
    en: { hot: ['Combustibles cleared around the hot-work point', 'Hot-work gas analysis passed', 'Extinguishers / hose in place', 'Equipment isolated, purged and replaced', 'Guardian present'], confined: ['Isolated from connected lines (blind / disconnected), power locked out', 'Cleaned, purged and force-ventilated', 'Gas test passed, continuous monitoring', 'Rescue kit (tripod, SCBA) ready', 'Guardian at the entrance'],
      blind: ['Line depressurized and drained', 'Blind positions numbered and tagged', 'Gas test passed', 'Toxic / chemical PPE worn'], height: ['Harness / fall arrester anchored securely', 'Scaffold or platform inspected', 'Exclusion zone below', 'Wind and weather checked'],
      lift: ['Rigging and wire ropes inspected', 'Lifting exclusion zone set, nobody under the load', 'Signaller in place', 'Wind checked'], elec: ['Wired by a licensed electrician', 'RCD installed', 'Cables and earthing checked'], dig: ['Underground pipes / cables located', 'Shoring or sloping in place', 'Warning signs set'],
      break: ['Traffic warning and detour signs', 'Fire lanes kept clear', 'Warning lights at night'], danger: ['Risk assessment done', 'Safety briefing given to workers'] }
  };
  var tr = new SHKTransport('ops'), tab = (location.hash.slice(1) && ['permits', 'roster', 'reports', 'points', 'api', 'cfg'].indexOf(location.hash.slice(1)) >= 0 ? location.hash.slice(1) : null) || localStorage.getItem('shk3_opstab') || 'permits', editP = null, editR = null, pFilter = 'open';
  SHKStore.attach(tr);

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function roster() { return SHKStore.all('roster').sort(function (a, b) { return String(a.id).localeCompare(String(b.id)); }); }
  function rName(code) { var r = SHKStore.get('roster', code); return r ? (r.name ? r.name + ' (' + r.id + ')' : r.id) : code; }
  function dt(v) { if (!v) return ''; var d = new Date(v), p = function (n) { return ('0' + n).slice(-2); }; return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes()); }
  function zones() { return SHKStore.all('zones'); }
  function zName(id) { var z = SHKStore.get('zones', id); return z ? z.site + ' · ' + z.name : id; }
  function me() { return localStorage.getItem('shk3_opsuser') || ''; }

  /* ---------- 页面框架 ---------- */
  function langs() {
    document.querySelectorAll('.langs button').forEach(function (b) {
      b.classList.toggle('on', b.dataset.l === SHKI18N.lang);
      b.onclick = function () { SHKI18N.set(b.dataset.l); langs(); render(); };
    });
  }
  function render() {
    SHKI18N.apply(); $('opsTitle').textContent = t('ops'); document.title = 'SHine-K 3.0 · ' + t('ops');
    var tabs = ['permits', 'roster', 'reports', 'points', 'api', 'cfg'];
    var nNew = SHKStore.all('reports').filter(function (r) { return r.status === 'new'; }).length;
    var nFz = SHKPermit.all().filter(function (p) { return p.status === 'frozen'; }).length;
    $('tabs').innerHTML = tabs.map(function (k) {
      var badge = k === 'reports' && nNew ? '<i>' + nNew + '</i>' : k === 'permits' && nFz ? '<i>' + nFz + '</i>' : '';
      return '<button data-t="' + k + '" class="' + (k === tab ? 'on' : '') + '">' + t('tab_' + k) + badge + '</button>';
    }).join('');
    $('tabs').querySelectorAll('button').forEach(function (b) { b.onclick = function () { tab = b.dataset.t; localStorage.setItem('shk3_opstab', tab); editP = editR = null; render(); }; });
    var f = { permits: permits, roster: rosterTab, reports: reports, points: points, api: api, cfg: cfg }[tab];
    f($('main'));
  }

  /* ================= 电子作业票 ================= */
  function permits(box) {
    if (editP) return permitForm(box);
    var list = SHKPermit.all().sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
    if (pFilter === 'open') list = list.filter(function (p) { return p.status !== 'closed'; });
    box.innerHTML = '<div class="row" style="gap:8px;margin-bottom:12px"><button class="pri" data-new>' + t('p_new') + '</button><span class="sp"></span>' +
      '<div class="seg"><button data-f="open" class="' + (pFilter === 'open' ? 'on' : '') + '">' + t('p_open') + '</button><button data-f="all" class="' + (pFilter === 'all' ? 'on' : '') + '">' + t('p_all') + '</button></div></div>' +
      (list.length ? list.map(permitCard).join('') : '<div class="card"><div class="empty">' + t('p_none') + '</div></div>');
    box.querySelector('[data-new]').onclick = function () {
      var now = Date.now(); editP = { type: 'hot', start: now, end: now + 4 * 3600000, workers: [], measures: {}, applicant: me() }; render();
    };
    box.querySelectorAll('[data-f]').forEach(function (b) { b.onclick = function () { pFilter = b.dataset.f; render(); }; });
    box.querySelectorAll('[data-act]').forEach(function (b) { b.onclick = function () { act(b.dataset.id, b.dataset.act); }; });
    box.querySelectorAll('[data-gas]').forEach(function (b) { b.onclick = function () { addGas(b.dataset.gas, b.closest('.pcard')); }; });
  }
  function gasTxt(g) {
    if (!g) return '<span class="muted">' + t('gas_none') + '</span>';
    var c = SHKPermit.gasCheck(g), L = SHKPermit.limits();
    var one = function (k, u) { if (g[k] == null || g[k] === '') return ''; var bad = c.bad.indexOf(k) >= 0; return '<span class="tag ' + (bad ? 'no' : 'ok') + '">' + t('g_' + k) + ' ' + g[k] + u + '</span>'; };
    return one('o2', '%') + one('lel', '%LEL') + one('h2s', 'ppm') + one('co', 'ppm') + ' <small class="muted">' + (g.at ? new Date(g.at).toLocaleTimeString() : '') + (g.by ? ' · ' + esc(g.by) : '') + '</small>' +
      (c.old ? ' <span class="tag q">' + t('gas_old', { m: L.gasValidMin }) + '</span>' : '');
  }
  function permitCard(p) {
    var st = SHKPermit.status(p), T = SHKPermit.TYPES[p.type] || {};
    var acts = [];
    if (st === 'draft') acts.push(['submit', t('p_submit'), 'pri'], ['edit', t('edit'), '']);
    if (st === 'pending') acts.push(['approve', t('p_approve'), 'pri'], ['edit', t('edit'), '']);
    if (st === 'active') acts.push(['freeze', t('p_freeze'), 'dng'], ['close', t('p_close'), '']);
    if (st === 'frozen' || st === 'expired') acts.push(['resume', t('p_resume'), 'pri'], ['close', t('p_close'), '']);
    return '<div class="card pcard ' + st + '"><div class="phd"><i style="background:' + SHKPermit.color(p.type) + '"></i><b>' + esc(SHKPermit.typeName(p.type)) + ' · ' + esc(zName(p.zone)) + '</b>' +
      '<span class="tag ' + (st === 'active' ? 'ok' : st === 'frozen' || st === 'expired' ? 'no' : 'q') + '">' + t('ps_' + st) + '</span><span class="muted mono">' + esc(p.id) + '</span><span class="sp"></span>' +
      acts.map(function (a) { return '<button class="' + a[2] + '" data-act="' + a[0] + '" data-id="' + esc(p.id) + '">' + a[1] + '</button>'; }).join('') + '</div>' +
      (p.freeze && (st === 'frozen') ? '<div class="note dng">❄ ' + esc(p.freeze.reason) + ' · ' + new Date(p.freeze.at).toLocaleString() + (p.freeze.by ? ' · ' + esc(p.freeze.by) : '') + '</div>' : '') +
      '<div class="pgrid"><div><small>' + t('p_title') + '</small>' + esc(p.title || '—') + '</div><div><small>' + t('p_start') + ' – ' + t('p_end') + '</small>' + (p.start ? new Date(p.start).toLocaleString() : '') + ' – ' + (p.end ? new Date(p.end).toLocaleString() : '') + '</div>' +
      '<div><small>' + t('p_workers').split('（')[0].split(' (')[0] + '</small>' + (p.workers || []).map(rName).map(esc).join('、') + '</div><div><small>' + t('p_guard') + '</small>' + (p.guardian ? esc(rName(p.guardian)) : '—') + '</div>' +
      '<div><small>' + t('p_app') + ' / ' + t('p_approver') + '</small>' + esc(p.applicant ? rName(p.applicant) : '—') + ' / ' + esc(p.approver || '—') + '</div>' +
      (T.gas ? '<div><small>' + t('p_gas') + '</small>' + gasTxt(p.gas) + ' <button class="sm" data-gas="' + esc(p.id) + '">' + t('p_add_gas') + '</button><div class="gasf"></div></div>' : '') + '</div>' +
      (p.log && p.log.length ? '<details><summary>' + t('p_log') + ' (' + p.log.length + ')</summary>' + p.log.slice().reverse().map(function (l) { return '<div class="muted" style="font-size:12px">' + new Date(l.at).toLocaleString() + ' · ' + esc(l.what) + (l.reason ? ' · ' + esc(l.reason) : '') + (l.by ? ' · ' + esc(l.by) : '') + '</div>'; }).join('') + '</details>' : '') + '</div>';
  }
  function logp(p, what, reason) { (p.log = (p.log || []).slice(-40)).push({ at: Date.now(), what: what, reason: reason || '', by: me() }); }
  function check(p) {
    var T = SHKPermit.TYPES[p.type] || {};
    if (!p.zone) return t('p_need_zone');
    if (!(p.workers || []).length) return t('p_need_workers');
    if ((T.gas || ['height', 'lift'].indexOf(p.type) >= 0) && !p.guardian) return t('p_need_guard');
    if (T.gas) { var c = SHKPermit.gasCheck(p.gas); if (c.none || !p.gas) return t('p_need_gas'); if (c.bad.length) return t('p_gas_bad', { x: c.bad.map(function (k) { return t('g_' + k); }).join('、') }); if (c.old) return t('p_gas_old', { m: SHKPermit.limits().gasValidMin }); }
    return null;
  }
  function act(id, a) {
    var p = Object.assign({}, SHKStore.get('permits', id)); if (!p.id) return;
    if (a === 'edit') { editP = p; return render(); }
    if (a === 'submit') { var e = check(p); if (e) return alertMsg(e); p.status = 'pending'; logp(p, t('p_submit')); }
    if (a === 'approve' || a === 'resume') {
      var e2 = check(p); if (e2) return alertMsg(e2);
      var who = prompt(t('p_approver'), me()); if (who == null) return; localStorage.setItem('shk3_opsuser', who);
      p.status = 'active'; p.approver = who; p.freeze = null; if (p.end && p.end < Date.now()) p.end = Date.now() + 2 * 3600000;
      logp(p, a === 'approve' ? t('p_approve') : t('p_resume'));
    }
    if (a === 'freeze') { var r = prompt(t('p_reason'), ''); if (r == null) return; p.status = 'frozen'; p.freeze = { key: 'manual', reason: t('fz_manual') + (r ? '：' + r : ''), at: Date.now(), by: me() || 'ops' }; logp(p, t('p_freeze'), r); }
    if (a === 'close') {
      p.status = 'closed'; logp(p, t('p_close'));
      (p.workers || []).concat(p.guardian ? [p.guardian] : []).forEach(function (c) { award(c, 5, t('pt_r3').split('：')[0].split(':')[0] + ' · ' + p.id, 'permit:' + p.id + ':' + c); });
    }
    SHKStore.put('permits', p); render();
  }
  function addGas(id, card) {
    var p = SHKStore.get('permits', id), f = card.querySelector('.gasf'), g = p.gas || {};
    f.innerHTML = '<div class="row" style="gap:6px;flex-wrap:wrap;margin-top:6px">' + ['o2', 'lel', 'h2s', 'co'].map(function (k) { return '<label class="mini">' + t('g_' + k) + '<input type="number" step="0.1" data-g="' + k + '" value="' + (g[k] != null ? g[k] : '') + '"></label>'; }).join('') +
      '<label class="mini">' + t('p_gas_by') + '<input data-g="by" value="' + esc(me()) + '"></label><button class="pri" data-ok>' + t('ok') + '</button></div>';
    f.querySelector('[data-ok]').onclick = function () {
      var ng = { at: Date.now() }; f.querySelectorAll('[data-g]').forEach(function (i) { var v = i.value.trim(); if (v !== '') ng[i.dataset.g] = i.dataset.g === 'by' ? v : +v; });
      var np = Object.assign({}, p, { gas: ng }); logp(np, t('p_gas'), ['o2', 'lel', 'h2s', 'co'].filter(function (k) { return ng[k] != null; }).map(function (k) { return t('g_' + k) + ' ' + ng[k]; }).join(' '));
      var c = SHKPermit.gasCheck(ng);
      SHKStore.put('permits', np);
      if (c.bad.length && np.status === 'active') SHKPermit.freeze(np, 'gas', { x: c.bad.map(function (k) { return t('g_' + k) + ' ' + ng[k]; }).join('、') }, 'ops');
      render();
    };
  }
  function permitForm(box) {
    var p = editP, zl = zones().filter(function (z) { return z.permit; }), rl = roster();
    var ms = (MEASURES[SHKI18N.lang] || MEASURES.zh)[p.type] || [];
    var opt = function (v, txt, sel) { return '<option value="' + esc(v) + '"' + (v === sel ? ' selected' : '') + '>' + esc(txt) + '</option>'; };
    box.innerHTML = '<div class="card"><h3>' + (p.id ? esc(p.id) : t('p_new')) + '</h3><div class="pform">' +
      '<label>' + t('p_type') + '<select data-k="type">' + Object.keys(SHKPermit.TYPES).filter(function (k) { return k !== 'danger'; }).map(function (k) { return opt(k, SHKPermit.typeName(k), p.type); }).join('') + '</select></label>' +
      '<label>' + t('p_zone') + (zl.length ? '<select data-k="zone"><option value=""></option>' + zl.map(function (z) { return opt(z.id, z.site + ' · ' + z.name + ' (' + SHKPermit.typeName(z.type) + ')', p.zone); }).join('') + '</select>' : '<div class="note">' + t('p_need_zone') + '</div>') + '</label>' +
      '<label class="wide">' + t('p_title') + '<input data-k="title" value="' + esc(p.title || '') + '"></label>' +
      '<label>' + t('p_start') + '<input type="datetime-local" data-k="start" value="' + dt(p.start) + '"></label><label>' + t('p_end') + '<input type="datetime-local" data-k="end" value="' + dt(p.end) + '"></label>' +
      '<label>' + t('p_app') + '<select data-k="applicant"><option value=""></option>' + rl.map(function (r) { return opt(r.id, r.id + ' ' + (r.name || ''), p.applicant); }).join('') + '</select></label>' +
      '<label>' + t('p_guard') + '<select data-k="guardian"><option value=""></option>' + rl.map(function (r) { return opt(r.id, r.id + ' ' + (r.name || '') + (r.role === 'guardian' ? ' ★' : ''), p.guardian); }).join('') + '</select></label>' +
      '<div class="wide"><small>' + t('p_workers') + '</small><div class="chks">' + (rl.length ? rl.map(function (r) { return '<label><input type="checkbox" data-w="' + esc(r.id) + '"' + ((p.workers || []).indexOf(r.id) >= 0 ? ' checked' : '') + '> ' + esc(r.id) + ' ' + esc(r.name || '') + (r.watch ? ' ⌚' : '') + '</label>'; }).join('') : '<span class="muted">' + t('r_none') + '</span>') + '</div></div>' +
      '<div class="wide"><small>' + t('p_measures') + '</small><div class="chks">' + ms.map(function (m, i) { return '<label><input type="checkbox" data-m="' + i + '"' + (p.measures && p.measures[i] ? ' checked' : '') + '> ' + esc(m) + '</label>'; }).join('') + '</div></div>' +
      '</div><div class="row" style="gap:8px;margin-top:12px"><button data-save>' + t('p_save') + '</button><button class="pri" data-sub>' + t('p_submit') + '</button><button data-cancel>' + t('cancel') + '</button><span class="muted" data-err></span></div></div>';
    var q = function (s) { return box.querySelector(s); };
    var read = function () {
      box.querySelectorAll('[data-k]').forEach(function (i) { var v = i.value; p[i.dataset.k] = i.type === 'datetime-local' ? (v ? new Date(v).getTime() : null) : v; });
      p.workers = Array.prototype.map.call(box.querySelectorAll('[data-w]:checked'), function (i) { return i.dataset.w; });
      p.measures = {}; box.querySelectorAll('[data-m]').forEach(function (i) { if (i.checked) p.measures[i.dataset.m] = true; });
    };
    q('[data-k="type"]').onchange = function () { read(); render(); };
    q('[data-cancel]').onclick = function () { editP = null; render(); };
    q('[data-save]').onclick = function () { read(); p.status = p.status || 'draft'; logp(p, t('p_save')); editP = null; SHKStore.put('permits', p); render(); };
    q('[data-sub]').onclick = function () {
      read(); p.status = 'draft';
      var ms2 = (MEASURES[SHKI18N.lang] || MEASURES.zh)[p.type] || [];
      var err = !p.zone ? t('p_need_zone') : !p.workers.length ? t('p_need_workers') : null;
      if (!err && Object.keys(p.measures).length < ms2.length) err = t('p_measures') + ' ' + Object.keys(p.measures).length + '/' + ms2.length;
      if (err) { q('[data-err]').textContent = err; return; }
      p.status = 'pending'; logp(p, t('p_submit')); editP = null; SHKStore.put('permits', p); render();
    };
  }
  function alertMsg(m) { var d = document.createElement('div'); d.className = 'toast'; d.textContent = m; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 4000); }

  /* ================= 人员名单 ================= */
  var ROLES = ['worker', 'guardian', 'leader', 'safety'];
  function rosterTab(box) {
    var rl = roster(), e = editR;
    var row = function (r) {
      if (e && e.id === r.id && e._edit) return formRow(e);
      return '<tr><td class="mono"><b>' + esc(r.id) + '</b></td><td>' + esc(r.name || '') + '</td><td>' + esc(r.team || '') + '</td><td>' + t('role_' + (r.role || 'worker')) + '</td><td>' + esc(r.age || '') + '</td><td>' + esc(r.rest || '') + '</td><td class="mono">' + esc(r.watch || '') + '</td>' +
        '<td><button class="sm" data-e="' + esc(r.id) + '">' + t('edit') + '</button> <button class="sm" data-d="' + esc(r.id) + '">' + t('r_del') + '</button></td></tr>';
    };
    function formRow(r) {
      return '<tr class="edit"><td><input data-f="id" value="' + esc(r.id || '') + '"' + (r.updatedAt ? ' readonly' : '') + '></td><td><input data-f="name" value="' + esc(r.name || '') + '"></td><td><input data-f="team" value="' + esc(r.team || '') + '"></td>' +
        '<td><select data-f="role">' + ROLES.map(function (k) { return '<option value="' + k + '"' + (k === (r.role || 'worker') ? ' selected' : '') + '>' + t('role_' + k) + '</option>'; }).join('') + '</select></td>' +
        '<td><input data-f="age" type="number" style="width:60px" value="' + esc(r.age || '') + '"></td><td><input data-f="rest" type="number" style="width:60px" value="' + esc(r.rest || '') + '"></td><td><input data-f="watch" value="' + esc(r.watch || '') + '" style="width:90px"></td>' +
        '<td><button class="pri sm" data-s>' + t('r_save') + '</button> <button class="sm" data-c>' + t('cancel') + '</button></td></tr>';
    }
    box.innerHTML = '<div class="card"><div class="row" style="gap:8px;margin-bottom:10px"><button class="pri" data-add>' + t('r_add') + '</button><label class="btn">' + t('r_import') + '<input type="file" accept=".csv,text/csv" data-imp hidden></label><button data-exp>' + t('r_export') + '</button></div>' +
      '<div class="note">' + t('r_csv_hint') + '</div><table class="tb"><thead><tr><th>' + t('r_code') + '</th><th>' + t('r_name') + '</th><th>' + t('r_team') + '</th><th>' + t('r_role') + '</th><th>' + t('r_age') + '</th><th>' + t('r_rest') + '</th><th>' + t('r_watch') + '</th><th></th></tr></thead><tbody>' +
      (e && !e.updatedAt ? formRow(e) : '') + (rl.length ? rl.map(row).join('') : (e ? '' : '<tr><td colspan="8" class="muted">' + t('r_none') + '</td></tr>')) + '</tbody></table></div>';
    var q = function (s) { return box.querySelector(s); };
    q('[data-add]').onclick = function () { editR = { _edit: true, role: 'worker' }; render(); };
    box.querySelectorAll('[data-e]').forEach(function (b) { b.onclick = function () { editR = Object.assign({ _edit: true }, SHKStore.get('roster', b.dataset.e)); render(); }; });
    box.querySelectorAll('[data-d]').forEach(function (b) { b.onclick = function () { if (confirmDel(b.dataset.d)) { SHKStore.del('roster', b.dataset.d); render(); } }; });
    if (q('[data-s]')) q('[data-s]').onclick = function () {
      var o = {}; box.querySelectorAll('tr.edit [data-f]').forEach(function (i) { o[i.dataset.f] = i.value.trim(); });
      if (!o.id) return; o.age = o.age ? +o.age : ''; o.rest = o.rest ? +o.rest : '';
      SHKStore.put('roster', Object.assign({}, SHKStore.get('roster', o.id) || {}, o)); editR = null; render();
    };
    if (q('[data-c]')) q('[data-c]').onclick = function () { editR = null; render(); };
    q('[data-imp]').onchange = function () {
      var f = this.files[0]; if (!f) return;
      f.text().then(function (txt) {
        var lines = txt.replace(/^﻿/, '').split(/\r?\n/).filter(function (l) { return l.trim(); }), n = 0;
        lines.forEach(function (l, i) {
          var c = csvSplit(l); if (i === 0 && /工号|id|사번/i.test(c[0])) return; if (!c[0]) return;
          var role = (c[3] || '').trim(), rk = /监护|guard|감시/i.test(role) ? 'guardian' : /班组长|leader|반장/i.test(role) ? 'leader' : /安全|safety|안전/i.test(role) ? 'safety' : 'worker';
          SHKStore.put('roster', Object.assign({}, SHKStore.get('roster', c[0]) || {}, { id: c[0].trim(), name: (c[1] || '').trim(), team: (c[2] || '').trim(), role: rk, age: c[4] ? +c[4] : '', rest: c[5] ? +c[5] : '', watch: (c[6] || '').trim() })); n++;
        });
        alertMsg('✓ ' + n); render();
      });
    };
    q('[data-exp]').onclick = function () {
      download('roster.csv', '﻿' + [['工号', '姓名', '班组', '岗位', '年龄', '静息心率', '手表编号']].concat(roster().map(function (r) { return [r.id, r.name, r.team, t('role_' + (r.role || 'worker')), r.age, r.rest, r.watch]; }))
        .map(function (r) { return r.map(function (v) { v = String(v == null ? '' : v); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; }).join(','); }).join('\n'), 'text/csv');
    };
  }
  function confirmDel(id) { return window.confirm(t('r_del') + ' ' + id + '?'); }
  function csvSplit(l) { var out = [], cur = '', q = false; for (var i = 0; i < l.length; i++) { var ch = l[i]; if (q) { if (ch === '"' && l[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; } else if (ch === '"') q = true; else if (ch === ',') { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out; }
  function download(name, text, type) { var u = URL.createObjectURL(new Blob([text], { type: type || 'text/plain' })), a = document.createElement('a'); a.href = u; a.download = name; a.click(); setTimeout(function () { URL.revokeObjectURL(u); }, 1000); }

  /* ================= 隐患 / 未遂 ================= */
  var PTS = { hazard: { low: 5, mid: 10, high: 20 }, nearmiss: { low: 10, mid: 15, high: 30 } };
  function award(code, delta, reason, key) {
    if (!code) return;
    if (key && SHKStore.get('points', key)) return;   // 同一件事只加一次
    SHKStore.put('points', { id: key || undefined, worker: code, delta: delta, reason: reason, at: Date.now(), by: me() });
  }
  function reports(box) {
    var list = SHKStore.all('reports').sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
    box.innerHTML = list.length ? list.map(function (r) {
      var st = r.status || 'new';
      return '<div class="card rcard ' + st + '"><div class="phd"><span class="tag ' + (r.type === 'nearmiss' ? 'q' : 'no') + '">' + t('rp_' + r.type) + '</span><span class="tag">' + t('sev_' + (r.sev || 'mid')) + '</span><b>' + esc(r.where || '') + '</b>' +
        '<span class="muted">' + esc(r.site || '') + ' · ' + (r.worker ? esc(rName(r.worker)) : '—') + ' · ' + new Date(r.at).toLocaleString() + '</span><span class="sp"></span><span class="tag ' + (st === 'accepted' || st === 'fixed' ? 'ok' : st === 'rejected' ? 'no' : 'q') + '">' + t('st_' + st) + '</span></div>' +
        '<p>' + esc(r.text) + '</p><div class="row" style="gap:6px">' +
        (st === 'new' ? '<button class="pri sm" data-ra="accept" data-id="' + esc(r.id) + '">' + t('rp_accept') + ' +' + ((PTS[r.type] || PTS.hazard)[r.sev || 'mid']) + '</button><button class="sm" data-ra="reject" data-id="' + esc(r.id) + '">' + t('rp_reject') + '</button>' : '') +
        (st === 'accepted' ? '<button class="sm" data-ra="fixed" data-id="' + esc(r.id) + '">' + t('rp_fixed') + '</button>' : '') + '</div></div>';
    }).join('') : '<div class="card"><div class="empty">' + t('rp_none') + '</div></div>';
    box.querySelectorAll('[data-ra]').forEach(function (b) {
      b.onclick = function () {
        var r = Object.assign({}, SHKStore.get('reports', b.dataset.id)), a = b.dataset.ra;
        r.status = a === 'accept' ? 'accepted' : a === 'reject' ? 'rejected' : 'fixed'; r.reviewedAt = Date.now(); r.reviewer = me();
        SHKStore.put('reports', r);
        if (a === 'accept') award(r.worker, (PTS[r.type] || PTS.hazard)[r.sev || 'mid'], t('rp_' + r.type) + ' · ' + (r.where || '').slice(0, 20), 'report:' + r.id);
        render();
      };
    });
  }

  /* ================= 积分排名 ================= */
  function points(box) {
    var led = SHKStore.all('points').sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
    var tot = {}, team = {};
    led.forEach(function (p) { tot[p.worker] = (tot[p.worker] || 0) + (+p.delta || 0); });
    roster().forEach(function (r) { if (!(r.id in tot)) tot[r.id] = 0; });
    Object.keys(tot).forEach(function (c) { var r = SHKStore.get('roster', c), tm = (r && r.team) || '—'; team[tm] = team[tm] || { sum: 0, n: 0 }; team[tm].sum += tot[c]; team[tm].n++; });
    var wr = Object.keys(tot).sort(function (a, b) { return tot[b] - tot[a]; });
    var trk = Object.keys(team).sort(function (a, b) { return team[b].sum / team[b].n - team[a].sum / team[a].n; });
    var bar = function (v, max) { return '<i class="bar" style="width:' + Math.max(2, max ? Math.round(Math.max(0, v) / max * 100) : 0) + '%"></i>'; };
    var mx = Math.max.apply(null, wr.map(function (c) { return tot[c]; }).concat([1])), mt = Math.max.apply(null, trk.map(function (k) { return team[k].sum / team[k].n; }).concat([1]));
    box.innerHTML = '<div class="grid2"><div class="card"><h3>' + t('pt_rank_w') + '</h3><table class="tb rank">' + wr.map(function (c, i) { return '<tr><td>' + (i + 1) + '</td><td>' + esc(rName(c)) + '</td><td class="bcell">' + bar(tot[c], mx) + '</td><td class="mono"><b>' + tot[c] + '</b></td></tr>'; }).join('') + '</table></div>' +
      '<div class="card"><h3>' + t('pt_rank_t') + '</h3><table class="tb rank">' + trk.map(function (k, i) { var avg = Math.round(team[k].sum / team[k].n * 10) / 10; return '<tr><td>' + (i + 1) + '</td><td>' + esc(k) + ' <small class="muted">×' + team[k].n + '</small></td><td class="bcell">' + bar(avg, mt) + '</td><td class="mono"><b>' + avg + '</b></td></tr>'; }).join('') + '</table>' +
      '<h3 style="margin-top:14px">' + t('pt_rules') + '</h3><ul class="rules"><li>' + t('pt_r1') + '</li><li>' + t('pt_r2') + '</li><li>' + t('pt_r3') + '</li><li>' + t('pt_r4') + '</li></ul></div></div>' +
      '<div class="card"><h3>' + t('pt_award') + '</h3><div class="row" style="gap:6px;flex-wrap:wrap"><select data-aw>' + roster().map(function (r) { return '<option value="' + esc(r.id) + '">' + esc(r.id + ' ' + (r.name || '')) + '</option>'; }).join('') + '</select>' +
      '<input type="number" data-ad value="5" style="width:80px"><input data-ar placeholder="' + t('p_reason') + '" style="flex:1;min-width:160px"><button class="pri" data-ago>' + t('pt_add') + '</button></div>' +
      '<h3 style="margin-top:14px">' + t('pt_ledger') + '</h3>' + (led.length ? led.slice(0, 60).map(function (p) { return '<div class="lrow"><b class="' + (p.delta >= 0 ? 'pos' : 'neg') + '">' + (p.delta > 0 ? '+' : '') + p.delta + '</b> ' + esc(rName(p.worker)) + ' · ' + esc(p.reason || '') + ' <small class="muted">' + new Date(p.at).toLocaleString() + '</small></div>'; }).join('') : '<div class="empty">—</div>') + '</div>';
    box.querySelector('[data-ago]').onclick = function () { var c = box.querySelector('[data-aw]').value, d = +box.querySelector('[data-ad]').value; if (!c || !d) return; award(c, d, box.querySelector('[data-ar]').value || t('pt_award')); render(); };
  }

  /* ================= 系统对接 ================= */
  var SYS = {
    zh: [['EHS', '警报、事件、隐患 / 未遂、作业票全过程', '风险清单、整改结果', 'Webhook / JSON'], ['ERP', '作业票关闭记录（工时、作业类型）', '工单、设备检修计划', 'Webhook / CSV'], ['MES', '区域冻结 / 停止作业状态', '产线状态、工艺报警', 'MQTT'],
      ['HR', '安全积分、违规记录', '人员名单（工号、班组、岗位、年龄）', 'CSV 导入导出'], ['门禁', '允许 / 拒绝进入（按作业票名单和防护用品）', '刷卡进入事件', 'MQTT access'], ['消防', '火警联动广播、疏散提示', '消防主机火警信号', 'MQTT fire'],
      ['环保', '气体超标冻结记录', '在线气体 / 排放监测数据', 'MQTT gas'], ['应急平台', '紧急事件（位置、人员、生命体征）', '应急指令、广播内容', 'Webhook / MQTT cmd']],
    ko: [['EHS', '경보, 이벤트, 위험요인 / 아차사고, 작업허가 전 과정', '위험성 목록, 조치 결과', 'Webhook / JSON'], ['ERP', '작업허가 종료 기록(공수, 유형)', '작업지시, 설비 정비 계획', 'Webhook / CSV'], ['MES', '구역 동결 / 작업 중지 상태', '라인 상태, 공정 경보', 'MQTT'],
      ['HR', '안전 포인트, 위반 기록', '인원 명단(사번, 반, 직무, 나이)', 'CSV'], ['출입통제', '출입 허용 / 거부 (작업허가 명단·보호구 기준)', '카드 출입 이벤트', 'MQTT access'], ['소방', '화재 연동 방송, 대피 안내', '소방 수신기 화재 신호', 'MQTT fire'],
      ['환경', '가스 초과 동결 기록', '실시간 가스 / 배출 측정값', 'MQTT gas'], ['비상대응', '긴급 이벤트(위치, 인원, 생체 신호)', '비상 지시, 방송 내용', 'Webhook / MQTT cmd']],
    en: [['EHS', 'Alerts, events, hazards / near misses, full permit history', 'Risk register, corrective actions', 'Webhook / JSON'], ['ERP', 'Closed permits (hours, work type)', 'Work orders, maintenance plans', 'Webhook / CSV'], ['MES', 'Area frozen / stop-work state', 'Line status, process alarms', 'MQTT'],
      ['HR', 'Safety points, violations', 'Roster (ID, team, role, age)', 'CSV'], ['Access control', 'Allow / deny entry (permit list and PPE)', 'Badge-in events', 'MQTT access'], ['Fire', 'Fire broadcast, evacuation prompts', 'Fire panel alarm', 'MQTT fire'],
      ['Environment', 'Gas-limit freezes', 'Online gas / emission readings', 'MQTT gas'], ['Emergency platform', 'Emergencies (location, person, vital signs)', 'Emergency orders, broadcast text', 'Webhook / MQTT cmd']]
  };
  var hook = function () { try { return JSON.parse(localStorage.getItem('shk3_hook') || '{}'); } catch (e) { return {}; } };
  var hookLog = [];
  function post(ev, data) {
    var h = hook(); if (!h.url || !(h.ev || {})[ev]) return;
    var body = JSON.stringify({ source: 'shine-k3', event: ev, at: new Date().toISOString(), data: data });
    fetch(h.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body })
      .then(function (r) { hookLog.unshift(new Date().toLocaleTimeString() + ' ' + ev + ' → ' + r.status); })
      .catch(function () {   // 对方没开跨域时退回 no-cors（收得到，但这里看不到返回结果）
        fetch(h.url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: body })
          .then(function () { hookLog.unshift(new Date().toLocaleTimeString() + ' ' + ev + ' → sent (no-cors)'); })
          .catch(function (e) { hookLog.unshift(new Date().toLocaleTimeString() + ' ' + ev + ' ✗ ' + e.message); });
      }).finally(function () { hookLog = hookLog.slice(0, 20); if (tab === 'api') { var el = $('hookLog'); if (el) el.textContent = hookLog.join('\n'); } });
  }
  function api(box) {
    var h = hook(), evs = ['alert', 'emergency', 'permit', 'report', 'points'], zl = zones();
    box.innerHTML = '<div class="card"><h3>' + t('api_title') + '</h3><p class="muted">' + t('api_intro') + '</p><table class="tb"><thead><tr><th>' + t('api_sys') + '</th><th>' + t('api_out') + '</th><th>' + t('api_in') + '</th><th>' + t('api_how') + '</th></tr></thead><tbody>' +
      (SYS[SHKI18N.lang] || SYS.zh).map(function (r) { return '<tr><td><b>' + r[0] + '</b></td><td>' + r[1] + '</td><td>' + r[2] + '</td><td class="mono">' + r[3] + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      '<div class="grid2"><div class="card"><h3>Webhook</h3><label class="mini wide">' + t('api_hook') + '<input data-hu value="' + esc(h.url || '') + '" placeholder="https://ehs.example.com/hooks/shine-k"></label><div class="chks">' +
      evs.map(function (e) { return '<label><input type="checkbox" data-he="' + e + '"' + ((h.ev || {})[e] ? ' checked' : '') + '> ' + e + '</label>'; }).join('') + '</div>' +
      '<div class="row" style="gap:6px;margin-top:8px"><button class="pri" data-hs>' + t('r_save') + '</button><button data-ht>' + t('api_test') + '</button></div><pre class="mono hlog" id="hookLog">' + esc(hookLog.join('\n')) + '</pre></div>' +
      '<div class="card"><h3>' + t('api_sim') + '</h3><div class="row" style="gap:6px;flex-wrap:wrap"><label class="mini">' + t('sim_zone') + '<select data-sz>' + zl.map(function (z) { return '<option value="' + esc(z.id) + '">' + esc(z.site + ' · ' + z.name) + '</option>'; }).join('') + '</select></label>' +
      '<label class="mini">' + t('sim_worker') + '<input data-sw style="width:90px" value="' + esc((roster()[0] || {}).id || '') + '"></label></div><div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px">' +
      '<button data-sim="gas">🧪 ' + t('sim_gas') + '</button><button data-sim="gasok">🧪 ' + t('sim_gas_ok') + '</button><button class="dng" data-sim="fire">🔥 ' + t('sim_fire') + '</button><button data-sim="access">🚪 ' + t('sim_access') + '</button></div>' +
      '<h3 style="margin-top:14px">' + t('api_topics') + '</h3><pre class="mono hlog">shine-k3/&lt;room&gt;/alert   ← { site, aid, kind, level, msg, loc, worker }\nshine-k3/&lt;room&gt;/vitals  ← { site, wid, worker, hr, risk }\nshine-k3/&lt;room&gt;/env     ← { site, t, rh, hi, level, wind, thunder }\nshine-k3/&lt;room&gt;/store   ↔ { coll: permits|reports|points|zones|roster, item }\nshine-k3/&lt;room&gt;/notify  → { to: 工号|*, level, title, body }\nshine-k3/&lt;room&gt;/cmd     → { action: say|ack|ask|release, site }\nshine-k3/&lt;room&gt;/gas     → { zone, o2, lel, h2s, co }\nshine-k3/&lt;room&gt;/fire    → { site, zone, src }\nshine-k3/&lt;room&gt;/access  → { site, zone, worker, door }  ← access_res { allow, why }</pre>' +
      '<div class="row" style="gap:6px;margin-top:8px"><button data-ex>' + t('api_export') + '</button><label class="btn">' + t('api_importj') + '<input type="file" accept=".json" data-ij hidden></label></div></div></div>';
    var q = function (s) { return box.querySelector(s); };
    var save = function () { var ev = {}; box.querySelectorAll('[data-he]').forEach(function (c) { ev[c.dataset.he] = c.checked; }); localStorage.setItem('shk3_hook', JSON.stringify({ url: q('[data-hu]').value.trim(), ev: ev })); };
    q('[data-hs]').onclick = function () { save(); alertMsg('✓'); };
    q('[data-ht]').onclick = function () { save(); var h2 = hook(); h2.ev = { test: true }; localStorage.setItem('shk3_hook', JSON.stringify(Object.assign(hook(), { ev: Object.assign({}, hook().ev, { test: true }) }))); post('test', { hello: 'SHine-K' }); };
    box.querySelectorAll('[data-sim]').forEach(function (b) {
      b.onclick = function () {
        var zid = q('[data-sz]') ? q('[data-sz]').value : '', z = SHKStore.get('zones', zid) || {}, k = b.dataset.sim;
        if (k === 'gas') { var gm = { type: 'gas', zone: zid, o2: 20.8, lel: 3, h2s: 12, co: 5, src: 'sim' }; tr.send(gm); onMsg(gm); }
        if (k === 'gasok') { var gm = { type: 'gas', zone: zid, o2: 20.9, lel: 0, h2s: 0, co: 2, src: 'sim' }; tr.send(gm); onMsg(gm); }
        if (k === 'fire') tr.send({ type: 'fire', site: z.site || 'SITE-A', zone: z.name || '', src: 'sim' });
        if (k === 'access') tr.send({ type: 'access', site: z.site || 'SITE-A', zone: zid, worker: q('[data-sw]').value.trim(), door: 'D1', src: 'sim' });
        alertMsg('→ ' + k);
      };
    });
    q('[data-ex]').onclick = function () { download('shine-k3-data.json', SHKStore.exportJSON(), 'application/json'); };
    q('[data-ij]').onchange = function () { var f = this.files[0]; if (f) f.text().then(function (x) { try { alertMsg('✓ ' + SHKStore.importJSON(x)); render(); } catch (e) { alertMsg('✗ ' + e.message); } }); };
  }
  /* 对外推送：监听通道里的事件 */
  tr.on(onMsg);
  function onMsg(m) {
    if (m.type === 'alert') { post('alert', m); if (m.emg && m.level === 'danger') post('emergency', m); }
    if (m.type === 'access_res') hookLog.unshift(new Date().toLocaleTimeString() + ' access ' + (m.allow ? '✓' : '✗ ' + (m.why || '')));
    if (m.type === 'gas' && m.zone) {   // 没开现场端时，作业管理页也按气体读数冻结
      var p = SHKPermit.forZone(m.zone), c = SHKPermit.gasCheck(m);
      if (p && p.status === 'active' && c.bad.length) SHKPermit.freeze(p, 'gas', { x: c.bad.map(function (k) { return t('g_' + k) + ' ' + m[k]; }).join('、') }, 'gas-detector', { gas: { o2: m.o2, lel: m.lel, h2s: m.h2s, co: m.co, at: Date.now(), by: m.src || 'detector' } });
    }
  }
  SHKStore.on(function (coll, item) {
    if (coll === 'permits') post('permit', item); if (coll === 'reports') post('report', item); if (coll === 'points') post('points', item);
    if (!editP && !editR && !(document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))) render();
  });

  /* ================= 设置 ================= */
  function cfg(box) {
    var L = SHKPermit.limits();
    box.innerHTML = '<div class="card"><h3>' + t('cfg_gas') + '</h3><div class="row" style="gap:8px;flex-wrap:wrap">' +
      '<label class="mini">' + t('g_o2') + ' min %<input type="number" step="0.1" data-c="o2min" value="' + L.o2[0] + '"></label><label class="mini">' + t('g_o2') + ' max %<input type="number" step="0.1" data-c="o2max" value="' + L.o2[1] + '"></label>' +
      '<label class="mini">' + t('g_lel') + ' %LEL<input type="number" step="0.1" data-c="lel" value="' + L.lel + '"></label><label class="mini">' + t('g_h2s') + ' ppm<input type="number" step="0.1" data-c="h2s" value="' + L.h2s + '"></label>' +
      '<label class="mini">' + t('g_co') + ' ppm<input type="number" step="0.1" data-c="co" value="' + L.co + '"></label><label class="mini">' + t('cfg_gasmin') + '<input type="number" data-c="gasValidMin" value="' + L.gasValidMin + '"></label>' +
      '<label class="mini">' + t('cfg_wind') + '<input type="number" step="0.1" data-c="wind" value="' + L.wind + '"></label></div>' +
      '<p class="muted" style="font-size:12px">GB 30871-2022 · GB 8958 · GBZ 2.1-2019</p><button class="pri" data-cs>' + t('cfg_save') + '</button></div>' +
      '<div class="card"><p class="muted">' + t('note_local') + '</p></div>';
    box.querySelector('[data-cs]').onclick = function () {
      var g = function (k) { return +box.querySelector('[data-c="' + k + '"]').value; };
      SHKStore.setCfg('gasLimits', { o2: [g('o2min'), g('o2max')], lel: g('lel'), h2s: g('h2s'), co: g('co'), gasValidMin: g('gasValidMin'), wind: g('wind') });
      alertMsg(t('cfg_saved'));
    };
  }

  /* ---------- 连接 ---------- */
  $('room').value = SHKTransport.savedRoom();
  tr.onState = function (s) { var p = $('pillLink'); p.className = 'pill ' + (s === 'on' || s === 'off' ? 'ok' : s === 'error' ? 'dng' : 'warn'); $('linkSt').textContent = s === 'off' ? 'local' : s === 'on' ? tr.room : s; $('btnLink').textContent = s === 'off' ? t('connect') : t('disconnect'); };
  $('btnLink').onclick = function () { if (tr.mqttState === 'off') tr.connectRoom($('room').value); else tr.disconnectRoom(); };
  tr.onState('off'); if ($('room').value) tr.connectRoom($('room').value);
  langs(); render();
  setInterval(function () { if (tab === 'permits' && !editP) { var a = document.activeElement; if (!(a && /INPUT|TEXTAREA|SELECT/.test(a.tagName))) render(); } }, 10000);
  window.SHKOps = { award: award, render: render };
})();
