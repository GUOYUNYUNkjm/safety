/* SHine-K 3.0 · 人 · 事 · 物 精进（平台端，依赖 js/shk-plus.js）
 *  人：人员分类（新员工 30 天 / 外包 / 临时工 + 师傅 + 连续夜班 → 要求复测）
 *  事：整改闭环（风险 → 整改单 → 责任人 / 期限 → 拍照验收 → 关闭）、应急演练（计时 + 记录）、交接班摘要（规则 + 大模型）
 *  物：个人噪声暴露（90 dB / 8 h，5 dB 交换率）、耗材到期（AED 电极片 / 电池、滤芯、灭火器…）
 *  （检修上锁 LOTO 在现场端「机器危险点」里）
 */
(function () {
  'use strict';
  if (!window.SHKPlus) return;
  var P = window.SHKPlus, H = P.h, esc = H.esc, jget = H.jget, jset = H.jset, lang = H.lang, DAY = H.DAY;
  var $ = function (id) { return document.getElementById(id); };
  function T(o) { return o[lang()] || o.zh; }
  var tr = null; try { tr = new SHKTransport('dash'); } catch (e) {}
  function send(m) { if (tr) try { tr.send(m); } catch (e) {} }
  function dl(name, text, type) { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type })); a.download = name; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000); }
  function dayKey(t) { var d = new Date(t); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function today0() { return new Date(new Date().toDateString()).getTime(); }
  function people() {
    var ws = (window.WORKERS || []).map(function (w) { return { id: w.id, name: w.name[lang()] || w.name.zh, age: w.age, shift: w.shift && w.shift.en }; });
    var ro = (jget('shk3_store', {}).roster) || {};
    Object.keys(ro).forEach(function (k) { var r = ro[k]; if (r && !r._del && !ws.some(function (w) { return w.id === r.id; })) ws.push({ id: r.id, name: r.name || r.id, age: r.age }); });
    return ws;
  }
  function inp(attrs, val, w) { return '<input class="px-in" ' + attrs + ' value="' + esc(val == null ? '' : val) + '" style="width:' + (w || 120) + 'px;padding:5px 8px;font-size:.8rem">'; }
  function lbl(t2, h) { return '<label style="font-size:.74rem;font-weight:700;color:var(--ink3)">' + t2 + '<br>' + h + '</label>'; }

  /* ====================== 人：人员分类 · 师傅 · 夜班 ====================== */
  var PE = {
    zh: { t: '人员分类 · 师傅 · 夜班', s: '新员工（入职 30 天内）、外包和临时工自动加强提醒：他们出现任何警报时，同时通知指定的师傅；连续夜班 3 天以上当天必须先做反应测试',
      k1: '新员工（30 天内）', k2: '外包 / 临时工', k3: '没有师傅', k4: '今日需复测', c_w: '员工', c_start: '入职日期', c_type: '类型', c_co: '外包公司', c_bud: '师傅（已结业急救员优先）', c_n: '连续夜班', c_flag: '提示',
      ty: { staff: '正式', contract: '外包', temp: '临时' }, f_new: '新员工 {d} 天', f_fa: '未急救培训', f_pvt: '需复测', f_pvt_ok: '今日已测 ✓', f_nobud: '请指定师傅', save: '保存并同步到现场端', saved: '已保存', notify: '📲 通知复测',
      how: '现场端出现与该员工有关的警告或危险（PPE、踉跄、粉尘 / 噪声、跌倒等）时，同时推送到师傅的手机和手表。连续夜班 ≥3 天且今天没有反应测试 → 标记「需复测」，可一键通知。外包工人纳入同样的岗前急救培训和风险评估，用于证据包第 9 项（承包 / 外包）。',
      ev: '外包工人纳入安全管理，对应《重大灾害处罚法》施行令第 4 条第 9 项；连续轮班会让反应时和平衡能力变差（CDC/NIOSH 研究）。' },
    ko: { t: '인력 구분 · 멘토 · 야간', s: '신규(입사 30일 이내)·협력업체·임시직은 경보가 생기면 지정한 멘토에게도 동시에 알립니다. 야간 3일 연속 이상이면 당일 반응 검사를 먼저 해야 합니다',
      k1: '신규(30일 이내)', k2: '협력·임시', k3: '멘토 없음', k4: '오늘 재검사', c_w: '직원', c_start: '입사일', c_type: '구분', c_co: '협력업체', c_bud: '멘토(응급처치 수료자 우선)', c_n: '연속 야간', c_flag: '표시',
      ty: { staff: '정규', contract: '협력업체', temp: '임시' }, f_new: '신규 {d}일', f_fa: '응급처치 미이수', f_pvt: '재검사 필요', f_pvt_ok: '오늘 검사 ✓', f_nobud: '멘토 지정', save: '저장·현장 동기화', saved: '저장됨', notify: '📲 재검사 알림',
      how: '해당 직원 관련 경고·위험(PPE, 휘청, 분진·소음, 넘어짐 등)이 생기면 멘토의 휴대폰·워치로도 보냅니다. 야간 3일 연속 이상이고 오늘 반응 검사가 없으면 「재검사 필요」로 표시하고 알림을 보낼 수 있습니다. 협력업체 근로자도 같은 응급처치 교육과 위험성평가에 포함되어 증빙 패키지 9번(도급·용역)에 반영됩니다.',
      ev: '협력업체 근로자 안전관리는 중대재해처벌법 시행령 제4조 제9호에 해당합니다. 연속 교대근무는 반응시간과 균형을 떨어뜨립니다(CDC/NIOSH).' },
    en: { t: 'People · mentors · night shifts', s: 'New starters (first 30 days), contractors and temps get extra cover: any alert about them also goes to their named mentor; after 3+ consecutive night shifts a reaction test is required that day',
      k1: 'New (≤30 days)', k2: 'Contract / temp', k3: 'No mentor', k4: 'Retest today', c_w: 'Staff', c_start: 'Start date', c_type: 'Type', c_co: 'Contractor', c_bud: 'Mentor (trained first aider first)', c_n: 'Nights in a row', c_flag: 'Flags',
      ty: { staff: 'Staff', contract: 'Contractor', temp: 'Temp' }, f_new: 'New {d} d', f_fa: 'No first aid', f_pvt: 'Retest due', f_pvt_ok: 'Tested today ✓', f_nobud: 'Assign mentor', save: 'Save & sync to field', saved: 'Saved', notify: '📲 Ask to retest',
      how: 'Warnings or dangers about this person (PPE, stumbles, dust / noise, falls…) are also pushed to the mentor\'s phone and watch. 3+ nights in a row with no reaction test today → "retest due", one click to notify. Contractors take the same first-aid induction and risk assessment, feeding evidence item 9 (contracting).',
      ev: 'Managing contractors\' safety corresponds to Art. 4(9) of the Serious Accidents Punishment Act Enforcement Decree; successive shifts impair reaction time and balance (CDC/NIOSH).' }
  };
  function syncPeople() { send({ type: 'people_sync', people: jget('shk3_px_people', {}) }); }
  setInterval(syncPeople, 30000);
  function renderPeople(p, s0) {
    var s = PE[lang()], ws = people(), map = jget('shk3_px_people', {}), pv = jget('shk3_pvt', []), fa = jget('shk3_fa_records', []).filter(function (r) { return r.pass; });
    var trained = {}; fa.forEach(function (r) { trained[r.code || r.name] = 1; });
    var isTrained = function (w) { return trained[w.id] || trained[w.name]; };
    var rows = ws.map(function (w) {
      var m = map[w.id] || {}, days = m.start ? Math.floor((Date.now() - new Date(m.start).getTime()) / DAY) : null;
      var nights = m.nights != null ? m.nights : (w.shift === 'Night' ? 3 : 0), testedToday = pv.some(function (r) { return r.who === w.id && r.ts >= today0(); });
      var flags = [];
      if (days != null && days <= 30) flags.push(['var(--w)', s.f_new.replace('{d}', days)]);
      if (!isTrained(w)) flags.push(['var(--r)', s.f_fa]);
      if (nights >= 3) flags.push(testedToday ? ['var(--g)', s.f_pvt_ok] : ['var(--r)', s.f_pvt]);
      if (((days != null && days <= 30) || m.type === 'contract' || m.type === 'temp') && !m.buddy) flags.push(['var(--r)', s.f_nobud]);
      return { w: w, m: m, days: days, nights: nights, flags: flags, retest: nights >= 3 && !testedToday };
    });
    var bud = ws.filter(isTrained).concat(ws.filter(function (w) { return !isTrained(w); }));
    p.innerHTML = H.hd(s.t, s.s) +
      '<div class="kpi-row rv">' + H.kpi('amber', s.k1, rows.filter(function (r) { return r.days != null && r.days <= 30; }).length) + H.kpi('blue', s.k2, rows.filter(function (r) { return r.m.type === 'contract' || r.m.type === 'temp'; }).length) +
      H.kpi('red', s.k3, rows.filter(function (r) { return r.flags.some(function (f) { return f[1] === s.f_nobud; }); }).length) + H.kpi('green', s.k4, rows.filter(function (r) { return r.retest; }).length) + '</div>' +
      '<div class="worker-table-wrap rv" style="overflow-x:auto"><table class="px-t" id="pe-t"><tr><th>' + s.c_w + '</th><th>' + s.c_start + '</th><th>' + s.c_type + '</th><th>' + s.c_co + '</th><th>' + s.c_bud + '</th><th>' + s.c_n + '</th><th>' + s.c_flag + '</th></tr>' +
      rows.map(function (r) {
        return '<tr data-id="' + esc(r.w.id) + '"><td><b>' + esc(r.w.name) + '</b><br><small style="color:var(--ink4)">' + esc(r.w.id) + (r.w.age ? ' · ' + r.w.age : '') + '</small></td>' +
          '<td>' + '<input class="px-in" type="date" data-f="start" value="' + esc(r.m.start || '') + '" style="padding:5px;font-size:.8rem"></td>' +
          '<td><select class="px-in" data-f="type" style="padding:5px;font-size:.8rem">' + Object.keys(s.ty).map(function (k) { return '<option value="' + k + '"' + ((r.m.type || 'staff') === k ? ' selected' : '') + '>' + s.ty[k] + '</option>'; }).join('') + '</select></td>' +
          '<td>' + inp('data-f="company"', r.m.company, 110) + '</td>' +
          '<td><select class="px-in" data-f="buddy" style="padding:5px;font-size:.8rem"><option value="">—</option>' + bud.filter(function (b) { return b.id !== r.w.id; }).map(function (b) { return '<option value="' + esc(b.id) + '"' + (r.m.buddy === b.id ? ' selected' : '') + '>' + (isTrained(b) ? '✚ ' : '') + esc(b.name) + '</option>'; }).join('') + '</select></td>' +
          '<td>' + inp('data-f="nights" type="number" min="0"', r.nights, 55) + '</td>' +
          '<td>' + r.flags.map(function (f) { return '<span class="px-pill" style="background:' + f[0] + ';color:#fff;margin:1px">' + esc(f[1]) + '</span>'; }).join(' ') + (r.retest ? ' <button class="px-btn g" style="padding:3px 8px;font-size:.7rem" data-rt="' + esc(r.w.id) + '">' + s.notify + '</button>' : '') + '</td></tr>';
      }).join('') + '</table></div>' +
      '<div class="card rv" style="margin-top:16px"><button class="px-btn" id="pe-save">' + s.save + '</button> <span id="pe-msg" style="font-size:.8rem;color:var(--g)"></span><div class="px-how">' + esc(s.how) + '</div></div>' + H.ev(s0, s.ev);
    $('pe-save').onclick = function () {
      var out = {}; p.querySelectorAll('#pe-t tr[data-id]').forEach(function (tr2) { var o = {}; tr2.querySelectorAll('[data-f]').forEach(function (e) { o[e.dataset.f] = e.dataset.f === 'nights' ? (+e.value || 0) : e.value.trim(); }); out[tr2.dataset.id] = o; });
      jset('shk3_px_people', out); syncPeople(); P.render('people'); $('pe-msg') && ($('pe-msg').textContent = s.saved);
    };
    p.querySelectorAll('[data-rt]').forEach(function (b) { b.onclick = function () { send({ type: 'notify', to: b.dataset.rt, level: 'warn', title: '⏱', body: T({ zh: '你已连续夜班 3 天以上，上岗前请先完成 30 秒反应测试。', ko: '야간 근무가 3일 이상 연속입니다. 작업 전 30초 반응 검사를 먼저 하세요.', en: 'You have worked 3+ nights in a row. Please take the 30-second reaction test before work.' }) }); b.disabled = true; }; });
  }

  /* ====================== 事：整改闭环 ====================== */
  var CA = {
    zh: { t: '整改闭环', s: '每一条风险都变成整改单：责任人 → 期限 → 拍照验收 → 关闭。超期自动提醒责任人；关闭后风险评估表显示「已整改」，可能性降一级', from_ra: '🧾 从风险评估表生成（中、高风险）', add: '＋ 手动添加', k1: '未关闭', k2: '已超期', k3: '本月关闭', k4: '平均关闭天数',
      c_t: '整改内容', c_z: '区域', c_r: '风险', c_o: '责任人', c_d: '期限', c_s: '状态', c_a: '操作', st: { open: '待处理', doing: '整改中', verify: '待验收', closed: '已关闭' }, over: '超期 {d} 天', next: '下一步 →', photo: '📷 上传验收照片并关闭', note: '验收说明', need: '关闭前请上传照片或写验收说明', remind: '📲 提醒', made: '已生成 {n} 张整改单', none: '没有整改单',
      ph_t: '整改内容', ph_o: '责任人（工号或姓名）', how: '整改单与风险评估表的行一一对应（同区域 + 同类型），不会重复生成。超期的单每天自动提醒责任人一次（责任人填工号才能推送到手机）。关闭需照片或说明，记录进入证据包。',
      ev: '风险评估流程的最后是「减灾措施的制定与执行 → 记录与共享」；关闭整改的记录也就是施行令第 4 条第 3 号「确认并改善危险因素」的执行证据。' },
    ko: { t: '개선 조치 관리', s: '모든 위험을 개선 조치로: 담당자 → 기한 → 사진 확인 → 종결. 기한 초과 시 담당자에게 자동 알림, 종결되면 위험성평가표에 「개선 완료」로 표시되고 가능성이 한 단계 낮아집니다', from_ra: '🧾 위험성평가표에서 생성(중·상)', add: '＋ 직접 추가', k1: '미종결', k2: '기한 초과', k3: '이번 달 종결', k4: '평균 종결 일수',
      c_t: '개선 내용', c_z: '구역', c_r: '위험성', c_o: '담당자', c_d: '기한', c_s: '상태', c_a: '조치', st: { open: '대기', doing: '개선 중', verify: '확인 대기', closed: '종결' }, over: '{d}일 초과', next: '다음 →', photo: '📷 확인 사진 올리고 종결', note: '확인 내용', need: '종결 전에 사진 또는 확인 내용을 입력하세요', remind: '📲 알림', made: '개선 조치 {n}건 생성', none: '개선 조치 없음',
      ph_t: '개선 내용', ph_o: '담당자(사번 또는 이름)', how: '개선 조치는 위험성평가표의 행(같은 구역 + 같은 유형)과 1:1로 연결되어 중복 생성되지 않습니다. 기한이 지나면 하루 한 번 담당자에게 알림(사번 입력 시 휴대폰으로). 종결에는 사진이나 설명이 필요하며 증빙 패키지에 기록됩니다.',
      ev: '위험성평가 절차의 마지막은 「감소대책 수립·실행 → 기록 및 공유」이며, 개선 종결 기록은 시행령 제4조 제3호 유해·위험요인 확인·개선의 이행 증빙입니다.' },
    en: { t: 'Corrective actions', s: 'Every risk becomes a ticket: owner → due date → photo check → closed. Overdue tickets remind the owner automatically; once closed, the risk assessment shows "fixed" and likelihood drops one level', from_ra: '🧾 Create from risk assessment (medium/high)', add: '＋ Add manually', k1: 'Open', k2: 'Overdue', k3: 'Closed this month', k4: 'Mean days to close',
      c_t: 'Action', c_z: 'Zone', c_r: 'Risk', c_o: 'Owner', c_d: 'Due', c_s: 'Status', c_a: '', st: { open: 'Open', doing: 'In progress', verify: 'To verify', closed: 'Closed' }, over: '{d} d overdue', next: 'Next →', photo: '📷 Upload photo & close', note: 'Verification note', need: 'Add a photo or a note before closing', remind: '📲 Remind', made: '{n} tickets created', none: 'No tickets',
      ph_t: 'Action', ph_o: 'Owner (ID or name)', how: 'Tickets map one-to-one to risk-assessment rows (same zone + type), so nothing is duplicated. Overdue tickets remind the owner once a day (an employee ID is needed to reach their phone). Closing needs a photo or note and is recorded in the evidence pack.',
      ev: 'The risk-assessment cycle ends with "plan and carry out controls → record and share"; closed tickets are the evidence of the hazard identification and improvement duty in Decree Art. 4(3).' }
  };
  function tickets() { return jget('shk3_capa', []); }
  function saveT(list) { jset('shk3_capa', list); }
  window.SHKCapa = {
    statusFor: function (rid) { var x = tickets().find(function (t2) { return t2.rid === rid; }); return x ? { st: x.status, closedAt: x.closedAt } : null; },
    fromRows: function (rows) {
      var list = tickets(), n = 0, due = new Date(Date.now() + 7 * DAY).toISOString().slice(0, 10), now0 = new Date().toISOString().slice(0, 10);
      rows.filter(function (r) { return r.r >= 3; }).forEach(function (r) {
        if (list.some(function (x) { return x.rid === r.id && x.status !== 'closed'; })) return;
        list.push({ id: 'C' + Date.now().toString(36) + n, rid: r.id, title: r.haz + ' — ' + (r.m[0] || ''), zone: r.zone, risk: r.r, owner: '', due: r.r >= 6 ? now0 : due, status: 'open', created: Date.now(), log: [] }); n++;
      });
      saveT(list); return n;
    }
  };
  setInterval(function () {       // 超期每天提醒一次
    var list = tickets(), ch = false, today = new Date().toISOString().slice(0, 10);
    list.forEach(function (x) { if (x.status !== 'closed' && x.due && x.due < today && x.owner && x.lastRemind !== today) { x.lastRemind = today; ch = true; send({ type: 'notify', to: x.owner, level: 'warn', title: '🧾 ' + T({ zh: '整改超期', ko: '개선 기한 초과', en: 'Overdue action' }), body: x.title + ' · ' + x.zone }); } });
    if (ch) saveT(list);
  }, 60000);
  function renderCapa(p, s0) {
    var s = CA[lang()], list = tickets(), today = new Date().toISOString().slice(0, 10), m0 = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    var closed = list.filter(function (x) { return x.status === 'closed'; }), avg = closed.length ? (closed.reduce(function (a, x) { return a + (x.closedAt - x.created); }, 0) / closed.length / DAY).toFixed(1) : '—';
    var order = ['open', 'doing', 'verify', 'closed'], col = { open: 'var(--r)', doing: 'var(--w)', verify: 'var(--a)', closed: 'var(--g)' };
    p.innerHTML = H.hd(s.t, s.s) +
      '<div class="kpi-row rv">' + H.kpi('red', s.k1, list.filter(function (x) { return x.status !== 'closed'; }).length) + H.kpi('amber', s.k2, list.filter(function (x) { return x.status !== 'closed' && x.due && x.due < today; }).length) + H.kpi('green', s.k3, closed.filter(function (x) { return x.closedAt >= m0; }).length) + H.kpi('blue', s.k4, avg) + '</div>' +
      '<div class="card rv" style="margin-bottom:16px;display:flex;gap:8px;flex-wrap:wrap;align-items:end"><button class="px-btn" id="ca-ra">' + s.from_ra + '</button><span style="flex:1"></span>' +
      lbl(s.ph_t, inp('id="ca-t"', '', 220)) + lbl(s.c_z, inp('id="ca-z"', '', 120)) + lbl(s.ph_o, inp('id="ca-o"', '', 120)) + lbl(s.c_d, '<input class="px-in" type="date" id="ca-d" style="padding:5px;font-size:.8rem">') + '<button class="px-btn g" id="ca-add">' + s.add + '</button><span id="ca-msg" style="font-size:.8rem;color:var(--g)"></span></div>' +
      '<div class="worker-table-wrap rv" style="overflow-x:auto"><table class="px-t"><tr><th>' + s.c_t + '</th><th>' + s.c_z + '</th><th>' + s.c_r + '</th><th>' + s.c_o + '</th><th>' + s.c_d + '</th><th>' + s.c_s + '</th><th>' + s.c_a + '</th></tr>' +
      (list.length ? list.slice().sort(function (a, b) { return order.indexOf(a.status) - order.indexOf(b.status) || (a.due || '').localeCompare(b.due || ''); }).map(function (x) {
        var od = x.status !== 'closed' && x.due && x.due < today ? Math.round((new Date(today) - new Date(x.due)) / DAY) : 0;
        return '<tr data-id="' + x.id + '"><td style="max-width:300px"><b>' + esc(x.title) + '</b>' + (x.note ? '<br><small>✓ ' + esc(x.note) + '</small>' : '') + (x.photo ? '<br><img src="' + x.photo + '" style="max-width:120px;border-radius:6px;margin-top:4px">' : '') + '</td><td>' + esc(x.zone) + '</td>' +
          '<td><span class="px-pill" style="background:' + (x.risk >= 6 ? 'var(--r)' : x.risk >= 3 ? 'var(--w)' : 'var(--g)') + ';color:#fff">' + x.risk + '</span></td>' +
          '<td>' + (x.status === 'closed' ? esc(x.owner) : inp('data-o', x.owner, 100)) + '</td><td>' + (x.status === 'closed' ? esc(x.due) : '<input class="px-in" type="date" data-d value="' + esc(x.due || '') + '" style="padding:4px;font-size:.78rem">') + (od ? '<br><b style="color:var(--r);font-size:.74rem">' + s.over.replace('{d}', od) + '</b>' : '') + '</td>' +
          '<td><span class="px-pill" style="background:' + col[x.status] + ';color:#fff">' + s.st[x.status] + '</span></td><td style="min-width:170px">' +
          (x.status === 'verify' ? inp('data-note placeholder="' + esc(s.note) + '"', '', 140) + '<br><label class="px-btn g" style="padding:4px 9px;font-size:.72rem;margin-top:4px;cursor:pointer">' + s.photo + '<input type="file" accept="image/*" capture="environment" data-ph style="display:none"></label> <button class="px-btn" style="padding:4px 9px;font-size:.72rem" data-close>✓</button>'
            : x.status !== 'closed' ? '<button class="px-btn" style="padding:4px 9px;font-size:.72rem" data-next>' + s.next + '</button> ' + (x.owner ? '<button class="px-btn g" style="padding:4px 9px;font-size:.72rem" data-rem>' + s.remind + '</button>' : '') : '<small>' + new Date(x.closedAt).toLocaleDateString() + '</small>') + '</td></tr>';
      }).join('') : '<tr><td colspan="7">' + s.none + '</td></tr>') + '</table></div>' +
      '<div class="card rv" style="margin-top:16px"><div class="px-how" style="margin:0">' + esc(s.how) + '</div></div>' + H.ev(s0, s.ev);
    function upd(id, fn) { var l = tickets(); var x = l.find(function (y) { return y.id === id; }); if (x) { fn(x); saveT(l); } }
    $('ca-ra').onclick = function () {
      var rows = (window.SHKPlus2RA && window.SHKPlus2RA()) || [];
      var n = window.SHKCapa.fromRows(rows); P.render('capa'); $('ca-msg') && ($('ca-msg').textContent = s.made.replace('{n}', n));
    };
    $('ca-add').onclick = function () { var t2 = $('ca-t').value.trim(); if (!t2) return; var l = tickets(); l.push({ id: 'C' + Date.now().toString(36), rid: null, title: t2, zone: $('ca-z').value.trim(), risk: 4, owner: $('ca-o').value.trim(), due: $('ca-d').value, status: 'open', created: Date.now(), log: [] }); saveT(l); P.render('capa'); };
    p.querySelectorAll('tr[data-id]').forEach(function (row) {
      var id = row.dataset.id, q = function (x) { return row.querySelector(x); };
      if (q('[data-o]')) q('[data-o]').onchange = function () { var v = this.value.trim(); upd(id, function (x) { x.owner = v; }); };
      if (q('[data-d]')) q('[data-d]').onchange = function () { var v = this.value; upd(id, function (x) { x.due = v; }); };
      if (q('[data-next]')) q('[data-next]').onclick = function () { upd(id, function (x) { x.status = x.status === 'open' ? 'doing' : 'verify'; x.log.push({ at: Date.now(), st: x.status }); }); P.render('capa'); };
      if (q('[data-rem]')) q('[data-rem]').onclick = function () { var x = tickets().find(function (y) { return y.id === id; }); send({ type: 'notify', to: x.owner, level: 'warn', title: '🧾', body: x.title + ' · ' + x.zone + ' · ' + (x.due || '') }); this.disabled = true; };
      if (q('[data-ph]')) q('[data-ph]').onchange = function () {
        var f = this.files[0]; if (!f) return; var img = new Image(), rd = new FileReader();
        rd.onload = function () { img.onload = function () { var c = document.createElement('canvas'), k = Math.min(1, 480 / img.width); c.width = img.width * k; c.height = img.height * k; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); row.dataset.photo = c.toDataURL('image/jpeg', 0.7); q('[data-close]').textContent = '✓ 📷'; }; img.src = rd.result; };
        rd.readAsDataURL(f);
      };
      if (q('[data-close]')) q('[data-close]').onclick = function () {
        var note = (q('[data-note]').value || '').trim(), ph = row.dataset.photo || null;
        if (!note && !ph) { alert(s.need); return; }
        upd(id, function (x) { x.status = 'closed'; x.closedAt = Date.now(); x.note = note; x.photo = ph; x.log.push({ at: Date.now(), st: 'closed' }); }); P.render('capa');
      };
    });
  }

  /* ====================== 事：应急演练 ====================== */
  var DR = {
    zh: { t: '应急演练', s: '一键模拟事故：现场端拉响演练警报、全员手机 / 手表收到通知和最近的急救物品；安全员按实际情况点下各步骤，系统计时并与目标比较，记录进入证据包（应急手册每半年至少检查一次）',
      sc: '场景', where: '位置', go: '▶ 开始演练', stop: '■ 结束并保存', run: '演练进行中', steps: [['ack', '有人确认 / 赶到现场', 60], ['call', '拨打 119（模拟）', 90], ['cpr', '开始胸外按压', 120], ['aed', 'AED 到场', 240], ['done', '移交 / 处置完毕', 600]],
      scs: { fall: '跌倒无回应', sos: 'SOS 求救', hand: '手被机器卷入', heat: '中暑晕倒', fire: '火灾疏散' }, target: '目标', ok: '达标', late: '超时', hist: '演练记录', c_d: '日期', c_s: '场景', c_r: '结果', none: '还没有演练记录', note: '备注 / 发现的问题',
      text: '{sc}，位置 {w}。这是演练，请按应急流程行动。', how: '开始后：现场端显示演练警报并语音播报（不触发 119），所有工人手机收到演练通知和离演练位置最近的 AED / 急救箱。步骤目标：确认 60 秒、拨打 119 90 秒、开始按压 2 分钟、AED 到场 4 分钟（心脏骤停黄金 4 分钟）。',
      ev: '目击者在黄金时间 4 分钟内开始心肺复苏，才能让患者在没有脑损伤等后遗症的情况下存活（大邱达西消防署）。施行令第 4 条第 8 项要求重大产业灾害应对手册每半年至少检查 1 次。' },
    ko: { t: '비상 대응 훈련', s: '사고를 한 번에 모의: 현장 화면에 훈련 경보, 모든 휴대폰·워치에 알림과 가장 가까운 응급용품. 안전관리자가 단계별로 누르면 시간을 재고 목표와 비교해 증빙 패키지에 기록합니다(대응 매뉴얼 반기 1회 이상 점검)',
      sc: '상황', where: '위치', go: '▶ 훈련 시작', stop: '■ 종료·저장', run: '훈련 진행 중', steps: [['ack', '확인 / 현장 도착', 60], ['call', '119 신고(모의)', 90], ['cpr', '가슴압박 시작', 120], ['aed', 'AED 도착', 240], ['done', '인계 / 조치 완료', 600]],
      scs: { fall: '넘어짐 무응답', sos: 'SOS 구조 요청', hand: '손 끼임', heat: '온열질환 실신', fire: '화재 대피' }, target: '목표', ok: '달성', late: '초과', hist: '훈련 기록', c_d: '날짜', c_s: '상황', c_r: '결과', none: '훈련 기록 없음', note: '메모 / 발견된 문제',
      text: '{sc}, 위치 {w}. 훈련 상황입니다. 비상 대응 절차대로 행동하세요.', how: '시작하면 현장 화면에 훈련 경보와 음성 안내(119 연계 없음), 모든 근로자 휴대폰에 훈련 알림과 훈련 위치에서 가장 가까운 AED·구급함이 갑니다. 목표: 확인 60초, 119 신고 90초, 압박 시작 2분, AED 도착 4분(심정지 골든타임 4분).',
      ev: '골든타임 4분 이내에 심폐소생술 등 응급조치를 해야 뇌손상 등 후유증 없이 생존할 수 있습니다(대구 달서소방서). 시행령 제4조 제8호: 중대산업재해 대비 매뉴얼은 반기 1회 이상 점검해야 합니다.' },
    en: { t: 'Emergency drill', s: 'One click simulates an incident: the field app sounds a drill alert and every phone / watch gets the notice plus the nearest first-aid kit. The safety officer taps each step as it happens; times are compared with targets and logged to the evidence pack (the emergency manual must be checked every half-year)',
      sc: 'Scenario', where: 'Location', go: '▶ Start drill', stop: '■ End & save', run: 'Drill running', steps: [['ack', 'Someone confirms / arrives', 60], ['call', 'Call 119 (simulated)', 90], ['cpr', 'Compressions start', 120], ['aed', 'AED arrives', 240], ['done', 'Handover / done', 600]],
      scs: { fall: 'Fall, no response', sos: 'SOS', hand: 'Hand caught in machine', heat: 'Heat collapse', fire: 'Fire evacuation' }, target: 'Target', ok: 'Met', late: 'Late', hist: 'Drill log', c_d: 'Date', c_s: 'Scenario', c_r: 'Result', none: 'No drills yet', note: 'Notes / issues found',
      text: '{sc} at {w}. This is a drill — follow the emergency procedure.', how: 'On start: the field app shows a drill alert with voice (no 119 link), every worker\'s phone gets the drill notice and the nearest AED / kit to the drill location. Targets: confirm 60 s, call 119 90 s, compressions 2 min, AED 4 min (the 4-minute golden time for cardiac arrest).',
      ev: 'CPR within the 4-minute golden time is what lets a patient survive without brain damage (Daegu Dalseo Fire Station). Decree Art. 4(8) requires the serious-accident response manual to be checked at least every half-year.' }
  };
  var drill = null;
  function renderDrill(p, s0) {
    var s = DR[lang()], hist = jget('shk3_drills', []), site = jget('shk3_site', 'SITE-A');
    var CELLS = ['A1', 'B1', 'C1', 'A2', 'B2', 'C2', 'A3', 'B3', 'C3'];
    var el = drill ? Math.round((Date.now() - drill.t0) / 1000) : 0;
    p.innerHTML = H.hd(s.t, s.s) +
      '<div class="grid-2 rv"><div class="card">' + (drill ? '<div class="px-lv" style="background:var(--r);color:#fff;display:flex;justify-content:space-between"><span>🚨 ' + s.run + ' · ' + esc(s.scs[drill.sc]) + ' · ' + esc(drill.where) + '</span><span class="mono" id="dr-clock">' + Math.floor(el / 60) + ':' + ('0' + el % 60).slice(-2) + '</span></div>' +
        '<div style="display:grid;gap:8px;margin-top:12px">' + s.steps.map(function (st) { var d = drill.laps[st[0]]; return '<button class="px-btn ' + (d != null ? 'g' : '') + '" data-lap="' + st[0] + '" style="justify-content:space-between;padding:13px 16px" ' + (d != null ? 'disabled' : '') + '><span>' + esc(st[1]) + '</span><span>' + (d != null ? d + ' s ' + (d <= st[2] ? '✓' : '⚠') : s.target + ' ≤ ' + st[2] + ' s') + '</span></button>'; }).join('') + '</div>' +
        '<textarea class="px-in" id="dr-note" rows="2" style="width:100%;margin-top:10px" placeholder="' + esc(s.note) + '"></textarea><button class="px-btn w" id="dr-stop" style="margin-top:8px">' + s.stop + '</button>'
        : '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:end">' + lbl(s.sc, '<select class="px-in" id="dr-sc">' + Object.keys(s.scs).map(function (k) { return '<option value="' + k + '">' + esc(s.scs[k]) + '</option>'; }).join('') + '</select>') +
          lbl(s.where, '<select class="px-in" id="dr-w">' + CELLS.map(function (c) { return '<option>' + site + ' · ' + c + '</option>'; }).join('') + '</select>') + '<button class="px-btn" id="dr-go" style="padding:12px 20px">' + s.go + '</button></div><div class="px-how">' + esc(s.how) + '</div>') + '</div>' +
      '<div class="card"><div class="card-title">' + s.hist + '</div><table class="px-t"><tr><th>' + s.c_d + '</th><th>' + s.c_s + '</th><th>' + s.c_r + '</th></tr>' +
      (hist.length ? hist.slice(-8).reverse().map(function (h2) { var ok = s.steps.filter(function (st) { return h2.laps[st[0]] != null && h2.laps[st[0]] <= st[2]; }).length; return '<tr><td style="font-size:.76rem">' + new Date(h2.t0).toLocaleString() + '</td><td>' + esc(s.scs[h2.sc]) + '<br><small>' + esc(h2.where) + '</small></td><td>' + s.steps.map(function (st) { var v = h2.laps[st[0]]; return '<span class="px-pill" style="margin:1px;background:' + (v == null ? 'var(--bg2);color:var(--ink4)' : v <= st[2] ? 'var(--g);color:#fff' : 'var(--w);color:#fff') + '">' + (v == null ? '—' : v + 's') + '</span>'; }).join('') + '<br><small>' + ok + '/' + s.steps.length + ' ' + s.ok + (h2.note ? ' · ' + esc(h2.note) : '') + '</small></td></tr>'; }).join('') : '<tr><td colspan="3">' + s.none + '</td></tr>') + '</table></div></div>' + H.ev(s0, s.ev);
    if ($('dr-go')) $('dr-go').onclick = function () {
      var sc = $('dr-sc').value, where = $('dr-w').value, cell = where.slice(-2), ci = CELLS.indexOf(cell), x = ((ci % 3) + 0.5) / 3, y = (Math.floor(ci / 3) + 0.5) / 3;
      drill = { id: 'D' + Date.now().toString(36), sc: sc, where: where, t0: Date.now(), laps: {} };
      var text = s.text.replace('{sc}', s.scs[sc]).replace('{w}', where);
      var pts = jget('shk3_aidpts', []), near = {}; pts.forEach(function (pt) { var d = pt.site === site ? Math.hypot(pt.x - x, pt.y - y) : 9; if (!near[pt.type] || d < near[pt.type].d) near[pt.type] = { p: pt, d: d }; });
      var aid = ['aed', 'kit'].filter(function (k) { return near[k]; }).map(function (k) { return k.toUpperCase() + ': ' + near[k].p.name; }).join(' · ');
      send({ type: 'drill', id: drill.id, text: text });
      send({ type: 'notify', to: '*', level: 'warn', title: T({ zh: '🚨【演练】', ko: '🚨[훈련]', en: '🚨 [DRILL]' }), body: text + (aid ? ' ' + aid : '') });
      timers4.dr = setInterval(function () { if (!drill || P.current() !== 'drill') return; var e = Math.round((Date.now() - drill.t0) / 1000), c = $('dr-clock'); if (c) c.textContent = Math.floor(e / 60) + ':' + ('0' + e % 60).slice(-2); }, 1000);
      P.render('drill');
    };
    p.querySelectorAll('[data-lap]').forEach(function (b) { b.onclick = function () { drill.laps[b.dataset.lap] = Math.round((Date.now() - drill.t0) / 1000); P.render('drill'); }; });
    if ($('dr-stop')) $('dr-stop').onclick = function () {
      drill.note = $('dr-note').value.trim(); drill.end = Date.now(); var h2 = jget('shk3_drills', []); h2.push(drill); jset('shk3_drills', h2.slice(-100));
      send({ type: 'drill_end', id: drill.id }); clearInterval(timers4.dr); drill = null; P.render('drill');
    };
  }
  var timers4 = {};

  /* ====================== 事：交接班摘要 ====================== */
  var HO = {
    zh: { t: '交接班摘要', s: '自动汇总本班：警报、未关闭整改单、需要关注的人（粉尘 / 噪声暴露高、反应测试不合格、反复踉跄、需复测）、体感温度。可以用大模型写成一段话，打印或复制给下一班',
      per: '本班时长', h8: '最近 8 小时', h12: '最近 12 小时', gen: '🤖 AI 写交接摘要', print: '🖨 打印', copy: '复制', copied: '已复制', save: '✓ 保存交接记录', saved: '已保存', a: '警报', ca: '未关闭整改单', ppl: '需要关注的人', heat: '体感温度', none: '无',
      d: '危险', w: '警告', top: '最多的区域', hist: '交接记录', by: '交班人', to: '接班人' },
    ko: { t: '교대 인수인계 요약', s: '이번 근무조를 자동 요약: 경보, 미종결 개선 조치, 주의 인원(분진·소음 노출 높음, 반응 검사 불합격, 반복 휘청, 재검사 필요), 체감온도. AI로 문단을 작성해 인쇄·복사로 다음 조에 전달',
      per: '근무 시간', h8: '최근 8시간', h12: '최근 12시간', gen: '🤖 AI 인수인계 작성', print: '🖨 인쇄', copy: '복사', copied: '복사됨', save: '✓ 인수인계 저장', saved: '저장됨', a: '경보', ca: '미종결 개선 조치', ppl: '주의 인원', heat: '체감온도', none: '없음',
      d: '위험', w: '경고', top: '가장 많은 구역', hist: '인수인계 기록', by: '인계자', to: '인수자' },
    en: { t: 'Shift handover', s: 'Auto summary of this shift: alerts, open actions, people to watch (high dust / noise dose, failed reaction test, repeat stumbles, retest due) and feels-like temperature. An LLM can turn it into a paragraph to print or copy for the next shift',
      per: 'Shift length', h8: 'Last 8 h', h12: 'Last 12 h', gen: '🤖 AI handover note', print: '🖨 Print', copy: 'Copy', copied: 'Copied', save: '✓ Save handover', saved: 'Saved', a: 'Alerts', ca: 'Open actions', ppl: 'People to watch', heat: 'Feels-like', none: 'None',
      d: 'danger', w: 'warning', top: 'Top zone', hist: 'Handover log', by: 'Handed over by', to: 'Taken over by' }
  };
  var hoH = 8, hoText = '';
  function dosePct(map, key, cfgKey, kind) {
    var d = (map[dayKey(Date.now())] || {})[key]; if (!d) return 0;
    if (kind === 'noise') return Math.round((d.dose || 0) * 100);
    var cfg = jget(cfgKey, {}), f = 0; Object.keys(d.zones || {}).forEach(function (z) { var c = cfg[z]; if (c && c.c > 0 && c.oel > 0) f += c.c * d.zones[z].t / 3600 / 8 / c.oel; }); return Math.round(f * 100);
  }
  function hoFacts() {
    var since = Date.now() - hoH * 3600e3, s = HO[lang()];
    var al = jget('shk3_px_alog', []).filter(function (x) { return x.t === 'alert' && x.ts >= since; }).concat(jget('shk3_px_events', []).filter(function (x) { return x.ts >= since && (x.level === 'danger' || x.level === 'warn'); }));
    var dn = al.filter(function (x) { return x.level === 'danger'; }).length, byZ = {}; al.forEach(function (x) { if (x.zone) byZ[x.zone] = (byZ[x.zone] || 0) + 1; });
    var topZ = Object.keys(byZ).sort(function (a, b) { return byZ[b] - byZ[a]; })[0];
    var open = jget('shk3_capa', []).filter(function (x) { return x.status !== 'closed'; });
    var watch = [], de = jget('shk3_dust_expo', {}), ne = jget('shk3_noise_expo', {}), dkey = dayKey(Date.now());
    Object.keys(de[dkey] || {}).forEach(function (k) { var p2 = dosePct(de, k, 'shk3_dust_zones'); if (p2 >= 50) watch.push((de[dkey][k].who || k) + ' · 🌫 ' + p2 + '%'); });
    Object.keys(ne[dkey] || {}).forEach(function (k) { var p2 = dosePct(ne, k, null, 'noise'); if (p2 >= 50) watch.push((ne[dkey][k].who || k) + ' · 🔊 ' + p2 + '%'); });
    jget('shk3_pvt', []).filter(function (r) { return r.ts >= since && r.v !== 'ok'; }).forEach(function (r) { watch.push(r.who + ' · ⏱ ' + r.med + ' ms'); });
    var nfw = {}; jget('shk3_nearfall', []).filter(function (r) { return r.ts >= since && r.worker; }).forEach(function (r) { nfw[r.worker] = (nfw[r.worker] || 0) + 1; }); Object.keys(nfw).forEach(function (k) { if (nfw[k] >= 2) watch.push(k + ' · 🦶 ' + nfw[k] + '×'); });
    var at = P.feelsKMA(H.heat().ta, H.heat().rh);
    return { s: s, n: al.length, dn: dn, topZ: topZ, open: open, watch: watch, at: at };
  }
  function renderHandover(p, s0) {
    var f = hoFacts(), s = f.s, hist = jget('shk3_handover', []);
    var facts = '• ' + s.a + ': ' + f.n + ' (' + s.d + ' ' + f.dn + ')' + (f.topZ ? ' · ' + s.top + ': ' + f.topZ : '') + '\n• ' + s.ca + ': ' + (f.open.length ? f.open.slice(0, 6).map(function (x) { return x.title + ' [' + x.zone + (x.due ? ', ' + x.due : '') + ']'; }).join('; ') : s.none) +
      '\n• ' + s.ppl + ': ' + (f.watch.length ? f.watch.join('; ') : s.none) + '\n• ' + s.heat + ': ' + f.at.toFixed(1) + '℃';
    p.innerHTML = H.hd(s.t, s.s, H.llmBar(function () { P.render('handover'); })) +
      '<div class="card rv"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:end;margin-bottom:12px">' + lbl(s.per, '<select class="px-in" id="ho-h"><option value="8"' + (hoH === 8 ? ' selected' : '') + '>' + s.h8 + '</option><option value="12"' + (hoH === 12 ? ' selected' : '') + '>' + s.h12 + '</option></select>') +
      lbl(s.by, inp('id="ho-by"', jget('shk3_ho_by', ''), 110)) + lbl(s.to, inp('id="ho-to"', '', 110)) + '<button class="px-btn" id="ho-ai">' + s.gen + '</button><button class="px-btn g" id="ho-copy">' + s.copy + '</button><button class="px-btn g" id="ho-print">' + s.print + '</button><button class="px-btn g" id="ho-save">' + s.save + '</button><span id="ho-msg" style="font-size:.8rem;color:var(--ink3)"></span></div>' +
      '<pre id="ho-facts" style="white-space:pre-wrap;font-family:inherit;font-size:.86rem;background:var(--bg2);padding:12px;border-radius:10px">' + esc(facts) + '</pre>' +
      '<div id="ho-ai-out" style="white-space:pre-wrap;font-size:.92rem;line-height:1.7;margin-top:10px">' + esc(hoText) + '</div></div>' +
      '<div class="card rv" style="margin-top:16px"><div class="card-title">' + s.hist + '</div><table class="px-t">' + (hist.length ? hist.slice(-6).reverse().map(function (h2) { return '<tr><td style="font-size:.76rem;white-space:nowrap">' + new Date(h2.ts).toLocaleString() + '<br>' + esc(h2.by || '') + ' → ' + esc(h2.to || '') + '</td><td style="font-size:.78rem;white-space:pre-wrap">' + esc(h2.text || h2.facts) + '</td></tr>'; }).join('') : '<tr><td>' + s.none + '</td></tr>') + '</table></div>';
    $('ho-h').onchange = function () { hoH = +this.value; hoText = ''; P.render('handover'); };
    $('ho-by').onchange = function () { jset('shk3_ho_by', this.value.trim()); };
    $('ho-copy').onclick = function () { try { navigator.clipboard.writeText((hoText ? hoText + '\n\n' : '') + facts); $('ho-msg').textContent = s.copied; } catch (e) {} };
    $('ho-print').onclick = function () { var w = window.open('', '_blank'); if (!w) return; w.document.write('<meta charset="utf-8"><title>' + esc(s.t) + '</title><body style="font-family:sans-serif;margin:24px"><h2>' + esc(s.t) + '</h2><p>' + new Date().toLocaleString() + ' · ' + esc($('ho-by').value) + ' → ' + esc($('ho-to').value) + '</p><pre style="white-space:pre-wrap;font-family:inherit">' + esc(facts) + '</pre><p style="white-space:pre-wrap">' + esc(hoText) + '</p></body>'); w.document.close(); setTimeout(function () { w.print(); }, 300); };
    $('ho-save').onclick = function () { var h2 = jget('shk3_handover', []); h2.push({ ts: Date.now(), by: $('ho-by').value.trim(), to: $('ho-to').value.trim(), facts: facts, text: hoText }); jset('shk3_handover', h2.slice(-200)); P.render('handover'); };
    $('ho-ai').onclick = async function () {
      var b = this; b.disabled = true; $('ho-msg').textContent = '…';
      try { hoText = (await H.ask('You write a factory shift handover note for the next team leader. Using ONLY the facts given, write at most 6 short lines: what happened, what is still open, who to watch and why, and the first 2 things to do at the start of the shift. Do not invent facts. Write in ' + T({ zh: 'Simplified Chinese', ko: 'Korean', en: 'English' }) + '.', facts, 700)).trim(); P.render('handover'); }
      catch (e) { $('ho-msg').textContent = e.message === 'NO_LLM' ? T({ zh: '请先设置大模型（右上）', ko: 'LLM을 먼저 설정하세요(오른쪽 위)', en: 'Set up an LLM first (top right)' }) : '⚠ ' + e.message; b.disabled = false; }
    };
  }

  /* ====================== 物：个人噪声暴露 ====================== */
  var NZ = {
    zh: { t: '个人噪声暴露', s: '和粉尘同一套：按“谁在哪个区域待了多久”（优先手表区域）累计每人今天的噪声剂量。韩国标准 90 dB / 8 小时、每增加 5 dB 允许时间减半，80 dB 以下不计；50 / 80 / 100 % 自动通知本人手机和手表',
      k1: '今日超过 80 %', k2: '今日最高', k3: '噪声区域', k4: '85 dB 以上区域（噪声作业）', zc: '区域噪声设置', c_z: '区域（与现场端同名）', c_db: '噪声 dB(A)', c_src: '来源', c_allow: '允许时间', add: '＋ 添加区域', save: '保存并同步到现场端', del: '删除',
      c_w: '工人', c_from: '位置来源', c_t: '在噪声区', c_dose: '剂量', c_twa: '8 h TWA', c_s: '状态', c_n: '通知', s0: '正常', s50: '≥50 %：戴耳塞 / 耳罩', s80: '≥80 %：到安静区休息', s100: '≥100 %：离开高噪声区', notify: '📲 通知', sent: '已发送', src_w: '⌚ 手表区域', src_c: '📷 摄像头', manual: '手填', mic: '麦克风',
      n0: '今日噪声暴露正常。', how: '剂量 D = Σ(在区时间 ÷ 允许时间)，允许时间 = 8 ÷ 2^((L−90)/5) 小时（80 dB 以下不计）；8 h TWA = 16.61·log10(D) + 90。区域噪声可手填（用声级计测），也可在现场端用麦克风估算（浏览器麦克风不是计量器具，需先用声级计校准偏移）。没有识别是否戴耳塞，剂量按未防护计。',
      ev: '韩国《产业安全保健标准规则》第 512 条：1 日 8 小时 85 分贝以上为噪声作业；90 分贝 8 小时、95 分贝 4 小时、100 分贝 2 小时以上为强烈噪声作业；5 dB(A) 增加时允许时间减半。' },
    ko: { t: '개인 소음 노출', s: '분진과 같은 방식: "누가 어느 구역에 얼마나 있었는지"(워치 구역 우선)로 오늘 개인 소음량을 누적합니다. 기준 90 dB/8시간, 5 dB 증가 시 허용시간 절반, 80 dB 미만 제외. 50/80/100%에서 본인 휴대폰·워치로 알림',
      k1: '오늘 80% 초과', k2: '오늘 최고', k3: '소음 구역', k4: '85 dB 이상 구역(소음작업)', zc: '구역 소음 설정', c_z: '구역(현장과 같은 이름)', c_db: '소음 dB(A)', c_src: '출처', c_allow: '허용시간', add: '＋ 구역 추가', save: '저장·현장 동기화', del: '삭제',
      c_w: '근로자', c_from: '위치 출처', c_t: '소음 구역 체류', c_dose: '소음량', c_twa: '8h TWA', c_s: '상태', c_n: '알림', s0: '정상', s50: '50% 이상: 귀마개·귀덮개', s80: '80% 이상: 조용한 곳에서 휴식', s100: '100% 이상: 고소음 구역 이탈', notify: '📲 알림', sent: '보냄', src_w: '⌚ 워치 구역', src_c: '📷 카메라', manual: '직접 입력', mic: '마이크',
      n0: '오늘 소음 노출은 정상입니다.', how: '소음량 D = Σ(체류 시간 ÷ 허용시간), 허용시간 = 8 ÷ 2^((L−90)/5)시간(80 dB 미만 제외); 8h TWA = 16.61·log10(D) + 90. 구역 소음은 소음계로 측정해 입력하거나 현장 화면 마이크로 추정(브라우저 마이크는 계측기가 아니므로 소음계로 보정 필요). 귀마개 착용 여부는 인식하지 않아 미보호로 계산합니다.',
      ev: '산업안전보건기준에 관한 규칙 제512조: 1일 8시간 85 dB 이상은 소음작업, 90 dB 8시간·95 dB 4시간·100 dB 2시간 이상은 강렬한 소음작업. 5 dB(A) 증가 시 허용시간 1/2.' },
    en: { t: 'Personal noise dose', s: 'Same approach as dust: from who stayed in which zone (watch zone first) we add up each worker\'s noise dose today. Korean criterion 90 dB for 8 h, allowed time halves every 5 dB, below 80 dB not counted; phone and watch alerts at 50 / 80 / 100 %',
      k1: 'Over 80 % today', k2: 'Highest today', k3: 'Noise zones', k4: 'Zones ≥85 dB (noise work)', zc: 'Zone noise settings', c_z: 'Zone (same name as field)', c_db: 'Noise dB(A)', c_src: 'Source', c_allow: 'Allowed time', add: '＋ Add zone', save: 'Save & sync to field', del: 'Delete',
      c_w: 'Worker', c_from: 'Location source', c_t: 'Time in noise', c_dose: 'Dose', c_twa: '8 h TWA', c_s: 'Status', c_n: 'Notify', s0: 'Normal', s50: '≥50 %: wear ear protection', s80: '≥80 %: rest somewhere quiet', s100: '≥100 %: leave the noisy area', notify: '📲 Notify', sent: 'Sent', src_w: '⌚ Watch zone', src_c: '📷 Camera', manual: 'Manual', mic: 'Microphone',
      n0: 'Your noise exposure today is normal.', how: 'Dose D = Σ(time ÷ allowed time), allowed = 8 ÷ 2^((L−90)/5) h (below 80 dB ignored); 8-h TWA = 16.61·log10(D) + 90. Zone levels are typed in from a sound level meter or estimated by the field app\'s microphone (a browser mic is not a meter — calibrate the offset once). Ear-protection use is not detected, so dose is unprotected.',
      ev: 'Korean OSH Standards Rule Art. 512: ≥85 dB over 8 h is noise work; ≥90 dB for 8 h, ≥95 dB for 4 h, ≥100 dB for 2 h is intense noise work; allowed time halves with every 5 dB(A).' }
  };
  var DEMO_NZ = { '冲压 1号线 / Press 1': { db: 95, src: 'manual' }, '打磨间 / Grinding': { db: 92, src: 'manual' }, '装配线 A / Assembly A': { db: 82, src: 'manual' } };
  function demoNoise() {
    var out = {}, base = [['W002', '李敏俊 / 이민준', { '冲压 1号线 / Press 1': 3.6 }], ['W004', '金东赫 / 김동혁', { '打磨间 / Grinding': 4 }], ['W001', '张伟明 / 장웨이밍', { '装配线 A / Assembly A': 6 }]];
    for (var d = 0; d < 7; d++) { var k = dayKey(Date.now() - d * DAY), f = [1, 0.8, 0.9, 1.1, 0.7, 0.95, 0.6][d]; out[k] = {};
      base.forEach(function (b) { var dose = 0, t = 0, zones = {}; Object.keys(b[2]).forEach(function (z) { var h = b[2][z] * f, L = DEMO_NZ[z].db; t += h * 3600; zones[z] = h * 3600; if (L >= 80) dose += h / (8 / Math.pow(2, (L - 90) / 5)); }); out[k][b[0]] = { who: b[1], dose: dose, t: t, zones: zones, src: 'watch' }; }); }
    return out;
  }
  function allowTxt(db) { if (db < 80) return '∞'; var h = 8 / Math.pow(2, (db - 90) / 5); return h >= 1 ? h.toFixed(1) + ' h' : Math.round(h * 60) + ' min'; }
  function renderNoise(p, s0) {
    var s = NZ[lang()], cfgR = jget('shk3_noise_zones', null), real = !!(cfgR && Object.keys(cfgR).length), cfg = real ? cfgR : DEMO_NZ;
    var exR = jget('shk3_noise_expo', {}), exReal = Object.keys(exR).length > 0, ex = exReal ? exR : demoNoise(), today = ex[dayKey(Date.now())] || {};
    var rows = Object.keys(today).map(function (k) { var r = today[k], pct = Math.round((r.dose || 0) * 100); return { k: k, who: r.who || k, pct: pct, t: r.t || 0, src: r.src, twa: r.dose >= 0.01 ? 16.61 * Math.log10(r.dose) + 90 : null }; }).sort(function (a, b) { return b.pct - a.pct; });
    var stOf = function (x) { return x >= 100 ? 100 : x >= 80 ? 80 : x >= 50 ? 50 : 0; }, col = { 0: 'var(--g)', 50: '#F5B400', 80: 'var(--w)', 100: 'var(--r)' };
    var hrs = function (sec) { var m = Math.round(sec / 60); return Math.floor(m / 60) + ':' + ('0' + (m % 60)).slice(-2); };
    p.innerHTML = H.hd(s.t, s.s, H.srcBadge(exReal ? rows.length : 0, s0)) +
      '<div class="kpi-row rv">' + H.kpi('red', s.k1, rows.filter(function (r) { return r.pct >= 80; }).length) + H.kpi('amber', s.k2, (rows[0] ? rows[0].pct : 0) + '<small style="font-size:1rem">%</small>', rows[0] ? esc(rows[0].who) : '') + H.kpi('blue', s.k3, Object.keys(cfg).length) + H.kpi('green', s.k4, Object.keys(cfg).filter(function (z) { return cfg[z].db >= 85; }).length) + '</div>' +
      '<div class="worker-table-wrap rv" style="overflow-x:auto"><table class="px-t"><tr><th>' + s.c_w + '</th><th>' + s.c_from + '</th><th>' + s.c_t + '</th><th>' + s.c_dose + '</th><th>' + s.c_twa + '</th><th>' + s.c_s + '</th><th>' + s.c_n + '</th></tr>' +
      (rows.length ? rows.map(function (r) { var st = stOf(r.pct); return '<tr><td><b>' + esc(r.who) + '</b><br><small style="color:var(--ink4)">' + esc(r.k) + '</small></td><td style="font-size:.76rem">' + (r.src === 'watch' ? s.src_w : s.src_c) + '</td><td>' + hrs(r.t) + '</td>' +
        '<td><div style="display:flex;gap:6px;align-items:center"><div class="px-bar" style="width:90px"><i style="width:' + Math.min(100, r.pct) + '%;background:' + col[st] + '"></i></div><b style="color:' + col[st] + '">' + r.pct + '%</b></div></td><td>' + (r.twa != null ? r.twa.toFixed(1) + ' dB' : '—') + '</td>' +
        '<td><span class="px-pill" style="background:' + col[st] + ';color:#fff">' + s['s' + st] + '</span></td><td><button class="px-btn g" style="padding:4px 9px;font-size:.72rem" data-nt="' + esc(r.k) + '" data-p="' + st + '">' + s.notify + '</button></td></tr>'; }).join('') : '<tr><td colspan="7">—</td></tr>') + '</table></div>' +
      '<div class="card rv" style="margin-top:16px;overflow-x:auto"><div class="card-title">' + s.zc + (real ? '' : ' <span class="px-src">' + esc(s0.demo) + '</span>') + '</div><table class="px-t" id="nz-t"><tr><th>' + s.c_z + '</th><th>' + s.c_db + '</th><th>' + s.c_allow + '</th><th>' + s.c_src + '</th><th></th></tr>' +
      Object.keys(cfg).map(function (z) { return nzRow(z, cfg[z], s); }).join('') + '</table><div style="display:flex;gap:8px;margin-top:10px"><button class="px-btn g" id="nz-add">' + s.add + '</button><button class="px-btn" id="nz-save">' + s.save + '</button></div></div>' +
      '<div class="card rv" style="margin-top:16px"><div class="px-how" style="margin:0">' + esc(s.how) + '</div></div>' + H.ev(s0, s.ev);
    function bind() { p.querySelectorAll('[data-nzdel]').forEach(function (b) { b.onclick = function () { b.closest('tr').remove(); }; }); }
    bind();
    $('nz-add').onclick = function () { $('nz-t').insertAdjacentHTML('beforeend', nzRow('', { db: 85, src: 'manual' }, s)); bind(); };
    $('nz-save').onclick = function () { var out = {}; p.querySelectorAll('#nz-t tr[data-nz]').forEach(function (r) { var z = r.querySelector('[data-z]').value.trim(); if (z) out[z] = { db: +r.querySelector('[data-db]').value || 0, src: r.dataset.src || 'manual' }; }); jset('shk3_noise_zones', out); send({ type: 'noisecfg', cfg: out }); P.render('noise'); };
    p.querySelectorAll('[data-nt]').forEach(function (b) { b.onclick = function () { var lv = +b.dataset.p; send({ type: 'notify', to: b.dataset.nt, level: lv >= 100 ? 'danger' : lv ? 'warn' : 'info', title: '🔊 ' + T({ zh: '噪声暴露', ko: '소음 노출', en: 'Noise dose' }), body: lv ? T({ zh: ['', '今日噪声暴露已达允许量一半，请戴好耳塞 / 耳罩。', '今日噪声暴露已达允许量 80%，建议到安静区域休息。', '今日噪声暴露已达允许量，请离开高噪声区域。'], ko: ['', '오늘 소음 노출이 허용량의 절반입니다. 귀마개·귀덮개를 착용하세요.', '오늘 소음 노출이 허용량의 80%입니다. 조용한 곳에서 쉬세요.', '오늘 소음 노출이 허용량에 도달했습니다. 고소음 구역을 벗어나세요.'], en: ['', 'Your noise dose today is half the limit. Wear ear plugs / muffs.', 'Your noise dose today is 80% of the limit. Rest in a quiet area.', 'Your noise dose today has reached the limit. Leave the noisy area.'] })[lv === 50 ? 1 : lv === 80 ? 2 : 3] : s.n0 }); b.textContent = s.sent; b.disabled = true; }; });
  }
  function nzRow(z, c, s) { return '<tr data-nz data-src="' + esc(c.src || 'manual') + '"><td><input class="px-in" data-z value="' + esc(z) + '" style="width:190px;padding:5px 8px"></td><td><input class="px-in" data-db type="number" step="0.5" value="' + c.db + '" style="width:75px;padding:5px"></td><td>' + allowTxt(c.db) + '</td><td style="font-size:.76rem">' + (c.src === 'mic' ? '🎤 ' + s.mic : s.manual) + '</td><td><button class="px-btn g" style="padding:3px 8px;font-size:.7rem" data-nzdel>' + s.del + '</button></td></tr>'; }

  /* ====================== 物：耗材到期 ====================== */
  var EX = {
    zh: { t: '耗材与设备到期', s: 'AED 电极片和电池、防尘口罩滤芯、灭火器、急救箱药品、安全帽都有使用期限。到期前 30 天提醒，过期标红，一键通知负责人',
      k1: '已过期', k2: '30 天内到期', k3: '登记总数', k4: '正常', c_n: '物品', c_l: '位置', c_e: '到期日', c_o: '负责人', c_s: '状态', add: '＋ 添加', del: '删除', exp: '已过期 {d} 天', soon: '{d} 天后到期', ok: '正常', remind: '📲 通知', demo: '演示数据（还没有登记）',
      ty: { pads: 'AED 电极片', batt: 'AED 电池', filter: '防尘口罩滤芯', ext: '灭火器', kit: '急救箱药品', helmet: '安全帽', other: '其他' }, how: '安全帽、滤芯等的具体更换周期以产品说明和企业规定为准，这里只按登记的到期日提醒。AED 的每月检查记录在「岗前急救培训」页。' },
    ko: { t: '소모품·장비 유효기간', s: 'AED 패드·배터리, 방진마스크 필터, 소화기, 구급함 의약품, 안전모에는 사용기한이 있습니다. 30일 전 알림, 만료는 빨간색, 담당자에게 바로 알림',
      k1: '만료', k2: '30일 이내 만료', k3: '등록 수', k4: '정상', c_n: '품목', c_l: '위치', c_e: '만료일', c_o: '담당자', c_s: '상태', add: '＋ 추가', del: '삭제', exp: '{d}일 지남', soon: '{d}일 후 만료', ok: '정상', remind: '📲 알림', demo: '데모 데이터(등록 없음)',
      ty: { pads: 'AED 패드', batt: 'AED 배터리', filter: '방진마스크 필터', ext: '소화기', kit: '구급함 의약품', helmet: '안전모', other: '기타' }, how: '안전모·필터 등의 교체 주기는 제품 설명서와 회사 규정에 따르며, 여기서는 등록한 만료일로만 알립니다. AED 월간 점검은 「작업 전 응급처치」 페이지에 기록합니다.' },
    en: { t: 'Consumables & expiry', s: 'AED pads and batteries, dust-mask filters, extinguishers, first-aid kit contents and helmets all expire. Reminders 30 days ahead, red when expired, one click to notify the owner',
      k1: 'Expired', k2: 'Due ≤30 days', k3: 'Registered', k4: 'OK', c_n: 'Item', c_l: 'Location', c_e: 'Expires', c_o: 'Owner', c_s: 'Status', add: '＋ Add', del: 'Delete', exp: 'expired {d} d ago', soon: 'due in {d} d', ok: 'OK', remind: '📲 Notify', demo: 'Demo data (nothing registered)',
      ty: { pads: 'AED pads', batt: 'AED battery', filter: 'Dust-mask filter', ext: 'Extinguisher', kit: 'First-aid kit contents', helmet: 'Safety helmet', other: 'Other' }, how: 'Replacement intervals for helmets, filters etc. follow the product instructions and company rules; this page only reminds on the expiry date you enter. Monthly AED checks are logged on the first-aid page.' }
  };
  function demoEx() { var d = function (n) { return new Date(Date.now() + n * DAY).toISOString().slice(0, 10); }; return [{ id: 'e1', ty: 'pads', loc: '休息室 AED', exp: d(-5), owner: 'W004' }, { id: 'e2', ty: 'batt', loc: '休息室 AED', exp: d(240), owner: 'W004' }, { id: 'e3', ty: 'filter', loc: '打磨间', exp: d(12), owner: 'W001' }, { id: 'e4', ty: 'ext', loc: '冲压线', exp: d(90), owner: 'W002' }, { id: 'e5', ty: 'kit', loc: '冲压线 B 柱', exp: d(25), owner: 'W003' }]; }
  function renderExpiry(p, s0) {
    var s = EX[lang()], real = jget('shk3_expiry', null), list = real && real.length ? real : demoEx(), isReal = !!(real && real.length);
    var left = function (e) { return Math.ceil((new Date(e.exp) - new Date(new Date().toISOString().slice(0, 10))) / DAY); };
    list = list.slice().sort(function (a, b) { return left(a) - left(b); });
    p.innerHTML = H.hd(s.t, s.s, isReal ? '' : '<span class="px-src">' + s.demo + '</span>') +
      '<div class="kpi-row rv">' + H.kpi('red', s.k1, list.filter(function (e) { return left(e) < 0; }).length) + H.kpi('amber', s.k2, list.filter(function (e) { var l = left(e); return l >= 0 && l <= 30; }).length) + H.kpi('blue', s.k3, list.length) + H.kpi('green', s.k4, list.filter(function (e) { return left(e) > 30; }).length) + '</div>' +
      '<div class="card rv" style="margin-bottom:16px;display:flex;gap:8px;flex-wrap:wrap;align-items:end">' + lbl(s.c_n, '<select class="px-in" id="ex-ty">' + Object.keys(s.ty).map(function (k) { return '<option value="' + k + '">' + s.ty[k] + '</option>'; }).join('') + '</select>') +
      lbl(s.c_l, inp('id="ex-l"', '', 140)) + lbl(s.c_e, '<input class="px-in" type="date" id="ex-e" style="padding:5px;font-size:.8rem">') + lbl(s.c_o, inp('id="ex-o"', '', 100)) + '<button class="px-btn" id="ex-add">' + s.add + '</button></div>' +
      '<div class="worker-table-wrap rv"><table class="px-t"><tr><th>' + s.c_n + '</th><th>' + s.c_l + '</th><th>' + s.c_e + '</th><th>' + s.c_o + '</th><th>' + s.c_s + '</th><th></th></tr>' +
      list.map(function (e) { var l = left(e), c = l < 0 ? 'var(--r)' : l <= 30 ? 'var(--w)' : 'var(--g)'; return '<tr><td><b>' + esc(s.ty[e.ty] || e.ty) + '</b></td><td>' + esc(e.loc) + '</td><td>' + esc(e.exp) + '</td><td>' + esc(e.owner || '') + '</td><td><span class="px-pill" style="background:' + c + ';color:#fff">' + (l < 0 ? s.exp.replace('{d}', -l) : l <= 30 ? s.soon.replace('{d}', l) : s.ok) + '</span></td><td>' +
        (e.owner && l <= 30 ? '<button class="px-btn g" style="padding:3px 8px;font-size:.7rem" data-rm="' + e.id + '">' + s.remind + '</button> ' : '') + (isReal ? '<button class="px-btn g" style="padding:3px 8px;font-size:.7rem" data-del="' + e.id + '">' + s.del + '</button>' : '') + '</td></tr>'; }).join('') + '</table></div>' +
      '<div class="card rv" style="margin-top:16px"><div class="px-how" style="margin:0">' + esc(s.how) + '</div></div>';
    $('ex-add').onclick = function () { if (!$('ex-e').value) return; var l = isReal ? real.slice() : []; l.push({ id: 'E' + Date.now().toString(36), ty: $('ex-ty').value, loc: $('ex-l').value.trim(), exp: $('ex-e').value, owner: $('ex-o').value.trim() }); jset('shk3_expiry', l); P.render('expiry'); };
    p.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { jset('shk3_expiry', real.filter(function (e) { return e.id !== b.dataset.del; })); P.render('expiry'); }; });
    p.querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function () { var e = list.find(function (x) { return x.id === b.dataset.rm; }), l = left(e); send({ type: 'notify', to: e.owner, level: l < 0 ? 'danger' : 'warn', title: '📦 ' + (s.ty[e.ty] || e.ty), body: e.loc + ' · ' + (l < 0 ? s.exp.replace('{d}', -l) : s.soon.replace('{d}', l)) }); b.disabled = true; }; });
  }

  /* ====================== 给工人手机“我的数据”同步今日暴露 ====================== */
  setInterval(function () {
    var dk = dayKey(Date.now()), de = jget('shk3_dust_expo', {})[dk] || {}, ne = jget('shk3_noise_expo', {})[dk] || {}, dust = {}, noise = {};
    Object.keys(de).forEach(function (k) { dust[k] = dosePct(jget('shk3_dust_expo', {}), k, 'shk3_dust_zones'); });
    Object.keys(ne).forEach(function (k) { noise[k] = Math.round((ne[k].dose || 0) * 100); });
    send({ type: 'expo_sync', day: dk, dust: dust, noise: noise, retention: 90 });
  }, 20000);

  /* ====================== 注册 ====================== */
  P.register({ key: 'people', icon: '👷', bg: 'linear-gradient(135deg,#FFF6D6,#FFE79A)', cat: 'people', render: renderPeople, nav: { zh: ['人员分类 · 师傅', '新员工 · 外包 · 夜班复测'], ko: ['인력 구분 · 멘토', '신규 · 협력업체 · 야간 재검사'], en: ['People · mentors', 'New starters · contractors · nights'] } });
  P.register({ key: 'capa', icon: '🧾', bg: 'linear-gradient(135deg,#FFF1E0,#FFD9A8)', cat: 'manage', render: renderCapa, nav: { zh: ['整改闭环', '风险 → 整改 → 验收 → 关闭'], ko: ['개선 조치', '위험 → 개선 → 확인 → 종결'], en: ['Corrective actions', 'Risk → fix → verify → close'] } });
  P.register({ key: 'drill', icon: '🚨', bg: 'linear-gradient(135deg,#FFE8EC,#FFC7D1)', cat: 'manage', render: renderDrill, nav: { zh: ['应急演练', '一键模拟 · 计时 · 记录'], ko: ['비상 대응 훈련', '원클릭 모의 · 시간 측정 · 기록'], en: ['Emergency drill', 'One-click scenario · timing · log'] } });
  P.register({ key: 'handover', icon: '🔁', bg: 'linear-gradient(135deg,#E9F0FF,#C9DAFF)', cat: 'manage', render: renderHandover, nav: { zh: ['交接班摘要', '警报 · 整改 · 关注人员 · AI'], ko: ['교대 인수인계', '경보 · 개선 · 주의 인원 · AI'], en: ['Shift handover', 'Alerts · actions · people · AI'] } });
  P.register({ key: 'noise', icon: '🔊', bg: 'linear-gradient(135deg,#F3EFFE,#DED2FC)', cat: 'real', render: renderNoise, nav: { zh: ['个人噪声暴露', '90 dB / 8 h · 5 dB 交换率'], ko: ['개인 소음 노출', '90 dB / 8h · 5 dB 교환율'], en: ['Personal noise dose', '90 dB / 8 h · 5 dB exchange'] } });
  P.register({ key: 'expiry', icon: '📦', bg: 'linear-gradient(135deg,#EAF7E6,#C9EBBF)', cat: 'manage', render: renderExpiry, nav: { zh: ['耗材到期', 'AED 电极片 · 滤芯 · 灭火器'], ko: ['소모품 유효기간', 'AED 패드 · 필터 · 소화기'], en: ['Consumables expiry', 'AED pads · filters · extinguishers'] } });
  var RM = { zh: [['人员分类 · 师傅 · 夜班复测', 'done', '本平台 · 人员分类', '施行令第 4 条第 9 项；CDC/NIOSH 轮班研究'], ['整改闭环', 'done', '本平台 · 整改闭环', '风险评估：减灾措施执行 → 记录共享'], ['应急演练', 'done', '本平台 · 应急演练', '黄金 4 分钟；施行令第 4 条第 8 项'], ['交接班摘要（AI）', 'done', '本平台 · 交接班摘要', '—'], ['个人噪声暴露', 'done', '本平台 · 个人噪声暴露', '安全保健标准规则第 512 条'], ['耗材到期', 'done', '本平台 · 耗材到期', '—'], ['检修上锁 LOTO', 'done', '现场端 · 机器危险点 🔒', '—']],
    ko: [['인력 구분 · 멘토 · 야간 재검사', 'done', '플랫폼 · 인력 구분', '시행령 제4조 제9호; CDC/NIOSH'], ['개선 조치 관리', 'done', '플랫폼 · 개선 조치', '위험성평가: 감소대책 실행 → 기록·공유'], ['비상 대응 훈련', 'done', '플랫폼 · 비상 대응 훈련', '골든타임 4분; 시행령 제4조 제8호'], ['교대 인수인계(AI)', 'done', '플랫폼 · 교대 인수인계', '—'], ['개인 소음 노출', 'done', '플랫폼 · 개인 소음 노출', '안전보건기준규칙 제512조'], ['소모품 유효기간', 'done', '플랫폼 · 소모품', '—'], ['정비 잠금 LOTO', 'done', '현장 화면 · 기계 위험점 🔒', '—']],
    en: [['People · mentors · night retest', 'done', 'Platform · People', 'Decree Art. 4(9); CDC/NIOSH shift work'], ['Corrective actions', 'done', 'Platform · Corrective actions', 'Risk assessment: carry out controls → record'], ['Emergency drill', 'done', 'Platform · Emergency drill', '4-minute golden time; Decree Art. 4(8)'], ['Shift handover (AI)', 'done', 'Platform · Shift handover', '—'], ['Personal noise dose', 'done', 'Platform · Noise dose', 'OSH Standards Rule Art. 512'], ['Consumables expiry', 'done', 'Platform · Expiry', '—'], ['Lock-out (LOTO)', 'done', 'Field app · machine point 🔒', '—']] };
  ['zh', 'ko', 'en'].forEach(function (l) { P.STR[l].rm_items = RM[l].concat(P.STR[l].rm_items); });
})();
