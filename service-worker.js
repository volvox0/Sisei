const CACHE_NAME = "posture-app-v6";
const urlsToCache = [
  "/Sisei/",
  "/Sisei/index.html",
  "/Sisei/manifest.json",
  "/Sisei/style.css",
  "/Sisei/main.js",
  "/Sisei/icon-192.png",
  "/Sisei/icon-512.png",
  "/Sisei/background.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
