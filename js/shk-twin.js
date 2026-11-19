/* SHine-K 3.0 · 数字孪生（三维）+ 巡检路线 + AR 巡检
 *  三维总览：每个现场一块地面；危险区域按类型着色立起来（作业票冻结 / 有人违规 → 红色闪烁）；
 *           工人按骨架位置实时移动（颜色 = 状态），紧急事件处立红色光柱并自动飞过去；热指数、隐患上报标在现场上。
 *           位置由摄像头画面投影到地面，属于示意布局，不是测绘坐标。
 *  巡检路线：在地面上点击添加巡检点，按顺序连成路线；每个点生成二维码（SHK-CP:编号）可打印贴到现场。
 *  AR 巡检：手机摄像头扫二维码 → 叠加显示这个点的检查项、所在区域状态、附近隐患；不合格项自动生成隐患上报。
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const t = SHKI18N.t, $ = (id) => document.getElementById(id);
SHKI18N.add({
  zh: { tw_title: '数字孪生 / 巡检', tw_3d: '🏭 三维总览', tw_route: '🧭 巡检路线', tw_ar: '📱 AR 巡检', tw_note: '位置由摄像头画面投影到地面，示意布局', tw_nogl: '这台电脑的浏览器不支持 WebGL 三维显示。',
    tw_follow: '紧急事件时自动飞到现场', tw_emg: '紧急事件', tw_none: '暂无', tw_sites: '现场', tw_people: '{n} 人', tw_hi: '热指数 {v}℃', tw_reports: '隐患上报',
    lg_worker: '工人', lg_alert: '异常', lg_emg: '紧急', lg_cp: '巡检点', lg_haz: '隐患',
    cp_add: '＋ 在地面上点击添加巡检点', cp_adding: '在三维地面上点击放置巡检点…', cp_name: '巡检点名称', cp_items: '检查项（每行一项）', cp_save: '保存', cp_del: '删除', cp_print: '🖨 打印二维码', cp_none: '还没有巡检点。',
    cp_today: '今天已巡检 · {t} · {b}', cp_todo: '今天未巡检', cp_bad: '有 {n} 项不合格', cp_up: '↑', cp_down: '↓', cp_default: '消防器材完好\n通道畅通无堆放\n警示标识清楚\n无跑冒滴漏',
    ar_start: '📷 打开摄像头扫码', ar_stop: '■ 关闭摄像头', ar_manual: '没有扫码功能时手动选择巡检点', ar_who: '巡检人工号', ar_ok: '合格', ar_no: '不合格', ar_note: '备注',
    ar_done: '✓ 完成本点巡检', ar_saved: '已记录：{n} 项不合格已自动上报隐患', ar_saved_ok: '已记录，全部合格', ar_zone: '所在区域', ar_permit: '作业票', ar_haz: '附近隐患', ar_nodetector: '这个浏览器不支持扫码，请手动选择。', ar_prompt: '把二维码放进框里',
    ar_found: '巡检发现：{x}' },
  ko: { tw_title: '디지털 트윈 / 순찰', tw_3d: '🏭 3D 개요', tw_route: '🧭 순찰 경로', tw_ar: '📱 AR 순찰', tw_note: '카메라 화면을 바닥에 투영한 개략 배치입니다', tw_nogl: '이 브라우저는 WebGL 3D를 지원하지 않습니다.',
    tw_follow: '긴급 상황 시 자동으로 이동', tw_emg: '긴급 사건', tw_none: '없음', tw_sites: '현장', tw_people: '{n}명', tw_hi: '열지수 {v}℃', tw_reports: '위험요인 신고',
    lg_worker: '작업자', lg_alert: '이상', lg_emg: '긴급', lg_cp: '순찰점', lg_haz: '위험요인',
    cp_add: '＋ 바닥을 클릭해 순찰점 추가', cp_adding: '3D 바닥을 클릭해 순찰점을 놓으세요…', cp_name: '순찰점 이름', cp_items: '점검 항목 (한 줄에 하나)', cp_save: '저장', cp_del: '삭제', cp_print: '🖨 QR 코드 인쇄', cp_none: '순찰점이 없습니다.',
    cp_today: '오늘 순찰 완료 · {t} · {b}', cp_todo: '오늘 미순찰', cp_bad: '{n}개 항목 부적합', cp_up: '↑', cp_down: '↓', cp_default: '소화기 상태 양호\n통로 적치물 없음\n안전표지 명확\n누출 없음',
    ar_start: '📷 카메라로 스캔', ar_stop: '■ 카메라 끄기', ar_manual: '스캔이 안 되면 직접 선택', ar_who: '순찰자 사번', ar_ok: '적합', ar_no: '부적합', ar_note: '메모',
    ar_done: '✓ 이 지점 순찰 완료', ar_saved: '기록됨: 부적합 {n}건을 위험요인으로 자동 신고', ar_saved_ok: '기록됨, 모두 적합', ar_zone: '구역', ar_permit: '작업허가', ar_haz: '주변 위험요인', ar_nodetector: '이 브라우저는 스캔을 지원하지 않습니다. 직접 선택하세요.', ar_prompt: 'QR 코드를 틀 안에 맞추세요',
    ar_found: '순찰 발견: {x}' },
  en: { tw_title: 'Digital twin / Inspection', tw_3d: '🏭 3D overview', tw_route: '🧭 Inspection route', tw_ar: '📱 AR inspection', tw_note: 'Positions are camera views projected onto the floor (schematic)', tw_nogl: 'This browser does not support WebGL 3D.',
    tw_follow: 'Fly to emergencies automatically', tw_emg: 'Emergencies', tw_none: 'None', tw_sites: 'Sites', tw_people: '{n} people', tw_hi: 'Heat index {v} °C', tw_reports: 'Hazard reports',
    lg_worker: 'Worker', lg_alert: 'Alert', lg_emg: 'Emergency', lg_cp: 'Checkpoint', lg_haz: 'Hazard',
    cp_add: '＋ Click the floor to add a checkpoint', cp_adding: 'Click on the 3D floor to place the checkpoint…', cp_name: 'Checkpoint name', cp_items: 'Check items (one per line)', cp_save: 'Save', cp_del: 'Delete', cp_print: '🖨 Print QR codes', cp_none: 'No checkpoints yet.',
    cp_today: 'Inspected today · {t} · {b}', cp_todo: 'Not inspected today', cp_bad: '{n} items failed', cp_up: '↑', cp_down: '↓', cp_default: 'Extinguishers OK\nAisles clear\nSigns legible\nNo leaks',
    ar_start: '📷 Scan with camera', ar_stop: '■ Stop camera', ar_manual: 'Pick a checkpoint manually if scanning is unavailable', ar_who: 'Inspector ID', ar_ok: 'OK', ar_no: 'Fail', ar_note: 'Note',
    ar_done: '✓ Finish this checkpoint', ar_saved: 'Saved: {n} failed items reported as hazards', ar_saved_ok: 'Saved, all OK', ar_zone: 'Zone', ar_permit: 'Permit', ar_haz: 'Nearby hazards', ar_nodetector: 'This browser cannot scan codes; pick manually.', ar_prompt: 'Fit the QR code inside the frame',
    ar_found: 'Inspection found: {x}' }
});

const tr = new SHKTransport('twin');
SHKStore.attach(tr);
const S = {};          // 现场实时数据 { people, env, alerts:{aid:...} }
let tab = localStorage.getItem('shk3_twtab') || '3d', follow = localStorage.getItem('shk3_twfollow') !== '0';
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const site = (n) => (S[n] = S[n] || { people: {}, env: null, alerts: {}, at: 0 });

tr.on((m) => {
  if (!m.site && m.type !== 'store') return;
  if (m.type === 'pose') { const isNew = !S[m.site]; const s = site(m.site); if (isNew) setTimeout(buildStatic, 0); s.at = Date.now(); const ids = {}; (m.people || []).forEach((p) => { ids[p.id] = 1; s.people[p.id] = { p, at: Date.now() }; }); Object.keys(s.people).forEach((k) => { if (!ids[k] && Date.now() - s.people[k].at > 3000) delete s.people[k]; }); }
  else if (m.type === 'env') site(m.site).env = m;
  else if (m.type === 'hb') site(m.site).at = Date.now();
  else if (m.type === 'alert') { const s = site(m.site); s.alerts[m.aid] = Object.assign(s.alerts[m.aid] || {}, m, { rx: Date.now() }); if (m.emg && m.level === 'danger' && follow) flyTo(m.site, m.loc); renderSide(); }
  else if (m.type === 'clear') { Object.values(S).forEach((s) => { if (s.alerts[m.aid]) { delete s.alerts[m.aid]; renderSide(); } }); }
});

/* ---------- 布局：每个现场一块 24×14 的地面 ---------- */
const TW = 24, TH = 14, GAP = 6;
function sites() {
  const names = new Set(Object.keys(S));
  SHKStore.all('zones').forEach((z) => names.add(z.site)); SHKStore.all('checks').forEach((c) => names.add(c.site));
  if (!names.size) names.add('SITE-A');
  return [...names].sort();
}
function origin(name) { const i = sites().indexOf(name), col = i % 2, row = Math.floor(i / 2); return { x: col * (TW + GAP), z: row * (TH + GAP) }; }
function toWorld(name, x, y) { const o = origin(name); return new THREE.Vector3(o.x + (x - 0.5) * TW, 0, o.z + (y - 0.5) * TH); }

