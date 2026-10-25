"use strict";
const $ = (id) => document.getElementById(id);
let mode = "daily",
  order = "paper",
  current = null;
const KEY = "omnicount-inventory-v2";
const loadSaved = () => {
  try {
    return JSON.parse(window.InventoryStore.get(KEY) || "[]");
  } catch {
    return [];
  }
};
let records = loadSaved();
function baseUnit(item) {
  const a = Object.keys(item.units);
  return (
    [
      "Each",
      "Slice",
      "Sheet",
      "Lbs",
      "Gallon",
      "Pouch",
      "Bag",
      "Bottle",
      "Cartridge",
      "Jug",
      "Tub",
      "Carton",
      "Batch",
      "Packet",
    ].find((x) => a.includes(x) && item.units[x] === 1) || a[a.length - 1]
  );
}
function currentValues() {
  const o = {};
  document
    .querySelectorAll("#countGrid input")
    .forEach((i) => (o[i.dataset.unit] = Number(i.value) || 0));
  return o;
}
function calc() {
  if (!current) return;
  const counts = currentValues();
  let total = 0;
  for (const [unit, n] of Object.entries(counts))
    total += n * current.units[unit];
  const base = baseUnit(current);
  $("total").textContent =
    `Total: ${Number(total.toFixed(3))} ${base === "Each" ? "EACH" : base}`;
  $("unitHint").textContent = isBun(current)
    ? "Full trays + full bags + loose buns from partial trays. Do not count the same buns twice."
    : `Conversion total in ${base}; partial packs can be entered as decimals.`;
  return { counts, total, base };
}
function isBun(x) {
  return (
    !!x &&
    ["Bun - Regular", "Bun - Premium"].includes(x.name) &&
    ["Freezer", "Dry Storage"].includes(x.location)
  );
}
function renderBunTotals() {
  const target = $("bunTotals");
  if (!target) return;
  target.replaceChildren();
  for (const loc of ["Freezer", "Dry Storage"]) {
    const heading = document.createElement("strong");
    heading.textContent = loc;
    target.append(heading);
    for (const name of ["Bun - Regular", "Bun - Premium"]) {
      const total = records
        .filter((r) => r.mode === mode && r.location === loc && r.name === name)
        .reduce((sum, r) => sum + Number(r.total || 0), 0);
      const row = document.createElement("p");
      row.textContent =
        name.replace("Bun - ", "") + ": " + Number(total.toFixed(2)) + " EACH";
      target.append(row);
    }
  }
}
function chooseItem() {
  const id = $("item").value;
  current = CATALOG.find((x) => x.id === id) || null;
  const grid = $("countGrid");
  grid.replaceChildren();
  if (typeof window.updateCameraUnits === "function")
    window.updateCameraUnits();
  if (!current) {
    $("unitNote").textContent = "No items match this filter.";
    $("total").textContent = "Total: 0";
    $("unitHint").textContent = "";
    $("bunHelp").hidden = true;
    $("bunPanel").hidden = true;
    return;
  }
  let unitText = [];
  for (const [unit, ratio] of Object.entries(current.units)) {
    const title = document.createElement("label");
    title.textContent = unit;
    const input = document.createElement("input");
    input.type = "number";
    input.inputMode = "decimal";
    input.min = "0";
    input.step = "any";
    input.value = "";
    input.dataset.unit = unit;
    input.setAttribute("aria-label", `${unit} quantity`);
    input.addEventListener("input", calc);
    const factor = document.createElement("small");
    factor.textContent = "× " + ratio;
    grid.append(title, input, factor);
    unitText.push(`${unit}: ${ratio}`);
  }
  $("unitNote").textContent = current.name + " · " + current.location;
  $("bunHelp").hidden = !isBun(current);
  $("bunPanel").hidden = !isBun(current);
  calc();
  renderBunTotals();
}
function listItems() {
  const area = $("location").value,
    q = $("search").value.toLowerCase();
  let data = CATALOG.filter(
    (x) =>
      (area === "all" || x.location === area) &&
      x.name.toLowerCase().includes(q),
  );
  if (mode === "daily") {
    const dailyNames = [
      "Chicken - Diced",
      "Sauce - Cheese Frz",
      "Gold Chili Base",
      "Gold Chili Meat 5.25 Lb",
      "Sausage - Square",
      "Eggs - Whole Shell",
      "Beef Sm Patty",
      "Beef 4 oz Patty",
      "Bacon - Roasted",
      "Bun - Premium",
      "Bun - Regular",
      "Biscuit",
      "Croissant Square Brk",
      "Chicken - Breakfast & Crispy",
      "Chicken - Classic",
      "Chicken - Spicy",
      "Chicken Nuggets",
      "Chicken Nuggets Spicy",
      "Chicken - Tenders",
      "Potato Fry (French Fries)",
      "Potatoes - Brkf Half-Moon",
    ];
    data = data.filter((x) => dailyNames.includes(x.name));
  }
  if (order === "custom") data.sort((a, b) => a.name.localeCompare(b.name));
  const before = $("item").value;
  $("item").replaceChildren();
  for (const x of data) {
    const op = document.createElement("option");
    op.value = x.id;
    op.textContent = `${x.location} · ${x.name}`;
    $("item").append(op);
  }
  if (data.some((x) => x.id === before)) $("item").value = before;
  chooseItem();
}
function setMode(x) {
  mode = x;
  $("daily").className = x === "daily" ? "selected" : "alt";
  $("weekly").className = x === "weekly" ? "selected" : "alt";
  listItems();
  renderBunTotals();
}
function setOrder(x) {
  order = x;
  $("paper").className = x === "paper" ? "selected" : "alt";
  $("custom").className = x === "custom" ? "selected" : "alt";
  listItems();
}
$("daily").onclick = () => setMode("daily");
$("weekly").onclick = () => setMode("weekly");
$("paper").onclick = () => setOrder("paper");
$("custom").onclick = () => setOrder("custom");
$("location").onchange = listItems;
$("search").oninput = listItems;
$("item").onchange = chooseItem;
$("reset").onclick = () => {
  document.querySelectorAll("#countGrid input").forEach((x) => (x.value = ""));
  calc();
};
function renderRecords() {
  const node = $("records");
  node.replaceChildren();
  if (!records.length) {
    node.textContent = "No saved counts yet.";
    return;
  }
  for (const r of records.slice(0, 120)) {
    const a = document.createElement("article"),
      t = document.createElement("div");
    t.textContent = `${r.name} · ${r.location} · ${Number(r.total.toFixed(3))} ${r.base === "Each" ? "EACH" : r.base}`;
    const info = document.createElement("small");
    info.textContent = `${r.date} · ${r.mode} · ${Object.entries(r.counts)
      .filter(([, n]) => n)
      .map(([u, n]) => `${n} ${u}`)
      .join(", ")}`;
    const del = document.createElement("button");
    del.className = "alt";
    del.style.padding = "6px 10px";
    del.textContent = "Delete";
    del.onclick = () => {
      records = records.filter((z) => z.id !== r.id);
      persist();
    };
    a.append(t, info, document.createElement("br"), del);
    node.append(a);
  }
}
function persist() {
  let saved = true;
  try {
    window.InventoryStore.set(KEY, JSON.stringify(records));
  } catch (e) {
    saved = false;
    $("status").textContent =
      "Saved in memory only; storage is unavailable. Export a backup before closing this page.";
  }
  renderRecords();
  renderBunTotals();
  return saved;
}
function saveCurrent() {
  if (!current) return false;
  const r = calc();
  if (!Object.values(r.counts).some((v) => v > 0)) {
    if (!confirm("All quantities are zero. Save a zero count for this item?"))
      return false;
  }
  records.unshift({
    ...r,
    id: Date.now().toString() + Math.random(),
    name: current.name,
    location: current.location,
    mode,
    date: new Date().toLocaleString(),
  });
  if (persist()) $("status").textContent = "Saved " + current.name + ".";
  return true;
}
$("save").onclick = saveCurrent;
$("next").onclick = () => {
  if (!saveCurrent()) return;
  const sel = $("item");
  if (sel.selectedIndex < sel.options.length - 1) {
    sel.selectedIndex++;
    chooseItem();
    $("item").scrollIntoView({ behavior: "smooth", block: "center" });
  } else {
    $("status").textContent =
      "Saved. You reached the last item in this filter.";
  }
};
function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const u = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = u;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 5000);
}
$("backup").onclick = () =>
  downloadFile(
    "omnicount-backup-" + new Date().toISOString().slice(0, 10) + ".json",
    JSON.stringify(
      {
        app: "OmniCount",
        version: 5,
        created: new Date().toISOString(),
        records,
      },
      null,
      2,
    ),
    "application/json",
  );
