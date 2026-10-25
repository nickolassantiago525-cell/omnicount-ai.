const VERSION = "omnicount-v5-racks-20261025-2";
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
self.addEventListener("install", (e) => {
  e.waitUntil(
    (async () => {
      const cache = await caches.open(VERSION);
      await Promise.all(
        ASSETS.map(async (asset) => {
          const canonical = new URL(asset, self.registration.scope);
          const fresh = new URL(canonical);
          fresh.searchParams.set("__ocv", VERSION);
          // Bypass both old browser HTTP entries and stale CDN variants. Store under
          // the canonical URL so normal offline navigations and imports still match.
          const response = await fetch(fresh.href, { cache: "reload" });
          if (!response.ok)
            throw Error(`Cannot cache ${asset}: ${response.status}`);
          await cache.put(canonical.href, response);
        }),
      );
      await self.skipWaiting();
    })(),
  );
});
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
