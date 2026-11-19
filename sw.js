/* SHine-K 3.0 · 工人手机端的通知服务（只负责显示 / 点击通知，不缓存任何数据） */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cs) {
    for (var i = 0; i < cs.length; i++) if (cs[i].url.indexOf('worker.html') >= 0) return cs[i].focus();
    return self.clients.openWindow('worker.html');
  }));
});
