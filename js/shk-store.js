/* SHine-K 3.0 · 共享数据（人员名单、作业票、危险区域、隐患/未遂上报、积分、设置）
 * 没有后端服务器：每台电脑浏览器各存一份（localStorage），通过同一套通道同步：
 *   同一浏览器 → BroadcastChannel；不同电脑 → 同一个房间码的 MQTT。
 * 合并规则：同一条记录以 updatedAt 较新的为准（删除也记成一条带 _del 的记录）。
 * 隐私：姓名、电话等字段只在本机浏览器之间同步，不发到公共 MQTT 服务器。
 */
(function () {
  'use strict';
  var KEY = 'shk3_store', COLLS = ['roster', 'permits', 'zones', 'reports', 'points', 'config', 'checks'];
  var PRIVATE = ['name', 'phone', 'note_private'];
  var db = load(), tr = null, listeners = [], self = 'S' + Math.random().toString(36).slice(2, 8);

  function load() {
    var d = {};
    try { d = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) {}
    COLLS.forEach(function (c) { d[c] = d[c] || {}; });
    return d;
  }
  var saveT = null;
  function save() { clearTimeout(saveT); saveT = setTimeout(function () { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} }, 50); }
  function emit(coll, item, remote) { listeners.forEach(function (f) { try { f(coll, item, remote); } catch (e) { console.warn(e); } }); }
  function strip(m) {
    var o = JSON.parse(JSON.stringify(m));
    var fix = function (it) { PRIVATE.forEach(function (k) { if (it && k in it) it[k] = it[k] ? '•' : ''; }); };
    if (o.item) fix(o.item);
    if (o.data) Object.keys(o.data).forEach(function (c) { (o.data[c] || []).forEach(fix); });
    return o;
  }
  function merge(coll, it) {
    if (!it || !it.id || COLLS.indexOf(coll) < 0) return false;
    var cur = db[coll][it.id];
    if (cur && (cur.updatedAt || 0) >= (it.updatedAt || 0)) return false;
    // 从公共服务器收到的隐私字段是“•”，不覆盖本机已有的真实值
    if (cur) PRIVATE.forEach(function (k) { if (it[k] === '•' && cur[k]) it[k] = cur[k]; });
    db[coll][it.id] = it; return true;
  }
  function uid(prefix) { return (prefix || 'X') + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 1296).toString(36).toUpperCase(); }

  var Store = {
    all: function (coll) { return Object.keys(db[coll] || {}).map(function (k) { return db[coll][k]; }).filter(function (x) { return !x._del; }); },
    get: function (coll, id) { var x = (db[coll] || {})[id]; return x && !x._del ? x : null; },
    put: function (coll, obj) {
      obj = Object.assign({}, obj);
      if (!obj.id) obj.id = uid(coll.slice(0, 1).toUpperCase() + '-');
      obj.updatedAt = Math.max(Date.now(), ((db[coll] || {})[obj.id] || {}).updatedAt + 1 || 0);
      obj.by = obj.by || self;
      db[coll][obj.id] = obj; save(); emit(coll, obj, false);
      if (tr) tr.send({ type: 'store', coll: coll, item: obj }, { mqtt: strip });
      return obj;
    },
    del: function (coll, id) { return Store.put(coll, { id: id, _del: true }); },
    on: function (fn) { listeners.push(fn); },
    uid: uid,
    /* 连接通道：启动时向其他页面要一份完整数据 */
    attach: function (transport) {
      tr = transport;
      tr.on(function (m) {
        if (m.type === 'store' && m.item) { if (merge(m.coll, m.item)) { save(); emit(m.coll, m.item, true); } }
        else if (m.type === 'store_req' && m.from !== tr.clientId) {
          var n = COLLS.reduce(function (a, c) { return a + Object.keys(db[c]).length; }, 0);
          if (n) setTimeout(function () { Store.dump(); }, 200 + Math.random() * 600);
        } else if (m.type === 'store_dump' && m.data) {
          var changed = false;
          Object.keys(m.data).forEach(function (c) { (m.data[c] || []).forEach(function (it) { if (merge(c, it)) { changed = true; emit(c, it, true); } }); });
          if (changed) save();
        }
      });
      var ask = function () { tr.send({ type: 'store_req' }); };
      ask(); setTimeout(ask, 2500);
      // 连上房间后再要一次
      var orig = tr._setState.bind(tr);
      tr._setState = function (s, info) { orig(s, info); if (s === 'on') setTimeout(ask, 500); };
    },
    dump: function () {
      if (!tr) return;
      var data = {}; COLLS.forEach(function (c) { data[c] = Object.keys(db[c]).map(function (k) { return db[c][k]; }); });
      tr.send({ type: 'store_dump', data: data }, { mqtt: strip });
    },
    exportJSON: function () { return JSON.stringify(db, null, 2); },
    importJSON: function (txt) {
      var d = JSON.parse(txt), n = 0;
      COLLS.forEach(function (c) { Object.keys(d[c] || {}).forEach(function (k) { var it = d[c][k]; it.updatedAt = Date.now() + n; if (merge(c, it)) { n++; emit(c, it, false); } }); });
      save(); Store.dump(); return n;
    },
    /* 设置（一个集合里的单条记录） */
    cfg: function (k, def) { var x = Store.get('config', k); return x ? x.v : def; },
    setCfg: function (k, v) { return Store.put('config', { id: k, v: v }); }
  };
  // 同一浏览器其他标签页直接改了 localStorage（例如关闭时最后一次保存）
  window.addEventListener('storage', function (e) {
    if (e.key !== KEY || !e.newValue) return;
    try { var d = JSON.parse(e.newValue); COLLS.forEach(function (c) { Object.keys(d[c] || {}).forEach(function (k) { if (merge(c, d[c][k])) emit(c, d[c][k], true); }); }); } catch (x) {}
  });
  window.SHKStore = Store;
})();
