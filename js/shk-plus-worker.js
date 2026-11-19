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
      pw_aed: 'AED', pw_kit: '急救箱', pw_eyewash: '洗眼器 / 紧急淋浴', pw_stretcher: '担架', pw_ext: '灭火器' },
    ko: { pw_t: '✚ 응급처치', pw_train: '작업 전 응급처치 교육', pw_go: '교육 시작 / 복습 →', pw_ok: '✓ 수료 {d}', pw_no: '✕ 미이수: 작업 전에 반드시 완료', pw_pts: '이 현장의 응급용품', pw_none: '등록된 항목 없음', pw_tip: '긴급 상황이 생기면 가장 가까운 AED·구급함 위치가 휴대폰과 워치로 옵니다.',
      pw_aed: 'AED', pw_kit: '구급함', pw_eyewash: '세안기·긴급샤워', pw_stretcher: '들것', pw_ext: '소화기' },
    en: { pw_t: '✚ First aid', pw_train: 'Pre-shift first-aid training', pw_go: 'Start / review →', pw_ok: '✓ Completed {d}', pw_no: '✕ Not done — required before work', pw_pts: 'First-aid equipment at this site', pw_none: 'Nothing registered yet', pw_tip: 'In an emergency, the nearest AED / kit is pushed to your phone and watch.',
      pw_aed: 'AED', pw_kit: 'First-aid kit', pw_eyewash: 'Eyewash / shower', pw_stretcher: 'Stretcher', pw_ext: 'Extinguisher' }
  });
  var IC = { aed: '❤️‍🩹', kit: '🩹', eyewash: '🚿', stretcher: '🛏', ext: '🧯' };
  var card = document.createElement('div'); card.className = 'card'; card.id = 'pwAid';
  var anchor = document.querySelector('#mine') && document.querySelector('#mine').closest('.card');
  if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(card, anchor.nextSibling); else document.body.appendChild(card);
  function render() {
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
    });
  } catch (e) {}
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.langs button')) setTimeout(render, 50); });
  render(); setInterval(render, 15000);
})();
