const CACHE_NAME = "posture-app-v4"; // バージョンを上げる
const urlsToCache = [
  "/posture-app/",
  "/posture-app/index.html",
  "/posture-app/manifest.json",
  "/posture-app/css/style.css",    // 追加
  "/posture-app/js/main.js",       // 追加
  "/posture-app/icon-192.png",
  "/posture-app/icon-512.png",
  "/posture-app/image_4.png"       // 背景画像もキャッシュ
];
self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", function(event){
  if(event.request.url.includes("/posture-app/")){
    event.respondWith(
      caches.match(event.request).then(response=>{
        return response || fetch(event.request);
      })
    );
  }
});