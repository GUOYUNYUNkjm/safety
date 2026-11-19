/* SHine-K 3.0 · 预测型扩展（现场端）—— 在不改动原有跌倒 / PPE / 心率规则的前提下追加：
 *  ① 险些跌倒（踉跄）：髋部在 0.5 秒内突然下沉 ≥ 9% 身高，1.6 秒内又恢复站姿、且没有进入跌倒流程 → 记一次“踉跄”。
 *     依据：踉跄 / 绊倒 / 滑倒比真正跌倒更常见，并与更高的跌倒风险相关（Handelzalts 2020，Frontiers in Medicine）。
 *     只轻声提醒 + 记录到热点图，不拉警报（避免告警疲劳）。快速下蹲再站起也可能被记一次。
 *  ② 机器危险点（手部）：在画面上拖一个矩形；手腕 / 手指关节点进入 → 立即红色警报 + 警示灯 R（可接继电器作急停演示）。
 *     依据：YOLO / MediaPipe 手部检测靠近旋转部件时断电（Michigan Tech 2026；MediaPipe Hands 圆锯防护研究）。
 *  ③ 人–车接近分级：PPE 模型的 Vehicle / Machinery 框与人的脚下点距离（按人的身高归一化）→ 危险 / 潜在危险 / 关注 / 安全 四级。
 *     依据：单目 2D 摄像头人机接近四级预警（arXiv 2305.17931）。
 *  ④ 姿势负荷（RULA 简化）：上臂、前臂、颈部、躯干角度按 RULA 分档求和，换算到 1–7 分。只显示、统计，不报警。
 *     单摄像头二维估算，不是完整 RULA（没有手腕、负重、重复动作项），用于工位排名，不用于个人诊断。
 *  ⑤ 声音：🎤 呼救关键词（浏览器语音识别）+ 突发巨响 / 尖叫（音量突增）。
 *     注意：Chrome 的语音识别会把声音发送到浏览器厂商的服务器识别；只有打开开关时才启用。
 *  ⑥ 多源交叉验证：摄像头判断跌倒时，同时看手环（撞击 / 心率停止作业 / 仍在活动）和声音，
 *     两路以上一致 → “双源确认”立即升级；手环显示仍在正常活动 → 标记“疑似误报”，降低误报。
 * 所有数字只在本机计算；发给监控端的只有事件和分数。
 */
