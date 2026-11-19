/* SHine-K 3.0 · 工人手机端
 * · 收到“发给我的”提醒（禁止进入 / 停止作业 / 作业票冻结 / 紧急广播）→ 全屏提示 + 振动 + 语音 + 系统通知
 *   安卓手机把 Chrome 的通知转发到已配对的小米 / 华为手表（在手表 App 的“消息通知”里打开 Chrome），手表就会振动显示。
 * · 🆘 按住 2 秒求救：带上现场、区域、手机定位（只在求救时获取）。
 * · 手机跌倒检测：失重 → 撞击 → 之后 10 秒几乎不动 → 询问 15 秒 → 自动求救。
 * · 也可以用手机连接手表（安卓 Chrome 蓝牙），用和现场端一样的心率风险评估。
 * · 上报隐患 / 未遂事件，查看自己的作业票、安全积分。
 */
(function () {
  'use strict';
  var t = SHKI18N.t, FB = SHKFeedback, $ = function (id) { return document.getElementById(id); };
  SHKI18N.add({
    zh: { w_title: '工人手机端', w_start: '▶ 开启提醒', w_start_d: '开启后：允许通知（会同步到手表振动）、声音和振动。现场或监控端发给你的提醒会立刻显示。',
      w_sos: '🆘 按住 2 秒求救', w_sos_sent: '已发出求救，监控端正在处理', w_sos_ack: '监控端已确认，救援正在赶来', w_sos_cancel: '取消求救', w_sos_msg: '{n} 手机求救',
      w_now: '我的状态', w_permits: '我的作业票', w_report: '上报隐患 / 未遂事件', w_hazard: '隐患', w_nearmiss: '未遂事件', w_where: '位置（例如 A区 3号吊车旁）', w_desc: '发生了什么 / 看到了什么',
      w_low: '一般', w_mid: '较大', w_high: '重大', w_submit: '提交', w_submitted: '已提交，安全员审核后加积分', w_points: '安全积分', w_rank: '第 {r} 名 / {n} 人', w_total: '{p} 分',
      w_devices: '手表 · 跌倒检测', w_watch: '＋ 连接手表（安卓 Chrome）', w_fall_on: '开启手机跌倒检测', w_fall_off: '关闭手机跌倒检测', w_fall_active: '手机跌倒检测已开启（手机放在上衣口袋或挂在胸前）',
      w_fall_q: '检测到跌倒！你还好吗？', w_fall_ok: '我没事', w_fall_cd: '{s} 秒内不点「我没事」将自动求救', w_fall_msg: '{n} 手机检测到跌倒且无回应',
      w_setup: '设置', w_code: '工号', w_site: '现场', w_save: '保存并连接', w_wake: '保持屏幕常亮', w_got: '知道了',
      w_note: '和现场端、监控端输入同一个房间码。要让手表振动：在手机的小米运动健康 / 华为运动健康 App 里打开“消息通知”，并允许 Chrome 的通知。',
      w_ok: '正常 · 可以作业', w_stop: '停止作业 · 请休息', w_zone: '位置：{z}', w_zone_bad: '在「{z}」未按要求佩戴防护', w_no_permit: '没有我的作业票', w_role_w: '作业人员', w_role_g: '监护人',
      w_unknown: '未设置工号', w_hr: '心率', w_env: '热指数 {hi}℃', w_recent: '最近提醒', w_none: '暂无', w_frozen_why: '冻结原因：{why}', w_watch_err: '手表：{msg}',
      w_stop_say: '你的心率异常，现在禁止作业，请到阴凉处坐下休息，等待班组长确认。', w_release: '已确认复工' },
    ko: { w_title: '작업자 휴대폰', w_start: '▶ 알림 켜기', w_start_d: '켜면 알림(워치 진동으로 전달), 소리, 진동을 허용합니다. 현장이나 관제에서 보낸 알림이 바로 표시됩니다.',
      w_sos: '🆘 2초간 눌러 구조 요청', w_sos_sent: '구조 요청을 보냈습니다. 관제에서 처리 중', w_sos_ack: '관제가 확인했습니다. 구조가 오고 있습니다', w_sos_cancel: '구조 요청 취소', w_sos_msg: '{n} 휴대폰 구조 요청',
      w_now: '내 상태', w_permits: '내 작업허가', w_report: '위험요인 / 아차사고 신고', w_hazard: '위험요인', w_nearmiss: '아차사고', w_where: '위치 (예: A구역 3번 크레인 옆)', w_desc: '무슨 일이 있었나요 / 무엇을 봤나요',
      w_low: '일반', w_mid: '중대', w_high: '심각', w_submit: '제출', w_submitted: '제출됨. 안전관리자 확인 후 포인트 지급', w_points: '안전 포인트', w_rank: '{n}명 중 {r}위', w_total: '{p}점',
      w_devices: '워치 · 넘어짐 감지', w_watch: '＋ 워치 연결 (안드로이드 Chrome)', w_fall_on: '휴대폰 넘어짐 감지 켜기', w_fall_off: '휴대폰 넘어짐 감지 끄기', w_fall_active: '휴대폰 넘어짐 감지 켜짐 (상의 주머니나 가슴에)',
      w_fall_q: '넘어짐 감지! 괜찮으세요?', w_fall_ok: '괜찮아요', w_fall_cd: '{s}초 안에 「괜찮아요」를 누르지 않으면 자동으로 구조 요청', w_fall_msg: '{n} 휴대폰 넘어짐 감지, 응답 없음',
      w_setup: '설정', w_code: '사번', w_site: '현장', w_save: '저장 후 연결', w_wake: '화면 켜짐 유지', w_got: '확인',
      w_note: '현장·관제와 같은 방 코드를 입력하세요. 워치 진동: 휴대폰의 Mi Fitness / Huawei Health 앱에서 알림을 켜고 Chrome 알림을 허용하세요.',
      w_ok: '정상 · 작업 가능', w_stop: '작업 중지 · 휴식', w_zone: '위치: {z}', w_zone_bad: '「{z}」에서 보호구 미착용', w_no_permit: '내 작업허가 없음', w_role_w: '작업자', w_role_g: '감시자',
      w_unknown: '사번 미설정', w_hr: '심박', w_env: '열지수 {hi}℃', w_recent: '최근 알림', w_none: '없음', w_frozen_why: '동결 사유: {why}', w_watch_err: '워치: {msg}',
      w_stop_say: '심박 이상으로 지금은 작업할 수 없습니다. 그늘에 앉아 쉬고 반장의 확인을 기다리세요.', w_release: '작업 재개 확인됨' },
    en: { w_title: 'Worker phone', w_start: '▶ Turn on alerts', w_start_d: 'This allows notifications (forwarded to your watch), sound and vibration. Alerts sent to you by the field page or the center appear at once.',
      w_sos: '🆘 Hold 2 s for help', w_sos_sent: 'Help request sent; the center is handling it', w_sos_ack: 'The center confirmed; help is on the way', w_sos_cancel: 'Cancel help request', w_sos_msg: '{n} phone SOS',
      w_now: 'My status', w_permits: 'My permits', w_report: 'Report a hazard / near miss', w_hazard: 'Hazard', w_nearmiss: 'Near miss', w_where: 'Where (e.g. Zone A next to crane 3)', w_desc: 'What happened / what did you see',
      w_low: 'Minor', w_mid: 'Major', w_high: 'Serious', w_submit: 'Submit', w_submitted: 'Submitted; points after the safety officer reviews it', w_points: 'Safety points', w_rank: 'Rank {r} of {n}', w_total: '{p} pts',
      w_devices: 'Watch · fall detection', w_watch: '＋ Connect watch (Android Chrome)', w_fall_on: 'Turn on phone fall detection', w_fall_off: 'Turn off phone fall detection', w_fall_active: 'Phone fall detection on (keep the phone in a chest pocket)',
      w_fall_q: 'Fall detected! Are you OK?', w_fall_ok: 'I’m OK', w_fall_cd: 'Help will be called automatically in {s} s unless you press “I’m OK”', w_fall_msg: '{n} phone detected a fall, no response',
      w_setup: 'Settings', w_code: 'Worker ID', w_site: 'Site', w_save: 'Save and connect', w_wake: 'Keep screen on', w_got: 'OK',
      w_note: 'Enter the same room code as the field page and center. For watch vibration: turn on notifications in the Mi Fitness / Huawei Health app and allow Chrome notifications.',
      w_ok: 'Normal · OK to work', w_stop: 'Stop work · rest', w_zone: 'Location: {z}', w_zone_bad: 'Missing protective gear in “{z}”', w_no_permit: 'No permits for me', w_role_w: 'Worker', w_role_g: 'Guardian',
      w_unknown: 'Worker ID not set', w_hr: 'HR', w_env: 'Heat index {hi} °C', w_recent: 'Recent alerts', w_none: 'None', w_frozen_why: 'Frozen: {why}', w_watch_err: 'Watch: {msg}',
      w_stop_say: 'Your heart rate is abnormal. You may not work now. Sit down in the shade and wait for your team leader.', w_release: 'Cleared to return to work' }
  });

  var tr = new SHKTransport('worker');
  var me = localStorage.getItem('shk3_wcode') || '', site = localStorage.getItem('shk3_wsite') || 'SITE-A';
  var last = { vitals: null, pose: null, env: null }, recent = [], swReg = null, wake = null, sos = null;
  var dev = null, model = null, risk = null;
  SHKStore.attach(tr);

  /* ---------- 语言 ---------- */
  function langs() {
    document.querySelectorAll('.langs button').forEach(function (b) {
      b.classList.toggle('on', b.dataset.l === SHKI18N.lang);
      b.onclick = function () { SHKI18N.set(b.dataset.l); FB.setLang(b.dataset.l); langs(); render(); };
    });
  }
  langs(); FB.setLang(SHKI18N.lang); SHKI18N.apply();

  $('btnStart').onclick = async function () {
    $('gate').style.display = 'none'; FB.unlock();
    try { if ('Notification' in window && Notification.permission === 'default') await Notification.requestPermission(); } catch (e) {}
    try { if ('serviceWorker' in navigator) swReg = await navigator.serviceWorker.register('sw.js'); } catch (e) { console.warn(e); }
    if (!me) $('code').focus();
  };

  /* ---------- 设置 ---------- */
  $('code').value = me; $('site').value = site; $('room').value = SHKTransport.savedRoom();
  $('btnSave').onclick = function () {
    me = $('code').value.trim(); site = $('site').value.trim() || 'SITE-A';
    try { localStorage.setItem('shk3_wcode', me); localStorage.setItem('shk3_wsite', site); } catch (e) {}
    if ($('room').value.trim()) tr.connectRoom($('room').value.trim());
    render();
  };
  $('chkWake').onchange = async function () {
    try { if (this.checked) wake = await navigator.wakeLock.request('screen'); else if (wake) { wake.release(); wake = null; } } catch (e) { this.checked = false; }
  };
  tr.onState = function (s) { var p = $('pillLink'); p.className = 'pill ' + (s === 'on' ? 'ok' : s === 'error' ? 'dng' : s === 'off' ? '' : 'warn'); $('linkSt').textContent = s === 'off' ? 'local' : s === 'on' ? tr.room : s; };
  tr.onState('off');
  if ($('room').value) tr.connectRoom($('room').value);

  /* ---------- 收到消息 ---------- */
  tr.on(function (m) {
    if (m.type === 'notify') {
      if (!(m.to === '*' || (me && m.to === me) || m.to === 'site:' + site)) return;
      if (recent.some(function (r) { return r.body === m.body && Date.now() - r.at < 10000; })) return;   // 现场端和监控端都会发紧急广播，只提示一次
      show(m);
    } else if (m.type === 'vitals' && me && m.worker === me && m.wid !== myWid()) last.vitals = { at: Date.now(), d: m };
    else if (m.type === 'pose' && m.site === site && me) { var p = (m.people || []).find(function (x) { return x.wk === me; }); if (p) last.pose = { at: Date.now(), p: p }; }
    else if (m.type === 'env' && m.site === site) last.env = m;
    else if (m.type === 'cmd' && m.action === 'ack' && sos && m.aid === sos.aid) { sos.ack = true; show({ level: 'info', title: '✓', body: t('w_sos_ack') }); render(); }
    else if (m.type === 'cmd' && m.action === 'release' && m.wid === myWid() && model) { model.release(); risk = null; show({ level: 'info', title: '✓', body: t('w_release') }); sendClear('stop'); }
  });

  function pattern(lv) { return lv === 'danger' ? [800, 300, 800, 300, 800] : lv === 'warn' ? [400, 200, 400] : [200]; }
  function show(m) {
    var lv = m.level || 'info';
    recent.unshift({ at: Date.now(), title: m.title || '', body: m.body || '', level: lv }); recent = recent.slice(0, 8);
    $('alTitle').textContent = m.title || ''; $('alBody').textContent = m.body || '';
    $('alertBox').className = 'wk-alert on ' + lv;
    FB.vibrate(pattern(lv)); if (lv === 'danger') FB.siren('warn'); else FB.beep(880, 200);
    if (m.body) FB.speak(m.body);
    var opts = { body: m.body || '', tag: m.emg ? 'shk-emg' : 'shk-' + lv, renotify: true, requireInteraction: lv === 'danger' || !!m.sticky, vibrate: pattern(lv) };
    try {
      if (swReg && Notification.permission === 'granted') swReg.showNotification(m.title || 'SHine-K', opts);
      else if ('Notification' in window && Notification.permission === 'granted') new Notification(m.title || 'SHine-K', opts);
    } catch (e) {}
    render();
  }
  $('alOk').onclick = function () { $('alertBox').className = 'wk-alert'; FB.stopSiren(); };

  /* ---------- 求救 ---------- */
  function myWid() { return 'M-' + (me || 'anon'); }
  function myName() { var r = me && SHKStore.get('roster', me); return r ? (r.name || r.id) : (me || '?'); }
  function zoneNow() { return last.pose && Date.now() - last.pose.at < 30000 ? last.pose.p.zone : null; }
  function sendAlert(kind, msg, extra) {
    var a = Object.assign({ type: 'alert', site: site, aid: 'M' + Date.now().toString(36), key: myWid() + ':' + kind, wid: myWid(), kind: kind, level: 'danger', msg: msg,
      loc: { site: site, zone: zoneNow(), src: 'phone' }, worker: me || null, emg: kind === 'sos' || kind === 'fall_noresp' || kind === 'collapse' }, extra || {});
    tr.send(a); return a;
  }
  function sendClear(kind) { tr.send({ type: 'clear', site: site, aid: (kind === 'sos' && sos) ? sos.aid : 'M-' + kind, key: myWid() + ':' + kind, by: 'worker' }); }
  function callHelp(kind, msg) {
    FB.unlock(); FB.vibrate([200, 100, 200]);
    sos = sendAlert(kind, msg); sos.at = Date.now(); render();
    if (navigator.geolocation) navigator.geolocation.getCurrentPosition(function (p) {
      sos.loc.gps = [+p.coords.latitude.toFixed(6), +p.coords.longitude.toFixed(6)]; sos.loc.acc = Math.round(p.coords.accuracy);
      tr.send(Object.assign({}, sos, { ts: Date.now() }));   // 同一个编号再发一次，带上定位
      render();
    }, function () {}, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
  }
  (function () {
    var b = $('btnSos'), bar = $('sosBar'), timer = null, t0 = 0;
    var stop = function () { clearInterval(timer); timer = null; bar.style.width = '0'; };
    b.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      try { b.setPointerCapture(e.pointerId); } catch (x) {}   // 手指轻微移动也不中断长按
      if (sos && !sos.cancelled) return;
      t0 = Date.now(); stop();
      timer = setInterval(function () {
        var k = (Date.now() - t0) / 2000; bar.style.width = Math.min(100, k * 100) + '%';
        if (k >= 1) { stop(); callHelp('sos', t('w_sos_msg', { n: myName() })); }
      }, 50);
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (ev) { b.addEventListener(ev, stop); });
  })();

  /* ---------- 手机跌倒检测：失重 → 撞击 → 静止 → 询问 → 自动求救 ---------- */
  var fall = { on: false, ff: 0, impactAt: 0, buf: [], asking: null };
  function onMotion(e) {
    var a = e.accelerationIncludingGravity; if (!a || a.x == null) return;
    var g = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z) / 9.81, now = Date.now();
    fall.buf.push({ t: now, g: g }); while (fall.buf.length && now - fall.buf[0].t > 12000) fall.buf.shift();
    if (g < 0.4) { if (!fall.ff) fall.ff = now; } else if (g > 2.5 && fall.ff && now - fall.ff < 1200 && now - fall.ff > 60) { fall.impactAt = now; fall.ff = 0; }
    else if (g >= 0.4 && fall.ff && now - fall.ff > 1200) fall.ff = 0;
    if (fall.impactAt && !fall.asking && now - fall.impactAt > 10000) {
      var after = fall.buf.filter(function (x) { return x.t > fall.impactAt + 1500; }).map(function (x) { return x.g; });
      var mean = after.reduce(function (s, v) { return s + v; }, 0) / (after.length || 1);
      var sd = Math.sqrt(after.reduce(function (s, v) { return s + (v - mean) * (v - mean); }, 0) / (after.length || 1));
      fall.impactAt = 0;
      if (after.length > 20 && sd < 0.12) askFall();
    }
  }
  function askFall() {
    var left = 15;
    fall.asking = setInterval(function () {
      left--; $('alBody').textContent = t('w_fall_cd', { s: left });
      FB.vibrate([300]);
      if (left <= 0) { clearInterval(fall.asking); fall.asking = null; $('alertBox').className = 'wk-alert'; callHelp('fall_noresp', t('w_fall_msg', { n: myName() })); }
    }, 1000);
    show({ level: 'danger', title: t('w_fall_q'), body: t('w_fall_cd', { s: left }) });
    $('alOk').textContent = t('w_fall_ok');
    $('alOk').onclick = function () { clearInterval(fall.asking); fall.asking = null; $('alertBox').className = 'wk-alert'; FB.stopSiren(); $('alOk').textContent = t('w_got'); $('alOk').onclick = function () { $('alertBox').className = 'wk-alert'; FB.stopSiren(); }; };
  }
  $('btnFall').onclick = async function () {
    if (fall.on) { window.removeEventListener('devicemotion', onMotion); fall.on = false; render(); return; }
    try { if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') { var r = await DeviceMotionEvent.requestPermission(); if (r !== 'granted') return; } } catch (e) { return; }
    window.addEventListener('devicemotion', onMotion); fall.on = true; render();
  };

  /* ---------- 手机连接手表（安卓 Chrome）：和现场端相同的风险评估 ---------- */
  $('btnWatch').onclick = async function () {
    if (!SHKBLE.supported()) { $('devInfo').textContent = t('ble_unsupported'); return; }
    var d = new SHKBLE.HRDevice();
    try { await d.request({}); } catch (e) { if (e.name !== 'NotFoundError') $('devInfo').textContent = t('w_watch_err', { msg: e.message || e }); return; }
    dev = d; model = new SHKRisk.RiskModel({});
    d.on('data', function (x) {
      var r = SHKStore.get('roster', me); if (r) { model.age = +r.age || null; model.restHR = +r.rest || null; }
      var prev = risk ? risk.level : 'ok';
      risk = model.update(Date.now(), x.hr, null, { hi: last.env ? last.env.hi : null });
      if (risk && risk.collapse) sendAlert('collapse', myName() + ' ' + t('ev_collapse_p'), {});
      if (risk && risk.level === 'stop' && prev !== 'stop') { sendAlert('stop_work', myName() + ' · ' + t('w_stop'), { emg: false }); show({ level: 'danger', title: t('w_stop'), body: t('w_stop_say'), sticky: true }); }
      if (risk && risk.level === 'stop' && risk.recovered && !risk._sentRec) { risk._sentRec = true; tr.send({ type: 'alert', site: site, aid: 'M-stop', key: myWid() + ':stop_work', wid: myWid(), kind: 'stop_work', level: 'warn', msg: myName() + ' ✓', worker: me, recovered: true }); }
      render();
    });
    render();
  };
  SHKI18N.add({ zh: { ev_collapse_p: '疑似晕倒（手机连接的手表）', rl_ok: '正常', rl_watch: '关注', rl_warn: '预警', rl_stop: '停止作业' }, ko: { ev_collapse_p: '실신 의심 (휴대폰 연결 워치)', rl_ok: '정상', rl_watch: '관찰', rl_warn: '경고', rl_stop: '작업 중지' }, en: { ev_collapse_p: 'possible collapse (watch on phone)', rl_ok: 'Normal', rl_watch: 'Watch', rl_warn: 'Warning', rl_stop: 'Stop work' } });
  setInterval(function () {
    if (!dev) return;
    tr.send({ type: 'vitals', site: site, wid: myWid(), name: dev.name, conn: dev.isConnected(), wearer: null, dev: 'phone', hr: dev.hr, worker: me || null,
      risk: risk ? { level: risk.level, score: risk.score, hrr: risk.hrr, psi: risk.psi, recovered: risk.recovered } : null, real: true });
  }, 1000);

  /* ---------- 上报隐患 / 未遂事件 ---------- */
  function seg(id) { var box = $(id); box.querySelectorAll('button').forEach(function (b) { b.onclick = function () { box.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); }); }; }); }
  seg('rType'); seg('rSev');
  $('btnReport').onclick = function () {
    var txt = $('rText').value.trim(); if (!txt) { $('rText').focus(); return; }
    SHKStore.put('reports', { type: $('rType').querySelector('.on').dataset.v, sev: $('rSev').querySelector('.on').dataset.v, where: $('rWhere').value.trim() || zoneNow() || '',
      text: txt, worker: me || null, site: site, at: Date.now(), status: 'new' });
    $('rText').value = ''; $('rWhere').value = ''; $('rMsg').textContent = '✓ ' + t('w_submitted'); FB.beep(1200, 120);
  };

  /* ---------- 显示 ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function render() {
    var r = me && SHKStore.get('roster', me);
    $('wkName').textContent = me ? (r && r.name ? r.name : me) : t('w_unknown');
    $('wkSub').textContent = (me ? me + ' · ' : '') + site + (r && r.team ? ' · ' + r.team : '');
    $('rosterList').innerHTML = SHKStore.all('roster').map(function (x) { return '<option value="' + esc(x.id) + '">' + esc(x.name || '') + '</option>'; }).join('');
    // 总体状态
    var v = last.vitals && Date.now() - last.vitals.at < 8000 ? last.vitals.d : null;
    var rk = risk || (v && v.risk) || null, stop = rk && rk.level === 'stop' && !rk.recovered;
    var pz = last.pose && Date.now() - last.pose.at < 8000 ? last.pose.p : null, zoneBad = pz && pz.zok === false;
    var cls = stop || zoneBad || (sos && !sos.cancelled) ? 'dng' : rk && rk.level === 'warn' ? 'warn' : 'ok';
    var title = sos && !sos.cancelled ? (sos.ack ? t('w_sos_ack') : t('w_sos_sent')) : stop ? t('w_stop') : zoneBad ? t('w_zone_bad', { z: pz.zone }) : t('w_ok');
    var hr = dev && dev.hr != null ? dev.hr : v && v.hr != null ? v.hr : null;
    $('status').className = 'wk-status ' + cls;
    $('status').innerHTML = '<div class="big">' + esc(title) + '</div><div class="sub">' +
      (hr != null ? '❤ ' + hr + ' bpm' + (rk ? ' · ' + t('rl_' + rk.level) : '') : '') +
      (pz && pz.zone ? ' · ' + esc(t('w_zone', { z: pz.zone })) : '') +
      (last.env && last.env.hi != null ? ' · 🌡 ' + t('w_env', { hi: last.env.hi }) : '') + '</div>' +
      (sos && !sos.cancelled ? '<button data-cancel>' + t('w_sos_cancel') + '</button>' : '');
    var cb = $('status').querySelector('[data-cancel]'); if (cb) cb.onclick = function () { sos.cancelled = true; sendClear('sos'); render(); };
    // 我的提醒
    $('mine').innerHTML = '<div class="muted" style="font-size:12px">' + t('w_recent') + '</div>' + (recent.length ? recent.map(function (x) {
      return '<div class="al ' + (x.level === 'info' ? '' : x.level) + '"><div class="m"><b>' + esc(x.title) + '</b><span>' + esc(x.body) + ' · ' + new Date(x.at).toLocaleTimeString() + '</span></div></div>';
    }).join('') : '<div class="empty">' + t('w_none') + '</div>');
    // 我的作业票
    var ps = me ? SHKPermit.all().filter(function (p) { return ((p.workers || []).indexOf(me) >= 0 || p.guardian === me) && p.status !== 'closed' && p.status !== 'draft'; }) : [];
    $('myPermits').innerHTML = ps.length ? ps.map(function (p) {
      var z = SHKStore.get('zones', p.zone) || { name: p.zone }, st = SHKPermit.status(p);
      return '<div class="wk-permit ' + st + '"><b>' + esc(SHKPermit.typeName(p.type)) + ' · ' + esc(z.name) + '</b><span class="tag ' + (st === 'active' ? 'ok' : st === 'frozen' || st === 'expired' ? 'no' : 'q') + '">' + t('ps_' + st) + '</span>' +
        '<div class="muted">' + (p.guardian === me ? t('w_role_g') : t('w_role_w')) + ' · ' + (p.start ? new Date(p.start).toLocaleString() : '') + ' – ' + (p.end ? new Date(p.end).toLocaleTimeString() : '') + '</div>' +
        (p.freeze && st === 'frozen' ? '<div class="muted">' + esc(t('w_frozen_why', { why: p.freeze.reason })) + '</div>' : '') + '</div>';
    }).join('') : '<div class="empty">' + t('w_no_permit') + '</div>';
    // 积分
    var tot = {}; SHKStore.all('points').forEach(function (p) { tot[p.worker] = (tot[p.worker] || 0) + (+p.delta || 0); });
    var mine = tot[me] || 0, arr = Object.keys(tot).map(function (k) { return tot[k]; }).sort(function (a, b) { return b - a; });
    var rank = arr.indexOf(mine) + 1 || arr.length + 1;
    var hist = SHKStore.all('points').filter(function (p) { return p.worker === me; }).sort(function (a, b) { return b.at - a.at; }).slice(0, 5);
    $('points').innerHTML = '<div class="wk-pts"><b>' + t('w_total', { p: mine }) + '</b><span>' + t('w_rank', { r: rank, n: Math.max(arr.length, 1) }) + '</span></div>' +
      hist.map(function (p) { return '<div class="muted" style="font-size:12px">' + (p.delta > 0 ? '+' : '') + p.delta + ' · ' + esc(p.reason || '') + ' · ' + new Date(p.at).toLocaleDateString() + '</div>'; }).join('');
    $('btnFall').textContent = fall.on ? t('w_fall_off') : t('w_fall_on');
    $('devInfo').textContent = [dev ? dev.name + (dev.hr != null ? ' · ❤ ' + dev.hr : '') : '', fall.on ? t('w_fall_active') : ''].filter(Boolean).join(' · ');
  }
  SHKStore.on(function () { render(); });
  setInterval(render, 2000);
  render();
  window.SHKWorker = { show: show, callHelp: callHelp, _fall: fall, _onMotion: onMotion };
})();
