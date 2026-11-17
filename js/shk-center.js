/* SHine-K 3.0 · 监控端：接收现场端的骨架、生命体征、警报；可回传确认 / 广播 / 请求举手 */
(function () {
  'use strict';
  var t = SHKI18N.t, FB = SHKFeedback, $ = function (id) { return document.getElementById(id); };
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
    log(m.level, '[' + m.site + '] ' + m.msg);
    if (m.level === 'danger') { FB.beep(1000, 250); setTimeout(function () { FB.beep(1000, 250); }, 330); setTimeout(function () { FB.beep(1000, 250); }, 660); FB.notify('SHine-K ⚠ ' + m.site, m.msg); FB.speak(m.site + '. ' + m.msg); }
    else FB.beep(760, 160);
    renderFeed();
  }
  function onClear(s, m) {
    var a = allAlerts.find(function (x) { return x.aid === m.aid; });
    if (a && a.status !== 'cleared') { a.status = 'cleared'; a.clearedBy = m.by; a.clearedAt = Date.now(); log('info', '[' + m.site + '] ✓ ' + a.msg + ' (' + m.by + ')'); }
    renderFeed();
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
        (done || a.ackAt ? '' : '<button class="' + (a.level === 'danger' ? 'dng' : '') + '" data-a="' + a.aid + '">' + t('center_ack') + '</button>') + '</div>';
    }).join('');
    box.querySelectorAll('button[data-a]').forEach(function (b) { b.onclick = function () { ack(b.dataset.a); }; });
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
      '<div class="twin"><canvas></canvas></div><table class="tb"><thead><tr><th>ID</th><th>' + t('status') + '</th><th>⛑</th><th>🦺</th><th>❤</th><th></th></tr></thead><tbody></tbody></table>';
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
      s.el.querySelector('[data-hb]').textContent = 'CAM ' + (hb.cam ? '●' : '○') + ' · Pose ' + (hb.pose ? '●' : '○') + ' · PPE ' + (hb.ppe ? '●' : '○');
      var rows = Object.keys(s.people).map(function (id) {
        var p = s.people[id].p, st = p.st || 'normal';
        var vt = Object.values(s.vitals).find(function (v) { return v.d.wearer === id && now - v.at < 5000; });
        var hr = vt && vt.d.hr != null ? vt.d.hr : p.hr;
        var ppe = function (v) { return v === true ? '<span class="tag ok">' + t('yes') + '</span>' : v === false ? '<span class="tag no">' + t('no') + '</span>' : '<span class="tag q">' + t('unknown') + '</span>'; };
        return '<tr><td class="mono"><b>' + id + '</b></td><td><span class="tag ' + (st === 'normal' ? 'ok' : 'no') + '">' + t('st_' + st) + '</span> <span class="muted">' + t('p_' + (p.po || 'other')) + (p.tilt != null ? ' ' + p.tilt + '°' : '') + '</span></td>' +
          '<td>' + ppe(p.helmet) + '</td><td>' + ppe(p.vest) + '</td><td class="mono">' + (hr != null ? hr : '—') + '</td>' +
          '<td><button data-ask="' + id + '" data-site="' + esc(k) + '">' + t('req_confirm') + '</button></td></tr>';
      });
      // 不在画面中的手环佩戴者
      Object.keys(s.vitals).forEach(function (wid) {
        var v = s.vitals[wid]; if (now - v.at > 5000 || (v.d.wearer && s.people[v.d.wearer])) return;
        rows.push('<tr><td class="mono"><b>' + esc(wid) + '</b></td><td class="muted">' + t('not_in_view') + (v.d.motion != null ? ' · ' + t('motion') + ' ' + v.d.motion + '%' : '') + '</td><td>—</td><td>—</td><td class="mono">' + (v.d.hr != null ? v.d.hr : '—') + '</td><td>' + (v.d.battery != null ? v.d.battery + '%' : '') + '</td></tr>');
      });
      s.el.querySelector('tbody').innerHTML = rows.join('') || '<tr><td colspan="6" class="muted">' + t('none_yet') + '</td></tr>';
      s.el.querySelectorAll('button[data-ask]').forEach(function (b) {
        b.onclick = function () { tr.send({ type: 'cmd', action: 'ask', site: b.dataset.site, wid: b.dataset.ask }); log('info', '[' + b.dataset.site + '] → ' + b.dataset.ask + ' ' + t('req_confirm')); };
      });
    });
  }
  setInterval(renderTables, 500);

  /* ---------- 数字孪生画布：只用关节点重建，不含任何画面 ---------- */
  function drawTwins() {
    requestAnimationFrame(drawTwins);
    Object.keys(sites).forEach(function (k) {
      var s = sites[k], c = s.cv; if (!c) return;
      var W = c.clientWidth, H = c.clientHeight; if (!W) return;
      if (c.width !== W * 2) { c.width = W * 2; c.height = H * 2; }
      var g = c.getContext('2d'); g.setTransform(2, 0, 0, 2, 0, 0);
      g.fillStyle = '#0B1220'; g.fillRect(0, 0, W, H);
      // 画面区域（保持现场摄像头比例）
      var fw = W, fh = W / s.ar; if (fh > H) { fh = H; fw = H * s.ar; }
      var ox = (W - fw) / 2, oy = (H - fh) / 2;
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
        g.fillText(id + ' ' + t('st_' + (P.p.st || 'normal')) + (P.p.hr != null ? ' ❤' + P.p.hr : ''), tp[0] - 20, tp[1] - 14);
      });
      g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '600 11px sans-serif';
      g.fillText('DIGITAL TWIN · skeleton only · video 0 B', 10, H - 10);
    });
  }
  requestAnimationFrame(drawTwins);

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

  function log(level, msg) {
    var d = document.createElement('div'); d.className = 'lv-' + level; d.textContent = new Date().toLocaleTimeString() + '  ' + msg;
    var box = $('log'); box.insertBefore(d, box.firstChild); while (box.children.length > 300) box.lastChild.remove();
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
})();
