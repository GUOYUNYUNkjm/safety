/* SHine-K 3.0 · 数据传输层
 * 现场端 → 监控端：只发送关节点坐标、生命体征数字、事件（永远不发送视频）。
 * 同一浏览器：BroadcastChannel（不需要网络）
 * 不同电脑：MQTT over WSS（公共演示服务器 + 房间码）。公共服务器仅用于演示，不要传真实个人信息。
 */
(function () {
  'use strict';
  var CH_NAME = 'shk-safety-v3';
  var DEFAULT_BROKER = 'wss://broker.hivemq.com:8884/mqtt';
  var TOPIC_ROOT = 'shine-k3/';

  function uid() { return Math.random().toString(36).slice(2, 10); }

  function Transport(role) {
    this.role = role;            // 'field' | 'center' | 'dash'
    this.clientId = role + '-' + uid();
    this.handlers = [];
    this.room = null;
    this.mqtt = null;
    this.mqttState = 'off';      // off | connecting | on | error
    this.stats = { sent: 0, bytes: 0, recv: 0 };
    this.onState = null;
    var self = this;
    try {
      this.bc = new BroadcastChannel(CH_NAME);
      this.bc.onmessage = function (e) { self._deliver(e.data, 'local'); };
    } catch (e) { this.bc = null; }
  }

  Transport.prototype.on = function (fn) { this.handlers.push(fn); };

  Transport.prototype._deliver = function (msg, via) {
    if (!msg || msg.from === this.clientId) return;
    this.stats.recv++;
    for (var i = 0; i < this.handlers.length; i++) {
      try { this.handlers[i](msg, via); } catch (e) { console.warn('[shk] handler', e); }
    }
  };

  Transport.prototype.send = function (msg) {
    msg.from = this.clientId;
    msg.ts = msg.ts || Date.now();
    var txt = JSON.stringify(msg);
    this.stats.sent++; this.stats.bytes += txt.length;
    if (this.bc) { try { this.bc.postMessage(msg); } catch (e) {} }
    if (this.mqtt && this.mqttState === 'on') {
      try { this.mqtt.publish(TOPIC_ROOT + this.room + '/' + msg.type, txt, { qos: 0 }); } catch (e) {}
    }
    return txt.length;
  };

  Transport.prototype._setState = function (s, info) {
    this.mqttState = s;
    if (this.onState) this.onState(s, info);
  };

  /* 连接跨设备通道。room 由双方约定（例如 6 位房间码）。 */
  Transport.prototype.connectRoom = function (room, broker) {
    var self = this;
    room = String(room || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!room) return false;
    if (typeof window.mqtt === 'undefined') { this._setState('error', 'mqtt.js 未加载'); return false; }
    this.disconnectRoom();
    this.room = room;
    this._setState('connecting');
    var c = window.mqtt.connect(broker || DEFAULT_BROKER, {
      clientId: 'shk3-' + this.clientId, clean: true, reconnectPeriod: 3000, connectTimeout: 8000
    });
    this.mqtt = c;
    c.on('connect', function () {
      c.subscribe(TOPIC_ROOT + room + '/#');
      self._setState('on', room);
    });
    c.on('reconnect', function () { self._setState('connecting'); });
    c.on('error', function (e) { self._setState('error', e && e.message); });
    c.on('close', function () { if (self.mqtt === c && self.mqttState !== 'off') self._setState('connecting'); });
    c.on('message', function (topic, payload) {
      try { self._deliver(JSON.parse(payload.toString()), 'mqtt'); } catch (e) {}
    });
    try { localStorage.setItem('shk3_room', room); } catch (e) {}
    return true;
  };

  Transport.prototype.disconnectRoom = function () {
    if (this.mqtt) { try { this.mqtt.end(true); } catch (e) {} }
    this.mqtt = null; this.room = null;
    this._setState('off');
  };

  Transport.savedRoom = function () { try { return localStorage.getItem('shk3_room') || ''; } catch (e) { return ''; } };
  Transport.newRoom = function () { return String(Math.floor(100000 + Math.random() * 900000)); };

  window.SHKTransport = Transport;
})();