/* ---------- 三维场景 ---------- */
let renderer, scene, camera, controls, groups = {}, raycaster = new THREE.Raycaster(), floorMeshes = [], picking = null, flyT = null, glOk = true;
function init3d() {
  const cv = $('cv3d');
  try { renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true }); } catch (e) { glOk = false; $('note3d').textContent = t('tw_nogl'); return; }
  renderer.setPixelRatio(Math.min(2, devicePixelRatio));
  scene = new THREE.Scene(); scene.background = new THREE.Color(0x0b1220); scene.fog = new THREE.Fog(0x0b1220, 80, 200);
  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 500); camera.position.set(12, 34, 40);
  controls = new OrbitControls(camera, cv); controls.target.set(12, 0, 8); controls.enableDamping = true; controls.maxPolarAngle = Math.PI * 0.47;
  scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x1a2333, 1.1));
  const dl = new THREE.DirectionalLight(0xffffff, 1.2); dl.position.set(30, 50, 20); scene.add(dl);
  const grid = new THREE.GridHelper(200, 100, 0x22304a, 0x172238); grid.position.y = -0.02; scene.add(grid);
  ['floors', 'zones', 'people', 'marks', 'route', 'labels'].forEach((k) => { groups[k] = new THREE.Group(); scene.add(groups[k]); });
  cv.addEventListener('pointerdown', onPick);
  const ro = new ResizeObserver(resize); ro.observe($('v3d')); resize();
  renderer.setAnimationLoop(frame);
}
function resize() { if (!renderer) return; const r = $('v3d').getBoundingClientRect(); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / Math.max(1, r.height); camera.updateProjectionMatrix(); }
function label(text, color, scale) {
  const c = document.createElement('canvas'), g = c.getContext('2d'), fs = 40;
  g.font = '700 ' + fs + 'px sans-serif'; const w = Math.ceil(g.measureText(text).width) + 24; c.width = w; c.height = fs + 20;
  g.font = '700 ' + fs + 'px sans-serif'; g.fillStyle = 'rgba(11,18,32,.82)'; g.fillRect(0, 0, w, c.height); g.fillStyle = color || '#fff'; g.fillText(text, 12, fs);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false, transparent: true }));
  const s = (scale || 1) * 0.6; sp.scale.set(w / 40 * s, c.height / 40 * s, 1); sp.renderOrder = 10; return sp;
}
function clear(g) { while (g.children.length) { const o = g.children.pop(); o.traverse((x) => { if (x.geometry) x.geometry.dispose(); if (x.material) { if (x.material.map) x.material.map.dispose(); x.material.dispose(); } }); } }

