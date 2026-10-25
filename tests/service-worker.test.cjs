const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");

function harness(failAsset = "") {
  const events = {},
    requested = [],
    stored = [];
  let skipped = false;
  vm.runInNewContext(fs.readFileSync(require.resolve("../sw.js"), "utf8"), {
    URL,
    self: {
      registration: { scope: "https://example.test/omnicount-ai./" },
      location: { origin: "https://example.test" },
      addEventListener: (name, handler) => {
        events[name] = handler;
      },
      skipWaiting: async () => {
        skipped = true;
      },
      clients: { claim: async () => {} },
    },
    caches: { open: async () => ({ put: async (url) => stored.push(url) }) },
    fetch: async (url, options) => {
      requested.push({ url, options });
      return { ok: !url.includes(failAsset || "\u0000"), status: 503 };
    },
  });
  return { events, requested, stored, skipped: () => skipped };
}

test("precache bypasses stale HTTP entries and stores canonical asset URLs", async () => {
  const h = harness();
  let installation;
  h.events.install({
    waitUntil: (promise) => {
      installation = promise;
    },
  });
  await installation;
  assert.equal(h.requested.length, 10);
  assert.equal(h.stored.length, 10);
  assert.ok(
    h.requested.every(
      (r) =>
        r.options.cache === "reload" &&
        new URL(r.url).searchParams.get("__ocv") ===
          "omnicount-v5-racks-20261025-2",
    ),
  );
  assert.ok(h.stored.every((url) => !new URL(url).search));
  assert.ok(h.stored.includes("https://example.test/omnicount-ai./"));
  assert.ok(h.stored.includes("https://example.test/omnicount-ai./storage.js"));
  assert.equal(h.skipped(), true);
});

test("failed asset prevents activation rather than claiming a partial update", async () => {
  const h = harness("camera.js");
  let installation;
  h.events.install({
    waitUntil: (promise) => {
      installation = promise;
    },
  });
  await assert.rejects(installation, /Cannot cache/);
  assert.equal(h.skipped(), false);
});
