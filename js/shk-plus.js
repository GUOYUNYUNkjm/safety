/* SHine-K 3.0 · 预测型功能（平台端）
 * 新增侧栏分组“预测型功能”，七个页面：
 *   1 跌倒前预警（踉跄热点）   2 上岗前适岗测试（PVT 反应时）   3 体感温度合规（韩国 산업안전보건기준에 관한 규칙 제560조）
 *   4 姿势负荷排名（RULA 简化） 5 老龄工人适岗推荐             6 多源交叉验证 · 告警分级
 *   7 研究依据与路线图
 * 数据来源：现场端（live.html + js/shk-plus-field.js）写在本浏览器的记录 + 同一浏览器的实时广播。
 * 没有实测数据时显示固定的演示数据，并明确标注“演示数据”。不改动原有页面逻辑。
 */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function jget(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function lang() {
    var on = function (id) { var e = $(id); return e && e.classList.contains('on'); };
    if (on('app-btn-ko') || on('btn-ko')) return 'ko'; if (on('app-btn-en') || on('btn-en')) return 'en'; return 'zh';
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* =================== 文字 =================== */
  var STR = {
    zh: {
      sec: '预测型功能', home_t: '🧪 预测型功能 · 在事故发生前发现风险', home_d: '别人检测已经发生的事故，我们预测还没发生的事故（每项都有论文依据）', new_: 'NEW', real: '实测', demo: '演示数据', load_demo: '载入演示数据', clear: '清空记录', src_real: '实测：来自现场端 {n} 条记录', src_demo: '演示数据（现场端还没有记录）',
      evid: '研究依据', open_live: '打开现场端 ↗', live_feed: '现场实时事件',
      nav: { nearfall: ['跌倒前预警', '踉跄热点 · 事前干预'], fitcheck: ['上岗前适岗测试', '30 秒反应时 · PVT'], heatlaw: ['体感温度合规', '韩国 33℃ 休息义务 · 计时 · 记录'],
        ergo: ['姿势负荷排名', 'RULA 简化 · 工位排名'], jobfit: ['老龄适岗推荐', '反应 · 踉跄 · 热 · 姿势'], fusion: ['多源验证 · 分级', '摄像头 + 手环 + 声音'], roadmap: ['研究依据与路线图', '论文 · 已实现 · 规划'] },
      // 1
      nf_t: '跌倒前预警 · 险些跌倒热点', nf_s: '别人在摔倒后报警，我们在踉跄时就发现风险：记录每一次踉跄，找出湿滑 / 障碍热点和反复踉跄的工人',
      nf_k1: '近 7 天踉跄', nf_k2: '热点区域', nf_k3: '反复踉跄工人', nf_k4: '平均下沉深度', nf_map: '踉跄热点（画面九宫格）', nf_map_s: '颜色越深 = 次数越多。点格子查看建议',
      nf_rank: '区域排名与处置建议', nf_who: '反复踉跄的工人（7 天 ≥ 2 次）', nf_none: '暂无', nf_c_zone: '区域', nf_c_n: '次数', nf_c_act: '建议',
      nf_a3: '立即检查地面（油污 / 积水 / 线缆 / 台阶），加防滑垫与警示标识', nf_a2: '列入今日巡检重点，确认照明与通道是否通畅', nf_a1: '继续观察',
      nf_w_act: '安排平衡评估；暂停高处、湿滑地面岗位；告知班组长', nf_how: '判断方法：髋部 0.5 秒内突然下沉 ≥ 9% 身高、1.6 秒内恢复站立且没有进入跌倒流程 → 记一次踉跄。只轻声提醒、不拉警报。快速下蹲再站起也可能被记一次。',
      nf_ev: '踉跄、绊倒、失衡比真正跌倒更常见，且与更高的跌倒风险相关（Handelzalts 等，Frontiers in Medicine 2020）；德国 IFA 用 110 名工人的真实险些跌倒数据训练检测模型（Sensors 2025, 25(5):1468）。',
      // 2
      pv_t: '上岗前适岗测试（PVT 反应时）', pv_s: '打卡后 30 秒：看到红圈就点。与本人历史基线比较，判断今天是否适合上岗高风险岗位',
      pv_who: '测试人', pv_dur: '时长', pv_start: '▶ 开始测试', pv_tap: '看到红圈立刻点击（或按空格）', pv_wait: '等待红圈…', pv_early: '太早了！', pv_done: '测试完成',
      pv_med: '中位反应时', pv_lapse: '迟钝次数（≥500ms）', pv_fs: '抢按次数', pv_base: '本人基线', pv_nobase: '首次测试：按通用标准判断',
      pv_ok: '✓ 适岗', pv_warn: '⚠ 注意：今天避免高风险岗位，1 小时后复测', pv_bad: '✕ 建议暂不上高风险岗位，由班组长确认', pv_hist: '最近测试记录', pv_c_t: '时间', pv_c_r: '结果',
      pv_ev: 'PVT（精神运动警觉测试）测反应时和注意力失误，是常用的适岗检测原理；连续轮班会让反应时和平衡能力变差，与白班夜班无关（CDC/NIOSH 护士研究）。这是 30 秒简化版，用于筛查，不是医学诊断。',
      // 3
      hl_t: '体感温度合规 · 韩国高温作业规定', hl_s: '按《산업안전보건기준에 관한 규칙》第560条（2025-07-17 施行）与 고용노동부 폭염 대응 지침：体感温度分级 → 自动休息计时 → 记录导出',
      hl_ta: '气温 ℃', hl_rh: '相对湿度 %', hl_at: '体感温度（韩国气象厅夏季公式）', hl_calc: '计算',
      hl_l0: '正常：注意补水', hl_l1: '≥31℃ 폭염작업：开冷气 / 通风、调整作业时间、提供饮水与阴凉处', hl_l2: '≥33℃：每 2 小时内必须休息 20 分钟以上（义务）', hl_l3: '≥35℃：每小时休息 15 分钟；14–17 时停止室外作业（指南）', hl_l4: '≥38℃：紧急作业以外停止室外作业',
      hl_timer: '休息计时', hl_work: '▶ 开始作业', hl_rest: '☕ 开始休息', hl_end: '✓ 休息结束', hl_left: '距下次强制休息', hl_resting: '休息中，剩余', hl_none_req: '当前体感温度不要求强制休息',
      hl_due: '⏰ 到休息时间了！请所有作业人员休息 {m} 分钟', hl_log: '测量与休息记录（法规要求测量·记录体感温度）', hl_export: '⬇ 导出 CSV', hl_c_t: '时间', hl_c_at: '体感温度', hl_c_a: '动作',
      hl_a_meas: '测量', hl_a_work: '开始作业', hl_a_rest: '开始休息', hl_a_end: '休息结束', hl_eld: '55 岁以上工人（优先休息、优先安排阴凉岗位）',
      hl_ev: '体感温度 31℃ 以上为폭염작업；33℃ 以上每 2 小时内须给 20 分钟以上休息，室内外同样适用，并须测量·记录体感温度。中国现场请用现场端“热应激管理”里的《防暑降温措施管理办法》规则。',
      // 4
      eg_t: '姿势负荷排名 · RULA 简化', eg_s: '现场端用骨架角度给每个人打 1–7 分，按区域 / 工位汇总，先改造分数最高的工位',
      eg_c_z: '区域 / 工位', eg_c_avg: '平均分', eg_c_hi: '≥5 分占比', eg_c_n: '样本', eg_c_lv: '行动等级',
      eg_lv1: '1–2 可接受', eg_lv2: '3–4 需进一步观察', eg_lv3: '5–6 尽快改善', eg_lv4: '7 立即改善',
      eg_how: '算法：上臂（1–4）、前臂（1–2）、颈部（1–3）、躯干（1–4）按 RULA 的角度分档相加，换算到 1–7。单摄像头二维估算，不含手腕、负重、重复动作项，适合工位排名，不用于个人诊断。现场端只显示分数，不报警。',
      eg_ev: '视频 → 3D 姿态 → 自动 REBA 评分（Jiao 等，Ergonomics 2024）；计算机视觉人机工效评估在真实制造现场的验证（Agostinelli 等，Scientific Reports 2024）。',
      // 5
      jf_t: '老龄工人适岗推荐', jf_s: '不只报警：综合反应时、踉跄、热应激和岗位姿势负荷，告诉班组长每位 55+ 工人今天适合做什么、什么时候做',
      jf_c_w: '工人', jf_c_rt: '反应时', jf_c_st: '7 天踉跄', jf_c_heat: '热应激', jf_c_po: '当前岗位负荷', jf_c_fit: '适岗分', jf_c_rec: '今日建议',
      jf_r_st: '平衡评估；避开高处 / 湿滑地面', jf_r_rt: '避开叉车、冲压等需快速反应的岗位；上岗前复测', jf_r_heat: '14–16 时安排室内轻作业，每小时休息', jf_r_po: '换到检验 / 装配等低负荷工位或加辅助工具', jf_r_ok: '可照常作业',
      jf_alert: '告警方式：语音 + 振动 + 灯光三通道', jf_how: '适岗分 = 100 − (0.3×反应风险 + 0.3×踉跄风险 + 0.2×热风险 + 0.2×姿势风险)。没有实测时用演示估计值（标 *）。',
      jf_ev: '年龄增长会削弱认知—动作配合，在负重和双任务时更明显，老年工人的听觉注意和肌肉协调下降（CityU 博士论文，可穿戴传感器研究）；老年工人对可穿戴数据（尤其是精神状态数据）的隐私顾虑更高（CIB 2025）。',
      // 6
      fu_t: '多源交叉验证 · 告警分级', fu_s: '摄像头、手环、声音三路互相确认：两路一致立即升级到 119；手环显示仍在活动 → 标记疑似误报。不同事件发给不同的人，避免“狼来了”',
      fu_k1: '双源确认', fu_k2: '仅摄像头', fu_k3: '判为疑似误报', fu_k4: '少发的 119 联动', fu_tiers: '告警分级：谁收到什么',
      fu_t1: '① 工人本人（语音 / 振动）', fu_t1d: '踉跄、姿势负荷、心率偏高、首次未戴安全帽',
      fu_t2: '② 班组长 / 管理员', fu_t2d: '防护用品持续违规、无作业票进入危险区、人车接近（潜在）、手环未佩戴',
      fu_t3: '③ 立即停机', fu_t3d: '手进入机器危险点、人车接近（危险）',
      fu_t4: '④ 119 / 120 联动', fu_t4d: '跌倒无回应、双源确认跌倒、SOS（手势 / 语音呼救）、疑似晕倒',
      fu_flow: '判断流程', fu_how: '摄像头判断跌倒后：手环 6 秒内有撞击 / 心率“停止作业”，或听到巨响 / 呼救 → 双源确认，立即红色警报；手环显示仍在正常活动 → 标记为疑似误报、不提前升级（原有语音询问照常）；没有佩戴手环 → 按原有流程（5 秒询问、12 秒无回应升级）。',
      fu_ev: '告警过多会造成告警疲劳，工人会习惯性关掉系统或忽略告警（Chan 等，Sensors 2020）；视频与加速度在决策层融合可以互补、降低不确定性（Gong 等，Automation in Construction 2025）。',
      // 7
      rm_t: '研究依据与路线图', rm_s: '每个功能对应的论文和实现位置',
      rm_done: '已实现', rm_demo: '演示', rm_plan: '规划中', rm_where: '在哪里看',
      rm_items: [
        ['跌倒前预警（踉跄）', 'done', '现场端 · 预测型功能卡片', 'Handelzalts 2020；IFA Prev-Fall 2025'],
        ['机器危险点：手进入即停机', 'done', '现场端 · ✋ 机器危险点', 'Michigan Tech 2026 钻床 YOLO 断电；MediaPipe Hands 圆锯防护'],
        ['人–车接近四级预警', 'done', '现场端（PPE 模型的车辆 / 机械框）', '单目 2D 摄像头接近监测，arXiv 2305.17931'],
        ['声音：呼救关键词 + 巨响', 'done', '现场端 · 🎤 声音监听', '穿戴式声音传感器识别滑倒 / 绊倒（Buildings 2025, 15(17):3136）'],
        ['多源交叉验证 · 告警分级', 'done', '本平台 · 多源验证', 'Chan 2020（告警疲劳）；Gong 2025（决策层融合）'],
        ['姿势负荷 RULA 简化', 'done', '现场端标签 + 本平台排名', 'Jiao 2024 Ergonomics；Agostinelli 2024 Sci Rep'],
        ['上岗前适岗测试 PVT', 'done', '本平台 · 上岗前适岗测试', 'PVT 原理；CDC/NIOSH 轮班与反应时研究'],
        ['体感温度合规（韩国）', 'done', '本平台 · 体感温度合规', '산업안전보건기준에 관한 규칙 제560조（2025）'],
        ['老龄工人适岗推荐', 'done', '本平台 · 老龄工人适岗推荐', 'CityU 认知—动作研究；CIB 2025 隐私研究'],
        ['心理压力（HRV）团队级统计', 'plan', '需要输出 RR 间期的心率带', '压力与不安全行为高度相关（ISARC 2020）；手环式压力监测（Jebelli）'],
        ['视觉大模型问答 / 组合隐患复核', 'plan', 'AI 安全助手已支持文本大模型', '现场部署识别违规约 90%（ICCBEI 2025）'],
        ['大模型隐患根因分析（多语言）', 'plan', 'AI 安全助手 + 隐患上报', 'LLM 提取的原因更多更全（AHFE 2025）'],
        ['UWB 精准定位 + 数字孪生', 'demo', 'twin.html（三维示意布局）', 'UWB + 摄像头定位接入数字孪生（IEEE Access 2024）']
      ]
    },
    ko: {
      sec: '예측형 기능', home_t: '🧪 예측형 기능 · 사고 전에 위험 찾기', home_d: '다른 시스템은 이미 일어난 사고를 감지하고, 우리는 아직 일어나지 않은 사고를 예측합니다(기능마다 논문 근거)', new_: 'NEW', real: '실측', demo: '데모 데이터', load_demo: '데모 데이터 불러오기', clear: '기록 지우기', src_real: '실측: 현장 화면 기록 {n}건', src_demo: '데모 데이터(현장 기록 없음)',
      evid: '연구 근거', open_live: '현장 화면 열기 ↗', live_feed: '현장 실시간 이벤트',
      nav: { nearfall: ['넘어짐 사전 경보', '휘청 핫스팟 · 사전 개입'], fitcheck: ['작업 전 적합성 검사', '30초 반응시간 · PVT'], heatlaw: ['체감온도 준수', '33℃ 휴식 의무 · 타이머 · 기록'],
        ergo: ['자세 부담 순위', 'RULA 간이 · 공정 순위'], jobfit: ['고령 적합 배치', '반응 · 휘청 · 열 · 자세'], fusion: ['다중 검증 · 등급', '카메라 + 밴드 + 소리'], roadmap: ['연구 근거와 로드맵', '논문 · 구현 · 계획'] },
      nf_t: '넘어짐 사전 경보 · 아차 넘어짐 핫스팟', nf_s: '다른 시스템은 넘어진 뒤 경보하지만, 우리는 휘청할 때 위험을 찾습니다: 휘청을 기록해 미끄럼·장애물 핫스팟과 반복 휘청 근로자를 찾습니다',
      nf_k1: '최근 7일 휘청', nf_k2: '핫스팟 구역', nf_k3: '반복 휘청 근로자', nf_k4: '평균 하강 깊이', nf_map: '휘청 핫스팟(화면 9칸)', nf_map_s: '진할수록 많음. 칸을 누르면 조치 안내',
      nf_rank: '구역 순위와 조치', nf_who: '반복 휘청 근로자(7일 2회 이상)', nf_none: '없음', nf_c_zone: '구역', nf_c_n: '횟수', nf_c_act: '조치',
      nf_a3: '즉시 바닥 점검(기름·물·케이블·단차), 미끄럼 방지 매트와 표지 설치', nf_a2: '오늘 순회 점검 중점, 조명·통로 확인', nf_a1: '관찰 유지',
      nf_w_act: '균형 평가; 고소·미끄러운 바닥 작업 일시 중지; 반장에게 알림', nf_how: '판단: 엉덩이가 0.5초 안에 키의 9% 이상 갑자기 내려갔다가 1.6초 안에 다시 서고 넘어짐 절차에 들어가지 않음 → 휘청 1회. 조용히 안내만 하고 경보는 울리지 않습니다. 빠르게 앉았다 일어나도 1회로 기록될 수 있습니다.',
      nf_ev: '휘청·걸려 넘어질 뻔함은 실제 넘어짐보다 흔하고 높은 넘어짐 위험과 관련됩니다(Handelzalts 등, Frontiers in Medicine 2020). 독일 IFA는 근로자 110명의 실제 아차 넘어짐 데이터로 감지 모델을 학습했습니다(Sensors 2025, 25(5):1468).',
      pv_t: '작업 전 적합성 검사(PVT 반응시간)', pv_s: '출근 체크 후 30초: 빨간 원이 보이면 누르세요. 본인 기준값과 비교해 오늘 고위험 작업이 적합한지 판단합니다',
      pv_who: '검사자', pv_dur: '시간', pv_start: '▶ 검사 시작', pv_tap: '빨간 원이 보이면 즉시 클릭(또는 스페이스)', pv_wait: '빨간 원을 기다리세요…', pv_early: '너무 빨라요!', pv_done: '검사 완료',
      pv_med: '중앙 반응시간', pv_lapse: '지연 횟수(≥500ms)', pv_fs: '먼저 누름', pv_base: '본인 기준', pv_nobase: '첫 검사: 일반 기준으로 판단',
      pv_ok: '✓ 작업 적합', pv_warn: '⚠ 주의: 오늘 고위험 작업 피하고 1시간 후 재검사', pv_bad: '✕ 고위험 작업 보류, 반장 확인 필요', pv_hist: '최근 검사 기록', pv_c_t: '시간', pv_c_r: '결과',
      pv_ev: 'PVT(정신운동 각성 검사)는 반응시간과 주의 실수를 측정하는 대표적 적합성 검사 원리입니다. 연속 교대근무는 주·야간과 관계없이 반응시간과 균형을 떨어뜨립니다(CDC/NIOSH 간호사 연구). 30초 간이판으로 선별용이며 의학적 진단이 아닙니다.',
      hl_t: '체감온도 준수 · 폭염 규정', hl_s: '「산업안전보건기준에 관한 규칙」 제560조(2025.7.17 시행)와 고용노동부 폭염 대응 지침: 체감온도 단계 → 휴식 타이머 → 기록 내보내기',
      hl_ta: '기온 ℃', hl_rh: '상대습도 %', hl_at: '체감온도(기상청 여름철 공식)', hl_calc: '계산',
      hl_l0: '정상: 물 자주 마시기', hl_l1: '31℃ 이상 폭염작업: 냉방·통풍, 작업시간 조정, 물·그늘 제공', hl_l2: '33℃ 이상: 2시간 이내 20분 이상 휴식(의무)', hl_l3: '35℃ 이상: 매시간 15분 휴식, 14–17시 옥외작업 중지(지침)', hl_l4: '38℃ 이상: 긴급 작업 외 옥외작업 중지',
      hl_timer: '휴식 타이머', hl_work: '▶ 작업 시작', hl_rest: '☕ 휴식 시작', hl_end: '✓ 휴식 종료', hl_left: '다음 의무 휴식까지', hl_resting: '휴식 중, 남은 시간', hl_none_req: '현재 체감온도에서는 의무 휴식 없음',
      hl_due: '⏰ 휴식 시간입니다! 모든 작업자는 {m}분 휴식하세요', hl_log: '측정·휴식 기록(체감온도 측정·기록 의무)', hl_export: '⬇ CSV 내보내기', hl_c_t: '시간', hl_c_at: '체감온도', hl_c_a: '조치',
      hl_a_meas: '측정', hl_a_work: '작업 시작', hl_a_rest: '휴식 시작', hl_a_end: '휴식 종료', hl_eld: '55세 이상 근로자(휴식 우선, 그늘 작업 우선 배치)',
      hl_ev: '체감온도 31℃ 이상은 폭염작업, 33℃ 이상이면 2시간 이내 20분 이상 휴식을 줘야 하며 실내·실외 모두 적용되고 체감온도 측정·기록 의무가 있습니다. 중국 현장은 현장 화면의 열스트레스 관리(중국 기준)를 사용하세요.',
      eg_t: '자세 부담 순위 · RULA 간이', eg_s: '현장 화면이 골격 각도로 1–7점을 매기고 구역·공정별로 모읍니다. 점수가 높은 공정부터 개선하세요',
      eg_c_z: '구역 / 공정', eg_c_avg: '평균', eg_c_hi: '5점 이상 비율', eg_c_n: '표본', eg_c_lv: '조치 수준',
      eg_lv1: '1–2 허용', eg_lv2: '3–4 추가 관찰', eg_lv3: '5–6 빠른 개선', eg_lv4: '7 즉시 개선',
      eg_how: '상완(1–4)·전완(1–2)·목(1–3)·몸통(1–4)을 RULA 각도 구간으로 합산해 1–7로 환산. 단일 카메라 2D 추정이며 손목·중량·반복 항목은 없습니다. 공정 순위용이며 개인 진단용이 아닙니다. 현장에서는 점수만 표시하고 경보는 없습니다.',
      eg_ev: '영상 → 3D 자세 → 자동 REBA 점수(Jiao 등, Ergonomics 2024); 실제 제조 현장에서의 컴퓨터비전 인간공학 평가 검증(Agostinelli 등, Scientific Reports 2024).',
      jf_t: '고령 근로자 적합 배치', jf_s: '경보만이 아니라 반응시간·휘청·열스트레스·공정 자세 부담을 종합해 55세 이상 근로자에게 오늘 맞는 작업과 시간을 제안합니다',
      jf_c_w: '근로자', jf_c_rt: '반응시간', jf_c_st: '7일 휘청', jf_c_heat: '열스트레스', jf_c_po: '현재 공정 부담', jf_c_fit: '적합 점수', jf_c_rec: '오늘 제안',
      jf_r_st: '균형 평가; 고소·미끄러운 바닥 피하기', jf_r_rt: '지게차·프레스 등 빠른 반응 작업 피하기; 작업 전 재검사', jf_r_heat: '14–16시 실내 가벼운 작업, 매시간 휴식', jf_r_po: '검사·조립 등 저부담 공정으로 이동 또는 보조도구', jf_r_ok: '평소대로 작업 가능',
      jf_alert: '알림 방식: 음성 + 진동 + 조명 3채널', jf_how: '적합 점수 = 100 − (0.3×반응 위험 + 0.3×휘청 위험 + 0.2×열 위험 + 0.2×자세 위험). 실측이 없으면 데모 추정값(*)을 사용합니다.',
      jf_ev: '나이가 들수록 인지-운동 협응이 떨어지며 중량·이중과제에서 더 뚜렷하고, 고령 근로자는 청각 주의와 근육 협응이 저하됩니다(CityU 박사논문). 고령 근로자는 웨어러블 데이터(특히 정신 상태 데이터)에 대한 프라이버시 우려가 더 큽니다(CIB 2025).',
      fu_t: '다중 검증 · 경보 등급', fu_s: '카메라·밴드·소리가 서로 확인: 두 가지가 일치할 때만 119로 격상, 밴드가 정상 활동이면 오경보 의심으로 표시. 사건별로 받는 사람을 나눠 "양치기 소년"을 막습니다',
      fu_k1: '이중 확인', fu_k2: '카메라만', fu_k3: '오경보 의심', fu_k4: '줄어든 119 연계', fu_tiers: '경보 등급: 누가 무엇을 받나',
      fu_t1: '① 근로자 본인(음성·진동)', fu_t1d: '휘청, 자세 부담, 심박 높음, 첫 안전모 미착용',
      fu_t2: '② 반장 / 관리자', fu_t2d: '보호구 지속 위반, 작업허가 없이 위험구역 진입, 차량 접근(잠재), 밴드 미착용',
      fu_t3: '③ 즉시 기계 정지', fu_t3d: '손이 기계 위험점 진입, 차량 접근(위험)',
      fu_t4: '④ 119 / 응급 연계', fu_t4d: '넘어짐 무응답, 이중 확인 넘어짐, SOS(손짓·음성), 실신 의심',
      fu_flow: '판단 흐름', fu_how: '카메라가 넘어짐을 판단하면: 6초 안에 밴드 충격/심박 "작업 중지" 또는 큰 소리/구조 요청 → 이중 확인, 즉시 적색 경보. 밴드가 정상 활동 → 오경보 의심으로 표시하고 앞당겨 격상하지 않음(기존 음성 질문은 그대로). 밴드 미착용 → 기존 절차(5초 질문, 12초 무응답 격상).',
      fu_ev: '경보가 많으면 경보 피로로 근로자가 시스템을 끄거나 무시합니다(Chan 등, Sensors 2020). 영상과 가속도를 결정 단계에서 융합하면 서로 보완해 불확실성을 줄입니다(Gong 등, Automation in Construction 2025).',
      rm_t: '연구 근거와 로드맵', rm_s: '기능별 논문과 구현 위치', rm_done: '구현', rm_demo: '데모', rm_plan: '계획', rm_where: '위치',
      rm_items: [
        ['넘어짐 사전 경보(휘청)', 'done', '현장 화면 · 예측형 기능 카드', 'Handelzalts 2020; IFA Prev-Fall 2025'],
        ['기계 위험점: 손 진입 시 정지', 'done', '현장 화면 · ✋ 기계 위험점', 'Michigan Tech 2026 드릴 YOLO 차단; MediaPipe Hands 원형톱 보호'],
        ['사람–차량 접근 4단계', 'done', '현장 화면(PPE 모델 차량/기계)', '단안 2D 카메라 접근 감시, arXiv 2305.17931'],
        ['소리: 구조 요청 + 큰 소리', 'done', '현장 화면 · 🎤 소리 감지', '웨어러블 소리 센서로 미끄러짐/걸림 감지(Buildings 2025)'],
        ['다중 검증 · 경보 등급', 'done', '플랫폼 · 다중 검증', 'Chan 2020(경보 피로); Gong 2025(결정 융합)'],
        ['자세 부담 RULA 간이', 'done', '현장 라벨 + 플랫폼 순위', 'Jiao 2024 Ergonomics; Agostinelli 2024 Sci Rep'],
        ['작업 전 적합성 검사 PVT', 'done', '플랫폼 · 작업 전 검사', 'PVT 원리; CDC/NIOSH 교대·반응시간 연구'],
        ['체감온도 준수(한국)', 'done', '플랫폼 · 체감온도 준수', '산업안전보건기준에 관한 규칙 제560조(2025)'],
        ['고령 근로자 적합 배치', 'done', '플랫폼 · 고령 적합 배치', 'CityU 인지-운동 연구; CIB 2025 프라이버시'],
        ['심리 스트레스(HRV) 팀 단위', 'plan', 'RR 간격 출력 심박벨트 필요', '스트레스와 불안전 행동 연관(ISARC 2020)'],
        ['비전-언어 모델 질의 / 복합 위험 검토', 'plan', 'AI 안전 도우미(텍스트 LLM 지원)', '현장 배치 위반 인식 약 90%(ICCBEI 2025)'],
        ['LLM 위험 보고 원인 분석(다국어)', 'plan', 'AI 도우미 + 위험 보고', 'LLM이 더 많은 원인 추출(AHFE 2025)'],
        ['UWB 정밀 위치 + 디지털 트윈', 'demo', 'twin.html(3D 개략 배치)', 'UWB + 카메라 위치를 디지털 트윈에(IEEE Access 2024)']
      ]
    },
    en: {
      sec: 'Predictive', home_t: '🧪 Predictive features · catch risk before the accident', home_d: 'Others detect accidents that happened; we predict the ones that haven\'t (each backed by research)', new_: 'NEW', real: 'Live', demo: 'Demo data', load_demo: 'Load demo data', clear: 'Clear records', src_real: 'Live: {n} records from the field app', src_demo: 'Demo data (no field records yet)',
      evid: 'Evidence', open_live: 'Open field app ↗', live_feed: 'Live field events',
      nav: { nearfall: ['Near-fall early warning', 'Stumble hotspots · act early'], fitcheck: ['Pre-shift fitness check', '30-s reaction · PVT'], heatlaw: ['Heat-law compliance', 'KR 33 °C break duty · timer · log'],
        ergo: ['Posture load ranking', 'Simplified RULA · stations'], jobfit: ['Older-worker fit', 'Reaction · stumbles · heat · posture'], fusion: ['Cross-check · tiers', 'Camera + band + sound'], roadmap: ['Evidence & roadmap', 'Papers · built · planned'] },
      nf_t: 'Near-fall early warning · stumble hotspots', nf_s: 'Others alarm after the fall; we catch the stumble. Every stumble is logged to find slippery / obstacle hotspots and workers who stumble repeatedly',
      nf_k1: 'Stumbles (7 days)', nf_k2: 'Hotspots', nf_k3: 'Repeat stumblers', nf_k4: 'Avg dip depth', nf_map: 'Stumble hotspots (3×3 view grid)', nf_map_s: 'Darker = more. Click a cell for advice',
      nf_rank: 'Zone ranking & actions', nf_who: 'Repeat stumblers (≥2 in 7 days)', nf_none: 'None', nf_c_zone: 'Zone', nf_c_n: 'Count', nf_c_act: 'Action',
      nf_a3: 'Inspect the floor now (oil, water, cables, steps); add anti-slip mats and signs', nf_a2: 'Add to today\'s inspection; check lighting and walkways', nf_a1: 'Keep watching',
      nf_w_act: 'Balance assessment; pause work at height / on wet floors; tell the team leader', nf_how: 'Rule: hip drops ≥9% of body height within 0.5 s, the person is standing again within 1.6 s and no fall sequence started → one stumble. Gentle voice prompt only, no alarm. A quick squat-and-stand may also count.',
      nf_ev: 'Trips, slips and losses of balance are more frequent than falls and are linked to higher fall risk (Handelzalts et al., Frontiers in Medicine 2020); Germany\'s IFA trained near-fall detectors on real near-falls from 110 workers (Sensors 2025, 25(5):1468).',
      pv_t: 'Pre-shift fitness check (PVT reaction time)', pv_s: '30 s after clock-in: tap when the red circle appears. Compared with the worker\'s own baseline to decide if high-risk work is OK today',
      pv_who: 'Worker', pv_dur: 'Length', pv_start: '▶ Start test', pv_tap: 'Tap (or press Space) as soon as the red circle appears', pv_wait: 'Wait for the red circle…', pv_early: 'Too early!', pv_done: 'Test finished',
      pv_med: 'Median reaction', pv_lapse: 'Lapses (≥500 ms)', pv_fs: 'False starts', pv_base: 'Own baseline', pv_nobase: 'First test: judged by general limits',
      pv_ok: '✓ Fit for duty', pv_warn: '⚠ Caution: avoid high-risk tasks today, retest in 1 h', pv_bad: '✕ Hold off high-risk tasks; team leader to confirm', pv_hist: 'Recent tests', pv_c_t: 'Time', pv_c_r: 'Result',
      pv_ev: 'The psychomotor vigilance test (PVT) measures reaction time and attention lapses and underlies most fitness-for-duty tests; successive shifts impair reaction time and balance regardless of day or night shift (CDC/NIOSH nurse study). This 30-s version is a screen, not a medical diagnosis.',
      hl_t: 'Heat-law compliance · Korea', hl_s: 'Korean OSH Standards Rule Art. 560 (in force 17 Jul 2025) and MoEL heat guidance: feels-like level → break timer → exportable log',
      hl_ta: 'Air temp °C', hl_rh: 'Rel. humidity %', hl_at: 'Feels-like temperature (KMA summer formula)', hl_calc: 'Calculate',
      hl_l0: 'Normal: keep drinking water', hl_l1: '≥31 °C heat work: cooling / ventilation, adjust hours, water and shade', hl_l2: '≥33 °C: at least 20 min break within every 2 h (mandatory)', hl_l3: '≥35 °C: 15 min break every hour; stop outdoor work 14–17 h (guidance)', hl_l4: '≥38 °C: stop all outdoor work except emergencies',
      hl_timer: 'Break timer', hl_work: '▶ Start work', hl_rest: '☕ Start break', hl_end: '✓ End break', hl_left: 'Until next mandatory break', hl_resting: 'On break, remaining', hl_none_req: 'No mandatory break at this feels-like level',
      hl_due: '⏰ Break time! All workers rest for {m} min', hl_log: 'Measurement & break log (feels-like must be measured and recorded)', hl_export: '⬇ Export CSV', hl_c_t: 'Time', hl_c_at: 'Feels-like', hl_c_a: 'Action',
      hl_a_meas: 'Measured', hl_a_work: 'Work started', hl_a_rest: 'Break started', hl_a_end: 'Break ended', hl_eld: 'Workers 55+ (rest first, assign shaded tasks first)',
      hl_ev: 'Feels-like ≥31 °C is heat work; at ≥33 °C employers must give ≥20 min rest within every 2 h, indoors and outdoors, and must measure and record the feels-like temperature. For sites in China, use the field app\'s heat module (Chinese rules).',
      eg_t: 'Posture load ranking · simplified RULA', eg_s: 'The field app scores everyone 1–7 from skeleton angles and aggregates by zone / station — fix the highest first',
      eg_c_z: 'Zone / station', eg_c_avg: 'Average', eg_c_hi: 'Share ≥5', eg_c_n: 'Samples', eg_c_lv: 'Action level',
      eg_lv1: '1–2 acceptable', eg_lv2: '3–4 investigate', eg_lv3: '5–6 change soon', eg_lv4: '7 change now',
      eg_how: 'Upper arm (1–4), lower arm (1–2), neck (1–3) and trunk (1–4) are banded like RULA, summed and mapped to 1–7. Single-camera 2D estimate without wrist, load or repetition terms: for ranking stations, not diagnosing people. The field app shows the score but never alarms on it.',
      eg_ev: 'Video → 3D pose → automatic REBA score (Jiao et al., Ergonomics 2024); validation of computer-vision ergonomic assessment on real manufacturing lines (Agostinelli et al., Scientific Reports 2024).',
      jf_t: 'Older-worker job fit', jf_s: 'Beyond alarms: combine reaction time, stumbles, heat and the job\'s posture load to tell team leaders what each 55+ worker should do today — and when',
      jf_c_w: 'Worker', jf_c_rt: 'Reaction', jf_c_st: 'Stumbles 7d', jf_c_heat: 'Heat', jf_c_po: 'Job load', jf_c_fit: 'Fit score', jf_c_rec: 'Today',
      jf_r_st: 'Balance check; avoid height / wet floors', jf_r_rt: 'Avoid forklift, press and other fast-reaction jobs; retest before shift', jf_r_heat: 'Indoor light work 14–16 h; hourly breaks', jf_r_po: 'Move to inspection / assembly or add assist tools', jf_r_ok: 'Normal duties',
      jf_alert: 'Alerts: voice + vibration + light', jf_how: 'Fit = 100 − (0.3×reaction risk + 0.3×stumble risk + 0.2×heat risk + 0.2×posture risk). Without live data, demo estimates are used (marked *).',
      jf_ev: 'Ageing weakens cognitive–motor interaction, especially under load and dual tasks; older workers show lower auditory attention and muscle coordination (CityU doctoral thesis, wearable sensors). Older workers have higher privacy concerns about wearable data, especially mental-state data (CIB 2025).',
      fu_t: 'Cross-check · alert tiers', fu_s: 'Camera, band and sound confirm each other: only two agreeing sources escalate to 119; a band showing normal movement marks a likely false alarm. Each event goes to the right person — no "cry wolf"',
      fu_k1: 'Two-source confirmed', fu_k2: 'Camera only', fu_k3: 'Likely false alarms', fu_k4: '119 calls avoided', fu_tiers: 'Alert tiers: who gets what',
      fu_t1: '① Worker (voice / vibration)', fu_t1d: 'Stumble, posture load, high heart rate, first missing helmet',
      fu_t2: '② Team leader / manager', fu_t2d: 'Persistent PPE violation, entering a danger zone without a permit, vehicle nearby (potential), band not worn',
      fu_t3: '③ Stop the machine', fu_t3d: 'Hand in machine danger point, vehicle too close (danger)',
      fu_t4: '④ 119 / emergency', fu_t4d: 'Fall with no response, two-source confirmed fall, SOS (gesture / voice), suspected collapse',
      fu_flow: 'Decision flow', fu_how: 'When the camera sees a fall: band impact or heart-rate "stop work" within 6 s, or a loud sound / call for help → two-source confirmed, red alert now. Band shows normal movement → marked as likely false alarm, not escalated early (the usual voice check still runs). No band → original flow (ask at 5 s, escalate after 12 s without response).',
      fu_ev: 'Too many alarms cause alarm fatigue: workers disable the system or ignore warnings (Chan et al., Sensors 2020); decision-level fusion of video and acceleration reduces uncertainty (Gong et al., Automation in Construction 2025).',
      rm_t: 'Evidence & roadmap', rm_s: 'Paper behind each feature and where to see it', rm_done: 'Built', rm_demo: 'Demo', rm_plan: 'Planned', rm_where: 'Where',
      rm_items: [
        ['Near-fall early warning (stumbles)', 'done', 'Field app · Predictive card', 'Handelzalts 2020; IFA Prev-Fall 2025'],
        ['Machine danger point: hand in → stop', 'done', 'Field app · ✋ Machine danger point', 'Michigan Tech 2026 drill-press YOLO cut-off; MediaPipe Hands saw guard'],
        ['Person–vehicle proximity, 4 levels', 'done', 'Field app (PPE model vehicle / machinery)', 'Monocular 2D proximity monitoring, arXiv 2305.17931'],
        ['Sound: help keywords + loud bang', 'done', 'Field app · 🎤 Listen', 'Wearable sound sensors detect slips / trips (Buildings 2025)'],
        ['Cross-check · alert tiers', 'done', 'Platform · Cross-check', 'Chan 2020 (alarm fatigue); Gong 2025 (fusion)'],
        ['Posture load, simplified RULA', 'done', 'Field label + platform ranking', 'Jiao 2024 Ergonomics; Agostinelli 2024 Sci Rep'],
        ['Pre-shift PVT', 'done', 'Platform · Pre-shift check', 'PVT principle; CDC/NIOSH shift-work studies'],
        ['Heat-law compliance (Korea)', 'done', 'Platform · Heat-law', 'Korean OSH Standards Rule Art. 560 (2025)'],
        ['Older-worker job fit', 'done', 'Platform · Job fit', 'CityU cognitive–motor study; CIB 2025 privacy'],
        ['Stress (HRV), team level only', 'plan', 'Needs an HR strap that sends RR intervals', 'Stress linked to unsafe behaviour (ISARC 2020)'],
        ['Vision-language Q&A / compound hazards', 'plan', 'AI assistant already supports text LLMs', '~90% violation accuracy on a real site (ICCBEI 2025)'],
        ['LLM root-cause analysis (multilingual)', 'plan', 'AI assistant + hazard reports', 'LLMs extract more, more diverse causes (AHFE 2025)'],
        ['UWB positioning + digital twin', 'demo', 'twin.html (schematic 3D layout)', 'UWB + camera positions into a digital twin (IEEE Access 2024)']
      ]
    }
  };
  function S() { return STR[lang()]; }

  var NAV = [['nearfall', '🦶', 'linear-gradient(135deg,#FFF6D6,#FFE08A)', 'real'], ['fitcheck', '⏱', 'linear-gradient(135deg,#E9F0FF,#C9DAFF)', 'people'],
    ['heatlaw', '🌡', 'linear-gradient(135deg,#FFE8EC,#FFC7D1)', 'watch'], ['ergo', '🧍', 'linear-gradient(135deg,#E0FAF3,#B5F0DE)', 'real'],
    ['jobfit', '👴', 'linear-gradient(135deg,#F3EFFE,#DED2FC)', 'people'], ['fusion', '🔗', 'linear-gradient(135deg,#E0F7FC,#B4ECF7)', 'real'],
    ['roadmap', '📚', 'linear-gradient(135deg,#F1F4F8,#DCE3EC)', 'manage']];
  var ID = function (k) { return 'px' + k; };     // 面板 id：panel-pxnearfall …

  /* =================== 样式 =================== */
  var css = document.createElement('style');
  css.textContent = [
    '.px-src{display:inline-flex;gap:6px;align-items:center;font-size:.72rem;font-weight:800;padding:5px 11px;border-radius:20px;background:var(--wbg);color:var(--w)}',
    '.px-src.real{background:var(--gbg);color:var(--g)}',
    '.px-ev{margin-top:16px;padding:12px 14px;border-radius:12px;background:var(--abg);color:var(--ink2);font-size:.78rem;line-height:1.6}',
    '.px-ev b{color:var(--a)}',
    '.px-how{font-size:.76rem;color:var(--ink3);line-height:1.6;margin-top:10px}',
    '.px-t{width:100%;border-collapse:collapse;font-size:.82rem}.px-t th{text-align:left;color:var(--ink4);font-size:.72rem;font-weight:800;padding:8px 10px;border-bottom:1px solid var(--bdr)}',
    '.px-t td{padding:9px 10px;border-bottom:1px solid var(--bg2);vertical-align:top}',
    '.px-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;aspect-ratio:16/9;max-width:520px}',
    '.px-cell{border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:900;font-size:1.3rem;cursor:pointer;border:1px solid var(--bdr);transition:.2s}',
    '.px-cell small{font-size:.66rem;font-weight:700;opacity:.8}',
    '.px-cell:hover{transform:scale(1.03)}',
    '.px-btn{display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:10px;font-weight:800;font-size:.84rem;background:var(--a);color:#fff}',
    '.px-btn.g{background:var(--bg2);color:var(--ink2)}.px-btn.w{background:var(--w)}.px-btn:disabled{opacity:.45;cursor:not-allowed}',
    '.px-in{padding:8px 10px;border:1px solid var(--bdr);border-radius:9px;font:inherit;font-size:.86rem;background:#fff}',
    '.px-pvt{height:300px;border-radius:16px;background:#0B1220;display:flex;align-items:center;justify-content:center;color:#9aa7c2;font-weight:800;font-size:1rem;cursor:pointer;user-select:none;position:relative;text-align:center;padding:20px}',
    '.px-pvt .dot{width:120px;height:120px;border-radius:50%;background:#E8133A;box-shadow:0 0 40px rgba(232,19,58,.7)}',
    '.px-big{font-size:2.4rem;font-weight:900;letter-spacing:-1px;font-variant-numeric:tabular-nums}',
    '.px-lv{padding:14px 16px;border-radius:14px;font-weight:800;font-size:.95rem}',
    '.px-tier{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}@media(max-width:1000px){.px-tier{grid-template-columns:1fr 1fr}}',
    '.px-tier>div{border-radius:14px;padding:14px;border:1px solid var(--bdr);background:#fff}.px-tier b{display:block;font-size:.86rem;margin-bottom:6px}.px-tier span{font-size:.76rem;color:var(--ink3);line-height:1.55}',
    '.px-flow{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-weight:800;font-size:.84rem}.px-flow i{font-style:normal;padding:8px 12px;border-radius:10px;background:var(--bg2)}.px-flow em{font-style:normal;color:var(--ink4)}',
    '.px-feed{max-height:220px;overflow:auto;font-size:.78rem}.px-feed div{padding:6px 0;border-bottom:1px solid var(--bg2)}',
    '.px-pill{display:inline-block;padding:2px 9px;border-radius:12px;font-size:.7rem;font-weight:800}',
    '.px-bar{height:8px;border-radius:5px;background:var(--bg2);overflow:hidden;min-width:80px}.px-bar>i{display:block;height:100%}',
    '.sb-item .px-newtag{margin-left:auto;font-size:.6rem;font-weight:900;color:#fff;background:linear-gradient(135deg,#FF6B00,#E8133A);padding:2px 6px;border-radius:6px}',
    '.shk-card .px-ribbon{position:absolute;top:8px;right:8px;font-size:.62rem;font-weight:900;color:#fff;background:linear-gradient(135deg,#FF6B00,#E8133A);padding:2px 7px;border-radius:6px}'
  ].join('\n');
  document.head.appendChild(css);

  /* =================== 侧栏 + 面板 =================== */
  function build() {
    var aside = $('sidebar'), pc = $('pageContent');
    if (!aside || !pc || $('px-sb-sec')) return !!$('px-sb-sec');
    var foot = aside.querySelector('.sb-footer');
    var anchor = $('ent-sb-sec') || foot;            // 放在“系统管理”分组之前
    var sec = document.createElement('div'); sec.className = 'sb-section'; sec.id = 'px-sb-sec';
    aside.insertBefore(sec, anchor);
    NAV.forEach(function (n) {
      var it = document.createElement('div'); it.className = 'sb-item'; it.id = 'sb-' + ID(n[0]); it.setAttribute('role', 'button'); it.tabIndex = 0;
      it.innerHTML = '<span style="width:20px;text-align:center">' + n[1] + '</span><span class="sb-item-label" id="px-sbl-' + n[0] + '"></span>' + (n[0] !== 'roadmap' ? '<span class="px-newtag">NEW</span>' : '');
      it.onclick = function () { window.showPanel(ID(n[0])); };
      it.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.showPanel(ID(n[0])); } });
      aside.insertBefore(it, anchor);
      var p = document.createElement('div'); p.className = 'panel'; p.id = 'panel-' + ID(n[0]); pc.appendChild(p);
      new MutationObserver(function () { if (p.classList.contains('active') && !p.dataset.on) { p.dataset.on = '1'; render(n[0]); } else if (!p.classList.contains('active')) p.dataset.on = ''; })
        .observe(p, { attributes: true, attributeFilter: ['class'] });
    });
    labels();
    return true;
  }
  function labels() {
    var s = S(); if ($('px-sb-sec')) $('px-sb-sec').textContent = '🧪 ' + s.sec;
    NAV.forEach(function (n) { var e = $('px-sbl-' + n[0]); if (e) e.textContent = s.nav[n[0]][0]; });
    // 修正后的演示文字（原页面只有中文）
    var fix = {
      zh: ['📲 已通知班组长（违规不联动119）', '体感温度 ≥33°C：每2小时休息20分钟'],
      ko: ['📲 반장에게 알림(위반은 119 연계 안 함)', '체감온도 33°C 이상: 2시간마다 20분 휴식'],
      en: ['📲 Team leader notified (no 119 for violations)', 'Feels-like ≥33 °C: 20-min break every 2 h']
    }[lang()];
    if ($('sos-btn')) $('sos-btn').textContent = fix[0];
    if ($('hzl1')) $('hzl1').textContent = fix[1];
  }
  function current() { var a = document.querySelector('.panel.active'); return a && a.id.indexOf('panel-px') === 0 ? a.id.slice(8) : null; }
  function render(k) {
    var p = $('panel-' + ID(k)); if (!p) return;
    var s = S(); var tt = $('topbar-title'); if (tt) tt.textContent = s.nav[k][0];
    stopTimers(k);
    try { R[k](p, s); } catch (e) { console.error('[px]', k, e); p.innerHTML = '<div class="card">⚠ ' + esc(e.message) + '</div>'; }
    p.querySelectorAll('.rv').forEach(function (el) { el.classList.add('vis'); });
  }
  function hd(title, sub, badge) {
    return '<div class="mod-hd rv"><div><div class="mod-title">' + esc(title) + '</div><div class="mod-sub" style="max-width:820px">' + esc(sub) + '</div></div>' + (badge || '') + '</div>';
  }
  function srcBadge(n, s) { return n ? '<span class="px-src real">● ' + esc(s.src_real.replace('{n}', n)) + '</span>' : '<span class="px-src">◌ ' + esc(s.src_demo) + '</span>'; }
  function ev(s, txt) { return '<div class="px-ev"><b>📚 ' + esc(s.evid) + '：</b>' + esc(txt) + '</div>'; }
  function kpi(cls, label, val, meta) { return '<div class="kpi-card ' + cls + '"><div class="kpi-label">' + esc(label) + '</div><div class="kpi-value">' + val + '</div><div class="kpi-meta">' + (meta || '') + '</div></div>'; }
  var timers = {};
  function stopTimers(k) { Object.keys(timers).forEach(function (x) { if (x !== 'heat') { clearInterval(timers[x]); delete timers[x]; } }); }

  /* =================== 演示数据（固定，不随机） =================== */
  var DAY = 864e5;
  function demoNearfall() {
    var now = Date.now(), cells = { 'SITE-A · B3': 7, 'SITE-A · C3': 4, 'SITE-A · A2': 2, 'SITE-A · B2': 1, 'SITE-A · C1': 1 }, out = [], i = 0;
    var who = ['W001', 'W003', 'W001', null, 'W003', null, 'W002', null];
    Object.keys(cells).forEach(function (z) {
      var c = 'ABC'.indexOf(z.slice(-2, -1)), r = +z.slice(-1) - 1;
      for (var n = 0; n < cells[z]; n++, i++) out.push({ ts: now - ((i * 37) % 7) * DAY - i * 3600e3, site: 'SITE-A', zone: z, wid: 'P' + (i % 4 + 1), worker: who[i % who.length], x: (c + 0.5) / 3, y: (r + 0.6) / 3, depth: 0.1 + (i % 5) * 0.02 });
    });
    return out;
  }
  var DEMO_ERGO = { '冲压 1号线 / Press 1': { n: 120, sum: 612, hi: 82 }, '搬运区 / Material handling': { n: 96, sum: 528, hi: 70 }, '焊接区 / Welding': { n: 88, sum: 396, hi: 41 },
    '喷涂 / Painting': { n: 60, sum: 228, hi: 12 }, '装配线 A / Assembly A': { n: 140, sum: 406, hi: 9 }, '检验台 / Inspection': { n: 72, sum: 166, hi: 2 } };
  var JOB_ERGO = { weld: 5, press: 5, transport: 6, paint: 4, equip: 5, assembly: 3, inspect: 2 };
  var JOB_FAST = { press: 1, transport: 1, equip: 1 };

  /* =================== 实时事件（同一浏览器） =================== */
  var feed = jget('shk3_px_feed', []);
  try {
    if (window.SHKTransport) new SHKTransport('dash').on(function (m) {
      var k = m && m.kind; if (!k) return;
      if (['near_fall', 'hand_in_machine', 'vehicle_danger', 'vehicle_near', 'voice_sos', 'loud_sound', 'fused_fall', 'fall_fp'].indexOf(k) < 0) return;
      if (m.type === 'clear') return;
      feed.unshift({ ts: m.ts || Date.now(), kind: k, msg: m.msg, level: m.level, site: m.site }); feed = feed.slice(0, 60); jset('shk3_px_feed', feed);
      var c = current(); if (c === 'nearfall' || c === 'fusion') render(c);
    });
  } catch (e) {}
  function feedHtml(s, kinds) {
    var list = feed.filter(function (f) { return !kinds || kinds.indexOf(f.kind) >= 0; }).slice(0, 15);
    return '<div class="card rv" style="margin-top:16px"><div class="card-title">📡 ' + esc(s.live_feed) + '</div><div class="px-feed">' +
      (list.length ? list.map(function (f) { return '<div><span class="px-pill" style="background:' + (f.level === 'danger' ? 'var(--rbg);color:var(--r)' : 'var(--wbg);color:var(--w)') + '">' + new Date(f.ts).toLocaleTimeString() + '</span> ' + esc(f.msg) + '</div>'; }).join('')
        : '<div style="color:var(--ink4)">— <a href="live.html" target="_blank">' + esc(s.open_live) + '</a></div>') + '</div></div>';
  }

  /* =================== 页面 =================== */
  var R = {};

  /* ---- 1 跌倒前预警 ---- */
  R.nearfall = function (p, s) {
    var real = jget('shk3_nearfall', []), recs = real.length ? real : demoNearfall(), since = Date.now() - 7 * DAY;
    var wk = recs.filter(function (r) { return r.ts >= since; });
    var byZone = {}; wk.forEach(function (r) { byZone[r.zone] = (byZone[r.zone] || 0) + 1; });
    var zones = Object.keys(byZone).sort(function (a, b) { return byZone[b] - byZone[a]; });
    var byW = {}; wk.forEach(function (r) { if (!r.worker) return; byW[r.worker] = (byW[r.worker] || 0) + 1; });   // 只统计已绑定工号的人（画面编号每次会变）
    var rep = Object.keys(byW).filter(function (k) { return byW[k] >= 2; }).sort(function (a, b) { return byW[b] - byW[a]; });
    var depth = wk.length ? wk.reduce(function (a, r) { return a + (r.depth || 0); }, 0) / wk.length : 0;
    var grid = [0, 0, 0, 0, 0, 0, 0, 0, 0]; wk.forEach(function (r) { var c = clamp(Math.floor((r.x || 0.5) * 3), 0, 2), w = clamp(Math.floor((r.y || 0.5) * 3), 0, 2); grid[w * 3 + c]++; });
    var mx = Math.max.apply(null, grid) || 1;
    var act = function (n) { return n >= 3 ? s.nf_a3 : n >= 2 ? s.nf_a2 : s.nf_a1; };
    var wname = function (k) { var w = (window.WORKERS || []).find(function (x) { return x.id === k; }); return w ? (w.name[lang()] || w.name.zh) + ' (' + w.age + ')' : k; };
    p.innerHTML = hd(s.nf_t, s.nf_s, srcBadge(real.length, s)) +
      '<div class="kpi-row rv">' + kpi('amber', s.nf_k1, wk.length) + kpi('red', s.nf_k2, zones.filter(function (z) { return byZone[z] >= 3; }).length) + kpi('blue', s.nf_k3, rep.length) + kpi('green', s.nf_k4, Math.round(depth * 100) + '<small style="font-size:1rem">%</small>') + '</div>' +
      '<div class="grid-2 rv"><div class="card"><div class="card-title">' + esc(s.nf_map) + '</div><div class="card-sub">' + esc(s.nf_map_s) + '</div><div class="px-grid">' +
      grid.map(function (n, i) { var a = n / mx; return '<div class="px-cell" data-i="' + i + '" style="background:rgba(255,140,0,' + (0.06 + a * 0.75).toFixed(2) + ');color:' + (a > 0.5 ? '#fff' : 'var(--ink2)') + '">' + n + '<small>' + 'ABC'.charAt(i % 3) + (1 + Math.floor(i / 3)) + '</small></div>'; }).join('') +
      '</div><div class="px-how" id="px-nf-tip"></div></div>' +
      '<div class="card"><div class="card-title">' + esc(s.nf_rank) + '</div><table class="px-t"><tr><th>' + esc(s.nf_c_zone) + '</th><th>' + esc(s.nf_c_n) + '</th><th>' + esc(s.nf_c_act) + '</th></tr>' +
      (zones.length ? zones.slice(0, 6).map(function (z) { var n = byZone[z]; return '<tr><td><b>' + esc(z) + '</b></td><td><span class="px-pill" style="background:' + (n >= 3 ? 'var(--rbg);color:var(--r)' : n >= 2 ? 'var(--wbg);color:var(--w)' : 'var(--bg2);color:var(--ink3)') + '">' + n + '</span></td><td>' + esc(act(n)) + '</td></tr>'; }).join('') : '<tr><td colspan="3">' + esc(s.nf_none) + '</td></tr>') +
      '</table><div class="card-title" style="margin-top:18px">' + esc(s.nf_who) + '</div><table class="px-t">' +
      (rep.length ? rep.map(function (k) { return '<tr><td><b>' + esc(wname(k)) + '</b></td><td>' + byW[k] + '×</td><td>' + esc(s.nf_w_act) + '</td></tr>'; }).join('') : '<tr><td>' + esc(s.nf_none) + '</td></tr>') + '</table></div></div>' +
      '<div class="card rv" style="margin-top:16px"><div class="px-how" style="margin:0">' + esc(s.nf_how) + '</div>' +
      '<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><a class="px-btn" href="live.html" target="_blank">' + esc(s.open_live) + '</a>' + (real.length ? '<button class="px-btn g" id="px-nf-clr">' + esc(s.clear) + '</button>' : '') + '</div></div>' +
      feedHtml(s, ['near_fall']) + ev(s, s.nf_ev);
    p.querySelectorAll('.px-cell').forEach(function (c) { c.onclick = function () { var n = grid[+c.dataset.i]; $('px-nf-tip').textContent = c.querySelector('small').textContent + ' · ' + n + ' → ' + act(n); }; });
    if ($('px-nf-clr')) $('px-nf-clr').onclick = function () { jset('shk3_nearfall', []); render('nearfall'); };
  };

  /* ---- 2 上岗前适岗测试 ---- */
  var pvt = null;
  R.fitcheck = function (p, s) {
    var ws = window.WORKERS || [], hist = jget('shk3_pvt', []);
    p.innerHTML = hd(s.pv_t, s.pv_s) +
      '<div class="grid-2 rv"><div class="card"><div style="display:flex;gap:10px;flex-wrap:wrap;align-items:end;margin-bottom:12px">' +
      '<label style="font-size:.76rem;font-weight:700;color:var(--ink3)">' + esc(s.pv_who) + '<br><select class="px-in" id="px-pv-who">' + ws.map(function (w) { return '<option value="' + w.id + '">' + esc((w.name[lang()] || w.name.zh) + ' · ' + w.age) + '</option>'; }).join('') + '<option value="guest">Guest / 评委</option></select></label>' +
      '<label style="font-size:.76rem;font-weight:700;color:var(--ink3)">' + esc(s.pv_dur) + '<br><select class="px-in" id="px-pv-dur"><option value="30">30 s</option><option value="60">60 s</option><option value="180">180 s</option></select></label>' +
      '<button class="px-btn" id="px-pv-go">' + esc(s.pv_start) + '</button></div>' +
      '<div class="px-pvt" id="px-pv-box">' + esc(s.pv_tap) + '</div><div style="height:6px;border-radius:4px;background:var(--bg2);margin-top:8px;overflow:hidden"><i id="px-pv-prog" style="display:block;height:100%;width:0;background:var(--a)"></i></div></div>' +
      '<div class="card"><div class="card-title">' + esc(s.pv_done) + '</div><div id="px-pv-res" class="card-sub">—</div>' +
      '<div class="card-title" style="margin-top:14px">' + esc(s.pv_hist) + '</div><table class="px-t" id="px-pv-hist"></table></div></div>' + ev(s, s.pv_ev);
    var hEl = $('px-pv-hist');
    function drawHist() {
      var h = jget('shk3_pvt', []).slice(-8).reverse();
      hEl.innerHTML = '<tr><th>' + esc(s.pv_c_t) + '</th><th>' + esc(s.pv_who) + '</th><th>' + esc(s.pv_med) + '</th><th>' + esc(s.pv_c_r) + '</th></tr>' +
        h.map(function (r) { var w = ws.find(function (x) { return x.id === r.who; }); return '<tr><td>' + new Date(r.ts).toLocaleTimeString() + '</td><td>' + esc(w ? (w.name[lang()] || w.name.zh) : r.who) + '</td><td><b>' + r.med + '</b> ms</td><td>' + (r.v === 'ok' ? '✓' : r.v === 'warn' ? '⚠' : '✕') + '</td></tr>'; }).join('');
    }
    drawHist();
    var box = $('px-pv-box');
    function finish() {
      var rts = pvt.rts.slice().sort(function (a, b) { return a - b; }), med = rts.length ? Math.round(rts[Math.floor(rts.length / 2)]) : 0;
      var lapses = pvt.rts.filter(function (x) { return x >= 500; }).length;
      var prev = jget('shk3_pvt', []).filter(function (r) { return r.who === pvt.who; }).slice(-5), base = null;
      if (prev.length) { var ms = prev.map(function (r) { return r.med; }).sort(function (a, b) { return a - b; }); base = ms[Math.floor(ms.length / 2)]; }
      var v;
      if (base) v = (med <= base * 1.15 && lapses <= 1 && pvt.fs <= 2) ? 'ok' : (med <= base * 1.3 && lapses <= 2) ? 'warn' : 'bad';
      else v = (med < 350 && lapses <= 1 && pvt.fs <= 2) ? 'ok' : (med < 450 && lapses <= 2) ? 'warn' : 'bad';
      var all = jget('shk3_pvt', []); all.push({ ts: Date.now(), who: pvt.who, med: med, lapses: lapses, fs: pvt.fs, n: pvt.rts.length, v: v }); jset('shk3_pvt', all.slice(-300));
      var col = v === 'ok' ? 'var(--g)' : v === 'warn' ? 'var(--w)' : 'var(--r)';
      $('px-pv-res').innerHTML = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:8px 0 12px"><div><div class="kpi-label">' + esc(s.pv_med) + '</div><div class="px-big">' + med + '<small style="font-size:.9rem"> ms</small></div></div>' +
        '<div><div class="kpi-label">' + esc(s.pv_lapse) + '</div><div class="px-big">' + lapses + '</div></div><div><div class="kpi-label">' + esc(s.pv_fs) + '</div><div class="px-big">' + pvt.fs + '</div></div></div>' +
        '<div style="font-size:.8rem;color:var(--ink3);margin-bottom:8px">' + (base ? esc(s.pv_base) + ': <b>' + base + ' ms</b>' : esc(s.pv_nobase)) + '</div>' +
        '<div class="px-lv" style="background:' + col + ';color:#fff">' + esc(s['pv_' + v]) + '</div>';
      box.innerHTML = esc(s.pv_done); $('px-pv-go').disabled = false; pvt = null; drawHist();
    }
    function next() {
      if (!pvt) return;
      if (performance.now() - pvt.t0 > pvt.dur) { finish(); return; }
      pvt.shown = false; box.innerHTML = esc(s.pv_wait);
      pvt.to = setTimeout(function () { if (!pvt) return; pvt.shown = true; pvt.at = performance.now(); box.innerHTML = '<div class="dot"></div>';
        pvt.miss = setTimeout(function () { if (pvt && pvt.shown) { pvt.rts.push(1500); next(); } }, 1500); }, 1500 + Math.random() * 2500);
    }
    function tap() {
      if (!pvt) return;
      if (!pvt.shown) { pvt.fs++; box.innerHTML = '<span style="color:var(--w)">' + esc(s.pv_early) + '</span>'; clearTimeout(pvt.to); setTimeout(next, 700); return; }
      clearTimeout(pvt.miss); pvt.rts.push(performance.now() - pvt.at); pvt.shown = false;
      box.innerHTML = '<span class="px-big" style="color:#fff">' + Math.round(pvt.rts[pvt.rts.length - 1]) + ' ms</span>'; setTimeout(next, 500);
    }
    box.addEventListener('pointerdown', function (e) { e.preventDefault(); tap(); });
    if (!R._pvKey) { R._pvKey = true; document.addEventListener('keydown', function (e) { if (pvt && e.code === 'Space' && current() === 'fitcheck') { e.preventDefault(); tap(); } }); }
    $('px-pv-go').onclick = function () {
      this.disabled = true; $('px-pv-res').textContent = '…';
      pvt = { who: $('px-pv-who').value, dur: +$('px-pv-dur').value * 1000, t0: performance.now(), rts: [], fs: 0 };
      timers.pv = setInterval(function () { if (!pvt) { clearInterval(timers.pv); return; } $('px-pv-prog').style.width = Math.min(100, (performance.now() - pvt.t0) / pvt.dur * 100) + '%'; }, 100);
      next();
    };
  };

  /* ---- 3 体感温度合规（韩国） ---- */
  function stullTw(T, RH) { return T * Math.atan(0.151977 * Math.sqrt(RH + 8.313659)) + Math.atan(T + RH) - Math.atan(RH - 1.676331) + 0.00391838 * Math.pow(RH, 1.5) * Math.atan(0.023101 * RH) - 4.686035; }
  function feelsKMA(T, RH) { var tw = stullTw(T, RH); return -0.2442 + 0.55399 * tw + 0.45535 * T - 0.0022 * tw * tw + 0.00278 * tw * T + 3.0; }
  function heatLevel(at) { return at >= 38 ? 4 : at >= 35 ? 3 : at >= 33 ? 2 : at >= 31 ? 1 : 0; }
  var RULE = { 2: { work: 120, rest: 20 }, 3: { work: 60, rest: 15 }, 4: { work: 60, rest: 15 } };
  var heat = jget('shk3_px_heat', { ta: 33, rh: 60, mode: 'idle', since: 0, log: [] });
  function heatSave() { jset('shk3_px_heat', heat); }
  function heatTick() {
    var at = feelsKMA(heat.ta, heat.rh), lv = heatLevel(at), r = RULE[lv];
    if (heat.mode === 'work' && r && Date.now() - heat.since >= r.work * 60e3 && !heat.dueSaid) {
      heat.dueSaid = true; heatSave();
      var msg = S().hl_due.replace('{m}', r.rest);
      try { if (window.speechSynthesis) { var u = new SpeechSynthesisUtterance(msg.replace('⏰', '')); u.lang = lang() === 'ko' ? 'ko-KR' : lang() === 'en' ? 'en-US' : 'zh-CN'; speechSynthesis.speak(u); } } catch (e) {}
      try { if (window.Notification && Notification.permission === 'granted') new Notification('SHine-K', { body: msg }); } catch (e) {}
    }
    if (current() === 'heatlaw') paintHeatTimer();
  }
  timers.heat = setInterval(heatTick, 1000);
  function fmt(ms) { ms = Math.max(0, ms); var m = Math.floor(ms / 60e3), s2 = Math.floor(ms / 1e3) % 60; return (m < 10 ? '0' : '') + m + ':' + (s2 < 10 ? '0' : '') + s2; }
  function paintHeatTimer() {
    var el = $('px-hl-timer'); if (!el) return;
    var s = S(), at = feelsKMA(heat.ta, heat.rh), lv = heatLevel(at), r = RULE[lv], now = Date.now();
    if (!r) { el.innerHTML = '<div style="color:var(--ink3)">' + esc(s.hl_none_req) + '</div>'; return; }
    if (heat.mode === 'rest') { var left = r.rest * 60e3 - (now - heat.since); el.innerHTML = '<div class="kpi-label">' + esc(s.hl_resting) + '</div><div class="px-big" style="color:var(--g)">' + fmt(left) + '</div>'; return; }
    if (heat.mode === 'work') { var l2 = r.work * 60e3 - (now - heat.since); el.innerHTML = '<div class="kpi-label">' + esc(s.hl_left) + '</div><div class="px-big" style="color:' + (l2 <= 0 ? 'var(--r)' : 'var(--ink)') + '">' + (l2 <= 0 ? esc(s.hl_due.replace('{m}', r.rest)) : fmt(l2)) + '</div>'; return; }
    el.innerHTML = '<div style="color:var(--ink3)">—</div>';
  }
  R.heatlaw = function (p, s) {
    var at = feelsKMA(heat.ta, heat.rh), lv = heatLevel(at);
    var cols = ['var(--g)', '#F5B400', 'var(--w)', 'var(--r)', '#7A0019'];
    var eld = (window.WORKERS || []).filter(function (w) { return w.age >= 55; });
    p.innerHTML = hd(s.hl_t, s.hl_s) +
      '<div class="grid-2 rv"><div class="card"><div style="display:flex;gap:10px;align-items:end;flex-wrap:wrap">' +
      '<label style="font-size:.76rem;font-weight:700;color:var(--ink3)">' + esc(s.hl_ta) + '<br><input class="px-in" id="px-hl-ta" type="number" step="0.1" value="' + heat.ta + '" style="width:110px"></label>' +
      '<label style="font-size:.76rem;font-weight:700;color:var(--ink3)">' + esc(s.hl_rh) + '<br><input class="px-in" id="px-hl-rh" type="number" step="1" min="0" max="100" value="' + heat.rh + '" style="width:110px"></label>' +
      '<button class="px-btn" id="px-hl-calc">' + esc(s.hl_calc) + '</button></div>' +
      '<div style="margin-top:16px"><div class="kpi-label">' + esc(s.hl_at) + '</div><div class="px-big" style="color:' + cols[lv] + '">' + at.toFixed(1) + ' ℃</div></div>' +
      '<div class="px-lv" style="margin-top:10px;background:' + cols[lv] + ';color:#fff">' + esc(s['hl_l' + lv]) + '</div>' +
      '<div style="display:flex;gap:4px;margin-top:12px">' + [31, 33, 35, 38].map(function (x, i) { return '<div style="flex:1;font-size:.68rem;font-weight:800;text-align:center;padding:5px 0;border-radius:6px;background:' + (lv > i ? cols[i + 1] : 'var(--bg2)') + ';color:' + (lv > i ? '#fff' : 'var(--ink4)') + '">≥' + x + '℃</div>'; }).join('') + '</div></div>' +
      '<div class="card"><div class="card-title">⏱ ' + esc(s.hl_timer) + '</div><div id="px-hl-timer" style="margin:10px 0 14px"></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="px-btn" id="px-hl-work">' + esc(s.hl_work) + '</button><button class="px-btn w" id="px-hl-rest">' + esc(s.hl_rest) + '</button><button class="px-btn g" id="px-hl-end">' + esc(s.hl_end) + '</button></div>' +
      '<div class="card-title" style="margin-top:18px">👴 ' + esc(s.hl_eld) + '</div><div style="display:flex;gap:6px;flex-wrap:wrap">' +
      eld.map(function (w) { return '<span class="px-pill" style="background:var(--pbg);color:var(--p)">' + esc((w.name[lang()] || w.name.zh) + ' ' + w.age) + '</span>'; }).join('') + '</div></div></div>' +
      '<div class="card rv" style="margin-top:16px"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><div class="card-title">' + esc(s.hl_log) + '</div><button class="px-btn g" id="px-hl-csv">' + esc(s.hl_export) + '</button></div>' +
      '<table class="px-t"><tr><th>' + esc(s.hl_c_t) + '</th><th>' + esc(s.hl_c_at) + '</th><th>' + esc(s.hl_c_a) + '</th></tr>' +
      heat.log.slice(-10).reverse().map(function (r) { return '<tr><td>' + new Date(r.ts).toLocaleString() + '</td><td><b>' + r.at.toFixed(1) + ' ℃</b></td><td>' + esc(s['hl_a_' + r.a]) + '</td></tr>'; }).join('') + '</table></div>' + ev(s, s.hl_ev);
    function logA(a) { heat.log.push({ ts: Date.now(), at: feelsKMA(heat.ta, heat.rh), a: a }); heat.log = heat.log.slice(-500); heatSave(); }
    $('px-hl-calc').onclick = function () { heat.ta = +$('px-hl-ta').value || 0; heat.rh = clamp(+$('px-hl-rh').value || 0, 0, 100); logA('meas'); render('heatlaw'); };
    $('px-hl-work').onclick = function () { heat.mode = 'work'; heat.since = Date.now(); heat.dueSaid = false; logA('work'); try { if (window.Notification && Notification.permission === 'default') Notification.requestPermission(); } catch (e) {} render('heatlaw'); };
    $('px-hl-rest').onclick = function () { heat.mode = 'rest'; heat.since = Date.now(); logA('rest'); render('heatlaw'); };
    $('px-hl-end').onclick = function () { heat.mode = 'work'; heat.since = Date.now(); heat.dueSaid = false; logA('end'); render('heatlaw'); };
    $('px-hl-csv').onclick = function () {
      var rows = [['time', 'feels_like_C', 'air_C', 'rh', 'action']].concat(heat.log.map(function (r) { return [new Date(r.ts).toISOString(), r.at.toFixed(1), heat.ta, heat.rh, r.a]; }));
      var blob = new Blob(['﻿' + rows.map(function (r) { return r.join(','); }).join('\n')], { type: 'text/csv' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'heat-log-' + new Date().toISOString().slice(0, 10) + '.csv'; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    };
    paintHeatTimer();
  };

  /* ---- 4 姿势负荷排名 ---- */
  R.ergo = function (p, s) {
    var real = jget('shk3_ergo', {}), n = Object.keys(real).length, data = n ? real : DEMO_ERGO;
    var rows = Object.keys(data).map(function (z) { var d = data[z]; return { z: z, avg: d.sum / Math.max(1, d.n), hi: d.hi / Math.max(1, d.n), n: d.n }; }).sort(function (a, b) { return b.avg - a.avg; });
    var lvTxt = function (a) { return a >= 6.5 ? s.eg_lv4 : a >= 4.5 ? s.eg_lv3 : a >= 2.5 ? s.eg_lv2 : s.eg_lv1; };
    var col = function (a) { return a >= 6.5 ? 'var(--r)' : a >= 4.5 ? 'var(--w)' : a >= 2.5 ? '#F5B400' : 'var(--g)'; };
    p.innerHTML = hd(s.eg_t, s.eg_s, srcBadge(n, s)) +
      '<div class="worker-table-wrap rv"><table class="px-t"><tr><th>#</th><th>' + esc(s.eg_c_z) + '</th><th>' + esc(s.eg_c_avg) + '</th><th></th><th>' + esc(s.eg_c_hi) + '</th><th>' + esc(s.eg_c_n) + '</th><th>' + esc(s.eg_c_lv) + '</th></tr>' +
      rows.map(function (r, i) { return '<tr><td>' + (i + 1) + '</td><td><b>' + esc(r.z) + '</b></td><td><b style="color:' + col(r.avg) + '">' + r.avg.toFixed(1) + '</b>/7</td><td><div class="px-bar"><i style="width:' + (r.avg / 7 * 100).toFixed(0) + '%;background:' + col(r.avg) + '"></i></div></td><td>' + Math.round(r.hi * 100) + '%</td><td>' + r.n + '</td><td>' + esc(lvTxt(r.avg)) + '</td></tr>'; }).join('') +
      '</table></div><div class="card rv" style="margin-top:16px"><div class="px-how" style="margin:0">' + esc(s.eg_how) + '</div><div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><a class="px-btn" href="live.html" target="_blank">' + esc(s.open_live) + '</a>' +
      (n ? '<button class="px-btn g" id="px-eg-clr">' + esc(s.clear) + '</button>' : '') + '</div></div>' + ev(s, s.eg_ev);
    if ($('px-eg-clr')) $('px-eg-clr').onclick = function () { jset('shk3_ergo', {}); render('ergo'); };
  };

  /* ---- 5 老龄工人适岗推荐 ---- */
  R.jobfit = function (p, s) {
    var ws = (window.WORKERS || []).filter(function (w) { return w.age >= 55; }), pv = jget('shk3_pvt', []), nf = jget('shk3_nearfall', []), since = Date.now() - 7 * DAY;
    var nfDemo = !nf.length; if (nfDemo) nf = demoNearfall();
    var at = feelsKMA(heat.ta, heat.rh);
    var rows = ws.map(function (w) {
      var mine = pv.filter(function (r) { return r.who === w.id; }), rtReal = mine.length ? mine[mine.length - 1].med : null;
      var rt = rtReal || Math.round(280 + (w.age - 40) * 4 + (w.fat || 40) * 0.6);
      var st = nf.filter(function (r) { return r.worker === w.id && r.ts >= since; }).length;
      var po = JOB_ERGO[w.jobKey] || 3;
      var rRt = clamp((rt - 300) / 2.5, 0, 100) * (JOB_FAST[w.jobKey] ? 1.2 : 1), rSt = clamp(st * 30, 0, 100), rHeat = clamp((at - 29) * 12, 0, 100) * (w.age >= 60 ? 1.3 : 1), rPo = clamp((po - 1) * 16, 0, 100);
      var fit = Math.round(clamp(100 - (0.3 * rRt + 0.3 * rSt + 0.2 * rHeat + 0.2 * rPo), 0, 100));
      var rec = []; if (rSt >= 60) rec.push(s.jf_r_st); if (rRt >= 50) rec.push(s.jf_r_rt); if (rHeat >= 50) rec.push(s.jf_r_heat); if (rPo >= 60) rec.push(s.jf_r_po); if (!rec.length) rec.push(s.jf_r_ok);
      return { w: w, rt: rt, rtReal: !!rtReal, st: st, at: at, po: po, fit: fit, rec: rec };
    }).sort(function (a, b) { return a.fit - b.fit; });
    var c = function (f) { return f >= 70 ? 'var(--g)' : f >= 45 ? 'var(--w)' : 'var(--r)'; };
    p.innerHTML = hd(s.jf_t, s.jf_s, '<span class="px-src" style="background:var(--pbg);color:var(--p)">🔔 ' + esc(s.jf_alert) + '</span>') +
      '<div class="worker-table-wrap rv"><table class="px-t"><tr><th>' + esc(s.jf_c_w) + '</th><th>' + esc(s.jf_c_rt) + '</th><th>' + esc(s.jf_c_st) + '</th><th>' + esc(s.jf_c_heat) + '</th><th>' + esc(s.jf_c_po) + '</th><th>' + esc(s.jf_c_fit) + '</th><th>' + esc(s.jf_c_rec) + '</th></tr>' +
      rows.map(function (r) {
        return '<tr><td><b>' + esc(r.w.name[lang()] || r.w.name.zh) + '</b><br><small style="color:var(--ink4)">' + r.w.age + ' · ' + esc(r.w.job[lang()] || r.w.job.zh) + '</small></td>' +
          '<td>' + r.rt + ' ms' + (r.rtReal ? '' : ' *') + '</td><td>' + r.st + (nfDemo ? ' *' : '') + '</td><td>' + r.at.toFixed(1) + ' ℃</td><td>' + r.po + '/7</td>' +
          '<td><span class="px-pill" style="background:' + c(r.fit) + ';color:#fff;font-size:.82rem">' + r.fit + '</span></td><td style="font-size:.78rem">' + r.rec.map(esc).join('<br>') + '</td></tr>';
      }).join('') + '</table></div><div class="card rv" style="margin-top:16px"><div class="px-how" style="margin:0">' + esc(s.jf_how) + '</div></div>' + ev(s, s.jf_ev);
  };

  /* ---- 6 多源交叉验证 · 告警分级 ---- */
  R.fusion = function (p, s) {
    var f = jget('shk3_fusion', null), real = !!(f && (f.confirmed || f.single || f.fp));
    var d = real ? f : { confirmed: 6, single: 9, fp: 14 };
    p.innerHTML = hd(s.fu_t, s.fu_s, srcBadge(real ? (d.confirmed + d.single + d.fp) : 0, s)) +
      '<div class="kpi-row rv">' + kpi('red', s.fu_k1, d.confirmed) + kpi('amber', s.fu_k2, d.single) + kpi('blue', s.fu_k3, d.fp) + kpi('green', s.fu_k4, d.fp, '<span class="up">−' + Math.round(d.fp / Math.max(1, d.confirmed + d.single + d.fp) * 100) + '%</span>') + '</div>' +
      '<div class="card rv"><div class="card-title">' + esc(s.fu_flow) + '</div><div class="px-flow" style="margin:10px 0"><i>📷</i><em>+</em><i>⌚</i><em>+</em><i>🎤</i><em>→</em><i style="background:var(--abg);color:var(--a)">≥2 ✔</i><em>→</em><i style="background:var(--rbg);color:var(--r)">119</i></div>' +
      '<div class="px-how">' + esc(s.fu_how) + '</div></div>' +
      '<div class="card rv" style="margin-top:16px"><div class="card-title">' + esc(s.fu_tiers) + '</div><div class="px-tier" style="margin-top:10px">' +
      [['fu_t1', 'var(--g)'], ['fu_t2', 'var(--w)'], ['fu_t3', 'var(--amb)'], ['fu_t4', 'var(--r)']].map(function (x) { return '<div style="border-top:4px solid ' + x[1] + '"><b>' + esc(s[x[0]]) + '</b><span>' + esc(s[x[0] + 'd']) + '</span></div>'; }).join('') + '</div></div>' +
      feedHtml(s, ['fused_fall', 'fall_fp', 'hand_in_machine', 'vehicle_danger', 'vehicle_near', 'voice_sos', 'loud_sound']) + ev(s, s.fu_ev);
  };

  /* ---- 7 研究依据与路线图 ---- */
  R.roadmap = function (p, s) {
    var tag = { done: ['var(--gbg)', 'var(--g)', s.rm_done], demo: ['var(--wbg)', 'var(--w)', s.rm_demo], plan: ['var(--bg2)', 'var(--ink3)', s.rm_plan] };
    p.innerHTML = hd(s.rm_t, s.rm_s) + '<div class="worker-table-wrap rv"><table class="px-t"><tr><th></th><th>' + esc(s.rm_where) + '</th><th>' + esc(s.evid) + '</th></tr>' +
      s.rm_items.map(function (r) { var g = tag[r[1]]; return '<tr><td><span class="px-pill" style="background:' + g[0] + ';color:' + g[1] + '">' + esc(g[2]) + '</span> <b>' + esc(r[0]) + '</b></td><td>' + esc(r[2]) + '</td><td style="font-size:.76rem;color:var(--ink3)">' + esc(r[3]) + '</td></tr>'; }).join('') + '</table></div>';
  };

  /* =================== 首页卡片 =================== */
  function cards() {
    var grid = $('shk-grid'); if (!grid || grid.querySelector('[data-px]')) return;
    var s = S(), chip = (function () { var b = document.querySelector('#shk-chips button.on'); return b ? b.dataset.c : 'all'; })();
    var ref = grid.children[4] || null;            // 放在原有前 4 张卡片之后
    NAV.forEach(function (n) {
      var d = document.createElement('div'); d.className = 'shk-card' + (chip === 'all' || chip === n[3] ? '' : ' hide'); d.dataset.px = n[0]; d.style.position = 'relative';
      d.innerHTML = '<div class="th" style="background:' + n[2] + '"><span class="ic">' + n[1] + '</span><span class="bd' + (n[3] === 'real' ? ' real' : '') + '">' + (n[3] === 'real' ? '● ' + esc(s.real) : '🧪 ' + esc(s.sec)) + '</span>' + (n[0] !== 'roadmap' ? '<span class="px-ribbon">NEW</span>' : '') + '</div>' +
        '<div class="meta"><div class="av">' + n[1] + '</div><div><b>' + esc(s.nav[n[0]][0]) + '</b><span>' + esc(s.nav[n[0]][1]) + '</span></div></div>';
      d.onclick = function () { window.showPanel(ID(n[0])); };
      grid.insertBefore(d, ref);
    });
  }

  function homeStrip() {
    var mods = $('shk-mods'); if (!mods) return;
    var s = S(), box = $('px-home');
    if (!box) {
      box = document.createElement('div'); box.id = 'px-home';
      var sec = mods.previousElementSibling && mods.previousElementSibling.classList.contains('shk-sec') ? mods.previousElementSibling : mods;
      sec.parentNode.insertBefore(box, sec);
    }
    box.innerHTML = '<div class="shk-sec"><h3>' + esc(s.home_t) + '</h3><span>' + esc(s.home_d) + '</span></div><div class="shk-mods">' +
      NAV.map(function (n) { return '<a class="shk-mod" href="#" data-pxh="' + n[0] + '" style="position:relative;background:' + n[2] + ';border-color:transparent"><i>' + n[1] + '</i><b>' + esc(s.nav[n[0]][0]) + '</b><span>' + esc(s.nav[n[0]][1]) + '</span>' + (n[0] !== 'roadmap' ? '<span class="px-ribbon" style="position:absolute;top:10px;right:10px;font-size:.62rem;font-weight:900;color:#fff;background:linear-gradient(135deg,#FF6B00,#E8133A);padding:2px 7px;border-radius:6px">NEW</span>' : '') + '</a>'; }).join('') + '</div>';
    box.querySelectorAll('[data-pxh]').forEach(function (a) { a.onclick = function (e) { e.preventDefault(); window.showPanel(ID(a.dataset.pxh)); }; });
  }

  /* =================== 启动 =================== */
  function boot() {
    if (!build()) { setTimeout(boot, 300); return; }
    var g = $('shk-grid');
    var obs = new MutationObserver(function () { cards(); homeStrip(); });
    if (g) obs.observe(g, { childList: true }); else setTimeout(function () { var g2 = $('shk-grid'); if (g2) { obs.observe(g2, { childList: true }); cards(); } }, 1500);
    cards(); homeStrip();
    setInterval(function () { if (!$('px-home')) homeStrip(); if ($('shk-grid') && !$('shk-grid').querySelector('[data-px]')) cards(); }, 1500);
    ['app-btn-zh', 'app-btn-ko', 'app-btn-en', 'btn-zh', 'btn-ko', 'btn-en'].forEach(function (id) {
      var e = $(id); if (e) new MutationObserver(function () { labels(); var gg = $('shk-grid'); if (gg) gg.querySelectorAll('[data-px]').forEach(function (x) { x.remove(); }); cards(); homeStrip(); var c = current(); if (c) render(c); }).observe(e, { attributes: true, attributeFilter: ['class'] });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.SHKPlus = { feelsKMA: feelsKMA, render: render, STR: STR };
})();