function buildStatic() {
  if (!glOk) return;
  clear(groups.floors); clear(groups.zones); clear(groups.route); floorMeshes = [];
  sites().forEach((name) => {
    const o = origin(name);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(TW, TH), new THREE.MeshStandardMaterial({ color: 0x1b2638, roughness: 0.9 }));
    fl.rotation.x = -Math.PI / 2; fl.position.set(o.x, 0, o.z); fl.userData.site = name; groups.floors.add(fl); floorMeshes.push(fl);
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(TW, 0.01, TH)), new THREE.LineBasicMaterial({ color: 0x3b5b8f })); edge.position.set(o.x, 0, o.z); groups.floors.add(edge);
    const lb = label(name, '#9ec5ff', 1.4); lb.position.set(o.x - TW / 2 + 3, 1.2, o.z - TH / 2 - 1); groups.floors.add(lb);
  });
  SHKStore.all('zones').forEach((z) => {
    if (!z.poly || z.poly.length < 3) return;
    const shape = new THREE.Shape(z.poly.map(([x, y]) => { const v = toWorld(z.site, x, y); return new THREE.Vector2(v.x, -v.z); }));
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 2.2, bevelEnabled: false }); geo.rotateX(-Math.PI / 2);
    const col = new THREE.Color(SHKPermit.color(z.type));
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: col, transparent: true, opacity: 0.28, depthWrite: false }));
    m.userData = { zone: z }; groups.zones.add(m);
    const ed = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: col })); ed.userData = { zone: z, edge: true }; groups.zones.add(ed);
    const c = z.poly.reduce((a, p) => [a[0] + p[0] / z.poly.length, a[1] + p[1] / z.poly.length], [0, 0]), v = toWorld(z.site, c[0], c[1]);
    const lb = label(z.name + ' · ' + SHKPermit.typeName(z.type), '#' + col.getHexString(), 0.8); lb.position.set(v.x, 3.2, v.z); lb.userData = { zoneLabel: z.id }; groups.zones.add(lb);
  });
  const cps = checks();
  const bySite = {};
  cps.forEach((c) => (bySite[c.site] = bySite[c.site] || []).push(c));
  Object.keys(bySite).forEach((n) => {
    const pts = bySite[n].map((c) => toWorld(c.site, c.x, c.y).setY(0.08));
    if (pts.length > 1) { const ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: 0x38bdf8, dashSize: 0.6, gapSize: 0.35 })); ln.computeLineDistances(); groups.route.add(ln); }
  });
  cps.forEach((c, i) => {
    const st = cpState(c), col = st === 'done' ? 0x22c55e : st === 'bad' ? 0xe8133a : 0x94a3b8, v = toWorld(c.site, c.x, c.y);
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.3, 20), new THREE.MeshStandardMaterial({ color: col })); pin.position.set(v.x, 0.15, v.z); groups.route.add(pin);
    const lb = label((c.order || i + 1) + ' ' + c.name, '#7dd3fc', 0.6); lb.position.set(v.x, 1.1, v.z); groups.route.add(lb);
  });
  legend();
}
function checks() { return SHKStore.all('checks').sort((a, b) => (a.site + String(a.order).padStart(4, '0')).localeCompare(b.site + String(b.order).padStart(4, '0'))); }
function cpState(c) { const today = new Date().toDateString(); if (!c.lastAt || new Date(c.lastAt).toDateString() !== today) return 'todo'; return (c.lastBad || 0) > 0 ? 'bad' : 'done'; }

