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
  SHKI18N.add({
    zh: { worker: '工人', wk_none: '未绑定', risk: '风险', rl_ok: '正常', rl_watch: '关注', rl_warn: '预警', rl_stop: '停止作业',
      rs_sustain_stop: '心率储备 {v}% 持续 {m} 分钟', rs_maxhr: '心率 {v} 超过个人上限 {m}', rs_heat_combo: '热指数 {v}℃ 下心率储备 {m}%', rs_low_hr: '心率过低 {v}',
      rs_drop: '心率骤降 {v}→{m}', rs_sustain_warn: '心率储备 {v}% 持续 {m} 分钟', rs_spike: '无明显活动心率突然上升 {v}', rs_heat: '热指数 {v}℃',
      ev_risk_warn: '{id} 生理预警：{why}', say_risk_warn: '{id}，你的心率偏高，请放慢节奏，补水休息。',
      ev_stop: '{id} 停止作业：{why}', say_stop: '{id}，你的心率异常，现在禁止作业。请到阴凉处坐下休息，等待班组长确认。',
      ev_recovered: '{id} 心率已恢复，等待确认复工', release: '确认复工', ev_release: '{id} 已确认复工（{by}）',
      ev_collapse: '{id} 疑似晕倒：{why}', say_collapse: '紧急！{id}疑似晕倒，附近人员立即前往救援。',
      ev_lost_after: '{id} 心率异常后手表信号中断，疑似晕倒', why_lost: '信号中断',
      emg_bc: '紧急广播：{where}{id}{what}，附近急救员立即前往，其他人员不要靠近危险区域。',
      pos_l: '左', pos_c: '中', pos_r: '右', pos_t: '上', pos_m: '中', pos_b: '下', pos_fmt: '画面{v}{h}方', snap_opt: '紧急时向监控端发送该工人截图（包含画面，只在紧急情况下）' },
    ko: { worker: '작업자', wk_none: '미지정', risk: '위험도', rl_ok: '정상', rl_watch: '관찰', rl_warn: '경고', rl_stop: '작업 중지',
      rs_sustain_stop: '심박 예비율 {v}% {m}분 지속', rs_maxhr: '심박 {v}, 개인 상한 {m} 초과', rs_heat_combo: '열지수 {v}℃에서 심박 예비율 {m}%', rs_low_hr: '심박 너무 낮음 {v}',
      rs_drop: '심박 급강하 {v}→{m}', rs_sustain_warn: '심박 예비율 {v}% {m}분 지속', rs_spike: '활동 없이 심박 급상승 {v}', rs_heat: '열지수 {v}℃',
      ev_risk_warn: '{id} 생리 경고: {why}', say_risk_warn: '{id}, 심박이 높습니다. 속도를 줄이고 물을 마시며 쉬세요.',
      ev_stop: '{id} 작업 중지: {why}', say_stop: '{id}, 심박 이상으로 지금은 작업할 수 없습니다. 그늘에 앉아 쉬고 반장의 확인을 기다리세요.',
      ev_recovered: '{id} 심박 회복, 작업 재개 확인 대기', release: '작업 재개 확인', ev_release: '{id} 작업 재개 확인 ({by})',
      ev_collapse: '{id} 실신 의심: {why}', say_collapse: '긴급! {id} 실신 의심. 근처 인원은 즉시 구조하세요.',
      ev_lost_after: '{id} 심박 이상 후 워치 신호 끊김, 실신 의심', why_lost: '신호 끊김',
      emg_bc: '긴급 방송: {where} {id} {what}. 근처 응급요원은 즉시 출동하고, 다른 사람은 위험구역에 접근하지 마세요.',
      pos_l: '왼쪽', pos_c: '가운데', pos_r: '오른쪽', pos_t: '위', pos_m: '중간', pos_b: '아래', pos_fmt: '화면 {v} {h}', snap_opt: '긴급 시 해당 작업자 캡처를 관제로 전송 (영상 포함, 긴급 상황에서만)' },
    en: { worker: 'Worker', wk_none: 'Unassigned', risk: 'Risk', rl_ok: 'Normal', rl_watch: 'Watch', rl_warn: 'Warning', rl_stop: 'Stop work',
      rs_sustain_stop: 'HR reserve {v}% for {m} min', rs_maxhr: 'HR {v} above personal limit {m}', rs_heat_combo: 'HR reserve {m}% at heat index {v} °C', rs_low_hr: 'HR too low {v}',
      rs_drop: 'HR fell {v}→{m}', rs_sustain_warn: 'HR reserve {v}% for {m} min', rs_spike: 'HR jumped {v} without activity', rs_heat: 'Heat index {v} °C',
      ev_risk_warn: '{id} vital-sign warning: {why}', say_risk_warn: '{id}, your heart rate is high. Slow down, drink water and rest.',
      ev_stop: '{id} stop work: {why}', say_stop: '{id}, your heart rate is abnormal. You may not work now. Sit down in the shade and wait for your team leader.',
      ev_recovered: '{id} heart rate recovered, waiting for return-to-work approval', release: 'Approve return', ev_release: '{id} cleared to return to work ({by})',
      ev_collapse: '{id} possible collapse: {why}', say_collapse: 'Emergency! {id} may have collapsed. People nearby, go and help now.',
      ev_lost_after: '{id} watch signal lost after abnormal heart rate, possible collapse', why_lost: 'signal lost',
      emg_bc: 'Emergency: {where} {id} {what}. First aiders nearby go now; everyone else keep clear of the area.',
      pos_l: 'left', pos_c: 'centre', pos_r: 'right', pos_t: 'top', pos_m: 'middle', pos_b: 'bottom', pos_fmt: '{v} {h} of view', snap_opt: 'In an emergency, send a snapshot of that worker to the center (contains video, emergencies only)' }
  });
  var EMG = { fall_noresp: 1, confirm_noresp: 1, sos: 1, impact_danger: 1, collapse: 1, fire: 1, fused_fall: 1, voice_sos: 1 };
  var drawHooks = [];
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
  if (!SHKBLE.supported()) { $('bleNote').style.display = 'block'; $('btnHR').disabled = $('btnEmo').disabled = $('btnWatch').disabled = true; }
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
    drawHooks.forEach(function (f) { try { f(g, W, H); } catch (e) { console.warn(e); } });
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
    if (a.loc) cur.loc = a.loc;
    if (!cur.loc) cur.loc = locOfWid(cur.wid);
    send({ type: 'alert', aid: cur.aid, key: cur.key, wid: cur.wid, kind: cur.kind, level: cur.level, msg: cur.msg, loc: cur.loc, worker: cur.worker || workerCodeOfWid(cur.wid), emg: !!EMG[cur.kind] });
    if (EMG[cur.kind] && cur.level === 'danger') emergency(cur);
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
    if (a.kind === 'stop_work') {   // 停止作业不能在现场一键解除：只停警报声，复工要等心率恢复后确认
      var d0 = devices.find(function (d) { return d.uid === a.wid; });
      if (d0 && d0.risk && d0.risk.recovered) { releaseDevice(d0, 'field'); return; }
      a.ackCenter = a.ackCenter || t('ack'); FB.stopSiren(); renderAlerts(); return;
    }
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
  /* 普通智能手表（小米 / 华为 / 苹果 / 其他）：标准心率广播 */
  var wBrand = 'xiaomi';
  try { wBrand = localStorage.getItem('shk3_wbrand') || 'xiaomi'; } catch (e) {}
  function WG() { var G = window.SHK_WATCH_GUIDE || {}; return G[SHKI18N.lang] || G.zh || {}; }
  function renderWatchDlg() {
    var g = WG(); if (!g.tabs) return;
    $('wTitle').textContent = g.title;
    $('wTabs').innerHTML = Object.keys(g.tabs).map(function (k) { return '<button data-b="' + k + '" class="' + (k === wBrand ? 'on' : '') + '">' + g.tabs[k] + '</button>'; }).join('');
    $('wTabs').querySelectorAll('button').forEach(function (b) { b.onclick = function () { wBrand = b.dataset.b; try { localStorage.setItem('shk3_wbrand', wBrand); } catch (e) {} renderWatchDlg(); }; });
    $('wSteps').innerHTML = (g[wBrand] || []).map(function (x) { return '<li>' + x + '</li>'; }).join('');
    $('wNote').textContent = g[wBrand + '_note'] || ''; $('wNote').style.display = g[wBrand + '_note'] ? '' : 'none';
    $('wCommon').textContent = g.common;
    $('wGo').textContent = g.go; $('wAll').textContent = g.all; $('wOld').textContent = g.old;
    $('wOld').style.display = wBrand === 'xiaomi' ? '' : 'none';
  }
  function closeWatchDlg() { $('watchDlg').style.display = 'none'; }
  $('btnWatch').onclick = function () { renderWatchDlg(); $('watchDlg').style.display = 'grid'; $('wGo').focus(); };
  $('wClose').onclick = closeWatchDlg;
  $('watchDlg').addEventListener('click', function (e) { if (e.target === this) closeWatchDlg(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && $('watchDlg').style.display !== 'none') closeWatchDlg(); });
  $('wGo').onclick = function () { addDevice(new SHKBLE.HRDevice(), { brand: wBrand }).then(function (ok) { if (ok) closeWatchDlg(); }); };
  $('wAll').onclick = function () { addDevice(new SHKBLE.HRDevice(), { brand: wBrand, all: true }).then(function (ok) { if (ok) closeWatchDlg(); }); };
  $('wOld').onclick = function () { addDevice(new SHKBLE.MiAdvBand(), { brand: 'xiaomi' }).then(function (ok) { if (ok) closeWatchDlg(); }); };
  $('btnEmo').onclick = function () { addDevice(new SHKBLE.EmoWatch()); };
  $('btnBeacon').onclick = async function () {
    try { await FB.connectBeacon(); this.textContent = '✓ USB'; log('info', t('ev_dev_on', { name: 'USB beacon' })); }
    catch (e) { if (e.name !== 'NotFoundError') log('warn', 'USB: ' + e.message); }
  };

  var BRAND_TAG = { xiaomi: 'X-', huawei: 'H-', apple: 'A-', other: 'O-' };
  async function addDevice(dev, opts) {
    FB.unlock();
    try { await dev.request(opts); }
    catch (e) {
      if (e.name === 'NotFoundError') return false;
      var g = WG(), msg = e.code === 'NO_HR_SERVICE' ? (g.err_nohr || '').replace('{name}', dev.name || 'BLE') : e.code === 'NO_ADV' ? g.err_noadv : (dev.kind === 'emo' ? 'EmoConnect' : 'BLE') + ': ' + (e.message || e);
      log('warn', msg);
      if (e.code && $('watchDlg').style.display !== 'none') { $('wNote').textContent = msg; $('wNote').style.display = ''; }
      return false;
    }
    dev.uid = (dev.kind === 'emo' ? 'W-' : (BRAND_TAG[dev.brand] || 'B-')) + (dev.name.replace(/[^A-Za-z0-9]/g, '').slice(-4) || devices.length + 1);
    while (devices.some(function (x) { return x.uid === dev.uid; })) dev.uid += '+';
    dev.addedAt = Date.now();
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
    return true;
  }
  function devConn(d) { return d.isConnected ? d.isConnected() : !!(d.device && d.device.gatt && d.device.gatt.connected); }
  /* 手表信号中断：20 秒没有数据 → 提醒；数据恢复 → 自动解除 */
  setInterval(function () {
    var now = Date.now(), g = WG();
    devices.forEach(function (d) {
      if (d.manualClose && !d.adv) return;
      var last = d.lastAt || d.addedAt, key = d.uid + ':lost';
      if (now - last > 20000) {
        if (d.lostRaised) return;
        d.lostRaised = true; d.view = Object.assign({}, d.view || {}, { hr: null }); renderDevice(d);
        var who = devLabel(d);
        raise({ key: key, wid: d.uid, kind: 'dev_lost', level: 'warn', msg: (g.lost || '{id}').replace('{id}', who + ' (' + d.name + ')'), say: (g.lost_say || '').replace('{id}', who) });
        // 之前心率已经异常（预警 / 停止作业）后手表突然没信号 → 按疑似晕倒处理
        if (d.risk && (d.risk.level === 'warn' || d.risk.level === 'stop') && now - (d.risk.at || 0) < 60000)
          raise({ key: d.uid + ':collapse', wid: d.uid, kind: 'collapse', level: 'danger', msg: t('ev_lost_after', { id: who }), say: t('say_collapse', { id: who }) });
      } else if (d.lostRaised) { d.lostRaised = false; clearAlert(key); }
    });
  }, 1000);

  function devLabel(dev) {
    var w = dev.wearer === 'auto' ? dev.wearerId : dev.wearer;
    return (w && w !== 'none') ? ('#' + w) : dev.uid;
  }

  function onVitals(dev, d) {
    var now = Date.now(), who = devLabel(dev), key = dev.uid;
    // 简单心率规则：≥150 持续 10 秒 → 提醒（更细的判断见下面的风险评估）
    if (d.hr != null) {
      if (d.hr >= 150) {
        dev.hrBadSince = dev.hrBadSince || now;
        if (now - dev.hrBadSince > 10000) raise({ key: key + ':hr', wid: dev.uid, kind: 'hr_high', level: 'warn', msg: t('ev_hr_danger', { id: who }) + ' (' + d.hr + ' bpm)', say: t('say_hr_danger', { id: who }) });
      } else { dev.hrBadSince = null; if (d.hr < 140) clearAlert(key + ':hr'); }
      riskUpdate(dev, d, now, who);
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


  /* ================= 生理风险评估（shk-risk.js） ================= */
  function rosterOf(code) { return code && window.SHKStore ? SHKStore.get('roster', code) : null; }
  function workerOfDev(dev) {
    if (dev.worker) return rosterOf(dev.worker);
    var w = window.SHKStore && SHKStore.all('roster').find(function (r) { return r.watch && r.watch === dev.uid; });
    if (w) dev.worker = w.id;
    return w || null;
  }
  function devName(dev) { var w = workerOfDev(dev); return w ? (w.name || w.id) + (devLabel(dev).charAt(0) === '#' ? ' ' + devLabel(dev) : '') : devLabel(dev); }
  function whyTxt(r) { return (r.reasons || []).filter(function (x) { return x.k !== 'heat' || r.reasons.length === 1; }).map(function (x) { return t('rs_' + x.k, x); }).join('；'); }
  function riskUpdate(dev, d, now, who) {
    var w = workerOfDev(dev);
    if (!dev.model) dev.model = new SHKRisk.RiskModel({});
    if (w) { dev.model.age = +w.age || null; dev.model.restHR = +w.rest || null; }
    var env = window.SHKHeat ? SHKHeat.current() : {};
    var r = dev.model.update(now, d.hr, d.motion != null ? d.motion : null, { hi: env.hi });
    if (!r) return;
    var prev = dev.risk ? dev.risk.level : 'ok', name = devName(dev), why = whyTxt(r);
    dev.risk = r;
    if (r.collapse) raise({ key: dev.uid + ':collapse', wid: dev.uid, kind: 'collapse', level: 'danger', msg: t('ev_collapse', { id: name, why: why }), say: t('say_collapse', { id: name }), worker: w && w.id });
    if (r.level === 'stop') {
      if (r.recovered) {
        var a = alerts.find(function (x) { return x.key === dev.uid + ':stop'; });
        if (a && a.level === 'danger') { a.level = 'warn'; a.msg = t('ev_recovered', { id: name }); a.say = null; FB.stopSiren(); afterClear(); send({ type: 'alert', aid: a.aid, key: a.key, wid: a.wid, kind: 'stop_work', level: 'warn', msg: a.msg, loc: a.loc, worker: w && w.id, recovered: true }); renderAlerts(); }
      } else if (prev !== 'stop' || !alerts.some(function (x) { return x.key === dev.uid + ':stop'; })) {
        dev.stopSaidAt = now;
        raise({ key: dev.uid + ':stop', wid: dev.uid, kind: 'stop_work', level: 'danger', msg: t('ev_stop', { id: name, why: why }), say: t('say_stop', { id: name }), worker: w && w.id });
        if (w) notify(w.id, { level: 'danger', title: t('rl_stop'), body: t('say_stop', { id: name }), sticky: true });
        clearAlert(dev.uid + ':risk');
      }
    } else if (r.level === 'warn') {
      if (prev !== 'warn') {
        raise({ key: dev.uid + ':risk', wid: dev.uid, kind: 'risk_warn', level: 'warn', msg: t('ev_risk_warn', { id: name, why: why || t('rl_warn') }), say: t('say_risk_warn', { id: name }), cooldown: 5 * 60000, worker: w && w.id });
        if (w) notify(w.id, { level: 'warn', title: t('rl_warn'), body: t('say_risk_warn', { id: name }) });
      }
    } else if (prev === 'warn') clearAlert(dev.uid + ':risk');
  }
  function releaseDevice(dev, by) {
    if (!dev.model) return;
    dev.model.release(); dev.risk = Object.assign({}, dev.risk || {}, { level: 'ok', recovered: false });
    clearAlert(dev.uid + ':stop', by); clearAlert(dev.uid + ':collapse', by);
    var w = workerOfDev(dev), msg = t('ev_release', { id: devName(dev), by: by });
    log('info', msg); FB.speak(msg); send({ type: 'event', kind: 'release', wid: dev.uid, level: 'info', msg: msg });
    if (w) notify(w.id, { level: 'info', title: t('release'), body: msg });
    renderDevices();
  }
  /* 停止作业期间每 60 秒提醒一次，直到确认复工 */
  setInterval(function () {
    var now = Date.now();
    devices.forEach(function (d) {
      if (!d.risk || d.risk.level !== 'stop' || d.risk.recovered) return;
      if (now - (d.stopSaidAt || 0) < 60000) return;
      d.stopSaidAt = now; var name = devName(d), w = workerOfDev(d);
      FB.speak(t('say_stop', { id: name })); FB.vibrate([400, 200, 400]);
      if (w) notify(w.id, { level: 'danger', title: t('rl_stop'), body: t('say_stop', { id: name }), sticky: true });
    });
  }, 5000);

  /* ================= 身份 · 位置 · 通知 ================= */
  function trackOfDev(dev) { var w = dev.wearer === 'auto' ? dev.wearerId : (dev.wearer === 'none' ? null : +dev.wearer); return w ? tracks.find(function (tk) { return tk.id === w; }) : null; }
  function devOfTrack(tk) { return devices.find(function (d) { return (d.wearer === 'auto' ? d.wearerId : +d.wearer) === tk.id; }); }
  function workerOfTrack(tk) { var d = devOfTrack(tk); return d ? workerOfDev(d) : null; }
  function deviceOfWorker(code) { return devices.find(function (d) { workerOfDev(d); return d.worker === code; }); }
  function workerCodeOfWid(wid) {
    if (!wid) return null;
    var d = devices.find(function (x) { return x.uid === wid; }); if (d) { var w = workerOfDev(d); return w ? w.id : null; }
    var tk = tracks.find(function (x) { return 'P' + x.id === wid; }); if (tk) { var w2 = workerOfTrack(tk); return w2 ? w2.id : null; }
    return null;
  }
  function locOf(tk) {
    if (!tk || !tk.f) return { site: site };
    var b = tk.f.box, x = (b[0] + b[2]) / 2, y = b[3];
    var h = x < 0.34 ? 'l' : x > 0.66 ? 'r' : 'c', v = y < 0.34 ? 't' : y > 0.66 ? 'b' : 'm';
    var env = window.SHKHeat ? SHKHeat.current() : {}, sel = $('camSel');
    return { site: site, zone: tk.zoneName || null, x: +x.toFixed(3), y: +y.toFixed(3), pos: t('pos_fmt', { h: t('pos_' + h), v: t('pos_' + v) }), track: 'P' + tk.id,
      cam: sel && sel.selectedOptions[0] ? sel.selectedOptions[0].textContent.slice(0, 40) : '', gps: env.lat != null ? [+env.lat.toFixed(4), +env.lon.toFixed(4)] : null, at: Date.now() };
  }
  function locOfWid(wid) {
    if (!wid) return null;
    var tk = tracks.find(function (x) { return 'P' + x.id === wid; });
    if (!tk) { var d = devices.find(function (x) { return x.uid === wid; }); if (d) tk = trackOfDev(d); }
    return tk ? locOf(tk) : { site: site };
  }
  function notify(to, o) { if (!to) return; send(Object.assign({ type: 'notify', to: to }, o)); }

  /* ================= 紧急情况：广播 · 通知所有人手机 · （可选）截图 ================= */
  function emergency(a) {
    if (a.emgAt) return; a.emgAt = Date.now();
    var loc = a.loc || {}, who = a.wid && a.wid.charAt(0) === 'P' ? '#' + a.wid.slice(1) : (devices.find(function (d) { return d.uid === a.wid; }) ? devName(devices.find(function (d) { return d.uid === a.wid; })) : a.wid);
    var what = t('st_' + (a.kind === 'sos' ? 'sos' : 'danger'));
    if (a.kind === 'collapse') what = t('ev_collapse', { id: '', why: '' }).replace(/[:：]\s*$/, '').trim();
    var text = t('emg_bc', { where: site + (loc.zone ? ' ' + loc.zone + ' ' : ' ') + (loc.pos || ''), id: who, what: what });
    setTimeout(function () { FB.speak(text); }, 2500);   // 先响警报，再用工厂广播（本机扬声器）说清楚位置
    notify('*', { level: 'danger', title: '🚨 ' + site + (loc.zone ? ' · ' + loc.zone : ''), body: text, emg: true, loc: loc });
  }
  var snapOn = false; try { snapOn = localStorage.getItem('shk3_snap') === '1'; } catch (e) {}
  var snapCv = document.createElement('canvas');
  setInterval(function () {
    if (!snapOn || !running || !video.videoWidth) return;
    alerts.filter(function (a) { return EMG[a.kind] && a.level === 'danger'; }).forEach(function (a) {
      var tk = tracks.find(function (x) { return 'P' + x.id === a.wid; });
      if (!tk) { var d = devices.find(function (x) { return x.uid === a.wid; }); if (d) tk = trackOfDev(d); }
      if (!tk) return;
      var W = video.videoWidth, H = video.videoHeight, b = tk.f.box, m = 0.3;
      var x0 = Math.max(0, b[0] - (b[2] - b[0]) * m) * W, y0 = Math.max(0, b[1] - (b[3] - b[1]) * m) * H;
      var x1 = Math.min(1, b[2] + (b[2] - b[0]) * m) * W, y1 = Math.min(1, b[3] + (b[3] - b[1]) * m) * H;
      var sw = x1 - x0, sh = y1 - y0; if (sw < 10 || sh < 10) return;
      var k = Math.min(1, 360 / Math.max(sw, sh)); snapCv.width = Math.round(sw * k); snapCv.height = Math.round(sh * k);
      snapCv.getContext('2d').drawImage(video, x0, y0, sw, sh, 0, 0, snapCv.width, snapCv.height);
      send({ type: 'snap', aid: a.aid, wid: a.wid, img: snapCv.toDataURL('image/jpeg', 0.6) });
    });
  }, 2000);

  var BRAND_ICON = { xiaomi: '<span class="bt bx">MI</span>', huawei: '<span class="bt bh">HW</span>', apple: '<span class="bt ba">iOS</span>', other: '<span class="bt">⌚</span>' };
  function renderDevices() {
    var box = $('devices');
    box.innerHTML = devices.map(function (d, i) {
      return '<div class="dev" id="dev-' + i + '"><div><div class="nm">' + (BRAND_ICON[d.brand] || '') + esc(d.name) + ' <span class="muted mono">' + d.uid + '</span></div>' +
        '<div class="muted" data-st></div></div><div class="big" data-hr>—</div>' +
        '<div class="meta"><span>' + t('wearer') + '</span><select data-w></select><span>' + t('worker') + '</span><select data-wk></select><span data-x></span><span class="sp"></span><button data-dc>✕</button></div>' +
        '<div class="risk" data-r></div></div>';
    }).join('');
    devices.forEach(function (d, i) {
      var el = $('dev-' + i), sel = el.querySelector('[data-w]');
      el.querySelector('[data-dc]').onclick = function () { d.disconnect(); devices.splice(i, 1); clearAlertsFor(d.uid); renderDevices(); };
      sel.onchange = function () { d.wearer = sel.value; };
      fillWearer(d, sel);
      var wk = el.querySelector('[data-wk]'); fillWorker(d, wk);
      wk.onchange = function () {
        // 绑定：把手表编号记到名单里，下次连上同一块手表自动认出是谁
        if (d.worker) { var old = rosterOf(d.worker); if (old && old.watch === d.uid) SHKStore.put('roster', Object.assign({}, old, { watch: '' })); }
        d.worker = wk.value || null;
        var r = rosterOf(d.worker); if (r) SHKStore.put('roster', Object.assign({}, r, { watch: d.uid }));
        renderDevice(d);
      };
      renderDevice(d);
    });
  }
  function fillWorker(d, sel) {
    workerOfDev(d);
    var list = window.SHKStore ? SHKStore.all('roster') : [];
    var opts = '<option value="">' + t('wk_none') + '</option>' + list.map(function (r) { return '<option value="' + esc(r.id) + '">' + esc(r.id) + (r.name ? ' ' + esc(r.name) : '') + '</option>'; }).join('');
    if (sel.innerHTML !== opts) sel.innerHTML = opts;
    sel.value = d.worker || '';
  }
  function fillWearer(d, sel) {
    var opts = '<option value="auto">auto</option>' + tracks.map(function (tk) { return '<option value="' + tk.id + '">#' + tk.id + '</option>'; }).join('') + '<option value="none">' + t('not_in_view') + '</option>';
    if (sel.innerHTML !== opts) { sel.innerHTML = opts; sel.value = d.wearer; }
  }
  function renderDevice(d) {
    var i = devices.indexOf(d), el = $('dev-' + i); if (!el) return;
    var v = d.view || {}, conn = devConn(d);
    el.querySelector('[data-hr]').innerHTML = v.hr != null ? v.hr + '<small> bpm</small>' : '<small>' + (conn ? t('no_signal') : '—') + '</small>';
    el.querySelector('[data-st]').textContent = (conn ? '● ' + t('st_on') : '○ ' + t('st_off')) + (d.kind === 'emo' ? ' · PPG ' + (v.quality != null ? v.quality : '—') : '');
    var x = [];
    if (v.battery != null) x.push(t('battery') + ' ' + v.battery + '%');
    if (v.hrv != null) x.push('HRV ' + v.hrv + ' ms');
    if (v.motion != null) x.push(t('motion') + ' ' + v.motion + '%');
    if (v.contact === false) x.push('⚠ contact');
    el.querySelector('[data-x]').textContent = x.join(' · ');
    var r = d.risk, rb = el.querySelector('[data-r]');
    if (rb) {
      if (!r) rb.innerHTML = '';
      else {
        var cls = r.level === 'stop' ? 'no' : r.level === 'warn' ? 'q' : r.level === 'watch' ? 'q' : 'ok';
        rb.innerHTML = '<span class="tag ' + cls + '">' + t('risk') + ' ' + r.score + ' · ' + t('rl_' + r.level) + (r.recovered ? ' ✓' : '') + '</span>' +
          '<span class="muted mono">%HRR ' + r.hrr + '% · PSI ' + r.psi + ' · ' + (d.model && d.model.restHR ? 'rest' : 'base') + ' ' + r.base + ' · max ' + r.hrmax + (r.hi != null ? ' · HI ' + r.hi + '℃' : '') + '</span>' +
          (whyTxt(r) ? '<div class="muted">' + esc(whyTxt(r)) + '</div>' : '') +
          (r.level === 'stop' && r.recovered ? '<button class="pri" data-rel>' + t('release') + '</button>' : '');
        var rel = rb.querySelector('[data-rel]'); if (rel) rel.onclick = function () { releaseDevice(d, 'field'); };
      }
    }
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
  function renderAll() { if ($('watchDlg').style.display !== 'none') renderWatchDlg(); SHKI18N.apply(); if (window.SHKHeat) SHKHeat.rebuild(); if (window.SHKZones) SHKZones.rebuild(); renderWorkers(); renderAlerts(); renderDevices(); if (typeof renderEasy === 'function') renderEasy(); }
  setInterval(function () {
    renderWorkers();
    devices.forEach(function (d, i) { var el = $('dev-' + i); if (el) { fillWearer(d, el.querySelector('[data-w]')); var wk = el.querySelector('[data-wk]'); if (wk && document.activeElement !== wk) fillWorker(d, wk); renderDevice(d); } });
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
        helmet: tk.ppe.helmet, vest: tk.ppe.vest, hr: dv && dv.view ? dv.view.hr : null, zone: tk.zoneName || null, zok: tk.zoneId ? tk.zoneOk !== false : null,
        wk: dv ? (workerOfDev(dv) || {}).id || null : null, risk: dv && dv.risk ? dv.risk.level : null };
    });
    send({ type: 'pose', people: people, ar: video.videoWidth ? +(video.videoWidth / video.videoHeight).toFixed(3) : 1.78 });
  }, 200);
  setInterval(function () {
    send({ type: 'hb', cam: running, pose: !!pose, ppe: SHKPPE.loaded, alerts: alerts.length });
    devices.forEach(function (d) {
      var v = d.view || {}, w = d.wearer === 'auto' ? d.wearerId : d.wearer;
      send({ type: 'vitals', wid: d.uid, name: d.name, conn: devConn(d), wearer: (w && w !== 'none') ? 'P' + w : null, dev: d.brand && d.brand !== 'hr' ? d.brand : d.kind, hr: v.hr, hrv: v.hrv, motion: v.motion, battery: v.battery, real: true,
        worker: (workerOfDev(d) || {}).id || null, risk: d.risk ? { level: d.risk.level, score: d.risk.score, hrr: d.risk.hrr, psi: d.risk.psi, why: whyTxt(d.risk), recovered: d.risk.recovered } : null });
    });
  }, 1000);
  window.addEventListener('beforeunload', function () { send({ type: 'bye' }); });

  /* 外部系统（消防主机 / 门禁）→ 现场 */
  SHKI18N.add({ zh: { ev_fire: '消防主机火警：{zone}', say_fire: '火警！{zone}发生火警，请所有人员按疏散路线立即撤离，不要乘坐电梯。', ev_access_deny: '门禁拒绝 {w} 进入「{zone}」：{why}', why_np: '没有有效作业票', why_nl: '不在作业票名单' },
    ko: { ev_fire: '소방 수신기 화재: {zone}', say_fire: '화재 경보! {zone}에서 화재가 발생했습니다. 모든 인원은 대피로를 따라 즉시 대피하고 엘리베이터를 타지 마세요.', ev_access_deny: '출입 거부 {w} → 「{zone}」: {why}', why_np: '유효한 작업허가 없음', why_nl: '작업허가 명단에 없음' },
    en: { ev_fire: 'Fire panel alarm: {zone}', say_fire: 'Fire alarm in {zone}! Everyone evacuate now by the escape routes. Do not use the lifts.', ev_access_deny: 'Access denied for {w} to “{zone}”: {why}', why_np: 'no valid permit', why_nl: 'not on the permit' } });
  tr.on(function (m) {
    if (m.type === 'fire' && (!m.site || m.site === site)) {
      var zn = m.zone || site;
      raise({ key: 'FIRE:' + zn, wid: 'FIRE', kind: 'fire', level: 'danger', msg: t('ev_fire', { zone: zn }), say: t('say_fire', { zone: zn }), loc: { site: site, zone: m.zone || null } });
      notify('*', { level: 'danger', title: '🔥 ' + t('ev_fire', { zone: zn }), body: t('say_fire', { zone: zn }), emg: true });
    }
    if (m.type === 'access' && m.zone && window.SHKStore) {
      var z = SHKStore.get('zones', m.zone); if (!z || z.site !== site || !z.permit) return;
      var p = SHKPermit.forZone(z.id), ok = p && SHKPermit.status(p) === 'active' && SHKPermit.allowed(p, m.worker), why = !p || SHKPermit.status(p) !== 'active' ? t('why_np') : t('why_nl');
      send({ type: 'access_res', zone: z.id, door: m.door, worker: m.worker, allow: !!ok, why: ok ? '' : why });
      if (!ok) { raise({ key: 'ACC:' + m.worker + ':' + z.id, wid: 'ACC-' + m.worker, kind: 'access_deny', level: 'warn', msg: t('ev_access_deny', { w: m.worker, zone: z.name, why: why }), say: t('ev_access_deny', { w: m.worker, zone: z.name, why: why }), auto: 60000 }); notify(m.worker, { level: 'warn', title: z.name, body: t('ev_access_deny', { w: m.worker, zone: z.name, why: why }) }); }
    }
  });

  /* 监控端 → 现场 */
  tr.on(function (m) {
    if (m.type !== 'cmd' || (m.site && m.site !== site && m.site !== '*')) return;
    if (m.action === 'release' && m.wid) { var rd = devices.find(function (d) { return d.uid === m.wid; }); if (rd) releaseDevice(rd, m.by || 'center'); }
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

  /* ================= 简易界面 ================= */
  var easy = true;
  try { easy = localStorage.getItem('shk3_ui') !== 'admin'; } catch (e) {}
  function setEasy(on) {
    easy = on; document.body.classList.toggle('easy-on', on);
    try { localStorage.setItem('shk3_ui', on ? 'easy' : 'admin'); } catch (e) {}
    renderEasy();
  }
  $('ezMode').onclick = function () { setEasy(!easy); };
  $('ezAction').onclick = function () {
    FB.unlock();
    var a = $('ezAction').dataset.act;
    if (a === 'cam') startCamera();
    else if (a === 'ack') ackLocal($('ezAction').dataset.key);
    else if (a === 'sound') { FB.setMuted(false); $('btnMute').textContent = t('mute'); }
    renderEasy();
  };
  function chip(state, text, onclick) {
    return '<span class="pill ' + state + (onclick ? ' click' : '') + '"' + (onclick ? ' data-c="' + onclick + '"' : '') + '><i></i>' + esc(text) + '</span>';
  }
  function renderEasy() {
    var bar = $('easy'); if (!bar) return;
    var dng = alerts.filter(function (a) { return a.level === 'danger'; }), top = dng[0] || alerts[0];
    var cls, title, reason, act = null, key = '';
    if (!running) { cls = ''; title = t('ez_off_t'); reason = t('ez_off_r'); act = 'cam'; }
    else if (top) {
      cls = top.level === 'danger' ? 'dng' : 'warn';
      title = (top.level === 'danger' ? t('ez_dng_t') : t('ez_warn_t')) + ' · ' + top.msg;
      reason = alerts.length > 1 ? t('ez_more', { n: alerts.length - 1 }) : new Date(top.at).toLocaleTimeString();
      act = 'ack'; key = top.key;
    } else {
      cls = 'ok'; title = t('ez_ok_t');
      reason = t('ez_people', { n: tracks.filter(function (k) { return performance.now() - k.seen < 2000; }).length });
      if (FB.muted) act = 'sound';
    }
    bar.className = 'easy ' + cls;
    $('ezTitle').textContent = title; $('ezReason').textContent = reason;
    var b = $('ezAction');
    if (act) {
      b.style.display = ''; b.dataset.act = act; b.dataset.key = key;
      b.textContent = act === 'cam' ? t('ez_act_cam') : act === 'ack' ? t('ez_act_ack') : t('ez_act_sound');
      b.className = 'pri ez-act' + (cls === 'dng' ? ' dng' : '');
    } else b.style.display = 'none';
    $('ezMode').textContent = easy ? t('ez_admin') : t('ez_easy');
    var ai = !!pose && SHKPPE.loaded, aiLoading = !pose || !SHKPPE.loaded;
    var link = tr.mqttState === 'on' ? tr.room : tr.mqttState === 'off' ? t('ch_local') : t('st_' + tr.mqttState);
    var conn = devices.filter(devConn).length;
    $('ezChips').innerHTML =
      chip(running ? 'ok' : '', t('ch_cam') + (running ? ' ✓' : ' ✗')) +
      chip(ai ? 'ok' : (aiLoading ? 'warn' : 'dng'), t('ch_ai') + (ai ? ' ✓' : ' …')) +
      chip(tr.mqttState === 'error' ? 'dng' : 'ok', t('ch_link') + ' · ' + link) +
      chip(conn ? 'ok' : '', t('ch_dev', { n: conn }), 'dev') +
      chip(FB.muted ? 'warn' : 'ok', t('ch_sound') + (FB.muted ? ' · ' + t('ch_mute') : ' ✓'), 'sound');
    $('ezChips').querySelectorAll('[data-c]').forEach(function (c) {
      c.onclick = function () {
        if (c.dataset.c === 'dev') { setEasy(false); var d = $('cardDevices'); if (d) d.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        if (c.dataset.c === 'sound') { FB.unlock(); FB.setMuted(!FB.muted); $('btnMute').textContent = FB.muted ? t('unmute') : t('mute'); renderEasy(); }
      };
    });
  }
  setEasy(easy);
  setInterval(renderEasy, 500);

  /* ================= 记录 ================= */
  function log(level, msg) {
    var d = document.createElement('div'); d.className = 'lv-' + level;
    d.textContent = new Date().toLocaleTimeString() + '  ' + msg;
    var box = $('log'); box.insertBefore(d, box.firstChild);
    while (box.children.length > 200) box.lastChild.remove();
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  window.SHKLive = {
    tracks: function () { return tracks; }, alerts: function () { return alerts; }, devices: function () { return devices; },
    dets: function () { return lastDets; },
    raise: raise, clearAlert: clearAlert, send: send, log: log, notify: notify, tr: tr, canvas: cv, video: video,
    site: function () { return site; }, running: function () { return running; },
    onDraw: function (f) { drawHooks.push(f); }, beacon: function (c) { FB.sendBeacon(c); },
    workerOf: workerOfTrack, deviceOfWorker: deviceOfWorker, locOf: locOf, release: releaseDevice
  };
  if (window.SHKStore) SHKStore.attach(tr);
  if (window.SHKHeat) SHKHeat.init({ box: $('cardEnv'), raise: raise, clear: clearAlert, send: send, log: log });
  if (window.SHKZones) SHKZones.init(window.SHKLive);
  if ($('chkSnap')) { $('chkSnap').checked = snapOn; $('chkSnap').onchange = function () { snapOn = this.checked; try { localStorage.setItem('shk3_snap', snapOn ? '1' : '0'); } catch (e) {} }; }
})();
