const VERSION = "omnicount-v5-racks-20261025";
const ASSETS = [
  "./",
  "./index.html",
  "./catalog.js",
  "./storage.js",
  "./app.js",
  "./camera.js",
  "./detection-utils.js",
  "./rack-worker.js",
  "./manifest.webmanifest",
  "./icon.png",
];
self.addEventListener("install", (e) =>
  e.waitUntil(
    caches
      .open(VERSION)
      .then((c) => c.addAll(ASSETS))
      .then(() => self.skipWaiting()),
  ),
);
self.addEventListener("activate", (e) =>
  e.waitUntil(
    caches
      .keys()
      .then((ks) =>
        Promise.all(
          ks
            .filter((k) => k.startsWith("omnicount-v") && k !== VERSION)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  ),
);
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  // Transformers.js manages its own model cache. Do not duplicate model weights
  // or take ownership of other apps' files on a shared preview origin.
  const url = new URL(e.request.url);
  const isApp =
    url.origin === self.location.origin &&
    url.href.startsWith(self.registration.scope);
  const isGeneralLibrary =
    url.origin === "https://cdn.jsdelivr.net" &&
    (url.pathname.startsWith("/npm/@tensorflow/tfjs@") ||
      url.pathname.startsWith("/npm/@tensorflow-models/coco-ssd@"));
  const isGeneralModel =
    url.origin === "https://storage.googleapis.com" &&
    url.pathname.startsWith("/tfjs-models/savedmodel/");
  if (!isApp && !isGeneralLibrary && !isGeneralModel) return;
  e.respondWith(
    caches.match(e.request).then(
      (hit) =>
        hit ||
        fetch(e.request).then((res) => {
          if (res.ok || res.type === "opaque") {
            const copy = res.clone();
            caches
              .open(VERSION)
              .then((c) => c.put(e.request, copy))
              .catch(() => {});
          }
          return res;
        }),
    ),
  );
});
