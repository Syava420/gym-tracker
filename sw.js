// Service Worker для поддержки оффлайн-работы и полноценной PWA-установки на Android и iOS

const CACHE_NAME = "hyper-mass-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  "./icon.svg",
  "./styles/main.css",
  "./styles/phone-frame.css",
  "./styles/views.css",
  "./js/workouts-data.js",
  "./js/calendar.js",
  "./js/storage.js",
  "./js/timer.js",
  "./js/stopwatch-modal.js",
  "./js/modals.js",
  "./js/manual-workout-modal.js",
  "./js/export-helper.js",
  "./js/settings-view.js",
  "./js/exercises-view.js",
  "./js/home-view.js",
  "./js/cardio-helper.js",
  "./js/workout-view.js",
  "./js/history-view.js",
  "./js/app.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch((err) => {
        console.warn("ServiceWorker pre-cache warning:", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Network first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
