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
      ev_dust_mask: '😷 {id} 在粉尘区「{zone}」未戴口罩', say_dust_mask: '{id}，这里粉尘浓度高，请立即戴好防尘口罩。',
      ev_dust_lv: '🌫 {who} 今日粉尘暴露已达限值的 {p}%（{zone}）', nt_dust_50: '今日粉尘暴露已达限值一半，请全程佩戴防尘口罩。', nt_dust_80: '今日粉尘暴露已达限值 80%，建议离开粉尘区休息或调岗。', nt_dust_100: '今日粉尘暴露已达到限值，请立即离开粉尘区。',
      loto: '🔒 检修上锁', loto_on: '🔒 检修中（{by}）', loto_off: '解除上锁', loto_s: ['已断电', '已上锁', '已挂牌', '已验电确认无电'], loto_by: '确认人', loto_ok: '确认上锁', loto_need: '四项都要确认并填写确认人', ev_loto_in: '🔒 {id} 进入检修中的「{zone}」（已上锁，不报警）', ev_loto_on: '🔒「{zone}」检修上锁：{by}', ev_loto_off: '🔓「{zone}」解除上锁',
      nz_mic: '用麦克风估算本区域噪声', nz_off: '校准偏移 dB', nz_val: '噪声 ≈ {v} dB', nt_noise_50: '今日噪声暴露已达允许量一半，请戴好耳塞 / 耳罩。', nt_noise_80: '今日噪声暴露已达允许量 80%，建议到安静区域休息。', nt_noise_100: '今日噪声暴露已达允许量，请离开高噪声区域。', ev_noise_lv: '🔊 {who} 今日噪声暴露 {p}%（{zone}）',
      drill_t: '🚨【演练】', buddy_t: '👷 徒弟提醒', buddy_b: '你带的 {n}：{m}',
      rx_zone: '📍 本机区域', rx_ph: '例如 焊接区', rx_tip: '连到这台电脑的手表 = 人在这个区域（蓝牙约 10 m）', rx_here: '⌚ 在本区域：{n}', rx_none: '⌚ 本区域暂无手表',
      pm_conn: '🌫 连接粉尘传感器（SDS011）', pm_sim: '模拟读数', pm_cal: '校准系数', pm_use: '作为本区域浓度', pm_note: '光学 PM 传感器是指示值，与法定称重测定不同；校准系数按现场称重采样结果设置。', pm_nos: '这个浏览器不支持 Web Serial（请用电脑 Chrome / Edge）',
      aid_t: '🩹 最近的急救物品', aid_body: '{what}发生在 {where}。最近的 {list}。请附近人员带上前往。', aid_none: '还没有登记急救物品位置', aid_trained: '已培训急救员：{n}',
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
      ev_dust_mask: '😷 {id} 분진 구역「{zone}」에서 마스크 미착용', say_dust_mask: '{id}, 이곳은 분진 농도가 높습니다. 방진마스크를 바로 착용하세요.',
      ev_dust_lv: '🌫 {who} 오늘 분진 노출이 기준의 {p}%에 도달({zone})', nt_dust_50: '오늘 분진 노출이 기준의 절반입니다. 방진마스크를 계속 착용하세요.', nt_dust_80: '오늘 분진 노출이 기준의 80%입니다. 분진 구역을 벗어나 쉬거나 작업 전환을 권합니다.', nt_dust_100: '오늘 분진 노출이 기준에 도달했습니다. 즉시 분진 구역을 벗어나세요.',
      loto: '🔒 정비 잠금', loto_on: '🔒 정비 중({by})', loto_off: '잠금 해제', loto_s: ['전원 차단', '잠금', '표지 부착', '검전으로 무전압 확인'], loto_by: '확인자', loto_ok: '잠금 확인', loto_need: '네 항목 모두 확인하고 확인자를 입력하세요', ev_loto_in: '🔒 {id} 정비 중인「{zone}」진입(잠금 상태, 경보 없음)', ev_loto_on: '🔒「{zone}」정비 잠금: {by}', ev_loto_off: '🔓「{zone}」잠금 해제',
      nz_mic: '마이크로 이 구역 소음 추정', nz_off: '보정 dB', nz_val: '소음 ≈ {v} dB', nt_noise_50: '오늘 소음 노출이 허용량의 절반입니다. 귀마개·귀덮개를 착용하세요.', nt_noise_80: '오늘 소음 노출이 허용량의 80%입니다. 조용한 곳에서 쉬세요.', nt_noise_100: '오늘 소음 노출이 허용량에 도달했습니다. 고소음 구역을 벗어나세요.', ev_noise_lv: '🔊 {who} 오늘 소음 노출 {p}%({zone})',
      drill_t: '🚨[훈련]', buddy_t: '👷 멘티 알림', buddy_b: '담당 {n}: {m}',
      rx_zone: '📍 이 PC 구역', rx_ph: '예: 용접 구역', rx_tip: '이 PC에 연결된 워치 = 이 구역에 있음(블루투스 약 10 m)', rx_here: '⌚ 이 구역: {n}', rx_none: '⌚ 이 구역에 워치 없음',
      pm_conn: '🌫 분진 센서 연결(SDS011)', pm_sim: '모의 값', pm_cal: '보정계수', pm_use: '이 구역 농도로 사용', pm_note: '광학 PM 센서는 지시값이며 법정 중량 측정과 다릅니다. 보정계수는 현장 중량 시료 결과로 설정하세요.', pm_nos: '이 브라우저는 Web Serial을 지원하지 않습니다(PC Chrome / Edge 사용)',
      aid_t: '🩹 가장 가까운 응급용품', aid_body: '{where}에서 {what}. 가장 가까운 {list}. 근처 인원은 가지고 가세요.', aid_none: '등록된 응급용품 위치가 없습니다', aid_trained: '교육 이수 응급요원: {n}',
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
      ev_dust_mask: '😷 {id} without a mask in dust zone "{zone}"', say_dust_mask: '{id}, dust is high here. Put on your dust mask now.',
      ev_dust_lv: '🌫 {who} has reached {p}% of today\'s dust limit ({zone})', nt_dust_50: 'Your dust exposure today is half the limit. Keep your dust mask on.', nt_dust_80: 'Your dust exposure today is 80% of the limit. Leave the dust area for a break or switch tasks.', nt_dust_100: 'Your dust exposure today has reached the limit. Leave the dust area now.',
      loto: '🔒 Lock-out', loto_on: '🔒 Under maintenance ({by})', loto_off: 'Release', loto_s: ['Power off', 'Locked', 'Tagged', 'Verified dead'], loto_by: 'Confirmed by', loto_ok: 'Confirm lock-out', loto_need: 'Tick all four and enter who confirmed', ev_loto_in: '🔒 {id} entered "{zone}" under lock-out (no alarm)', ev_loto_on: '🔒 "{zone}" locked out: {by}', ev_loto_off: '🔓 "{zone}" lock-out released',
      nz_mic: 'Estimate zone noise with the microphone', nz_off: 'Offset dB', nz_val: 'Noise ≈ {v} dB', nt_noise_50: 'Your noise dose today is half the limit. Wear ear plugs / muffs.', nt_noise_80: 'Your noise dose today is 80% of the limit. Rest in a quiet area.', nt_noise_100: 'Your noise dose today has reached the limit. Leave the noisy area.', ev_noise_lv: '🔊 {who} noise dose today {p}% ({zone})',
      drill_t: '🚨 [DRILL]', buddy_t: '👷 Mentee alert', buddy_b: 'Your mentee {n}: {m}',
      rx_zone: '📍 This PC\'s zone', rx_ph: 'e.g. Welding', rx_tip: 'A watch connected to this PC = the person is in this zone (Bluetooth ≈10 m)', rx_here: '⌚ In this zone: {n}', rx_none: '⌚ No watch in this zone',
      pm_conn: '🌫 Connect dust sensor (SDS011)', pm_sim: 'Simulate', pm_cal: 'Calibration', pm_use: 'Use as zone concentration', pm_note: 'Optical PM sensors give indicative values, not the statutory gravimetric measurement; set the calibration factor from on-site gravimetric sampling.', pm_nos: 'This browser has no Web Serial (use desktop Chrome / Edge)',
      aid_t: '🩹 Nearest first-aid equipment', aid_body: '{what} at {where}. Nearest: {list}. People nearby, bring it.', aid_none: 'No first-aid locations registered yet', aid_trained: 'Trained first aiders: {n}',
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

  /* 记录本模块产生的事件（平台「证据包」「风险评估」读取） */
  function raise(a) {
    try { var ev = jget('shk3_px_events', []); ev.push({ ts: Date.now(), kind: a.kind, level: a.level, msg: a.msg, wid: a.wid, site: L.site(), zone: a.zone || null }); jset('shk3_px_events', ev.slice(-2000)); } catch (e) {}
    L.raise(a);
  }
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
    '<div id="pxMzList" style="font-size:12px"></div>' +
    '<div class="note" id="pxMicNote" style="display:none" data-i18n="px_mic_note"></div>' +
    '<div class="row" style="gap:6px;flex-wrap:wrap;align-items:center;margin-top:6px"><label class="row muted" style="gap:4px;font-size:12px"><input type="checkbox" id="pxNzMic"><span data-i18n="nz_mic"></span></label><label class="row muted" style="gap:4px;font-size:12px"><span data-i18n="nz_off"></span><input id="pxNzOff" type="number" step="1" style="width:60px"></label><span id="pxNzVal" class="mono" style="font-size:12px"></span></div>' +
    '<div style="border-top:1px solid var(--bdr);margin:8px 0;padding-top:8px"><div class="row" style="gap:6px;flex-wrap:wrap;align-items:center"><b data-i18n="rx_zone" style="font-size:12px"></b><input id="pxRx" list="pxRxL" style="width:150px" data-i18n-ph="rx_ph"><datalist id="pxRxL"></datalist><span id="pxRxHere" class="muted" style="font-size:12px"></span></div>' +
    '<div class="muted" style="font-size:11px;margin-top:3px" data-i18n="rx_tip"></div>' +
    '<div class="row" style="gap:6px;flex-wrap:wrap;align-items:center;margin-top:8px"><button id="pxPm" data-i18n="pm_conn"></button><label class="row muted" style="gap:4px;font-size:12px"><input type="checkbox" id="pxPmSim"><span data-i18n="pm_sim"></span></label>' +
    '<label class="row muted" style="gap:4px;font-size:12px"><span data-i18n="pm_cal"></span><input id="pxPmCal" type="number" step="0.1" style="width:60px"></label><label class="row muted" style="gap:4px;font-size:12px"><input type="checkbox" id="pxPmUse" checked><span data-i18n="pm_use"></span></label></div>' +
    '<div id="pxPmVal" class="mono" style="font-size:13px;margin-top:4px"></div><div class="muted" style="font-size:11px" data-i18n="pm_note"></div></div>' +
    '<div id="pxTable" style="font-size:12px;overflow-x:auto"></div>';
  var anchor = $('cardEnv'); if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(card, anchor.nextSibling); else document.body.appendChild(card);
  SHKI18N.apply(card);

  /* ---------- ② 机器危险点：拖矩形 ---------- */
  var mzones = jget(KEY_MZ, []).filter(function (z) { return z && z.r && z.r.length === 4; }), drawing = null;
  function saveMz() { jset(KEY_MZ, mzones); $('pxMzClr').style.display = mzones.length ? '' : 'none'; renderMz(); }
  function logEv(kind, msg, zone) { var ev = jget('shk3_px_events', []); ev.push({ ts: Date.now(), kind: kind, level: 'info', msg: msg, site: L.site(), zone: zone || null }); jset('shk3_px_events', ev.slice(-2000)); L.log('info', msg); L.send({ type: 'event', kind: kind, level: 'info', msg: msg, zone: zone }); }
  var lotoEdit = null;
  function renderMz() {
    var box = $('pxMzList'); if (!box) return;
    box.innerHTML = mzones.map(function (z) {
      if (lotoEdit === z.id) return '<div style="border:1px solid var(--bdr);border-radius:8px;padding:8px;margin-top:6px"><b>' + esc(z.name) + '</b><div class="row" style="gap:8px;flex-wrap:wrap;margin:4px 0">' + t('loto_s').map(function (x, i) { return '<label class="row" style="gap:3px"><input type="checkbox" data-ls="' + i + '">' + esc(x) + '</label>'; }).join('') + '</div><input id="pxLotoBy" placeholder="' + esc(t('loto_by')) + '" style="width:130px"> <button class="pri" data-lok="' + z.id + '">' + t('loto_ok') + '</button> <button data-lx>✕</button><div id="pxLotoMsg" class="muted"></div></div>';
      return '<div class="row" style="gap:6px;align-items:center;margin-top:4px">✋ <b>' + esc(z.name) + '</b>' + (z.loto ? '<span style="color:var(--w);font-weight:700">' + esc(t('loto_on', { by: z.loto.by })) + '</span><button data-loff="' + z.id + '">' + t('loto_off') + '</button>' : '<button data-lon="' + z.id + '">' + t('loto') + '</button>') + '</div>';
    }).join('');
    box.querySelectorAll('[data-lon]').forEach(function (b) { b.onclick = function () { lotoEdit = b.dataset.lon; renderMz(); }; });
    box.querySelectorAll('[data-lx]').forEach(function (b) { b.onclick = function () { lotoEdit = null; renderMz(); }; });
    box.querySelectorAll('[data-loff]').forEach(function (b) { b.onclick = function () { var z = mzones.find(function (x) { return x.id === b.dataset.loff; }); if (!z) return; z.loto = null; jset(KEY_MZ, mzones); logEv('loto_off', tr('ev_loto_off', { zone: z.name }), z.name); renderMz(); }; });
    box.querySelectorAll('[data-lok]').forEach(function (b) { b.onclick = function () {
      var all = Array.prototype.every.call(box.querySelectorAll('[data-ls]'), function (c) { return c.checked; }), by = ($('pxLotoBy').value || '').trim();
      if (!all || !by) { $('pxLotoMsg').textContent = t('loto_need'); return; }
      var z = mzones.find(function (x) { return x.id === b.dataset.lok; }); z.loto = { by: by, at: Date.now() }; lotoEdit = null; jset(KEY_MZ, mzones); logEv('loto_on', tr('ev_loto_on', { zone: z.name, by: by }), z.name); renderMz();
    }; });
  }
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
      if (z.loto) { if (inside && !s.handIn[z.id]) { s.handIn[z.id] = now; logEv('loto_in', tr('ev_loto_in', { id: wid(tk), zone: z.name }), z.name); } else if (!inside) s.handIn[z.id] = 0; return; }
      if (inside) {
        s.handOutAt[z.id] = null; z.hot = Date.now();
        if (!s.handIn[z.id]) {
          s.handIn[z.id] = now; z.hot = Date.now();
          raise({ key: key, wid: wid(tk), kind: 'hand_in_machine', zone: z.name, level: 'danger', msg: tr('ev_hand_in_machine', { id: wid(tk), zone: z.name }), say: t('say_hand_in_machine') });
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
      raise({ key: wid(tk) + ':stumble', wid: wid(tk), kind: 'near_fall', zone: zone, level: 'warn', msg: tr('ev_near_fall', { id: wid(tk), zone: zone }), say: tr('say_near_fall', { id: wid(tk) }), auto: 8000, cooldown: CFG.stumbleCool });
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
    if (lvl === 0 && s.veh !== 0) raise({ key: key, wid: wid(tk), kind: 'vehicle_danger', zone: zoneOf(tk), level: 'danger', msg: tr('ev_veh_danger', { id: wid(tk) }), say: tr('say_veh_danger', { id: wid(tk) }) });
    else if (lvl === 1 && s.veh > 1) raise({ key: key, wid: wid(tk), kind: 'vehicle_near', zone: zoneOf(tk), level: 'warn', msg: tr('ev_veh_pot', { id: wid(tk) }), cooldown: 20000 });
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
            raise({ key: 'mic:loud', wid: null, kind: 'loud_sound', level: 'warn', msg: tr('ev_loud', { db: Math.round(db) }), auto: 10000 });
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
            raise({ key: 'mic:sos', wid: null, kind: 'voice_sos', level: 'danger', msg: tr('ev_voice_sos', { w: hit }), say: t('say_voice_sos') });
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
      raise({ key: wid(tk) + ':fused', wid: wid(tk), kind: 'fused_fall', zone: zoneOf(tk), level: 'danger', msg: tr('ev_fused_fall', { id: wid(tk), src: srcs.join('+') }), say: tr('say_fused_fall', { id: wid(tk) }) });
    } else if (!s.fuse.done && b.k === 'move' && now - s.fuse.t0 > 1500) {
      s.fuse.done = 'fp'; fuStats.fp++; jset(KEY_FU, fuStats); L.log('info', tr('ev_fp', { id: wid(tk) }));
      L.send({ type: 'event', kind: 'fall_fp', wid: wid(tk), level: 'info', msg: tr('ev_fp', { id: wid(tk) }) });
    } else if (!s.fuse.done && b.k === 'none' && now - s.fuse.t0 > 1500) { s.fuse.done = 'single'; fuStats.single++; jset(KEY_FU, fuStats); }
    var v = s.fuse.done === 'conf' ? 'conf' : s.fuse.done === 'fp' ? 'fp' : s.fuse.done === 'single' ? 'single' : 'wait';
    return { v: v, b: b, audio: audio };
  }

  /* ---------- ⑦ 口罩识别（PPE 模型的 Mask / NO-Mask 框，匹配到人框上部 35%） ---------- */
  function checkMask(tk, s, now, dets) {
    var b = tk.f && tk.f.box; if (!b) return;
    var head = [b[0], b[1], b[2], b[1] + (b[3] - b[1]) * 0.35], best = null;
    dets.forEach(function (d) {
      if ((d.cls !== 1 && d.cls !== 3) || d.score < 0.4) return;
      var ix = Math.max(0, Math.min(head[2], d.box[2]) - Math.max(head[0], d.box[0])), iy = Math.max(0, Math.min(head[3], d.box[3]) - Math.max(head[1], d.box[1]));
      var ov = ix * iy / Math.max(1e-6, (d.box[2] - d.box[0]) * (d.box[3] - d.box[1]));
      if (ov > 0.5 && (!best || d.score > best.score)) best = d;
    });
    if (best) { s.maskHist = (s.maskHist || []).concat([best.cls === 1]).slice(-6); }
    var h = s.maskHist || [], yes = h.filter(Boolean).length;
    s.mask = h.length >= 3 ? (yes >= h.length / 2) : null;      // true 戴 / false 没戴 / null 不确定
  }

  /* ---------- ⑧ 粉尘个人暴露：区域浓度 × 停留时间（戴口罩按防护系数折算） ---------- */
  var KEY_DZ = 'shk3_dust_zones', KEY_DE = 'shk3_dust_expo', BREATH = 1.25;   // 呼吸量 m³/h（轻中度劳动假设，约 10 m³ / 8 小时）
  function dustCfg() { return jget(KEY_DZ, {}); }
  function dayKey() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  var dustBuf = {}, dustLast = 0;
  function dustTick(tk, s, now) {
    var dv0 = devOf(tk); if (dv0 && dv0._pxZone) { s.dustIn = dv0._pxZone; return; }   // 戴着已连接的手表：由手表区域累计（见下）
    var cfg = dustCfg(), z = zoneOf(tk), zc = cfg[z]; if (!zc || !(zc.c > 0)) { s.dustIn = null; return; }
    var dt = s.dustAt ? Math.min(2, (now - s.dustAt) / 1000) : 0; s.dustAt = now; s.dustIn = z;
    var w = (L.workerOf && L.workerOf(tk)) || null, key = w ? w.id : wid(tk), who = w ? (w.name || w.id) : wid(tk);
    var b = dustBuf[key] || (dustBuf[key] = { who: who, zones: {}, src: 'cam' }), r = b.zones[z] || (b.zones[z] = { t: 0, tm: 0 });
    r.t += dt; if (s.mask === true) r.tm += dt;
    // 粉尘区未戴口罩 20 秒 → 提醒本人
    if (s.mask === false) { if (!s.noMaskAt) s.noMaskAt = now; if (now - s.noMaskAt > 20000) { s.noMaskAt = now + 1e9; raise({ key: wid(tk) + ':dustmask', wid: wid(tk), kind: 'dust_mask', zone: z, level: 'warn', msg: tr('ev_dust_mask', { id: wid(tk), zone: z }), say: tr('say_dust_mask', { id: wid(tk) }), auto: 15000, cooldown: 120000 }); if (w) L.notify(w.id, { level: 'warn', title: '😷', body: tr('say_dust_mask', { id: who }) }); } }
    else if (s.mask === true) s.noMaskAt = null;
  }
  function flushDust() {
    var keys = Object.keys(dustBuf); if (!keys.length) return;
    var all = jget(KEY_DE, {}), d = dayKey(), day = all[d] || (all[d] = {}), cfg = dustCfg();
    keys.forEach(function (k) {
      var b = dustBuf[k], rec = day[k] || (day[k] = { who: b.who, zones: {}, sent: 0 });
      rec.who = b.who; rec.src = b.src || rec.src || 'cam';
      Object.keys(b.zones).forEach(function (z) { var r = rec.zones[z] || (rec.zones[z] = { t: 0, tm: 0 }); r.t += b.zones[z].t; r.tm += b.zones[z].tm; });
      // 今日 TWA 占限值的比例 = Σ(C·t) / 8h / 限值（各区域按自己的限值折算后相加）
      var frac = 0, top = '';
      Object.keys(rec.zones).forEach(function (z) { var c = cfg[z]; if (!c || !(c.c > 0) || !(c.oel > 0)) return; var f = c.c * rec.zones[z].t / 3600 / 8 / c.oel; frac += f; if (!top || f > 0) top = z; });
      var pct = Math.round(frac * 100), lv = pct >= 100 ? 100 : pct >= 80 ? 80 : pct >= 50 ? 50 : 0;
      if (lv > (rec.sent || 0)) {
        rec.sent = lv; var msg = t('nt_dust_' + lv);
        raise({ key: 'dust:' + k + ':' + lv, wid: null, kind: 'dust_dose', zone: top, level: lv >= 80 ? 'warn' : 'warn', msg: tr('ev_dust_lv', { who: b.who, p: pct, zone: top }), auto: 20000 });
        if (k.charAt(0) !== 'P') L.notify(k, { level: lv >= 100 ? 'danger' : 'warn', title: '🌫 ' + pct + '%', body: msg, sticky: lv >= 100 });
        L.send({ type: 'event', kind: 'dust_dose', worker: k, who: b.who, pct: pct, level: 'info', msg: tr('ev_dust_lv', { who: b.who, p: pct, zone: top }) });
      }
    });
    jset(KEY_DE, all); dustBuf = {};
  }
  setInterval(flushDust, 10000);

  /* ---------- ⑩ 个人噪声暴露（韩国 90 dB / 8 h，5 dB 交换率，门槛 80 dB） ---------- */
  var KEY_NZ = 'shk3_noise_zones', KEY_NE = 'shk3_noise_expo', noiseBuf = {};
  function allowH(db) { return 8 / Math.pow(2, (db - 90) / 5); }
  function noiseAdd(key, who, zone, dt, src) {
    var c = jget(KEY_NZ, {})[zone]; if (!c || !(c.db >= 80) || !(dt > 0)) return;
    var b = noiseBuf[key] || (noiseBuf[key] = { who: who, src: src, dose: 0, t: 0, zones: {} });
    b.who = who; b.src = src; b.dose += dt / 3600 / allowH(c.db); b.t += dt; b.zones[zone] = (b.zones[zone] || 0) + dt;
  }
  function noiseCam(tk, s, now) {
    var dv = devOf(tk); if (dv && dv._pxZone) return;                      // 戴手表的人由手表区域累计
    var dt = s.nzAt ? Math.min(2, (now - s.nzAt) / 1000) : 0; s.nzAt = now;
    var w = (L.workerOf && L.workerOf(tk)) || null;
    noiseAdd(w ? w.id : wid(tk), w ? (w.name || w.id) : wid(tk), zoneOf(tk), dt, 'cam');
  }
  setInterval(function () {
    var keys = Object.keys(noiseBuf); if (!keys.length) return;
    var all = jget(KEY_NE, {}), d = dayKey(), day = all[d] || (all[d] = {});
    keys.forEach(function (k) {
      var b = noiseBuf[k], r = day[k] || (day[k] = { who: b.who, dose: 0, t: 0, zones: {}, sent: 0, src: b.src });
      r.who = b.who; r.src = b.src; r.dose += b.dose; r.t += b.t; Object.keys(b.zones).forEach(function (z) { r.zones[z] = (r.zones[z] || 0) + b.zones[z]; });
      var pct = Math.round(r.dose * 100), lv = pct >= 100 ? 100 : pct >= 80 ? 80 : pct >= 50 ? 50 : 0, top = Object.keys(r.zones)[0] || '';
      if (lv > (r.sent || 0)) {
        r.sent = lv;
        raise({ key: 'noise:' + k + ':' + lv, wid: null, kind: 'noise_dose', zone: top, level: 'warn', msg: tr('ev_noise_lv', { who: b.who, p: pct, zone: top }), auto: 20000 });
        if (k.charAt(0) !== 'P') L.notify(k, { level: lv >= 100 ? 'danger' : 'warn', title: '🔊 ' + pct + '%', body: t('nt_noise_' + lv), sticky: lv >= 100 });
      }
    });
    jset(KEY_NE, all); noiseBuf = {};
  }, 10000);
  $('pxNzOff').value = jget('shk3_nz_off', 100);
  $('pxNzOff').onchange = function () { jset('shk3_nz_off', +this.value || 0); };
  var nzAvg = null;
  setInterval(function () {        // 麦克风 → 本区域噪声（dBFS + 校准偏移，需用声级计校准一次）
    if (!$('pxNzMic').checked || !mic.on || mic.db == null) { $('pxNzVal').textContent = ''; return; }
    var v = mic.db + (+jget('shk3_nz_off', 100) || 0); nzAvg = nzAvg == null ? v : nzAvg * 0.9 + v * 0.1;
    $('pxNzVal').textContent = tr('nz_val', { v: nzAvg.toFixed(0) });
    var zone = rxZone(); if (!zone) return;
    if (!(Date.now() % 10000 < 1000)) return;
    var cfg = jget(KEY_NZ, {}); cfg[zone] = { db: +nzAvg.toFixed(1), src: 'mic', at: Date.now() }; jset(KEY_NZ, cfg);
    L.send({ type: 'noisecfg', cfg: cfg }); L.send({ type: 'env_noise', site: L.site(), zone: zone, db: +nzAvg.toFixed(1) });
  }, 1000);

  /* ---------- ⑪ 新员工 / 外包工人出事 → 同时通知师傅；⑫ 应急演练 ---------- */
  var buddyDone = {};
  function workerOfAlert(a) {
    if (a.worker) return a.worker;
    if (a.wid && a.wid.charAt(0) === 'P') { var tk = L.tracks().find(function (x) { return 'P' + x.id === a.wid; }); var w = tk && L.workerOf && L.workerOf(tk); return w ? w.id : null; }
    var d = L.devices().find(function (x) { return x.uid === a.wid; }); return d ? d.worker || null : null;
  }
  setInterval(function () {
    var ppl = jget('shk3_px_people', {});
    L.alerts().forEach(function (a) {
      if (buddyDone[a.aid] || (a.level !== 'warn' && a.level !== 'danger')) return;
      var w = workerOfAlert(a), p = w && ppl[w]; if (!p || !p.buddy) return;
      var isNew = p.start && (Date.now() - new Date(p.start).getTime()) < 30 * 864e5, flagged = isNew || p.type === 'contract' || p.type === 'temp';
      if (!flagged) return; buddyDone[a.aid] = 1;
      L.notify(p.buddy, { level: a.level, title: t('buddy_t'), body: tr('buddy_b', { n: rosterName(w) || w, m: a.msg }) });
    });
  }, 1500);
  L.tr.on(function (m) {
    if (m.type === 'people_sync' && m.people) jset('shk3_px_people', m.people);
    if (m.type === 'noisecfg' && m.cfg) jset(KEY_NZ, m.cfg);
    if (m.type === 'drill' && m.text) { raise({ key: 'drill:' + m.id, wid: null, kind: 'drill', level: 'warn', msg: t('drill_t') + ' ' + m.text, say: t('drill_t') + ' ' + m.text, auto: 90000 }); }
    if (m.type === 'drill_end' && m.id) L.clearAlert('drill:' + m.id, 'drill');
  });

  /* ---------- ⑧b 手表区域定位：连到本机的手表 = 人在本机区域 ---------- */
  var KEY_RX = 'shk3_rx_zone', devSeen = new WeakMap(), presence = {};
  function rxZone() { return (localStorage.getItem(KEY_RX) || '').trim(); }
  function rosterName(id) { try { var r = window.SHKStore && SHKStore.get('roster', id); return r ? (r.name || r.id) : null; } catch (e) { return null; } }
  $('pxRx').value = rxZone();
  $('pxRx').onchange = function () { try { localStorage.setItem(KEY_RX, this.value.trim()); } catch (e) {} };
  setInterval(function () {
    var zone = rxZone(), now = Date.now(), cfg = dustCfg(), here = [];
    $('pxRxL').innerHTML = Object.keys(cfg).map(function (z) { return '<option value="' + esc(z) + '">'; }).join('');
    L.devices().forEach(function (d) {
      var m = devSeen.get(d) || {}; if (d.view && d.view !== m.ref) { m.ref = d.view; m.at = now; } devSeen.set(d, m);
      var live = !!(m.at && now - m.at < 15000); d._pxZone = live && zone ? zone : null;
      if (!d._pxZone) return;
      var key = d.worker || d.uid, who = (d.worker && rosterName(d.worker)) || d.name || d.uid;
      presence[key] = { who: who, zone: zone, site: L.site(), at: now }; here.push(who);
      noiseAdd(key, who, zone, 1, 'watch');
      var zc = cfg[zone]; if (!zc || !(zc.c > 0)) return;
      var tk = L.tracks().find(function (t) { return (d.wearer === 'auto' ? d.wearerId : +d.wearer) === t.id; }), sx = tk ? st(tk) : null;
      var b = dustBuf[key] || (dustBuf[key] = { who: who, zones: {}, src: 'watch' }); b.src = 'watch'; b.who = who;
      var r = b.zones[zone] || (b.zones[zone] = { t: 0, tm: 0 }); r.t += 1; if (sx && sx.mask === true) r.tm += 1;
    });
    $('pxRxHere').textContent = zone ? (here.length ? t('rx_here', { n: here.join(', ') }) : t('rx_none')) : '';
  }, 1000);
  setInterval(function () {
    var list = Object.keys(presence).filter(function (k) { return Date.now() - presence[k].at < 30000; }).map(function (k) { return Object.assign({ key: k }, presence[k]); });
    if (list.length) L.send({ type: 'presence', site: L.site(), zone: rxZone(), list: list });
  }, 10000);

  /* ---------- ⑧c 粉尘传感器 SDS011（USB，Web Serial，9600 波特，10 字节帧 AA C0 … AB） ---------- */
  var pm = { pm25: null, pm10: null, avg: null, at: 0, simT: null };
  $('pxPmCal').value = jget('shk3_pm_cal', 1);
  $('pxPmCal').onchange = function () { jset('shk3_pm_cal', +this.value || 1); };
  function onPM(p25, p10) {
    pm.pm25 = p25; pm.pm10 = p10; pm.at = Date.now(); pm.avg = pm.avg == null ? p10 : pm.avg * 0.9 + p10 * 0.1;   // 约 1 分钟平滑
    var sim = $('pxPmSim').checked;
    $('pxPmVal').textContent = 'PM2.5 ' + p25.toFixed(1) + ' · PM10 ' + p10.toFixed(1) + ' μg/m³' + (sim ? ' (SIM)' : '') + ' → ' + (pm.avg * (+jget('shk3_pm_cal', 1) || 1) / 1000).toFixed(3) + ' mg/m³';
  }
  setInterval(function () {      // 每 10 秒：写入本区域浓度并同步
    var zone = rxZone(); if (!zone || pm.avg == null || Date.now() - pm.at > 20000) return;
    var mg = +(pm.avg * (+jget('shk3_pm_cal', 1) || 1) / 1000).toFixed(4);
    L.send({ type: 'env_dust', site: L.site(), zone: zone, pm25: pm.pm25, pm10: pm.pm10, mg: mg, sim: $('pxPmSim').checked });
    if (!$('pxPmUse').checked) return;
    var cfg = dustCfg(); cfg[zone] = Object.assign({ sub: 'other', oel: 10, apf: 10 }, cfg[zone] || {}, { c: mg, src: 'sensor', at: Date.now() });
    jset(KEY_DZ, cfg); L.send({ type: 'dustcfg', cfg: cfg });
  }, 10000);
  $('pxPm').onclick = async function () {
    if (!('serial' in navigator)) { L.log('warn', t('pm_nos')); $('pxPmVal').textContent = t('pm_nos'); return; }
    try {
      var port = await navigator.serial.requestPort(); await port.open({ baudRate: 9600 }); this.classList.add('pri');
      var buf = [];
      while (port.readable) {
        var rd = port.readable.getReader();
        try {
          for (;;) {
            var res = await rd.read(); if (res.done) break;
            for (var i = 0; i < res.value.length; i++) {
              buf.push(res.value[i]); if (buf.length > 10) buf.shift();
              if (buf.length === 10 && buf[0] === 0xAA && buf[1] === 0xC0 && buf[9] === 0xAB) {
                var sum = 0; for (var j = 2; j < 8; j++) sum += buf[j];
                if ((sum & 0xFF) === buf[8]) onPM(((buf[3] << 8) | buf[2]) / 10, ((buf[5] << 8) | buf[4]) / 10);
                buf = [];
              }
            }
          }
        } catch (e) { L.log('warn', 'SDS011: ' + e.message); } finally { rd.releaseLock(); }
      }
    } catch (e) { L.log('warn', 'SDS011: ' + (e.message || e)); }
  };
  $('pxPmSim').onchange = function () {
    clearInterval(pm.simT); pm.simT = null;
    if (this.checked) { var v = 450; pm.simT = setInterval(function () { v = Math.max(120, Math.min(980, v + (Math.random() - 0.48) * 60)); onPM(v * 0.45, v); }, 1000); }
  };

  /* ---------- ⑨ 紧急时推送最近的急救物品（手机 → 手表） ---------- */
  var KEY_AID = 'shk3_aidpts', aidDone = {};
  var AID_NAME = { aed: { zh: 'AED 自动体外除颤器', ko: 'AED 자동심장충격기', en: 'AED' }, kit: { zh: '急救箱', ko: '구급함', en: 'first-aid kit' }, eyewash: { zh: '洗眼器 / 紧急淋浴', ko: '세안기·긴급샤워', en: 'eyewash / shower' }, stretcher: { zh: '担架', ko: '들것', en: 'stretcher' }, ext: { zh: '灭火器', ko: '소화기', en: 'extinguisher' } };
  function aidName(k) { var o = AID_NAME[k] || AID_NAME.kit; return o[SHKI18N.lang] || o.zh; }
  function nearestAid(loc) {
    var pts = jget(KEY_AID, []); if (!pts.length) return null;
    var site = (loc && loc.site) || L.site(), x = loc && loc.x != null ? loc.x : 0.5, y = loc && loc.y != null ? loc.y : 0.5, out = {};
    pts.forEach(function (p) {
      var same = p.site === site, d = same ? Math.hypot(p.x - x, p.y - y) : 9 + Math.random() * 0.01;
      if (!out[p.type] || d < out[p.type].d) out[p.type] = { p: p, d: d };
    });
    return out;
  }
  function aidText(near) {
    var m = +(jget('shk3_aid_scale', 20)) || 20;   // 画面宽度约多少米（在平台“急救”页设置）
    return ['aed', 'kit', 'eyewash', 'stretcher'].filter(function (k) { return near[k]; }).map(function (k) {
      var n = near[k], zh = SHKI18N.lang === 'zh';
      return aidName(k) + (zh ? '：' : ': ') + n.p.name + (n.d < 5 ? (zh ? '（≈' : ' (≈') + Math.max(1, Math.round(n.d * m)) + (zh ? ' m）' : ' m)') : (zh ? '（' : ' (') + n.p.site + (zh ? '）' : ')'));
    }).join(SHKI18N.lang === 'zh' ? '；' : '; ');
  }
  setInterval(function () {
    L.alerts().forEach(function (a) {
      if (a.level !== 'danger' || aidDone[a.aid] || ['fall_noresp', 'confirm_noresp', 'sos', 'fused_fall', 'voice_sos', 'collapse', 'impact_danger', 'hand_in_machine'].indexOf(a.kind) < 0) return;
      aidDone[a.aid] = 1;
      var near = nearestAid(a.loc), where = (a.loc && (a.loc.zone || a.loc.pos)) || L.site();
      var trained = jget('shk3_fa_records', []).filter(function (r) { return r.pass; }).map(function (r) { return r.name; }).filter(function (v, i, arr) { return arr.indexOf(v) === i; }).slice(0, 4);
      var body = near ? tr('aid_body', { what: a.msg, where: where, list: aidText(near) }) : t('aid_none');
      if (trained.length) body += ' ' + tr('aid_trained', { n: trained.join(', ') });
      L.notify('*', { level: 'danger', title: t('aid_t'), body: body, emg: true, aid: true, loc: a.loc });
      L.log('info', t('aid_t') + ' · ' + body);
      L.send({ type: 'event', kind: 'aid_route', level: 'info', msg: body });
    });
  }, 1000);
  /* 平台改了急救点 / 粉尘区设置时，经同一通道同步过来 */
  L.tr.on(function (m) {
    if (m.type === 'aidpts' && Array.isArray(m.list)) { jset(KEY_AID, m.list); if (m.scale) jset('shk3_aid_scale', m.scale); }
    if (m.type === 'dustcfg' && m.cfg) jset(KEY_DZ, m.cfg);
    if (m.type === 'fa_sync' && Array.isArray(m.list)) jset('shk3_fa_records', m.list);
  });

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
      checkMask(tk, s, now, dets); dustTick(tk, s, now); noiseCam(tk, s, now);
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
      if (s.dustIn) cam += ' · 🌫' + (s.mask === true ? '😷✓' : s.mask === false ? '😷✗' : '');
      h += '<tr style="border-top:1px solid var(--bdr)"><td><b>P' + k + '</b></td><td>' + esc(cam) + '</td><td><b style="color:' + (s.rulaS == null ? 'inherit' : rulaColor(sc)) + '">' + sc + '</b>/7</td>' +
        '<td>' + t('px_band_' + b.k) + (b.hr ? ' · ' + b.hr : '') + '</td><td>' + (mic.on ? (fu.audio ? '❗' : '✓') : '—') + '</td>' +
        '<td style="color:' + vcol[fu.v || 'ok'] + ';font-weight:800">' + vtxt[fu.v || 'ok'] + '</td><td>' + s.stumbles + '</td></tr>';
    });
    box.innerHTML = h + '</table>';
  }, 500);

  window.SHKPlusField = { CFG: CFG, rula: rula, stats: function () { return fuStats; }, _t: { checkVehicle: checkVehicle, st: st, view: function () { return view; }, flushDust: flushDust, nearestAid: nearestAid, aidText: aidText } };
})();
