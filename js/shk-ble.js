/* SHine-K 3.0 · 真实可穿戴设备（Web Bluetooth）
 * 1) 标准蓝牙心率设备（Heart Rate Service 0x180D）：Polar H10/H9/Verity Sense、Garmin HRM、COOSPO、
 *    开启“心率广播”的 Garmin/COROS/Amazfit 手表等。
 * 2) EmoConnect / VitalTrack 手表（Newert）：协议依据厂商公开 SDK（github.com/NewertDev）。
 *    手表只发送 PPG 脉搏波 + 加速度/陀螺仪/地磁，心率由本页面根据脉搏波计算。
 * 浏览器要求：电脑或安卓的 Chrome / Edge，https 网址。iPhone Safari 不支持 Web Bluetooth。
 */
(function () {
  'use strict';

  var UART_SVC = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
  var UART_TX = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'; // 写命令
  var PPG_SVC = '00001000-0000-1000-8000-00805f9b34fb';
  var PPG_CHR = '00001100-0000-1000-8000-00805f9b34fb';
  var G = 9.80665;

  function supported() { return !!(navigator.bluetooth && navigator.bluetooth.requestDevice); }

  /* ---------- 工具 ---------- */
  function half(u16) { // IEEE754 半精度 → 浮点
    var s = (u16 & 0x8000) ? -1 : 1, e = (u16 >> 10) & 0x1f, f = u16 & 0x3ff;
    if (e === 0) return s * Math.pow(2, -14) * (f / 1024);
    if (e === 31) return f ? NaN : s * Infinity;
    return s * Math.pow(2, e - 15) * (1 + f / 1024);
  }
  function rmssd(rr) { // rr: ms 数组
    if (rr.length < 5) return null;
    var s = 0, n = 0;
    for (var i = 1; i < rr.length; i++) { var d = rr[i] - rr[i - 1]; if (Math.abs(d) < 250) { s += d * d; n++; } }
    return n >= 4 ? Math.round(Math.sqrt(s / n)) : null;
  }

  /* ---------- 基类：事件 ---------- */
  function Emitter() { this._h = {}; }
  Emitter.prototype.on = function (ev, fn) { (this._h[ev] = this._h[ev] || []).push(fn); return this; };
  Emitter.prototype.emit = function (ev, d) { (this._h[ev] || []).forEach(function (f) { try { f(d); } catch (e) { console.warn(e); } }); };

  /* ================= 标准心率设备 ================= */
  function HRDevice() {
    Emitter.call(this);
    this.kind = 'hr'; this.name = ''; this.device = null; this.hr = null; this.contact = null;
    this.rr = []; this.hrv = null; this.battery = null; this.lastAt = 0; this.manualClose = false; this.tries = 0;
  }
  HRDevice.prototype = Object.create(Emitter.prototype);

  HRDevice.prototype.request = async function () {
    this.device = await navigator.bluetooth.requestDevice({
      filters: [{ services: ['heart_rate'] }], optionalServices: ['battery_service']
    });
    this.name = this.device.name || '心率设备';
    var self = this;
    this.device.addEventListener('gattserverdisconnected', function () { self._onDisc(); });
    await this._connect();
  };

  HRDevice.prototype._connect = async function () {
    this.emit('status', 'connecting');
    var server = await this.device.gatt.connect();
    var svc = await server.getPrimaryService('heart_rate');
    var ch = await svc.getCharacteristic('heart_rate_measurement');
    var self = this;
    ch.addEventListener('characteristicvaluechanged', function (e) { self._parse(e.target.value); });
    await ch.startNotifications();
    try {
      var b = await (await server.getPrimaryService('battery_service')).getCharacteristic('battery_level');
      this.battery = (await b.readValue()).getUint8(0);
    } catch (e) {}
    this.tries = 0;
    this.emit('status', 'connected');
  };

  HRDevice.prototype._parse = function (dv) {
    var flags = dv.getUint8(0), i = 1, hr;
    if (flags & 1) { hr = dv.getUint16(i, true); i += 2; } else { hr = dv.getUint8(i); i += 1; }
    var contactSupported = !!(flags & 4), contact = !!(flags & 2);
    if (flags & 8) i += 2; // energy expended
    if (flags & 16) {
      for (; i + 1 < dv.byteLength; i += 2) {
        var rr = dv.getUint16(i, true) / 1024 * 1000;
        if (rr > 250 && rr < 2000) this.rr.push(rr);
      }
      if (this.rr.length > 90) this.rr.splice(0, this.rr.length - 90);
      this.hrv = rmssd(this.rr.slice(-60));
    }
    this.contact = contactSupported ? contact : null;
    this.hr = (hr > 0 && (contact || !contactSupported)) ? hr : null;
    this.lastAt = Date.now();
    this.emit('data', { hr: this.hr, hrv: this.hrv, contact: this.contact, battery: this.battery });
  };

  HRDevice.prototype._onDisc = function () {
    this.hr = null; this.emit('status', 'disconnected');
    if (this.manualClose) return;
    var self = this, wait = Math.min(30, Math.pow(2, this.tries++));
    this.emit('status', 'reconnecting');
    setTimeout(function () { self._connect().catch(function () { self._onDisc(); }); }, wait * 1000);
  };

  HRDevice.prototype.disconnect = function () {
    this.manualClose = true;
    try { this.device && this.device.gatt.connected && this.device.gatt.disconnect(); } catch (e) {}
  };

  /* ================= EmoConnect 手表 ================= */
  function EmoWatch() {
    HRDevice.call(this);
    this.kind = 'emo';
    this.fs = 50;                 // 采样率 50 Hz（SDK）
    this.ppg = []; this.accMag = []; this.ppgQuality = 0;
    this.tx = null; this.motionPct = 0; this.impact = null; this._hrTimer = null;
  }
  EmoWatch.prototype = Object.create(HRDevice.prototype);

  EmoWatch.prototype.request = async function () {
    this.device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: 'EmoConnect' }, { namePrefix: 'VitalTrack' }],
      optionalServices: [UART_SVC, PPG_SVC, 'battery_service']
    });
    this.name = this.device.name || 'EmoConnect';
    var self = this;
    this.device.addEventListener('gattserverdisconnected', function () { self._onDisc(); });
    await this._connect();
  };

  EmoWatch.prototype._connect = async function () {
    this.emit('status', 'connecting');
    var server = await this.device.gatt.connect();
    this.tx = await (await server.getPrimaryService(UART_SVC)).getCharacteristic(UART_TX);
    var ch = await (await server.getPrimaryService(PPG_SVC)).getCharacteristic(PPG_CHR);
    var self = this;
    ch.addEventListener('characteristicvaluechanged', function (e) { self._parse(e.target.value); });
    await ch.startNotifications();
    // 开始测量：SDK 中的顺序
    await this.cmd('set POWER_1V8 1'); await sleep(120);
    await this.cmd('set ppg_enable 1'); await sleep(120);
    await this.cmd('setup ppg');
    var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
    this.cmd('SET TIME ' + d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds()));
    clearInterval(this._hrTimer);
    this._hrTimer = setInterval(function () { self._computeHR(); }, 1000);
    this.tries = 0;
    this.emit('status', 'connected');
  };

  EmoWatch.prototype.cmd = async function (text) {
    if (!this.tx) return;
    var bytes = new TextEncoder().encode('\n' + text + '\n');
    try {
      if (this.tx.writeValueWithResponse) await this.tx.writeValueWithResponse(bytes);
      else await this.tx.writeValue(bytes);
    } catch (e) { console.warn('[emo] cmd', text, e); }
  };

  EmoWatch.prototype._parse = function (dv) {
    var u = new Uint8Array(dv.buffer, dv.byteOffset, dv.byteLength);
    if (u.length >= 7 && u[0] === 66 && u[1] === 65 && u[2] === 84 && u[3] === 84) { // "BATT"
      this.battery = Math.max(0, Math.min(100, u[6]));
      this.emit('data', this._snapshot());
      return;
    }
    var n = Math.floor(u.length / 20);
    for (var k = 0; k < n; k++) {
      var o = k * 20;
      var ppg = u[o] | (u[o + 1] << 8);
      var ax = half(u[o + 2] | (u[o + 3] << 8)), ay = half(u[o + 4] | (u[o + 5] << 8)), az = half(u[o + 6] | (u[o + 7] << 8));
      var mag = Math.sqrt(ax * ax + ay * ay + az * az);
      this.ppg.push(ppg); this.accMag.push(isFinite(mag) ? mag : G);
      if (isFinite(mag) && mag > 2.5 * G) this.impact = { at: Date.now(), g: mag / G };
    }
    var max = this.fs * 12;
    if (this.ppg.length > max) { this.ppg.splice(0, this.ppg.length - max); this.accMag.splice(0, this.accMag.length - max); }
    this.lastAt = Date.now();
  };

  /* 用最近 8 秒脉搏波做自相关，求心率（40–180 bpm）。手腕晃动大时不给出数值。 */
  EmoWatch.prototype._computeHR = function () {
    var fs = this.fs, N = fs * 8;
    // 手腕活动量：最近 2 秒加速度幅值的标准差（0.5 g = 100%）
    var a = this.accMag.slice(-fs * 2);
    if (a.length > 10) {
      var m = a.reduce(function (s, v) { return s + v; }, 0) / a.length;
      var sd = Math.sqrt(a.reduce(function (s, v) { return s + (v - m) * (v - m); }, 0) / a.length);
      this.motionPct = Math.min(100, Math.round(sd / (0.5 * G) * 100));
    }
    if (Date.now() - this.lastAt > 4000) { this.hr = null; this.emit('data', this._snapshot()); return; }
    if (this.ppg.length < N) { this.emit('data', this._snapshot()); return; }
    var x = this.ppg.slice(-N), w = Math.round(fs * 0.75), y = new Array(N), i, j, s;
    for (i = 0; i < N; i++) { // 去趋势
      s = 0; var c = 0;
      for (j = Math.max(0, i - w); j <= Math.min(N - 1, i + w); j++) { s += x[j]; c++; }
      y[i] = x[i] - s / c;
    }
    for (i = 2; i < N - 2; i++) y[i] = (y[i - 2] + y[i - 1] + y[i] + y[i + 1] + y[i + 2]) / 5; // 平滑
    var e0 = 0; for (i = 0; i < N; i++) e0 += y[i] * y[i];
    if (e0 <= 0) return;
    var lo = Math.floor(fs * 60 / 180), hi = Math.ceil(fs * 60 / 40), best = -1, bl = 0, r = [];
    for (var L = lo; L <= hi; L++) {
      s = 0; for (i = 0; i + L < N; i++) s += y[i] * y[i + L];
      r[L] = s / e0;
      if (r[L] > best) { best = r[L]; bl = L; }
    }
    // 抛物线插值求精确周期
    var Lp = bl;
    if (r[bl - 1] != null && r[bl + 1] != null) {
      var d = r[bl - 1] - 2 * r[bl] + r[bl + 1];
      if (d < 0) Lp = bl + 0.5 * (r[bl - 1] - r[bl + 1]) / d;
    }
    this.ppgQuality = Math.max(0, best);
    var bpm = 60 * fs / Lp;
    this.hr = (best >= 0.5 && this.motionPct < 40 && bpm >= 40 && bpm <= 180) ? Math.round(bpm) : null;
    if (this.hr) {
      this.rr.push(60000 / bpm); if (this.rr.length > 60) this.rr.shift();
      this._sentBpmAt = this._sentBpmAt || 0;
      if (Date.now() - this._sentBpmAt > 5000) { this._sentBpmAt = Date.now(); this.cmd('SET BPM ' + this.hr); }
    }
    this.emit('data', this._snapshot());
  };

  EmoWatch.prototype._snapshot = function () {
    return { hr: this.hr, hrv: null, battery: this.battery, motion: this.motionPct, quality: +this.ppgQuality.toFixed(2), impact: this.impact };
  };

  EmoWatch.prototype.disconnect = function () {
    this.manualClose = true; clearInterval(this._hrTimer);
    var self = this;
    (async function () {
      try { await self.cmd('set ppg_enable 0'); await sleep(100); await self.cmd('setup ppg'); } catch (e) {}
      try { self.device && self.device.gatt.connected && self.device.gatt.disconnect(); } catch (e) {}
    })();
  };

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  window.SHKBLE = { supported: supported, HRDevice: HRDevice, EmoWatch: EmoWatch, _half: half, _rmssd: rmssd };
})();
