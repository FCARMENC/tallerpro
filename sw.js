// sw.js — Service Worker de Expert
// Colócalo en la RAÍZ del sitio (junto a index.html), no en /api.
// Sin este archivo bien configurado, los avisos solo llegan con la app abierta.

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
    var n = (payload && payload.notification) || {};
    var title = n.title || "Expert";
    var body = n.body || "";
    var icon = n.icon || "https://pushtaller.vercel.app/icon-192.png";
    var badge = n.badge || "https://pushtaller.vercel.app/badge-72.png";
    var tag = (payload.data && payload.data.tag) || ("expert-" + Date.now());
    return self.registration.showNotification(title, {
      body: body,
      icon: icon,
      badge: badge,
      tag: tag,
      data: (payload && payload.data) || {},
      renotify: true,
    });
  });
} catch (e) {
  console.warn("FCM background:", e);
}

// Respaldo si el push llega como evento genérico
self.addEventListener("push", function (event) {
  if (!event.data) return;
  var data = {};
  try {
    data = event.data.json();
  } catch (err) {
    data = { notification: { title: "Expert", body: event.data.text() } };
  }
  // Si onBackgroundMessage ya lo mostró, a veces llega también aquí;
  // usamos tag fijo del payload para no duplicar de forma agresiva.
  var n = data.notification || {};
  var title = n.title || "Expert";
  var body = n.body || "";
  if (!title && !body) return;
  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: n.icon || "https://pushtaller.vercel.app/icon-192.png",
      badge: n.badge || "https://pushtaller.vercel.app/badge-72.png",
      tag: (data.data && data.data.tag) || "expert-push",
      data: data.data || {},
      renotify: true,
    })
  );
});

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
