const test = require("node:test");
const assert = require("node:assert/strict");
const { normalize, iou, PROFILES } = require("../detection-utils.js");

test("cross-prompt overlapping rack boxes are counted once", () => {
  const result = normalize(
    [
      {
        score: 0.9,
        label: "a bread rack",
        box: { xmin: 10, ymin: 10, xmax: 110, ymax: 210 },
      },
      {
        score: 0.8,
        label: "a rolling bakery rack",
        box: { xmin: 11, ymin: 12, xmax: 112, ymax: 211 },
      },
      {
        score: 0.7,
        label: "a bread rack",
        box: { xmin: 220, ymin: 10, xmax: 320, ymax: 210 },
      },
    ],
    400,
    300,
    "racks",
    0.1,
  );
  assert.equal(result.length, 2);
  assert.equal(result[0].class, "Bread rack");
});
test("clips boxes and rejects invalid predictions", () => {
  const result = normalize(
    [
      { score: 0.8, box: { xmin: -20, ymin: -30, xmax: 700, ymax: 600 } },
      { score: 0.8, box: { xmin: 20, ymin: 30, xmax: 10, ymax: 60 } },
      { score: NaN, bbox: [10, 10, 40, 50] },
      { score: 0.8, bbox: [10, 10, Infinity, 50] },
      { score: 1.5, bbox: [10, 10, 20, 50] },
    ],
    400,
    300,
    "trays",
    0.1,
  );
  assert.deepEqual(
    result.map((p) => p.bbox),
    [[0, 0, 400, 300]],
  );
});
test("threshold is applied and empty/invalid inputs are safe", () => {
  assert.equal(
    normalize([{ score: 0.08, bbox: [10, 10, 20, 30] }], 100, 100, "racks", 0.1)
      .length,
    0,
  );
  assert.equal(
    normalize(
      [{ score: 0.08, bbox: [10, 10, 20, 30] }],
      100,
      100,
      "racks",
      0.05,
    ).length,
    1,
  );
  assert.deepEqual(normalize(null, 100, 100, "racks"), []);
  assert.deepEqual(normalize([], 100, 100, "unknown"), []);
  assert.deepEqual(normalize([], 0, 100, "racks"), []);
});
test("generic classes are not relabeled as racks", () => {
  const result = normalize(
    [
      { score: 0.8, class: "person", bbox: [1, 1, 30, 40] },
      { score: 0.7, class: "chair", bbox: [1, 1, 30, 40] },
      { score: 0.6, class: "person", bbox: [2, 1, 30, 40] },
    ],
    100,
    100,
    "general",
    0.42,
  );
  assert.deepEqual(
    result.map((p) => p.class),
    ["person", "chair"],
  );
});
test("intersection-over-union and inventory application contract", () => {
  assert.equal(iou([0, 0, 10, 10], [0, 0, 10, 10]), 1);
  assert.equal(iou([0, 0, 10, 10], [20, 20, 10, 10]), 0);
  assert.equal(iou([0, 0, 0, 0], [0, 0, 0, 0]), 0);
  assert.equal(PROFILES.racks.apply, false);
  assert.equal(PROFILES.trays.apply, true);
});
