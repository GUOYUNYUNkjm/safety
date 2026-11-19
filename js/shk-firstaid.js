/* SHine-K 3.0 · 岗前急救培训（新员工手机上完成）
 * 内容：发现有人倒下 → 胸外按压（CPR）→ AED → 工厂常见伤害 → CPR 节奏练习 → 测验 → 结业记录。
 * CPR 要点依据《2025 年韩国心肺复苏指南》（疾病管理厅 · 大韩心肺复苏协会）：成人按压约 5 cm（不超过 6 cm），每分钟 100–120 次，
 * 每次完全回弹；未受过人工呼吸训练只做胸外按压，受过训练 30:2。
 * 这是岗前入门培训，不能代替有资质机构的正式 CPR / AED 实操课程。
 * 结业记录保存在本机（shk3_fa_records），并通过同一通道（同浏览器 / 房间码）发给平台。
 */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function jget(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var lang = jget('shk3_fa_lang', null) || (navigator.language || 'zh').slice(0, 2); if (['zh', 'ko', 'en'].indexOf(lang) < 0) lang = 'zh';

  var C = {
    zh: { title: '岗前急救培训', prev: '← 上一步', next: '下一步 →', start: '开始培训 →', finish: '完成',
      intro_t: '新员工岗前急救培训', intro_d: '约 10 分钟：学会发现有人倒下时该做什么、胸外按压、使用 AED 和工厂常见伤害的处理，最后练习按压节奏并完成测验。',
      name: '姓名', code: '工号（可不填）', need_name: '请先填写姓名', note: '这是岗前入门培训，不能代替有资质机构的正式 CPR / AED 实操课程。',
      s: [
        { t: '① 发现有人倒下', li: ['先确认周围安全：机器已停止、没有触电和车辆危险。', '拍打双肩，大声问“你没事吧？”', '没有反应：大声呼救，指定一个人打 119，另一个人去拿 AED。', '看胸部起伏不超过 10 秒：不呼吸，或只有喘息样的呼吸，就是心脏骤停，马上开始按压。'], key: '不会做也要先打 119：调度员会在电话里一步步指导你。' },
        { t: '② 胸外按压（CPR）', li: ['让患者仰卧在坚硬的地面上。', '双手交叠，掌根放在胸部正中、胸骨下半部。', '手臂伸直，身体在患者正上方，垂直向下压。', '成人按压深度约 5 cm（不超过 6 cm），每分钟 100–120 次。', '每次压完让胸部完全回弹，尽量不要中断。', '没学过人工呼吸：只做胸外按压；学过：30 次按压 + 2 次人工呼吸。', '一直做到 AED 到达、患者开始正常呼吸或活动，或 119 接手。'], key: '用力、快速、不中断：约 5 cm，每分钟 100–120 次。', src: '依据：2025 年韩国心肺复苏指南（疾病管理厅 · 大韩心肺复苏协会）' },
        { t: '③ 使用 AED', li: ['打开电源，听语音提示操作。', '按电极片上的图贴好：一片在右锁骨下方，一片在左侧胸部外下方（腋下）。胸口有汗或水先擦干。', 'AED 分析心律时，所有人离开，不要碰患者。', '提示电击时，确认没人接触患者，再按电击按钮。', '电击后（或提示不需要电击）立即继续胸外按压。', 'AED 每 2 分钟会再次分析，电极片不要撕下，按提示继续。'], key: 'AED 会说话，照着做；分析和电击时谁都不要碰患者。' },
        { t: '④ 工厂常见伤害', li: ['大出血：用干净的布直接用力压住伤口；布湿透不要拿掉，再加一层继续压，并打 119。', '烧烫伤：用流动的凉水冲约 20 分钟；不要涂牙膏、酱油，不要挑破水泡。', '化学品溅入眼睛：马上用洗眼器冲洗至少 15 分钟，边冲边转动眼球，然后就医。', '中暑：移到阴凉处，松开衣服，用水和风降温；意识不清立刻打 119，不要喂水。', '手被机器卷入或切断：先停机断电再施救；压住止血；断指用干净纱布包好放进塑料袋，再放进冰水里（不要直接碰冰），随人一起送医。', '从高处坠落、怀疑脊柱受伤：除非有危险，不要搬动伤者。'], key: '先停机、断电，再救人；没有把握就打 119。' }
      ],
      pr_t: '⑤ 按压节奏练习', pr_d: '跟着节拍在下面的黑色区域连续点 30 次（模拟按压），系统计算你的按压频率。目标：每分钟 100–120 次。', pr_beat: '节拍声', pr_on: '开', pr_off: '关', pr_tap: '在这里点击 = 按压', pr_rate: '次/分', pr_ok: '✓ 节奏合格', pr_slow: '太慢了，再快一点', pr_fast: '太快了，慢一点', pr_again: '再练一次', pr_need: '请先完成 30 次按压练习',
      q_t: '⑥ 测验', q_d: '答对 8 题以上（共 9 题）即通过。', q_submit: '提交答案', q_score: '得分 {s} / {n}', q_pass: '✓ 通过', q_fail: '未通过：看一下标红的题，再答一次', q_retry: '重新作答',
      c_t: '⑦ 结业', c_ok: '岗前急救培训结业', c_rate: 'CPR 节奏', c_score: '测验', c_date: '日期', c_valid: '建议每年复训一次', c_sent: '已保存，已发送到平台', c_saved: '已保存在本机', c_not: '还没有通过测验',
      quiz: [
        ['发现有人倒下、没有反应，首先应该做什么？', ['确认周围安全后大声呼救，让人打 119 并拿 AED', '先给他喂水', '先找他家属的电话']],
        ['成人胸外按压的频率是？', ['每分钟 100–120 次', '每分钟 60–80 次', '每分钟 140–160 次']],
        ['成人胸外按压的深度是？', ['约 5 cm（不超过 6 cm）', '1–2 cm', '10 cm 以上']],
        ['按压的位置在哪里？', ['胸部正中、胸骨下半部', '左胸心脏的位置', '肚子正中']],
        ['AED 正在分析心律时，应该怎么做？', ['所有人离开，不要碰患者', '继续按压不要停', '摇晃患者让他醒来']],
        ['AED 电击之后应该？', ['立即继续胸外按压', '先等 1 分钟观察', '把电极片撕下来']],
        ['化学品溅入眼睛，正确做法是？', ['用洗眼器冲洗至少 15 分钟', '用手揉眼睛', '滴眼药水就可以']],
        ['同事的手被机器卷入，第一步做什么？', ['先停机断电，再施救', '马上把手拽出来', '先拍照上报']],
        ['没学过人工呼吸，遇到心脏骤停怎么办？', ['只做胸外按压，不要中断', '什么都不做，等 119', '只做人工呼吸']]
      ] },
    ko: { title: '작업 전 응급처치 교육', prev: '← 이전', next: '다음 →', start: '교육 시작 →', finish: '완료',
      intro_t: '신규 입사자 응급처치 교육', intro_d: '약 10분: 사람이 쓰러졌을 때 할 일, 가슴압박, AED 사용, 공장에서 흔한 부상 대처를 배우고, 압박 리듬 연습과 퀴즈로 마무리합니다.',
      name: '이름', code: '사번(선택)', need_name: '이름을 먼저 입력하세요', note: '작업 전 기초 교육이며, 공인 기관의 정식 심폐소생술·AED 실습 교육을 대신하지 않습니다.',
      s: [
        { t: '① 쓰러진 사람을 발견하면', li: ['주변이 안전한지 먼저 확인: 기계 정지, 감전·차량 위험 없음.', '양어깨를 두드리며 "괜찮으세요?" 크게 묻기.', '반응이 없으면 크게 도움을 요청하고, 한 사람은 119 신고, 다른 사람은 AED 가져오기.', '10초 이내로 가슴 움직임 확인: 숨을 쉬지 않거나 헐떡이는 호흡이면 심장정지로 보고 바로 가슴압박.'], key: '잘 몰라도 먼저 119에 신고하세요: 상황요원이 전화로 단계별로 안내합니다.' },
        { t: '② 가슴압박(심폐소생술)', li: ['환자를 단단한 바닥에 바로 눕힙니다.', '두 손을 겹쳐 손꿈치를 가슴 중앙, 가슴뼈 아래쪽 절반에 둡니다.', '팔을 곧게 펴고 몸을 환자 바로 위에 두어 수직으로 누릅니다.', '성인은 약 5 cm 깊이(6 cm 넘지 않게), 분당 100–120회.', '누른 뒤 가슴이 완전히 올라오게 하고, 중단을 최소화합니다.', '인공호흡을 배우지 않았다면 가슴압박만, 배웠다면 압박 30회 + 인공호흡 2회.', 'AED 도착, 환자의 정상 호흡·움직임, 또는 119 도착 때까지 계속합니다.'], key: '강하게, 빠르게, 멈추지 말고: 약 5 cm, 분당 100–120회.', src: '근거: 2025년 한국 심폐소생술 가이드라인(질병관리청·대한심폐소생협회)' },
        { t: '③ AED 사용', li: ['전원을 켜고 음성 안내를 따릅니다.', '패드 그림대로 부착: 하나는 오른쪽 빗장뼈 아래, 하나는 왼쪽 가슴 아래 옆구리(겨드랑이 아래). 땀·물기는 먼저 닦습니다.', '심장리듬 분석 중에는 모두 떨어지고 환자를 만지지 않습니다.', '충격 안내가 나오면 아무도 닿지 않았는지 확인하고 충격 버튼을 누릅니다.', '충격 후(또는 충격 불필요 안내 후) 즉시 가슴압박을 다시 시작합니다.', 'AED는 2분마다 다시 분석합니다. 패드는 떼지 말고 안내를 따르세요.'], key: 'AED가 말하는 대로 하세요. 분석·충격 중에는 아무도 환자를 만지지 않습니다.' },
        { t: '④ 공장에서 흔한 부상', li: ['심한 출혈: 깨끗한 천으로 상처를 직접 세게 누르고, 젖어도 떼지 말고 한 겹 더 대어 누르며 119 신고.', '화상: 흐르는 시원한 물에 약 20분 식히기. 치약·간장 금지, 물집 터뜨리지 않기.', '화학물질이 눈에 들어감: 즉시 세안기로 15분 이상 씻으며 눈동자를 굴리고 병원으로.', '열사병·온열질환: 그늘로 옮기고 옷을 느슨하게, 물과 바람으로 식히기. 의식이 흐리면 즉시 119, 물을 먹이지 않기.', '손 끼임·절단: 먼저 기계 정지·전원 차단 후 구조. 눌러서 지혈. 절단된 손가락은 깨끗한 거즈로 싸서 비닐봉지에 넣고 얼음물에 담가(얼음에 직접 닿지 않게) 함께 병원으로.', '높은 곳에서 떨어져 척추 손상이 의심되면 위험하지 않은 한 옮기지 않기.'], key: '먼저 기계 정지·전원 차단, 그다음 구조. 확신이 없으면 119.' }
      ],
      pr_t: '⑤ 압박 리듬 연습', pr_d: '박자에 맞춰 아래 검은 영역을 30번 연속으로 누르세요(압박 연습). 목표: 분당 100–120회.', pr_beat: '박자음', pr_on: '켜기', pr_off: '끄기', pr_tap: '여기를 누르기 = 압박', pr_rate: '회/분', pr_ok: '✓ 리듬 합격', pr_slow: '너무 느려요, 조금 더 빠르게', pr_fast: '너무 빨라요, 조금 천천히', pr_again: '다시 연습', pr_need: '먼저 30회 압박 연습을 마치세요',
      q_t: '⑥ 퀴즈', q_d: '9문제 중 8문제 이상 맞히면 통과.', q_submit: '제출', q_score: '점수 {s} / {n}', q_pass: '✓ 통과', q_fail: '불합격: 빨간 문제를 확인하고 다시 풀어 보세요', q_retry: '다시 풀기',
      c_t: '⑦ 수료', c_ok: '작업 전 응급처치 교육 수료', c_rate: '압박 리듬', c_score: '퀴즈', c_date: '날짜', c_valid: '매년 재교육을 권장합니다', c_sent: '저장했고 플랫폼으로 보냈습니다', c_saved: '이 기기에 저장했습니다', c_not: '아직 퀴즈를 통과하지 않았습니다',
      quiz: [
        ['쓰러져 반응이 없는 사람을 발견하면 먼저 할 일은?', ['주변 안전 확인 후 크게 도움 요청, 119 신고와 AED 요청', '먼저 물을 먹인다', '가족 연락처부터 찾는다']],
        ['성인 가슴압박 속도는?', ['분당 100–120회', '분당 60–80회', '분당 140–160회']],
        ['성인 가슴압박 깊이는?', ['약 5 cm(6 cm 넘지 않게)', '1–2 cm', '10 cm 이상']],
        ['압박 위치는?', ['가슴 중앙, 가슴뼈 아래쪽 절반', '왼쪽 가슴 심장 위치', '배 한가운데']],
        ['AED가 심장리듬을 분석할 때는?', ['모두 떨어지고 환자를 만지지 않는다', '압박을 계속한다', '환자를 흔들어 깨운다']],
        ['AED 충격 후에는?', ['즉시 가슴압박을 다시 한다', '1분 기다리며 지켜본다', '패드를 뗀다']],
        ['화학물질이 눈에 들어갔을 때 올바른 방법은?', ['세안기로 15분 이상 씻는다', '손으로 비빈다', '안약만 넣는다']],
        ['동료 손이 기계에 끼었을 때 첫 번째 할 일은?', ['기계를 멈추고 전원을 차단한 뒤 구조', '바로 손을 잡아당긴다', '사진부터 찍어 보고한다']],
        ['인공호흡을 배우지 않았는데 심장정지 환자를 만나면?', ['멈추지 말고 가슴압박만 한다', '아무것도 하지 않고 119를 기다린다', '인공호흡만 한다']]
      ] },
    en: { title: 'Pre-shift first-aid training', prev: '← Back', next: 'Next →', start: 'Start →', finish: 'Done',
      intro_t: 'First-aid training for new starters', intro_d: 'About 10 minutes: what to do when someone collapses, chest compressions, using an AED and common factory injuries — then a rhythm drill and a quiz.',
      name: 'Name', code: 'Employee ID (optional)', need_name: 'Please enter your name first', note: 'This is an induction course. It does not replace a certified hands-on CPR / AED course.',
      s: [
        { t: '① Someone collapses', li: ['Make sure it is safe: machine stopped, no electrical or vehicle hazard.', 'Tap both shoulders and shout "Are you OK?"', 'No response: shout for help; one person calls 119, another fetches the AED.', 'Look at the chest for no more than 10 seconds: not breathing, or only gasping, means cardiac arrest — start compressions now.'], key: 'Even if unsure, call 119 first: the dispatcher will coach you step by step.' },
        { t: '② Chest compressions (CPR)', li: ['Lay the person on their back on a firm surface.', 'Stack your hands, heel of the hand on the centre of the chest, lower half of the breastbone.', 'Arms straight, shoulders over the chest, push straight down.', 'Adults: about 5 cm deep (not more than 6 cm), 100–120 per minute.', 'Let the chest fully recoil after each push; minimise pauses.', 'Not trained in rescue breaths: compressions only. Trained: 30 compressions + 2 breaths.', 'Continue until the AED arrives, the person breathes normally or moves, or 119 takes over.'], key: 'Push hard, push fast, don\'t stop: about 5 cm, 100–120 per minute.', src: 'Source: 2025 Korean CPR Guidelines (KDCA · Korean Association of CardioPulmonary Resuscitation)' },
        { t: '③ Using an AED', li: ['Switch it on and follow the voice prompts.', 'Attach pads as pictured: one below the right collarbone, one on the lower left side of the chest (under the armpit). Dry a wet chest first.', 'While it analyses, everyone stand clear — do not touch the person.', 'If a shock is advised, check nobody is touching, then press the shock button.', 'Right after the shock (or "no shock advised"), restart compressions.', 'The AED re-analyses every 2 minutes; leave the pads on and keep following it.'], key: 'The AED talks — do what it says; nobody touches the person during analysis and shock.' },
        { t: '④ Common factory injuries', li: ['Heavy bleeding: press hard on the wound with a clean cloth; if soaked, add another layer on top and keep pressing; call 119.', 'Burns: cool under running water for about 20 minutes; no toothpaste or sauces; do not pop blisters.', 'Chemical in the eye: flush at the eyewash for at least 15 minutes, rolling the eye, then see a doctor.', 'Heat illness: move to shade, loosen clothing, cool with water and air; if confused or unconscious, call 119 and give nothing to drink.', 'Hand caught or finger cut off: stop and isolate the machine first; press to stop bleeding; wrap the finger in clean gauze, put it in a plastic bag and then in iced water (not touching ice), and send it with the person.', 'Fall from height with possible spinal injury: do not move the person unless there is danger.'], key: 'Stop and isolate the machine first, then help. If unsure, call 119.' }
      ],
      pr_t: '⑤ Compression rhythm drill', pr_d: 'Tap the dark area 30 times in a row with the beat (practice compressions). Target: 100–120 per minute.', pr_beat: 'Beat', pr_on: 'On', pr_off: 'Off', pr_tap: 'Tap here = compression', pr_rate: '/min', pr_ok: '✓ Rhythm OK', pr_slow: 'Too slow — a bit faster', pr_fast: 'Too fast — slow down a little', pr_again: 'Try again', pr_need: 'Finish the 30-compression drill first',
      q_t: '⑥ Quiz', q_d: 'Pass with 8 or more of 9 correct.', q_submit: 'Submit', q_score: 'Score {s} / {n}', q_pass: '✓ Passed', q_fail: 'Not passed: check the questions in red and try again', q_retry: 'Try again',
      c_t: '⑦ Completion', c_ok: 'Pre-shift first-aid training completed', c_rate: 'CPR rhythm', c_score: 'Quiz', c_date: 'Date', c_valid: 'Refresher recommended every year', c_sent: 'Saved and sent to the platform', c_saved: 'Saved on this device', c_not: 'Quiz not passed yet',
      quiz: [
        ['Someone has collapsed and does not respond. What first?', ['Check it is safe, shout for help, get someone to call 119 and fetch the AED', 'Give them water', 'Look for their family\'s phone number']],
        ['Adult compression rate?', ['100–120 per minute', '60–80 per minute', '140–160 per minute']],
        ['Adult compression depth?', ['About 5 cm (not more than 6 cm)', '1–2 cm', 'More than 10 cm']],
        ['Where do you push?', ['Centre of the chest, lower half of the breastbone', 'Over the heart on the left side', 'Middle of the belly']],
        ['While the AED analyses the rhythm you should…', ['Stand clear and not touch the person', 'Keep doing compressions', 'Shake the person to wake them']],
        ['After an AED shock you should…', ['Restart compressions immediately', 'Wait a minute and watch', 'Remove the pads']],
        ['Chemical splash in the eye — the right action?', ['Flush at the eyewash for at least 15 minutes', 'Rub the eye', 'Just use eye drops']],
        ['A co-worker\'s hand is caught in a machine. First step?', ['Stop and isolate the machine, then help', 'Pull the hand out at once', 'Take a photo and report']],
        ['Not trained in rescue breaths and someone is in cardiac arrest?', ['Do compressions only, without stopping', 'Do nothing and wait for 119', 'Do rescue breaths only']]
      ] }
  };
  function S() { return C[lang]; }
  var STEPS = ['intro', 's0', 's1', 's2', 's3', 'practice', 'quiz', 'cert'];
  var st = { i: 0, name: jget('shk3_fa_name', ''), code: jget('shk3_fa_code', '') || (localStorage.getItem('shk3_wcode') || ''), taps: [], rate: null, beat: true, quiz: null, answers: {}, checked: false, score: null, pass: false, saved: null };
  var tr = null; try { tr = new SHKTransport('trainee'); var room = SHKTransport.savedRoom(); if (room) tr.connectRoom(room); } catch (e) {}

  /* ---------- 节拍器 ---------- */
  var ac = null, metro = null;
  function click() { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); var o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = 1000; g.gain.value = 0.25; o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + 0.04); } catch (e) {} }
  function metroOn(on) { clearInterval(metro); metro = null; if (on) metro = setInterval(function () { click(); var b = document.querySelector('.beat'); if (b && !st.done) { b.style.borderColor = '#fff'; setTimeout(function () { b.style.borderColor = ''; }, 90); } }, 60000 / 110); }

  function shuffleQuiz() {
    return S().quiz.map(function (q, i) { var o = q[1].map(function (t, j) { return { t: t, ok: j === 0 }; }); for (var k = o.length - 1; k > 0; k--) { var r = Math.floor(Math.random() * (k + 1)), x = o[k]; o[k] = o[r]; o[r] = x; } return { q: q[0], o: o, i: i }; });
  }

  function render() {
    var s = S(), step = STEPS[st.i], m = $('faMain'), h = '';
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang; document.title = 'SHine-K · ' + s.title; $('faTitle').textContent = s.title;
    document.querySelectorAll('.langs button').forEach(function (b) { b.classList.toggle('on', b.dataset.l === lang); });
    $('faSteps').innerHTML = STEPS.map(function (x, i) { return '<i class="' + (i < st.i ? 'done' : i === st.i ? 'on' : '') + '"></i>'; }).join('');
    metroOn(false);
    if (step === 'intro') {
      h = '<div class="fa-card"><h2>' + esc(s.intro_t) + '</h2><p style="font-size:15px;color:var(--ink3)">' + esc(s.intro_d) + '</p>' +
        '<h3>' + esc(s.name) + '</h3><input class="fa-in" id="faName" value="' + esc(st.name) + '"><h3>' + esc(s.code) + '</h3><input class="fa-in" id="faCode" value="' + esc(st.code) + '">' +
        '<p class="fa-src">' + esc(s.note) + '</p><p class="fa-src" id="faErr" style="color:var(--r)"></p></div>';
    } else if (step.charAt(0) === 's') {
      var L = s.s[+step.slice(1)];
      h = '<div class="fa-card"><h2>' + esc(L.t) + '</h2><ol>' + L.li.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol><div class="fa-key">💡 ' + esc(L.key) + '</div>' + (L.src ? '<p class="fa-src">' + esc(L.src) + '</p>' : '') + '</div>';
    } else if (step === 'practice') {
      h = '<div class="fa-card"><h2>' + esc(s.pr_t) + '</h2><p style="font-size:14.5px;color:var(--ink3)">' + esc(s.pr_d) + '</p>' +
        '<div style="display:flex;gap:8px;align-items:center;margin:10px 0"><span>' + esc(s.pr_beat) + '</span><button id="faBeat">' + (st.beat ? s.pr_on : s.pr_off) + '</button><span style="flex:1"></span><b id="faCnt">' + st.taps.length + ' / 30</b></div>' +
        '<div class="fa-pad" id="faPad"><div><div class="beat" id="faB" style="margin:0 auto 10px"></div>' + esc(s.pr_tap) + '</div></div>' +
        '<div style="text-align:center;margin-top:12px"><span class="fa-big" id="faRate">' + (st.rate ? st.rate : '—') + '</span> <span>' + esc(s.pr_rate) + '</span><div id="faFb" style="font-weight:800;margin-top:6px"></div><button id="faAgain" style="margin-top:8px">' + esc(s.pr_again) + '</button></div></div>';
    } else if (step === 'quiz') {
      if (!st.quiz) st.quiz = shuffleQuiz();
      h = '<div class="fa-card"><h2>' + esc(s.q_t) + '</h2><p style="color:var(--ink3)">' + esc(s.q_d) + '</p>' +
        st.quiz.map(function (q, qi) {
          return '<div class="fa-q"><b>' + (qi + 1) + '. ' + esc(q.q) + '</b>' + q.o.map(function (o, oi) {
            var sel = st.answers[qi] === oi, cls = st.checked ? (o.ok ? 'ok' : sel ? 'bad' : '') : '';
            return '<label class="' + cls + '"><input type="radio" name="q' + qi + '" value="' + oi + '"' + (sel ? ' checked' : '') + (st.checked ? ' disabled' : '') + '> ' + esc(o.t) + '</label>';
          }).join('') + '</div>';
        }).join('') +
        (st.checked ? '<div class="fa-key" style="background:' + (st.pass ? 'var(--gbg);color:var(--g)' : 'var(--rbg)') + '">' + esc(s.q_score.replace('{s}', st.score).replace('{n}', st.quiz.length)) + ' · ' + esc(st.pass ? s.q_pass : s.q_fail) + '</div>' + (st.pass ? '' : '<button id="faRetry" style="width:100%;padding:12px">' + esc(s.q_retry) + '</button>')
          : '<button class="pri" id="faSubmit" style="width:100%;padding:12px">' + esc(s.q_submit) + '</button>') + '</div>';
    } else if (step === 'cert') {
      if (st.pass && st.rate && !st.saved) save();
      h = '<div class="fa-card">' + (st.pass ? '<div class="fa-cert"><div style="font-size:40px">🏅</div><h2>' + esc(s.c_ok) + '</h2><p style="font-size:18px;font-weight:900;margin:8px 0">' + esc(st.name) + (st.code ? ' · ' + esc(st.code) : '') + '</p>' +
        '<p>' + esc(s.c_rate) + ': <b>' + st.rate + ' ' + esc(s.pr_rate) + '</b> · ' + esc(s.c_score) + ': <b>' + st.score + '/' + st.quiz.length + '</b></p><p>' + esc(s.c_date) + ': ' + new Date(st.saved ? st.saved.ts : Date.now()).toLocaleDateString() + '</p>' +
        '<p class="fa-src">' + esc(s.c_valid) + '</p></div><p class="fa-src" style="text-align:center">' + esc(tr ? s.c_sent : s.c_saved) + '</p>' : '<div class="fa-key">' + esc(s.c_not) + '</div>') + '<p class="fa-src">' + esc(s.note) + '</p></div>';
    }
    m.innerHTML = h;
    $('faPrev').textContent = s.prev; $('faPrev').style.visibility = st.i ? 'visible' : 'hidden';
    $('faNext').textContent = step === 'intro' ? s.start : step === 'cert' ? s.finish : s.next;
    bind(step);
    window.scrollTo(0, 0);
  }
  function bind(step) {
    var s = S();
    if (step === 'practice') {
      var pad = $('faPad');
      metroOn(st.beat && st.taps.length < 30);
      $('faBeat').onclick = function () { st.beat = !st.beat; render(); };
      $('faAgain').onclick = function () { st.taps = []; st.rate = null; render(); };
      pad.addEventListener('pointerdown', function (e) {
        e.preventDefault(); if (st.taps.length >= 30) return;
        st.taps.push(performance.now()); var b = $('faB'); b.classList.add('hit'); setTimeout(function () { b.classList.remove('hit'); }, 90);
        $('faCnt').textContent = st.taps.length + ' / 30';
        if (st.taps.length >= 4) {
          var iv = []; for (var i = Math.max(1, st.taps.length - 10); i < st.taps.length; i++) iv.push(st.taps[i] - st.taps[i - 1]);
          var avg = iv.reduce(function (a, b2) { return a + b2; }, 0) / iv.length, r = Math.round(60000 / avg);
          $('faRate').textContent = r; $('faFb').textContent = r < 100 ? s.pr_slow : r > 120 ? s.pr_fast : s.pr_ok; $('faFb').style.color = r < 100 || r > 120 ? 'var(--w)' : 'var(--g)';
          if (st.taps.length >= 30) { st.rate = r; metroOn(false); }
        }
      });
    }
    if (step === 'quiz') {
      document.querySelectorAll('.fa-q input').forEach(function (r) { r.onchange = function () { st.answers[+r.name.slice(1)] = +r.value; }; });
      if ($('faSubmit')) $('faSubmit').onclick = function () {
        st.score = st.quiz.filter(function (q, qi) { return st.answers[qi] != null && q.o[st.answers[qi]].ok; }).length;
        st.pass = st.score >= 8; st.checked = true; render();
      };
      if ($('faRetry')) $('faRetry').onclick = function () { st.quiz = null; st.answers = {}; st.checked = false; render(); };
    }
  }
  function save() {
    var rateOk = st.rate >= 100 && st.rate <= 120;
    var rec = { ts: Date.now(), name: st.name, code: st.code || null, score: st.score, total: st.quiz.length, rate: st.rate, rateOk: rateOk, pass: st.pass && rateOk, lang: lang, kind: 'induction' };
    st.saved = rec; var all = jget('shk3_fa_records', []); all.push(rec); jset('shk3_fa_records', all.slice(-1000));
    if (tr) try { tr.send({ type: 'fa_cert', rec: rec }); } catch (e) {}
  }
  $('faPrev').onclick = function () { if (st.i > 0) { st.i--; render(); } };
  $('faNext').onclick = function () {
    var s = S(), step = STEPS[st.i];
    if (step === 'intro') {
      st.name = $('faName').value.trim(); st.code = $('faCode').value.trim();
      if (!st.name) { $('faErr').textContent = s.need_name; return; }
      jset('shk3_fa_name', st.name); jset('shk3_fa_code', st.code);
    }
    if (step === 'practice' && !st.rate) { $('faFb').textContent = s.pr_need; $('faFb').style.color = 'var(--r)'; return; }
    if (step === 'practice' && (st.rate < 100 || st.rate > 120)) { $('faFb').textContent = st.rate < 100 ? s.pr_slow : s.pr_fast; return; }
    if (step === 'quiz' && !st.pass) return;
    if (step === 'cert') { location.href = localStorage.getItem('shk3_wcode') ? 'worker.html' : 'index.html'; return; }
    st.i++; render();
  };
  document.querySelectorAll('.langs button').forEach(function (b) { b.onclick = function () { lang = b.dataset.l; jset('shk3_fa_lang', lang); st.quiz = null; st.answers = {}; st.checked = false; render(); }; });
  render();
})();
