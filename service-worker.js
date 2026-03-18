const CACHE_NAME = "posture-app-v8"; // バージョンアップ
const urlsToCache = [
  "/Sisei/",
  "/Sisei/index.html",
  "/Sisei/manifest.json",
  "/Sisei/style.css",
  "/Sisei/main.js",
  "/Sisei/icon-192.png",
  "/Sisei/icon-512.png",
  "/Sisei/background.png",
  "/Sisei/alert.mp3" // 音源を追加
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
