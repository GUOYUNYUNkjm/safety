/* SHine-K 3.0 · AI 安全助手
 *  · 预案问答：先在知识库里检索（BM25，中文按两个字一组切词）；设置了大模型时，把检索到的条文交给大模型作答并标出处，
 *    没有设置时直接给出最相关的条文原文（不会编造）。
 *  · 隐患报告自动生成：汇总监控端的警报记录、作业票冻结、隐患 / 未遂上报、积分 → 可打印 / 下载 Markdown。
 *  · 事故案例检索：内置教学示例（标明非真实事件）+ 企业自己导入的案例。
 *  · 培训出题：内置题库 + （设置大模型时）按条文生成新题；答对给工人加积分。
 * 大模型密钥只保存在这台电脑的浏览器里，请求直接从浏览器发到你填写的服务商。
 */
(function () {
  'use strict';
  var t = SHKI18N.t, $ = function (id) { return document.getElementById(id); };
  SHKI18N.add({
    zh: { as_title: 'AI 安全助手', tb_qa: '💬 预案问答', tb_rep: '📝 隐患报告生成', tb_case: '📚 事故案例检索', tb_quiz: '🎯 培训出题',
      qa_ph: '例如：受限空间有人晕倒怎么办？', qa_go: '提问', qa_src: '依据', qa_local: '未设置大模型：下面是知识库里最相关的条文原文。', qa_none: '知识库里没有找到相关内容。', qa_thinking: '正在生成…',
      qa_chips: ['受限空间有人晕倒怎么办', '中暑怎么处理', '气体检测合格标准', '高温天能不能室外作业', '监护人能离开吗', '心率多高要停止作业'],
      rep_period: '时间范围', rep_today: '今天', rep_7: '近 7 天', rep_30: '近 30 天', rep_gen: '生成报告', rep_ai: '✨ 大模型润色总结', rep_md: '下载 Markdown', rep_copy: '复制', rep_print: '打印',
      rep_t: '安全隐患与事件报告', rep_range: '统计时间', rep_gen_at: '生成时间', rep_sum: '一、总体情况', rep_bykind: '二、事件分类', rep_byzone: '三、高发区域', rep_emg: '四、紧急事件', rep_permit: '五、作业票冻结',
      rep_reports: '六、隐患 / 未遂上报', rep_sugg: '七、整改建议', rep_pts: '八、安全积分前五', rep_n: '警报 {a} 条（红色 {d} 条），紧急事件 {e} 起，作业票冻结 {f} 次，隐患 / 未遂上报 {r} 条。', rep_nodata: '这个时间段没有记录。警报记录来自本机打开过的监控端。',
      rep_kind: '类型', rep_cnt: '次数', rep_zone: '区域', rep_time: '时间', rep_site: '现场', rep_msg: '内容',
      case_ph: '搜索案例，例如 受限空间、吊装', case_import: '导入企业案例 / 预案（.txt / .md）', case_imported: '已导入 {n} 段',
      qz_topic: '题目范围', qz_all: '全部', qz_plan: '应急处置', qz_rule: '规章标准', qz_n: '题数', qz_start: '开始答题', qz_ai: '✨ 大模型按条文出新题', qz_worker: '答题人工号（答对加积分）', qz_score: '得分 {s} / {n}', qz_award: '已给 {w} 加 {p} 分', qz_ref: '依据：{r}',
      set_title: '大模型设置（可选）', set_prov: '服务商', set_url: '接口地址', set_model: '模型', set_key: 'API 密钥', set_save: '保存', set_clear: '清除', set_note: '密钥只保存在这台电脑的浏览器里，请求直接从浏览器发到服务商。部分服务商不允许浏览器直接调用（跨域限制），这种情况需要企业自己的代理。不设置也可以用：问答会直接给出知识库原文。',
      llm_off: '知识库模式', llm_on: '大模型：{m}', llm_err: '大模型调用失败：{e}', kb_note: '内置知识库为中文；大模型会按你的提问语言回答。' },
    ko: { as_title: 'AI 안전 도우미', tb_qa: '💬 대응 질의응답', tb_rep: '📝 위험요인 보고서', tb_case: '📚 사고 사례 검색', tb_quiz: '🎯 교육 문제',
      qa_ph: '예: 밀폐공간에서 사람이 쓰러지면?', qa_go: '질문', qa_src: '근거', qa_local: '대형 모델 미설정: 지식베이스에서 가장 관련 있는 원문입니다.', qa_none: '관련 내용을 찾지 못했습니다.', qa_thinking: '생성 중…',
      qa_chips: ['受限空间有人晕倒怎么办', '中暑怎么处理', '气体检测合格标准', '高温天能不能室外作业', '监护人能离开吗', '心率多高要停止作业'],
      rep_period: '기간', rep_today: '오늘', rep_7: '최근 7일', rep_30: '최근 30일', rep_gen: '보고서 생성', rep_ai: '✨ 대형 모델 요약', rep_md: 'Markdown 다운로드', rep_copy: '복사', rep_print: '인쇄',
      rep_t: '안전 위험요인·사건 보고서', rep_range: '기간', rep_gen_at: '생성 시각', rep_sum: '1. 개요', rep_bykind: '2. 유형별', rep_byzone: '3. 빈발 구역', rep_emg: '4. 긴급 사건', rep_permit: '5. 작업허가 동결',
      rep_reports: '6. 위험요인 / 아차사고 신고', rep_sugg: '7. 개선 권고', rep_pts: '8. 안전 포인트 상위 5', rep_n: '경보 {a}건(빨강 {d}건), 긴급 {e}건, 작업허가 동결 {f}회, 신고 {r}건.', rep_nodata: '이 기간에는 기록이 없습니다. 경보 기록은 이 컴퓨터에서 연 관제 화면에서 옵니다.',
      rep_kind: '유형', rep_cnt: '건수', rep_zone: '구역', rep_time: '시각', rep_site: '현장', rep_msg: '내용',
      case_ph: '사례 검색, 예: 밀폐공간, 양중', case_import: '회사 사례 / 대응계획 가져오기 (.txt / .md)', case_imported: '{n}개 단락 가져옴',
      qz_topic: '범위', qz_all: '전체', qz_plan: '응급 대응', qz_rule: '규정·기준', qz_n: '문항 수', qz_start: '시작', qz_ai: '✨ 대형 모델로 새 문제', qz_worker: '응시자 사번 (정답 시 포인트)', qz_score: '점수 {s} / {n}', qz_award: '{w}에게 {p}점 지급', qz_ref: '근거: {r}',
      set_title: '대형 모델 설정 (선택)', set_prov: '제공사', set_url: 'API 주소', set_model: '모델', set_key: 'API 키', set_save: '저장', set_clear: '삭제', set_note: '키는 이 컴퓨터 브라우저에만 저장되며 요청은 브라우저에서 바로 제공사로 갑니다. 일부 제공사는 브라우저 직접 호출(CORS)을 막으므로 회사 프록시가 필요합니다. 설정하지 않아도 지식베이스 원문으로 답합니다.',
      llm_off: '지식베이스 모드', llm_on: '대형 모델: {m}', llm_err: '대형 모델 호출 실패: {e}', kb_note: '내장 지식베이스는 중국어입니다. 대형 모델은 질문 언어로 답합니다.' },
    en: { as_title: 'AI safety assistant', tb_qa: '💬 Emergency Q&A', tb_rep: '📝 Hazard report', tb_case: '📚 Case search', tb_quiz: '🎯 Training quiz',
      qa_ph: 'e.g. Someone collapsed in a confined space — what now?', qa_go: 'Ask', qa_src: 'Sources', qa_local: 'No LLM configured: these are the most relevant passages from the knowledge base.', qa_none: 'Nothing relevant found in the knowledge base.', qa_thinking: 'Generating…',
      qa_chips: ['受限空间有人晕倒怎么办', '中暑怎么处理', '气体检测合格标准', '高温天能不能室外作业', '监护人能离开吗', '心率多高要停止作业'],
      rep_period: 'Period', rep_today: 'Today', rep_7: 'Last 7 days', rep_30: 'Last 30 days', rep_gen: 'Generate', rep_ai: '✨ LLM summary', rep_md: 'Download Markdown', rep_copy: 'Copy', rep_print: 'Print',
      rep_t: 'Safety hazard and incident report', rep_range: 'Period', rep_gen_at: 'Generated', rep_sum: '1. Overview', rep_bykind: '2. By type', rep_byzone: '3. Hot spots', rep_emg: '4. Emergencies', rep_permit: '5. Permit freezes',
      rep_reports: '6. Hazard / near-miss reports', rep_sugg: '7. Corrective actions', rep_pts: '8. Top 5 safety points', rep_n: '{a} alerts ({d} red), {e} emergencies, {f} permit freezes, {r} reports.', rep_nodata: 'No records in this period. Alert history comes from center pages opened on this computer.',
      rep_kind: 'Type', rep_cnt: 'Count', rep_zone: 'Zone', rep_time: 'Time', rep_site: 'Site', rep_msg: 'Details',
      case_ph: 'Search cases, e.g. confined space, lifting', case_import: 'Import company cases / plans (.txt / .md)', case_imported: '{n} sections imported',
      qz_topic: 'Topic', qz_all: 'All', qz_plan: 'Emergency response', qz_rule: 'Rules & standards', qz_n: 'Questions', qz_start: 'Start', qz_ai: '✨ New questions from LLM', qz_worker: 'Worker ID (points for correct answers)', qz_score: 'Score {s} / {n}', qz_award: '{p} points to {w}', qz_ref: 'Source: {r}',
      set_title: 'LLM settings (optional)', set_prov: 'Provider', set_url: 'Endpoint', set_model: 'Model', set_key: 'API key', set_save: 'Save', set_clear: 'Clear', set_note: 'The key stays in this browser and requests go straight from the browser to the provider. Some providers block browser calls (CORS) and need a company proxy. Without an LLM, Q&A shows knowledge-base passages verbatim.',
      llm_off: 'Knowledge-base mode', llm_on: 'LLM: {m}', llm_err: 'LLM call failed: {e}', kb_note: 'The built-in knowledge base is in Chinese; the LLM answers in the language you ask in.' }
  });
  var KB = window.SHK_KB, tab = localStorage.getItem('shk3_astab') || 'qa', tr = new SHKTransport('assistant');
  SHKStore.attach(tr);
  var live = [];   // 打开期间收到的警报
  tr.on(function (m) { if (m.type === 'alert') live.push({ at: Date.now(), site: m.site, kind: m.kind, level: m.level, msg: m.msg, zone: m.loc && m.loc.zone, emg: m.emg, worker: m.worker }); });

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function docs() { var u = []; try { u = JSON.parse(localStorage.getItem('shk3_kb_user') || '[]'); } catch (e) {} return KB.docs.concat(u); }

  /* ---------- 检索：BM25 ---------- */
  function toks(s) {
    s = String(s).toLowerCase(); var out = [], m;
    var re = /[a-z0-9.%]+|[가-힣]+|[一-鿿]+/g;
    while ((m = re.exec(s))) {
      var w = m[0];
      if (/[一-鿿]/.test(w)) { if (w.length === 1) out.push(w); for (var i = 0; i < w.length - 1; i++) out.push(w.substr(i, 2)); }
      else { out.push(w); if (/[가-힣]/.test(w) && w.length > 2) for (var j = 0; j < w.length - 1; j++) out.push(w.substr(j, 2)); }
    }
    return out;
  }
  var idx = null;
  function build() {
    var D = docs(), df = {}, N = D.length, len = 0;
    var tf = D.map(function (d) { var tk = toks(d.title + ' ' + d.title + ' ' + (d.tag || []).join(' ') + ' ' + d.text), c = {}; tk.forEach(function (w) { c[w] = (c[w] || 0) + 1; }); Object.keys(c).forEach(function (w) { df[w] = (df[w] || 0) + 1; }); len += tk.length; return { c: c, n: tk.length }; });
    idx = { D: D, tf: tf, df: df, N: N, avg: len / Math.max(1, N) };
  }
  function search(q, type, k) {
    if (!idx) build();
    var qt = toks(q), k1 = 1.4, b = 0.75, res = [];
    idx.D.forEach(function (d, i) {
      if (type && d.type !== type) return;
      var s = 0, f = idx.tf[i];
      qt.forEach(function (w) { var n = f.c[w]; if (!n) return; var idf = Math.log(1 + (idx.N - idx.df[w] + 0.5) / (idx.df[w] + 0.5)); s += idf * n * (k1 + 1) / (n + k1 * (1 - b + b * f.n / idx.avg)); });
      if (s > 0) res.push({ d: d, s: s });
    });
    return res.sort(function (a, c) { return c.s - a.s; }).slice(0, k || 4);
  }
  function hl(text, q) {
    var words = toks(q).filter(function (w) { return w.length >= 2; }).sort(function (a, c) { return c.length - a.length; }).slice(0, 12);
    var h = esc(text); words.forEach(function (w) { h = h.split(esc(w)).join('<mark>' + esc(w) + '</mark>'); }); return h.replace(/<mark>(<mark>)+/g, '<mark>').replace(/(<\/mark>)+/g, '</mark>');
  }

  /* ---------- 大模型 ---------- */
  function llm() { try { return JSON.parse(localStorage.getItem('shk3_llm') || 'null'); } catch (e) { return null; } }
  async function ask(system, user) {
    var c = llm(); if (!c || !c.key) throw new Error('no llm');
    if (c.prov === 'anthropic') {
      var r = await fetch((c.url || 'https://api.anthropic.com') + '/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': c.key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: c.model || 'claude-sonnet-5-5', max_tokens: 1500, system: system, messages: [{ role: 'user', content: user }] }) });
      var j = await r.json(); if (!r.ok) throw new Error((j.error && j.error.message) || r.status);
      return (j.content || []).map(function (x) { return x.text || ''; }).join('');
    }
    var r2 = await fetch((c.url || '').replace(/\/$/, '') + '/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + c.key },
      body: JSON.stringify({ model: c.model, temperature: 0.2, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }) });
    var j2 = await r2.json(); if (!r2.ok) throw new Error((j2.error && j2.error.message) || r2.status);
    return j2.choices[0].message.content;
  }
  function llmPill() { var c = llm(); $('pillLlm').className = 'pill ' + (c && c.key ? 'ok' : ''); $('llmSt').textContent = c && c.key ? t('llm_on', { m: c.model || c.prov }) : t('llm_off'); }

  /* ---------- 页面 ---------- */
  function langs() { document.querySelectorAll('.langs button').forEach(function (b) { b.classList.toggle('on', b.dataset.l === SHKI18N.lang); b.onclick = function () { SHKI18N.set(b.dataset.l); langs(); render(); }; }); }
  function render() {
    SHKI18N.apply(); $('asTitle').textContent = t('as_title'); document.title = 'SHine-K 3.0 · ' + t('as_title'); llmPill();
    $('tabs').innerHTML = ['qa', 'rep', 'case', 'quiz'].map(function (k) { return '<button data-t="' + k + '" class="' + (k === tab ? 'on' : '') + '">' + t('tb_' + k) + '</button>'; }).join('');
    $('tabs').querySelectorAll('button').forEach(function (b) { b.onclick = function () { tab = b.dataset.t; localStorage.setItem('shk3_astab', tab); render(); }; });
    ({ qa: qaTab, rep: repTab, case: caseTab, quiz: quizTab })[tab]($('main'));
  }

  /* ===== 预案问答 ===== */
  var lastQ = '';
  function qaTab(box) {
    box.innerHTML = '<div class="card"><div class="ask"><input id="q" placeholder="' + esc(t('qa_ph')) + '" value="' + esc(lastQ) + '"><button class="pri" id="go">' + t('qa_go') + '</button></div>' +
      '<div class="chips">' + t('qa_chips').map(function (c) { return '<button>' + esc(c) + '</button>'; }).join('') + '</div><div class="muted" style="font-size:12px">' + t('kb_note') + '</div><div id="ans"></div></div>';
    $('go').onclick = function () { run($('q').value); };
    $('q').onkeydown = function (e) { if (e.key === 'Enter') run($('q').value); };
    box.querySelectorAll('.chips button').forEach(function (b) { b.onclick = function () { $('q').value = b.textContent; run(b.textContent); }; });
    if (lastQ) run(lastQ);
  }
  async function run(q) {
    q = String(q || '').trim(); if (!q) return; lastQ = q;
    var hits = search(q, null, 4), out = $('ans');
    var src = hits.map(function (h, i) { return '<div class="hit"><b>[' + (i + 1) + '] ' + esc(h.d.title) + '</b><p>' + hl(h.d.text, q) + '</p><div class="src">' + esc(h.d.type) + ' · ' + esc(h.d.id) + '</div></div>'; }).join('');
    if (!hits.length) { out.innerHTML = '<div class="answer">' + t('qa_none') + '</div>'; return; }
    var c = llm();
    if (!c || !c.key) { out.innerHTML = '<div class="note">' + t('qa_local') + '</div>' + src; return; }
    out.innerHTML = '<div class="answer">' + t('qa_thinking') + '</div><h3>' + t('qa_src') + '</h3>' + src;
    try {
      var ctx = hits.map(function (h, i) { return '[' + (i + 1) + '] ' + h.d.title + '\n' + h.d.text; }).join('\n\n');
      var a = await ask('你是工厂安全助手。只根据给出的资料回答，用编号 [1][2] 标注依据；资料里没有的就说“资料中没有”，不要编造。涉及急救时提醒拨打急救电话。用提问者的语言回答，简洁分步骤。',
        '资料：\n' + ctx + '\n\n问题：' + q);
      out.querySelector('.answer').textContent = a;
    } catch (e) { out.querySelector('.answer').className = 'answer err'; out.querySelector('.answer').textContent = t('llm_err', { e: e.message }); }
  }

  /* ===== 隐患报告 ===== */
  var KIND_SUGG = {
    zh: { ppe: '入口设置佩戴提示和镜子，班前会检查安全帽下颏带、反光背心；对危险区域开启门禁联动。', permit: '严格执行作业票，作业区设警戒线和门禁，未在名单的人员不得进入。',
      fall: '复核应急响应用时，检查作业面防滑、防坠设施，组织心肺复苏和 AED 培训。', hr: '调整作业强度，增加轮换休息和补水，高温时段减少露天作业，关注心率预警人员。',
      heat: '按《防暑降温措施管理办法》调整作息，配备防暑降温饮料和休息点。', guard: '加强监护人履职检查，监护人绑定手表，禁止离岗和看手机。', dev: '检查手表佩戴松紧和电量，班前确认连接。',
      fire: '复盘火警处置和疏散时间，检查消防器材和疏散通道。', gas: '加强气体持续检测和通风，检测仪定期校准。', other: '分析原因，落实责任人和整改期限。' },
    ko: { ppe: '입구에 착용 안내와 거울 설치, 작업 전 안전모 턱끈·조끼 점검, 위험구역 출입 연동.', permit: '작업허가 엄격 시행, 작업구역 경계선·출입 통제, 명단 외 인원 출입 금지.',
      fall: '비상 대응 시간 점검, 미끄럼·추락 방지 설비 점검, 심폐소생술·AED 교육.', hr: '작업 강도 조정, 교대 휴식·수분 보충, 고온 시간대 실외 작업 축소, 심박 경고 인원 관리.',
      heat: '고온 기준에 따라 작업 시간 조정, 음료와 휴게 장소 제공.', guard: '감시자 이행 점검, 감시자 워치 연결, 이탈·휴대폰 사용 금지.', dev: '워치 착용 상태와 배터리 점검, 작업 전 연결 확인.',
      fire: '화재 대응·대피 시간 복기, 소방설비와 대피로 점검.', gas: '가스 연속 측정과 환기 강화, 측정기 정기 교정.', other: '원인 분석, 책임자와 기한 지정.' },
    en: { ppe: 'Post PPE reminders and a mirror at entrances, check chin straps and vests at the pre-shift talk, link gates for danger zones.', permit: 'Enforce permits strictly; barricade and gate work areas; nobody off the permit may enter.',
      fall: 'Review response times, check anti-slip and fall protection, run CPR and AED training.', hr: 'Lower work intensity, add rotation, rest and water, cut outdoor work in hot hours, follow up on HR warnings.',
      heat: 'Adjust hours to the heat rules, provide drinks and rest areas.', guard: 'Audit guardians; bind their watches; no leaving the post or phone use.', dev: 'Check watch fit and battery; confirm connection before the shift.',
      fire: 'Review fire response and evacuation time; inspect extinguishers and exits.', gas: 'Strengthen continuous gas testing and ventilation; calibrate detectors.', other: 'Analyse causes; assign owners and deadlines.' }
  };
  function group(kind) {
    if (/helmet|vest|zone_ppe/.test(kind)) return 'ppe'; if (/permit|unauth|frozen|access/.test(kind)) return 'permit';
    if (/fall|sos|collapse|impact|confirm/.test(kind)) return 'fall'; if (/stop_work|risk|hr_/.test(kind)) return 'hr'; if (/heat|outdoor/.test(kind)) return 'heat';
    if (/guard/.test(kind)) return 'guard'; if (/dev_lost/.test(kind)) return 'dev'; if (/fire/.test(kind)) return 'fire'; return 'other';
  }
  var repMd = '';
  function repTab(box) {
    box.innerHTML = '<div class="card noprint"><div class="row" style="gap:8px;flex-wrap:wrap"><span class="muted">' + t('rep_period') + '</span><div class="seg" id="per"><button data-d="1" class="on">' + t('rep_today') + '</button><button data-d="7">' + t('rep_7') + '</button><button data-d="30">' + t('rep_30') + '</button></div>' +
      '<button class="pri" id="gen">' + t('rep_gen') + '</button><button id="ai">' + t('rep_ai') + '</button><span class="sp"></span><button id="md">' + t('rep_md') + '</button><button id="cp">' + t('rep_copy') + '</button><button id="pr">' + t('rep_print') + '</button></div></div><div id="rep"></div>';
    var days = 1;
    box.querySelectorAll('#per button').forEach(function (b) { b.onclick = function () { box.querySelectorAll('#per button').forEach(function (x) { x.classList.toggle('on', x === b); }); days = +b.dataset.d; gen(days); }; });
    $('gen').onclick = function () { gen(days); };
    $('md').onclick = function () { var u = URL.createObjectURL(new Blob([repMd], { type: 'text/markdown' })), a = document.createElement('a'); a.href = u; a.download = 'safety-report-' + new Date().toISOString().slice(0, 10) + '.md'; a.click(); };
    $('cp').onclick = function () { try { navigator.clipboard.writeText(repMd); } catch (e) {} };
    $('pr').onclick = function () { window.print(); };
    $('ai').onclick = async function () {
      if (!llm() || !llm().key) { openSet(); return; }
      var el = $('rep').querySelector('[data-ai]'); el.textContent = t('qa_thinking');
      try { el.textContent = await ask('你是企业安全管理员，根据统计数据写一段 150 字以内的总结和三条最重要的整改建议，不要编造数据，用提问的语言。', repMd); repMd = repMd.replace('<!--AI-->', '\n' + el.textContent + '\n'); }
      catch (e) { el.textContent = t('llm_err', { e: e.message }); }
    };
    gen(days);
  }
  function hist() { var h = []; try { h = JSON.parse(localStorage.getItem('shk3_alert_hist') || '[]'); } catch (e) {} var seen = {}; return h.concat(live).filter(function (a) { var k = a.aid || (a.at + a.msg); if (seen[k]) return false; seen[k] = 1; return true; }); }
  function gen(days) {
    var from = days === 1 ? new Date(new Date().toDateString()).getTime() : Date.now() - days * 86400000;
    var A = hist().filter(function (a) { return a.at >= from; }), R = SHKStore.all('reports').filter(function (r) { return r.at >= from; });
    var F = []; SHKPermit.all().forEach(function (p) { (p.log || []).forEach(function (l) { if (l.what === 'freeze' || /冻结|Freeze|동결/.test(l.what)) if (l.at >= from) F.push({ at: l.at, p: p, reason: l.reason }); }); if (p.freeze && p.freeze.at >= from && !F.some(function (x) { return x.p.id === p.id && Math.abs(x.at - p.freeze.at) < 2000; })) F.push({ at: p.freeze.at, p: p, reason: p.freeze.reason }); });
    var E = A.filter(function (a) { return a.emg && a.level === 'danger'; });
    var byK = {}, byZ = {}, groups = {};
    A.forEach(function (a) { var g = group(a.kind || ''); byK[g] = (byK[g] || 0) + 1; groups[g] = 1; var z = (a.site || '') + (a.zone ? ' · ' + a.zone : ''); byZ[z] = (byZ[z] || 0) + 1; });
    F.forEach(function () { groups.gas = groups.gas || 0; });
    if (F.some(function (f) { return /气体|gas|가스/i.test(f.reason || ''); })) groups.gas = 1;
    var tot = {}; SHKStore.all('points').forEach(function (p) { tot[p.worker] = (tot[p.worker] || 0) + (+p.delta || 0); });
    var top = Object.keys(tot).sort(function (a, b) { return tot[b] - tot[a]; }).slice(0, 5);
    var GN = { zh: { ppe: '防护用品', permit: '作业票 / 授权', fall: '跌倒 / 晕倒 / 求救', hr: '心率 / 停止作业', heat: '高温', guard: '监护人', dev: '手表信号', fire: '火警', gas: '气体', other: '其他' },
      ko: { ppe: '보호구', permit: '작업허가 / 권한', fall: '넘어짐 / 실신 / 구조', hr: '심박 / 작업 중지', heat: '고온', guard: '감시자', dev: '워치 신호', fire: '화재', gas: '가스', other: '기타' },
      en: { ppe: 'PPE', permit: 'Permits / authorization', fall: 'Falls / collapse / SOS', hr: 'Heart rate / stop work', heat: 'Heat', guard: 'Guardians', dev: 'Watch signal', fire: 'Fire', gas: 'Gas', other: 'Other' } }[SHKI18N.lang] || {};
    var S = KIND_SUGG[SHKI18N.lang] || KIND_SUGG.zh, fmt = function (x) { return new Date(x).toLocaleString(); };
    var md = '# ' + t('rep_t') + '\n\n' + t('rep_range') + '：' + new Date(from).toLocaleDateString() + ' – ' + new Date().toLocaleDateString() + '  \n' + t('rep_gen_at') + '：' + fmt(Date.now()) + '\n\n';
    md += '## ' + t('rep_sum') + '\n\n' + t('rep_n', { a: A.length, d: A.filter(function (a) { return a.level === 'danger'; }).length, e: E.length, f: F.length, r: R.length }) + '\n\n<!--AI-->\n\n';
    if (!A.length && !R.length && !F.length) md += t('rep_nodata') + '\n\n';
    md += '## ' + t('rep_bykind') + '\n\n| ' + t('rep_kind') + ' | ' + t('rep_cnt') + ' |\n|---|---|\n' + Object.keys(byK).sort(function (a, b) { return byK[b] - byK[a]; }).map(function (k) { return '| ' + (GN[k] || k) + ' | ' + byK[k] + ' |'; }).join('\n') + '\n\n';
    md += '## ' + t('rep_byzone') + '\n\n| ' + t('rep_zone') + ' | ' + t('rep_cnt') + ' |\n|---|---|\n' + Object.keys(byZ).sort(function (a, b) { return byZ[b] - byZ[a]; }).slice(0, 8).map(function (k) { return '| ' + (k || '—') + ' | ' + byZ[k] + ' |'; }).join('\n') + '\n\n';
    md += '## ' + t('rep_emg') + '\n\n' + (E.length ? '| ' + t('rep_time') + ' | ' + t('rep_site') + ' | ' + t('rep_msg') + ' |\n|---|---|---|\n' + E.map(function (a) { return '| ' + fmt(a.at) + ' | ' + a.site + (a.zone ? ' · ' + a.zone : '') + ' | ' + String(a.msg).replace(/\|/g, '/') + ' |'; }).join('\n') : '—') + '\n\n';
    md += '## ' + t('rep_permit') + '\n\n' + (F.length ? F.map(function (f) { return '- ' + fmt(f.at) + ' · ' + SHKPermit.typeName(f.p.type) + ' · ' + f.p.id + ' · ' + (f.reason || ''); }).join('\n') : '—') + '\n\n';
    md += '## ' + t('rep_reports') + '\n\n' + (R.length ? R.map(function (r) { return '- [' + ({ zh: { nearmiss: '未遂', hazard: '隐患', low: '一般', mid: '较大', high: '重大' }, ko: { nearmiss: '아차사고', hazard: '위험요인', low: '일반', mid: '중대', high: '심각' }, en: { nearmiss: 'Near miss', hazard: 'Hazard', low: 'minor', mid: 'major', high: 'serious' } }[SHKI18N.lang] || {})[r.type] + ' / ' + (({ zh: { low: '一般', mid: '较大', high: '重大' }, ko: { low: '일반', mid: '중대', high: '심각' }, en: { low: 'minor', mid: 'major', high: 'serious' } }[SHKI18N.lang] || {})[r.sev] || r.sev) + '] ' + (r.where || '') + '：' + r.text + '（' + (r.status || 'new') + '）'; }).join('\n') : '—') + '\n\n';
    md += '## ' + t('rep_sugg') + '\n\n' + Object.keys(groups).map(function (g) { return '- **' + (GN[g] || g) + '**：' + (S[g] || S.other); }).join('\n') + (Object.keys(groups).length ? '' : '—') + '\n\n';
    md += '## ' + t('rep_pts') + '\n\n' + (top.length ? top.map(function (c, i) { var r = SHKStore.get('roster', c); return (i + 1) + '. ' + (r && r.name ? r.name + ' (' + c + ')' : c) + ' — ' + tot[c]; }).join('\n') : '—') + '\n';
    repMd = md;
    $('rep').innerHTML = '<div class="rep">' + mdHtml(md).replace('<!--AI-->', '<div class="answer" data-ai></div>') + '</div>';
    if (!$('rep').querySelector('[data-ai]').textContent) $('rep').querySelector('[data-ai]').style.display = 'none';
    $('ai').addEventListener('click', function () { var el = $('rep').querySelector('[data-ai]'); if (el) el.style.display = ''; }, { once: true });
  }
  function mdHtml(md) {
    var lines = md.split('\n'), out = [], tbl = null;
    var inline = function (s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); };
    lines.forEach(function (l) {
      if (/^\|/.test(l)) { if (/^\|[-| ]+\|$/.test(l)) return; var cells = l.split('|').slice(1, -1).map(function (c) { return c.trim(); }); if (!tbl) { tbl = []; out.push('<table><tr>' + cells.map(function (c) { return '<th>' + inline(c) + '</th>'; }).join('') + '</tr>'); } else out.push('<tr>' + cells.map(function (c) { return '<td>' + inline(c) + '</td>'; }).join('') + '</tr>'); return; }
      if (tbl) { out.push('</table>'); tbl = null; }
      if (l === '<!--AI-->') return out.push(l);
      if (/^# /.test(l)) return out.push('<h1>' + inline(l.slice(2)) + '</h1>'); if (/^## /.test(l)) return out.push('<h2>' + inline(l.slice(3)) + '</h2>');
      if (/^- /.test(l)) return out.push('<div>• ' + inline(l.slice(2)) + '</div>'); if (/^\d+\. /.test(l)) return out.push('<div>' + inline(l) + '</div>');
      if (l.trim()) out.push('<p>' + inline(l.replace(/  $/, '')) + '</p>');
    });
    if (tbl) out.push('</table>');
    return out.join('');
  }

  /* ===== 案例检索 ===== */
  function caseTab(box) {
    var tags = {}; docs().filter(function (d) { return d.type === 'case'; }).forEach(function (d) { (d.tag || []).forEach(function (x) { tags[x] = 1; }); });
    box.innerHTML = '<div class="card"><div class="ask"><input id="cq" placeholder="' + esc(t('case_ph')) + '"></div><div class="chips">' + Object.keys(tags).map(function (x) { return '<button>' + esc(x) + '</button>'; }).join('') + '</div>' +
      '<label class="btn">' + t('case_import') + '<input type="file" accept=".txt,.md,text/plain" id="imp" hidden multiple></label> <span class="muted" id="impMsg"></span><div id="cres"></div></div>';
    var show = function (q) {
      var list = q ? search(q, 'case', 20).map(function (h) { return h.d; }) : docs().filter(function (d) { return d.type === 'case'; });
      $('cres').innerHTML = list.length ? list.map(function (d) { return '<div class="hit"><b>' + esc(d.title) + '</b><p>' + (q ? hl(d.text, q) : esc(d.text)) + '</p><div class="src">' + (d.tag || []).map(esc).join(' · ') + '</div></div>'; }).join('') : '<div class="empty">' + t('qa_none') + '</div>';
    };
    $('cq').oninput = function () { show(this.value.trim()); };
    box.querySelectorAll('.chips button').forEach(function (b) { b.onclick = function () { $('cq').value = b.textContent; show(b.textContent); }; });
    $('imp').onchange = async function () {
      var u = []; try { u = JSON.parse(localStorage.getItem('shk3_kb_user') || '[]'); } catch (e) {}
      var n = 0;
      for (var i = 0; i < this.files.length; i++) {
        var f = this.files[i], txt = await f.text(), type = /预案|plan|대응/i.test(f.name) ? 'plan' : /规|标准|rule|규정/i.test(f.name) ? 'rule' : 'case';
        txt.split(/\n\s*\n|^#+ /m).map(function (x) { return x.trim(); }).filter(function (x) { return x.length > 30; }).forEach(function (p, j) {
          u.push({ id: 'user-' + f.name + '-' + j, type: type, tag: [f.name.replace(/\.\w+$/, '')], title: f.name.replace(/\.\w+$/, '') + ' · ' + (p.split('\n')[0].slice(0, 30)), text: p }); n++;
        });
      }
      localStorage.setItem('shk3_kb_user', JSON.stringify(u)); idx = null; $('impMsg').textContent = t('case_imported', { n: n }); show('');
    };
    show('');
  }

  /* ===== 培训出题 ===== */
  var quiz = null;
  function quizTab(box) {
    box.innerHTML = '<div class="card"><div class="row" style="gap:8px;flex-wrap:wrap"><span class="muted">' + t('qz_topic') + '</span><div class="seg" id="qt"><button data-v="" class="on">' + t('qz_all') + '</button><button data-v="plan">' + t('qz_plan') + '</button><button data-v="rule">' + t('qz_rule') + '</button></div>' +
      '<span class="muted">' + t('qz_n') + '</span><select id="qn"><option>5</option><option selected>10</option><option>18</option></select><button class="pri" id="qs">' + t('qz_start') + '</button><button id="qa">' + t('qz_ai') + '</button></div>' +
      '<label class="row" style="gap:6px;margin-top:8px"><span class="muted">' + t('qz_worker') + '</span><input id="qw" list="qwl" style="width:120px" value="' + esc(localStorage.getItem('shk3_qw') || '') + '"><datalist id="qwl">' + SHKStore.all('roster').map(function (r) { return '<option value="' + esc(r.id) + '">' + esc(r.name || '') + '</option>'; }).join('') + '</datalist></label><div id="qbox"></div></div>';
    var topic = '';
    box.querySelectorAll('#qt button').forEach(function (b) { b.onclick = function () { box.querySelectorAll('#qt button').forEach(function (x) { x.classList.toggle('on', x === b); }); topic = b.dataset.v; }; });
    $('qs').onclick = function () {
      var bank = KB.quiz.filter(function (q) { return !topic || (q.ref || '').indexOf(topic) === 0; });
      bank = bank.map(function (q) { return [Math.random(), q]; }).sort(function (a, b) { return a[0] - b[0]; }).map(function (x) { return x[1]; }).slice(0, +$('qn').value);
      quiz = { qs: bank, ans: {} }; drawQuiz();
    };
    $('qa').onclick = async function () {
      if (!llm() || !llm().key) { openSet(); return; }
      var pool = docs().filter(function (d) { return !topic || d.type === topic; }), d = pool[Math.floor(Math.random() * pool.length)];
      $('qbox').innerHTML = '<div class="answer">' + t('qa_thinking') + '</div>';
      try {
        var raw = await ask('你是安全培训出题老师。只根据给出的条文出 4 道单选题，每题 4 个选项且只有一个正确。只输出 JSON 数组：[{"q":"题干","o":["A","B","C","D"],"a":正确选项下标}]，不要别的文字。', d.title + '\n' + d.text);
        var arr = JSON.parse(raw.slice(raw.indexOf('['), raw.lastIndexOf(']') + 1));
        quiz = { qs: arr.filter(function (q) { return q.q && q.o && q.o.length === 4 && q.a >= 0 && q.a < 4; }).map(function (q) { q.ref = d.id; return q; }), ans: {} }; drawQuiz();
      } catch (e) { $('qbox').innerHTML = '<div class="answer err">' + esc(t('llm_err', { e: e.message })) + '</div>'; }
    };
    if (quiz) drawQuiz();
  }
  function drawQuiz() {
    var n = quiz.qs.length, done = Object.keys(quiz.ans).length, score = quiz.qs.filter(function (q, i) { return quiz.ans[i] === q.a; }).length;
    var refT = function (id) { var d = docs().find(function (x) { return x.id === id; }); return d ? d.title : id; };
    $('qbox').innerHTML = quiz.qs.map(function (q, i) {
      var a = quiz.ans[i];
      return '<div class="qz"><b>' + (i + 1) + '. ' + esc(q.q) + '</b>' + q.o.map(function (o, j) {
        var cls = a == null ? '' : j === q.a ? 'right' : j === a ? 'wrong' : '';
        return '<button class="o ' + cls + '" data-i="' + i + '" data-j="' + j + '"' + (a != null ? ' disabled' : '') + '>' + 'ABCD'[j] + '. ' + esc(o) + '</button>';
      }).join('') + (a != null ? '<div class="why">' + t('qz_ref', { r: refT(q.ref) }) + '</div>' : '') + '</div>';
    }).join('') + (done === n && n ? '<div class="answer" style="margin-top:12px"><b>' + t('qz_score', { s: score, n: n }) + '</b> <span id="qaw"></span></div>' : '');
    $('qbox').querySelectorAll('.o').forEach(function (b) { b.onclick = function () { quiz.ans[b.dataset.i] = +b.dataset.j; drawQuiz(); }; });
    if (done === n && n && !quiz.awarded) {
      quiz.awarded = true;
      var w = ($('qw') && $('qw').value.trim()) || ''; if (w) localStorage.setItem('shk3_qw', w);
      var key = 'quiz:' + w + ':' + new Date().toISOString().slice(0, 10);
      if (w && score > 0 && !SHKStore.get('points', key)) { SHKStore.put('points', { id: key, worker: w, delta: Math.min(10, score), reason: t('tb_quiz') + ' ' + score + '/' + n, at: Date.now() }); $('qaw').textContent = t('qz_award', { w: w, p: Math.min(10, score) }); }
    }
  }

  /* ===== 设置 ===== */
  function openSet() {
    var c = llm() || { prov: 'openai', url: 'https://api.deepseek.com', model: 'deepseek-chat' };
    $('setBox').innerHTML = '<h2>' + t('set_title') + '</h2><div class="setf"><label>' + t('set_prov') + '<select id="sp"><option value="openai"' + (c.prov !== 'anthropic' ? ' selected' : '') + '>OpenAI-compatible (DeepSeek / Qwen / …)</option><option value="anthropic"' + (c.prov === 'anthropic' ? ' selected' : '') + '>Anthropic Claude</option></select></label>' +
      '<label>' + t('set_url') + '<input id="su" value="' + esc(c.url || '') + '"></label><label>' + t('set_model') + '<input id="sm" value="' + esc(c.model || '') + '"></label>' +
      '<label>' + t('set_key') + '<input id="sk" type="password" autocomplete="off" value="' + esc(c.key || '') + '"></label><div class="note">' + t('set_note') + '</div>' +
      '<div class="row" style="gap:8px"><button class="pri" id="ss">' + t('set_save') + '</button><button id="sc">' + t('set_clear') + '</button><button id="sx">✕</button></div></div>';
    $('setDlg').style.display = 'grid';
    $('sp').onchange = function () { if (this.value === 'anthropic') { $('su').value = 'https://api.anthropic.com'; $('sm').value = 'claude-sonnet-5-5'; } else { $('su').value = 'https://api.deepseek.com'; $('sm').value = 'deepseek-chat'; } };
    $('ss').onclick = function () { localStorage.setItem('shk3_llm', JSON.stringify({ prov: $('sp').value, url: $('su').value.trim(), model: $('sm').value.trim(), key: $('sk').value.trim() })); $('setDlg').style.display = 'none'; render(); };
    $('sc').onclick = function () { localStorage.removeItem('shk3_llm'); $('setDlg').style.display = 'none'; render(); };
    $('sx').onclick = function () { $('setDlg').style.display = 'none'; };
  }
  $('btnSet').onclick = openSet;
  var room = SHKTransport.savedRoom(); if (room) tr.connectRoom(room);
  langs(); render();
  window.SHKAssistant = { search: search, toks: toks };
})();
