/* SHine-K 3.0 · 工人生理风险评估（手表心率 + 环境温湿度）
 * 不是黑箱：每次判断都给出原因，阈值都可以在 CONFIG 里改。
 *
 *  个人基线：前几分钟心率的低位（第 10 百分位），限定在 50–90 bpm；如果名单里填了静息心率就用填的。
 *  最大心率：208 − 0.7 × 年龄（Tanaka 公式）；不知道年龄按 190。
 *  心率储备占比 %HRR = (心率 − 基线) / (最大心率 − 基线)
 *  生理负荷指数 PSI（只用心率部分，Moran 1998）= 5 × (心率 − 基线) / (180 − 基线)，0–5
 *  热指数 HI：美国国家气象局 Rothfusz 公式（温度 + 相对湿度 → 体感温度），
 *     27–32 注意，32–41 高度注意，41–54 危险，≥54 极度危险。
 *
 *  停止作业（锁定，直到心率恢复并由班组长 / 监控端确认复工）：
 *   · %HRR ≥ 75% 持续 2 分钟；或 心率 ≥ 最大心率 90% 持续 60 秒
 *   · 热指数 ≥ 41 且 %HRR ≥ 50% 持续 2 分钟；或 热指数 ≥ 32 且 %HRR ≥ 60% 持续 5 分钟
 *   · 心率 < 45 持续 10 秒，或 30 秒内骤降 40% 以上到 60 以下（可能晕厥 → 同时按紧急情况处理）
 *  预警：%HRR ≥ 60% 持续 5 分钟；或 60 秒内无明显活动心率上升 ≥ 30 bpm（突然飙升）
 *  恢复：%HRR < 30% 连续 5 分钟 → “已恢复，待确认复工”
 */