const COL = { normal: 0x00c896, suspect: 0xffb020, ask: 0xff8c00, danger: 0xe8133a, sos: 0xe8133a };
function buildLive(time) {
  if (!glOk) return;
  clear(groups.people); clear(groups.marks);
  const now = Date.now(), bad = {};
  Object.keys(S).forEach((name) => {
    const s = S[name];
    Object.values(s.people).forEach(({ p }) => {
      if (!p.bx) return;
      const v = toWorld(name, (p.bx[0] + p.bx[2]) / 2, p.bx[3]), lvl = p.risk === 'stop' ? 'danger' : p.st;
      const col = p.zok === false ? 0xe8133a : COL[lvl] || COL.normal;
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 1.0, 4, 10), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.25 }));
      const down = p.po === 'down'; body.position.set(v.x, down ? 0.4 : 0.85, v.z); if (down) body.rotation.z = Math.PI / 2; groups.people.add(body);
      if (p.helmet === true) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xffd400 })); h.position.set(v.x + (down ? 0.75 : 0), down ? 0.55 : 1.55, v.z); groups.people.add(h); }
      const lb = label(p.id + (p.wk ? ' · ' + p.wk : '') + (p.hr != null ? ' ❤' + p.hr : ''), '#' + new THREE.Color(col).getHexString(), 0.5); lb.position.set(v.x, 2.4, v.z); groups.people.add(lb);
      if (p.zone && p.zok === false) bad[name + '|' + p.zone] = 1;
    });
    if (s.env && s.env.hi != null) {
      const o = origin(name), lv = s.env.level || 0, c = lv >= 3 ? '#ff6b81' : lv >= 2 ? '#ffb020' : lv >= 1 ? '#fde68a' : '#86efac';
      const lb = label('🌡 ' + t('tw_hi', { v: s.env.hi }) + (s.env.thunder ? ' ⚡' : ''), c, 0.7); lb.position.set(o.x + TW / 2 - 4, 1.2, o.z - TH / 2 - 1); groups.marks.add(lb);
    }
    Object.values(s.alerts).forEach((a) => {
      if (!(a.emg && a.level === 'danger')) return;
      const loc = a.loc || {}, x = loc.x != null ? loc.x : 0.5, y = loc.y != null ? loc.y : 0.5, v = toWorld(name, x, y), ph = (time % 1000) / 1000;
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 14, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0xe8133a, transparent: true, opacity: 0.25 + 0.25 * Math.sin(ph * Math.PI * 2), side: THREE.DoubleSide, depthWrite: false }));
      beam.position.set(v.x, 7, v.z); groups.marks.add(beam);
      const ring = new THREE.Mesh(new THREE.RingGeometry(1 + ph * 2.5, 1.2 + ph * 2.5, 40), new THREE.MeshBasicMaterial({ color: 0xe8133a, transparent: true, opacity: 1 - ph, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(v.x, 0.05, v.z); groups.marks.add(ring);
      const lb = label('🚨 ' + String(a.msg).slice(0, 26), '#ff6b81', 0.6); lb.position.set(v.x, 4.5, v.z); groups.marks.add(lb);
    });
  });
  // 隐患上报：落在名称匹配的区域上，否则放在现场角上
  SHKStore.all('reports').filter((r) => r.status !== 'fixed' && r.status !== 'rejected').slice(-30).forEach((r, i) => {
    const z = SHKStore.all('zones').find((z) => r.where && z.name && r.where.indexOf(z.name) >= 0 && (!r.site || z.site === r.site));
    let v; if (z) { const c = z.poly.reduce((a, p) => [a[0] + p[0] / z.poly.length, a[1] + p[1] / z.poly.length], [0, 0]); v = toWorld(z.site, c[0] + 0.04 * (i % 3), c[1] + 0.05); }
    else { const o = origin(r.site || sites()[0]); v = new THREE.Vector3(o.x + TW / 2 - 1 - (i % 6) * 0.9, 0, o.z + TH / 2 - 1); }
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.9, 12), new THREE.MeshStandardMaterial({ color: r.type === 'nearmiss' ? 0xf59e0b : 0xfb923c })); cone.rotation.x = Math.PI; cone.position.set(v.x, 0.9, v.z); groups.marks.add(cone);
  });
  // 区域闪烁：作业票冻结或有人违规
  groups.zones.children.forEach((m) => {
    const z = m.userData.zone; if (!z || !m.material || m.isSprite) return;
    const p = z.permit ? SHKPermit.forZone(z.id) : null, alarm = bad[z.site + '|' + z.name] || (p && p.status === 'frozen');
    const base = new THREE.Color(SHKPermit.color(z.type));
    if (m.userData.edge) m.material.color.copy(alarm ? new THREE.Color(0xe8133a) : base);
    else { m.material.color.copy(alarm ? new THREE.Color(0xe8133a) : base); m.material.opacity = alarm ? 0.25 + 0.2 * Math.sin(time / 180) : 0.28; }
  });
}
let lastLive = 0;
function frame(time) {
  if (tab === 'ar') return;
  controls.update();
  if (time - lastLive > 250) { lastLive = time; buildLive(time); }
  if (flyT) { const k = Math.min(1, (performance.now() - flyT.t0) / 1200), e = 1 - Math.pow(1 - k, 3); controls.target.lerpVectors(flyT.ft, flyT.tt, e); camera.position.lerpVectors(flyT.fc, flyT.tc, e); if (k >= 1) flyT = null; }
  renderer.render(scene, camera);
}
function flyTo(name, loc) {
  if (!glOk || !camera) return;
  const v = toWorld(name, loc && loc.x != null ? loc.x : 0.5, loc && loc.y != null ? loc.y : 0.5);
  flyT = { t0: performance.now(), ft: controls.target.clone(), tt: v.clone(), fc: camera.position.clone(), tc: new THREE.Vector3(v.x + 9, 18, v.z + 18) };
}
function legend() {
  $('legend').innerHTML = [['#00C896', t('lg_worker')], ['#FFB020', t('lg_alert')], ['#E8133A', t('lg_emg')], ['#94a3b8', t('lg_cp')], ['#fb923c', t('lg_haz')]].map(([c, n]) => '<span><i style="background:' + c + '"></i>' + n + '</span>').join('') +
    Object.keys(SHKPermit.TYPES).map((k) => '<span><i style="background:' + SHKPermit.color(k) + ';opacity:.7"></i>' + SHKPermit.typeName(k) + '</span>').join('');
  $('note3d').textContent = t('tw_note');
}
function onPick(e) {
  if (!picking || !glOk) return;
  const r = $('cv3d').getBoundingClientRect(), m = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(m, camera); const hit = raycaster.intersectObjects(floorMeshes)[0]; if (!hit) return;
  const name = hit.object.userData.site, o = origin(name);
  picking = null; $('v3d').classList.remove('pick');
  const x = +((hit.point.x - o.x) / TW + 0.5).toFixed(3), y = +((hit.point.z - o.z) / TH + 0.5).toFixed(3);
  const n = checks().filter((c) => c.site === name).length;
  editCp = { site: name, x, y, order: n + 1, name: 'CP-' + (n + 1), items: t('cp_default').split('\n') }; renderSide();
}

