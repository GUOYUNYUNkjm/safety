/* SHine-K 3.0 · 电子作业票（共用规则：现场端执行、作业管理页开票审批、工人手机端显示）
 * 作业类型按 GB 30871-2022《危险化学品企业特殊作业安全规范》八大特殊作业，另加“一般危险区域”。
 * 气体合格范围（可在作业管理页修改）：
 *   氧气 19.5–23.5 %；可燃气体 ≤ 10 % LEL；硫化氢 ≤ 7 ppm（GBZ 2.1 最高容许浓度 10 mg/m³）；
 *   一氧化碳 ≤ 17 ppm（GBZ 2.1 时间加权平均 20 mg/m³）。
 * 天气：高处 / 吊装默认风速 ≥ 10.8 m/s（六级）或雷暴时冻结；室外动火遇雷暴冻结。按企业制度调整。
 */
(function () {
  'use strict';
  var TYPES = {
    hot: { c: '#E8133A', gas: true, wx: 'thunder' }, confined: { c: '#8B5CF6', gas: true }, blind: { c: '#0EA5E9', gas: true },
    height: { c: '#F59E0B', wx: 'wind' }, lift: { c: '#EAB308', wx: 'wind' }, elec: { c: '#F97316' }, dig: { c: '#A16207' },
    break: { c: '#64748B' }, danger: { c: '#DC2626' }
  };
  var LIMITS = { o2: [19.5, 23.5], lel: 10, h2s: 7, co: 17, wind: 10.8, gasValidMin: 30 };
  SHKI18N.add({
    zh: { zt_hot: '动火', zt_confined: '受限空间', zt_blind: '盲板抽堵', zt_height: '高处', zt_lift: '吊装', zt_elec: '临时用电', zt_dig: '动土', zt_break: '断路', zt_danger: '危险区域',
      ps_draft: '草稿', ps_pending: '待审批', ps_active: '作业中', ps_frozen: '已冻结', ps_closed: '已关闭', ps_expired: '已超时',
      g_o2: '氧气', g_lel: '可燃气', g_h2s: '硫化氢', g_co: '一氧化碳', gas_old: '气体检测已超过 {m} 分钟', gas_none: '还没有气体检测',
      fz_gas: '气体超标：{x}', fz_wind: '风速 {v} m/s，超过 {m} m/s', fz_thunder: '雷暴天气', fz_heat: '热指数极度危险', fz_time: '作业超时', fz_leave: '作业人员已离场', fz_guard: '监护人离岗', fz_manual: '手动冻结', fz_stop: '作业人员生理异常' },
    ko: { zt_hot: '화기', zt_confined: '밀폐공간', zt_blind: '맹판 설치·해체', zt_height: '고소', zt_lift: '양중', zt_elec: '임시전기', zt_dig: '굴착', zt_break: '도로 차단', zt_danger: '위험구역',
      ps_draft: '임시저장', ps_pending: '승인 대기', ps_active: '작업 중', ps_frozen: '동결됨', ps_closed: '종료', ps_expired: '시간 초과',
      g_o2: '산소', g_lel: '가연성', g_h2s: '황화수소', g_co: '일산화탄소', gas_old: '가스 측정 {m}분 경과', gas_none: '가스 측정 없음',
      fz_gas: '가스 기준 초과: {x}', fz_wind: '풍속 {v} m/s, 기준 {m} m/s 초과', fz_thunder: '뇌우', fz_heat: '열지수 매우 위험', fz_time: '작업 시간 초과', fz_leave: '작업자 이탈', fz_guard: '감시자 이탈', fz_manual: '수동 동결', fz_stop: '작업자 생리 이상' },
    en: { zt_hot: 'Hot work', zt_confined: 'Confined space', zt_blind: 'Blind plate', zt_height: 'Work at height', zt_lift: 'Lifting', zt_elec: 'Temporary power', zt_dig: 'Excavation', zt_break: 'Road closure', zt_danger: 'Danger zone',
      ps_draft: 'Draft', ps_pending: 'Pending', ps_active: 'Active', ps_frozen: 'Frozen', ps_closed: 'Closed', ps_expired: 'Expired',
      g_o2: 'O₂', g_lel: 'LEL', g_h2s: 'H₂S', g_co: 'CO', gas_old: 'Gas test is {m} min old', gas_none: 'No gas test yet',
      fz_gas: 'Gas out of range: {x}', fz_wind: 'Wind {v} m/s exceeds {m} m/s', fz_thunder: 'Thunderstorm', fz_heat: 'Extreme heat', fz_time: 'Permit time over', fz_leave: 'Workers left the area', fz_guard: 'Guardian absent', fz_manual: 'Frozen manually', fz_stop: 'Worker vital-sign alarm' }
  });
  function limits() { var x = window.SHKStore && SHKStore.cfg('gasLimits', null); return Object.assign({}, LIMITS, x || {}); }
  /* 检查一组气体读数，返回超标项 */
  function gasCheck(g) {
    if (!g) return { ok: false, bad: [], none: true };
    var L = limits(), bad = [];
    if (g.o2 != null && (g.o2 < L.o2[0] || g.o2 > L.o2[1])) bad.push('o2');
    if (g.lel != null && g.lel > L.lel) bad.push('lel');
    if (g.h2s != null && g.h2s > L.h2s) bad.push('h2s');
    if (g.co != null && g.co > L.co) bad.push('co');
    return { ok: !bad.length, bad: bad, old: g.at && Date.now() - g.at > L.gasValidMin * 60000 };
  }
  function status(p, now) {
    now = now || Date.now();
    if (!p) return null;
    if (p.status === 'active' && p.end && now > p.end) return 'expired';
    return p.status;
  }
  function all() { return window.SHKStore ? SHKStore.all('permits') : []; }
  function forZone(zid, now) {
    var list = all().filter(function (p) { return p.zone === zid && (p.status === 'active' || p.status === 'frozen'); });
    list.sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
    return list[0] || null;
  }
  function allowed(p, code) { return !!(p && code && ((p.workers || []).indexOf(code) >= 0 || p.guardian === code)); }
  /* extra：一起写进作业票的字段，例如气体检测仪的超标读数（恢复作业时必须重新检测合格） */
  function freeze(p, key, vars, by, extra) {
    if (!p || p.status !== 'active') return null;
    var reason = SHKI18N.t('fz_' + key, vars || {});
    var np = Object.assign({}, p, extra || {}, { status: 'frozen', freeze: { key: key, reason: reason, at: Date.now(), by: by || '' } });
    (np.log = (p.log || []).slice(-40)).push({ at: Date.now(), what: 'freeze', reason: reason, by: by || '' });
    return SHKStore.put('permits', np);
  }
  window.SHKPermit = { TYPES: TYPES, LIMITS: LIMITS, limits: limits, gasCheck: gasCheck, status: status, forZone: forZone, allowed: allowed, freeze: freeze, all: all,
    typeName: function (k) { return SHKI18N.t('zt_' + k); }, color: function (k) { return (TYPES[k] || TYPES.danger).c; } };
})();
