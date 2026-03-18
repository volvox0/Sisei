const CACHE_NAME = "posture-app-v5";
const urlsToCache = [
  "/Sisei/",
  "/Sisei/index.html",
  "/Sisei/manifest.json",
  "/Sisei/style.css",
  "/Sisei/main.js",
  "/Sisei/icon-192.png",
  "/Sisei/icon-512.png",
  "/Sisei/Image%20image_4.png"
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
