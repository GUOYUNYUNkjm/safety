/* SHine-K 3.0 · 跌倒 / 求救 / 姿势 判断（每个被追踪的人一个状态机）
 * 输入：MediaPipe Pose 的 33 个关节点（0~1 归一化坐标）+ 画面宽高 + 时间(ms)
 * 规则（全部是本页面自己的阈值，可在 CONFIG 中调整）：
 *   ① 倒地姿势 = 躯干倾斜 > 55° 或 人体框 宽/高 > 1.1（需看到髋部；宽高比还需看到腿）
 *      （若髋部仍明显高于脚踝 = 深弯腰，不算倒地）
 *   ② 疑似跌倒 = 倒地姿势，且 1.5 秒内有快速下坠（髋/肩下降速度 > 0.45 画面高/秒）或 1 秒内还是站姿
 *   ③ 5 秒内站起来 → 只记录“已自行站起”，不报警
 *   ④ 5 秒仍未站起 → 语音询问“没事请举一只手”（黄色警告）
 *   ⑤ 再过 12 秒没有举手也没站起 → 红色危险警报（跌倒无回应）
 *   ⑥ 双手举过头顶保持 3 秒 → SOS 求救（红色）
 *   ⑦ 站着弯腰 > 45° 持续 60 秒 → 姿势负担提醒
 *   ⑧ 躺着几乎不动 30 秒（不是跌倒进入的）→ 无动作提醒
 */
