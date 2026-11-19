/* SHine-K 3.0 · 合规与大模型模块（平台端，依赖 js/shk-plus.js）
 *  ① AI 风险评估表（위험성평가）：把现场检测到的险兆 / 违规 / 姿势负荷 / 体感温度 / 工人上报 → 自动起草官方格式的风险评估表
 *     （可能性 × 严重度 → 상/중/하），大模型补充描述和减灾措施，工人确认参与，保存、打印、导出。
 *  ② 母语 AI 安全员：外国工人用母语（语音或文字）提问 / 上报隐患，大模型用母语回答并给管理者翻译；管理者指示一键多语广播。
 *  ③ 义务履行证据包：按《重大灾害处罚法》施行令第 4 条整理平时的安全措施记录，事故时间线，一键打印 / 导出。
 * 没有设置大模型时全部有离线规则兜底。数据都在本机浏览器（localStorage）。
 */
(function () {
  'use strict';
  if (!window.SHKPlus) return;
  var P = window.SHKPlus, H = P.h, esc = H.esc, jget = H.jget, jset = H.jset, lang = H.lang;
  var $ = function (id) { return document.getElementById(id); };
  function T(o) { return o[lang()] || o.zh; }
  var DAY = H.DAY;

  /* =================== 灾害类型（韩国 KOSHA 分类） =================== */
  var TY = {
    caught: { sev: 3, n: { zh: '卷入 / 夹伤（끼임）', ko: '끼임', en: 'Caught-in / between' },
      m: { zh: ['加装联锁防护罩与光幕，手进入即停机', '清理卡料前断电挂牌上锁（LOTO）', '使用推料棒等专用工具，禁止徒手'], ko: ['방호덮개·광전자식 방호장치(인터록) 설치', '이물 제거 전 전원 차단·잠금·표지(LOTO)', '수공구(밀대 등) 사용, 맨손 작업 금지'], en: ['Interlocked guards / light curtain that stop the machine', 'Lock-out / tag-out before clearing jams', 'Use push sticks or tools, never bare hands'] } },
    struck: { sev: 3, n: { zh: '车辆 / 机械碰撞（부딪힘）', ko: '부딪힘(차량·기계)', en: 'Struck by vehicle / machinery' },
      m: { zh: ['划分人车分离通道并设隔离栏', '叉车加装接近报警 / 蓝光灯，限速', '交叉口设镜子与指挥人员'], ko: ['보행자·차량 통로 분리 및 방호울 설치', '지게차 접근경보·블루라이트 설치, 제한속도', '교차로 반사경·신호수 배치'], en: ['Separate pedestrian and vehicle routes with barriers', 'Proximity alarm / blue spot light and speed limit on forklifts', 'Mirrors and a banksman at crossings'] } },
    fall_low: { sev: 2, n: { zh: '滑倒 / 绊倒（넘어짐）', ko: '넘어짐(미끄러짐·걸림)', en: 'Slip / trip' },
      m: { zh: ['清除地面油污积水，铺防滑垫', '整理线缆和物料，保持通道畅通', '改善照明，台阶边缘贴警示'], ko: ['바닥 기름·물 제거, 미끄럼 방지 매트', '전선·자재 정리로 통로 확보', '조명 개선, 단차 표시'], en: ['Remove oil / water, add anti-slip mats', 'Tidy cables and materials, keep walkways clear', 'Improve lighting, mark steps'] } },
    fall_high: { sev: 3, n: { zh: '坠落 / 倒地（떨어짐·쓰러짐）', ko: '떨어짐·쓰러짐', en: 'Fall / collapse' },
      m: { zh: ['高处作业设护栏、安全带挂点', '跌倒后多源确认自动呼救', '对反复踉跄者做平衡评估并调岗'], ko: ['고소작업 안전난간·안전대 부착설비', '넘어짐 다중 확인 후 자동 구조 요청', '반복 휘청 근로자 균형 평가·배치 조정'], en: ['Guardrails and anchor points for work at height', 'Automatic call for help after multi-sensor confirmation', 'Balance check and reassignment for repeat stumblers'] } },
    msd: { sev: 2, n: { zh: '肌肉骨骼负荷（근골격계）', ko: '근골격계 부담작업', en: 'Musculoskeletal load' },
      m: { zh: ['调整工作台高度，减少弯腰和举臂', '使用升降台 / 助力装置搬运', '岗位轮换与短时休息'], ko: ['작업대 높이 조정으로 숙임·팔 들기 감소', '리프트·보조기구 사용', '작업 순환과 짧은 휴식'], en: ['Adjust bench height to cut bending / arm raising', 'Lift tables or assist devices for handling', 'Job rotation and micro-breaks'] } },
    heat: { sev: 2, n: { zh: '中暑 / 热病（온열질환）', ko: '온열질환', en: 'Heat illness' },
      m: { zh: ['体感温度 ≥33℃ 每 2 小时休息 20 分钟以上', '提供冷水、阴凉休息处、冷却背心', '55 岁以上工人优先休息，避开 14–17 时'], ko: ['체감온도 33℃ 이상 2시간마다 20분 이상 휴식', '시원한 물·그늘 휴식공간·냉각조끼 제공', '55세 이상 우선 휴식, 14–17시 회피'], en: ['≥33 °C feels-like: ≥20 min break every 2 h', 'Cool water, shaded rest area, cooling vests', 'Rest older workers first, avoid 14–17 h'] } },
    ppe: { sev: 2, n: { zh: '未戴防护用品（보호구）', ko: '보호구 미착용', en: 'PPE not worn' },
      m: { zh: ['危险区入口设 AI 门禁：未戴不放行', '在作业点旁配备备用安全帽 / 背心', '班前会母语讲解佩戴要求'], ko: ['위험구역 입구 AI 출입통제(미착용 시 통제)', '작업장 근처 예비 안전모·조끼 비치', '작업 전 회의에서 모국어로 착용 교육'], en: ['AI gate at danger zones: no PPE, no entry', 'Spare helmets / vests at the workstation', 'Explain PPE rules in workers\' languages at toolbox talks'] } },
    fire: { sev: 3, n: { zh: '火灾 / 爆炸（화재·폭발）', ko: '화재·폭발', en: 'Fire / explosion' },
      m: { zh: ['动火作业票与气体检测', '清除可燃物，配置灭火器', '通风与防爆电气'], ko: ['화기작업 허가·가스 측정', '가연물 제거, 소화기 비치', '환기·방폭 전기설비'], en: ['Hot-work permit and gas test', 'Remove combustibles, provide extinguishers', 'Ventilation and explosion-proof equipment'] } },
    elec: { sev: 3, n: { zh: '触电（감전）', ko: '감전', en: 'Electric shock' },
      m: { zh: ['漏电保护器与接地', '停电作业挂牌上锁', '破损电线立即更换'], ko: ['누전차단기·접지', '정전작업 잠금·표지', '손상 전선 즉시 교체'], en: ['RCDs and earthing', 'Lock-out for electrical work', 'Replace damaged cables at once'] } },
    dust: { sev: 2, n: { zh: '粉尘吸入（분진）', ko: '분진 흡입', en: 'Dust inhalation' },
      m: { zh: ['局部排风 / 湿式作业，从源头降低粉尘', '粉尘区强制佩戴防尘口罩（AI 识别）', '按个人暴露比例轮岗，超过 80 % 调离'], ko: ['국소배기·습식 작업으로 발생원 감소', '분진 구역 방진마스크 착용(AI 인식)', '개인 노출 비율에 따라 작업 순환, 80% 초과 시 전환'], en: ['Local exhaust / wet methods at the source', 'Dust masks mandatory in dust zones (AI check)', 'Rotate by personal exposure; move people over 80 %'] } },
    other: { sev: 2, n: { zh: '其他（工人上报）', ko: '기타(근로자 신고)', en: 'Other (worker report)' },
      m: { zh: ['班组长当日现场确认', '确定临时措施并告知工人', '纳入下次定期风险评估'], ko: ['반장 당일 현장 확인', '임시 조치 후 근로자에게 공유', '다음 정기 위험성평가에 반영'], en: ['Team leader checks on site today', 'Temporary measure and tell workers', 'Include in the next regular assessment'] } }
  };
  var KIND2TY = { hand_in_machine: 'caught', vehicle_danger: 'struck', vehicle_near: 'struck', near_fall: 'fall_low', fused_fall: 'fall_high', fall_noresp: 'fall_high', confirm_noresp: 'fall_high',
    helmet: 'ppe', vest: 'ppe', dust_mask: 'dust', dust_dose: 'dust', voice_sos: 'fall_high', sos: 'fall_high', collapse: 'heat', stop_work: 'heat', fire: 'fire' };
  function tyName(k) { return T((TY[k] || TY.other).n); }
  function riskTxt(r) { return r >= 6 ? T({ zh: '高', ko: '상', en: 'High' }) : r >= 3 ? T({ zh: '中', ko: '중', en: 'Medium' }) : T({ zh: '低', ko: '하', en: 'Low' }); }
  function riskCol(r) { return r >= 6 ? 'var(--r)' : r >= 3 ? 'var(--w)' : 'var(--g)'; }

  /* =================== 数据收集 =================== */
  function storeAll(coll) { var db = jget('shk3_store', {}), c = db[coll] || {}; return Object.keys(c).map(function (k) { return c[k]; }).filter(function (x) { return x && !x._del; }); }
  function alertsAll() {
    var a = jget('shk3_px_alog', []).filter(function (x) { return x.t === 'alert'; }).map(function (x) { return { ts: x.ts, kind: x.kind, level: x.level, msg: x.msg, zone: x.zone || x.site, aid: x.aid }; });
    jget('shk3_alert_hist', []).forEach(function (x) { a.push({ ts: x.at || x.ts, kind: x.kind, level: x.level, msg: x.msg, zone: (x.loc && x.loc.zone) || x.site, aid: x.aid, ack: x.ack || x.clearedBy }); });
    var seen = {}; return a.filter(function (x) { var k = x.aid || (x.ts + x.msg); if (seen[k]) return false; seen[k] = 1; return true; });
  }
  function gather(days) {
    var since = Date.now() - days * DAY, src = { nf: jget('shk3_nearfall', []), ev: jget('shk3_px_events', []), al: alertsAll(), ergo: jget('shk3_ergo', {}), rep: storeAll('reports'), vrep: jget('shk3_px_vreports', []) };
    var real = src.nf.length + src.ev.length + src.al.length + Object.keys(src.ergo).length + src.rep.length + src.vrep.length > 0;
    if (!real) src = demoSrc();
    var f = function (arr, key) { return arr.filter(function (x) { return (x[key || 'ts'] || 0) >= since; }); };
    return { real: real, nf: f(src.nf), ev: f(src.ev), al: f(src.al), ergo: src.ergo, rep: f(src.rep, 'at'), vrep: f(src.vrep) };
  }
  function demoSrc() {
    var now = Date.now(), h = 3600e3;
    return { nf: H.demoNearfall(),
      ev: [{ ts: now - 5 * h, kind: 'hand_in_machine', level: 'danger', zone: '冲压 1号线 / Press 1' }, { ts: now - 30 * h, kind: 'hand_in_machine', level: 'danger', zone: '冲压 1号线 / Press 1' },
        { ts: now - 8 * h, kind: 'vehicle_near', level: 'warn', zone: '搬运区 / Material handling' }, { ts: now - 9 * h, kind: 'vehicle_near', level: 'warn', zone: '搬运区 / Material handling' }, { ts: now - 50 * h, kind: 'vehicle_danger', level: 'danger', zone: '搬运区 / Material handling' }],
      al: [{ ts: now - 2 * h, kind: 'helmet', level: 'warn', msg: 'No helmet', zone: '焊接区 / Welding' }, { ts: now - 26 * h, kind: 'helmet', level: 'warn', msg: 'No helmet', zone: '焊接区 / Welding' }, { ts: now - 27 * h, kind: 'vest', level: 'warn', msg: 'No vest', zone: '焊接区 / Welding' },
        { ts: now - 70 * h, kind: 'fall_noresp', level: 'danger', msg: 'Fall, no response', zone: 'SITE-A · B3', aid: 'DEMO1' }],
      ergo: { '冲压 1号线 / Press 1': { n: 120, sum: 612, hi: 82 }, '搬运区 / Material handling': { n: 96, sum: 528, hi: 70 }, '装配线 A / Assembly A': { n: 140, sum: 406, hi: 9 } },
      rep: [{ at: now - 20 * h, type: 'hazard', sev: 'mid', where: '仓库通道', text: '货架第三层有箱子快掉下来了', status: 'new' }],
      vrep: [{ ts: now - 6 * h, lang: 'vi-VN', orig: 'Dầu bị rò rỉ dưới máy ép số 2, sàn rất trơn.', type: 'fall_low', severity: 2, zone: '冲压 2号线', ko: '2번 프레스 아래 기름이 새서 바닥이 매우 미끄럽습니다.', zh: '2号冲压机下面漏油，地面很滑。', en: 'Oil is leaking under press no. 2; the floor is very slippery.', worker: 'Nguyen Van An' }] };
  }

  /* =================== ① AI 风险评估表 =================== */
  var RA = {
    zh: { t: 'AI 风险评估表（위험성평가）', s: '把现场每一次险兆、违规、姿势负荷、体感温度和工人上报，自动起草成韩国官方格式的风险评估表：危险因素 → 可能性 × 严重度 → 减灾措施 → 工人确认 → 记录保存',
      per: '数据期间', d7: '最近 7 天', d30: '最近 30 天', gen: '🔄 重新生成', ai: '🤖 AI 补充描述与措施', aiing: '大模型生成中…', save: '✓ 确认并保存记录', print: '🖨 打印 / PDF', csv: '⬇ CSV',
      c_no: 'No', c_zone: '工序 / 区域', c_haz: '危险因素（检测依据）', c_l: '可能性', c_s: '严重度', c_r: '风险', c_m: '减灾措施', c_who: '负责 / 期限', c_ok: '工人确认',
      conf: '确认', conf_p: '请输入确认工人姓名（工人参与）', det: '检测 {n} 次', saved: '已保存 · {d}', recs: '已保存的评估记录', none: '暂无', nohaz: '这段时间没有检测到需要评估的危险因素',
      k1: '危险因素', k2: '高风险', k3: '工人确认', k4: '已保存记录', due: '班组长 / 7 天内', due_h: '安全负责人 / 立即',
      how: '可能性按检测次数（≥5 次 = 3，≥2 次 = 2，否则 1）；姿势负荷按 RULA 平均分；体感温度按 31 / 33 ℃。严重度按灾害类型（卷入、碰撞、坠落 = 3）。风险 = 可能性 × 严重度：≥6 高，3–4 中，≤2 低。大模型只改写描述和措施，不改动检测次数。',
      ev: '风险评估依据《产业安全保健法》第 36 条，记录按施行规则第 37 条保存 3 年；识别危险因素时须把险兆事故（아차사고）和已发生的事故加进去；通过风险评估可以履行《重大灾害处罚法》施行令第 4 条第 3 号的危险因素确认与改善义务。' },
    ko: { t: 'AI 위험성평가표', s: '현장에서 감지된 아차사고·위반·자세 부담·체감온도·근로자 신고를 고용노동부 서식의 위험성평가표로 자동 작성: 유해·위험요인 → 가능성 × 중대성 → 감소대책 → 근로자 확인 → 기록 보존',
      per: '기간', d7: '최근 7일', d30: '최근 30일', gen: '🔄 다시 작성', ai: '🤖 AI로 서술·대책 보완', aiing: 'AI 작성 중…', save: '✓ 확정·기록 저장', print: '🖨 인쇄 / PDF', csv: '⬇ CSV',
      c_no: 'No', c_zone: '공정 / 구역', c_haz: '유해·위험요인(감지 근거)', c_l: '가능성', c_s: '중대성', c_r: '위험성', c_m: '감소대책', c_who: '담당 / 기한', c_ok: '근로자 확인',
      conf: '확인', conf_p: '확인한 근로자 이름을 입력하세요(근로자 참여)', det: '감지 {n}회', saved: '저장됨 · {d}', recs: '저장된 평가 기록', none: '없음', nohaz: '이 기간에 평가할 유해·위험요인이 감지되지 않았습니다',
      k1: '유해·위험요인', k2: '위험성 상', k3: '근로자 확인', k4: '저장 기록', due: '반장 / 7일 이내', due_h: '안전책임자 / 즉시',
      how: '가능성: 감지 횟수(5회 이상=3, 2회 이상=2, 그 외 1), 자세 부담은 RULA 평균, 체감온도는 31/33℃ 기준. 중대성: 재해유형별(끼임·부딪힘·떨어짐=3). 위험성 = 가능성 × 중대성: 6 이상 상, 3–4 중, 2 이하 하. AI는 서술과 대책만 다듬고 감지 횟수는 바꾸지 않습니다.',
      ev: '위험성평가는 산업안전보건법 제36조, 결과 기록은 시행규칙 제37조에 따라 3년 보존. 유해위험요인 파악 단계에서 아차사고와 이미 발생한 산업재해 관련 요인을 반드시 추가해야 하며, 위험성평가로 중대재해처벌법 시행령 제4조 제3호의 유해위험요인 확인·개선 의무를 이행할 수 있습니다.' },
    en: { t: 'AI risk assessment (Korean 위험성평가)', s: 'Every near-miss, violation, posture load, feels-like temperature and worker report becomes a draft risk assessment in the Korean government format: hazard → likelihood × severity → controls → worker sign-off → record',
      per: 'Period', d7: 'Last 7 days', d30: 'Last 30 days', gen: '🔄 Regenerate', ai: '🤖 AI: refine hazards & controls', aiing: 'AI is writing…', save: '✓ Confirm & save record', print: '🖨 Print / PDF', csv: '⬇ CSV',
      c_no: 'No', c_zone: 'Process / zone', c_haz: 'Hazard (detection basis)', c_l: 'Likelihood', c_s: 'Severity', c_r: 'Risk', c_m: 'Controls', c_who: 'Owner / due', c_ok: 'Worker sign-off',
      conf: 'Sign', conf_p: 'Name of the worker confirming (worker participation)', det: 'detected {n}×', saved: 'Saved · {d}', recs: 'Saved assessments', none: 'None', nohaz: 'No hazards to assess were detected in this period',
      k1: 'Hazards', k2: 'High risk', k3: 'Worker sign-offs', k4: 'Saved records', due: 'Team leader / 7 days', due_h: 'Safety lead / now',
      how: 'Likelihood from detections (≥5 = 3, ≥2 = 2, else 1); posture from mean RULA; heat from 31 / 33 °C. Severity by accident type (caught-in, struck-by, falls = 3). Risk = likelihood × severity: ≥6 high, 3–4 medium, ≤2 low. The AI rewrites descriptions and controls only, never the detection counts.',
      ev: 'Risk assessment is required by Art. 36 of the Korean OSH Act and records are kept 3 years (Enforcement Rule Art. 37); near-misses and past accidents must be added when identifying hazards, and a risk assessment can fulfil the hazard identification and improvement duty of Art. 4(3) of the Serious Accidents Punishment Act Enforcement Decree.' }
  };
  var raDays = 7, raDraft = null;
  window.SHKPlus2RA = function () { if (!raDraft || raDraft.days !== raDays) { raDraft = buildRows(raDays); raDraft.lang = lang(); } return raDraft.rows; };
  function detTxt(r, s) { return r.ty === 'heat' ? '' : r.ty === 'msd' ? T({ zh: '姿势样本 ', ko: '자세 표본 ', en: 'posture samples ' }) + r.n : s.det.replace('{n}', r.n); }
  function buildRows(days) {
    var g = gather(days), map = {};
    function add(ty, zone, n, ex) { zone = zone || T({ zh: '全厂', ko: '전체', en: 'Whole site' }); var k = ty + '|' + zone, r = map[k] || (map[k] = { ty: ty, zone: zone, n: 0, ex: [] }); r.n += n; if (ex && r.ex.length < 2) r.ex.push(ex); }
    g.nf.forEach(function (x) { add('fall_low', x.zone, 1); });
    g.ev.forEach(function (x) { var ty = KIND2TY[x.kind]; if (ty) add(ty, x.zone, 1); });
    g.al.forEach(function (x) { var ty = KIND2TY[x.kind]; if (ty && ['near_fall', 'hand_in_machine', 'vehicle_danger', 'vehicle_near', 'fused_fall', 'voice_sos'].indexOf(x.kind) < 0) add(ty, x.zone, 1); });
    g.rep.forEach(function (x) { add('other', x.where, 1, x.text); });
    g.vrep.forEach(function (x) { add(TY[x.type] ? x.type : 'other', x.zone, 1, x[lang()] || x.orig); });
    var rows = Object.keys(map).map(function (k) { var r = map[k]; r.l = r.n >= 5 ? 3 : r.n >= 2 ? 2 : 1; return r; });
    Object.keys(g.ergo).forEach(function (z) { var d = g.ergo[z], a = d.sum / Math.max(1, d.n); if (a >= 4.5) rows.push({ ty: 'msd', zone: z, n: d.n, l: a >= 5.5 ? 3 : 2, ex: ['RULA ' + a.toFixed(1) + '/7'] }); });
    var at = P.feelsKMA(H.heat().ta, H.heat().rh);
    if (at >= 31) rows.push({ ty: 'heat', zone: T({ zh: '全厂', ko: '전체', en: 'Whole site' }), n: 1, l: at >= 33 ? 3 : 2, ex: [T({ zh: '体感温度 ', ko: '체감온도 ', en: 'Feels-like ' }) + at.toFixed(1) + '℃'] });
    rows.forEach(function (r) {
      r.s = (TY[r.ty] || TY.other).sev; if (r.ty === 'heat' && at >= 35) r.s = 3;
      r.id = (r.ty + '|' + r.zone).replace(/\s+/g, '');
      var cs = window.SHKCapa && SHKCapa.statusFor(r.id); r.cap = cs; if (cs && cs.st === 'closed') { r.fixed = true; r.l = Math.max(1, r.l - 1); }   // 已整改：剩余风险，可能性降一级
      r.r = r.l * r.s; r.haz = tyName(r.ty); r.m = T((TY[r.ty] || TY.other).m).slice();
    });
    rows.sort(function (a, b) { return b.r - a.r || b.n - a.n; });
    return { rows: rows, real: g.real, created: Date.now(), days: days, conf: {} };
  }
  function renderRA(p, s0) {
    var s = RA[lang()]; if (!raDraft || raDraft.days !== raDays || raDraft.lang !== lang() || (!raDraft.ai && !Object.keys(raDraft.conf).length)) { raDraft = buildRows(raDays); raDraft.lang = lang(); }   // 没有 AI 补充 / 工人确认时，每次打开都用最新数据
    var d = raDraft, recs = jget('shk3_ra_records', []), confN = Object.keys(d.conf).reduce(function (a, k) { return a + d.conf[k].length; }, 0);
    p.innerHTML = H.hd(s.t, s.s, H.srcBadge(d.real ? d.rows.length : 0, s0)) +
      '<div class="kpi-row rv">' + H.kpi('blue', s.k1, d.rows.length) + H.kpi('red', s.k2, d.rows.filter(function (r) { return r.r >= 6; }).length) + H.kpi('green', s.k3, confN) + H.kpi('amber', s.k4, recs.length) + '</div>' +
      '<div class="card rv" style="margin-bottom:16px"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">' +
      '<select class="px-in" id="ra-days"><option value="7"' + (raDays === 7 ? ' selected' : '') + '>' + s.d7 + '</option><option value="30"' + (raDays === 30 ? ' selected' : '') + '>' + s.d30 + '</option></select>' +
      '<button class="px-btn g" id="ra-gen">' + s.gen + '</button><button class="px-btn" id="ra-ai">' + s.ai + '</button><span id="ra-msg" style="font-size:.78rem;color:var(--ink3)"></span><span style="flex:1"></span>' +
      H.llmBar(function () { P.render('ra'); }) + '</div></div>' +
      '<div class="worker-table-wrap rv" style="overflow-x:auto"><table class="px-t" id="ra-table"><tr><th>' + s.c_no + '</th><th>' + s.c_zone + '</th><th>' + s.c_haz + '</th><th>' + s.c_l + '</th><th>' + s.c_s + '</th><th>' + s.c_r + '</th><th>' + s.c_m + '</th><th>' + s.c_who + '</th><th>' + s.c_ok + '</th></tr>' +
      (d.rows.length ? d.rows.map(function (r, i) {
        var cf = d.conf[r.id] || [];
        return '<tr><td>' + (i + 1) + '</td><td><b>' + esc(r.zone) + '</b></td><td><b>' + esc(r.haz) + '</b>' + (r.desc ? '<br><span style="font-size:.78rem">' + esc(r.desc) + '</span>' : '') +
          '<br><small style="color:var(--ink4)">' + esc(detTxt(r, s)) + (r.ex.length ? (detTxt(r, s) ? ' · ' : '') + r.ex.map(esc).join(' / ') : '') + '</small></td>' +
          '<td>' + r.l + '</td><td>' + r.s + '</td><td><span class="px-pill" style="background:' + riskCol(r.r) + ';color:#fff">' + r.r + ' ' + riskTxt(r.r) + '</span></td>' +
          '<td style="font-size:.78rem;min-width:220px">' + r.m.map(function (m) { return '• ' + esc(m); }).join('<br>') + '</td><td style="font-size:.76rem">' + (r.r >= 6 ? s.due_h : s.due) + (r.fixed ? '<br><b style="color:var(--g)">✓ ' + T({ zh: '已整改', ko: '개선 완료', en: 'Fixed' }) + '</b>' : r.cap ? '<br><b style="color:var(--w)">🧾 ' + T({ zh: '整改中', ko: '개선 중', en: 'In progress' }) + '</b>' : '') + '</td>' +
          '<td style="font-size:.76rem">' + cf.map(function (n) { return '✓ ' + esc(n); }).join('<br>') + ' <button class="px-btn g" style="padding:4px 9px;font-size:.72rem" data-cf="' + esc(r.id) + '">' + s.conf + '</button></td></tr>';
      }).join('') : '<tr><td colspan="9">' + s.nohaz + '</td></tr>') + '</table></div>' +
      '<div class="card rv" style="margin-top:16px"><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="px-btn" id="ra-save">' + s.save + '</button><button class="px-btn g" id="ra-print">' + s.print + '</button><button class="px-btn g" id="ra-csv">' + s.csv + '</button></div>' +
      '<div class="px-how">' + esc(s.how) + '</div><div class="card-title" style="margin-top:14px">' + s.recs + '</div><table class="px-t">' +
      (recs.length ? recs.slice(-6).reverse().map(function (x) { return '<tr><td>' + new Date(x.ts).toLocaleString() + '</td><td>' + x.rows.length + ' · ' + T({ zh: '高风险 ', ko: '상 ', en: 'high ' }) + x.rows.filter(function (r) { return r.r >= 6; }).length + '</td><td>' + T({ zh: '工人确认 ', ko: '근로자 확인 ', en: 'sign-offs ' }) + x.workers.length + (x.ai ? ' · 🤖' : '') + '</td></tr>'; }).join('') : '<tr><td>' + s.none + '</td></tr>') +
      '</table></div>' + H.ev(s0, s.ev);
    $('ra-days').onchange = function () { raDays = +this.value; raDraft = null; P.render('ra'); };
    $('ra-gen').onclick = function () { raDraft = null; P.render('ra'); };
    p.querySelectorAll('[data-cf]').forEach(function (b) { b.onclick = function () { var n = (prompt(s.conf_p) || '').trim(); if (!n) return; (d.conf[b.dataset.cf] = d.conf[b.dataset.cf] || []).push(n); P.render('ra'); }; });
    $('ra-save').onclick = function () {
      var all = jget('shk3_ra_records', []), ws = {}; Object.keys(d.conf).forEach(function (k) { d.conf[k].forEach(function (n) { ws[n] = 1; }); });
      all.push({ ts: Date.now(), days: d.days, rows: d.rows, conf: d.conf, workers: Object.keys(ws), ai: !!d.ai, real: d.real }); jset('shk3_ra_records', all.slice(-200));
      $('ra-msg').textContent = s.saved.replace('{d}', new Date().toLocaleString()); P.render('ra');
    };
    $('ra-csv').onclick = function () {
      var rows = [[s.c_no, s.c_zone, s.c_haz, s.c_l, s.c_s, s.c_r, s.c_m, s.c_who, s.c_ok]].concat(d.rows.map(function (r, i) { return [i + 1, r.zone, r.haz + (r.desc ? ' - ' + r.desc : '') + ' (' + (detTxt(r, s) || r.ex.join(' ')) + ')', r.l, r.s, r.r + ' ' + riskTxt(r.r), r.m.join(' / '), r.r >= 6 ? s.due_h : s.due, (d.conf[r.id] || []).join(' ')]; }));
      dl('risk-assessment-' + new Date().toISOString().slice(0, 10) + '.csv', '﻿' + rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n'), 'text/csv');
    };
    $('ra-print').onclick = function () { printDoc(s.t, '<p>' + esc(s.per) + ': ' + (raDays === 7 ? s.d7 : s.d30) + ' · ' + new Date().toLocaleString() + '</p>' + $('ra-table').outerHTML.replace(/<button[^>]*>.*?<\/button>/g, '') + '<p style="font-size:11px;color:#555">' + esc(s.how) + '</p>'); };
    $('ra-ai').onclick = async function () {
      var btn = this; btn.disabled = true; $('ra-msg').textContent = s.aiing;
      try {
        var langName = T({ zh: '简体中文', ko: '한국어', en: 'English' });
        var sys = 'You are a Korean industrial safety engineer writing a 위험성평가 (risk assessment) for a small factory. For each hazard row you receive, write: "desc" = one concrete sentence describing the hazardous situation at that zone (based only on the given evidence, do not invent incidents), and "m" = 2-3 specific control measures ordered by the hierarchy of controls (elimination/engineering first, then administrative, then PPE). Write in ' + langName + '. Reply ONLY with a JSON array of objects {"id","desc","m":[...]}, same ids, no other text.';
        var out = await H.ask(sys, JSON.stringify(d.rows.map(function (r) { return { id: r.id, zone: r.zone, hazard: r.haz, detections: r.n, evidence: r.ex, likelihood: r.l, severity: r.s, current_controls: r.m }; })), 3000);
        var arr = H.parseJSON(out);
        arr.forEach(function (x) { var r = d.rows.find(function (y) { return y.id === x.id; }); if (r) { if (x.desc) r.desc = String(x.desc); if (Array.isArray(x.m) && x.m.length) r.m = x.m.map(String).slice(0, 4); } });
        d.ai = true; P.render('ra');
      } catch (e) { $('ra-msg').textContent = e.message === 'NO_LLM' ? T({ zh: '请先点右侧“⚙ 设置”填写大模型', ko: '오른쪽 “⚙ 설정”에서 LLM을 먼저 설정하세요', en: 'Set up an LLM first (⚙ on the right)' }) : '⚠ ' + e.message; btn.disabled = false; }
    };
  }

  /* =================== ② 母语 AI 安全员 =================== */
  var LANGS = [['ko-KR', '한국어'], ['zh-CN', '中文'], ['vi-VN', 'Tiếng Việt'], ['ne-NP', 'नेपाली'], ['km-KH', 'ភាសាខ្មែរ'], ['id-ID', 'Bahasa Indonesia'], ['th-TH', 'ไทย'],
    ['uz-UZ', 'Oʻzbekcha'], ['mn-MN', 'Монгол'], ['my-MM', 'မြန်မာ'], ['fil-PH', 'Filipino'], ['si-LK', 'සිංහල'], ['bn-BD', 'বাংলা'], ['en-US', 'English']];
  /* 离线常用语（大模型未设置时）：只收录有把握的语言 */
  var PHRASE = {
    'ko-KR': ['안전모와 반사조끼를 착용하세요.', '더운 날: 물을 자주 마시고 2시간마다 20분 쉬세요.', '걸린 것을 빼기 전에 기계를 끄고 잠그세요.', '움직이는 지게차에서 떨어지세요.', '어지러우면 작업을 멈추고 반장에게 바로 알리세요.'],
    'zh-CN': ['请戴好安全帽，穿好反光背心。', '天热：勤喝水，每 2 小时休息 20 分钟。', '清理卡料前先停机并上锁。', '远离正在行驶的叉车。', '头晕请立即停止作业，马上告诉班组长。'],
    'vi-VN': ['Hãy đội mũ bảo hộ và mặc áo phản quang.', 'Trời nóng: uống nước thường xuyên, nghỉ 20 phút mỗi 2 tiếng.', 'Tắt máy và khóa nguồn trước khi gỡ kẹt.', 'Tránh xa xe nâng đang chạy.', 'Nếu chóng mặt, hãy dừng việc và báo ngay cho tổ trưởng.'],
    'id-ID': ['Pakai helm keselamatan dan rompi reflektif.', 'Cuaca panas: sering minum air, istirahat 20 menit setiap 2 jam.', 'Matikan dan kunci mesin sebelum membersihkan macet.', 'Jauhi forklift yang sedang bergerak.', 'Jika pusing, hentikan pekerjaan dan segera lapor ke ketua tim.'],
    'th-TH': ['สวมหมวกนิรภัยและเสื้อสะท้อนแสง', 'อากาศร้อน: ดื่มน้ำบ่อยๆ พัก 20 นาทีทุก 2 ชั่วโมง', 'ปิดและล็อกเครื่องก่อนเคลียร์ชิ้นงานที่ติด', 'อยู่ห่างจากรถยกที่กำลังเคลื่อนที่', 'ถ้าเวียนหัว ให้หยุดงานและแจ้งหัวหน้าทันที'],
    'en-US': ['Wear your safety helmet and high-visibility vest.', 'Hot day: drink water often and rest 20 minutes every 2 hours.', 'Switch off and lock the machine before clearing a jam.', 'Keep away from moving forklifts.', 'If you feel dizzy, stop work and tell your team leader now.']
  };
  var LG = {
    zh: { t: '母语 AI 安全员', s: '外国工人用自己的语言说话或打字：问安全问题、上报隐患；大模型用母语回答，同时给管理者翻译。管理者的指示也能一键翻译成多种语言播报',
      tab_ask: '❓ 安全提问', tab_rep: '📢 母语上报隐患', tab_bc: '📣 管理者多语广播', lang: '工人语言', who: '工人', mic: '🎤 按下说话', mic_on: '🎤 正在听…', send: '发送', q_ph: '用母语输入问题，例如：Tôi có cần đeo găng tay khi hàn không?',
      r_ph: '用母语描述隐患，例如：Dầu bị rò rỉ dưới máy ép số 2', ans: '回答（工人语言）', tr: '管理者看的翻译', esc: '⚠ 已提示停止作业并通知班组长', thinking: '思考中…',
      off: '没有设置大模型：显示离线常用安全语句（越南语、印尼语、泰语、中、韩、英）。设置大模型后可回答任意问题、支持全部语言。', off_none: '这个语言没有离线语句，请设置大模型。',
      reps: '母语隐患上报（已翻译，自动进入风险评估表）', r_type: '类型', r_sev: '严重度', r_orig: '原文', r_act: '建议立即措施', r_saved: '已保存，已加入风险评估表', bc_ph: '用中文或韩语输入指示，例如：下午2点到5点停止室外作业，到休息室补水', bc_langs: '要播报的语言', bc_go: '🔊 翻译并播报', play: '🔊',
      ev: '外国人就业者中 78.9% 在 50 人以下的企业工作，理解作业指示和安全规则时还有语言障碍；外国工人工伤死亡人数 2022 年 85 人、2023 年 85 人、2024 年 102 人（国会议员根据雇佣劳动部资料整理）。' },
    ko: { t: '모국어 AI 안전관리자', s: '외국인 근로자가 자기 언어로 말하거나 입력: 안전 질문·위험 신고. AI가 모국어로 답하고 관리자용 번역도 함께 보여줍니다. 관리자 지시도 여러 언어로 한 번에 번역·방송',
      tab_ask: '❓ 안전 질문', tab_rep: '📢 모국어 위험 신고', tab_bc: '📣 관리자 다국어 방송', lang: '근로자 언어', who: '근로자', mic: '🎤 눌러서 말하기', mic_on: '🎤 듣는 중…', send: '보내기', q_ph: '모국어로 질문 입력, 예: Tôi có cần đeo găng tay khi hàn không?',
      r_ph: '모국어로 위험 설명, 예: Dầu bị rò rỉ dưới máy ép số 2', ans: '답변(근로자 언어)', tr: '관리자용 번역', esc: '⚠ 작업 중지·반장 알림을 안내했습니다', thinking: '생각 중…',
      off: 'LLM 미설정: 오프라인 안전 문장을 보여줍니다(베트남어·인도네시아어·태국어·중·한·영). LLM을 설정하면 모든 질문과 모든 언어를 지원합니다.', off_none: '이 언어는 오프라인 문장이 없습니다. LLM을 설정하세요.',
      reps: '모국어 위험 신고(번역됨, 위험성평가표에 자동 반영)', r_type: '유형', r_sev: '중대성', r_orig: '원문', r_act: '즉시 조치 제안', r_saved: '저장됨, 위험성평가표에 반영', bc_ph: '한국어나 중국어로 지시 입력, 예: 오후 2시~5시 옥외작업 중지, 휴게실에서 물 마시기', bc_langs: '방송 언어', bc_go: '🔊 번역 후 방송', play: '🔊',
      ev: '외국인 취업자의 78.9%가 50인 미만 사업장에서 일하며 작업 지시와 안전수칙 이해에 언어 장벽이 겹칠 수 있습니다. 외국인 근로자 산재 사망자는 2022년 85명, 2023년 85명, 2024년 102명입니다(국회의원실, 고용노동부 자료).' },
    en: { t: 'Native-language AI safety officer', s: 'Migrant workers speak or type in their own language to ask safety questions or report hazards; the AI answers in their language and shows the manager a translation. Managers can broadcast instructions in many languages at once',
      tab_ask: '❓ Ask', tab_rep: '📢 Report a hazard', tab_bc: '📣 Manager broadcast', lang: 'Worker language', who: 'Worker', mic: '🎤 Hold to talk', mic_on: '🎤 Listening…', send: 'Send', q_ph: 'Type a question in your language, e.g. Tôi có cần đeo găng tay khi hàn không?',
      r_ph: 'Describe the hazard in your language, e.g. Dầu bị rò rỉ dưới máy ép số 2', ans: 'Answer (worker language)', tr: 'Translation for the manager', esc: '⚠ Told to stop work and call the team leader', thinking: 'Thinking…',
      off: 'No LLM set: showing offline safety phrases (Vietnamese, Indonesian, Thai, Chinese, Korean, English). With an LLM, any question in any language works.', off_none: 'No offline phrases for this language — set up an LLM.',
      reps: 'Native-language hazard reports (translated, added to the risk assessment)', r_type: 'Type', r_sev: 'Severity', r_orig: 'Original', r_act: 'Suggested action', r_saved: 'Saved and added to the risk assessment', bc_ph: 'Type an instruction, e.g. Stop outdoor work 14–17 h and drink water in the rest room', bc_langs: 'Languages', bc_go: '🔊 Translate & speak', play: '🔊',
      ev: '78.9% of employed foreigners in Korea work at firms with fewer than 50 staff, where a language barrier adds to the risk; migrant worker deaths were 85 (2022), 85 (2023) and 102 (2024) (MoEL data via National Assembly).' }
  };
  var lg = { tab: 'ask', code: jget('shk3_px_lgcode', 'vi-VN'), last: null, busy: false };
  function langName(code) { var x = LANGS.find(function (l) { return l[0] === code; }); return x ? x[1] : code; }
  function speak(text, code) { try { if (!window.speechSynthesis) return; var u = new SpeechSynthesisUtterance(text); u.lang = code; var v = speechSynthesis.getVoices().find(function (v) { return v.lang && v.lang.replace('_', '-').toLowerCase().indexOf(code.slice(0, 2).toLowerCase()) === 0; }); if (v) u.voice = v; speechSynthesis.speak(u); } catch (e) {} }
  function listen(code, cb, btn, s) {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) { alert('Speech recognition: Chrome / Edge'); return; }
    var r = new SR(); r.lang = code; r.interimResults = false; r.maxAlternatives = 1;
    btn.textContent = s.mic_on; r.onresult = function (e) { cb(e.results[0][0].transcript); }; r.onend = function () { btn.textContent = s.mic; }; r.onerror = function () { btn.textContent = s.mic; };
    try { r.start(); } catch (e) {}
  }
  function kbText() {
    var KB = window.SHK_KB; if (!KB) return '';
    return KB.docs.filter(function (d) { return d.type !== 'quiz'; }).map(function (d) { return '[' + d.title + '] ' + d.text; }).join('\n').slice(0, 7000);
  }
  function siteCtx() {
    var at = P.feelsKMA(H.heat().ta, H.heat().rh);
    return 'Feels-like temperature now: ' + at.toFixed(1) + ' C (Korean rule: >=33 C means at least 20 min rest every 2 h). Machine danger zones exist at presses; forklifts operate in material handling.';
  }
  function renderLingo(p, s0) {
    var s = LG[lang()], ws = window.WORKERS || [], hasLLM = !!(H.llm() && H.llm().key), reps = jget('shk3_px_vreports', []);
    var tabs = [['ask', s.tab_ask], ['rep', s.tab_rep], ['bc', s.tab_bc]];
    var body = '';
    if (lg.tab === 'ask' || lg.tab === 'rep') {
      body = '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:end;margin-bottom:12px">' +
        '<label style="font-size:.76rem;font-weight:700;color:var(--ink3)">' + s.lang + '<br><select class="px-in" id="lg-code">' + LANGS.map(function (l) { return '<option value="' + l[0] + '"' + (l[0] === lg.code ? ' selected' : '') + '>' + esc(l[1]) + '</option>'; }).join('') + '</select></label>' +
        '<label style="font-size:.76rem;font-weight:700;color:var(--ink3)">' + s.who + '<br><input class="px-in" id="lg-who" list="lg-wl" style="width:170px" value="' + esc(jget('shk3_px_lgwho', '')) + '"><datalist id="lg-wl">' + ws.map(function (w) { return '<option value="' + esc(w.name.en) + '">'; }).join('') + '</datalist></label></div>' +
        '<div style="display:flex;gap:8px"><textarea class="px-in" id="lg-in" rows="3" style="flex:1" placeholder="' + esc(lg.tab === 'ask' ? s.q_ph : s.r_ph) + '"></textarea></div>' +
        '<div style="display:flex;gap:8px;margin-top:8px"><button class="px-btn w" id="lg-mic">' + s.mic + '</button><button class="px-btn" id="lg-send">' + s.send + '</button><span id="lg-msg" style="font-size:.78rem;color:var(--ink3);align-self:center"></span></div>' +
        '<div id="lg-out" style="margin-top:14px"></div>';
      if (lg.tab === 'ask' && !hasLLM) {
        var ph = PHRASE[lg.code];
        body += '<div class="px-how">' + esc(s.off) + '</div>' + (ph ? '<table class="px-t">' + ph.map(function (x, i) { return '<tr><td style="font-size:.92rem"><b>' + esc(x) + '</b><br><small style="color:var(--ink4)">' + esc(PHRASE[lang() === 'ko' ? 'ko-KR' : lang() === 'en' ? 'en-US' : 'zh-CN'][i]) + '</small></td><td><button class="px-btn g" data-say="' + i + '">' + s.play + '</button></td></tr>'; }).join('') + '</table>' : '<div class="px-how">' + esc(s.off_none) + '</div>');
      }
      if (lg.tab === 'rep') {
        body += '<div class="card-title" style="margin-top:18px">' + s.reps + '</div><table class="px-t"><tr><th></th><th>' + s.r_orig + '</th><th>' + s.tr + '</th><th>' + s.r_type + '</th><th>' + s.r_sev + '</th></tr>' +
          (reps.length ? reps.slice(-10).reverse().map(function (r) { return '<tr><td style="font-size:.74rem">' + new Date(r.ts).toLocaleString() + '<br>' + esc(r.worker || '') + ' · ' + esc(langName(r.lang)) + '</td><td>' + esc(r.orig) + '</td><td><b>' + esc(r[lang()] || '—') + '</b>' + (r.action ? '<br><small>→ ' + esc(r.action) + '</small>' : '') + '</td><td>' + esc(tyName(r.type)) + '</td><td>' + (r.severity || '—') + '</td></tr>'; }).join('') : '<tr><td colspan="5">—</td></tr>') + '</table>';
      }
    } else {
      body = '<textarea class="px-in" id="bc-in" rows="3" style="width:100%" placeholder="' + esc(s.bc_ph) + '"></textarea><div class="kpi-label" style="margin-top:10px">' + s.bc_langs + '</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 10px">' +
        LANGS.map(function (l) { return '<label style="font-size:.8rem;display:flex;gap:4px;align-items:center"><input type="checkbox" value="' + l[0] + '"' + (['ko-KR', 'zh-CN', 'vi-VN', 'ne-NP', 'km-KH'].indexOf(l[0]) >= 0 ? ' checked' : '') + '>' + esc(l[1]) + '</label>'; }).join('') +
        '</div><button class="px-btn" id="bc-go">' + s.bc_go + '</button><span id="lg-msg" style="font-size:.78rem;color:var(--ink3);margin-left:8px"></span><div id="bc-out" style="margin-top:14px"></div>';
    }
    p.innerHTML = H.hd(s.t, s.s, H.llmBar(function () { P.render('lingo'); })) +
      '<div class="card rv"><div style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap">' + tabs.map(function (x) { return '<button class="px-btn ' + (lg.tab === x[0] ? '' : 'g') + '" data-tab="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>' + body + '</div>' + H.ev(s0, s.ev);
    p.querySelectorAll('[data-tab]').forEach(function (b) { b.onclick = function () { lg.tab = b.dataset.tab; P.render('lingo'); }; });
    p.querySelectorAll('[data-say]').forEach(function (b) { b.onclick = function () { speak(PHRASE[lg.code][+b.dataset.say], lg.code); }; });
    if ($('lg-code')) $('lg-code').onchange = function () { lg.code = this.value; jset('shk3_px_lgcode', lg.code); P.render('lingo'); };
    if ($('lg-who')) $('lg-who').onchange = function () { jset('shk3_px_lgwho', this.value.trim()); };
    if ($('lg-mic')) $('lg-mic').onclick = function () { listen(lg.code, function (txt) { $('lg-in').value = txt; $('lg-send').click(); }, this, s); };
    if ($('lg-send')) $('lg-send').onclick = async function () {
      var q = $('lg-in').value.trim(); if (!q) return; var msg = $('lg-msg'), out = $('lg-out'), who = $('lg-who').value.trim();
      var uiName = T({ zh: 'Simplified Chinese', ko: 'Korean', en: 'English' }), wl = langName(lg.code) + ' (' + lg.code + ')';
      if (lg.tab === 'ask') {
        if (!hasLLM) { msg.textContent = s.off; return; }
        msg.textContent = s.thinking;
        try {
          var sys = 'You are the safety officer of a small Korean factory talking to a migrant worker. Reply ONLY with JSON {"answer": string in ' + wl + ', "translation": the same answer in ' + uiName + ', "escalate": boolean}. Use plain words, at most 4 short sentences, concrete steps. Base the answer on the safety rules and site status below. If it may be an emergency or you are unsure, tell the worker to stop work and call the team leader, and set escalate true. Never invent rules or numbers.\n\nSAFETY RULES:\n' + kbText() + '\n\nSITE STATUS: ' + siteCtx();
          var j = H.parseJSON(await H.ask(sys, q, 800));
          out.innerHTML = '<div class="px-lv" style="background:var(--abg);color:var(--ink)"><div class="kpi-label">' + s.ans + '</div><div style="font-size:1.05rem">' + esc(j.answer) + ' <button class="px-btn g" id="lg-play" style="padding:4px 9px">' + s.play + '</button></div>' +
            '<div class="kpi-label" style="margin-top:10px">' + s.tr + '</div><div style="font-weight:600">' + esc(j.translation) + '</div>' + (j.escalate ? '<div style="color:var(--r);margin-top:8px">' + s.esc + '</div>' : '') + '</div>';
          $('lg-play').onclick = function () { speak(j.answer, lg.code); }; speak(j.answer, lg.code); msg.textContent = '';
          var log = jget('shk3_px_lgqa', []); log.push({ ts: Date.now(), lang: lg.code, worker: who, q: q, a: j.answer, tr: j.translation, escalate: !!j.escalate }); jset('shk3_px_lgqa', log.slice(-300));
        } catch (e) { msg.textContent = '⚠ ' + e.message; }
      } else {
        var rec = { ts: Date.now(), lang: lg.code, orig: q, worker: who, type: 'other', severity: 2 };
        if (hasLLM) {
          msg.textContent = s.thinking;
          try {
            var sys2 = 'Classify a hazard report written by a factory worker in ' + wl + '. Reply ONLY with JSON {"type": one of ["caught","struck","fall_low","fall_high","msd","heat","ppe","fire","elec","other"], "severity": 1|2|3, "zone": place mentioned or "", "ko": Korean translation, "zh": Simplified Chinese translation, "en": English translation, "action": one short immediate action in ' + uiName + '}. Do not add facts that are not in the report.';
            var j2 = H.parseJSON(await H.ask(sys2, q, 600));
            Object.assign(rec, { type: TY[j2.type] ? j2.type : 'other', severity: +j2.severity || 2, zone: j2.zone || '', ko: j2.ko, zh: j2.zh, en: j2.en, action: j2.action });
          } catch (e) { msg.textContent = '⚠ ' + e.message; }
        }
        var all = jget('shk3_px_vreports', []); all.push(rec); jset('shk3_px_vreports', all.slice(-500));
        if (window.SHKTransport) try { new SHKTransport('dash').send({ type: 'report', text: rec[lang()] || rec.orig, orig: rec.orig, lang: rec.lang, worker: who, hz: rec.type }); } catch (e) {}
        P.render('lingo'); $('lg-msg').textContent = s.r_saved;
      }
    };
    if ($('bc-go')) $('bc-go').onclick = async function () {
      var txt = $('bc-in').value.trim(), codes = Array.prototype.slice.call(p.querySelectorAll('input[type=checkbox]:checked')).map(function (c) { return c.value; }), msg = $('lg-msg');
      if (!txt || !codes.length) return;
      if (!hasLLM) { msg.textContent = s.off; return; }
      msg.textContent = s.thinking;
      try {
        var sys = 'Translate a factory safety instruction from a manager. Keep it short, clear and polite, keep numbers and times exact. Reply ONLY with a JSON object whose keys are these BCP-47 codes and values the translation: ' + codes.join(', ');
        var j = H.parseJSON(await H.ask(sys, txt, 1500));
        $('bc-out').innerHTML = '<table class="px-t">' + codes.map(function (c) { return '<tr><td style="white-space:nowrap"><b>' + esc(langName(c)) + '</b></td><td style="font-size:.95rem">' + esc(j[c] || '—') + '</td><td><button class="px-btn g" data-bc="' + c + '">' + s.play + '</button></td></tr>'; }).join('') + '</table>';
        $('bc-out').querySelectorAll('[data-bc]').forEach(function (b) { b.onclick = function () { speak(j[b.dataset.bc], b.dataset.bc); }; });
        codes.forEach(function (c) { if (j[c]) speak(j[c], c); }); msg.textContent = '';
        var log = jget('shk3_px_bc', []); log.push({ ts: Date.now(), text: txt, langs: codes }); jset('shk3_px_bc', log.slice(-200));
        if (window.SHKTransport) try { new SHKTransport('dash').send({ type: 'broadcast', text: txt, tr: j }); } catch (e) {}
      } catch (e) { msg.textContent = '⚠ ' + e.message; }
    };
  }

  /* =================== ③ 义务履行证据包 =================== */
  var EV = {
    zh: { t: '义务履行证据包（重大灾害处罚法）', s: '平时自动记录“我们做了什么”：危险检测与处理、风险评估与工人参与、休息与适岗检测、工人意见。出事时一键导出时间线，证明企业履行了安全保健确保义务',
      per: '期间', d30: '最近 30 天', d90: '最近 90 天', d180: '最近 180 天', site: '事业场名称', k1: '检测到的危险', k2: '已处理 / 确认', k3: '风险评估（工人参与）', k4: '工人意见与上报',
      k5: '上岗前适岗检测', k6: '高温休息记录', law: '施行令第 4 条 · 安全保健管理体系 9 项', auto: '自动证据', part: '部分证据', man: '需人工确认', done: '已确认', note: '备注 / 文件位置',
      tl: '时间线（最近 60 条）', c_t: '时间', c_c: '类别', c_x: '内容', inc: '事故详情：选择一条危险警报，查看前后 30 分钟', inc_none: '没有危险等级的警报', print: '🖨 打印 / PDF', json: '⬇ 导出 JSON', ai: '🤖 AI 写履行情况摘要', aiing: '大模型撰写中…',
      cat: { capa: '整改', drill: '应急演练', ho: '交接班', fa: '急救培训结业', alert: '危险检测', clear: '处理 / 确认', ra: '风险评估', pvt: '适岗检测', heat: '高温休息', rep: '工人上报', vrep: '母语上报', qa: '母语问答', bc: '多语广播', permit: '作业票' },
      disc: '本页整理的是系统中的客观记录，是否满足法律义务以劳务师 / 律师的判断为准。',
      items: [['安全·保健目标与经营方针', 'man'], ['安全·保健业务专职组织（规模达标的企业）', 'man'], ['确认·改善危险因素的程序，半年 1 次以上检查（风险评估可代替）', 'ra'], ['安全·保健预算编制与执行', 'man'],
        ['安全保健管理责任人的权限、预算与半年 1 次评估', 'man'], ['配置安全管理人员等', 'man'], ['听取从业人员意见的程序，半年 1 次以上检查', 'voice'], ['重大产业灾害（紧急危险）应对手册，半年 1 次以上检查', 'emg'], ['承包 / 外包时的安全保健标准与程序', 'contract']],
      ev: '2024 年 1 月 27 日起，5 人以上 50 人以下的企业也适用《重大灾害处罚法》，须建立并履行安全保健管理体系；即使发生重大灾害，只要履行了安全·保健确保义务，就不会受到处罚。' },
    ko: { t: '의무 이행 증빙 패키지(중대재해처벌법)', s: '평소 "무엇을 했는지"를 자동 기록: 위험 감지와 조치, 위험성평가와 근로자 참여, 휴식·적합성 검사, 종사자 의견. 사고 시 타임라인을 바로 내보내 안전보건 확보의무 이행을 증빙',
      per: '기간', d30: '최근 30일', d90: '최근 90일', d180: '최근 180일', site: '사업장명', k1: '감지된 위험', k2: '조치 / 확인', k3: '위험성평가(근로자 참여)', k4: '종사자 의견·신고',
      k5: '작업 전 적합성 검사', k6: '폭염 휴식 기록', law: '시행령 제4조 · 안전보건관리체계 9개 항목', auto: '자동 증빙', part: '일부 증빙', man: '수동 확인 필요', done: '확인함', note: '비고 / 문서 위치',
      tl: '타임라인(최근 60건)', c_t: '시간', c_c: '구분', c_x: '내용', inc: '사고 상세: 위험 경보를 선택해 전후 30분 확인', inc_none: '위험 등급 경보 없음', print: '🖨 인쇄 / PDF', json: '⬇ JSON 내보내기', ai: '🤖 AI 이행 현황 요약', aiing: 'AI 작성 중…',
      cat: { capa: '개선 조치', drill: '비상 훈련', ho: '인수인계', fa: '응급처치 교육 수료', alert: '위험 감지', clear: '조치 / 확인', ra: '위험성평가', pvt: '적합성 검사', heat: '폭염 휴식', rep: '근로자 신고', vrep: '모국어 신고', qa: '모국어 질의', bc: '다국어 방송', permit: '작업허가' },
      disc: '이 페이지는 시스템의 객관적 기록을 정리한 것이며, 법적 의무 충족 여부는 노무사·변호사의 판단에 따릅니다.',
      items: [['안전·보건 목표와 경영방침 설정', 'man'], ['안전·보건 업무 총괄·관리 전담 조직(해당 규모)', 'man'], ['유해·위험요인 확인·개선 절차, 반기 1회 이상 점검(위험성평가로 갈음 가능)', 'ra'], ['안전·보건 예산 편성·집행', 'man'],
        ['안전보건관리책임자 등의 권한·예산, 반기 1회 평가', 'man'], ['안전관리자 등 배치', 'man'], ['종사자 의견 청취 절차, 반기 1회 이상 점검', 'voice'], ['중대산업재해(급박한 위험) 대비 매뉴얼, 반기 1회 이상 점검', 'emg'], ['도급·용역 시 안전보건 기준·절차', 'contract']],
      ev: '2024년 1월 27일부터 상시근로자 5~50명 미만 사업장도 중대재해처벌법 적용 대상이며 안전보건관리체계를 구축·이행해야 합니다. 중대재해가 발생해도 안전·보건 확보 의무를 이행했다면 처벌로 이어지지 않습니다.' },
    en: { t: 'Duty-of-care evidence pack (Serious Accidents Punishment Act)', s: 'Records what you did, every day: hazards detected and handled, risk assessments with worker participation, breaks and fitness checks, worker input. After an incident, export the timeline that shows the safety duties were met',
      per: 'Period', d30: 'Last 30 days', d90: 'Last 90 days', d180: 'Last 180 days', site: 'Workplace', k1: 'Hazards detected', k2: 'Handled / acknowledged', k3: 'Risk assessments (worker sign-offs)', k4: 'Worker input & reports',
      k5: 'Pre-shift fitness checks', k6: 'Heat breaks logged', law: 'Enforcement Decree Art. 4 · 9 elements of the safety & health system', auto: 'Auto evidence', part: 'Partial evidence', man: 'Manual check', done: 'Confirmed', note: 'Note / where the document is',
      tl: 'Timeline (latest 60)', c_t: 'Time', c_c: 'Type', c_x: 'Details', inc: 'Incident view: pick a danger alert to see ±30 minutes', inc_none: 'No danger-level alerts', print: '🖨 Print / PDF', json: '⬇ Export JSON', ai: '🤖 AI summary of compliance', aiing: 'AI is writing…',
      cat: { capa: 'Corrective action', drill: 'Emergency drill', ho: 'Handover', fa: 'First-aid training', alert: 'Hazard detected', clear: 'Handled', ra: 'Risk assessment', pvt: 'Fitness check', heat: 'Heat break', rep: 'Worker report', vrep: 'Native-language report', qa: 'Native-language Q&A', bc: 'Multilingual broadcast', permit: 'Work permit' },
      disc: 'This page compiles objective system records; whether legal duties are met is for a labour attorney or lawyer to judge.',
      items: [['Safety & health goals and management policy', 'man'], ['Dedicated safety & health organisation (where size requires)', 'man'], ['Procedure to identify and fix hazards, checked at least every half-year (a risk assessment can replace it)', 'ra'], ['Safety & health budget planned and spent', 'man'],
        ['Authority, budget and half-yearly review of the safety & health managers', 'man'], ['Assign safety managers etc.', 'man'], ['Procedure to hear workers\' opinions, checked at least every half-year', 'voice'], ['Manual for serious accidents / imminent danger, checked at least every half-year', 'emg'], ['Safety & health criteria when contracting out', 'contract']],
      ev: 'Since 27 Jan 2024, firms with 5–49 workers are covered by the Serious Accidents Punishment Act and must build and run a safety & health management system; even if a serious accident occurs, meeting the safety and health duties means no punishment.' }
  };
  var evDays = 30;
  function timeline(days) {
    var s = EV[lang()], since = Date.now() - days * DAY, out = [], plog = jget('shk3_px_alog', []), real = true;
    var g = gather(days); real = g.real;
    var al = g.al, clr = plog.filter(function (x) { return x.t === 'clear' && x.ts >= since; });
    al.forEach(function (x) { out.push({ ts: x.ts, c: 'alert', x: (x.level === 'danger' ? '🔴 ' : '🟠 ') + (x.msg || x.kind) + (x.zone ? ' · ' + x.zone : ''), lvl: x.level, aid: x.aid, kind: x.kind }); });
    g.ev.forEach(function (x) { if (!al.some(function (a) { return Math.abs(a.ts - x.ts) < 1500 && a.kind === x.kind; })) out.push({ ts: x.ts, c: 'alert', x: (x.level === 'danger' ? '🔴 ' : '🟠 ') + (x.msg || tyName(KIND2TY[x.kind])) + (x.zone ? ' · ' + x.zone : ''), lvl: x.level, kind: x.kind }); });
    clr.forEach(function (x) { out.push({ ts: x.ts, c: 'clear', x: '✓ ' + (x.key || '') + (x.by ? ' · ' + x.by : '') }); });
    jget('shk3_ra_records', []).forEach(function (x) { if (x.ts >= since) out.push({ ts: x.ts, c: 'ra', x: x.rows.length + ' · ' + T({ zh: '工人确认 ', ko: '근로자 확인 ', en: 'sign-offs ' }) + x.workers.join(', ') }); });
    jget('shk3_capa', []).forEach(function (x) { if (x.created >= since) out.push({ ts: x.created, c: 'capa', x: '🧾 ' + x.title + ' · ' + x.zone }); if (x.closedAt && x.closedAt >= since) out.push({ ts: x.closedAt, c: 'capa', x: '✓ ' + x.title + (x.note ? ' · ' + x.note : '') + (x.photo ? ' · 📷' : '') }); });
    jget('shk3_drills', []).forEach(function (x) { if (x.t0 >= since) out.push({ ts: x.t0, c: 'drill', x: x.sc + ' · ' + x.where + ' · ' + Object.keys(x.laps).map(function (k) { return k + ' ' + x.laps[k] + 's'; }).join(', ') }); });
    jget('shk3_handover', []).forEach(function (x) { if (x.ts >= since) out.push({ ts: x.ts, c: 'ho', x: (x.by || '') + ' → ' + (x.to || '') }); });
    jget('shk3_fa_records', []).forEach(function (x) { if (x.ts >= since) out.push({ ts: x.ts, c: 'fa', x: x.name + (x.code ? ' (' + x.code + ')' : '') + ' · ' + x.score + '/' + x.total + ' · CPR ' + x.rate + '/min · ' + (x.pass ? '✓' : '✕') }); });
    jget('shk3_pvt', []).forEach(function (x) { if (x.ts >= since) out.push({ ts: x.ts, c: 'pvt', x: x.who + ' · ' + x.med + ' ms · ' + (x.v === 'ok' ? '✓' : x.v === 'warn' ? '⚠' : '✕') }); });
    (H.heat().log || []).forEach(function (x) { if (x.ts >= since && (x.a === 'rest' || x.a === 'meas')) out.push({ ts: x.ts, c: 'heat', x: x.at.toFixed(1) + '℃ · ' + x.a }); });
    g.rep.forEach(function (x) { out.push({ ts: x.at, c: 'rep', x: (x.where ? x.where + ' · ' : '') + (x.text || x.type) + ' (' + (x.status || '') + ')' }); });
    g.vrep.forEach(function (x) { out.push({ ts: x.ts, c: 'vrep', x: (x[lang()] || x.orig) + ' · ' + langName(x.lang) }); });
    jget('shk3_px_lgqa', []).forEach(function (x) { if (x.ts >= since) out.push({ ts: x.ts, c: 'qa', x: langName(x.lang) + ' · ' + (x.tr || x.q) }); });
    jget('shk3_px_bc', []).forEach(function (x) { if (x.ts >= since) out.push({ ts: x.ts, c: 'bc', x: x.text + ' → ' + x.langs.length }); });
    storeAll('permits').forEach(function (p) { (p.log || []).forEach(function (l) { if (l.at >= since) out.push({ ts: l.at, c: 'permit', x: (p.title || p.type || '') + ' · ' + l.what + (l.reason ? ' (' + l.reason + ')' : '') }); }); });
    out.sort(function (a, b) { return b.ts - a.ts; });
    return { list: out, real: real, g: g };
  }
  function renderEvidence(p, s0) {
    var s = EV[lang()], tl = timeline(evDays), L = tl.list, cnt = function (c) { return L.filter(function (x) { return x.c === c; }).length; };
    var recs = jget('shk3_ra_records', []).filter(function (x) { return x.ts >= Date.now() - evDays * DAY; }), signs = {}; recs.forEach(function (r) { r.workers.forEach(function (w) { signs[w] = 1; }); });
    var manual = jget('shk3_px_evman', {}), site = jget('shk3_px_site', '');
    var ppl0 = jget('shk3_px_people', {}), contractors = Object.keys(ppl0).filter(function (k) { return ppl0[k].type === 'contract' || ppl0[k].type === 'temp'; }).length;
    var autoSt = { ra: recs.length ? 'auto' : (cnt('alert') ? 'part' : 'man'), voice: (cnt('rep') + cnt('vrep') + Object.keys(signs).length) ? 'auto' : 'man', emg: cnt('drill') ? 'auto' : cnt('alert') ? 'part' : 'man', contract: contractors ? 'part' : 'man' };
    var autoEv = { ra: recs.length + ' × ' + T({ zh: '风险评估', ko: '위험성평가', en: 'assessments' }) + ' · ' + cnt('alert') + ' × ' + s.cat.alert, voice: (cnt('rep') + cnt('vrep')) + ' × ' + s.cat.rep + ' · ' + Object.keys(signs).length + ' × ' + s.k3,
      emg: T({ zh: '跌倒 / SOS 自动应急流程（询问 → 升级 → 广播 → 119）已启用 · 应急演练 ', ko: '넘어짐·SOS 자동 대응 절차(질문 → 격상 → 방송 → 119) 운영 · 비상 훈련 ', en: 'Automatic fall / SOS emergency flow (ask → escalate → broadcast → 119) in place · drills ' }) + cnt('drill'),
      contract: T({ zh: '已登记外包 / 临时工 ', ko: '등록된 협력·임시 근로자 ', en: 'Contractors / temps registered: ' }) + contractors + T({ zh: '（纳入岗前急救培训、风险评估、师傅制度）', ko: '(응급처치 교육·위험성평가·멘토 제도 적용)', en: ' (covered by first-aid induction, risk assessment and mentors)' }) };
    var dangers = L.filter(function (x) { return x.c === 'alert' && x.lvl === 'danger'; }).slice(0, 20);
    var stCol = { auto: 'var(--g)', part: 'var(--w)', man: 'var(--ink4)' };
    p.innerHTML = H.hd(s.t, s.s, H.srcBadge(tl.real ? L.length : 0, s0)) +
      '<div class="card rv" style="margin-bottom:16px"><div style="display:flex;gap:10px;flex-wrap:wrap;align-items:end">' +
      '<label style="font-size:.76rem;font-weight:700;color:var(--ink3)">' + s.site + '<br><input class="px-in" id="ev-site" value="' + esc(site) + '" style="width:200px"></label>' +
      '<label style="font-size:.76rem;font-weight:700;color:var(--ink3)">' + s.per + '<br><select class="px-in" id="ev-days">' + [[30, s.d30], [90, s.d90], [180, s.d180]].map(function (x) { return '<option value="' + x[0] + '"' + (evDays === x[0] ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select></label>' +
      '<button class="px-btn" id="ev-print">' + s.print + '</button><button class="px-btn g" id="ev-json">' + s.json + '</button><button class="px-btn g" id="ev-ai">' + s.ai + '</button><span style="flex:1"></span>' + H.llmBar(function () { P.render('evidence'); }) + '</div>' +
      '<div id="ev-sum" class="px-how" style="white-space:pre-wrap">' + esc(jget('shk3_px_evsum', '')) + '</div></div>' +
      '<div class="kpi-row rv">' + H.kpi('red', s.k1, cnt('alert')) + H.kpi('green', s.k2, cnt('clear')) + H.kpi('blue', s.k3, recs.length + '<small style="font-size:1rem"> / ' + Object.keys(signs).length + '</small>') + H.kpi('amber', s.k4, cnt('rep') + cnt('vrep') + cnt('qa')) + '</div>' +
      '<div class="kpi-row rv" style="grid-template-columns:repeat(2,1fr)">' + H.kpi('blue', s.k5, cnt('pvt')) + H.kpi('amber', s.k6, cnt('heat')) + '</div>' +
      '<div class="card rv" id="ev-law"><div class="card-title">⚖ ' + s.law + '</div><table class="px-t" style="margin-top:8px">' +
      s.items.map(function (it, i) {
        var st = it[1] === 'man' ? 'man' : autoSt[it[1]], m = manual[i] || {};
        if (m.ok) st = 'done';
        return '<tr><td>' + (i + 1) + '</td><td><b>' + esc(it[0]) + '</b>' + (it[1] !== 'man' ? '<br><small style="color:var(--ink3)">' + esc(autoEv[it[1]]) + '</small>' : '') + '</td>' +
          '<td><span class="px-pill" style="background:' + (st === 'done' ? 'var(--a)' : stCol[st]) + ';color:#fff">' + (st === 'done' ? s.done : s[st]) + '</span></td>' +
          '<td><label style="font-size:.74rem;display:flex;gap:4px;align-items:center"><input type="checkbox" data-mi="' + i + '"' + (m.ok ? ' checked' : '') + '>' + s.done + '</label><input class="px-in" data-mn="' + i + '" placeholder="' + esc(s.note) + '" value="' + esc(m.note || '') + '" style="width:180px;padding:4px 8px;font-size:.74rem;margin-top:4px"></td></tr>';
      }).join('') + '</table><div class="px-how">' + esc(s.disc) + '</div></div>' +
      '<div class="grid-2 rv" style="margin-top:16px"><div class="card"><div class="card-title">' + s.tl + '</div><div style="max-height:420px;overflow:auto"><table class="px-t" id="ev-tl"><tr><th>' + s.c_t + '</th><th>' + s.c_c + '</th><th>' + s.c_x + '</th></tr>' +
      L.slice(0, 60).map(function (x) { return '<tr><td style="white-space:nowrap;font-size:.74rem">' + new Date(x.ts).toLocaleString() + '</td><td style="white-space:nowrap"><span class="px-pill" style="background:var(--bg2);color:var(--ink2)">' + esc(s.cat[x.c]) + '</span></td><td style="font-size:.8rem">' + esc(x.x) + '</td></tr>'; }).join('') + '</table></div></div>' +
      '<div class="card"><div class="card-title">' + s.inc + '</div>' + (dangers.length ? '<select class="px-in" id="ev-inc" style="width:100%;margin:8px 0">' + dangers.map(function (x, i) { return '<option value="' + i + '">' + esc(new Date(x.ts).toLocaleString() + ' · ' + x.x).slice(0, 90) + '</option>'; }).join('') + '</select><div id="ev-incd"></div>' : '<div class="px-how">' + s.inc_none + '</div>') + '</div></div>' +
      H.ev(s0, s.ev);
    function incDetail() {
      var x = dangers[+$('ev-inc').value]; if (!x) return;
      var near = L.filter(function (y) { return Math.abs(y.ts - x.ts) <= 30 * 60e3; }).sort(function (a, b) { return a.ts - b.ts; });
      var dayStart = new Date(new Date(x.ts).toDateString()).getTime(), pv = L.filter(function (y) { return y.c === 'pvt' && y.ts >= dayStart && y.ts <= x.ts; }).length;
      var raBefore = jget('shk3_ra_records', []).filter(function (r) { return r.ts <= x.ts; }).length;
      $('ev-incd').innerHTML = '<table class="px-t">' + near.map(function (y) { return '<tr' + (y === x ? ' style="background:var(--rbg)"' : '') + '><td style="white-space:nowrap;font-size:.74rem">' + new Date(y.ts).toLocaleTimeString() + '</td><td><span class="px-pill" style="background:var(--bg2)">' + esc(s.cat[y.c]) + '</span></td><td style="font-size:.8rem">' + esc(y.x) + '</td></tr>'; }).join('') + '</table>' +
        '<div class="px-how">' + T({ zh: '事故前已保存风险评估 ', ko: '사고 전 저장된 위험성평가 ', en: 'Risk assessments saved before the incident: ' }) + raBefore + ' · ' + T({ zh: '当天事故前适岗检测 ', ko: '당일 사고 전 적합성 검사 ', en: 'Fitness checks that day before it: ' }) + pv + '</div>';
    }
    if ($('ev-inc')) { $('ev-inc').onchange = incDetail; incDetail(); }
    $('ev-days').onchange = function () { evDays = +this.value; P.render('evidence'); };
    $('ev-site').onchange = function () { jset('shk3_px_site', this.value.trim()); };
    p.querySelectorAll('[data-mi]').forEach(function (c) { c.onchange = function () { var m = jget('shk3_px_evman', {}); m[c.dataset.mi] = Object.assign(m[c.dataset.mi] || {}, { ok: c.checked, at: Date.now() }); jset('shk3_px_evman', m); P.render('evidence'); }; });
    p.querySelectorAll('[data-mn]').forEach(function (c) { c.onchange = function () { var m = jget('shk3_px_evman', {}); m[c.dataset.mn] = Object.assign(m[c.dataset.mn] || {}, { note: c.value }); jset('shk3_px_evman', m); }; });
    $('ev-json').onclick = function () { dl('evidence-pack-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify({ site: jget('shk3_px_site', ''), generated: new Date().toISOString(), days: evDays, demo: !tl.real, items: s.items.map(function (it, i) { return { item: it[0], manual: manual[i] || null }; }), timeline: L, risk_assessments: recs, summary: jget('shk3_px_evsum', '') }, null, 2), 'application/json'); };
    $('ev-print').onclick = function () {
      printDoc(s.t, '<p><b>' + esc(s.site) + ':</b> ' + esc(jget('shk3_px_site', '—')) + ' · ' + esc(s.per) + ': ' + evDays + 'd · ' + new Date().toLocaleString() + (tl.real ? '' : ' · DEMO') + '</p>' +
        (jget('shk3_px_evsum', '') ? '<p style="white-space:pre-wrap">' + esc(jget('shk3_px_evsum', '')) + '</p>' : '') +
        $('ev-law').outerHTML.replace(/<input[^>]*type="checkbox"[^>]*>/g, '').replace(/<input[^>]*value="([^"]*)"[^>]*>/g, '$1') + '<h3>' + esc(s.tl) + '</h3>' + $('ev-tl').outerHTML);
    };
    $('ev-ai').onclick = async function () {
      var b = this; b.disabled = true; $('ev-sum').textContent = s.aiing;
      try {
        var stats = { days: evDays, hazards_detected: cnt('alert'), handled: cnt('clear'), risk_assessments: recs.length, worker_signoffs: Object.keys(signs).length, worker_reports: cnt('rep') + cnt('vrep'), native_language_qa: cnt('qa'), fitness_checks: cnt('pvt'), heat_breaks: cnt('heat'), broadcasts: cnt('bc'),
          manual_items_confirmed: s.items.filter(function (it, i) { return manual[i] && manual[i].ok; }).map(function (it) { return it[0]; }), demo_data: !tl.real };
        var txt = await H.ask('You help a small Korean factory document its safety and health duties under the Serious Accidents Punishment Act. Using ONLY the statistics given, write a factual summary (max 150 words) of what the company did, then list the gaps that still need documents. Do not claim legal compliance; do not invent numbers. Write in ' + T({ zh: 'Simplified Chinese', ko: 'Korean', en: 'English' }) + '.', JSON.stringify(stats), 900);
        jset('shk3_px_evsum', txt.trim()); P.render('evidence');
      } catch (e) { $('ev-sum').textContent = e.message === 'NO_LLM' ? T({ zh: '请先点右侧“⚙ 设置”填写大模型', ko: '오른쪽 “⚙ 설정”에서 LLM을 먼저 설정하세요', en: 'Set up an LLM first (⚙ on the right)' }) : '⚠ ' + e.message; b.disabled = false; }
    };
  }

  /* =================== 工具 =================== */
  function dl(name, text, type) { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type })); a.download = name; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000); }
  function printDoc(title, html) {
    var w = window.open('', '_blank'); if (!w) return;
    w.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + esc(title) + '</title><style>body{font-family:"Noto Sans KR","Noto Sans SC",sans-serif;font-size:12px;margin:24px;color:#111}h1{font-size:18px}table{border-collapse:collapse;width:100%;margin:10px 0}th,td{border:1px solid #999;padding:5px 7px;text-align:left;vertical-align:top}th{background:#f0f0f0}.px-pill{font-weight:700}small{color:#555}</style></head><body><h1>' + esc(title) + '</h1>' + html + '<p style="margin-top:20px;font-size:10px;color:#666">SHine-K 3.0 · ' + new Date().toISOString() + '</p></body></html>');
    w.document.close(); setTimeout(function () { try { w.print(); } catch (e) {} }, 400);
  }

  /* =================== 路线图：加入新模块 =================== */
  var RM = {
    zh: [['AI 风险评估表（위험성평가）', 'done', '本平台 · AI 风险评估表', '产安法第 36 条；施行规则第 37 条；重大灾害处罚法施行令第 4 条第 3 号'],
      ['母语 AI 安全员（问答 · 上报 · 广播）', 'done', '本平台 · 母语 AI 安全员', '外国工人 78.9% 在 50 人以下企业；LLM 提取原因更多（AHFE 2025）'],
      ['义务履行证据包', 'done', '本平台 · 义务履行证据包', '重大灾害处罚法（2024-01-27 起 5 人以上适用）']],
    ko: [['AI 위험성평가표', 'done', '플랫폼 · AI 위험성평가', '산안법 제36조; 시행규칙 제37조; 중처법 시행령 제4조 제3호'],
      ['모국어 AI 안전관리자(질의·신고·방송)', 'done', '플랫폼 · 모국어 AI 안전관리자', '외국인 취업자 78.9% 50인 미만; LLM 원인 추출(AHFE 2025)'],
      ['의무 이행 증빙 패키지', 'done', '플랫폼 · 의무 이행 증빙', '중대재해처벌법(2024.1.27부터 5인 이상)']],
    en: [['AI risk assessment (위험성평가)', 'done', 'Platform · AI risk assessment', 'OSH Act Art. 36; Rule Art. 37; SAPA Decree Art. 4(3)'],
      ['Native-language AI officer (Q&A · reports · broadcast)', 'done', 'Platform · Native-language AI officer', '78.9% of migrant workers at <50-staff firms; LLM cause extraction (AHFE 2025)'],
      ['Duty-of-care evidence pack', 'done', 'Platform · Evidence pack', 'Serious Accidents Punishment Act (5+ staff since 27 Jan 2024)']]
  };
  ['zh', 'ko', 'en'].forEach(function (l) { var it = P.STR[l].rm_items; it.splice(0, 0, RM[l][0], RM[l][1], RM[l][2]); P.STR[l].rm_items = it.filter(function (r) { return !/LLM|大模型隐患|원인 분석|root-cause/.test(r[0]); }); });

  /* =================== 注册到侧栏 =================== */
  P.register({ key: 'ra', icon: '📋', bg: 'linear-gradient(135deg,#FFF1E0,#FFD9A8)', cat: 'manage', render: renderRA,
    nav: { zh: ['AI 风险评估表', '险兆 → 위험성평가 · 工人确认'], ko: ['AI 위험성평가', '아차사고 → 위험성평가 · 근로자 확인'], en: ['AI risk assessment', 'Near-misses → 위험성평가 · sign-off'] } });
  P.register({ key: 'lingo', icon: '🌏', bg: 'linear-gradient(135deg,#E0FAF3,#B5F0DE)', cat: 'people', render: renderLingo,
    nav: { zh: ['母语 AI 安全员', '14 种语言 · 语音问答 · 上报'], ko: ['모국어 AI 안전관리자', '14개 언어 · 음성 질의 · 신고'], en: ['Native-language AI officer', '14 languages · voice Q&A · reports'] } });
  P.register({ key: 'evidence', icon: '⚖', bg: 'linear-gradient(135deg,#E9F0FF,#C9DAFF)', cat: 'manage', render: renderEvidence,
    nav: { zh: ['义务履行证据包', '重大灾害处罚法 · 时间线'], ko: ['의무 이행 증빙', '중대재해처벌법 · 타임라인'], en: ['Duty-of-care evidence', 'SAPA · incident timeline'] } });
})();