(function () {
  'use strict';
  if (!window.SHKLive) return;
  var L = window.SHKLive, t = SHKI18N.t, FB = window.SHKFeedback;
  var $ = function (id) { return document.getElementById(id); };

  SHKI18N.add({
    zh: {
      px_title: '🧪 预测型功能', px_sub: '在事故发生前发现风险', px_mz: '✋ 机器危险点', px_mz_draw: '在画面上拖出矩形…', px_mz_clear: '清除',
      px_mic: '🎤 声音监听', px_mic_on: '🎤 声音监听中', px_mic_note: '呼救关键词使用浏览器语音识别（Chrome 会把声音发到浏览器厂商服务器识别）；巨响检测只在本机计算。',
      px_h_who: '工人', px_h_cam: '📷 摄像头', px_h_rula: '姿势 RULA', px_h_band: '⌚ 手环', px_h_mic: '🎤', px_h_ver: '交叉验证', px_h_st: '踉跄',
      px_none: '画面中还没有人', px_v_ok: '正常', px_v_single: '单源（仅摄像头）', px_v_conf: '✔ 双源确认', px_v_fp: '疑似误报', px_v_wait: '待确认',
      px_cam_stand: '站立', px_cam_bend: '弯腰', px_cam_down: '倒地', px_cam_other: '其他', px_band_none: '未佩戴', px_band_move: '活动中', px_band_still: '静止', px_band_hit: '撞击!',
      ev_near_fall: '{id} 踉跄（险些跌倒）· {zone}', say_near_fall: '{id}，请注意脚下。',
      ev_hand_in_machine: '✋ {id} 的手进入机器危险点「{zone}」→ 已发出停机信号', say_hand_in_machine: '危险！手进入机器危险区，机器已停止。',
      ev_veh_danger: '🚜 {id} 与车辆 / 机械距离过近（危险）', ev_veh_pot: '🚜 {id} 靠近车辆 / 机械（潜在危险）', say_veh_danger: '{id}，车辆靠近，立即后退！',
      ev_voice_sos: '🎤 听到呼救：“{w}”', say_voice_sos: '收到呼救，已通知监控中心。', ev_loud: '🔊 突发巨响 / 尖叫（{db} dB）',
      ev_fused_fall: '📷+{src} 双源确认：{id} 跌倒', say_fused_fall: '紧急！{id}跌倒已被多个传感器确认，附近人员立即前往。',
      ev_fp: '{id}：摄像头判断跌倒，但手环显示仍在正常活动 → 标记为疑似误报', mz_name: '机器危险点', veh_lv: ['危险', '潜在危险', '关注', '安全']
    },
    ko: {
      px_title: '🧪 예측형 기능', px_sub: '사고 전에 위험을 찾기', px_mz: '✋ 기계 위험점', px_mz_draw: '화면에서 사각형을 드래그…', px_mz_clear: '지우기',
      px_mic: '🎤 소리 감지', px_mic_on: '🎤 소리 감지 중', px_mic_note: '구조 요청 키워드는 브라우저 음성인식을 사용합니다(Chrome은 음성을 브라우저 회사 서버로 보내 인식). 큰 소리 감지는 이 PC에서만 계산합니다.',
      px_h_who: '작업자', px_h_cam: '📷 카메라', px_h_rula: '자세 RULA', px_h_band: '⌚ 밴드', px_h_mic: '🎤', px_h_ver: '교차 검증', px_h_st: '휘청',
      px_none: '화면에 사람이 없습니다', px_v_ok: '정상', px_v_single: '단일 소스(카메라만)', px_v_conf: '✔ 이중 확인', px_v_fp: '오경보 의심', px_v_wait: '확인 중',
      px_cam_stand: '서 있음', px_cam_bend: '숙임', px_cam_down: '쓰러짐', px_cam_other: '기타', px_band_none: '미착용', px_band_move: '활동 중', px_band_still: '정지', px_band_hit: '충격!',
      ev_near_fall: '{id} 휘청(아차 넘어짐) · {zone}', say_near_fall: '{id}, 발밑을 조심하세요.',
      ev_hand_in_machine: '✋ {id}의 손이 기계 위험점「{zone}」에 들어감 → 정지 신호 전송', say_hand_in_machine: '위험! 손이 기계 위험구역에 들어가 기계를 멈췄습니다.',
      ev_veh_danger: '🚜 {id} 차량/기계와 너무 가까움(위험)', ev_veh_pot: '🚜 {id} 차량/기계 접근(잠재 위험)', say_veh_danger: '{id}, 차량 접근! 즉시 물러서세요!',
      ev_voice_sos: '🎤 구조 요청 감지: “{w}”', say_voice_sos: '구조 요청을 받았습니다. 관제센터에 알렸습니다.', ev_loud: '🔊 갑작스러운 큰 소리/비명 ({db} dB)',
      ev_fused_fall: '📷+{src} 이중 확인: {id} 넘어짐', say_fused_fall: '긴급! {id} 넘어짐이 여러 센서로 확인되었습니다. 근처 인원은 즉시 가세요.',
      ev_fp: '{id}: 카메라는 넘어짐으로 판단했지만 밴드는 정상 활동 중 → 오경보 의심으로 표시', mz_name: '기계 위험점', veh_lv: ['위험', '잠재 위험', '주의', '안전']
    },
    en: {
      px_title: '🧪 Predictive features', px_sub: 'Catch risk before the accident', px_mz: '✋ Machine danger point', px_mz_draw: 'Drag a rectangle on the video…', px_mz_clear: 'Clear',
      px_mic: '🎤 Listen', px_mic_on: '🎤 Listening', px_mic_note: 'Call-for-help keywords use the browser speech recognizer (Chrome sends audio to the browser vendor to recognize it). Loud-sound detection runs only on this computer.',
      px_h_who: 'Worker', px_h_cam: '📷 Camera', px_h_rula: 'Posture RULA', px_h_band: '⌚ Band', px_h_mic: '🎤', px_h_ver: 'Cross-check', px_h_st: 'Stumbles',
      px_none: 'Nobody in view yet', px_v_ok: 'Normal', px_v_single: 'Single source (camera only)', px_v_conf: '✔ Two-source confirmed', px_v_fp: 'Likely false alarm', px_v_wait: 'Checking',
      px_cam_stand: 'Standing', px_cam_bend: 'Bending', px_cam_down: 'Down', px_cam_other: 'Other', px_band_none: 'None', px_band_move: 'Moving', px_band_still: 'Still', px_band_hit: 'Impact!',
      ev_near_fall: '{id} stumbled (near-fall) · {zone}', say_near_fall: '{id}, watch your step.',
      ev_hand_in_machine: '✋ {id}\'s hand entered machine danger point "{zone}" → stop signal sent', say_hand_in_machine: 'Danger! Hand in the machine zone. Machine stopped.',
      ev_veh_danger: '🚜 {id} too close to vehicle / machinery (danger)', ev_veh_pot: '🚜 {id} near vehicle / machinery (potential danger)', say_veh_danger: '{id}, vehicle approaching, step back now!',
      ev_voice_sos: '🎤 Call for help heard: "{w}"', say_voice_sos: 'Call for help received. The control center has been notified.', ev_loud: '🔊 Sudden loud sound / scream ({db} dB)',
      ev_fused_fall: '📷+{src} two-source confirmed: {id} fell', say_fused_fall: 'Emergency! {id} fall confirmed by several sensors. People nearby, go now.',
      ev_fp: '{id}: camera saw a fall but the band shows normal activity → marked as likely false alarm', mz_name: 'Machine point', veh_lv: ['Danger', 'Potential', 'Attention', 'Safe']
    }
  });
  function tr(k, v) { var s = t(k, v); return s; }
  function lv(i) { var a = t('veh_lv'); return Array.isArray(a) ? a[i] : ['danger', 'potential', 'attention', 'safe'][i]; }

  var CFG = {
    stumbleDip: 0.09, stumbleWin: 500, stumbleRecover: 1600, stumbleBack: 0.35, stumbleCool: 4000,
    handOutMs: 1500, vehD: 0.25, vehP: 0.75, vehA: 1.5, vehClearMs: 2000,
    loudOver: 22, loudMin: -30, loudMs: 250, loudCool: 15000, fuseWin: 6000, ergoEvery: 5000
  };
  var KEY_MZ = 'shk3_mzones', KEY_NF = 'shk3_nearfall', KEY_ERGO = 'shk3_ergo', KEY_FU = 'shk3_fusion';
  function jget(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  var S = new WeakMap();           // 每个追踪对象的附加状态
  function st(tk) { var s = S.get(tk); if (!s) { s = { h: [], dip: null, lastStumble: 0, stumbles: 0, rula: null, rulaS: null, veh: 3, vehSafeAt: 0, handIn: {}, handOutAt: {}, fuse: null }; S.set(tk, s); } return s; }
  function vis(p, v) { return p && (p.visibility == null || p.visibility > (v || 0.45)); }
  function wid(tk) { return 'P' + tk.id; }
  /* 区域名：画了危险区域就用区域名；否则用 现场名 + 画面九宫格（A1 = 左上 … C3 = 右下），与语言无关 */
  function zoneOf(tk) {
    if (tk.zoneName) return tk.zoneName;
    var b = tk.f && tk.f.box; if (!b) return L.site();
    var x = (b[0] + b[2]) / 2, y = b[3];
    return L.site() + ' · ' + 'ABC'.charAt(Math.min(2, Math.floor(x * 3))) + (1 + Math.min(2, Math.floor(y * 3)));
  }
  function devOf(tk) { return L.devices().find(function (d) { return (d.wearer === 'auto' ? d.wearerId : +d.wearer) === tk.id; }); }

  /* ---------- 卡片 UI ---------- */
  var card = document.createElement('div'); card.className = 'card'; card.id = 'cardPlus';
  card.innerHTML = '<h3><span data-i18n="px_title"></span><span class="sp"></span><small class="muted" data-i18n="px_sub" style="font-weight:600"></small></h3>' +
    '<div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:8px"><button id="pxMz" data-i18n="px_mz"></button><button id="pxMzClr" data-i18n="px_mz_clear" style="display:none"></button>' +
    '<button id="pxMic" data-i18n="px_mic"></button><span id="pxDb" class="mono muted" style="font-size:12px"></span></div>' +
    '<div class="note" id="pxMicNote" style="display:none" data-i18n="px_mic_note"></div>' +
    '<div id="pxTable" style="font-size:12px;overflow-x:auto"></div>';
  var anchor = $('cardEnv'); if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(card, anchor.nextSibling); else document.body.appendChild(card);
  SHKI18N.apply(card);

  /* ---------- ② 机器危险点：拖矩形 ---------- */
  var mzones = jget(KEY_MZ, []).filter(function (z) { return z && z.r && z.r.length === 4; }), drawing = null;
  function saveMz() { jset(KEY_MZ, mzones); $('pxMzClr').style.display = mzones.length ? '' : 'none'; }
  function toNorm(e) {
    var cv = L.canvas, r = cv.getBoundingClientRect(), W = cv.width || 16, H = cv.height || 9;
    var s = Math.min(r.width / W, r.height / H), ox = (r.width - W * s) / 2, oy = (r.height - H * s) / 2;
    return [Math.max(0, Math.min(1, (e.clientX - r.left - ox) / (W * s))), Math.max(0, Math.min(1, (e.clientY - r.top - oy) / (H * s)))];
  }
  $('pxMz').onclick = function () {
    drawing = drawing ? null : { a: null, b: null };
    L.canvas.classList.toggle('zedit', !!drawing);
    this.textContent = drawing ? t('px_mz_draw') : t('px_mz');
  };
  $('pxMzClr').onclick = function () { mzones = []; saveMz(); };
  L.canvas.addEventListener('pointerdown', function (e) { if (!drawing) return; drawing.a = drawing.b = toNorm(e); e.preventDefault(); });
  L.canvas.addEventListener('pointermove', function (e) { if (drawing && drawing.a) drawing.b = toNorm(e); });
  L.canvas.addEventListener('pointerup', function () {
    if (!drawing || !drawing.a) return;
    var a = drawing.a, b = drawing.b, r = [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])];
    if (r[2] - r[0] > 0.02 && r[3] - r[1] > 0.02) { mzones.push({ id: 'M' + Date.now().toString(36), name: t('mz_name') + ' ' + (mzones.length + 1), r: r }); saveMz(); L.log('info', '✓ ' + t('mz_name')); }
    drawing = null; L.canvas.classList.remove('zedit'); $('pxMz').textContent = t('px_mz');
  });
  saveMz();
  var HANDS = [15, 16, 17, 18, 19, 20, 21, 22];
  function checkHands(tk, s, now) {
    if (!tk.lm || tk.noPose) return;
    mzones.forEach(function (z) {
      var inside = HANDS.some(function (i) { var p = tk.lm[i]; return vis(p, 0.3) && p.x >= z.r[0] && p.x <= z.r[2] && p.y >= z.r[1] && p.y <= z.r[3]; });
      var key = 'mz:' + z.id + ':' + wid(tk);
      if (inside) {
        s.handOutAt[z.id] = null; z.hot = Date.now();
        if (!s.handIn[z.id]) {
          s.handIn[z.id] = now; z.hot = Date.now();
          L.raise({ key: key, wid: wid(tk), kind: 'hand_in_machine', level: 'danger', msg: tr('ev_hand_in_machine', { id: wid(tk), zone: z.name }), say: t('say_hand_in_machine') });
          L.beacon('R');
        }
      } else if (s.handIn[z.id]) {
        if (!s.handOutAt[z.id]) s.handOutAt[z.id] = now;
        else if (now - s.handOutAt[z.id] > CFG.handOutMs) { s.handIn[z.id] = 0; s.handOutAt[z.id] = null; L.clearAlert(key, 'auto'); }
      }
    });
  }

  /* ---------- ① 踉跄检测 ---------- */
  function checkStumble(tk, s, now) {
    var f = tk.f; if (!f || f.hipY == null || tk.noPose) { s.dip = null; return; }
    var h = Math.max(0.05, f.box[3] - f.box[1]), stand = tk.fsm.posture === 'stand';
    s.h.push({ t: now, hip: f.hipY, h: h, stand: stand });
    while (s.h.length && now - s.h[0].t > 2500) s.h.shift();
    if (tk.fsm.state !== 'normal') { s.dip = null; return; }   // 交给原有跌倒流程
    if (!s.dip) {
      for (var i = 0; i < s.h.length; i++) {
        var p = s.h[i], dt = now - p.t;
        if (dt < 120 || dt > CFG.stumbleWin || !p.stand) continue;
        if (f.hipY - p.hip > CFG.stumbleDip * p.h) { s.dip = { t0: now, base: p.hip, peak: f.hipY, h: p.h }; break; }
      }
      return;
    }
    var d = s.dip; if (f.hipY > d.peak) d.peak = f.hipY;
    if (now - d.t0 > CFG.stumbleRecover) { s.dip = null; return; }      // 一直蹲着 = 下蹲，不算
    if (stand && f.hipY < d.base + CFG.stumbleBack * (d.peak - d.base)) {
      s.dip = null;
      if (now - s.lastStumble < CFG.stumbleCool) return;
      s.lastStumble = now; s.stumbles++;
      var zone = zoneOf(tk), b = f.box;
      var rec = { ts: Date.now(), site: L.site(), zone: zone, wid: wid(tk), worker: (L.workerOf && L.workerOf(tk) || {}).id || null, x: +((b[0] + b[2]) / 2).toFixed(3), y: +b[3].toFixed(3), depth: +((d.peak - d.base) / d.h).toFixed(2) };
      var all = jget(KEY_NF, []); all.push(rec); jset(KEY_NF, all.slice(-500));
      L.raise({ key: wid(tk) + ':stumble', wid: wid(tk), kind: 'near_fall', level: 'warn', msg: tr('ev_near_fall', { id: wid(tk), zone: zone }), say: tr('say_near_fall', { id: wid(tk) }), auto: 8000, cooldown: CFG.stumbleCool });
      L.send({ type: 'event', kind: 'near_fall', wid: wid(tk), level: 'info', zone: zone, depth: rec.depth, x: rec.x, y: rec.y, msg: tr('ev_near_fall', { id: wid(tk), zone: zone }) });
    }
  }

  /* ---------- ④ RULA 简化 ---------- */
  function ang(ax, ay, bx, by) { var d = Math.atan2(ax * by - ay * bx, ax * bx + ay * by); return Math.abs(d * 180 / Math.PI); }
  function rula(lm, W, H, tilt) {
    var P = function (i) { return vis(lm[i], 0.4) ? { x: lm[i].x * W, y: lm[i].y * H } : null; };
    var ls = P(11), rs = P(12), lh = P(23), rh = P(24), le = P(13), re = P(14), lw = P(15), rw = P(16), lear = P(7), rear = P(8);
    if (!(ls || rs) || !(lh || rh)) return null;
    var sh = ls && rs ? { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 } : (ls || rs), hp = lh && rh ? { x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2 } : (lh || rh);
    var down = { x: hp.x - sh.x, y: hp.y - sh.y };
    var ua = 1, la = 1;
    [[ls, le, lw], [rs, re, rw]].forEach(function (a) {
      if (!a[0] || !a[1]) return;
      var u = ang(down.x, down.y, a[1].x - a[0].x, a[1].y - a[0].y);
      var su = u < 20 ? 1 : u < 45 ? 2 : u < 90 ? 3 : 4; if (su > ua) ua = su;
      if (a[2]) { var e = 180 - ang(a[0].x - a[1].x, a[0].y - a[1].y, a[2].x - a[1].x, a[2].y - a[1].y); var sl = (e >= 60 && e <= 100) ? 1 : 2; if (sl > la) la = sl; }
    });
    var nk = 1;
    var ear = lear && rear ? { x: (lear.x + rear.x) / 2, y: (lear.y + rear.y) / 2 } : (lear || rear);
    if (ear) { var n = ang(-down.x, -down.y, ear.x - sh.x, ear.y - sh.y); nk = n < 10 ? 1 : n < 20 ? 2 : 3; }
    var tr_ = tilt == null ? 1 : tilt < 5 ? 1 : tilt < 20 ? 2 : tilt < 60 ? 3 : 4;
    var sum = ua + la + nk + tr_;                      // 4 … 13
    return { score: Math.max(1, Math.min(7, Math.round(1 + (sum - 4) * 6 / 9))), ua: ua, la: la, nk: nk, tr: tr_ };
  }
  var ergoAcc = {}, lastErgoAt = 0;
  function rulaColor(s) { return s <= 2 ? '#16C68C' : s <= 4 ? '#F5B400' : s <= 6 ? '#FF8C00' : '#E8133A'; }

  /* ---------- ③ 人–车接近 ---------- */
  function rectDist(px, py, b) { var dx = Math.max(b[0] - px, 0, px - b[2]), dy = Math.max(b[1] - py, 0, py - b[3]); return Math.hypot(dx, dy); }
  function checkVehicle(tk, s, now, dets) {
    var f = tk.f; if (!f) return null;
    var vs = dets.filter(function (d) { return (d.cls === 8 || d.cls === 9) && d.score > 0.4; });
    if (!vs.length) { s.veh = 3; finishVeh(tk, s, now); return null; }
    var ph = Math.max(0.05, f.box[3] - f.box[1]), fx = (f.box[0] + f.box[2]) / 2, fy = f.box[3], best = null;
    vs.forEach(function (v) { var d = rectDist(fx, fy, v.box) / ph; if (!best || d < best.d) best = { d: d, v: v }; });
    var lvl = best.d < CFG.vehD ? 0 : best.d < CFG.vehP ? 1 : best.d < CFG.vehA ? 2 : 3;
    var key = 'veh:' + wid(tk);
    if (lvl === 0 && s.veh !== 0) L.raise({ key: key, wid: wid(tk), kind: 'vehicle_danger', level: 'danger', msg: tr('ev_veh_danger', { id: wid(tk) }), say: tr('say_veh_danger', { id: wid(tk) }) });
    else if (lvl === 1 && s.veh > 1) L.raise({ key: key, wid: wid(tk), kind: 'vehicle_near', level: 'warn', msg: tr('ev_veh_pot', { id: wid(tk) }), cooldown: 20000 });
    s.veh = lvl; finishVeh(tk, s, now);
    return { lvl: lvl, from: [fx, fy], to: [(best.v.box[0] + best.v.box[2]) / 2, best.v.box[3]] };
  }
  function finishVeh(tk, s, now) {
    if (s.veh >= 2) { if (!s.vehSafeAt) s.vehSafeAt = now; else if (now - s.vehSafeAt > CFG.vehClearMs) L.clearAlert('veh:' + wid(tk), 'auto'); }
    else s.vehSafeAt = 0;
  }

  /* ---------- ⑤ 声音 ---------- */
  var mic = { on: false, rec: null, ctx: null, stream: null, base: null, overAt: 0, lastLoud: 0, lastVoice: 0, db: null };
  var KW = { zh: ['救命', '救救', '来人', '快来人', '帮帮我', '有人受伤'], ko: ['살려', '도와줘', '도와주세요', '사람 살려', '119'], en: ['help', 'emergency', 'somebody help'] };
  function micLang() { return SHKI18N.lang === 'ko' ? 'ko-KR' : SHKI18N.lang === 'en' ? 'en-US' : 'zh-CN'; }
  async function micStart() {
    try {
      mic.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false } });
      mic.ctx = new (window.AudioContext || window.webkitAudioContext)();
      var src = mic.ctx.createMediaStreamSource(mic.stream), an = mic.ctx.createAnalyser(); an.fftSize = 1024; src.connect(an);
      var buf = new Float32Array(an.fftSize);
      mic.timer = setInterval(function () {
        an.getFloatTimeDomainData(buf); var s = 0; for (var i = 0; i < buf.length; i++) s += buf[i] * buf[i];
        var db = 10 * Math.log10(s / buf.length + 1e-10), now = Date.now();
        mic.db = db; mic.base = mic.base == null ? db : (db < mic.base + 6 ? mic.base * 0.98 + db * 0.02 : mic.base);
        if (db > mic.base + CFG.loudOver && db > CFG.loudMin) {
          if (!mic.overAt) mic.overAt = now;
          if (now - mic.overAt > CFG.loudMs && now - mic.lastLoud > CFG.loudCool) {
            mic.lastLoud = now;
            L.raise({ key: 'mic:loud', wid: null, kind: 'loud_sound', level: 'warn', msg: tr('ev_loud', { db: Math.round(db) }), auto: 10000 });
          }
        } else mic.overAt = 0;
        $('pxDb').textContent = Math.round(db) + ' dB';
      }, 50);
    } catch (e) { L.log('warn', '🎤 ' + (e && e.message || e)); return false; }
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      var rec = new SR(); rec.continuous = true; rec.interimResults = true; rec.lang = micLang(); mic.rec = rec;
      rec.onresult = function (ev) {
        for (var i = ev.resultIndex; i < ev.results.length; i++) {
          var txt = ev.results[i][0].transcript.toLowerCase(), list = (KW[SHKI18N.lang] || []).concat(KW.en);
          var hit = list.find(function (k) { return txt.indexOf(k.toLowerCase()) >= 0; });
          if (hit && Date.now() - mic.lastVoice > 10000) {
            mic.lastVoice = Date.now();
            L.raise({ key: 'mic:sos', wid: null, kind: 'voice_sos', level: 'danger', msg: tr('ev_voice_sos', { w: hit }), say: t('say_voice_sos') });
          }
        }
      };
      rec.onend = function () { if (mic.on && mic.rec === rec) { try { rec.lang = micLang(); rec.start(); } catch (e) {} } };
      rec.onerror = function (e) { if (e.error === 'not-allowed') mic.rec = null; };
      try { rec.start(); } catch (e) {}
    }
    return true;
  }
  function micStop() {
    mic.on = false; clearInterval(mic.timer);
    if (mic.rec) { try { mic.rec.stop(); } catch (e) {} mic.rec = null; }
    if (mic.stream) mic.stream.getTracks().forEach(function (k) { k.stop(); });
    if (mic.ctx) try { mic.ctx.close(); } catch (e) {}
    mic.stream = mic.ctx = null; mic.base = null; $('pxDb').textContent = '';
  }
  $('pxMic').onclick = async function () {
    if (mic.on) { micStop(); this.textContent = t('px_mic'); this.classList.remove('pri'); $('pxMicNote').style.display = 'none'; return; }
    mic.on = true; $('pxMicNote').style.display = 'block';
    if (await micStart()) { this.textContent = t('px_mic_on'); this.classList.add('pri'); } else mic.on = false;
  };

  /* ---------- ⑥ 多源交叉验证 ---------- */
  var fuStats = jget(KEY_FU, { confirmed: 0, single: 0, fp: 0, since: Date.now() });
  function bandState(dv, now) {
    if (!dv) return { k: 'none' };
    var v = dv.view || {}, hit = dv.lastImpact && now - dv.lastImpact < CFG.fuseWin;
    if (hit || (dv.impactState && dv.impactState.stage >= 1)) return { k: 'hit' };
    if (dv.risk && (dv.risk.collapse || dv.risk.level === 'stop')) return { k: 'hit', why: 'hr' };
    if (v.motion != null) return { k: v.motion > 25 ? 'move' : 'still', hr: v.hr };
    return { k: 'still', hr: v.hr };
  }
  function fuse(tk, s, now) {
    var cam = tk.fsm.state, falling = cam === 'suspect' || cam === 'ask' || cam === 'danger';
    var dv = devOf(tk), b = bandState(dv, Date.now()), audio = mic.on && (Date.now() - mic.lastLoud < CFG.fuseWin || Date.now() - mic.lastVoice < CFG.fuseWin);
    if (!falling) { s.fuse = null; return { v: 'ok', b: b, audio: audio }; }
    if (!s.fuse) s.fuse = { t0: now, done: false };
    var srcs = [];
    if (b.k === 'hit') srcs.push('⌚'); if (audio) srcs.push('🎤');
    if (srcs.length && !s.fuse.done) {
      s.fuse.done = 'conf'; fuStats.confirmed++; jset(KEY_FU, fuStats);
      L.raise({ key: wid(tk) + ':fused', wid: wid(tk), kind: 'fused_fall', level: 'danger', msg: tr('ev_fused_fall', { id: wid(tk), src: srcs.join('+') }), say: tr('say_fused_fall', { id: wid(tk) }) });
    } else if (!s.fuse.done && b.k === 'move' && now - s.fuse.t0 > 1500) {
      s.fuse.done = 'fp'; fuStats.fp++; jset(KEY_FU, fuStats); L.log('info', tr('ev_fp', { id: wid(tk) }));
      L.send({ type: 'event', kind: 'fall_fp', wid: wid(tk), level: 'info', msg: tr('ev_fp', { id: wid(tk) }) });
    } else if (!s.fuse.done && b.k === 'none' && now - s.fuse.t0 > 1500) { s.fuse.done = 'single'; fuStats.single++; jset(KEY_FU, fuStats); }
    var v = s.fuse.done === 'conf' ? 'conf' : s.fuse.done === 'fp' ? 'fp' : s.fuse.done === 'single' ? 'single' : 'wait';
    return { v: v, b: b, audio: audio };
  }

  /* ---------- 每帧：计算 + 画图 ---------- */
  var view = {};
  L.onDraw(function (g, W, H) {
    var now = performance.now(), dets = (L.dets && L.dets()) || [], lw = Math.max(2, W / 400);
    // 机器危险点
    mzones.forEach(function (z) {
      var x = z.r[0] * W, y = z.r[1] * H, w = (z.r[2] - z.r[0]) * W, h = (z.r[3] - z.r[1]) * H, hot = z.hot && Date.now() - z.hot < 3000;
      g.save(); g.setLineDash([lw * 4, lw * 3]); g.lineWidth = lw * 1.5; g.strokeStyle = hot ? '#E8133A' : '#FF8C00';
      g.fillStyle = hot ? 'rgba(232,19,58,.28)' : 'rgba(255,140,0,.10)'; g.fillRect(x, y, w, h); g.strokeRect(x, y, w, h);
      g.setLineDash([]); g.fillStyle = hot ? '#E8133A' : '#FF8C00'; g.font = '700 ' + Math.round(lw * 7) + 'px sans-serif'; g.fillText('✋ ' + z.name, x + 4, y + lw * 8); g.restore();
    });
    if (drawing && drawing.a) {
      var a = drawing.a, b = drawing.b; g.save(); g.strokeStyle = '#FF8C00'; g.lineWidth = lw * 1.5; g.setLineDash([lw * 4, lw * 3]);
      g.strokeRect(a[0] * W, a[1] * H, (b[0] - a[0]) * W, (b[1] - a[1]) * H); g.restore();
    }
    var seen = {};
    L.tracks().forEach(function (tk) {
      if (!tk.f || now - tk.seen > 1500) return;
      var s = st(tk); seen[tk.id] = 1;
      checkStumble(tk, s, now);
      checkHands(tk, s, now);
      var vr = checkVehicle(tk, s, now, dets);
      if (tk.lm && !tk.noPose) { var r = rula(tk.lm, W, H, tk.f.tilt); if (r) { s.rula = r; s.rulaS = s.rulaS == null ? r.score : s.rulaS * 0.85 + r.score * 0.15; } }
      var fu = fuse(tk, s, now);
      view[tk.id] = { tk: tk, s: s, fu: fu };
      // 画：RULA 标签、人车连线、踉跄闪点
      var bx = tk.f.box, x0 = bx[0] * W, y0 = bx[1] * H;
      if (s.rulaS != null) {
        var sc = Math.round(s.rulaS), txt = 'RULA ' + sc; g.save(); g.font = '800 ' + Math.round(lw * 6.5) + 'px sans-serif';
        var tw = g.measureText(txt).width + lw * 4; g.fillStyle = rulaColor(sc); g.fillRect(x0, Math.max(0, y0 - lw * 20), tw, lw * 9);
        g.fillStyle = '#fff'; g.fillText(txt, x0 + lw * 2, Math.max(lw * 7, y0 - lw * 13)); g.restore();
      }
      if (vr && vr.lvl < 3) {
        g.save(); g.strokeStyle = ['#E8133A', '#FF8C00', '#F5B400'][vr.lvl]; g.lineWidth = lw * 2; g.setLineDash(vr.lvl ? [lw * 3, lw * 3] : []);
        g.beginPath(); g.moveTo(vr.from[0] * W, vr.from[1] * H); g.lineTo(vr.to[0] * W, vr.to[1] * H); g.stroke();
        g.fillStyle = g.strokeStyle; g.font = '800 ' + Math.round(lw * 6.5) + 'px sans-serif'; g.fillText('🚜 ' + lv(vr.lvl), (vr.from[0] + vr.to[0]) / 2 * W, (vr.from[1] + vr.to[1]) / 2 * H); g.restore();
      }
      if (now - s.lastStumble < 2500) { g.save(); g.strokeStyle = '#F5B400'; g.lineWidth = lw * 2; g.beginPath(); g.arc((bx[0] + bx[2]) / 2 * W, bx[3] * H, lw * 14, 0, 7); g.stroke(); g.restore(); }
    });
    Object.keys(view).forEach(function (k) { if (!seen[k]) delete view[k]; });
    // 每 5 秒：姿势负荷汇总（按区域）
    if (now - lastErgoAt > CFG.ergoEvery) {
      lastErgoAt = now;
      var agg = jget(KEY_ERGO, {});
      Object.keys(view).forEach(function (k) {
        var o = view[k]; if (o.s.rulaS == null) return;
        var z = zoneOf(o.tk), sc = Math.round(o.s.rulaS), a = agg[z] || (agg[z] = { n: 0, sum: 0, hi: 0, site: L.site() });
        a.n++; a.sum += sc; if (sc >= 5) a.hi++; a.ts = Date.now();
        L.send({ type: 'event', kind: 'ergo', wid: 'P' + k, level: 'info', zone: z, score: sc, part: o.s.rula });
      });
      jset(KEY_ERGO, agg);
    }
  });

  /* ---------- 表格 ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  setInterval(function () {
    var box = $('pxTable'); if (!box) return;
    var ks = Object.keys(view);
    if (!ks.length) { box.innerHTML = '<div class="empty">' + t('px_none') + '</div>'; return; }
    var vtxt = { ok: t('px_v_ok'), single: t('px_v_single'), conf: t('px_v_conf'), fp: t('px_v_fp'), wait: t('px_v_wait') };
    var vcol = { ok: 'var(--g)', single: 'var(--w)', conf: 'var(--r)', fp: 'var(--ink3)', wait: 'var(--w)' };
    var h = '<table style="width:100%;border-collapse:collapse"><tr style="color:var(--ink3);text-align:left"><th>' + t('px_h_who') + '</th><th>' + t('px_h_cam') + '</th><th>' + t('px_h_rula') + '</th><th>' + t('px_h_band') + '</th><th>' + t('px_h_mic') + '</th><th>' + t('px_h_ver') + '</th><th>' + t('px_h_st') + '</th></tr>';
    ks.forEach(function (k) {
      var o = view[k], tk = o.tk, s = o.s, fu = o.fu || {}, po = tk.fsm.posture;
      var cam = tk.fsm.state !== 'normal' ? t('px_cam_down') + ' (' + tk.fsm.state + ')' : t('px_cam_' + (['stand', 'bend', 'down'].indexOf(po) >= 0 ? po : 'other'));
      var sc = s.rulaS == null ? '—' : Math.round(s.rulaS), b = fu.b || { k: 'none' };
      h += '<tr style="border-top:1px solid var(--bdr)"><td><b>P' + k + '</b></td><td>' + esc(cam) + '</td><td><b style="color:' + (s.rulaS == null ? 'inherit' : rulaColor(sc)) + '">' + sc + '</b>/7</td>' +
        '<td>' + t('px_band_' + b.k) + (b.hr ? ' · ' + b.hr : '') + '</td><td>' + (mic.on ? (fu.audio ? '❗' : '✓') : '—') + '</td>' +
        '<td style="color:' + vcol[fu.v || 'ok'] + ';font-weight:800">' + vtxt[fu.v || 'ok'] + '</td><td>' + s.stumbles + '</td></tr>';
    });
    box.innerHTML = h + '</table>';
  }, 500);

  window.SHKPlusField = { CFG: CFG, rula: rula, stats: function () { return fuStats; }, _t: { checkVehicle: checkVehicle, st: st, view: function () { return view; } } };
})();