/* ---------- 侧栏 ---------- */
let editCp = null;
function renderSide() {
  const box = $('side'); if (!box || tab === 'ar') return;
  if (tab === '3d') {
    const em = []; Object.keys(S).forEach((n) => Object.values(S[n].alerts).forEach((a) => { if (a.emg && a.level === 'danger') em.push(a); }));
    box.innerHTML = '<label class="row" style="gap:6px"><input type="checkbox" id="fol"' + (follow ? ' checked' : '') + '> ' + t('tw_follow') + '</label>' +
      '<h3>' + t('tw_emg') + '</h3>' + (em.length ? em.map((a) => '<div class="emg-item" data-s="' + esc(a.site) + '" data-aid="' + esc(a.aid) + '"><b>🚨 ' + esc(a.msg) + '</b><div class="muted">' + esc(a.site) + (a.loc && a.loc.zone ? ' · ' + esc(a.loc.zone) : '') + (a.loc && a.loc.pos ? ' · ' + esc(a.loc.pos) : '') + '</div></div>').join('') : '<div class="empty">' + t('tw_none') + '</div>') +
      '<h3>' + t('tw_sites') + '</h3>' + sites().map((n) => { const s = S[n] || {}, np = Object.keys(s.people || {}).length; return '<div class="cp" data-s="' + esc(n) + '"><b>' + esc(n) + '</b> · ' + t('tw_people', { n: np }) + (s.env && s.env.hi != null ? ' · ' + t('tw_hi', { v: s.env.hi }) : '') + '</div>'; }).join('') +
      '<h3>' + t('tw_reports') + '</h3>' + (SHKStore.all('reports').filter((r) => r.status !== 'fixed' && r.status !== 'rejected').slice(-8).reverse().map((r) => '<div class="cp"><b>' + esc(r.where || r.site || '') + '</b><div class="muted">' + esc(r.text) + '</div></div>').join('') || '<div class="empty">' + t('tw_none') + '</div>');
    $('fol').onchange = function () { follow = this.checked; localStorage.setItem('shk3_twfollow', follow ? '1' : '0'); };
    box.querySelectorAll('[data-s]').forEach((d) => { d.style.cursor = 'pointer'; d.onclick = () => { const a = d.dataset.aid && Object.values((S[d.dataset.s] || {}).alerts || {}).find((x) => x.aid === d.dataset.aid); flyTo(d.dataset.s, a ? a.loc : null); }; });
    return;
  }
  // 巡检路线
  let h = '<button class="pri" id="cpAdd">' + (picking ? t('cp_adding') : t('cp_add')) + '</button><button id="cpPrint">' + t('cp_print') + '</button>';
  if (editCp) h += '<div class="cp"><label class="mini wide">' + t('cp_name') + '<input id="cpN" value="' + esc(editCp.name) + '"></label><label class="mini wide">' + t('cp_items') + '<textarea id="cpI" rows="5" style="width:100%">' + esc((editCp.items || []).join('\n')) + '</textarea></label>' +
    '<div class="muted">' + esc(editCp.site) + ' · (' + editCp.x + ', ' + editCp.y + ')</div><div class="row" style="gap:6px;margin-top:6px"><button class="pri" id="cpS">' + t('cp_save') + '</button><button id="cpC">✕</button></div></div>';
  const cps = checks();
  h += cps.length ? cps.map((c) => {
    const st = cpState(c);
    return '<div class="cp ' + st + '"><b>' + (c.order || '') + '. ' + esc(c.name) + '</b> <span class="muted">' + esc(c.site) + '</span><div class="muted">' + (st === 'todo' ? t('cp_todo') : t('cp_today', { t: new Date(c.lastAt).toLocaleTimeString(), b: c.lastBy || '' })) + (st === 'bad' ? ' · ' + t('cp_bad', { n: c.lastBad }) : '') + '</div>' +
      '<div class="row" style="gap:4px;margin-top:4px"><button class="sm" data-up="' + esc(c.id) + '">↑</button><button class="sm" data-dn="' + esc(c.id) + '">↓</button><button class="sm" data-ed="' + esc(c.id) + '">✎</button><button class="sm" data-del="' + esc(c.id) + '">' + t('cp_del') + '</button></div></div>';
  }).join('') : '<div class="empty">' + t('cp_none') + '</div>';
  box.innerHTML = h;
  $('cpAdd').onclick = () => { picking = true; $('v3d').classList.add('pick'); renderSide(); };
  $('cpPrint').onclick = printQR;
  if (editCp) {
    $('cpS').onclick = () => { editCp.name = $('cpN').value.trim() || editCp.name; editCp.items = $('cpI').value.split('\n').map((x) => x.trim()).filter(Boolean); SHKStore.put('checks', editCp); editCp = null; buildStatic(); renderSide(); };
    $('cpC').onclick = () => { editCp = null; renderSide(); };
  }
  const move = (id, d) => { const list = checks().filter((c) => c.site === SHKStore.get('checks', id).site), i = list.findIndex((c) => c.id === id), j = i + d; if (j < 0 || j >= list.length) return; [list[i], list[j]] = [list[j], list[i]]; list.forEach((c, k) => SHKStore.put('checks', Object.assign({}, c, { order: k + 1 }))); buildStatic(); renderSide(); };
  box.querySelectorAll('[data-up]').forEach((b) => (b.onclick = () => move(b.dataset.up, -1)));
  box.querySelectorAll('[data-dn]').forEach((b) => (b.onclick = () => move(b.dataset.dn, 1)));
  box.querySelectorAll('[data-ed]').forEach((b) => (b.onclick = () => { editCp = Object.assign({}, SHKStore.get('checks', b.dataset.ed)); renderSide(); }));
  box.querySelectorAll('[data-del]').forEach((b) => (b.onclick = () => { SHKStore.del('checks', b.dataset.del); buildStatic(); renderSide(); }));
}
function printQR() {
  if (typeof qrcode !== 'function') return;
  $('printArea').innerHTML = checks().map((c) => { const q = qrcode(0, 'M'); q.addData('SHK-CP:' + c.id); q.make(); return '<div class="q">' + q.createSvgTag({ cellSize: 6, margin: 2 }) + '<b>' + esc(c.order + '. ' + c.name) + '</b><span>' + esc(c.site) + ' · ' + esc(c.id) + '</span></div>'; }).join('');
  setTimeout(() => window.print(), 100);
}

