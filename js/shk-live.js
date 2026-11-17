/* SHine-K 3.0 · 现场端主程序
 * 摄像头 → MediaPipe 关节点（多人）→ 追踪编号 → 跌倒/SOS/姿势状态机
 *        → YOLO11 安全帽/背心（每 0.5 秒）→ 分配到每个人
 * 可穿戴：蓝牙心率带 / EmoConnect 手表 → 心率规则、手腕撞击规则
 * 反馈：警报声、语音、震动、桌面通知、USB 警示灯；监控端可回传“确认 / 广播 / 请求举手”
 * 传输：只发化名编号 + 13 个关节点 + 数字 + 事件，视频永不离开本机
 */
(function () {
  'use strict';
  var t = SHKI18N.t, FB = SHKFeedback;
  var MP_VER = '1.2.3';
  var POSE_MODELS = ['models/pose_landmarker_lite.task', // 本站自带（Apache-2.0，Google MediaPipe）
    'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'];
  var KP13 = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
  var BONES = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28]];

  var $ = function (id) { return document.getElementById(id); };
  var video = $('video'), cv = $('overlay'), g = cv.getContext('2d');
  var tr = new SHKTransport('field');
  var pose = null, stream = null, running = false, lastVT = -1;
  var tracks = [], nextId = 1, devices = [], alerts = [], ppeBusy = false, lastPpeAt = 0, lastDets = [];
  var fps = { n: 0, t: performance.now(), v: 0 };
  var site = localStorage.getItem('shk3_site') || 'SITE-A';

  /* ================= 启动 ================= */
  SHKI18N.apply();
  document.querySelectorAll('.langs button').forEach(function (b) {
    b.classList.toggle('on', b.dataset.l === SHKI18N.lang);
    b.onclick = function () {
      SHKI18N.set(b.dataset.l); FB.setLang(b.dataset.l);
      document.querySelectorAll('.langs button').forEach(function (x) { x.classList.toggle('on', x.dataset.l === b.dataset.l); });
      renderAll();
    };
  });
  FB.setLang(SHKI18N.lang);
  $('siteName').value = site;
  $('siteName').onchange = function () { site = this.value.trim() || 'SITE-A'; localStorage.setItem('shk3_site', site); };
  $('room').value = SHKTransport.savedRoom();
  if (!SHKBLE.supported()) { $('bleNote').style.display = 'block'; $('btnHR').disabled = $('btnEmo').disabled = true; }
  if (!('serial' in navigator)) $('btnBeacon').disabled = true;

  $('btnStart').onclick = async function () {
    $('gate').style.display = 'none';
    FB.unlock();
    try { speechSynthesis.getVoices(); } catch (e) {}
    loadModels();
    await listCameras();
    startCamera();
  };

  /* ================= AI 模型 ================= */
  function setPill(id, stId, state, text) {
    var p = $(id); p.className = 'pill ' + (state === 'ok' ? 'ok' : state === 'err' ? 'dng' : state === 'load' ? 'warn' : '');
    $(stId).textContent = text;
  }
  async function loadModels() {
    setPill('pillPose', 'poseSt', 'load', t('loading'));
    setPill('pillPpe', 'ppeSt', 'load', t('loading'));
    (async function () {
      try {
        var mp = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@' + MP_VER + '/vision_bundle.mjs');
        var fileset = await mp.FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@' + MP_VER + '/wasm');
        var opts = function (url, d) { return { baseOptions: { modelAssetPath: url, delegate: d }, runningMode: 'VIDEO', numPoses: 4, minPoseDetectionConfidence: 0.5, minPosePresenceConfidence: 0.5, minTrackingConfidence: 0.5 }; };
        var lastErr = null;
        outer: for (var mi = 0; mi < POSE_MODELS.length; mi++) {
          for (var di = 0; di < 2; di++) {
            var dlg = di ? 'CPU' : 'GPU';
            try { pose = await mp.PoseLandmarker.createFromOptions(fileset, opts(POSE_MODELS[mi], dlg)); setPill('pillPose', 'poseSt', 'ok', t('ready') + ' · ' + dlg); break outer; }
            catch (e) { lastErr = e; console.warn('[pose]', POSE_MODELS[mi], dlg, e); }
          }
        }
        if (!pose) throw lastErr || new Error('pose model');
      } catch (e) { console.error(e); setPill('pillPose', 'poseSt', 'err', t('failed')); log('danger', 'Pose: ' + (e.message || e)); }
    })();
    (async function () {
      try { var be = await SHKPPE.load('models/ppe.onnx'); setPill('pillPpe', 'ppeSt', 'ok', t('ready') + ' · ' + (be === 'webgpu' ? 'GPU' : 'CPU')); }
      catch (e) { console.error(e); setPill('pillPpe', 'ppeSt', 'err', t('failed')); log('danger', 'PPE: ' + (e.message || e)); }
    })();
  }

  /* ================= 摄像头 ================= */
  async function listCameras() {
    try {
      var tmp = await navigator.mediaDevices.getUserMedia({ video: true });
      tmp.getTracks().forEach(function (k) { k.stop(); });
    } catch (e) {}
    var list = (await navigator.mediaDevices.enumerateDevices()).filter(function (d) { return d.kind === 'videoinput'; });
    var sel = $('camSel'), saved = localStorage.getItem('shk3_cam');
    sel.innerHTML = '';
    list.forEach(function (d, i) {
      var o = document.createElement('option'); o.value = d.deviceId; o.textContent = d.label || ('Camera ' + (i + 1));
      if (d.deviceId === saved) o.selected = true; sel.appendChild(o);
    });
    sel.onchange = function () { localStorage.setItem('shk3_cam', sel.value); if (running) { stopCamera(); startCamera(); } };
  }
  async function startCamera() {
    try {
      var id = $('camSel').value;
      stream = await navigator.mediaDevices.getUserMedia({ video: id ? { deviceId: { exact: id }, width: { ideal: 1280 }, height: { ideal: 720 } } : { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      video.srcObject = stream; await video.play();
      running = true; $('btnCam').textContent = t('cam_stop'); $('btnCam').className = '';
      $('hint').style.display = 'none';
      requestAnimationFrame(loop);
    } catch (e) { log('danger', t('ev_cam_err', { msg: e.message || e.name })); $('hint').textContent = t('ev_cam_err', { msg: e.message || e.name }); }
  }
  function stopCamera() {
    running = false; if (stream) stream.getTracks().forEach(function (k) { k.stop(); }); stream = null;
    $('btnCam').textContent = t('cam_start'); $('btnCam').className = 'pri';
  }
  $('btnCam').onclick = function () { FB.unlock(); if (running) stopCamera(); else startCamera(); };
  $('chkSkel').onchange = function () { $('stage').classList.toggle('skel', this.checked); };

  /* ================= 主循环 ================= */
  function loop() {
    if (!running) return;
    requestAnimationFrame(loop);
    if (video.readyState < 2 || video.currentTime === lastVT) return;
    lastVT = video.currentTime;
    var W = video.videoWidth, H = video.videoHeight, now = performance.now();
    if (cv.width !== W) { cv.width = W; cv.height = H; }
    var lms = [];
    if (pose) {
      var t0 = performance.now();
      try { lms = pose.detectForVideo(video, now).landmarks || []; } catch (e) { console.warn(e); }
      $('sPose').textContent = Math.round(performance.now() - t0);
    }
    updateTracks(lms, W, H, now);
    if (SHKPPE.loaded && !ppeBusy && now - lastPpeAt > 500) runPPE(W, H);
    draw(W, H);
    fps.n++; if (now - fps.t > 1000) { fps.v = Math.round(fps.n * 1000 / (now - fps.t)); fps.n = 0; fps.t = now; $('sFps').textContent = fps.v; }
  }

  /* ---------- 追踪：按中心点距离把每帧的人和已有编号对应 ---------- */
  function updateTracks(lms, W, H, now) {
    var feats = lms.map(function (lm) { return { lm: lm, f: SHKFall.features(lm, W, H) }; }).filter(function (x) { return x.f; });
    var used = {};
    tracks.forEach(function (tk) { tk.matched = false; });
    // 贪心匹配
    var pairs = [];
    feats.forEach(function (d, di) {
      tracks.forEach(function (tk, ti) {
        var b = tk.f.box, diag = Math.hypot(b[2] - b[0], b[3] - b[1]) || 0.2;
        var dist = Math.hypot(d.f.cx - tk.f.cx, d.f.cy - tk.f.cy) / diag;
        if (dist < 1.0) pairs.push({ di: di, ti: ti, d: dist });
      });
    });
    pairs.sort(function (a, b) { return a.d - b.d; });
    var dUsed = {};
    pairs.forEach(function (p) {
      if (dUsed[p.di] || used[p.ti]) return;
      dUsed[p.di] = used[p.ti] = true;
      var tk = tracks[p.ti]; tk.lm = feats[p.di].lm; tk.f = feats[p.di].f; tk.seen = now; tk.matched = true; tk.noPose = false;
    });
    feats.forEach(function (d, di) {
      if (dUsed[di]) return;
      newTrack({ lm: d.lm, f: d.f, seen: now, matched: true, noPose: false });
    });
    // 状态机
    tracks.forEach(function (tk) {
      if (!tk.matched || tk.noPose) return;
      tk.fsm.update(tk.f, now).forEach(function (e) { onFallEvent(tk, e); });
    });
    // 删除：普通 3 秒；跌倒相关状态保留 20 秒（被遮挡也继续计时提醒）
    tracks = tracks.filter(function (tk) {
      var keep = tk.noPose ? 5000 : (tk.fsm.state === 'normal') ? 3000 : 20000;
      if (now - tk.seen > keep) {
        alerts.filter(function (a) { return a.wid === 'P' + tk.id && a.level !== 'danger'; }).map(function (a) { return a.key; }).forEach(function (k) { clearAlert(k); });
        return false;
      }
      return true;
    });
    if (tracks.length === 1) devices.forEach(function (d) { if (d.wearer === 'auto') d.wearerId = tracks[0].id; });
    $('hint').style.display = (running && !tracks.length && !pose) ? 'block' : 'none';
  }

  function newTrack(o) {
    o.id = nextId++; o.born = o.seen; o.ppeHist = []; o.ppe = {}; o.fsm = new SHKFall.FallFSM(o.id);
    tracks.push(o); return o;
  }

  function onFallEvent(tk, e) {
    var who = 'P' + tk.id, id = tk.id;
    var msg = t('ev_' + e.kind, { id: id, secs: e.secs });
    if (e.kind === 'fall_detected' || e.kind === 'fall_recovered' || e.kind === 'fall_cleared') { log('info', msg); send({ type: 'event', kind: e.kind, wid: who, level: 'info', msg: msg }); if (e.kind === 'fall_cleared') clearAlertsFor(who); return; }
    if (e.kind === 'fall_ask') { raise({ key: who + ':fall', wid: who, kind: e.kind, level: 'warn', msg: msg, say: t('say_fall_ask', { id: id }) }); return; }
    if (e.kind === 'confirm_noresp') { raise({ key: who + ':fall', wid: who, kind: e.kind, level: 'danger', msg: msg, say: t('say_confirm_noresp', { id: id }) }); return; }
    if (e.kind === 'fall_ok' || e.kind === 'confirm_ok') { clearAlertsFor(who); log('info', msg); FB.speak(t('say_fall_ok', { id: id })); send({ type: 'event', kind: e.kind, wid: who, level: 'info', msg: msg }); return; }
    if (e.kind === 'fall_noresp') { raise({ key: who + ':fall', wid: who, kind: e.kind, level: 'danger', msg: msg, say: t('say_fall_noresp', { id: id }) }); return; }
    if (e.kind === 'sos') { raise({ key: who + ':sos', wid: who, kind: e.kind, level: 'danger', msg: msg, say: t('say_sos', { id: id }) }); return; }
    if (e.kind === 'posture') { raise({ key: who + ':posture', wid: who, kind: e.kind, level: 'warn', msg: msg, say: t('say_posture', { id: id }), auto: 20000 }); return; }
    if (e.kind === 'inactive') { raise({ key: who + ':inactive', wid: who, kind: e.kind, level: 'warn', msg: msg, say: t('say_inactive', { id: id }) }); return; }
  }

  /* ---------- 安全帽 / 背心 ---------- */
  async function runPPE(W, H) {
    ppeBusy = true; lastPpeAt = performance.now();
    try {
      lastDets = await SHKPPE.detect(video, W, H, 0.35);
      $('sPpe').textContent = Math.round(SHKPPE.lastMs);
      var now = performance.now();
      // YOLO 识别到的“人”：没有骨架的人也编号，单独检查安全帽/背心
      lastDets.filter(function (d) { return d.cls === 5 && d.score > 0.45; }).forEach(function (d) {
        var cands = tracks.filter(function (tk) { return now - tk.seen < 4000; })
          .map(function (tk) { return { tk: tk, s: matchScore(tk.f.box, d.box) }; })
          .filter(function (c) { return c.s > 0.5; })
          .sort(function (a, b) { return (a.tk.noPose - b.tk.noPose) || (b.s - a.s); }); // 有骨架的优先
        if (!cands.length) { newTrack({ lm: null, f: boxFeat(d.box), seen: now, matched: false, noPose: true }); return; }
        var hit = cands[0].tk;
        // 同一个人既有骨架编号又有“只看框”编号 → 合并到骨架编号
        cands.slice(1).forEach(function (c) {
          if (!c.tk.noPose) return;
          if (!hit.noPose && hit.ppeHist.length < c.tk.ppeHist.length) { hit.ppeHist = c.tk.ppeHist; }
          alerts.filter(function (a) { return a.wid === 'P' + c.tk.id; }).map(function (a) { return a.key; }).forEach(function (k) { clearAlert(k); });
          tracks.splice(tracks.indexOf(c.tk), 1);
        });
        if (hit.noPose) { hit.f = boxFeat(d.box); hit.seen = now; }
      });
      tracks.forEach(function (tk) {
        if (now - tk.seen > 2000) return;
        var f = tk.f, lm = tk.lm, h = f.box[3] - f.box[1], shY, headY, hipY;
        if (lm && !tk.noPose) {
          var nose = lm[0];
          shY = f.shY != null ? f.shY : f.box[1] + 0.25 * h;
          headY = (nose && (nose.visibility == null || nose.visibility > 0.4)) ? nose.y : f.box[1];
          hipY = f.hipY;
        } else { headY = f.box[1] + 0.06 * h; shY = f.box[1] + 0.2 * h; hipY = f.box[1] + 0.55 * h; }
        var r = SHKPPE.assign(f.box, headY, shY, hipY, lastDets);
        tk.ppeHist.push(r); if (tk.ppeHist.length > 6) tk.ppeHist.shift();
        ['helmet', 'vest'].forEach(function (k) {
          var seen = tk.ppeHist.filter(function (x) { return x[k]; }), no = seen.filter(function (x) { return !x[k].ok; }).length;
          var yes = seen.length - no;
          tk.ppe[k] = seen.length < 2 ? null : (no >= 4 ? false : yes >= 2 && yes >= no ? true : null);
          // 连续判定“未戴”≥ 3 秒才报警
          if (tk.ppe[k] === false) {
            if (!tk.ppe[k + 'Since']) tk.ppe[k + 'Since'] = now;
            if (now - tk.ppe[k + 'Since'] > 3000) raise({ key: 'P' + tk.id + ':' + k, wid: 'P' + tk.id, kind: k, level: 'warn', msg: t('ev_' + k, { id: tk.id }), say: t('say_' + k, { id: tk.id }), cooldown: 60000 });
          } else { tk.ppe[k + 'Since'] = 0; if (tk.ppe[k] === true) clearAlert('P' + tk.id + ':' + k); }
        });
      });
    } catch (e) { console.warn('[ppe]', e); }
    ppeBusy = false;
  }

  function boxFeat(b) { return { box: b, cx: (b[0] + b[2]) / 2, cy: (b[1] + b[3]) / 2, tilt: null, hipY: null, shY: null, aspect: 0 }; }
  /* 匹配分数：IoU 与“小框被大框包含的比例”取较大者（骨架框比 YOLO 人框小） */
  function matchScore(a, b) {
    var ix = Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])), iy = Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
    var inter = ix * iy, ua = (a[2] - a[0]) * (a[3] - a[1]), ub = (b[2] - b[0]) * (b[3] - b[1]);
    if (inter <= 0) return 0;
    var iou = inter / (ua + ub - inter), cont = inter / Math.min(ua, ub);
    // 包含比例只在两框大小相近（面积比 > 0.25）时可信，避免把一群人的大框配给某一个人
    return Math.max(iou, Math.min(ua, ub) / Math.max(ua, ub) > 0.25 ? cont * 0.9 : 0);
  }

  /* ---------- 画面 ---------- */
  var COL = { normal: '#00C896', suspect: '#FFB020', ask: '#FF8C00', danger: '#E8133A', sos: '#E8133A' };
  function draw(W, H) {
    var skel = $('chkSkel').checked;
    g.clearRect(0, 0, W, H);
    if (skel) { g.fillStyle = '#0B1220'; g.fillRect(0, 0, W, H); }
    var lw = Math.max(2, W / 320);
    // 原始 PPE 框（细线）
    lastDets.forEach(function (d) {
      if ([0, 2, 4, 7].indexOf(d.cls) < 0) return;
      var ok = d.cls === 0 || d.cls === 7;
      g.strokeStyle = ok ? 'rgba(0,200,150,.9)' : 'rgba(232,19,58,.9)'; g.lineWidth = lw * 0.7; g.setLineDash([6, 4]);
      g.strokeRect(d.box[0] * W, d.box[1] * H, (d.box[2] - d.box[0]) * W, (d.box[3] - d.box[1]) * H); g.setLineDash([]);
    });
    tracks.forEach(function (tk) {
      if (performance.now() - tk.seen > (tk.noPose ? 4000 : 2000)) return;
      var c = COL[tk.fsm.state] || COL.normal, lm = tk.lm;
      if (tk.noPose) c = '#5B8FFF';
      g.strokeStyle = c; g.lineWidth = lw * 1.4; g.lineCap = 'round';
      if (lm && !tk.noPose) BONES.forEach(function (b) {
        var a = lm[b[0]], z = lm[b[1]];
        if (!a || !z || a.visibility < 0.4 || z.visibility < 0.4) return;
        g.beginPath(); g.moveTo(a.x * W, a.y * H); g.lineTo(z.x * W, z.y * H); g.stroke();
      });
      g.fillStyle = '#fff';
      if (lm && !tk.noPose) KP13.forEach(function (i) { var p = lm[i]; if (p && p.visibility > 0.4) { g.beginPath(); g.arc(p.x * W, p.y * H, lw * 1.6, 0, 7); g.fill(); } });
      var b = tk.f.box, x = b[0] * W, y = b[1] * H;
      g.strokeStyle = c; g.lineWidth = lw; g.strokeRect(x, y, (b[2] - b[0]) * W, (b[3] - b[1]) * H);
      var label = '#' + tk.id + ' ' + ppeTxt(tk, 'helmet', '⛑') + ' ' + ppeTxt(tk, 'vest', '🦺') + ' ' + (tk.noPose ? '' : t('st_' + tk.fsm.state));
      g.font = '700 ' + Math.round(W / 50) + 'px sans-serif';
      var tw = g.measureText(label).width;
      g.fillStyle = c; g.fillRect(x, Math.max(0, y - W / 38), tw + 12, W / 38);
      g.fillStyle = '#fff'; g.fillText(label, x + 6, Math.max(W / 50, y - W / 150));
    });
    $('badge').textContent = (skel ? '🦴 ' : '● ') + site + ' · ' + tracks.length + ' · ' + new Date().toLocaleTimeString();
  }
  function ppeTxt(tk, k, ic) { var v = tk.ppe[k]; return ic + (v === true ? '✓' : v === false ? '✗' : '?'); }

  /* ================= 警报 ================= */
  function raise(a) {
    var ex = alerts.find(function (x) { return x.key === a.key; });
    var now = Date.now();
    if (ex) {
      if (ex.level === a.level) return;           // 同级不重复
      ex.level = a.level; ex.msg = a.msg; ex.kind = a.kind; ex.say = a.say; ex.at = now; ex.ackCenter = null;
    } else {
      if (a.cooldown) { var last = raise._cool[a.key]; if (last && now - last < a.cooldown) return; raise._cool[a.key] = now; }
      a.at = now; a.aid = 'A' + now.toString(36) + Math.floor(Math.random() * 99); alerts.unshift(a);
      if (a.auto) setTimeout(function () { clearAlert(a.key); }, a.auto);
    }
    var cur = ex || a;
    log(cur.level, cur.msg);
    if (cur.say) FB.speak(cur.say);
    if (cur.level === 'danger') { FB.siren('danger'); FB.vibrate([600, 200, 600, 200, 600]); FB.notify('SHine-K ⚠', cur.msg); }
    else { FB.beep(880, 180); setTimeout(function () { FB.beep(880, 180); }, 260); FB.vibrate([300]); if (!hasDanger()) FB.sendBeacon('Y'); }
    send({ type: 'alert', aid: cur.aid, key: cur.key, wid: cur.wid, kind: cur.kind, level: cur.level, msg: cur.msg });
    renderAlerts();
  }
  raise._cool = {};
  function hasDanger() { return alerts.some(function (x) { return x.level === 'danger'; }); }
  function clearAlert(key, by) {
    var i = alerts.findIndex(function (x) { return x.key === key; });
    if (i < 0) return;
    var a = alerts.splice(i, 1)[0];
    send({ type: 'clear', aid: a.aid, key: key, by: by || 'auto' });
    afterClear(); renderAlerts();
  }
  function clearAlertsFor(wid) { alerts.filter(function (x) { return x.wid === wid; }).map(function (x) { return x.key; }).forEach(function (k) { clearAlert(k); }); }
  function afterClear() {
    if (!hasDanger()) { FB.stopSiren(); if (alerts.length) FB.sendBeacon('Y'); }
  }
  function ackLocal(key) {
    var a = alerts.find(function (x) { return x.key === key; }); if (!a) return;
    var tk = tracks.find(function (x) { return 'P' + x.id === a.wid; }); if (tk) tk.fsm.reset();
    var dv = devices.find(function (d) { return d.uid === a.wid; }); if (dv) dv.impactState = null;
    clearAlert(key, 'field');
    log('info', '✓ ' + a.msg + ' — ' + t('ack'));
  }
  function renderAlerts() {
    var box = $('alerts');
    if (!alerts.length) { box.innerHTML = '<div class="empty">' + t('no_alerts') + '</div>'; $('banner').className = 'banner'; return; }
    box.innerHTML = alerts.map(function (a) {
      return '<div class="al ' + a.level + '"><div class="m"><b>' + esc(a.msg) + '</b><span>' + new Date(a.at).toLocaleTimeString() + (a.ackCenter ? ' · ✓ ' + esc(a.ackCenter) : '') + '</span></div>' +
        '<button data-k="' + esc(a.key) + '">' + t('ack') + '</button></div>';
    }).join('');
    box.querySelectorAll('button[data-k]').forEach(function (b) { b.onclick = function () { ackLocal(b.dataset.k); }; });
    var top = alerts.find(function (a) { return a.level === 'danger'; }) || alerts[0];
    $('banner').className = 'banner ' + (top.level === 'danger' ? 'dng' : 'warn');
    $('banner').textContent = '⚠ ' + top.msg;
  }

  $('btnMute').onclick = function () { FB.setMuted(!FB.muted); this.textContent = FB.muted ? t('unmute') : t('mute'); };
  $('btnTest').onclick = function () {
    FB.unlock(); FB.siren('danger'); FB.speak(t('say_sos', { id: 'TEST' }));
    setTimeout(function () { if (!hasDanger()) FB.stopSiren(); }, 2500);
  };

  /* ================= 可穿戴设备 ================= */
  $('btnHR').onclick = function () { addDevice(new SHKBLE.HRDevice()); };
  $('btnEmo').onclick = function () { addDevice(new SHKBLE.EmoWatch()); };
  $('btnBeacon').onclick = async function () {
    try { await FB.connectBeacon(); this.textContent = '✓ USB'; log('info', t('ev_dev_on', { name: 'USB beacon' })); }
    catch (e) { if (e.name !== 'NotFoundError') log('warn', 'USB: ' + e.message); }
  };

  async function addDevice(dev) {
    FB.unlock();
    try { await dev.request(); }
    catch (e) { if (e.name !== 'NotFoundError') log('warn', (dev.kind === 'emo' ? 'EmoConnect' : 'BLE') + ': ' + (e.message || e)); return; }
    dev.uid = (dev.kind === 'emo' ? 'W-' : 'B-') + (dev.name.replace(/[^A-Za-z0-9]/g, '').slice(-4) || devices.length + 1);
    dev.wearer = 'auto'; dev.wearerId = tracks.length === 1 ? tracks[0].id : null;
    dev.hrHighSince = null; dev.hrBadSince = null; dev.impactState = null;
    devices.push(dev);
    log('info', t('ev_dev_on', { name: dev.name }));
    dev.on('status', function (s) {
      if (s === 'disconnected') log('warn', t('ev_dev_off', { name: dev.name }));
      if (s === 'connected') log('info', t('ev_dev_on', { name: dev.name }));
      renderDevices();
    });
    dev.on('data', function (d) { onVitals(dev, d); });
    renderDevices();
  }

  function devLabel(dev) {
    var w = dev.wearer === 'auto' ? dev.wearerId : dev.wearer;
    return (w && w !== 'none') ? ('#' + w) : dev.uid;
  }

  function onVitals(dev, d) {
    var now = Date.now(), who = devLabel(dev), key = dev.uid;
    // 心率规则：≥150 或 <45 持续 10 秒 = 危险；≥120 持续 30 秒 = 提醒
    if (d.hr != null) {
      if (d.hr >= 150 || d.hr < 45) {
        dev.hrBadSince = dev.hrBadSince || now;
        if (now - dev.hrBadSince > 10000) raise({ key: key + ':hr', wid: dev.uid, kind: 'hr_danger', level: 'danger', msg: t('ev_hr_danger', { id: who }) + ' (' + d.hr + ' bpm)', say: t('say_hr_danger', { id: who }) });
      } else dev.hrBadSince = null;
      if (d.hr >= 120) {
        dev.hrHighSince = dev.hrHighSince || now;
        if (now - dev.hrHighSince > 30000) raise({ key: key + ':hr', wid: dev.uid, kind: 'hr_high', level: 'warn', msg: t('ev_hr_high', { id: who }) + ' (' + d.hr + ' bpm)', say: t('say_hr_high', { id: who }) });
      } else dev.hrHighSince = null;
      if (d.hr < 120 && d.hr >= 45) clearAlert(key + ':hr');
    }
    // EmoConnect 手腕撞击：撞击后 5 秒几乎不动 → 询问；再 15 秒不动 → 危险；晃动手腕 → 解除
    if (dev.kind === 'emo' && d.impact && d.impact.at > (dev.lastImpact || 0)) { dev.lastImpact = d.impact.at; dev.impactState = { at: d.impact.at, stage: 0 }; }
    var st = dev.impactState;
    if (st) {
      var el = now - st.at;
      if (st.stage === 0 && el > 1500 && d.motion > 25) { dev.impactState = null; }
      else if (st.stage === 0 && el > 5000) { st.stage = 1; st.askAt = now; raise({ key: key + ':impact', wid: dev.uid, kind: 'impact_ask', level: 'warn', msg: t('ev_impact_ask', { id: who }), say: t('say_impact_ask', { id: who }) }); }
      else if (st.stage >= 1 && d.motion > 25) { dev.impactState = null; clearAlert(key + ':impact'); log('info', t('ev_impact_ok', { id: who })); FB.speak(t('ev_impact_ok', { id: who })); }
      else if (st.stage === 1 && now - st.askAt > 15000) { st.stage = 2; raise({ key: key + ':impact', wid: dev.uid, kind: 'impact_danger', level: 'danger', msg: t('ev_impact_danger', { id: who }), say: t('say_impact_danger', { id: who }) }); }
    }
    dev.view = d;
    renderDevice(dev);
  }

  function renderDevices() {
    var box = $('devices');
    box.innerHTML = devices.map(function (d, i) {
      return '<div class="dev" id="dev-' + i + '"><div><div class="nm">' + esc(d.name) + ' <span class="muted mono">' + d.uid + '</span></div>' +
        '<div class="muted" data-st></div></div><div class="big" data-hr>—</div>' +
        '<div class="meta"><span>' + t('wearer') + '</span><select data-w></select><span data-x></span><span class="sp"></span><button data-dc>✕</button></div></div>';
    }).join('');
    devices.forEach(function (d, i) {
      var el = $('dev-' + i), sel = el.querySelector('[data-w]');
      el.querySelector('[data-dc]').onclick = function () { d.disconnect(); devices.splice(i, 1); clearAlertsFor(d.uid); renderDevices(); };
      sel.onchange = function () { d.wearer = sel.value; };
      fillWearer(d, sel);
      renderDevice(d);
    });
  }
  function fillWearer(d, sel) {
    var opts = '<option value="auto">auto</option>' + tracks.map(function (tk) { return '<option value="' + tk.id + '">#' + tk.id + '</option>'; }).join('') + '<option value="none">' + t('not_in_view') + '</option>';
    if (sel.innerHTML !== opts) { sel.innerHTML = opts; sel.value = d.wearer; }
  }
  function renderDevice(d) {
    var i = devices.indexOf(d), el = $('dev-' + i); if (!el) return;
    var v = d.view || {}, conn = d.device && d.device.gatt && d.device.gatt.connected;
    el.querySelector('[data-hr]').innerHTML = v.hr != null ? v.hr + '<small> bpm</small>' : '<small>' + (conn ? t('no_signal') : '—') + '</small>';
    el.querySelector('[data-st]').textContent = (conn ? '● ' + t('st_on') : '○ ' + t('st_off')) + (d.kind === 'emo' ? ' · PPG ' + (v.quality != null ? v.quality : '—') : '');
    var x = [];
    if (v.battery != null) x.push(t('battery') + ' ' + v.battery + '%');
    if (v.hrv != null) x.push('HRV ' + v.hrv + ' ms');
    if (v.motion != null) x.push(t('motion') + ' ' + v.motion + '%');
    if (v.contact === false) x.push('⚠ contact');
    el.querySelector('[data-x]').textContent = x.join(' · ');
  }

  /* ================= 工人卡片 ================= */
  function renderWorkers() {
    var box = $('workers');
    if (!tracks.length) { box.innerHTML = '<div class="empty">' + t('none_yet') + '</div>'; return; }
    box.innerHTML = tracks.map(function (tk) {
      var st = tk.fsm.state, cls = st === 'normal' ? '' : (st === 'danger' || st === 'sos') ? 'dng' : 'warn';
      var dv = devices.find(function (d) { return (d.wearer === 'auto' ? d.wearerId : +d.wearer) === tk.id; });
      var tag = function (k, ic) { var v = tk.ppe[k]; return '<span class="tag ' + (v === true ? 'ok' : v === false ? 'no' : 'q') + '">' + ic + ' ' + t(k) + ' ' + t(v === true ? 'yes' : v === false ? 'no' : 'unknown') + '</span>'; };
      var tilt = tk.f && tk.f.tilt != null ? Math.round(tk.f.tilt) + '°' : '—';
      var poTxt = tk.noPose ? t('p_nopose') : t('p_' + tk.fsm.posture) + ' · ' + tilt;
      return '<div class="wk ' + cls + '"><div class="t">#' + tk.id + '<span class="sp"></span><span class="tag">' + poTxt + '</span>' +
        '<span class="tag ' + (cls ? 'no' : 'ok') + '">' + t('st_' + st) + '</span></div><div class="tags">' + tag('helmet', '⛑') + tag('vest', '🦺') +
        (dv && dv.view && dv.view.hr != null ? '<span class="tag">❤ ' + dv.view.hr + ' bpm</span>' : '') + '</div></div>';
    }).join('');
  }
  function renderAll() { SHKI18N.apply(); renderWorkers(); renderAlerts(); renderDevices(); }
  setInterval(function () {
    renderWorkers();
    devices.forEach(function (d, i) { var el = $('dev-' + i); if (el) fillWearer(d, el.querySelector('[data-w]')); });
  }, 700);

  /* ================= 传输（只发数字和骨架） ================= */
  function send(m) { m.site = site; var n = tr.send(m); $('sSent').textContent = tr.stats.sent; $('sKB').textContent = (tr.stats.bytes / 1024).toFixed(1); return n; }
  setInterval(function () {
    if (!running) return;
    var now = performance.now();
    var people = tracks.filter(function (tk) { return now - tk.seen < 2000; }).map(function (tk) {
      var kp = (tk.lm && !tk.noPose) ? KP13.map(function (i) { var p = tk.lm[i]; return p && p.visibility > 0.4 ? [+p.x.toFixed(3), +p.y.toFixed(3)] : null; }) : [];
      var dv = devices.find(function (d) { return (d.wearer === 'auto' ? d.wearerId : +d.wearer) === tk.id; });
      return { id: 'P' + tk.id, kp: kp, bx: tk.f.box.map(function (v) { return +v.toFixed(3); }), st: tk.fsm.state, po: tk.noPose ? 'nopose' : tk.fsm.posture, tilt: tk.f.tilt != null ? Math.round(tk.f.tilt) : null,
        helmet: tk.ppe.helmet, vest: tk.ppe.vest, hr: dv && dv.view ? dv.view.hr : null };
    });
    send({ type: 'pose', people: people, ar: video.videoWidth ? +(video.videoWidth / video.videoHeight).toFixed(3) : 1.78 });
  }, 200);
  setInterval(function () {
    send({ type: 'hb', cam: running, pose: !!pose, ppe: SHKPPE.loaded, alerts: alerts.length });
    devices.forEach(function (d) {
      var v = d.view || {}, w = d.wearer === 'auto' ? d.wearerId : d.wearer;
      send({ type: 'vitals', wid: d.uid, name: d.name, conn: !!(d.device && d.device.gatt && d.device.gatt.connected), wearer: (w && w !== 'none') ? 'P' + w : null, dev: d.kind, hr: v.hr, hrv: v.hrv, motion: v.motion, battery: v.battery, real: true });
    });
  }, 1000);
  window.addEventListener('beforeunload', function () { send({ type: 'bye' }); });

  /* 监控端 → 现场 */
  tr.on(function (m) {
    if (m.type !== 'cmd' || (m.site && m.site !== site)) return;
    if (m.action === 'say' && m.text) { FB.speak(m.text); log('info', t('ev_center_say', { text: m.text })); }
    if (m.action === 'ack') {
      var a = alerts.find(function (x) { return x.aid === m.aid || x.key === m.key; });
      if (a) { a.ackCenter = m.by || 'center'; log('info', t('ev_center_ack', { msg: a.msg })); FB.speak(t('ev_center_ack', { msg: a.msg })); if (a.level === 'danger') FB.stopSiren(); renderAlerts(); }
    }
    if (m.action === 'ask' && m.wid) {
      var tk = tracks.find(function (x) { return 'P' + x.id === m.wid; });
      if (tk && !tk.noPose) { tk.fsm.forceAsk(performance.now()); raise({ key: m.wid + ':fall', wid: m.wid, kind: 'confirm_ask', level: 'warn', msg: t('ev_confirm_ask', { id: tk.id }), say: t('say_ask_center', { id: tk.id }) }); }
      else if (tk) { FB.speak(t('say_ask_center', { id: tk.id })); log('info', t('ev_confirm_ask', { id: tk.id })); }
    }
  });

  /* 跨电脑连接 */
  tr.onState = function (s) {
    setPill('pillLink', 'linkSt', s === 'on' || s === 'off' ? 'ok' : s === 'error' ? 'err' : 'load', s === 'off' ? 'local' : t('st_' + s) + (s === 'on' ? ' · ' + tr.room : ''));
    $('btnLink').textContent = s === 'off' ? t('connect') : t('disconnect');
  };
  tr.onState('off');
  $('btnNewRoom').onclick = function () { $('room').value = SHKTransport.newRoom(); };
  $('btnLink').onclick = function () { if (tr.mqttState === 'off') tr.connectRoom($('room').value); else tr.disconnectRoom(); };
  if ($('room').value) tr.connectRoom($('room').value);

  /* ================= 记录 ================= */
  function log(level, msg) {
    var d = document.createElement('div'); d.className = 'lv-' + level;
    d.textContent = new Date().toLocaleTimeString() + '  ' + msg;
    var box = $('log'); box.insertBefore(d, box.firstChild);
    while (box.children.length > 200) box.lastChild.remove();
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  window.SHKLive = { tracks: function () { return tracks; }, alerts: function () { return alerts; }, raise: raise };
})();
