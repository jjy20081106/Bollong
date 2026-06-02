const CACHE_NAME = "yongwon-mobile-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.svg",
  "./icon-512.svg",
  "./src/core/tileset.js",
  "./src/core/tilemap.js",
  "./src/core/collision.js",
  "./src/core/player.js",
  "./src/maps/map_school_front.js",
  "./src/systems/npc.js",
  "./src/systems/quest.js",
  "./src/systems/monster.js",
  "./src/systems/combat.js",
  "./src/systems/scene_manager.js",
  "./src/main.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
