/* Expert service worker — raíz del sitio (junto a index.html) */
self.addEventListener("install", function () {
  self.skipWaiting();
});
self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});

importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyAsYsXARi9G1NXGI3RXmoe19yYuzSVaoKY",
  authDomain: "taller-fc741.firebaseapp.com",
  projectId: "taller-fc741",
  storageBucket: "taller-fc741.firebasestorage.app",
  messagingSenderId: "832448264902",
  appId: "1:832448264902:web:d434c241dae0b0e18775c7",
});

var ICON = "https://pushtaller.vercel.app/icon-192.png";
var BADGE = "https://pushtaller.vercel.app/badge-72.png";

try {
  var messaging = firebase.messaging();
  // App en segundo plano / cerrada: mostrar aviso del sistema
  messaging.onBackgroundMessage(function (payload) {
    payload = payload || {};
    var n = payload.notification || {};
    var d = payload.data || {};
    var title = n.title || d.title || "Expert";
    var body = n.body || d.body || "";
    if (!title && !body) return;
    var tag = d.tag || "expert-push";
    return self.registration.showNotification(title, {
      body: body,
      icon: n.icon || d.icon || ICON,
      badge: n.badge || d.badge || BADGE,
      tag: tag,
      renotify: true,
      data: d,
    });
  });
} catch (e) {
  console.warn("FCM SW:", e);
}

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        if ("focus" in list[i]) return list[i].focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("./");
    })
  );
});
