/* SHine-K 3.0 · 危险区域管控 + 电子作业票执行 + 监护人履职监测（现场端）
 *
 *  1. 在摄像头画面上画出危险区域（多边形），设置：作业类型、必须佩戴的防护用品、是否需要作业票、是否室外、是否联动门禁/警示灯。
 *  2. 人的位置 = 脚踝中点（看不到脚就用人框底边中点）。进入区域后：
 *     · 没戴要求的防护用品 → 语音 + 手机/手表振动“禁止进入，请退出佩戴”；20 秒后还在里面 → 红色警报。
 *       区域显示“⛔ 禁止进入”，戴好（AI 判定“已戴”）才变成“✓ 允许”。勾选门禁联动时，USB 警示灯/继电器收到 L（锁）/ U（开）。
 *     · 需要作业票：没有有效作业票、作业票已冻结 / 超时、或这个人不在作业票名单里 → 警告，20 秒后红色。
 *       只有名单里的作业人员和监护人进入才不告警（身份 = 手表 → 名单里绑定的工号）。
 *  3. 监护人：有人在作业区时，监护人 60 秒不在画面 → 提醒（3 分钟 → 冻结作业票）；离开作业区周边 30 秒 → 提醒；
 *     低头、双手在胸前持续 20 秒 → “疑似低头看手机”（只是姿势判断，会有误报）。
 *  4. 自动冻结作业票：气体超标、风速超限 / 雷暴（室外高处、吊装、动火）、热指数极度危险、超过作业时间、
 *     作业人员全部离场 5 分钟、作业人员心率判定“停止作业”。冻结后推送到名单里每个人的手机 / 手表。
 */
