/* SHine-K 3.0 · 监控端：接收现场端的骨架、生命体征、警报；可回传确认 / 广播 / 请求举手 */
(function () {
  'use strict';
  var t = SHKI18N.t, FB = SHKFeedback, $ = function (id) { return document.getElementById(id); };
  SHKI18N.add({
    zh: { rl_ok: '正常', rl_watch: '关注', rl_warn: '预警', rl_stop: '停止作业', emg_title: '🚨 应急处置', emg_where: '位置', emg_site: '现场', emg_zone: '区域', emg_pos: '画面位置', emg_cam: '摄像头', emg_gps: '现场坐标', emg_map: '地图',
      emg_vitals: '生命体征', emg_elapsed: '已过去', emg_bc_again: '📢 再次全厂广播', emg_ask: '✋ 请求举手确认', emg_dispatched: '✓ 已派人前往', emg_end: '结束应急',
      emg_steps: '处置步骤', emg_s1: '派最近的急救员 / 班组长到现场', emg_s2: '呼叫 120（必要时 119）', emg_s3: '隔离危险源，疏散周边人员', emg_s4: '保护现场，记录经过',
      emg_snap: '现场截图（只在紧急时发送）', emg_nosnap: '没有截图：现场端未开启“紧急时发送截图”，这里只显示骨架。', emg_auto_bc: '已自动向所有现场广播',
      emg_bc_text: '紧急广播：{where}{who}{what}，附近急救员立即前往，其他人员不要靠近。', emg_follow: '自动跟踪', c_zone: '区域', c_worker: '工人', c_risk: '风险', env_hi: '热指数',
      release: '确认复工', unknown_worker: '未绑定' },
    ko: { rl_ok: '정상', rl_watch: '관찰', rl_warn: '경고', rl_stop: '작업 중지', emg_title: '🚨 긴급 대응', emg_where: '위치', emg_site: '현장', emg_zone: '구역', emg_pos: '화면 위치', emg_cam: '카메라', emg_gps: '현장 좌표', emg_map: '지도',
      emg_vitals: '생체 신호', emg_elapsed: '경과', emg_bc_again: '📢 전체 방송 다시', emg_ask: '✋ 손들기 확인 요청', emg_dispatched: '✓ 인원 출동', emg_end: '대응 종료',
      emg_steps: '대응 절차', emg_s1: '가장 가까운 응급요원 / 반장 출동', emg_s2: '119 신고', emg_s3: '위험원 격리, 주변 인원 대피', emg_s4: '현장 보존, 경위 기록',
      emg_snap: '현장 캡처 (긴급 시에만 전송)', emg_nosnap: '캡처 없음: 현장에서 “긴급 시 캡처 전송”이 꺼져 있어 골격만 표시합니다.', emg_auto_bc: '모든 현장에 자동 방송함',
      emg_bc_text: '긴급 방송: {where} {who} {what}. 근처 응급요원은 즉시 출동하고, 다른 사람은 접근하지 마세요.', emg_follow: '자동 추적', c_zone: '구역', c_worker: '작업자', c_risk: '위험도', env_hi: '열지수',
      release: '작업 재개 확인', unknown_worker: '미지정' },
    en: { rl_ok: 'Normal', rl_watch: 'Watch', rl_warn: 'Warning', rl_stop: 'Stop work', emg_title: '🚨 Emergency response', emg_where: 'Location', emg_site: 'Site', emg_zone: 'Zone', emg_pos: 'Position in view', emg_cam: 'Camera', emg_gps: 'Site coordinates', emg_map: 'Map',
      emg_vitals: 'Vital signs', emg_elapsed: 'Elapsed', emg_bc_again: '📢 Broadcast again', emg_ask: '✋ Ask to raise a hand', emg_dispatched: '✓ Responder sent', emg_end: 'End emergency',
      emg_steps: 'Steps', emg_s1: 'Send the nearest first aider / team leader', emg_s2: 'Call emergency services', emg_s3: 'Isolate the hazard, clear the area', emg_s4: 'Preserve the scene, record what happened',
      emg_snap: 'Snapshot (sent only in emergencies)', emg_nosnap: 'No snapshot: the field page has “send snapshot in emergencies” off, so only the skeleton is shown.', emg_auto_bc: 'Broadcast automatically to all sites',
      emg_bc_text: 'Emergency: {where} {who} {what}. First aiders nearby go now; everyone else keep clear.', emg_follow: 'Auto-follow', c_zone: 'Zone', c_worker: 'Worker', c_risk: 'Risk', env_hi: 'Heat index',
      release: 'Approve return', unknown_worker: 'Unassigned' }
  });
  var tr = new SHKTransport('center');
  var sites = {}, feed = [], allAlerts = [];
  var BONES = [[1, 2], [1, 3], [3, 5], [2, 4], [4, 6], [1, 7], [2, 8], [7, 8], [7, 9], [9, 11], [8, 10], [10, 12]]; // KP13 索引
  var COL = { normal: '#00C896', suspect: '#FFB020', ask: '#FF8C00', danger: '#E8133A', sos: '#E8133A' };

  SHKI18N.apply();
  document.querySelectorAll('.langs button').forEach(function (b) {
    b.classList.toggle('on', b.dataset.l === SHKI18N.lang);
    b.onclick = function () { SHKI18N.set(b.dataset.l); FB.setLang(b.dataset.l); document.querySelectorAll('.langs button').forEach(function (x) { x.classList.toggle('on', x === b); }); renderFeed(); rebuildSites(); };
  });
  FB.setLang(SHKI18N.lang);
  $('btnStart').onclick = function () { $('gate').style.display = 'none'; FB.unlock(); };
  $('room').value = SHKTransport.savedRoom();

  /* ---------- 接收 ---------- */
  tr.on(function (m, via) {
    $('sRecv').textContent = tr.stats.recv;
    if (!m.site) return;
    var s = sites[m.site];
    if (!s) { s = sites[m.site] = newSite(m.site); fillBcSites(); }
    s.last = Date.now(); s.via = via;
    if (m.type === 'hb') { s.hb = m; }
    else if (m.type === 'pose') { s.ar = m.ar || 1.78; mergePeople(s, m.people || []); }
    else if (m.type === 'vitals') { s.vitals[m.wid] = { at: Date.now(), d: m }; }
    else if (m.type === 'env') { s.env = m; }
    else if (m.type === 'snap') { var sa = allAlerts.find(function (x) { return x.aid === m.aid; }); if (sa) { sa.snap = m.img; sa.snapAt = Date.now(); if (focus && focus.aid === m.aid) renderFocus(); } }
    else if (m.type === 'alert') onAlert(s, m);
    else if (m.type === 'clear') onClear(s, m);
    else if (m.type === 'event') log('info', '[' + m.site + '] ' + m.msg);
    else if (m.type === 'bye') { s.bye = true; log('warn', '[' + m.site + '] ■'); }
  });

  function newSite(name) {
    var s = { name: name, people: {}, vitals: {}, ar: 1.78, last: 0, first: Date.now(), el: null, cv: null };
    buildSite(s);
    log('info', '[' + name + '] ●');
    return s;
  }
  function mergePeople(s, arr) {
    var now = Date.now(), ids = {};
    arr.forEach(function (p) {
      ids[p.id] = 1;
      var cur = s.people[p.id];
      if (!cur) s.people[p.id] = cur = { draw: p.kp.map(function (k) { return k ? k.slice() : null; }) };
      cur.p = p; cur.at = now;
    });
    Object.keys(s.people).forEach(function (id) { if (!ids[id] && now - s.people[id].at > 3000) delete s.people[id]; });
  }

  /* ---------- 警报 ---------- */
  function onAlert(s, m) {
    var a = allAlerts.find(function (x) { return x.aid === m.aid; });
    if (a) { a.level = m.level; a.msg = m.msg; a.at = Date.now(); }
    else { a = { aid: m.aid, key: m.key, site: m.site, wid: m.wid, level: m.level, msg: m.msg, at: Date.now(), status: 'open' }; allAlerts.unshift(a); }
    a.kind = m.kind; a.loc = m.loc || a.loc; a.worker = m.worker || a.worker; a.emg = m.emg; a.recovered = m.recovered;
    if (m.emg && m.level === 'danger') startFocus(a);
    saveHist();
    log(m.level, '[' + m.site + '] ' + m.msg);
    if (m.level === 'danger') { FB.beep(1000, 250); setTimeout(function () { FB.beep(1000, 250); }, 330); setTimeout(function () { FB.beep(1000, 250); }, 660); FB.notify('SHine-K ⚠ ' + m.site, m.msg); FB.speak(m.site + '. ' + m.msg); }
    else FB.beep(760, 160);
    renderFeed();
  }
  function onClear(s, m) {
    var a = allAlerts.find(function (x) { return x.aid === m.aid; });
    if (a && a.status !== 'cleared') { a.status = 'cleared'; a.clearedBy = m.by; a.clearedAt = Date.now(); saveHist(); log('info', '[' + m.site + '] ✓ ' + a.msg + ' (' + m.by + ')'); if (focus && focus.aid === a.aid) renderFocus(); }
    renderFeed();
  }
  /* 警报记录保存在本机（最近 500 条），AI 安全助手生成隐患报告时使用 */
  var histT = null;
  function saveHist() {
    clearTimeout(histT);
    histT = setTimeout(function () {
      try {
        var old = JSON.parse(localStorage.getItem('shk3_alert_hist') || '[]'), map = {};
        old.concat(allAlerts.map(function (a) { return { aid: a.aid, at: a.at, site: a.site, wid: a.wid, kind: a.kind, level: a.level, msg: a.msg, zone: a.loc && a.loc.zone, emg: a.emg, worker: a.worker, status: a.status, clearedBy: a.clearedBy, ackAt: a.ackAt }; }))
          .forEach(function (a) { map[a.aid] = a; });
        var arr = Object.keys(map).map(function (k) { return map[k]; }).sort(function (x, y) { return y.at - x.at; }).slice(0, 500);
        localStorage.setItem('shk3_alert_hist', JSON.stringify(arr));
      } catch (e) {}
    }, 500);
  }
  function ack(aid) {
    var a = allAlerts.find(function (x) { return x.aid === aid; }); if (!a) return;
    a.ackAt = Date.now();
    tr.send({ type: 'cmd', action: 'ack', site: a.site, aid: a.aid, key: a.key, by: 'center' });
    log('info', '[' + a.site + '] ✓ ' + t('center_ack') + ': ' + a.msg);
    renderFeed();
  }
  function renderFeed() {
    var box = $('feed'), list = allAlerts.slice(0, 40);
    if (!list.length) { box.innerHTML = '<div class="empty">' + t('no_alerts') + '</div>'; return; }
    box.innerHTML = list.map(function (a) {
      var done = a.status === 'cleared';
      return '<div class="al ' + (done ? '' : a.level) + '" style="' + (done ? 'opacity:.55' : '') + '"><div class="m"><b>' + esc(a.msg) + '</b><span>' + esc(a.site) + ' · ' + new Date(a.at).toLocaleTimeString() +
        (a.ackAt ? ' · ✓ ' + t('center_ack') : '') + (done ? ' · ✓ ' + (a.clearedBy || '') : '') + '</span></div>' +
        (a.kind === 'stop_work' && a.recovered && !done ? '<button class="pri" data-rel="' + a.aid + '">' + t('release') + '</button>' : '') +
        (a.emg && !done ? '<button data-f="' + a.aid + '">🎯</button>' : '') +
        (done || a.ackAt ? '' : '<button class="' + (a.level === 'danger' ? 'dng' : '') + '" data-a="' + a.aid + '">' + t('center_ack') + '</button>') + '</div>';
    }).join('');
    box.querySelectorAll('button[data-a]').forEach(function (b) { b.onclick = function () { ack(b.dataset.a); }; });
    box.querySelectorAll('button[data-rel]').forEach(function (b) { b.onclick = function () { var a = allAlerts.find(function (x) { return x.aid === b.dataset.rel; }); if (a) { tr.send({ type: 'cmd', action: 'release', site: a.site, wid: a.wid, by: 'center' }); log('info', '[' + a.site + '] ' + t('release') + ' ' + a.wid); } }; });
    box.querySelectorAll('button[data-f]').forEach(function (b) { b.onclick = function () { var a = allAlerts.find(function (x) { return x.aid === b.dataset.f; }); if (a) startFocus(a, true); }; });
  }
  $('btnCsv').onclick = function () {
    var rows = [['time', 'site', 'worker', 'level', 'message', 'center_ack', 'cleared_by']].concat(allAlerts.map(function (a) {
      return [new Date(a.at).toISOString(), a.site, a.wid || '', a.level, a.msg, a.ackAt ? new Date(a.ackAt).toISOString() : '', a.clearedBy || ''];
    }));
    var csv = '﻿' + rows.map(function (r) { return r.map(function (v) { v = String(v); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
    var u = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), l = document.createElement('a');
    l.href = u; l.download = 'shine-k-alerts-' + Date.now() + '.csv'; l.click(); setTimeout(function () { URL.revokeObjectURL(u); }, 1000);
  };

  /* ---------- 现场面板 ---------- */
  function buildSite(s) {
    var box = $('sites');
    if (box.querySelector('.empty')) box.innerHTML = '';
    var el = document.createElement('div'); el.className = 'site';
    el.innerHTML = '<div class="hd"><b>' + esc(s.name) + '</b><span class="pill" data-on><i></i><span></span></span><span class="muted" data-hb></span></div>' +
      '<div class="twin"><canvas></canvas></div><table class="tb"><thead><tr><th>ID</th><th>' + t('status') + '</th><th>' + t('c_zone') + '</th><th>⛑</th><th>🦺</th><th>❤</th><th>' + t('c_risk') + '</th><th></th></tr></thead><tbody></tbody></table>';
    box.appendChild(el); s.el = el; s.cv = el.querySelector('canvas');
  }
  function rebuildSites() { $('sites').innerHTML = ''; Object.keys(sites).forEach(function (k) { buildSite(sites[k]); }); if (!Object.keys(sites).length) $('sites').innerHTML = '<div class="card"><div class="empty">' + t('no_data') + '</div></div>'; }
  function fillBcSites() { $('bcSite').innerHTML = Object.keys(sites).map(function (k) { return '<option>' + esc(k) + '</option>'; }).join(''); }

  function renderTables() {
    var now = Date.now();
    Object.keys(sites).forEach(function (k) {
      var s = sites[k], age = Math.round((now - s.last) / 1000), on = age < 8 && !s.bye;
      var pill = s.el.querySelector('[data-on]');
      pill.className = 'pill ' + (on ? 'ok' : 'dng');
      pill.querySelector('span').textContent = on ? t('online') + (s.via === 'mqtt' ? ' · MQTT' : ' · local') : t('offline', { s: age });
      // 现场端上线 30 秒后才判断离线（启动时加载模型会让页面卡几秒）
      if (!on && !s.offAlerted && age >= 8 && now - s.first > 30000) { s.offAlerted = true; onAlert(s, { aid: 'OFF-' + k + now, key: 'offline', site: k, level: 'warn', msg: t('offline', { s: age }) }); }
      if (on && s.offAlerted) { s.offAlerted = false; allAlerts.filter(function (a) { return a.site === k && a.key === 'offline' && a.status === 'open'; }).forEach(function (a) { a.status = 'cleared'; a.clearedBy = 'auto'; }); renderFeed(); }
      var hb = s.hb || {};
      var ev = s.env && s.env.hi != null ? ' · 🌡 ' + t('env_hi') + ' ' + s.env.hi + '℃' + (s.env.level >= 2 ? ' ⚠' : '') + (s.env.thunder ? ' ⚡' : '') : '';
      s.el.querySelector('[data-hb]').textContent = 'CAM ' + (hb.cam ? '●' : '○') + ' · Pose ' + (hb.pose ? '●' : '○') + ' · PPE ' + (hb.ppe ? '●' : '○') + ev;
      var rows = Object.keys(s.people).map(function (id) {
        var p = s.people[id].p, st = p.st || 'normal';
        var vt = Object.values(s.vitals).find(function (v) { return v.d.wearer === id && now - v.at < 5000; });
        var hr = vt && vt.d.hr != null ? vt.d.hr : p.hr;
        var ppe = function (v) { return v === true ? '<span class="tag ok">' + t('yes') + '</span>' : v === false ? '<span class="tag no">' + t('no') + '</span>' : '<span class="tag q">' + t('unknown') + '</span>'; };
        var rk = vt && vt.d.risk ? vt.d.risk : null;
        return '<tr' + (focus && focus.site === k && focus.wid === id ? ' class="foc"' : '') + '><td class="mono"><b>' + id + '</b>' + (p.wk ? '<br><small>' + esc(p.wk) + '</small>' : '') + '</td><td><span class="tag ' + (st === 'normal' ? 'ok' : 'no') + '">' + t('st_' + st) + '</span> <span class="muted">' + t('p_' + (p.po || 'other')) + (p.tilt != null ? ' ' + p.tilt + '°' : '') + '</span></td>' +
          '<td>' + (p.zone ? '<span class="tag ' + (p.zok === false ? 'no' : 'q') + '">' + esc(p.zone) + '</span>' : '<span class="muted">—</span>') + '</td>' +
          '<td>' + ppe(p.helmet) + '</td><td>' + ppe(p.vest) + '</td><td class="mono">' + (hr != null ? hr : '—') + '</td>' +
          '<td>' + riskTag(rk) + '</td>' +
          '<td><button data-ask="' + id + '" data-site="' + esc(k) + '">' + t('req_confirm') + '</button></td></tr>';
      });
      // 不在画面中的手环佩戴者
      Object.keys(s.vitals).forEach(function (wid) {
        var v = s.vitals[wid]; if (now - v.at > 5000 || (v.d.wearer && s.people[v.d.wearer])) return;
        rows.push('<tr><td class="mono"><b>' + esc(wid) + '</b>' + (v.d.worker ? '<br><small>' + esc(v.d.worker) + '</small>' : '') + '</td><td class="muted">' + t('not_in_view') + (v.d.motion != null ? ' · ' + t('motion') + ' ' + v.d.motion + '%' : '') + '</td><td>—</td><td>—</td><td>—</td><td class="mono">' + (v.d.hr != null ? v.d.hr : '—') + '</td><td>' + riskTag(v.d.risk) + '</td><td>' + (v.d.battery != null ? v.d.battery + '%' : '') + '</td></tr>');
      });
      var html = rows.join('') || '<tr><td colspan="8" class="muted">' + t('none_yet') + '</td></tr>';
      if (s.tbodyHtml === html) return;   // 内容没变就不重绘，避免按钮在点击时被替换
      s.tbodyHtml = html;
      var tb = s.el.querySelector('tbody');
      tb.innerHTML = html;
      if (!tb.dataset.bound) {   // 按下即响应（表格每秒刷新多次，不能等完整的 click）
        tb.dataset.bound = '1';
        tb.addEventListener('pointerdown', function (e) {
          var b = e.target.closest && e.target.closest('button[data-ask]'); if (!b || e.button !== 0) return;
          e.preventDefault();
          tr.send({ type: 'cmd', action: 'ask', site: b.dataset.site, wid: b.dataset.ask }); log('info', '[' + b.dataset.site + '] → ' + b.dataset.ask + ' ' + t('req_confirm'));
          b.disabled = true;
        });
      }
    });
  }
  setInterval(renderTables, 500);

  /* ---------- 数字孪生画布：只用关节点重建，不含任何画面 ---------- */
  function drawTwins() {
    requestAnimationFrame(drawTwins);
    Object.keys(sites).forEach(function (k) { drawSite(sites[k], sites[k].cv, null); });
    if (focus && $('focusCv')) { var fs = sites[focus.site]; if (fs) drawSite(fs, $('focusCv'), focus); }
  }
  function drawSite(s, c, view) {
      if (!c) return;
      var W = c.clientWidth, H = c.clientHeight; if (!W) return;
      if (c.width !== W * 2) { c.width = W * 2; c.height = H * 2; }
      var g = c.getContext('2d'); g.setTransform(2, 0, 0, 2, 0, 0);
      g.fillStyle = '#0B1220'; g.fillRect(0, 0, W, H);
      // 画面区域（保持现场摄像头比例）
      var fw = W, fh = W / s.ar; if (fh > H) { fh = H; fw = H * s.ar; }
      var ox = (W - fw) / 2, oy = (H - fh) / 2;
      // 应急跟踪：放大到那个人身上（平滑移动）
      var fp = view ? s.people[view.wid] : null, tz = 1, tcx = 0.5, tcy = 0.5;
      if (fp && fp.p.bx) { var bb = fp.p.bx; tcx = (bb[0] + bb[2]) / 2; tcy = (bb[1] + bb[3]) / 2; tz = Math.max(1.4, Math.min(3, 0.55 / Math.max(0.12, bb[3] - bb[1], (bb[2] - bb[0]) * s.ar / 1.78))); }
      else if (view && view.loc && view.loc.x != null) { tcx = view.loc.x; tcy = Math.max(0.2, view.loc.y - 0.15); tz = 1.8; }
      if (view) { view.z = (view.z || 1) + (tz - (view.z || 1)) * 0.08; view.cx = (view.cx == null ? 0.5 : view.cx) + (tcx - (view.cx == null ? 0.5 : view.cx)) * 0.08; view.cy = (view.cy == null ? 0.5 : view.cy) + (tcy - (view.cy == null ? 0.5 : view.cy)) * 0.08;
        var Z = view.z; fw *= Z; fh *= Z; ox = W / 2 - view.cx * fw; oy = H / 2 - view.cy * fh; }
      var zl = window.SHKStore ? SHKStore.all('zones').filter(function (z) { return z.site === s.name && z.poly && z.poly.length > 2; }) : [];
      zl.forEach(function (z) {
        var col = window.SHKPermit ? SHKPermit.color(z.type) : '#DC2626';
        g.beginPath(); z.poly.forEach(function (q, i) { var x = ox + q[0] * fw, y = oy + q[1] * fh; if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.closePath();
        g.fillStyle = col + '22'; g.fill(); g.strokeStyle = col; g.setLineDash([6, 4]); g.lineWidth = 1.5; g.stroke(); g.setLineDash([]);
        var mx = Math.min.apply(null, z.poly.map(function (q) { return q[0]; })), my = Math.min.apply(null, z.poly.map(function (q) { return q[1]; }));
        g.fillStyle = col; g.font = '700 11px sans-serif'; g.fillText(z.name, ox + mx * fw + 4, oy + my * fh + 13);
      });
      g.strokeStyle = 'rgba(120,140,180,.18)'; g.lineWidth = 1;
      for (var i = 1; i < 8; i++) { g.beginPath(); g.moveTo(ox + fw * i / 8, oy); g.lineTo(ox + fw * i / 8, oy + fh); g.stroke(); }
      for (i = 1; i < 5; i++) { g.beginPath(); g.moveTo(ox, oy + fh * i / 5); g.lineTo(ox + fw, oy + fh * i / 5); g.stroke(); }
      Object.keys(s.people).forEach(function (id) {
        var P = s.people[id], tgt = P.p.kp, col = COL[P.p.st] || COL.normal;
        for (var j = 0; j < tgt.length; j++) {   // 平滑插值
          if (!tgt[j]) { P.draw[j] = null; continue; }
          if (!P.draw[j]) P.draw[j] = tgt[j].slice();
          P.draw[j][0] += (tgt[j][0] - P.draw[j][0]) * 0.35; P.draw[j][1] += (tgt[j][1] - P.draw[j][1]) * 0.35;
        }
        var pt = function (q) { return [ox + q[0] * fw, oy + q[1] * fh]; };
        g.strokeStyle = col; g.lineWidth = 3; g.lineCap = 'round';
        BONES.forEach(function (b) { var a = P.draw[b[0]], z = P.draw[b[1]]; if (!a || !z) return; a = pt(a); z = pt(z); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(z[0], z[1]); g.stroke(); });
        if (P.draw[0]) { var hd = pt(P.draw[0]); g.beginPath(); g.arc(hd[0], hd[1], 7, 0, 7); g.stroke(); if (P.p.helmet === true) { g.fillStyle = '#FFD400'; g.beginPath(); g.arc(hd[0], hd[1] - 4, 7, Math.PI, 0); g.fill(); } }
        if (!tgt.length && P.p.bx) { var b0 = pt([P.p.bx[0], P.p.bx[1]]), b1 = pt([P.p.bx[2], P.p.bx[3]]); g.setLineDash([5, 4]); g.strokeStyle = '#5B8FFF'; g.strokeRect(b0[0], b0[1], b1[0] - b0[0], b1[1] - b0[1]); g.setLineDash([]); }
        var top = P.draw.filter(Boolean).reduce(function (m, q) { return q[1] < m[1] ? q : m; }, P.p.bx ? [(P.p.bx[0] + P.p.bx[2]) / 2, P.p.bx[1]] : [0.5, 1]);
        var tp = pt(top);
        g.font = '700 12px sans-serif'; g.fillStyle = col;
        g.fillText(id + ' ' + t('st_' + (P.p.st || 'normal')) + (P.p.hr != null ? ' ❤' + P.p.hr : '') + (P.p.wk ? ' · ' + P.p.wk : ''), tp[0] - 20, tp[1] - 14);
        var isF = (view && view.wid === id) || (focus && focus.site === s.name && focus.wid === id);
        if (isF && P.p.bx) {   // 应急目标：闪烁的圆圈 + 十字线
          var c0 = pt([(P.p.bx[0] + P.p.bx[2]) / 2, (P.p.bx[1] + P.p.bx[3]) / 2]), rr = Math.max(26, (P.p.bx[3] - P.p.bx[1]) * fh * 0.65), ph = (Date.now() % 1000) / 1000;
          g.strokeStyle = 'rgba(232,19,58,' + (1 - ph * 0.7) + ')'; g.lineWidth = 3; g.beginPath(); g.arc(c0[0], c0[1], rr * (0.9 + ph * 0.25), 0, 7); g.stroke();
          g.strokeStyle = 'rgba(232,19,58,.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(c0[0] - rr * 1.6, c0[1]); g.lineTo(c0[0] + rr * 1.6, c0[1]); g.moveTo(c0[0], c0[1] - rr * 1.6); g.lineTo(c0[0], c0[1] + rr * 1.6); g.stroke();
        }
      });
      g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '600 11px sans-serif';
      g.fillText(view ? '🎯 ' + t('emg_follow') + ' · ' + s.name + ' · ' + (view.wid || '') + ' · ×' + (view.z || 1).toFixed(1) : 'DIGITAL TWIN · skeleton only · video 0 B', 10, H - 10);
  }
  requestAnimationFrame(drawTwins);


  /* ---------- 应急处置：自动跟踪倒地 / 晕倒的工人 ---------- */
  var focus = null;
  function riskTag(r) {
    if (!r) return '<span class="muted">—</span>';
    var cls = r.level === 'stop' ? 'no' : r.level === 'ok' ? 'ok' : 'q';
    return '<span class="tag ' + cls + '" title="' + esc(r.why || '') + '">' + (r.score != null ? r.score + ' · ' : '') + t('rl_' + r.level) + (r.recovered ? ' ✓' : '') + '</span>';
  }
  function trackWid(a) {
    // 警报来自手表（W-/H-/X- 等编号）时，找它当前佩戴者的骨架编号
    var s = sites[a.site]; if (!s) return a.wid;
    if (s.people[a.wid]) return a.wid;
    if (a.loc && a.loc.track && s.people[a.loc.track]) return a.loc.track;
    var v = s.vitals[a.wid]; return v && v.d.wearer ? v.d.wearer : a.wid;
  }
  function whoTxt(a) { var r = a.worker && window.SHKStore ? SHKStore.get('roster', a.worker) : null; return r ? (r.name || r.id) + ' (' + r.id + ')' : a.worker || a.wid || ''; }
  function emgText(a) {
    var loc = a.loc || {};
    return t('emg_bc_text', { where: a.site + ' ' + (loc.zone ? loc.zone + ' ' : '') + (loc.pos || ''), who: whoTxt(a) + ' ', what: a.msg.replace(/^#?\S+\s/, '') });
  }
  function broadcastAll(a) {
    var text = emgText(a);
    tr.send({ type: 'cmd', action: 'say', site: '*', text: text });
    tr.send({ type: 'notify', to: '*', level: 'danger', title: '🚨 ' + a.site + (a.loc && a.loc.zone ? ' · ' + a.loc.zone : ''), body: text, emg: true, loc: a.loc });
    log('danger', '📢 ' + text);
  }
  function startFocus(a, manual) {
    if (focus && focus.aid === a.aid) { renderFocus(); return; }
    if (focus && !manual && focus.status !== 'cleared') { focus.queue = (focus.queue || []).concat(a.aid); renderFocus(); return; }
    focus = { aid: a.aid, site: a.site, wid: trackWid(a), loc: a.loc, at: a.at, steps: {}, z: 1 };
    if (!a.autoBc) { a.autoBc = Date.now(); broadcastAll(a); }
    $('focus').classList.add('on');
    renderFocus();
    try { $('focus').scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
  }
  function renderFocus() {
    var box = $('focus'); if (!box || !focus) return;
    var a = allAlerts.find(function (x) { return x.aid === focus.aid; }) || {}, s = sites[focus.site] || { vitals: {}, people: {} };
    focus.wid = trackWid(a); focus.loc = a.loc || focus.loc;
    var loc = focus.loc || {}, done = a.status === 'cleared';
    var gps = loc.gps ? '<a target="_blank" rel="noopener" href="https://www.openstreetmap.org/?mlat=' + loc.gps[0] + '&mlon=' + loc.gps[1] + '#map=18/' + loc.gps[0] + '/' + loc.gps[1] + '">' + loc.gps.join(', ') + ' ↗</a>' : '—';
    var st = function (k) { return '<label class="ck"><input type="checkbox" data-st="' + k + '" ' + (focus.steps[k] ? 'checked' : '') + '> ' + t('emg_' + k) + (focus.steps[k] ? ' <small class="muted">' + new Date(focus.steps[k]).toLocaleTimeString() + '</small>' : '') + '</label>'; };
    box.innerHTML = '<div class="fhd ' + (done ? 'done' : '') + '"><b>' + t('emg_title') + '</b><span>' + esc(a.msg || '') + '</span><span class="sp"></span><span class="mono" data-el></span>' +
      (focus.queue && focus.queue.length ? '<span class="tag no">+' + focus.queue.length + '</span>' : '') + '<button data-end>' + t('emg_end') + '</button></div>' +
      '<div class="fbody"><div class="fcv"><canvas id="focusCv"></canvas></div><div class="finfo">' +
      '<table class="kv"><tr><th>' + t('emg_site') + '</th><td>' + esc(focus.site) + '</td></tr><tr><th>' + t('emg_zone') + '</th><td>' + esc(loc.zone || '—') + '</td></tr>' +
      '<tr><th>' + t('emg_pos') + '</th><td>' + esc(loc.pos || '—') + (loc.x != null ? ' <small class="muted">(' + loc.x + ', ' + loc.y + ')</small>' : '') + '</td></tr>' +
      '<tr><th>' + t('emg_cam') + '</th><td>' + esc(loc.cam || '—') + '</td></tr><tr><th>' + t('emg_gps') + '</th><td>' + gps + '</td></tr>' +
      '<tr><th>' + t('c_worker') + '</th><td>' + esc(whoTxt(a)) + ' <span class="muted mono">' + esc(focus.wid || '') + '</span></td></tr>' +
      '<tr><th>' + t('emg_vitals') + '</th><td data-vt>' + vtHtml(a) + '</td></tr></table>' +
      (a.autoBc ? '<div class="note">📢 ' + t('emg_auto_bc') + ' · ' + new Date(a.autoBc).toLocaleTimeString() + '</div>' : '') +
      '<div class="row" style="gap:6px;flex-wrap:wrap;margin:8px 0"><button class="dng" data-bc>' + t('emg_bc_again') + '</button><button data-ask>' + t('emg_ask') + '</button>' +
      '<button class="pri" data-disp>' + t('emg_dispatched') + '</button><a class="btn" href="tel:120">📞 120</a><a class="btn" href="tel:119">📞 119</a></div>' +
      '<div class="fsteps"><b>' + t('emg_steps') + '</b>' + st('s1') + st('s2') + st('s3') + st('s4') + '</div>' +
      '<div class="fsnap"><b>' + t('emg_snap') + '</b>' + (a.snap ? '<img src="' + a.snap + '" alt="snapshot"><small class="muted">' + new Date(a.snapAt).toLocaleTimeString() + '</small>' : '<div class="muted">' + t('emg_nosnap') + '</div>') + '</div>' +
      '</div></div>';
    var q = function (x) { return box.querySelector(x); };
    q('[data-end]').onclick = function () {
      var next = (focus.queue || []).map(function (id) { return allAlerts.find(function (x) { return x.aid === id && x.status !== 'cleared'; }); }).filter(Boolean);
      focus = null; box.classList.remove('on'); box.innerHTML = '';
      if (next.length) { startFocus(next[0], true); focus.queue = next.slice(1).map(function (x) { return x.aid; }); renderFocus(); }
    };
    q('[data-bc]').onclick = function () { broadcastAll(a); };
    q('[data-ask]').onclick = function () { tr.send({ type: 'cmd', action: 'ask', site: focus.site, wid: focus.wid }); log('info', '[' + focus.site + '] → ' + focus.wid + ' ' + t('req_confirm')); };
    q('[data-disp]').onclick = function () { if (!a.ackAt) ack(a.aid); focus.steps.s1 = focus.steps.s1 || Date.now(); tr.send({ type: 'cmd', action: 'say', site: focus.site, text: t('emg_dispatched').replace('✓ ', '') }); renderFocus(); };
    box.querySelectorAll('[data-st]').forEach(function (c) { c.onchange = function () { focus.steps[c.dataset.st] = c.checked ? Date.now() : 0; log('info', '[' + focus.site + '] ' + (c.checked ? '☑ ' : '☐ ') + t('emg_' + c.dataset.st)); renderFocus(); }; });
  }
  function vtHtml(a) {
    var s = sites[focus.site] || { vitals: {} }, now = Date.now();
    var vt = Object.values(s.vitals).find(function (v) { return now - v.at < 6000 && (v.d.wid === a.wid || v.d.wearer === focus.wid); });
    return vt ? '❤ ' + (vt.d.hr != null ? vt.d.hr + ' bpm' : '—') + ' ' + riskTag(vt.d.risk) + (vt.d.motion != null ? ' · ' + t('motion') + ' ' + vt.d.motion + '%' : '') : '—';
  }
  setInterval(function () {
    if (!focus) return;
    var a = allAlerts.find(function (x) { return x.aid === focus.aid; }), vc = $('focus') && $('focus').querySelector('[data-vt]');
    if (a && vc) { var h = vtHtml(a); if (vc.innerHTML !== h) vc.innerHTML = h; }
    var el = $('focus') && $('focus').querySelector('[data-el]'); if (!el) return;
    var sec = Math.floor((Date.now() - focus.at) / 1000);
    el.textContent = t('emg_elapsed') + ' ' + Math.floor(sec / 60) + ':' + ('0' + sec % 60).slice(-2);
  }, 1000);

  /* ---------- 广播 ---------- */
  $('btnBc').onclick = function () {
    var text = $('bcText').value.trim(), site = $('bcSite').value; if (!text || !site) return;
    tr.send({ type: 'cmd', action: 'say', site: site, text: text });
    log('info', '[' + site + '] 📢 ' + text); $('bcText').value = '';
  };

  /* ---------- 跨电脑 ---------- */
  tr.onState = function (s) {
    var p = $('pillLink'); p.className = 'pill ' + (s === 'on' || s === 'off' ? 'ok' : s === 'error' ? 'dng' : 'warn');
    $('linkSt').textContent = s === 'off' ? 'local' : t('st_' + s) + (s === 'on' ? ' · ' + tr.room : '');
    $('btnLink').textContent = s === 'off' ? t('connect') : t('disconnect');
  };
  $('btnLink').onclick = function () { if (tr.mqttState === 'off') tr.connectRoom($('room').value); else tr.disconnectRoom(); };
  if ($('room').value) tr.connectRoom($('room').value);
  if (window.SHKStore) SHKStore.attach(tr);

  function log(level, msg) {
    var d = document.createElement('div'); d.className = 'lv-' + level; d.textContent = new Date().toLocaleTimeString() + '  ' + msg;
    var box = $('log'); box.insertBefore(d, box.firstChild); while (box.children.length > 300) box.lastChild.remove();
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
})();
