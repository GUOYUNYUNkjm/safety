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

  /* 把检测框分配给某个人：头部区域（人体框上部）找安全帽，躯干区域找背心 */
  function assign(personBox, headY, shoulderY, hipY, dets) {
    var x1 = personBox[0], x2 = personBox[2], w = x2 - x1;
    var res = { helmet: null, vest: null, mask: null };
    var headTop = Math.min(headY, personBox[1]) - 0.25 * (shoulderY - headY);
    dets.forEach(function (d) {
      var cxd = (d.box[0] + d.box[2]) / 2, cyd = (d.box[1] + d.box[3]) / 2;
      if (cxd < x1 - 0.15 * w || cxd > x2 + 0.15 * w) return;
      var inHead = cyd >= headTop - 0.02 && cyd <= shoulderY + 0.02;
      var inTorso = cyd >= shoulderY - 0.03 && cyd <= (hipY != null ? hipY + 0.05 : shoulderY + 0.3);
      if (inHead && (d.cls === 0 || d.cls === 2)) pick(res, 'helmet', d.cls === 0, d.score);
      if (inHead && (d.cls === 1 || d.cls === 3)) pick(res, 'mask', d.cls === 1, d.score);
      if (inTorso && (d.cls === 7 || d.cls === 4)) pick(res, 'vest', d.cls === 7, d.score);
    });
    return res;
  }
  function pick(res, k, ok, score) { if (!res[k] || score > res[k].score) res[k] = { ok: ok, score: score }; }

  window.SHKPPE = {
    NAMES: NAMES, load: load, detect: detect, assign: assign,
    get loaded() { return !!sess; }, get backend() { return backend; }, get lastMs() { return lastMs; }
  };
})();