(function () {
  'use strict';
  var t = SHKI18N.t, $ = function (id) { return document.getElementById(id); };
  SHKI18N.add({
    zh: {
      zn_btn: '✎ 危险区域', zn_help: '在画面上依次点击区域的各个角（至少 3 个点），然后点「完成」。', zn_done: '完成', zn_undo: '撤销一点', zn_cancel: '取消',
      zn_name: '区域名称', zn_type: '类型', zn_need_helmet: '必须戴安全帽', zn_need_vest: '必须穿反光背心', zn_need_permit: '需要作业票', zn_outdoor: '室外', zn_gate: '联动门禁 / 警示灯',
      zn_save: '保存区域', zn_del: '删除', zn_none: '还没有危险区域。', zn_allow: '✓ 允许', zn_block: '⛔ 禁止进入', zn_people: '{n} 人',
      zn_np: '无有效作业票', zn_unmon: '监护人未绑定手表，无法监测',
      ev_zone_ppe: '#{id} 未戴{items}进入「{zone}」', say_zone_ppe: '{id}号，你没有佩戴{items}，禁止进入{zone}。请先退出，佩戴好再进入。',
      ev_zone_ppe_d: '#{id} 未戴{items}仍在「{zone}」内', say_zone_ppe_d: '{id}号，立即退出{zone}！',
      ev_no_permit: '#{id} 进入「{zone}」，但没有有效作业票', say_no_permit: '{zone}没有有效作业票，{id}号请立即撤离。',
      ev_frozen: '#{id} 在已冻结作业区「{zone}」：{why}', say_frozen: '{zone}作业票已冻结，原因：{why}。{id}号请停止作业，立即撤离。',
      ev_unauth: '#{id} 未授权进入「{zone}」', say_unauth: '{id}号，你不在{zone}的作业票名单里，请立即离开。',
      ev_guard_absent: '「{zone}」监护人 {g} 离岗', say_guard_absent: '监护人{g}，请立即回到{zone}。',
      ev_guard_out: '「{zone}」监护人 {g} 未在指定区域', say_guard_out: '监护人{g}，请回到{zone}旁边监护。',
      ev_guard_phone: '「{zone}」监护人 {g} 疑似低头看手机', say_guard_phone: '监护人{g}，请专心监护。',
      ev_pfreeze: '「{zone}」作业票已冻结：{why}', say_pfreeze: '注意，{zone}作业票已冻结，原因：{why}。所有人停止作业。',
      nt_freeze: '作业票已冻结', nt_ppe: '禁止进入：请先佩戴{items}', nt_unauth: '你未被授权进入 {zone}', nt_guard: '监护提醒'
    },
    ko: {
      zn_btn: '✎ 위험구역', zn_help: '화면에서 구역의 꼭짓점을 차례로 클릭(최소 3점)한 뒤 「완료」를 누르세요.', zn_done: '완료', zn_undo: '한 점 취소', zn_cancel: '취소',
      zn_name: '구역 이름', zn_type: '유형', zn_need_helmet: '안전모 필수', zn_need_vest: '안전조끼 필수', zn_need_permit: '작업허가 필요', zn_outdoor: '실외', zn_gate: '출입문 / 경광등 연동',
      zn_save: '구역 저장', zn_del: '삭제', zn_none: '위험구역이 없습니다.', zn_allow: '✓ 허용', zn_block: '⛔ 출입 금지', zn_people: '{n}명',
      zn_np: '유효한 작업허가 없음', zn_unmon: '감시자 워치 미연결, 감시 불가',
      ev_zone_ppe: '#{id} {items} 미착용으로 「{zone}」 진입', say_zone_ppe: '{id}번, {items}를 착용하지 않았습니다. {zone} 출입 금지. 나가서 착용 후 들어오세요.',
      ev_zone_ppe_d: '#{id} {items} 미착용 상태로 「{zone}」 안에 있음', say_zone_ppe_d: '{id}번, 즉시 {zone}에서 나오세요!',
      ev_no_permit: '#{id} 「{zone}」 진입, 유효한 작업허가 없음', say_no_permit: '{zone}에 유효한 작업허가가 없습니다. {id}번 즉시 철수하세요.',
      ev_frozen: '#{id} 동결된 작업구역 「{zone}」: {why}', say_frozen: '{zone} 작업허가 동결, 사유: {why}. {id}번 작업을 멈추고 철수하세요.',
      ev_unauth: '#{id} 「{zone}」 무단 진입', say_unauth: '{id}번, {zone} 작업허가 명단에 없습니다. 즉시 나가세요.',
      ev_guard_absent: '「{zone}」 감시자 {g} 이탈', say_guard_absent: '감시자 {g}, 즉시 {zone}로 돌아오세요.',
      ev_guard_out: '「{zone}」 감시자 {g} 지정 위치 아님', say_guard_out: '감시자 {g}, {zone} 옆에서 감시하세요.',
      ev_guard_phone: '「{zone}」 감시자 {g} 휴대폰 사용 의심', say_guard_phone: '감시자 {g}, 감시에 집중하세요.',
      ev_pfreeze: '「{zone}」 작업허가 동결: {why}', say_pfreeze: '주의, {zone} 작업허가가 동결되었습니다. 사유: {why}. 모두 작업을 멈추세요.',
      nt_freeze: '작업허가 동결', nt_ppe: '출입 금지: {items} 착용 필요', nt_unauth: '{zone} 출입 권한 없음', nt_guard: '감시 알림'
    },
    en: {
      zn_btn: '✎ Danger zones', zn_help: 'Click the corners of the area on the video (at least 3), then press “Done”.', zn_done: 'Done', zn_undo: 'Undo point', zn_cancel: 'Cancel',
      zn_name: 'Zone name', zn_type: 'Type', zn_need_helmet: 'Helmet required', zn_need_vest: 'Vest required', zn_need_permit: 'Permit required', zn_outdoor: 'Outdoor', zn_gate: 'Link gate / beacon',
      zn_save: 'Save zone', zn_del: 'Delete', zn_none: 'No danger zones yet.', zn_allow: '✓ Allowed', zn_block: '⛔ No entry', zn_people: '{n} in',
      zn_np: 'No valid permit', zn_unmon: 'Guardian has no watch bound, cannot monitor',
      ev_zone_ppe: '#{id} entered “{zone}” without {items}', say_zone_ppe: 'Number {id}, no {items}. Entry to {zone} is not allowed. Step out and put it on first.',
      ev_zone_ppe_d: '#{id} still in “{zone}” without {items}', say_zone_ppe_d: 'Number {id}, leave {zone} now!',
      ev_no_permit: '#{id} entered “{zone}” with no valid permit', say_no_permit: '{zone} has no valid permit. Number {id}, leave now.',
      ev_frozen: '#{id} in frozen work area “{zone}”: {why}', say_frozen: '{zone} permit is frozen: {why}. Number {id}, stop work and leave.',
      ev_unauth: '#{id} unauthorized in “{zone}”', say_unauth: 'Number {id}, you are not on the {zone} permit. Leave now.',
      ev_guard_absent: '“{zone}” guardian {g} absent', say_guard_absent: 'Guardian {g}, return to {zone} now.',
      ev_guard_out: '“{zone}” guardian {g} not at post', say_guard_out: 'Guardian {g}, go back next to {zone}.',
      ev_guard_phone: '“{zone}” guardian {g} may be looking at a phone', say_guard_phone: 'Guardian {g}, please keep watching.',
      ev_pfreeze: '“{zone}” permit frozen: {why}', say_pfreeze: 'Attention, the {zone} permit is frozen: {why}. Everyone stop work.',
      nt_freeze: 'Permit frozen', nt_ppe: 'No entry: put on {items} first', nt_unauth: 'You are not authorized for {zone}', nt_guard: 'Guardian reminder'
    }
  });

  var L = null, edit = null, V = {}, G = {}, lastGate = null, liveGas = {}, permStat = {};

  function zones() { return SHKStore.all('zones').filter(function (z) { return z.site === L.site(); }); }
  function inPoly(p, poly) {
    var x = p[0], y = p[1], inside = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  }
  function bbox(poly, m) {
    var xs = poly.map(function (p) { return p[0]; }), ys = poly.map(function (p) { return p[1]; });
    var b = [Math.min.apply(null, xs), Math.min.apply(null, ys), Math.max.apply(null, xs), Math.max.apply(null, ys)];
    var w = b[2] - b[0], h = b[3] - b[1]; m = m || 0;
    return [b[0] - w * m, b[1] - h * m, b[2] + w * m, b[3] + h * m];
  }
  function foot(tk) {
    var lm = tk.lm;
    if (lm && !tk.noPose) {
      var a = lm[27], b = lm[28], v = function (p) { return p && (p.visibility == null || p.visibility > 0.4); };
      if (v(a) && v(b)) return [(a.x + b.x) / 2, (a.y + b.y) / 2];
      if (v(a)) return [a.x, a.y]; if (v(b)) return [b.x, b.y];
    }
    var bx = tk.f.box; return [(bx[0] + bx[2]) / 2, bx[3]];
  }
  /* 低头 + 双手在胸前 → 疑似看手机 */
  function phoneLike(tk) {
    var lm = tk.lm; if (!lm || tk.noPose) return false;
    var ok = function (i) { return lm[i] && (lm[i].visibility == null || lm[i].visibility > 0.5); };
    if (![0, 11, 12, 15, 16, 23, 24].every(ok)) return false;
    var shY = (lm[11].y + lm[12].y) / 2, shW = Math.abs(lm[11].x - lm[12].x), hipY = (lm[23].y + lm[24].y) / 2;
    if (shW < 0.02) return false;
    var headDown = (shY - lm[0].y) < 0.35 * shW;
    var wd = Math.hypot(lm[15].x - lm[16].x, lm[15].y - lm[16].y) < 0.7 * shW;
    var wy = (lm[15].y + lm[16].y) / 2, inFront = wy > shY && wy < hipY;
    return headDown && wd && inFront;
  }

  /* ---------- 违规状态：成立多久后提醒、多久后升级 ---------- */
  var touched = {};
  function viol(key, on, s) {
    touched[key] = 1;
    var now = Date.now(), v = V[key];
    if (!on) { if (v) { delete V[key]; L.clearAlert(key); } return; }
    if (!v) v = V[key] = { since: now, lv: 0 };
    var el = now - v.since;
    if (v.lv < 1 && el >= (s.after || 0)) {
      v.lv = 1;
      L.raise({ key: key, wid: s.wid, kind: s.kind, level: s.danger ? 'danger' : 'warn', msg: s.msg, say: s.say, loc: s.loc });
      if (s.notify) L.notify(s.notify, { level: s.danger ? 'danger' : 'warn', title: s.ntTitle || s.msg, body: s.say });
    }
    if (v.lv === 1 && s.escalate && el >= s.escalate) {
      v.lv = 2;
      L.raise({ key: key, wid: s.wid, kind: s.kind, level: 'danger', msg: s.msgD || s.msg, say: s.sayD || s.say, loc: s.loc });
      if (s.notify) L.notify(s.notify, { level: 'danger', title: s.ntTitle || s.msgD || s.msg, body: s.sayD || s.say });
      if (s.onEscalate) s.onEscalate();
      // 身份已识别的违规升级为红色：安全积分 −5（同一次违规只扣一次）
      if (s.notify && /^zone_/.test(s.kind)) { var pk = 'viol:' + key + ':' + new Date(v.since).toISOString().slice(0, 13); if (!SHKStore.get('points', pk)) SHKStore.put('points', { id: pk, worker: s.notify, delta: -5, reason: s.msg, at: now, by: L.site() }); }
    }
  }

  function freeze(p, z, key, vars, extra) {
    var np = SHKPermit.freeze(p, key, vars, L.site(), extra);
    if (np) announceFreeze(np, z);
  }
  function announceFreeze(p, z) {
    var why = p.freeze ? p.freeze.reason : '';
    z = z || SHKStore.get('zones', p.zone) || { name: p.zone };
    L.raise({ key: 'PF:' + p.id, wid: 'PERMIT', kind: 'permit_frozen', level: 'warn', msg: t('ev_pfreeze', { zone: z.name, why: why }), say: t('say_pfreeze', { zone: z.name, why: why }) });
    (p.workers || []).concat(p.guardian ? [p.guardian] : []).forEach(function (c) { L.notify(c, { level: 'danger', title: t('nt_freeze') + ' · ' + z.name, body: why }); });
  }
  /* 作业票状态变化（包括作业管理页手动冻结、恢复、关闭） */
  function watchPermits() {
    SHKStore.on(function (coll, p) {
      if (coll !== 'permits' || !p || !p.id) return;
      var prev = permStat[p.id]; permStat[p.id] = p.status;
      if (!L || !SHKStore.get('zones', p.zone) || SHKStore.get('zones', p.zone).site !== L.site()) return;
      if (p.status === 'frozen' && prev === 'active' && p.freeze && p.freeze.by !== L.site()) announceFreeze(p);
      if (p.status !== 'frozen') L.clearAlert('PF:' + p.id);
    });
    SHKPermit.all().forEach(function (p) { permStat[p.id] = p.status; });
  }

  function conditions(z, p, env, now) {
    var T = SHKPermit.TYPES[z.type] || {}, Lm = SHKPermit.limits(), outdoor = z.outdoor || env.outdoor;
    if (p.end && now > p.end) return freeze(p, z, 'time');
    if (T.gas || p.gasRequired) {
      var g = liveGas[z.id] && now - liveGas[z.id].at < 120000 ? liveGas[z.id] : p.gas, gc = SHKPermit.gasCheck(g);
      if (gc.bad.length) return freeze(p, z, 'gas', { x: gc.bad.map(function (k) { return t('g_' + k) + ' ' + g[k]; }).join('、') }, g === p.gas ? null : { gas: { o2: g.o2, lel: g.lel, h2s: g.h2s, co: g.co, at: g.at, by: 'detector' } });
    }
    if (outdoor && T.wx === 'wind' && env.wind != null && env.wind >= Lm.wind) return freeze(p, z, 'wind', { v: env.wind, m: Lm.wind });
    if (outdoor && T.wx && env.thunder) return freeze(p, z, 'thunder');
    if (outdoor && env.level >= 4) return freeze(p, z, 'heat');
    var stopW = (p.workers || []).some(function (c) { var d = L.deviceOfWorker(c); return d && d.risk && d.risk.level === 'stop'; });
    if (stopW) return freeze(p, z, 'stop');
  }

  function guardian(z, p, inside, seen) {
    var g = G[p.id] = G[p.id] || {};
    if (!p.guardian) return;
    var gw = SHKStore.get('roster', p.guardian), gname = gw ? (gw.name || gw.id) : p.guardian;
    g.unmon = !L.deviceOfWorker(p.guardian);
    if (g.unmon) return;
    var gtk = seen.find(function (tk) { var w = L.workerOf(tk); return w && w.id === p.guardian; });
    var others = inside.filter(function (tk) { var w = L.workerOf(tk); return !w || w.id !== p.guardian; }).length;
    var base = 'G:' + p.id, vars = { zone: z.name, g: gname };
    viol(base + ':absent', others > 0 && !gtk, { after: 60000, escalate: 180000, wid: 'G-' + p.guardian, kind: 'guard_absent', msg: t('ev_guard_absent', vars), say: t('say_guard_absent', vars), notify: p.guardian, ntTitle: t('nt_guard'),
      onEscalate: function () { freeze(p, z, 'guard'); } });
    var out = !!gtk && !(function (pt, b) { return pt[0] >= b[0] && pt[0] <= b[2] && pt[1] >= b[1] && pt[1] <= b[3]; })(foot(gtk), bbox(z.poly, 0.35));
    viol(base + ':out', others > 0 && out, { after: 30000, wid: 'G-' + p.guardian, kind: 'guard_out', msg: t('ev_guard_out', vars), say: t('say_guard_out', vars), notify: p.guardian, ntTitle: t('nt_guard') });
    viol(base + ':phone', !!gtk && phoneLike(gtk), { after: 20000, wid: 'G-' + p.guardian, kind: 'guard_phone', msg: t('ev_guard_phone', vars), say: t('say_guard_phone', vars), notify: p.guardian, ntTitle: t('nt_guard') });
  }

  function tick() {
    if (!L || !L.running()) return;
    var now = Date.now(), pnow = performance.now(), env = window.SHKHeat ? SHKHeat.current() : {};
    var seen = L.tracks().filter(function (tk) { return pnow - tk.seen < 1500 && tk.f; });
    touched = {};
    seen.forEach(function (tk) { tk.zoneId = null; tk.zoneName = null; });
    var gateBad = false;
    zones().forEach(function (z) {
      if (!z.poly || z.poly.length < 3) return;
      var p = z.permit ? SHKPermit.forZone(z.id, now) : null;
      if (p && p.status === 'active') { conditions(z, p, env, now); p = SHKStore.get('permits', p.id); }
      var ps = SHKPermit.status(p, now);
      var inside = seen.filter(function (tk) { return inPoly(foot(tk), z.poly); });
      z._n = inside.length; z._bad = false; z._ps = ps; z._unmon = p && G[p.id] && G[p.id].unmon;
      inside.forEach(function (tk) {
        tk.zoneId = z.id; tk.zoneName = z.name;
        var id = tk.id, w = L.workerOf(tk), code = w && w.id, base = 'P' + id + ':z:' + z.id, loc = L.locOf(tk);
        var miss = [];
        if (z.ppe && z.ppe.helmet && tk.ppe.helmet === false) miss.push(t('helmet'));
        if (z.ppe && z.ppe.vest && tk.ppe.vest === false) miss.push(t('vest'));
        if (miss.length) { z._bad = true; if (z.gate) gateBad = true; }
        var vars = { id: id, zone: z.name, items: miss.join('、') };
        viol(base + ':ppe', miss.length > 0, { after: 1500, escalate: 20000, wid: 'P' + id, kind: 'zone_ppe', msg: t('ev_zone_ppe', vars), say: t('say_zone_ppe', vars),
          msgD: t('ev_zone_ppe_d', vars), sayD: t('say_zone_ppe_d', vars), notify: code, ntTitle: t('nt_ppe', vars), loc: loc });
        if (z.permit) {
          var cond = !p ? 'no_permit' : ps === 'frozen' || ps === 'expired' ? 'frozen' : !SHKPermit.allowed(p, code) ? 'unauth' : null;
          ['no_permit', 'frozen', 'unauth'].forEach(function (c) {
            var why = p && p.freeze ? p.freeze.reason : t('fz_time'), v2 = { id: id, zone: z.name, why: why };
            if (c === cond) z._bad = true;
            viol(base + ':' + c, c === cond, { after: 1500, escalate: c === 'frozen' ? 10000 : 20000, wid: 'P' + id, kind: 'zone_' + c, msg: t('ev_' + c, v2), say: t('say_' + c, v2),
              notify: code, ntTitle: c === 'unauth' ? t('nt_unauth', v2) : t('ev_' + c, v2), loc: loc });
          });
        }
      });
      if (p && ps === 'active') {
        guardian(z, p, inside, seen);
        // 作业人员全部离场 5 分钟 → 冻结（需重新确认后再开工）
        var g = G[p.id] = G[p.id] || {}, auth = inside.filter(function (tk) { var w = L.workerOf(tk); return w && (p.workers || []).indexOf(w.id) >= 0; }).length;
        if (auth) { g.wasIn = true; g.lastIn = now; }
        else if (g.wasIn && now - g.lastIn > 5 * 60000) { g.wasIn = false; freeze(p, z, 'leave'); }
      }
    });
    Object.keys(V).forEach(function (k) { if (!touched[k]) viol(k, false); });
    if (gateBad !== lastGate) { lastGate = gateBad; L.beacon(gateBad ? 'L' : 'U'); }
  }

  /* ---------- 画面 ---------- */
  function drawZones(g, W, H) {
    var lw = Math.max(2, W / 400);
    zones().forEach(function (z) {
      if (!z.poly || z.poly.length < 3) return;
      var c = SHKPermit.color(z.type);
      g.beginPath(); z.poly.forEach(function (p, i) { if (i) g.lineTo(p[0] * W, p[1] * H); else g.moveTo(p[0] * W, p[1] * H); }); g.closePath();
      g.fillStyle = hexA(z._bad ? '#E8133A' : c, z._bad ? 0.22 : 0.12); g.fill();
      g.strokeStyle = z._bad ? '#E8133A' : c; g.lineWidth = lw; g.setLineDash(z._bad ? [] : [10, 6]); g.stroke(); g.setLineDash([]);
      var b = bbox(z.poly), fs = Math.round(W / 60);
      var line1 = z.name + ' · ' + SHKPermit.typeName(z.type) + (z._n ? ' · ' + t('zn_people', { n: z._n }) : '');
      var line2 = z._bad ? t('zn_block') : (z.permit && z._ps !== 'active') ? (z._ps ? t('ps_' + z._ps) : t('zn_np')) : t('zn_allow');
      g.font = '700 ' + fs + 'px sans-serif';
      var tw = Math.max(g.measureText(line1).width, g.measureText(line2).width) + 14;
      var x = b[0] * W, y = Math.max(b[1] * H, H * 0.085);   // 避开左上角的状态标签
      g.fillStyle = 'rgba(11,18,32,.78)'; g.fillRect(x, y, tw, fs * 2.5);
      g.fillStyle = '#fff'; g.fillText(line1, x + 7, y + fs * 1.05);
      g.fillStyle = z._bad ? '#ff6b81' : (z.permit && z._ps !== 'active') ? '#FFB020' : '#4ADE80'; g.fillText(line2, x + 7, y + fs * 2.2);
    });
    if (edit && edit.pts.length) {
      g.strokeStyle = '#FFD400'; g.fillStyle = '#FFD400'; g.lineWidth = lw;
      g.beginPath(); edit.pts.forEach(function (p, i) { if (i) g.lineTo(p[0] * W, p[1] * H); else g.moveTo(p[0] * W, p[1] * H); }); g.stroke();
      edit.pts.forEach(function (p) { g.beginPath(); g.arc(p[0] * W, p[1] * H, lw * 3, 0, 7); g.fill(); });
    }
  }
  function hexA(h, a) { var n = parseInt(h.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }

  /* ---------- 编辑 ---------- */
  function clickToNorm(e) {
    var cv = L.canvas, r = cv.getBoundingClientRect(), W = cv.width || 16, H = cv.height || 9;
    var s = Math.min(r.width / W, r.height / H), ox = (r.width - W * s) / 2, oy = (r.height - H * s) / 2;
    var x = (e.clientX - r.left - ox) / (W * s), y = (e.clientY - r.top - oy) / (H * s);
    return [Math.max(0, Math.min(1, +x.toFixed(4))), Math.max(0, Math.min(1, +y.toFixed(4)))];
  }
  function typeOpts(sel) { return Object.keys(SHKPermit.TYPES).map(function (k) { return '<option value="' + k + '"' + (k === sel ? ' selected' : '') + '>' + SHKPermit.typeName(k) + '</option>'; }).join(''); }
  function renderPanel() {
    var box = $('zonePanel'); if (!box) return;
    $('btnZones').textContent = t('zn_btn') + ' (' + zones().length + ')';
    if (!box.classList.contains('open')) return;
    var h = '';
    if (edit && !edit.form) h += '<div class="note">' + t('zn_help') + '</div><div class="row" style="gap:6px;margin:6px 0"><button class="pri" data-zd ' + (edit.pts.length < 3 ? 'disabled' : '') + '>' + t('zn_done') + ' (' + edit.pts.length + ')</button><button data-zu>' + t('zn_undo') + '</button><button data-zc>' + t('zn_cancel') + '</button></div>';
    else if (edit && edit.form) {
      var z = edit.z || {};
      h += '<div class="zform"><label>' + t('zn_name') + '<input data-zn value="' + esc(z.name || '') + '" placeholder="A区"></label><label>' + t('zn_type') + '<select data-zt>' + typeOpts(z.type || 'danger') + '</select></label>' +
        '<label class="ck"><input type="checkbox" data-zh ' + (!z.ppe || z.ppe.helmet ? 'checked' : '') + '> ' + t('zn_need_helmet') + '</label><label class="ck"><input type="checkbox" data-zv ' + (z.ppe && z.ppe.vest ? 'checked' : '') + '> ' + t('zn_need_vest') + '</label>' +
        '<label class="ck"><input type="checkbox" data-zp ' + (z.permit ? 'checked' : '') + '> ' + t('zn_need_permit') + '</label><label class="ck"><input type="checkbox" data-zo ' + (z.outdoor ? 'checked' : '') + '> ' + t('zn_outdoor') + '</label>' +
        '<label class="ck"><input type="checkbox" data-zg ' + (z.gate ? 'checked' : '') + '> ' + t('zn_gate') + '</label>' +
        '<div class="row" style="gap:6px"><button class="pri" data-zs>' + t('zn_save') + '</button><button data-zc>' + t('zn_cancel') + '</button></div></div>';
    } else h += '<div class="row" style="gap:6px;margin-bottom:6px"><button class="pri" data-zadd>＋ ' + t('zn_btn').replace('✎ ', '') + '</button></div>';
    var list = zones();
    h += list.length ? list.map(function (z) {
      var p = z.permit ? SHKPermit.forZone(z.id) : null, ps = SHKPermit.status(p);
      return '<div class="zrow"><i style="background:' + SHKPermit.color(z.type) + '"></i><b>' + esc(z.name) + '</b><span class="muted">' + SHKPermit.typeName(z.type) +
        (z.ppe && z.ppe.helmet ? ' · ⛑' : '') + (z.ppe && z.ppe.vest ? ' · 🦺' : '') + (z.permit ? ' · 📄 ' + (ps ? t('ps_' + ps) : t('zn_np')) : '') + (z.outdoor ? ' · ☀' : '') + (z.gate ? ' · 🚪' : '') +
        (z._unmon ? ' · ⚠ ' + t('zn_unmon') : '') + '</span><span class="sp"></span><button data-ze="' + z.id + '">✎</button><button data-zx="' + z.id + '">' + t('zn_del') + '</button></div>';
    }).join('') : '<div class="empty">' + t('zn_none') + '</div>';
    box.innerHTML = h;
    var q = function (s) { return box.querySelector(s); };
    if (q('[data-zadd]')) q('[data-zadd]').onclick = function () { edit = { pts: [] }; L.canvas.classList.add('zedit'); renderPanel(); };
    if (q('[data-zd]')) q('[data-zd]').onclick = function () { edit.form = true; renderPanel(); };
    if (q('[data-zu]')) q('[data-zu]').onclick = function () { edit.pts.pop(); renderPanel(); };
    box.querySelectorAll('[data-zc]').forEach(function (b) { b.onclick = function () { edit = null; L.canvas.classList.remove('zedit'); renderPanel(); }; });
    if (q('[data-zs]')) q('[data-zs]').onclick = function () {
      var z = Object.assign({}, edit.z || {}, {
        site: L.site(), name: q('[data-zn]').value.trim() || ('Z' + (zones().length + 1)), type: q('[data-zt]').value, poly: edit.pts,
        ppe: { helmet: q('[data-zh]').checked, vest: q('[data-zv]').checked }, permit: q('[data-zp]').checked, outdoor: q('[data-zo]').checked, gate: q('[data-zg]').checked
      });
      SHKStore.put('zones', z); edit = null; L.canvas.classList.remove('zedit'); renderPanel(); L.log('info', '✓ ' + z.name);
    };
    box.querySelectorAll('[data-zx]').forEach(function (b) { b.onclick = function () { SHKStore.del('zones', b.dataset.zx); renderPanel(); }; });
    box.querySelectorAll('[data-ze]').forEach(function (b) { b.onclick = function () { var z = SHKStore.get('zones', b.dataset.ze); edit = { pts: z.poly.slice(), z: z, form: true }; renderPanel(); }; });
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  window.SHKZones = {
    init: function (live) {
      L = live;
      L.onDraw(drawZones);
      L.canvas.addEventListener('click', function (e) { if (!edit || edit.form) return; edit.pts.push(clickToNorm(e)); renderPanel(); });
      $('btnZones').onclick = function () { $('zonePanel').classList.toggle('open'); renderPanel(); };
      L.tr.on(function (m) {
        // 外部气体检测仪（通过系统对接接口发来）：{ type:'gas', zone, o2, lel, h2s, co }
        if (m.type === 'gas' && m.zone) liveGas[m.zone] = { o2: m.o2, lel: m.lel, h2s: m.h2s, co: m.co, at: Date.now() };
      });
      SHKStore.on(function (coll) { if (coll === 'zones') renderPanel(); });
      watchPermits(); renderPanel();
      setInterval(tick, 500);
      setInterval(function () { if (!edit) renderPanel(); }, 3000);
    },
    rebuild: renderPanel, zoneOf: function (tk) { return tk.zoneId ? SHKStore.get('zones', tk.zoneId) : null; },
    _inPoly: inPoly, _phoneLike: phoneLike, _foot: foot, _gas: liveGas
  };
})();