$("restore").onchange = async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  try {
    if (f.size > 10_000_000) throw Error("Backup exceeds 10 MB");
    const data = JSON.parse(await f.text());
    if (
      data.app !== "OmniCount" ||
      !Array.isArray(data.records) ||
      !data.records.every(
        (r) =>
          r &&
          typeof r.id === "string" &&
          typeof r.name === "string" &&
          typeof r.total === "number" &&
          Number.isFinite(r.total) &&
          typeof r.counts === "object" &&
          r.counts !== null &&
          !Array.isArray(r.counts),
      )
    )
      throw Error("Not a valid OmniCount backup");
    if (
      !confirm(
        `Restore ${data.records.length} records? This replaces current saved records. Export a backup of current data first.`,
      )
    )
      return;
    records = data.records;
    if (persist())
      $("status").textContent =
        "Restored " + records.length + " inventory records.";
  } catch (err) {
    alert("Restore failed: " + err.message);
  } finally {
    e.target.value = "";
  }
};
$("remove").onclick = () => {
  if (confirm("Delete all locally saved inventory records?")) {
    records = [];
    persist();
  }
};
function csv(s) {
  return '"' + String(s).replaceAll('"', '""') + '"';
}
$("export").onclick = () => {
  const rows = [
    ["Date", "Mode", "Location", "Product", "Counts", "Total", "Base unit"],
    ...records.map((r) => [
      r.date,
      r.mode,
      r.location,
      r.name,
      Object.entries(r.counts)
        .map(([k, v]) => `${v} ${k}`)
        .join("; "),
      r.total,
      r.base,
    ]),
  ];
  const blob = new Blob([rows.map((r) => r.map(csv).join(",")).join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  const u = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = u;
  a.download = "omnicount-inventory.csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 2000);
};
try {
  if ("serviceWorker" in navigator)
    navigator.serviceWorker.register("./sw.js").catch(() => {});
} catch {
  // Sandboxed previews can throw even when reading navigator.serviceWorker.
  // Offline installation is optional; never block inventory initialization.
}
listItems();
renderRecords();
renderBunTotals();