(function (root) {
  'use strict';

  var CONFIG = {
    downTilt: 55, downAspect: 1.1, standTilt: 30, standAspect: 0.8,
    dropSpeed: 0.45, dropWindow: 1500, standRecent: 1000,
    confirmMs: 5000, askMs: 12000, standUpMs: 1000,
    sosMs: 3000, handMs: 700,
    bendTilt: 45, bendMs: 60000, stillMs: 30000, stillMove: 0.004
  };

  var L = { nose: 0, ls: 11, rs: 12, le: 13, re: 14, lw: 15, rw: 16, lh: 23, rh: 24, lk: 25, rk: 26, la: 27, ra: 28 };

  function vis(p) { return p && (p.visibility == null || p.visibility > 0.45); }
  function mid(a, b) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }

  /* 从关节点算出特征 */
  function features(lm, W, H) {
    var pts = [], i;
    for (i = 0; i < lm.length; i++) if (vis(lm[i])) pts.push(lm[i]);
    if (pts.length < 6) return null;
    var minX = 1, minY = 1, maxX = 0, maxY = 0;
    pts.forEach(function (p) { if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y; if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y; });
    var bw = (maxX - minX) * W, bh = (maxY - minY) * H;
    var sh = (vis(lm[L.ls]) && vis(lm[L.rs])) ? mid(lm[L.ls], lm[L.rs]) : (vis(lm[L.ls]) ? lm[L.ls] : (vis(lm[L.rs]) ? lm[L.rs] : null));
    var hp = (vis(lm[L.lh]) && vis(lm[L.rh])) ? mid(lm[L.lh], lm[L.rh]) : (vis(lm[L.lh]) ? lm[L.lh] : (vis(lm[L.rh]) ? lm[L.rh] : null));
    var tilt = null;
    if (sh && hp) {
      var dx = (sh.x - hp.x) * W, dy = (hp.y - sh.y) * H; // 向上为正
      tilt = Math.abs(Math.atan2(dx, dy) * 180 / Math.PI);  // 0 = 直立, 90 = 水平
    }
    // 髋部离地高度：弯腰时髋部仍明显高于脚踝；倒地时髋部与脚踝几乎同高
    var hipHigh = false;
    if (sh && hp) {
      var ank = [lm[L.la], lm[L.ra], lm[L.lk], lm[L.rk]].filter(vis);
      if (ank.length) {
        var lowY = Math.max.apply(null, ank.map(function (p) { return p.y; }));
        var trunk = Math.hypot((sh.x - hp.x) * W, (sh.y - hp.y) * H);
        hipHigh = trunk > 0 && (lowY - hp.y) * H > 0.6 * trunk;
      }
    }
    var nose = vis(lm[L.nose]) ? lm[L.nose] : null;
    var lw = vis(lm[L.lw]) ? lm[L.lw] : null, rw = vis(lm[L.rw]) ? lm[L.rw] : null;
    var handUp = false, bothUp = false;
    if (sh) {
      var ref = nose ? nose.y : sh.y - 0.05;
      var lUp = lw && lw.y < sh.y - 0.03, rUp = rw && rw.y < sh.y - 0.03;
      handUp = !!(lUp || rUp);
      bothUp = !!(lw && rw && lw.y < ref && rw.y < ref);
    }
    return {
      box: [minX, minY, maxX, maxY], aspect: bh > 0 ? bw / bh : 0, tilt: tilt,
      hipY: hp ? hp.y : null, shY: sh ? sh.y : null, handUp: handUp, bothUp: bothUp, hipHigh: hipHigh,
      hasLeg: [L.lk, L.rk, L.la, L.ra].some(function (i) { return vis(lm[i]); }),
      cx: (minX + maxX) / 2, cy: (minY + maxY) / 2
    };
  }

  /* 必须看到肩和髋才判断倒地；“宽高比”规则还要求看到腿（只拍到上半身时，框天然是宽的） */
  function isDown(f) {
    if (f.hipHigh || f.tilt == null) return false; // 深弯腰 / 看不到髋部：不判断
    return f.tilt > CONFIG.downTilt || (f.hasLeg && f.aspect > CONFIG.downAspect);
  }
  function isStanding(f) { return f.tilt != null && f.tilt < CONFIG.standTilt && (!f.hasLeg || f.aspect < CONFIG.standAspect); }

  /* 每人一个状态机 */
  function FallFSM(id) {
    this.id = id; this.state = 'normal';   // normal | suspect | ask | danger | sos
    this.hist = []; this.lastStandAt = -1e12; this.downSince = null; this.upSince = null;
    this.t0 = 0; this.tAsk = 0; this.handSince = null; this.bothSince = null;
    this.bendSince = null; this.bendWarned = false; this.stillSince = null; this.stillWarned = false;
    this.lastF = null; this.posture = 'unknown';
  }

  /* 返回本帧产生的事件数组：{kind, level, msg, secs} */
  FallFSM.prototype.update = function (f, now) {
    var ev = [], C = CONFIG, self = this;
    if (!f) return ev;
    this.lastF = f;
    // 速度历史
    this.hist.push({ t: now, hip: f.hipY, sh: f.shY, cx: f.cx, cy: f.cy });
    while (this.hist.length && now - this.hist[0].t > 2500) this.hist.shift();
    var drop = this._dropSpeed(now);
    var down = isDown(f), stand = isStanding(f);
    if (stand) this.lastStandAt = now;
    this.posture = down ? 'down' : stand ? 'stand' : (f.tilt != null && f.tilt > C.bendTilt ? 'bend' : 'other');

    if (down) { if (this.downSince == null) this.downSince = now; this.upSince = null; }
    else { this.downSince = null; if (this.upSince == null) this.upSince = now; }

    // 举手 / 双手举高
    if (f.handUp) { if (this.handSince == null) this.handSince = now; } else this.handSince = null;
    if (f.bothUp && !down) { if (this.bothSince == null) this.bothSince = now; } else this.bothSince = null;

    switch (this.state) {
      case 'normal':
        if (down && (drop > C.dropSpeed || now - this.lastStandAt < C.standRecent)) {
          this.state = 'suspect'; this.t0 = now;
          ev.push({ kind: 'fall_detected', level: 'info', msg: 'fall_detected' });
        }
        break;
      case 'suspect':
        if (!down && this.upSince != null && now - this.upSince >= C.standUpMs) {
          var s = Math.round((now - this.t0) / 100) / 10;
          this.state = 'normal';
          ev.push({ kind: 'fall_recovered', level: 'info', msg: 'fall_recovered', secs: s });
        } else if (now - this.t0 >= C.confirmMs) {
          this.state = 'ask'; this.tAsk = now;
          ev.push({ kind: 'fall_ask', level: 'warn', msg: 'fall_ask' });
        }
        break;
      case 'ask':
        if ((this.handSince != null && now - this.handSince >= C.handMs) ||
            (!this.handOnly && !down && this.upSince != null && now - this.upSince >= C.standUpMs)) {
          ev.push({ kind: this.handOnly ? 'confirm_ok' : 'fall_ok', level: 'info', msg: 'ok' });
          this.state = 'normal'; this.handOnly = false;
        } else if (now - this.tAsk >= C.askMs) {
          this.state = 'danger';
          ev.push({ kind: this.handOnly ? 'confirm_noresp' : 'fall_noresp', level: 'danger', msg: 'noresp' });
        }
        break;
      case 'danger':
        if (this.handOnly ? (this.handSince != null && now - this.handSince >= C.handMs)
                          : (!down && this.upSince != null && now - this.upSince >= 3000)) {
          ev.push({ kind: this.handOnly ? 'confirm_ok' : 'fall_cleared', level: 'info', msg: 'cleared' });
          this.state = 'normal'; this.handOnly = false;
        }
        break;
      case 'sos':
        if (this.bothSince == null) this.state = 'normal';
        break;
    }

    // SOS
    if (this.state === 'normal' && this.bothSince != null && now - this.bothSince >= C.sosMs) {
      this.state = 'sos';
      ev.push({ kind: 'sos', level: 'danger', msg: 'sos' });
    }

    // 弯腰姿势负担（站着/弯腰，不是倒地）
    if (!down && f.tilt != null && f.tilt > C.bendTilt) {
      if (this.bendSince == null) this.bendSince = now;
      if (!this.bendWarned && now - this.bendSince >= C.bendMs) {
        this.bendWarned = true;
        ev.push({ kind: 'posture', level: 'warn', msg: 'posture', secs: Math.round((now - this.bendSince) / 1000) });
      }
    } else { this.bendSince = null; this.bendWarned = false; }

    // 躺着不动（不是从跌倒进入的）
    var moving = this._movement() > C.stillMove;
    if (down && this.state === 'normal' && !moving) {
      if (this.stillSince == null) this.stillSince = now;
      if (!this.stillWarned && now - this.stillSince >= C.stillMs) {
        this.stillWarned = true;
        ev.push({ kind: 'inactive', level: 'warn', msg: 'inactive', secs: Math.round((now - this.stillSince) / 1000) });
      }
    } else { this.stillSince = null; this.stillWarned = false; }

    ev.forEach(function (e) { e.id = self.id; e.t = now; });
    return ev;
  };

  FallFSM.prototype._dropSpeed = function (now) {
    var h = this.hist, best = 0;
    for (var i = 0; i < h.length; i++) {
      if (now - h[i].t > CONFIG.dropWindow) continue;
      for (var j = i + 1; j < h.length; j++) {
        var dt = (h[j].t - h[i].t) / 1000;
        if (dt < 0.2 || dt > 0.6) continue;
        var v1 = (h[i].hip != null && h[j].hip != null) ? (h[j].hip - h[i].hip) / dt : 0;
        var v2 = (h[i].sh != null && h[j].sh != null) ? (h[j].sh - h[i].sh) / dt : 0;
        var v = Math.max(v1, v2);
        if (v > best) best = v;
      }
    }
    return best;
  };

  FallFSM.prototype._movement = function () {
    var h = this.hist; if (h.length < 4) return 1;
    var a = h[0], b = h[h.length - 1];
    return Math.hypot(b.cx - a.cx, b.cy - a.cy) / Math.max(0.3, (b.t - a.t) / 1000);
  };

  /* 外部确认后复位（监控端点“已确认”或现场处理完） */
  FallFSM.prototype.reset = function () { this.state = 'normal'; this.handSince = this.bothSince = null; this.handOnly = false; };
  /* 监控端请求“举手确认”：进入询问状态，12 秒无回应升级为危险 */
  FallFSM.prototype.forceAsk = function (now) { this.state = 'ask'; this.tAsk = now; this.handSince = null; this.handOnly = true; };

  var api = { CONFIG: CONFIG, LM: L, features: features, FallFSM: FallFSM, isDown: isDown, isStanding: isStanding };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.SHKFall = api;
})(this);
