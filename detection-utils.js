(function (root) {
  "use strict";
  const PROFILES = Object.freeze({
    racks: {
      label: "Bread rack",
      plural: "bread racks",
      prompts: ["a bread rack", "a rolling bakery rack", "a metal baking rack"],
      apply: false,
      threshold: 0.05,
    },
    trays: {
      label: "Bread tray",
      plural: "bread trays",
      prompts: [
        "a plastic bread tray",
        "an orange bread tray",
        "a brown bread tray",
      ],
      apply: true,
      threshold: 0.03,
    },
    general: {
      label: "Object",
      plural: "recognized objects",
      apply: true,
      threshold: 0.42,
    },
  });

  function iou(a, b) {
    const [x, y, w, h] = a,
      [u, v, s, t] = b;
    const intersection =
      Math.max(0, Math.min(x + w, u + s) - Math.max(x, u)) *
      Math.max(0, Math.min(y + h, v + t) - Math.max(y, v));
    const union = w * h + s * t - intersection;
    return union > 0 ? intersection / union : 0;
  }

  function normalize(predictions, width, height, profile, threshold = 0.1) {
    const config = PROFILES[profile];
    if (!config || !Array.isArray(predictions) || width <= 0 || height <= 0)
      return [];
    const candidates = predictions
      .flatMap((p) => {
        const box =
          p.box ||
          (p.bbox && {
            xmin: p.bbox[0],
            ymin: p.bbox[1],
            xmax: p.bbox[0] + p.bbox[2],
            ymax: p.bbox[1] + p.bbox[3],
          });
        if (
          !box ||
          ![box.xmin, box.ymin, box.xmax, box.ymax, p.score].every(
            Number.isFinite,
          ) ||
          p.score < threshold ||
          p.score > 1
        )
          return [];
        const x = Math.max(0, Math.min(width, box.xmin));
        const y = Math.max(0, Math.min(height, box.ymin));
        const xmax = Math.max(0, Math.min(width, box.xmax));
        const ymax = Math.max(0, Math.min(height, box.ymax));
        if (xmax <= x || ymax <= y) return [];
        return [
          {
            bbox: [x, y, xmax - x, ymax - y],
            class:
              profile === "general"
                ? p.class || p.label || "Object"
                : config.label,
            score: p.score,
          },
        ];
      })
      .sort((a, b) => b.score - a.score);
    const kept = [];
    for (const p of candidates) {
      if (!kept.some((q) => p.class === q.class && iou(p.bbox, q.bbox) > 0.45))
        kept.push(p);
    }
    return kept.slice(0, 100);
  }

  const api = { PROFILES, iou, normalize };
  root.OmniDetection = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
