/* SHine-K 3.0 · 热应激管理（温湿度 → 热指数 → 中暑风险预警）
 * 数据来源（优先级从高到低）：
 *   1. 蓝牙温湿度计（现场实测，2 分钟内有数据）
 *   2. 手动输入（例如读墙上的温湿度表）
 *   3. 天气（Open-Meteo 免费天气接口：当前温度、湿度、风速、雷暴、当日最高气温）
 * 规则：热指数分级（美国国家气象局）+《防暑降温措施管理办法》第八条（室外露天作业按当日最高气温安排）
 * 和手表心率结合的个人判断在 shk-risk.js。
 */
(function () {
  'use strict';
  var t = SHKI18N.t, R = SHKRisk;
  SHKI18N.add({
    zh: {
      env_title: '热应激 · 温湿度', env_src_ble: '温湿度计', env_src_manual: '手动', env_src_wx: '天气', env_none: '还没有温湿度数据',
      env_ble: '＋ 蓝牙温湿度计', env_wx: '☁ 当前位置天气', env_city: '城市', env_city_go: '查询', env_manual: '手动输入', env_save: '确定',
      env_outdoor: '室外露天作业', env_t: '温度', env_rh: '湿度', env_hi: '热指数', env_wind: '风速', env_tmax: '今日最高',
      hl0: '正常', hl1: '注意', hl2: '高度注意', hl3: '危险', hl4: '极度危险',
      ha0: '正常作业。', ha1: '长时间劳动可能疲劳，注意补水。', ha2: '可能中暑：每小时补水休息，避免长时间高强度作业，留意手表心率。',
      ha3: '很可能中暑：停止高强度作业，轮换到阴凉处休息，监护人盯住每个人的心率。', ha4: '极易中暑：停止作业。',
      or_stop: '今日最高气温 ≥ 40℃：按《防暑降温措施管理办法》停止当日室外露天作业。',
      or_limit: '今日最高气温 37–40℃：室外露天作业全天累计不超过 6 小时，最高温时段 3 小时内不安排。',
      or_rotate: '今日最高气温 35–37℃：换班轮休，缩短连续作业时间，不安排加班。',
      ev_heat: '热指数 {hi}℃（{lv}）', say_heat: '注意，现场热指数{hi}度，{lv}。请补水休息，避免高强度作业。',
      ev_outdoor_stop: '今日最高气温 {tmax}℃，停止室外露天作业', say_outdoor_stop: '今日最高气温超过四十度，按规定停止室外露天作业。',
      thunder: '雷暴', wx_err: '天气获取失败：{msg}', geo_err: '无法获取位置：{msg}', env_err: '温湿度计：{msg}',
      env_no_svc: '这个设备没有温湿度服务（支持标准环境传感服务和小米米家温湿度计 2）。'
    },
    ko: {
      env_title: '열 스트레스 · 온습도', env_src_ble: '온습도계', env_src_manual: '수동', env_src_wx: '날씨', env_none: '온습도 데이터가 아직 없습니다',
      env_ble: '＋ 블루투스 온습도계', env_wx: '☁ 현재 위치 날씨', env_city: '도시', env_city_go: '조회', env_manual: '수동 입력', env_save: '확인',
      env_outdoor: '실외 작업', env_t: '온도', env_rh: '습도', env_hi: '열지수', env_wind: '풍속', env_tmax: '오늘 최고',
      hl0: '정상', hl1: '주의', hl2: '경고', hl3: '위험', hl4: '매우 위험',
      ha0: '정상 작업.', ha1: '장시간 작업 시 피로할 수 있습니다. 물을 마시세요.', ha2: '열사병 가능: 매시간 물과 휴식, 장시간 고강도 작업을 피하고 워치 심박을 확인하세요.',
      ha3: '열사병 위험 높음: 고강도 작업 중지, 그늘에서 교대 휴식, 감시자가 모두의 심박을 확인하세요.', ha4: '작업 중지.',
      or_stop: '오늘 최고기온 40℃ 이상: 실외 작업을 중지합니다.', or_limit: '오늘 최고기온 37–40℃: 실외 작업 하루 6시간 이내, 가장 더운 3시간은 작업하지 않습니다.',
      or_rotate: '오늘 최고기온 35–37℃: 교대 휴식, 연속 작업 단축, 연장근무 금지.',
      ev_heat: '열지수 {hi}℃ ({lv})', say_heat: '주의, 현장 열지수 {hi}도, {lv}. 물을 마시고 쉬세요. 고강도 작업을 피하세요.',
      ev_outdoor_stop: '오늘 최고기온 {tmax}℃, 실외 작업 중지', say_outdoor_stop: '오늘 최고기온이 40도 이상입니다. 실외 작업을 중지하세요.',
      thunder: '뇌우', wx_err: '날씨 조회 실패: {msg}', geo_err: '위치를 가져올 수 없음: {msg}', env_err: '온습도계: {msg}',
      env_no_svc: '이 기기에는 온습도 서비스가 없습니다 (표준 환경 센싱, 샤오미 온습도계 2 지원).'
    },
    en: {
      env_title: 'Heat stress · Temp & humidity', env_src_ble: 'Thermometer', env_src_manual: 'Manual', env_src_wx: 'Weather', env_none: 'No temperature data yet',
      env_ble: '＋ Bluetooth thermometer', env_wx: '☁ Local weather', env_city: 'City', env_city_go: 'Look up', env_manual: 'Enter manually', env_save: 'OK',
      env_outdoor: 'Outdoor work', env_t: 'Temp', env_rh: 'Humidity', env_hi: 'Heat index', env_wind: 'Wind', env_tmax: 'Today max',
      hl0: 'Normal', hl1: 'Caution', hl2: 'Extreme caution', hl3: 'Danger', hl4: 'Extreme danger',
      ha0: 'Normal work.', ha1: 'Fatigue possible with prolonged work. Drink water.', ha2: 'Heat illness possible: water and rest every hour, avoid long heavy work, watch heart rates.',
      ha3: 'Heat illness likely: stop heavy work, rotate to shade, the guardian watches everyone’s heart rate.', ha4: 'Stop work.',
      or_stop: 'Today’s max ≥ 40 °C: stop outdoor work for the day.', or_limit: 'Today’s max 37–40 °C: outdoor work ≤ 6 h in total, none in the hottest 3 hours.',
      or_rotate: 'Today’s max 35–37 °C: rotate shifts, shorten continuous work, no overtime.',
      ev_heat: 'Heat index {hi} °C ({lv})', say_heat: 'Attention, heat index {hi} degrees, {lv}. Drink water and rest, avoid heavy work.',
      ev_outdoor_stop: 'Today’s max {tmax} °C, stop outdoor work', say_outdoor_stop: 'Today’s maximum is above forty degrees. Stop outdoor work.',
      thunder: 'Thunderstorm', wx_err: 'Weather failed: {msg}', geo_err: 'Location unavailable: {msg}', env_err: 'Thermometer: {msg}',
      env_no_svc: 'This device has no temperature service (standard Environmental Sensing and Xiaomi Mijia thermometer 2 are supported).'
    }
  });

  var S = { ble: null, manual: null, wx: null }, sensor = null, H = null, wxTimer = null;
  var outdoor = false; try { outdoor = localStorage.getItem('shk3_outdoor') === '1'; } catch (e) {}
  try { S.manual = JSON.parse(localStorage.getItem('shk3_env_manual') || 'null'); } catch (e) {}

  function current() {
    var now = Date.now(), src = null, v = null;
    if (S.ble && now - S.ble.at < 120000 && S.ble.t != null) { src = 'ble'; v = S.ble; }
    else if (S.manual && S.manual.t != null && now - S.manual.at < 4 * 3600000) { src = 'manual'; v = S.manual; }
    else if (S.wx && S.wx.t != null) { src = 'wx'; v = S.wx; }
    if (!v) return { src: null, outdoor: outdoor, wind: S.wx && S.wx.wind, gust: S.wx && S.wx.gust, thunder: !!(S.wx && S.wx.thunder), tmax: S.wx && S.wx.tmax };
    var hi = R.heatIndex(v.t, v.rh);
    return { src: src, t: v.t, rh: v.rh, hi: hi, level: R.heatLevel(hi), outdoor: outdoor, wind: S.wx && S.wx.wind, gust: S.wx && S.wx.gust,
      thunder: !!(S.wx && S.wx.thunder), code: S.wx && S.wx.code, tmax: S.wx && S.wx.tmax, rule: outdoor && S.wx ? R.outdoorRule(S.wx.tmax) : null, place: S.wx && S.wx.place, lat: S.wx && S.wx.lat, lon: S.wx && S.wx.lon, at: v.at };
  }

  async function fetchWx(lat, lon, place) {
    var u = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat.toFixed(3) + '&longitude=' + lon.toFixed(3) +
      '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_gusts_10m&daily=temperature_2m_max&timezone=auto&wind_speed_unit=ms&forecast_days=1';
    var r = await fetch(u); if (!r.ok) throw new Error('HTTP ' + r.status);
    var j = await r.json(), c = j.current || {};
    S.wx = { t: c.temperature_2m, rh: c.relative_humidity_2m, app: c.apparent_temperature, code: c.weather_code, wind: c.wind_speed_10m, gust: c.wind_gusts_10m,
      thunder: [95, 96, 99].indexOf(c.weather_code) >= 0, tmax: j.daily && j.daily.temperature_2m_max ? j.daily.temperature_2m_max[0] : null, at: Date.now(), place: place || (lat.toFixed(2) + ',' + lon.toFixed(2)), lat: lat, lon: lon };
    try { localStorage.setItem('shk3_wloc', JSON.stringify({ lat: lat, lon: lon, place: S.wx.place })); } catch (e) {}
    clearInterval(wxTimer); wxTimer = setInterval(function () { fetchWx(lat, lon, place).catch(function () {}); }, 10 * 60000);
    tick(); return S.wx;
  }
  function useGeo() {
    return new Promise(function (ok, no) {
      if (!navigator.geolocation) return no(new Error('geolocation'));
      navigator.geolocation.getCurrentPosition(function (p) { fetchWx(p.coords.latitude, p.coords.longitude).then(ok, no); }, function (e) { no(new Error(e.message || 'denied')); }, { timeout: 10000, maximumAge: 600000 });
    });
  }
  async function byCity(name) {
    var l = SHKI18N.lang === 'zh' ? 'zh' : SHKI18N.lang;
    var r = await fetch('https://geocoding-api.open-meteo.com/v1/search?count=1&language=' + l + '&name=' + encodeURIComponent(name));
    var j = await r.json(); if (!j.results || !j.results.length) throw new Error('not found');
    var g = j.results[0]; return fetchWx(g.latitude, g.longitude, g.name + (g.admin1 ? ' · ' + g.admin1 : ''));
  }
  async function connectSensor() {
    var d = new SHKBLE.EnvSensor();
    try { await d.request(); }
    catch (e) { if (e.name === 'NotFoundError') return; H.log('warn', e.code === 'NO_ENV_SERVICE' ? t('env_no_svc') : t('env_err', { msg: e.message || e })); return; }
    sensor = d; S.ble = { t: null, rh: null, at: 0, name: d.name };
    d.on('data', function (x) { S.ble = { t: x.t, rh: x.rh, at: Date.now(), name: d.name }; tick(); });
    d.on('status', function (s) { H.log(s === 'connected' ? 'info' : 'warn', d.name + ' ' + s); render(); });
    H.log('info', d.name + ' ✓');
  }

  /* ---------- 警报（只在等级变化时提醒，同一级 30 分钟再说一次） ---------- */
  var lastLv = 0, lastSay = 0;
  function tick() {
    if (!H) return;
    var c = current(); render();
    var lv = c.level || 0, now = Date.now();
    if (lv >= 2) {
      var lvTxt = t('hl' + lv);
      if (lv !== lastLv || now - lastSay > 30 * 60000) {
        lastSay = now;
        H.raise({ key: 'env:heat', wid: 'ENV', kind: 'heat', level: lv >= 4 ? 'danger' : 'warn', msg: t('ev_heat', { hi: c.hi, lv: lvTxt }) + ' · ' + t('ha' + lv), say: t('say_heat', { hi: Math.round(c.hi), lv: lvTxt }) });
      }
    } else if (lastLv >= 2) H.clear('env:heat');
    lastLv = lv;
    if (c.rule === 'stop') H.raise({ key: 'env:outdoor', wid: 'ENV', kind: 'outdoor_stop', level: 'danger', msg: t('ev_outdoor_stop', { tmax: c.tmax }), say: t('say_outdoor_stop') });
    else H.clear('env:outdoor');
  }
  setInterval(function () { if (H) { H.send(Object.assign({ type: 'env' }, current())); } }, 5000);

  /* ---------- 卡片 ---------- */
  function render() {
    var box = H && H.box; if (!box) return;
    var c = current(), lv = c.level || 0;
    var cls = lv >= 3 ? 'dng' : lv >= 2 ? 'warn' : lv >= 1 ? 'warn' : 'ok';
    var srcTxt = c.src === 'ble' ? '🌡 ' + t('env_src_ble') + ' · ' + (S.ble.name || '') : c.src === 'manual' ? '✎ ' + t('env_src_manual') : c.src === 'wx' ? '☁ ' + t('env_src_wx') + ' · ' + (c.place || '') : '';
    var main = c.src ? '<div class="env-big ' + cls + '"><div><small>' + t('env_hi') + '</small><b>' + c.hi + '<small>℃</small></b></div><div><span class="tag ' + (lv >= 3 ? 'no' : lv >= 1 ? 'q' : 'ok') + '">' + t('hl' + lv) + '</span></div></div>' +
      '<div class="env-row"><span>' + t('env_t') + ' <b>' + (+c.t).toFixed(1) + '℃</b></span><span>' + t('env_rh') + ' <b>' + Math.round(c.rh) + '%</b></span>' +
      (c.wind != null ? '<span>' + t('env_wind') + ' <b>' + c.wind + ' m/s</b>' + (c.gust != null ? ' (' + c.gust + ')' : '') + '</span>' : '') +
      (c.tmax != null ? '<span>' + t('env_tmax') + ' <b>' + c.tmax + '℃</b></span>' : '') + (c.thunder ? '<span class="tag no">⚡ ' + t('thunder') + '</span>' : '') + '</div>' +
      '<div class="note">' + t('ha' + lv) + (c.rule ? '<br><b>' + t('or_' + c.rule) + '</b>' : '') + '</div><div class="muted" style="font-size:12px">' + srcTxt + '</div>'
      : '<div class="empty">' + t('env_none') + '</div>';
    box.querySelector('[data-env]').innerHTML = main;
    box.querySelector('[data-oc]').checked = outdoor;
  }
  function build(box) {
    box.innerHTML = '<h3 data-i18n="env_title">' + t('env_title') + '</h3><div data-env></div>' +
      '<div class="row" style="margin-top:8px;flex-wrap:wrap;gap:6px"><button data-b>' + t('env_ble') + '</button><button data-g>' + t('env_wx') + '</button></div>' +
      '<details class="env-more"><summary>' + t('env_city') + ' / ' + t('env_manual') + '</summary>' +
      '<div class="row" style="gap:6px;margin-top:6px"><input data-city style="flex:1;min-width:90px" placeholder="' + t('env_city') + '"><button data-cg>' + t('env_city_go') + '</button></div>' +
      '<div class="row" style="gap:6px;margin-top:6px"><input data-mt type="number" step="0.1" style="width:80px" placeholder="℃"><input data-mh type="number" step="1" style="width:80px" placeholder="%RH"><button data-ms>' + t('env_save') + '</button></div></details>' +
      '<label class="row" style="gap:6px;margin-top:8px"><input type="checkbox" data-oc> ' + t('env_outdoor') + '</label>';
    box.querySelector('[data-b]').onclick = connectSensor;
    box.querySelector('[data-g]').onclick = function () { useGeo().catch(function (e) { H.log('warn', t('geo_err', { msg: e.message })); }); };
    box.querySelector('[data-cg]').onclick = function () { var v = box.querySelector('[data-city]').value.trim(); if (v) byCity(v).catch(function (e) { H.log('warn', t('wx_err', { msg: e.message })); }); };
    box.querySelector('[data-ms]').onclick = function () {
      var tv = parseFloat(box.querySelector('[data-mt]').value), hv = parseFloat(box.querySelector('[data-mh]').value);
      if (isNaN(tv) || isNaN(hv)) { S.manual = null; try { localStorage.removeItem('shk3_env_manual'); } catch (e) {} }
      else { S.manual = { t: tv, rh: hv, at: Date.now() }; try { localStorage.setItem('shk3_env_manual', JSON.stringify(S.manual)); } catch (e) {} }
      tick();
    };
    box.querySelector('[data-oc]').onchange = function () { outdoor = this.checked; try { localStorage.setItem('shk3_outdoor', outdoor ? '1' : '0'); } catch (e) {} tick(); };
    render();
  }

  window.SHKHeat = {
    /* host: { box, raise, clear, send, log } */
    init: function (host) {
      H = host; if (H.box) build(H.box);
      try { var w = JSON.parse(localStorage.getItem('shk3_wloc') || 'null'); if (w) fetchWx(w.lat, w.lon, w.place).catch(function () {}); } catch (e) {}
      tick();
    },
    rebuild: function () { if (H && H.box) build(H.box); },
    current: current, fetchWx: fetchWx, setManual: function (tv, hv) { S.manual = { t: tv, rh: hv, at: Date.now() }; tick(); },
    _set: function (k, v) { S[k] = v; tick(); }
  };
})();