(function (root) {
  'use strict';
  var CONFIG = {
    warnHRR: 0.60, warnMin: 5, stopHRR: 0.75, stopMin: 2, maxFrac: 0.90, maxSec: 60,
    spikeBpm: 30, spikeSec: 60, spikeMotion: 30, lowHR: 45, lowSec: 10, dropFrac: 0.40, dropSec: 30,
    heatHRR: 0.50, heatMin: 2, recoverHRR: 0.30, recoverMin: 5, keepMin: 10
  };

  function heatIndex(tc, rh) {
    if (tc == null || rh == null || isNaN(tc) || isNaN(rh)) return null;
    var T = tc * 9 / 5 + 32, R = Math.max(0, Math.min(100, rh));
    var hi = 0.5 * (T + 61 + (T - 68) * 1.2 + R * 0.094);
    if ((hi + T) / 2 >= 80) {
      hi = -42.379 + 2.04901523 * T + 10.14333127 * R - 0.22475541 * T * R - 0.00683783 * T * T - 0.05481717 * R * R +
        0.00122874 * T * T * R + 0.00085282 * T * R * R - 0.00000199 * T * T * R * R;
      if (R < 13 && T >= 80 && T <= 112) hi -= ((13 - R) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
      if (R > 85 && T >= 80 && T <= 87) hi += ((R - 85) / 10) * ((87 - T) / 5);
    }
    return Math.round((hi - 32) * 5 / 9 * 10) / 10;
  }
  /* 0 正常 · 1 注意 · 2 高度注意 · 3 危险 · 4 极度危险 */
  function heatLevel(hi) { return hi == null ? 0 : hi >= 54 ? 4 : hi >= 41 ? 3 : hi >= 32 ? 2 : hi >= 27 ? 1 : 0; }
  /* 《防暑降温措施管理办法》第八条：按当日最高气温安排室外露天作业 */
  function outdoorRule(tmax) {
    if (tmax == null) return null;
    if (tmax >= 40) return 'stop';      // 停止当日室外露天作业
    if (tmax >= 37) return 'limit';     // 全天累计 ≤ 6 小时，最高温时段 3 小时内不安排
    if (tmax >= 35) return 'rotate';    // 换班轮休，缩短连续作业，不加班
    return null;
  }

  function RiskModel(o) {
    o = o || {};
    this.age = o.age || null; this.restHR = o.restHR || null;
    this.cfg = Object.assign({}, CONFIG, o.cfg || {});
    this.hist = []; this.base = null;
    this.since = {};            // 各条件开始成立的时间
    this.latched = null;        // 'stop' 锁定
    this.recovered = false; this.last = null;
  }
  RiskModel.prototype.hrmax = function () { return this.age ? Math.round(208 - 0.7 * this.age) : 190; };
  RiskModel.prototype._dur = function (k, cond, t) {
    if (cond) { if (this.since[k] == null) this.since[k] = t; return t - this.since[k]; }
    this.since[k] = null; return 0;
  };
  RiskModel.prototype._baseline = function (t) {
    if (this.restHR) return this.restHR;
    var h = this.hist; if (!h.length || t - h[0].t < 60000) return this.base || 70;
    var v = h.map(function (x) { return x.hr; }).sort(function (a, b) { return a - b; });
    var p10 = v[Math.floor(v.length * 0.1)];
    p10 = Math.max(50, Math.min(90, p10));
    this.base = this.base == null ? p10 : Math.min(this.base, p10);
    return this.base;
  };
  /* t：毫秒时间；hr：心率；motion：手腕活动 0–100（没有就 null）；env：{ hi } */
  RiskModel.prototype.update = function (t, hr, motion, env) {
    var c = this.cfg;
    if (hr == null || !(hr > 20 && hr < 250)) return this.last;
    this.hist.push({ t: t, hr: hr, m: motion });
    while (this.hist.length && t - this.hist[0].t > c.keepMin * 60000) this.hist.shift();
    var base = this._baseline(t), hmax = this.hrmax();
    var hrr = Math.max(0, (hr - base) / Math.max(20, hmax - base));
    var psi = Math.max(0, Math.min(5, 5 * (hr - base) / Math.max(20, 180 - base)));
    var hi = env && env.hi != null ? env.hi : null, hl = heatLevel(hi);
    var win = function (sec) { return this.hist.filter(function (x) { return t - x.t <= sec * 1000; }); }.bind(this);
    var w1 = win(c.spikeSec), minHr = Math.min.apply(null, w1.map(function (x) { return x.hr; }));
    var moving = w1.some(function (x) { return x.m != null && x.m > c.spikeMotion; });
    var spike = hr - minHr >= c.spikeBpm && !moving && hr > base + 25;   // 从过低心率恢复不算“飙升”
    var w2 = win(c.dropSec), maxHr = Math.max.apply(null, w2.map(function (x) { return x.hr; }));
    var drop = maxHr - hr >= c.dropFrac * maxHr && hr < 60;

    var dWarn = this._dur('warn', hrr >= c.warnHRR, t), dStop = this._dur('stop', hrr >= c.stopHRR, t);
    var dMax = this._dur('max', hr >= c.maxFrac * hmax, t), dLow = this._dur('low', hr < c.lowHR, t);
    var dHeat = this._dur('heat', hl >= 3 && hrr >= c.heatHRR, t), dHeat2 = this._dur('heat2', hl >= 2 && hrr >= c.warnHRR, t);
    var dRec = this._dur('rec', hrr < c.recoverHRR, t);

    var R = [], stop = false, collapse = false;
    if (dStop >= c.stopMin * 60000) { stop = true; R.push({ k: 'sustain_stop', v: Math.round(hrr * 100), m: Math.round(dStop / 60000) }); }
    if (dMax >= c.maxSec * 1000) { stop = true; R.push({ k: 'maxhr', v: hr, m: Math.round(c.maxFrac * hmax) }); }
    if (dHeat >= c.heatMin * 60000) { stop = true; R.push({ k: 'heat_combo', v: hi, m: Math.round(hrr * 100) }); }
    if (dHeat2 >= c.warnMin * 60000) { stop = true; R.push({ k: 'heat_combo', v: hi, m: Math.round(hrr * 100) }); }
    if (dLow >= c.lowSec * 1000) { stop = collapse = true; R.push({ k: 'low_hr', v: hr }); }
    if (drop) { stop = collapse = true; R.push({ k: 'drop', v: maxHr, m: hr }); }
    var warn = false;
    if (dWarn >= c.warnMin * 60000) { warn = true; R.push({ k: 'sustain_warn', v: Math.round(hrr * 100), m: Math.round(dWarn / 60000) }); }
    if (spike) { warn = true; R.push({ k: 'spike', v: Math.round(hr - minHr) }); }
    if (hl >= 2) R.push({ k: 'heat', v: hi, m: hl });

    var score = Math.round(Math.min(100, 50 * Math.min(1, hrr / 0.8) + (spike ? 15 : 0) + [0, 5, 12, 20, 25][hl] + Math.min(15, dWarn / 60000 * 3)));
    if (stop) { this.latched = 'stop'; this.recovered = false; }
    if (this.latched === 'stop' && !stop && dRec >= c.recoverMin * 60000) this.recovered = true;
    var level = this.latched === 'stop' ? 'stop' : warn || score >= 60 ? 'warn' : score >= 40 ? 'watch' : 'ok';
    this.last = { level: level, score: score, hr: hr, hrr: Math.round(hrr * 100), psi: Math.round(psi * 10) / 10, base: base, hrmax: hmax,
      hi: hi, heat: hl, reasons: R, collapse: collapse, recovered: this.recovered, at: t };
    return this.last;
  };
  /* 班组长 / 监控端确认复工 */
  RiskModel.prototype.release = function () { this.latched = null; this.recovered = false; this.since = {}; };

  var API = { RiskModel: RiskModel, heatIndex: heatIndex, heatLevel: heatLevel, outdoorRule: outdoorRule, CONFIG: CONFIG };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  root.SHKRisk = API;
})(typeof window !== 'undefined' ? window : globalThis);