/* ---------- AR 巡检 ---------- */
let arStream = null, arTimer = null, arCp = null, arRes = {}, detector = null;
function renderAR() {
  const ctl = $('arCtl'), cps = checks();
  ctl.innerHTML = '<button class="pri" id="arGo">' + (arStream ? t('ar_stop') : t('ar_start')) + '</button>' +
    '<label class="mini wide">' + t('ar_who') + '<input id="arWho" list="arWl" value="' + esc(localStorage.getItem('shk3_inspector') || '') + '"><datalist id="arWl">' + SHKStore.all('roster').map((r) => '<option value="' + esc(r.id) + '">' + esc(r.name || '') + '</option>').join('') + '</datalist></label>' +
    '<label class="mini wide">' + t('ar_manual') + '<select id="arSel"><option value=""></option>' + cps.map((c) => '<option value="' + esc(c.id) + '">' + esc(c.site + ' · ' + c.order + '. ' + c.name) + '</option>').join('') + '</select></label><div class="muted" id="arMsg">' + ('BarcodeDetector' in window ? t('ar_prompt') : t('ar_nodetector')) + '</div>';
  $('arGo').onclick = () => (arStream ? stopAR() : startAR());
  $('arWho').onchange = function () { localStorage.setItem('shk3_inspector', this.value.trim()); };
  $('arSel').onchange = function () { if (this.value) openCp(this.value); };
}
async function startAR() {
  try { arStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false }); $('arVideo').srcObject = arStream; await $('arVideo').play(); }
  catch (e) { $('arMsg').textContent = e.message; arStream = null; return; }
  if ('BarcodeDetector' in window) { try { detector = new BarcodeDetector({ formats: ['qr_code'] }); } catch (e) { detector = null; } }
  if (detector) arTimer = setInterval(async () => {
    try { const r = await detector.detect($('arVideo')); const hit = r.find((x) => /^SHK-CP:/.test(x.rawValue)); if (hit) { const id = hit.rawValue.slice(7); if (!arCp || arCp.id !== id) openCp(id); } } catch (e) {}
  }, 400);
  renderAR();
}
function stopAR() { clearInterval(arTimer); if (arStream) arStream.getTracks().forEach((k) => k.stop()); arStream = null; renderAR(); }
function openCp(id) {
  const c = SHKStore.get('checks', id); if (!c) return; arCp = c; arRes = {};
  try { navigator.vibrate && navigator.vibrate(80); } catch (e) {}
  drawCard();
}
function drawCard() {
  const c = arCp, card = $('arCard'); if (!c) { card.className = 'ar-card'; return; }
  const z = SHKStore.all('zones').find((z) => z.site === c.site && pointIn([c.x, c.y], z.poly)), p = z && z.permit ? SHKPermit.forZone(z.id) : null, st = SHKPermit.status(p);
  const s = S[c.site] || {}, hz = SHKStore.all('reports').filter((r) => r.status !== 'fixed' && r.status !== 'rejected' && (r.site === c.site) && (!z || !r.where || r.where.indexOf(z.name) >= 0)).slice(-3);
  card.innerHTML = '<b>' + esc(c.order + '. ' + c.name) + '</b> <span class="muted">' + esc(c.site) + '</span>' +
    '<div class="muted" style="font-size:12px;margin:4px 0">' + t('ar_zone') + ': ' + (z ? esc(z.name) + ' · ' + SHKPermit.typeName(z.type) : '—') + (z && z.permit ? ' · ' + t('ar_permit') + ': ' + (st ? t('ps_' + st) : '—') : '') + (s.env && s.env.hi != null ? ' · ' + t('tw_hi', { v: s.env.hi }) : '') + '</div>' +
    (hz.length ? '<div class="note" style="font-size:12px">⚠ ' + t('ar_haz') + ': ' + hz.map((r) => esc(r.text)).join('；') + '</div>' : '') +
    (c.items || []).map((it, i) => '<div class="it"><span>' + esc(it) + '</span><button class="' + (arRes[i] === true ? 'on ok' : '') + '" data-i="' + i + '" data-v="1">' + t('ar_ok') + '</button><button class="' + (arRes[i] === false ? 'on no' : '') + '" data-i="' + i + '" data-v="0">' + t('ar_no') + '</button></div>').join('') +
    '<input id="arNote" placeholder="' + t('ar_note') + '" style="width:100%;margin-top:6px"><button class="pri" id="arDone" style="width:100%;margin-top:8px">' + t('ar_done') + '</button>';
  card.className = 'ar-card on';
  card.querySelectorAll('[data-i]').forEach((b) => (b.onclick = () => { arRes[b.dataset.i] = b.dataset.v === '1'; drawCard(); }));
  $('arDone').onclick = () => {
    const who = ($('arWho') && $('arWho').value.trim()) || '', bad = (c.items || []).filter((_, i) => arRes[i] === false), note = $('arNote').value.trim();
    SHKStore.put('checks', Object.assign({}, c, { lastAt: Date.now(), lastBy: who, lastBad: bad.length, lastNote: note }));
    bad.forEach((it) => SHKStore.put('reports', { type: 'hazard', sev: 'mid', where: (z ? z.name + ' · ' : '') + c.name, text: t('ar_found', { x: it }) + (note ? '（' + note + '）' : ''), worker: who || null, site: c.site, at: Date.now(), status: 'new', src: 'inspection' }));
    const key = 'insp:' + c.id + ':' + who + ':' + new Date().toISOString().slice(0, 10);
    if (who && !SHKStore.get('points', key)) SHKStore.put('points', { id: key, worker: who, delta: 1, reason: t('tw_ar') + ' · ' + c.name, at: Date.now() });
    $('arMsg').textContent = bad.length ? t('ar_saved', { n: bad.length }) : t('ar_saved_ok');
    arCp = null; drawCard(); buildStatic();
  };
}
function pointIn(p, poly) { let x = p[0], y = p[1], ins = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1]; if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) ins = !ins; } return ins; }

