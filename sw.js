/* ---------------------------------- SERVICE WORKER DE EXPERT TALLER ----------------------------------
 * Hace dos cosas:
 *   1. Guarda una copia de la app (index.html + librerías) para que abra aunque no haya internet.
 *   2. Recibe los avisos push de Firebase incluso con la app cerrada (reemplaza al antiguo
 *      firebase-messaging-sw.js: ya no hace falta ese archivo aparte, todo vive aquí).
 *
 * Cuando cambies de versión las librerías de abajo (React, jsPDF, Firebase, etc.) o quieras forzar
 * que todos los dispositivos bajen la app de nuevo, sube este número. Si solo editas index.html no
 * hace falta tocar esto: la estrategia "red primero" de más abajo ya trae la versión nueva sola.
 */
const CACHE_VERSION = "v2";
const CACHE_NAME = "expert-taller-" + CACHE_VERSION;

// Todo lo necesario para que la app cargue sin conexión.
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-180.png",
  "https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500&display=swap",
  "https://unpkg.com/react@18/umd/react.production.min.js",
  "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js",
  "https://cdn.tailwindcss.com",
  "https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js",
  "https://unpkg.com/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.js",
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js",
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js",
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        APP_SHELL.map((url) =>
          cache.add(url).catch((err) => {
            // Si un recurso puntual falla al cachear (ej. sin internet en ese instante), no
            // rompemos la instalación entera; el resto de la app igual queda disponible offline.
            console.warn("[sw] no se pudo cachear:", url, err);
          })
        )
      )
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // El documento principal: intenta la red primero (así siempre ves la última versión publicada
  // cuando hay internet) y si falla (sin conexión), sirve la copia guardada.
  // OJO: { cache: "no-store" } es clave aquí — sin esto, este mismo fetch() puede devolver una
  // copia guardada por el caché HTTP normal del navegador (no el de este Service Worker), que es
  // justamente lo que hacía que la app se viera desactualizada aunque la estrategia ya fuera
  // "red primero" en el papel.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req, { cache: "no-store" })
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match("./index.html")))
    );
    return;
  }

  // Librerías, fuentes e íconos: sirve la copia guardada al instante si existe (para que la app
  // abra rápido y sin depender de la red), y de paso la refresca en segundo plano.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && (res.status === 200 || res.type === "opaque")) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

/* ---------------------------------- AVISOS PUSH EN SEGUNDO PLANO ---------------------------------- */
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

const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || "Expert Taller";
  const options = {
    body: payload.notification && payload.notification.body,
    icon: "./icon-192.png",
    data: payload.data || {},
  };
  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientsArr) => {
      if (clientsArr.length > 0)
        return clientsArr[0].focus();
      return self.clients.openWindow("./");
    })
  );
});
