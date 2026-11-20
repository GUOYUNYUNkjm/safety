/* SHine-K 3.0 · 安全帽 / 背心 / 口罩 检测（浏览器内运行 YOLO11n ONNX 模型，视频不上传）
 * 模型：models/ppe.onnx —— 来自 github.com/y3korea/SHine-K-（仓库 MIT 协议；模型权重由 Ultralytics YOLO11 训练，AGPL-3.0）
 * 类别（训练顺序）：0 Hardhat 1 Mask 2 NO-Hardhat 3 NO-Mask 4 NO-Safety Vest 5 Person 6 Safety Cone 7 Safety Vest 8 Machinery 9 Vehicle
 * 运行：有 WebGPU 用显卡，没有就用 CPU（WebAssembly）。
 */
(function () {
  'use strict';
  var NAMES = ['Hardhat', 'Mask', 'NO-Hardhat', 'NO-Mask', 'NO-Safety Vest', 'Person', 'Safety Cone', 'Safety Vest', 'Machinery', 'Vehicle'];
  var IN = 640, sess = null, backend = '', lastMs = 0;
  var cnv = document.createElement('canvas'); cnv.width = IN; cnv.height = IN;
  var cx = cnv.getContext('2d', { willReadFrequently: true });
  var buf = new Float32Array(3 * IN * IN);

  async function load(url, prefer) {
    if (typeof ort === 'undefined') throw new Error('onnxruntime-web 未加载');
    ort.env.wasm.wasmPaths = window.SHK_ORT_BASE || 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/';
    var tries = (prefer === 'wasm' || !navigator.gpu) ? ['wasm'] : ['webgpu', 'wasm'];
    var err = null;
    for (var i = 0; i < tries.length; i++) {
      try {
        sess = await ort.InferenceSession.create(url, { executionProviders: [tries[i]], graphOptimizationLevel: 'all' });
        backend = tries[i];
        // 预热并确认能运行
        await run(new ort.Tensor('float32', new Float32Array(3 * IN * IN), [1, 3, IN, IN]));
        return backend;
      } catch (e) { err = e; sess = null; console.warn('[ppe] ' + tries[i] + ' 失败', e); }
    }
    throw err || new Error('模型加载失败');
  }

  async function run(tensor) {
    var feeds = {}; feeds[sess.inputNames[0]] = tensor;
    var out = await sess.run(feeds);
    return out[sess.outputNames[0]];
  }

  /* 等比缩放 + 灰边（与 YOLO 训练时一致） */
  function letterbox(src, sw, sh) {
    var r = Math.min(IN / sw, IN / sh), nw = Math.round(sw * r), nh = Math.round(sh * r);
    var px = Math.floor((IN - nw) / 2), py = Math.floor((IN - nh) / 2);
    cx.fillStyle = 'rgb(114,114,114)'; cx.fillRect(0, 0, IN, IN);
    cx.drawImage(src, 0, 0, sw, sh, px, py, nw, nh);
    var d = cx.getImageData(0, 0, IN, IN).data, n = IN * IN;
    for (var i = 0; i < n; i++) { buf[i] = d[i * 4] / 255; buf[i + n] = d[i * 4 + 1] / 255; buf[i + 2 * n] = d[i * 4 + 2] / 255; }
    return { r: r, px: px, py: py };
  }

  function iou(a, b) {
    var ix = Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])), iy = Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
    var inter = ix * iy, u = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - inter;
    return u <= 0 ? 0 : inter / u;
  }

  /* 返回 [{cls, name, score, box:[x1,y1,x2,y2] (0~1 归一化)}] */
  async function detect(src, sw, sh, conf) {
    if (!sess) return [];
    conf = conf || 0.35;
    var t0 = performance.now();
    var lb = letterbox(src, sw, sh);
    var o = await run(new ort.Tensor('float32', buf, [1, 3, IN, IN]));
    var data = o.data, nc = o.dims[1] - 4, N = o.dims[2], res = [];
    for (var i = 0; i < N; i++) {
      var best = 0, bi = 0;
      for (var c = 0; c < nc; c++) { var s = data[(4 + c) * N + i]; if (s > best) { best = s; bi = c; } }
      if (best < conf) continue;
      var x = data[i], y = data[N + i], w = data[2 * N + i], h = data[3 * N + i];
      var x1 = (x - w / 2 - lb.px) / lb.r / sw, y1 = (y - h / 2 - lb.py) / lb.r / sh;
      var x2 = (x + w / 2 - lb.px) / lb.r / sw, y2 = (y + h / 2 - lb.py) / lb.r / sh;
      res.push({ cls: bi, name: NAMES[bi] || ('c' + bi), score: best, box: [clamp(x1), clamp(y1), clamp(x2), clamp(y2)] });
    }
    // 按类别做 NMS
    res.sort(function (a, b) { return b.score - a.score; });
    var keep = [];
    res.forEach(function (d) { if (keep.every(function (k) { return k.cls !== d.cls || iou(k.box, d.box) < 0.45; })) keep.push(d); });
    lastMs = performance.now() - t0;
    return keep;
  }
  function clamp(v) { return Math.max(0, Math.min(1, v)); }

  /* ---------- 颜色复核：黄色安全帽 / 交叉带反光背心 ----------
   * 模型用工地远景照片训练，近距离摄像头 + 交叉带（X 形）背心经常被判成 NO-Safety Vest。
   * 所以按骨架取头顶和躯干两块区域，统计荧光色像素比例，作为“已佩戴”的正面证据。 */
  var CW = 48, cc = document.createElement('canvas'); cc.width = CW; cc.height = CW;
  var ccx = cc.getContext('2d', { willReadFrequently: true });
  var CFG = window.SHK_PPE_CFG = Object.assign({
    helmetRatio: 0.18,   // 头顶区域黄色像素占比 ≥ 18% → 戴了安全帽
    vestRatio: 0.06,     // 躯干区域荧光色占比 ≥ 6%（交叉带面积小）→ 穿了背心
    vestSide: 0.02,      // 左右两半各自至少 2%（X 形带子两边都有）
    negConf: 0.5         // 模型“未戴”类别至少这个置信度才算数
  }, window.SHK_PPE_CFG || {});

  function hsv(r, g, b) {
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, h = 0;
    if (d) { h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360; }
    return [h, mx ? d / mx : 0, mx / 255];
  }
  function isHelmetYellow(r, g, b) { var c = hsv(r, g, b); return c[0] >= 36 && c[0] <= 70 && c[1] >= 0.42 && c[2] >= 0.4; }
  /* 反光背心常见颜色：荧光黄 / 荧光黄绿 / 荧光橙 */
  function isHiVis(r, g, b) {
    var c = hsv(r, g, b);
    if (c[0] >= 42 && c[0] <= 105 && c[1] >= 0.42 && c[2] >= 0.42) return true;
    if (c[0] >= 8 && c[0] < 42 && c[1] >= 0.72 && c[2] >= 0.6) return true;   // 橙色要求更高饱和度，避开皮肤
    return false;
  }
  /* 从视频截取 [x1,y1,x2,y2]（像素）区域，返回 {all, left, right} 命中比例 */
  function sample(src, sw, sh, rect, test) {
    var x1 = Math.max(0, rect[0]), y1 = Math.max(0, rect[1]), x2 = Math.min(sw, rect[2]), y2 = Math.min(sh, rect[3]);
    var w = x2 - x1, h = y2 - y1;
    if (w < 8 || h < 8) return null;
    ccx.drawImage(src, x1, y1, w, h, 0, 0, CW, CW);
    var d = ccx.getImageData(0, 0, CW, CW).data, hit = 0, hl = 0, hr = 0, half = CW / 2;
    for (var y = 0; y < CW; y++) for (var x = 0; x < CW; x++) {
      var i = (y * CW + x) * 4;
      if (test(d[i], d[i + 1], d[i + 2])) { hit++; if (x < half) hl++; else hr++; }
    }
    var n = CW * CW;
    return { all: hit / n, left: hl / (n / 2), right: hr / (n / 2) };
  }
  function v(p) { return p && (p.visibility == null || p.visibility > 0.4); }
  /* lm：MediaPipe 33 点骨架（0~1）；没有骨架时用人体框 box 估算。返回 {helmet:true/false/null, vest:..., hr, vr} */
  function colorCheck(src, sw, sh, lm, box) {
    var out = { helmet: null, vest: null, hr: null, vr: null };
    try {
      var head = null, torso = null;
      if (lm) {
        var ls = lm[11], rs = lm[12], lh = lm[23], rh = lm[24], le = lm[7], re = lm[8], ey1 = lm[2], ey2 = lm[5], nose = lm[0];
        var shw = (v(ls) && v(rs)) ? Math.abs(ls.x - rs.x) * sw : null;
        var headW = (v(le) && v(re)) ? Math.abs(le.x - re.x) * sw : (shw ? shw * 0.45 : null);
        var eyeY = (v(ey1) && v(ey2)) ? (ey1.y + ey2.y) / 2 * sh : (v(nose) ? nose.y * sh - 0.15 * (headW || 0) : null);
        var hx = (v(le) && v(re)) ? (le.x + re.x) / 2 * sw : (v(nose) ? nose.x * sw : null);
        if (headW && eyeY != null && hx != null) {
          headW = Math.max(headW, 16);
          head = [hx - 0.7 * headW, eyeY - 1.3 * headW, hx + 0.7 * headW, eyeY - 0.2 * headW];
        }
        if (shw && shw > 20) {
          var sy = (ls.y + rs.y) / 2 * sh, xl = Math.min(ls.x, rs.x) * sw, xr = Math.max(ls.x, rs.x) * sw;
          var hy = (v(lh) && v(rh)) ? (lh.y + rh.y) / 2 * sh : sy + 1.4 * shw;
          torso = [xl + 0.05 * shw, sy + 0.05 * shw, xr - 0.05 * shw, Math.min(hy, sh)];
          if (torso[3] - torso[1] < 0.35 * shw) torso = null;   // 躯干露出太少，不判断
        }
      } else if (box) {
        var bx1 = box[0] * sw, by1 = box[1] * sh, bw = (box[2] - box[0]) * sw, bh = (box[3] - box[1]) * sh;
        head = [bx1 + 0.25 * bw, by1, bx1 + 0.75 * bw, by1 + 0.13 * bh];
        torso = [bx1 + 0.15 * bw, by1 + 0.2 * bh, bx1 + 0.85 * bw, by1 + 0.52 * bh];
      }
      if (head) {
        var a = sample(src, sw, sh, head, isHelmetYellow);
        if (a) { out.hr = a.all; out.helmet = a.all >= CFG.helmetRatio; }
      }
      if (torso) {
        var b = sample(src, sw, sh, torso, isHiVis);
        if (b) { out.vr = b.all; out.vest = b.all >= CFG.vestRatio && b.left >= CFG.vestSide && b.right >= CFG.vestSide; }
      }
    } catch (e) { console.warn('[ppe color]', e); }
    return out;
  }

  /* 把检测框分配给某个人：头部区域找安全帽，躯干区域找背心；color 为颜色复核结果（可选） */
  function assign(personBox, headY, shoulderY, hipY, dets, color) {
    var x1 = personBox[0], x2 = personBox[2], w = x2 - x1;
    var res = { helmet: null, vest: null, mask: null };
    var neck = Math.max(0.02, shoulderY - headY);
    // 安全帽中心在眼睛上方，比鼻子高约一个“鼻子到肩膀”的距离，所以头部区域要往上放宽
    var headTop = Math.min(headY, personBox[1]) - 1.3 * neck;
    var neg = { helmet: null, vest: null, mask: null };
    dets.forEach(function (d) {
      var cxd = (d.box[0] + d.box[2]) / 2, cyd = (d.box[1] + d.box[3]) / 2;
      if (cxd < x1 - 0.15 * w || cxd > x2 + 0.15 * w) return;
      var inHead = cyd >= headTop - 0.02 && cyd <= shoulderY + 0.02;
      var inTorso = cyd >= shoulderY - 0.05 && cyd <= (hipY != null ? hipY + 0.05 : shoulderY + 0.35);
      if (inHead && d.cls === 0) pick(res, 'helmet', true, d.score);
      if (inHead && d.cls === 2) pick(neg, 'helmet', false, d.score);
      if (inHead && d.cls === 1) pick(res, 'mask', true, d.score);
      if (inHead && d.cls === 3) pick(neg, 'mask', false, d.score);
      if (inTorso && d.cls === 7) pick(res, 'vest', true, d.score);
      if (inTorso && d.cls === 4) pick(neg, 'vest', false, d.score);
    });
    ['helmet', 'vest', 'mask'].forEach(function (k) {
      var c = color ? color[k] : null;
      if (c === true) { res[k] = { ok: true, score: Math.max(res[k] ? res[k].score : 0, 0.6), by: 'color' }; return; }
      if (res[k]) return;   // 模型看到了“戴着”→ 优先相信
      // 只有“未戴”证据：需要足够置信度，且颜色复核也没看到
      if (neg[k] && neg[k].score >= CFG.negConf) res[k] = neg[k];
    });
    return res;
  }
  function pick(res, k, ok, score) { if (!res[k] || score > res[k].score) res[k] = { ok: ok, score: score }; }

  window.SHKPPE = {
    NAMES: NAMES, load: load, detect: detect, assign: assign, colorCheck: colorCheck, cfg: CFG,
    _isHelmetYellow: isHelmetYellow, _isHiVis: isHiVis,
    get loaded() { return !!sess; }, get backend() { return backend; }, get lastMs() { return lastMs; }
  };
})();
