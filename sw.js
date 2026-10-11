// sw.js — Service Worker de Expert (raíz del sitio, junto a index.html)
// Evita notificaciones duplicadas: FCM ya muestra el aviso si el payload
// trae "notification"; no volvemos a llamar showNotification en ese caso.

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

  // Solo mostramos nosotros el aviso si el servidor envió DATA-ONLY
  // (sin campo notification). Si ya viene "notification", el navegador
  // lo muestra solo y NO debemos volver a mostrarlo (evita el doble aviso).
  messaging.onBackgroundMessage(function (payload) {
    if (!payload) return;
    if (payload.notification) {
      // El sistema ya lo mostró. Solo avisamos a pestañas abiertas.
      try {
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
          list.forEach(function (client) {
            client.postMessage({ type: "EXPERT_PUSH", payload: payload });
          });
        });
      } catch (e) {}
      return;
    }
    var data = payload.data || {};
    var title = data.title || "Expert";
    var body = data.body || "";
    if (!title && !body) return;
    return self.registration.showNotification(title, {
      body: body,
      icon: data.icon || "https://pushtaller.vercel.app/icon-192.png",
      badge: data.badge || "https://pushtaller.vercel.app/badge-72.png",
      tag: data.tag || "expert-push",
      data: data,
      renotify: false,
    });
  });
} catch (e) {
  console.warn("FCM background:", e);
}

// NO escuchamos el evento "push" genérico: Firebase Messaging ya lo maneja.
// Tener push + onBackgroundMessage era la causa del aviso DUPLICADO.

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