/* ---------- 页面 ---------- */
function langs() { document.querySelectorAll('.langs button').forEach((b) => { b.classList.toggle('on', b.dataset.l === SHKI18N.lang); b.onclick = () => { SHKI18N.set(b.dataset.l); langs(); render(); buildStatic(); }; }); }
function render() {
  SHKI18N.apply(); $('twTitle').textContent = t('tw_title'); document.title = 'SHine-K 3.0 · ' + t('tw_title');
  $('tabs').innerHTML = ['3d', 'route', 'ar'].map((k) => '<button data-t="' + k + '" class="' + (k === tab ? 'on' : '') + '">' + t('tw_' + k) + '</button>').join('');
  $('tabs').querySelectorAll('button').forEach((b) => (b.onclick = () => { tab = b.dataset.t; localStorage.setItem('shk3_twtab', tab); if (tab !== 'ar') stopAR(); render(); }));
  $('wrap').style.display = tab === 'ar' ? 'none' : ''; $('ar').style.display = tab === 'ar' ? '' : 'none';
  if (tab === 'ar') renderAR(); else { renderSide(); resize(); }
}
$('room').value = SHKTransport.savedRoom();
tr.onState = (s) => { const p = $('pillLink'); p.className = 'pill ' + (s === 'on' || s === 'off' ? 'ok' : s === 'error' ? 'dng' : 'warn'); $('linkSt').textContent = s === 'off' ? 'local' : s === 'on' ? tr.room : s; $('btnLink').textContent = s === 'off' ? t('connect') : t('disconnect'); };
$('btnLink').onclick = () => { if (tr.mqttState === 'off') tr.connectRoom($('room').value); else tr.disconnectRoom(); };
tr.onState('off'); if ($('room').value) tr.connectRoom($('room').value);
SHKStore.on((coll) => { if (coll === 'zones' || coll === 'checks') buildStatic(); if (tab !== 'ar' && !(document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))) renderSide(); });
init3d(); langs(); render(); buildStatic();
setInterval(() => { if (tab === '3d') renderSide(); }, 3000);
window.SHKTwin = { S, flyTo, buildStatic, openCp: (id) => openCp(id) };
