// sw.js — Service Worker Expert (RAÍZ del sitio, junto a index.html)
// Método fiable: SIEMPRE mostramos nosotros el aviso en segundo plano.
// Usamos "tag" fijo para que un posible duplicado REEMPLACE al anterior.

self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});

importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAsYsXARi9G1NXGI3RXmoe19yYuzSVaoKY",
  authDomain: "taller-fc741.firebaseapp.com",
  projectId: "taller-fc741",
  storageBucket: "taller-fc741.firebasestorage.app",
  messagingSenderId: "832448264902",
  appId: "1:832448264902:web:d434c241dae0b0e18775c7",
});

try {
  var messaging = firebase.messaging();

  messaging.onBackgroundMessage(function (payload) {
    if (!payload) return;
    var n = payload.notification || {};
    var d = payload.data || {};
    var title = n.title || d.title || "Expert";
    var body = n.body || d.body || "";
    if (!title && !body) return;

    // tag estable: si FCM y el SW intentan mostrar lo mismo, se reemplaza (no se duplica)
    var tag = d.tag || n.tag || "expert-" + (title + body).slice(0, 40);

    return self.registration.showNotification(title, {
      body: body,
      icon: n.icon || d.icon || "https://pushtaller.vercel.app/icon-192.png",
      badge: n.badge || d.badge || "https://pushtaller.vercel.app/badge-72.png",
      tag: tag,
      renotify: false,
      data: d,
    });
  });
} catch (e) {
  console.warn("FCM background:", e);
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
