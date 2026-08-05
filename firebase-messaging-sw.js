/*
 * ---------------------------------- AVISOS PUSH (Firebase Cloud Messaging) ----------------------------------
 * Este archivo debe subirse en la MISMA carpeta que tu index.html (raíz del sitio), con este mismo
 * nombre exacto: firebase-messaging-sw.js. El propio Expert lo registra solo (ver ensurePushToken en
 * el archivo principal) apenas activas los avisos push desde Ajustes → Usuarios y roles.
 *
 * Qué hace: cuando llega un push y Expert está cerrado o en segundo plano, este service worker
 * muestra la notificación del sistema (como cualquier app nativa). Si Expert está abierto y
 * visible, el aviso lo maneja directamente la pestaña (campanita de notificaciones).
 */
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// Debe ser EXACTAMENTE el mismo objeto FIREBASE_CONFIG que tienes en tu index.html.
firebase.initializeApp({
  apiKey: "AIzaSyAsYsXARi9G1NXGI3RXmoe19yYuzSVaoKY",
  authDomain: "taller-fc741.firebaseapp.com",
  projectId: "taller-fc741",
  storageBucket: "taller-fc741.firebasestorage.app",
  messagingSenderId: "832448264902",
  appId: "1:832448264902:web:d434c241dae0b0e18775c7",
});

const messaging = firebase.messaging();

// Se dispara cuando llega un push y la pestaña/PWA de Expert NO está en primer plano.
messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || "Expert Taller";
  const body = (payload.notification && payload.notification.body) || "";
  const proformaId = (payload.data && payload.data.proformaId) || "";
  self.registration.showNotification(title, {
    body,
    icon: "icon-192.png",
    badge: "icon-192.png",
    tag: proformaId ? `proforma-${proformaId}` : undefined, // evita duplicar la misma notificación
    data: { proformaId },
  });
});

// Al tocar la notificación, abre Expert (o enfoca la pestaña ya abierta) para revisar la aprobación.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = self.registration.scope; // raíz de tu sitio, ej. https://tu-usuario.github.io/taller/
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const c of clientList) {
        if ("focus" in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
