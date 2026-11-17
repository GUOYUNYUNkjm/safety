/* SHine-K 3.0 · 现场反馈
 * 警报声（Web Audio）、语音播报（Speech Synthesis，中/韩/英）、手机震动、桌面通知、
 * USB 警示灯（Web Serial：向 Arduino 发送一个字母，见 devices/beacon/beacon.ino）。
 */
(function () {
  'use strict';
  var ctx = null, sirenNodes = null, muted = false, serialPort = null, serialWriter = null;
  var lang = 'zh';

  function audio() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  /* 短提示音 */
  function beep(freq, ms, vol) {
    var c = audio(); if (!c || muted) return;
    var o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = freq || 880;
    g.gain.value = vol || 0.15;
    o.connect(g); g.connect(c.destination);
    o.start(); o.stop(c.currentTime + (ms || 150) / 1000);
  }

  /* 警报声：level = 'warn'（间断）| 'danger'（连续升降调） */
  function siren(level) {
    stopSiren();
    var c = audio(); if (!c || muted) return;
    var o = c.createOscillator(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
    o.type = 'square'; g.gain.value = level === 'danger' ? 0.12 : 0.07;
    if (level === 'danger') {
      o.frequency.value = 850; lfo.frequency.value = 1.6; lg.gain.value = 350;
      lfo.connect(lg); lg.connect(o.frequency); lfo.start();
    } else {
      o.frequency.value = 660; lfo.type = 'square'; lfo.frequency.value = 1.2; lg.gain.value = 0.07;
      lfo.connect(lg); lg.connect(g.gain); lfo.start();
    }
    o.connect(g); g.connect(c.destination); o.start();
    sirenNodes = [o, lfo];
    sendBeacon(level === 'danger' ? 'R' : 'Y');
  }
  function stopSiren() {
    if (sirenNodes) { sirenNodes.forEach(function (n) { try { n.stop(); } catch (e) {} }); sirenNodes = null; }
    sendBeacon('0');
  }

  var VOICE_LANG = { zh: 'zh-CN', ko: 'ko-KR', en: 'en-US' };
  function speak(text, l) {
    if (muted || !('speechSynthesis' in window) || !text) return;
    try {
      var u = new SpeechSynthesisUtterance(text);
      u.lang = VOICE_LANG[l || lang] || 'zh-CN'; u.rate = 1.0;
      var vs = speechSynthesis.getVoices().filter(function (v) { return v.lang && v.lang.replace('_', '-').indexOf(u.lang.slice(0, 2)) === 0; });
      if (vs.length) u.voice = vs[0];
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch (e) {}
  }

  function vibrate(pattern) { try { navigator.vibrate && navigator.vibrate(pattern || [400, 200, 400]); } catch (e) {} }

  function notify(title, body) {
    try {
      if (!('Notification' in window)) return;
      if (Notification.permission === 'granted') new Notification(title, { body: body, tag: 'shk3', renotify: true });
    } catch (e) {}
  }
  function askNotify() { try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch (e) {} }

  /* USB 警示灯：Arduino 收到 R=红灯+蜂鸣器，Y=黄灯，0=全关 */
  async function connectBeacon() {
    if (!('serial' in navigator)) throw new Error('此浏览器不支持 Web Serial（请用电脑版 Chrome / Edge）');
    serialPort = await navigator.serial.requestPort();
    await serialPort.open({ baudRate: 9600 });
    serialWriter = serialPort.writable.getWriter();
    await sleep(1800); // Arduino 打开串口时会重启
    sendBeacon('T');   // 自检：闪一下
    return true;
  }
  function sendBeacon(ch) {
    if (!serialWriter) return;
    try { serialWriter.write(new TextEncoder().encode(ch + '\n')); } catch (e) {}
  }
  function beaconConnected() { return !!serialWriter; }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  window.SHKFeedback = {
    unlock: function () { audio(); askNotify(); },
    beep: beep, siren: siren, stopSiren: stopSiren, speak: speak, vibrate: vibrate, notify: notify,
    connectBeacon: connectBeacon, sendBeacon: sendBeacon, beaconConnected: beaconConnected,
    setMuted: function (m) { muted = !!m; if (muted) stopSiren(); }, get muted() { return muted; },
    setLang: function (l) { lang = l; }
  };
})();
