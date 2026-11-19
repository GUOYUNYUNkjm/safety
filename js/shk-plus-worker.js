/* SHine-K 3.0 · 工人手机端扩展：岗前急救培训入口 + 本现场的急救物品位置
 * 紧急时“最近的急救物品”由现场端以普通通知推送（手机 → 手表），这里只显示常备清单。 */
(function () {
  'use strict';
  if (!window.SHKI18N) return;
  var t = SHKI18N.t, $ = function (id) { return document.getElementById(id); };
  function jget(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  SHKI18N.add({
    zh: { pw_t: '✚ 急救', pw_train: '岗前急救培训', pw_go: '开始 / 复习培训 →', pw_ok: '✓ 已结业 {d}', pw_no: '✕ 还没完成，上岗前必须完成', pw_pts: '本现场的急救物品', pw_none: '还没有登记', pw_tip: '发生紧急情况时，最近的 AED / 急救箱会推送到手机和手表。',
      md_t: '🔒 我的数据', md_d: '系统为了安全收集了你的哪些数据、今天的结果。视频不离开现场电脑，只传骨架坐标和数字。', md_cat: ['心率（手表）：判断中暑、晕倒', '所在区域（手表 / 摄像头）：计算粉尘和噪声暴露、找最近的急救物品', '骨架姿势（不含画面）：跌倒、踉跄、姿势负荷', '安全帽 / 口罩是否佩戴', '培训和反应测试成绩'], md_today: '今天', md_dust: '粉尘暴露', md_noise: '噪声暴露', md_none: '今天还没有数据', md_keep: '保存 {d} 天后自动删除；想查看全部或删除，请联系安全负责人。',
      pw_aed: 'AED', pw_kit: '急救箱', pw_eyewash: '洗眼器 / 紧急淋浴', pw_stretcher: '担架', pw_ext: '灭火器' },
    ko: { pw_t: '✚ 응급처치', pw_train: '작업 전 응급처치 교육', pw_go: '교육 시작 / 복습 →', pw_ok: '✓ 수료 {d}', pw_no: '✕ 미이수: 작업 전에 반드시 완료', pw_pts: '이 현장의 응급용품', pw_none: '등록된 항목 없음', pw_tip: '긴급 상황이 생기면 가장 가까운 AED·구급함 위치가 휴대폰과 워치로 옵니다.',
      md_t: '🔒 내 데이터', md_d: '안전을 위해 어떤 데이터를 모으는지, 오늘 결과는 어떤지 보여 줍니다. 영상은 현장 PC를 떠나지 않고 골격 좌표와 숫자만 전송합니다.', md_cat: ['심박(워치): 온열질환·실신 판단', '위치 구역(워치/카메라): 분진·소음 노출 계산, 가까운 응급용품 안내', '골격 자세(영상 없음): 넘어짐·휘청·자세 부담', '안전모·마스크 착용 여부', '교육·반응 검사 결과'], md_today: '오늘', md_dust: '분진 노출', md_noise: '소음 노출', md_none: '오늘 데이터 없음', md_keep: '{d}일 보관 후 자동 삭제. 전체 열람·삭제는 안전책임자에게 요청하세요.',
      pw_aed: 'AED', pw_kit: '구급함', pw_eyewash: '세안기·긴급샤워', pw_stretcher: '들것', pw_ext: '소화기' },
    en: { pw_t: '✚ First aid', pw_train: 'Pre-shift first-aid training', pw_go: 'Start / review →', pw_ok: '✓ Completed {d}', pw_no: '✕ Not done — required before work', pw_pts: 'First-aid equipment at this site', pw_none: 'Nothing registered yet', pw_tip: 'In an emergency, the nearest AED / kit is pushed to your phone and watch.',
      md_t: '🔒 My data', md_d: 'What the system collects about you for safety, and today\'s results. Video never leaves the site PC; only skeleton points and numbers are sent.', md_cat: ['Heart rate (watch): heat illness, collapse', 'Zone (watch / camera): dust and noise dose, nearest first-aid kit', 'Skeleton posture (no video): falls, stumbles, posture load', 'Helmet / mask worn or not', 'Training and reaction-test results'], md_today: 'Today', md_dust: 'Dust dose', md_noise: 'Noise dose', md_none: 'No data today', md_keep: 'Kept {d} days, then deleted automatically. To see everything or ask for deletion, contact the safety lead.',
      pw_aed: 'AED', pw_kit: 'First-aid kit', pw_eyewash: 'Eyewash / shower', pw_stretcher: 'Stretcher', pw_ext: 'Extinguisher' }
  });
  var IC = { aed: '❤️‍🩹', kit: '🩹', eyewash: '🚿', stretcher: '🛏', ext: '🧯' };
  var card = document.createElement('div'); card.className = 'card'; card.id = 'pwAid';
  var anchor = document.querySelector('#mine') && document.querySelector('#mine').closest('.card');
  if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(card, anchor.nextSibling); else document.body.appendChild(card);
  var md = document.createElement('div'); md.className = 'card'; md.id = 'pwMyData'; card.parentNode.insertBefore(md, card.nextSibling);
  function renderMd() {
    var me = localStorage.getItem('shk3_wcode') || '', ex = jget('shk3_px_expo_me', null), cats = t('md_cat');
    var d = ex && me ? ex.dust[me] : null, n = ex && me ? ex.noise[me] : null;
    var bar = function (v) { var c = v >= 100 ? 'var(--r)' : v >= 80 ? 'var(--w)' : v >= 50 ? '#F5B400' : 'var(--g)'; return '<div style="display:flex;gap:6px;align-items:center"><div style="flex:1;height:8px;background:#E3E8F0;border-radius:5px;overflow:hidden"><i style="display:block;height:100%;width:' + Math.min(100, v) + '%;background:' + c + '"></i></div><b style="color:' + c + '">' + v + '%</b></div>'; };
    md.innerHTML = '<h3>' + t('md_t') + '</h3><div class="muted" style="font-size:12px;margin-bottom:6px">' + t('md_d') + '</div><ul style="padding-left:18px;font-size:13px">' + (Array.isArray(cats) ? cats.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') : '') + '</ul>' +
      '<div style="margin-top:8px;font-size:13px"><b>' + t('md_today') + '</b>' + (d == null && n == null ? '<div class="muted">' + t('md_none') + '</div>' : (d != null ? '<div>' + t('md_dust') + bar(d) + '</div>' : '') + (n != null ? '<div>' + t('md_noise') + bar(n) + '</div>' : '')) + '</div>' +
      '<div class="muted" style="font-size:12px;margin-top:6px">' + t('md_keep', { d: (ex && ex.retention) || 90 }) + '</div>';
  }
  function render() {
    renderMd();
    var me = localStorage.getItem('shk3_wcode') || '', site = localStorage.getItem('shk3_wsite') || 'SITE-A';
    var rec = jget('shk3_fa_records', []).filter(function (r) { return r.pass && ((me && r.code === me) || (r.name && r.name === jget('shk3_fa_name', ''))); }).sort(function (a, b) { return b.ts - a.ts; })[0];
    var pts = jget('shk3_aidpts', []).filter(function (p) { return p.site === site; });
    card.innerHTML = '<h3>' + t('pw_t') + '</h3><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:6px 0"><b>' + t('pw_train') + '</b><span style="font-weight:700;color:' + (rec ? 'var(--g)' : 'var(--r)') + '">' + (rec ? t('pw_ok', { d: new Date(rec.ts).toLocaleDateString() }) : t('pw_no')) + '</span></div>' +
      '<a href="firstaid.html" class="pri" style="display:block;text-align:center;padding:11px;border-radius:10px;background:var(--r);color:#fff;font-weight:800;text-decoration:none">' + t('pw_go') + '</a>' +
      '<h3 style="margin-top:12px">' + t('pw_pts') + ' · ' + esc(site) + '</h3>' + (pts.length ? pts.map(function (p) { return '<div style="padding:6px 0;border-bottom:1px solid var(--bdr)">' + (IC[p.type] || '🩹') + ' <b>' + t('pw_' + p.type) + '</b> · ' + esc(p.name) + '</div>'; }).join('') : '<div class="muted">' + t('pw_none') + '</div>') +
      '<div class="muted" style="font-size:12px;margin-top:6px">' + t('pw_tip') + '</div>';
  }
  try {
    var tr = new SHKTransport('worker-aid'), room = SHKTransport.savedRoom(); if (room) tr.connectRoom(room);
    tr.on(function (m) {
      if (m.type === 'aidpts' && Array.isArray(m.list)) { jset('shk3_aidpts', m.list); render(); }
      if (m.type === 'fa_sync' && Array.isArray(m.list)) { jset('shk3_fa_records', m.list); render(); }
      if (m.type === 'expo_sync') { jset('shk3_px_expo_me', m); renderMd(); }
    });
  } catch (e) {}
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.langs button')) setTimeout(render, 50); });
  render(); setInterval(render, 15000);
})();
