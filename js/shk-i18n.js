/* SHine-K 3.0 · 现场端 / 监控端 文字（中文 · 한국어 · English） */
(function () {
  'use strict';
  var S = {
    zh: {
      ez_off_t: '摄像头未开启', ez_off_r: '点击右边的按钮开始现场监测', ez_ok_t: '正常监测中', ez_people: '画面中 {n} 人 · 视频不离开这台电脑', ez_warn_t: '注意', ez_dng_t: '危险', ez_act_cam: '▶ 开启摄像头', ez_act_ack: '✓ 现场已确认', ez_act_sound: '🔊 打开声音', ez_admin: '⚙ 管理员界面', ez_easy: '◀ 简易界面', ch_cam: '摄像头', ch_ai: 'AI', ch_link: '监控', ch_local: '本机', ch_dev: '设备 {n}', ch_sound: '声音', ch_mute: '静音', ez_more: '还有 {n} 条',
      sp_title: '分屏演示 · 现场端 → 监控端', sp_a: '① 现场端 · 摄像头 + 可穿戴设备 + AI', sp_b: '② 监控端 · 只收骨架与数字', sp_new: '新窗口 ↗', sp_lr: '左右', sp_tb: '上下', sp_narrow: '现场窄', sp_half: '各一半', sp_wide: '现场宽', sp_swap: '⇄ 对调', sp_pose: '坐标·骨架', sp_vit: '生命体征', sp_alert: '警报·事件', sp_cmd: '监控指令', sp_video: '视频', sp_hint: '中间飞过的点 = 真实发送的数据包。分界线可拖动，也可以点一下分界线后用 ←/→ 键调整。',
      field_title: '现场端 · 真实摄像头 AI + 可穿戴设备', center_title: '监控端 · 只接收骨架与数字（不传视频）',
      back: '← 返回平台', open_center: '打开监控端 ↗', open_field: '打开现场端 ↗',
      start_t: '开始现场监测', start_d: '点击后会：打开摄像头、加载 AI 模型、允许声音与语音播报。视频只在这台电脑里分析，不会上传。',
      start_btn: '▶ 开始', cam: '摄像头', cam_start: '▶ 开启摄像头', cam_stop: '■ 停止', skel_only: '只显示骨架（隐藏画面）',
      mute: '静音', unmute: '取消静音', test_alarm: '测试警报', site: '现场名称',
      ai_pose: '关节点 AI', ai_ppe: '安全帽/背心 AI', loading: '加载中…', ready: '就绪', failed: '失败', off: '未开启',
      devices: '可穿戴设备 & 警示灯', add_watch: '＋ 小米 / 华为 / 苹果手表', add_hr: '＋ 蓝牙心率带', add_emo: '＋ EmoConnect 手表', add_beacon: '＋ USB 警示灯',
      ble_unsupported: '这个浏览器不支持蓝牙。请用电脑或安卓手机的 Chrome / Edge 打开（iPhone 不支持）。',
      wearer: '佩戴者', not_in_view: '不在画面中', hr: '心率', battery: '电量', motion: '手腕活动', no_signal: '无信号',
      workers: '画面中的工人', none_yet: '还没有识别到人。请站到摄像头前。',
      helmet: '安全帽', vest: '背心', yes: '已戴', no: '未戴', unknown: '无法确认',
      st_normal: '正常', st_suspect: '疑似跌倒', st_ask: '等待回应', st_danger: '无回应·危险', st_sos: 'SOS 求救',
      p_stand: '站立', p_nopose: '未识别关节（只检查安全帽/背心）', p_bend: '弯腰', p_down: '倒地/躺下', p_other: '其他',
      alerts: '当前警报', no_alerts: '没有警报', ack: '现场已确认', log: '事件记录',
      link: '连接监控端', room: '房间码', connect: '连接', disconnect: '断开', new_room: '生成房间码',
      link_local: '同一浏览器的监控端会自动收到数据。不同电脑：两边输入同一个房间码。',
      link_warn: '跨电脑使用公共演示服务器，只发送化名编号、关节坐标和数字；不要输入真实姓名。',
      sent: '已发送', video_up: '视频上传', st_on: '已连接', st_connecting: '连接中…', st_off: '未连接', st_error: '连接失败',
      // 播报 / 事件
      say_fall_ask: '{id}号，检测到跌倒。如果没事，请举起一只手。',
      say_fall_noresp: '危险！{id}号跌倒后没有回应，请立即到现场查看！',
      say_fall_ok: '{id}号已回应，解除警报。', say_sos: '紧急！{id}号发出求救信号！',
      say_helmet: '{id}号，请佩戴安全帽。', say_vest: '{id}号，请穿好反光背心。',
      say_posture: '{id}号，弯腰时间过长，请直起身休息一下。', say_inactive: '{id}号长时间躺着不动，请确认情况。',
      say_hr_high: '{id}心率过高，请停下休息。', say_hr_danger: '危险！{id}心率异常，请立即查看！',
      say_impact_ask: '{id}手表检测到撞击。如果没事，请晃动手腕。', say_impact_danger: '危险！{id}撞击后没有动作，请立即查看！',
      say_ask_center: '{id}号，监控室请求确认。如果没事，请举起一只手。',
      ev_fall_detected: '#{id} 检测到快速倒地', ev_fall_recovered: '#{id} 倒地后 {secs} 秒自行站起（不报警）',
      ev_fall_ask: '#{id} 疑似跌倒 · 语音询问中', ev_fall_ok: '#{id} 已举手/站起 · 解除', ev_fall_noresp: '#{id} 跌倒无回应',
      ev_fall_cleared: '#{id} 已站起', ev_confirm_ask: '#{id} 监控室请求举手确认', ev_confirm_noresp: '#{id} 未回应确认请求', ev_confirm_ok: '#{id} 已举手回应',
      say_confirm_noresp: '危险！{id}号没有回应确认请求，请立即到现场查看！', ev_sos: '#{id} 双手举高 · SOS 求救', ev_posture: '#{id} 弯腰 {secs} 秒',
      ev_inactive: '#{id} 躺着不动 {secs} 秒', ev_helmet: '#{id} 未戴安全帽', ev_vest: '#{id} 未穿背心',
      ev_hr_high: '{id} 心率持续 ≥120', ev_hr_danger: '{id} 心率异常', ev_impact_ask: '{id} 手腕撞击 · 询问中',
      ev_impact_ok: '{id} 手腕已活动 · 解除', ev_impact_danger: '{id} 撞击后无动作', ev_center_say: '监控室广播：{text}',
      ev_center_ack: '监控室已确认：{msg}', ev_dev_on: '{name} 已连接', ev_dev_off: '{name} 连接断开', ev_cam_err: '摄像头打不开：{msg}',
      // 监控端
      sites: '现场', workers_c: '工人', online: '在线', offline: '离线（{s} 秒无心跳）', last_seen: '最后数据',
      req_confirm: '请求举手确认', broadcast: '向现场广播', bc_ph: '输入要播报的话…', send: '发送',
      center_ack: '确认', no_data: '还没有收到现场数据。请在现场端开启摄像头；不同电脑请两边输入同一个房间码。',
      packets: '收到数据包', status: '状态', alert_feed: '警报', bytes_video: '视频 0 B'
    },
    ko: {
      ez_off_t: '카메라 꺼짐', ez_off_r: '오른쪽 버튼을 눌러 현장 모니터링을 시작하세요', ez_ok_t: '정상 감시 중', ez_people: '화면 속 {n}명 · 영상은 이 컴퓨터 밖으로 나가지 않음', ez_warn_t: '주의', ez_dng_t: '위험', ez_act_cam: '▶ 카메라 켜기', ez_act_ack: '✓ 현장 확인', ez_act_sound: '🔊 소리 켜기', ez_admin: '⚙ 관리자 화면', ez_easy: '◀ 쉬운 화면', ch_cam: '카메라', ch_ai: 'AI', ch_link: '관제', ch_local: '이 PC', ch_dev: '장치 {n}', ch_sound: '소리', ch_mute: '음소거', ez_more: '외 {n}건',
      sp_title: '분할 화면 · 현장 → 관제', sp_a: '① 현장 · 카메라 + 웨어러블 + AI', sp_b: '② 관제 · 골격과 숫자만 수신', sp_new: '새 창 ↗', sp_lr: '좌우', sp_tb: '상하', sp_narrow: '현장 좁게', sp_half: '반반', sp_wide: '현장 넓게', sp_swap: '⇄ 바꾸기', sp_pose: '좌표·골격', sp_vit: '생체신호', sp_alert: '경보·이벤트', sp_cmd: '관제 지시', sp_video: '영상', sp_hint: '가운데를 지나가는 점 = 실제로 보내는 데이터 패킷. 경계선은 끌거나, 한 번 누른 뒤 ←/→ 키로 조절합니다.',
      field_title: '현장 · 실제 카메라 AI + 웨어러블', center_title: '관제 · 골격과 숫자만 수신 (영상 없음)',
      back: '← 플랫폼으로', open_center: '관제 화면 열기 ↗', open_field: '현장 화면 열기 ↗',
      start_t: '현장 모니터링 시작', start_d: '누르면 카메라를 켜고 AI 모델을 불러오며 소리·음성 안내를 켭니다. 영상은 이 컴퓨터에서만 분석하고 올리지 않습니다.',
      start_btn: '▶ 시작', cam: '카메라', cam_start: '▶ 카메라 켜기', cam_stop: '■ 정지', skel_only: '골격만 보기 (화면 숨김)',
      mute: '음소거', unmute: '소리 켜기', test_alarm: '경보 시험', site: '현장 이름',
      ai_pose: '관절 AI', ai_ppe: '안전모/조끼 AI', loading: '불러오는 중…', ready: '준비됨', failed: '실패', off: '꺼짐',
      devices: '웨어러블 & 경광등', add_watch: '＋ 샤오미 / 화웨이 / 애플 워치', add_hr: '＋ 블루투스 심박 밴드', add_emo: '＋ EmoConnect 워치', add_beacon: '＋ USB 경광등',
      ble_unsupported: '이 브라우저는 블루투스를 지원하지 않습니다. 컴퓨터·안드로이드의 Chrome / Edge로 여세요 (iPhone 불가).',
      wearer: '착용자', not_in_view: '화면 밖', hr: '심박', battery: '배터리', motion: '손목 움직임', no_signal: '신호 없음',
      workers: '화면 속 작업자', none_yet: '아직 사람을 찾지 못했습니다. 카메라 앞에 서 주세요.',
      helmet: '안전모', vest: '조끼', yes: '착용', no: '미착용', unknown: '확인 불가',
      st_normal: '정상', st_suspect: '넘어짐 의심', st_ask: '응답 대기', st_danger: '무응답·위험', st_sos: 'SOS 구조 요청',
      p_stand: '서 있음', p_nopose: '관절 미인식 (안전모·조끼만 검사)', p_bend: '허리 숙임', p_down: '쓰러짐/누움', p_other: '기타',
      alerts: '현재 경보', no_alerts: '경보 없음', ack: '현장 확인', log: '기록',
      link: '관제 연결', room: '방 코드', connect: '연결', disconnect: '끊기', new_room: '코드 만들기',
      link_local: '같은 브라우저의 관제 화면은 자동으로 받습니다. 다른 컴퓨터는 양쪽에 같은 방 코드를 넣으세요.',
      link_warn: '다른 컴퓨터 연결은 공개 시연 서버를 씁니다. 가명 번호·관절 좌표·숫자만 보내며 실명은 넣지 마세요.',
      sent: '보냄', video_up: '영상 전송', st_on: '연결됨', st_connecting: '연결 중…', st_off: '연결 안 됨', st_error: '연결 실패',
      say_fall_ask: '{id}번, 넘어짐이 감지되었습니다. 괜찮으면 한 손을 드세요.',
      say_fall_noresp: '위험! {id}번이 넘어진 뒤 응답이 없습니다. 즉시 현장을 확인하세요!',
      say_fall_ok: '{id}번 응답 확인, 경보를 해제합니다.', say_sos: '긴급! {id}번 구조 요청!',
      say_helmet: '{id}번, 안전모를 착용하세요.', say_vest: '{id}번, 안전 조끼를 입으세요.',
      say_posture: '{id}번, 허리를 너무 오래 숙였습니다. 잠시 펴고 쉬세요.', say_inactive: '{id}번이 오래 누워 움직이지 않습니다. 확인하세요.',
      say_hr_high: '{id} 심박이 높습니다. 잠시 쉬세요.', say_hr_danger: '위험! {id} 심박 이상, 즉시 확인하세요!',
      say_impact_ask: '{id} 워치에서 충격이 감지되었습니다. 괜찮으면 손목을 흔드세요.', say_impact_danger: '위험! {id} 충격 뒤 움직임이 없습니다!',
      say_ask_center: '{id}번, 관제실 확인 요청입니다. 괜찮으면 한 손을 드세요.',
      ev_fall_detected: '#{id} 빠르게 쓰러짐 감지', ev_fall_recovered: '#{id} {secs}초 만에 일어남 (경보 안 함)',
      ev_fall_ask: '#{id} 넘어짐 의심 · 음성 확인 중', ev_fall_ok: '#{id} 손 들기/일어남 · 해제', ev_fall_noresp: '#{id} 넘어짐 무응답',
      ev_fall_cleared: '#{id} 일어남', ev_confirm_ask: '#{id} 관제 손 들기 확인 요청', ev_confirm_noresp: '#{id} 확인 요청 무응답', ev_confirm_ok: '#{id} 손 들기 응답',
      say_confirm_noresp: '위험! {id}번이 확인 요청에 응답하지 않습니다. 즉시 현장을 확인하세요!', ev_sos: '#{id} 두 손 들기 · SOS', ev_posture: '#{id} 허리 숙임 {secs}초',
      ev_inactive: '#{id} 누운 채 무동작 {secs}초', ev_helmet: '#{id} 안전모 미착용', ev_vest: '#{id} 조끼 미착용',
      ev_hr_high: '{id} 심박 ≥120 지속', ev_hr_danger: '{id} 심박 이상', ev_impact_ask: '{id} 손목 충격 · 확인 중',
      ev_impact_ok: '{id} 손목 움직임 확인 · 해제', ev_impact_danger: '{id} 충격 후 무동작', ev_center_say: '관제 방송: {text}',
      ev_center_ack: '관제 확인: {msg}', ev_dev_on: '{name} 연결됨', ev_dev_off: '{name} 연결 끊김', ev_cam_err: '카메라 오류: {msg}',
      sites: '현장', workers_c: '작업자', online: '온라인', offline: '오프라인 ({s}초 신호 없음)', last_seen: '마지막 수신',
      req_confirm: '손 들기 확인 요청', broadcast: '현장 방송', bc_ph: '방송할 말을 입력…', send: '보내기',
      center_ack: '확인', no_data: '아직 현장 데이터가 없습니다. 현장 화면에서 카메라를 켜고, 다른 컴퓨터는 같은 방 코드를 넣으세요.',
      packets: '받은 패킷', status: '상태', alert_feed: '경보', bytes_video: '영상 0 B'
    },
    en: {
      ez_off_t: 'Camera off', ez_off_r: 'Press the button on the right to start monitoring', ez_ok_t: 'Monitoring normally', ez_people: '{n} in view · video never leaves this computer', ez_warn_t: 'Caution', ez_dng_t: 'Danger', ez_act_cam: '▶ Start camera', ez_act_ack: '✓ Handled on site', ez_act_sound: '🔊 Turn sound on', ez_admin: '⚙ Admin view', ez_easy: '◀ Simple view', ch_cam: 'Camera', ch_ai: 'AI', ch_link: 'Center', ch_local: 'local', ch_dev: 'Devices {n}', ch_sound: 'Sound', ch_mute: 'muted', ez_more: '+{n} more',
      sp_title: 'Split view · field → center', sp_a: '① Field · camera + wearables + AI', sp_b: '② Center · skeletons and numbers only', sp_new: 'New window ↗', sp_lr: 'Side by side', sp_tb: 'Stacked', sp_narrow: 'Field narrow', sp_half: 'Half', sp_wide: 'Field wide', sp_swap: '⇄ Swap', sp_pose: 'Pose', sp_vit: 'Vitals', sp_alert: 'Alerts', sp_cmd: 'Center cmds', sp_video: 'Video', sp_hint: 'Dots crossing the divider = real data packets. Drag the divider, or click it and use ←/→.',
      field_title: 'Field · real camera AI + wearables', center_title: 'Center · skeletons and numbers only (no video)',
      back: '← Back to platform', open_center: 'Open center ↗', open_field: 'Open field ↗',
      start_t: 'Start field monitoring', start_d: 'Turns on the camera, loads the AI models and enables sound and voice. Video is analysed on this computer only and never uploaded.',
      start_btn: '▶ Start', cam: 'Camera', cam_start: '▶ Start camera', cam_stop: '■ Stop', skel_only: 'Skeleton only (hide video)',
      mute: 'Mute', unmute: 'Unmute', test_alarm: 'Test alarm', site: 'Site name',
      ai_pose: 'Pose AI', ai_ppe: 'Helmet/vest AI', loading: 'loading…', ready: 'ready', failed: 'failed', off: 'off',
      devices: 'Wearables & beacon', add_watch: '＋ Xiaomi / Huawei / Apple watch', add_hr: '＋ Bluetooth HR strap', add_emo: '＋ EmoConnect watch', add_beacon: '＋ USB beacon',
      ble_unsupported: 'This browser has no Bluetooth. Use Chrome / Edge on a computer or Android (not iPhone).',
      wearer: 'Wearer', not_in_view: 'not in view', hr: 'HR', battery: 'Battery', motion: 'Wrist motion', no_signal: 'no signal',
      workers: 'Workers in view', none_yet: 'Nobody detected yet. Please stand in front of the camera.',
      helmet: 'Helmet', vest: 'Vest', yes: 'on', no: 'missing', unknown: 'unsure',
      st_normal: 'normal', st_suspect: 'possible fall', st_ask: 'waiting reply', st_danger: 'no reply · danger', st_sos: 'SOS',
      p_stand: 'standing', p_nopose: 'no skeleton (helmet/vest only)', p_bend: 'bending', p_down: 'down / lying', p_other: 'other',
      alerts: 'Active alerts', no_alerts: 'No alerts', ack: 'Handled on site', log: 'Event log',
      link: 'Link to center', room: 'Room code', connect: 'Connect', disconnect: 'Disconnect', new_room: 'New code',
      link_local: 'A center page in the same browser receives data automatically. Other computers: enter the same room code on both.',
      link_warn: 'Cross-computer mode uses a public demo broker. Only pseudonymous IDs, joint coordinates and numbers are sent — no real names.',
      sent: 'sent', video_up: 'video upload', st_on: 'connected', st_connecting: 'connecting…', st_off: 'not connected', st_error: 'failed',
      say_fall_ask: 'Worker {id}, a fall was detected. If you are OK, raise one hand.',
      say_fall_noresp: 'Danger! Worker {id} fell and is not responding. Check immediately!',
      say_fall_ok: 'Worker {id} responded. Alert cleared.', say_sos: 'Emergency! Worker {id} is calling for help!',
      say_helmet: 'Worker {id}, please wear your helmet.', say_vest: 'Worker {id}, please wear your safety vest.',
      say_posture: 'Worker {id}, you have been bending too long. Please straighten up and rest.', say_inactive: 'Worker {id} has been lying still. Please check.',
      say_hr_high: '{id} heart rate is high. Please rest.', say_hr_danger: 'Danger! {id} abnormal heart rate. Check now!',
      say_impact_ask: '{id} watch detected an impact. If you are OK, shake your wrist.', say_impact_danger: 'Danger! {id} no movement after impact!',
      say_ask_center: 'Worker {id}, the control room asks you to confirm. If you are OK, raise one hand.',
      ev_fall_detected: '#{id} fast fall detected', ev_fall_recovered: '#{id} got up after {secs}s (no alarm)',
      ev_fall_ask: '#{id} possible fall · asking', ev_fall_ok: '#{id} hand raised / stood up · cleared', ev_fall_noresp: '#{id} fall, no response',
      ev_fall_cleared: '#{id} stood up', ev_confirm_ask: '#{id} center asked to raise hand', ev_confirm_noresp: '#{id} no reply to confirm request', ev_confirm_ok: '#{id} raised hand',
      say_confirm_noresp: 'Danger! Worker {id} did not answer the confirm request. Check immediately!', ev_sos: '#{id} both hands up · SOS', ev_posture: '#{id} bending {secs}s',
      ev_inactive: '#{id} lying still {secs}s', ev_helmet: '#{id} no helmet', ev_vest: '#{id} no vest',
      ev_hr_high: '{id} HR ≥120 sustained', ev_hr_danger: '{id} abnormal HR', ev_impact_ask: '{id} wrist impact · asking',
      ev_impact_ok: '{id} wrist moved · cleared', ev_impact_danger: '{id} no movement after impact', ev_center_say: 'Center broadcast: {text}',
      ev_center_ack: 'Center acknowledged: {msg}', ev_dev_on: '{name} connected', ev_dev_off: '{name} disconnected', ev_cam_err: 'Camera error: {msg}',
      sites: 'Sites', workers_c: 'Workers', online: 'online', offline: 'offline ({s}s no heartbeat)', last_seen: 'last data',
      req_confirm: 'Ask to raise hand', broadcast: 'Broadcast to site', bc_ph: 'Type a message…', send: 'Send',
      center_ack: 'Acknowledge', no_data: 'No field data yet. Start the camera on the field page; on another computer enter the same room code.',
      packets: 'packets', status: 'Status', alert_feed: 'Alerts', bytes_video: 'video 0 B'
    }
  };
  var lang = 'zh';
  try { lang = localStorage.getItem('shk3_lang') || (navigator.language || 'zh').slice(0, 2); } catch (e) {}
  if (!S[lang]) lang = 'zh';

  function t(k, vars) {
    var s = (S[lang] && S[lang][k]) || S.zh[k] || k;
    if (vars) s = s.replace(/\{(\w+)\}/g, function (_, v) { return vars[v] != null ? vars[v] : ''; });
    return s;
  }
  function apply(root) {
    (root || document).querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
    (root || document).querySelectorAll('[data-i18n-ph]').forEach(function (el) { el.placeholder = t(el.getAttribute('data-i18n-ph')); });
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang;
  }
  window.SHKI18N = {
    t: t, apply: apply, get lang() { return lang; },
    /* 其他模块追加文字：SHKI18N.add({ zh: {...}, ko: {...}, en: {...} }) */
    add: function (d) { Object.keys(d).forEach(function (l) { S[l] = S[l] || {}; Object.keys(d[l]).forEach(function (k) { S[l][k] = d[l][k]; }); }); },
    set: function (l) { if (!S[l]) return; lang = l; try { localStorage.setItem('shk3_lang', l); } catch (e) {} apply(); }
  };
})();
