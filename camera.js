(function () {
  "use strict";
  const { PROFILES, normalize } = OmniDetection;
  const canvas = $("canvas"),
    ctx = canvas.getContext("2d");
  const video = $("video"),
    frame = document.createElement("canvas");
  const frameCtx = frame.getContext("2d", { willReadFrequently: true });
  let profile = $("detector").value,
    worker,
    workerId = 0;
  const pending = new Map();
  let genericPromise,
    stream,
    timer,
    live = false,
    frozen = false,
    busy = false;
  let epoch = 0,
    raw = [],
    predictions = [],
    marks = [],
    hasFrame = false;
  let estimateTouched = false,
    hasResult = false,
    loading = false;
  let scanning = false,
    photoLoading = false;
  const setStatus = (text) => {
    $("status").textContent = text;
  };

  function workerRequest(kind, extra = {}) {
    if (!worker) {
      if (self.origin !== "null") {
        worker = new Worker("./rack-worker.js", { type: "module" });
      } else {
        // Module workers cannot start in opaque-origin preview iframes.
        // A classic blob worker can dynamically import the same module.
        // Queue requests until that import installs the real message handler.
        const moduleUrl = new URL("./rack-worker.js", document.baseURI).href;
        const source = `
          const queued = [];
          self.onmessage = event => queued.push(event);
          import(${JSON.stringify(moduleUrl)}).then(() => {
            const handler = self.onmessage;
            for (const event of queued) handler(event);
          }).catch(error => {
            const fail = event => self.postMessage({
              id: event.data.id, kind: "error", message: error.message
            });
            self.onmessage = fail;
            for (const event of queued) fail(event);
          });
        `;
        const workerUrl = URL.createObjectURL(
          new Blob([source], { type: "text/javascript" }),
        );
        worker = new Worker(workerUrl);
        worker.addEventListener(
          "message",
          () => URL.revokeObjectURL(workerUrl),
          { once: true },
        );
        worker.addEventListener("error", () => URL.revokeObjectURL(workerUrl), {
          once: true,
        });
      }
      worker.onmessage = ({ data }) => {
        if (data.kind === "progress") {
          if (profile !== "general") {
            const p = data.progress;
            setStatus(
              `Preparing rack/tray model: ${p.file || p.status || "loading"}${Number.isFinite(p.progress) ? " " + Math.round(p.progress) + "%" : ""}. Keep this page open.`,
            );
          }
          return;
        }
        const request = pending.get(data.id);
        if (!request) return;
        clearTimeout(request.timeout);
        pending.delete(data.id);
        if (data.kind === "error") request.reject(Error(data.message));
        else request.resolve(data.predictions);
      };
      worker.onerror = (event) => {
        for (const request of pending.values()) {
          clearTimeout(request.timeout);
          request.reject(
            Error(
              event.message ||
                "Rack detector could not start. Check internet and browser support.",
            ),
          );
        }
        pending.clear();
        worker.terminate();
        worker = null;
      };
    }
    return new Promise((resolve, reject) => {
      const id = ++workerId;
      const timeout = setTimeout(() => {
        // Terminate a stuck worker instead of leaving queued scans consuming memory.
        for (const request of pending.values()) {
          clearTimeout(request.timeout);
          request.reject(
            Error(
              "Detector timed out. Reconnect to Wi-Fi and try again; this model may be too large for this device.",
            ),
          );
        }
        pending.clear();
        worker?.terminate();
        worker = null;
      }, 300000);
      pending.set(id, { resolve, reject, timeout });
      try {
        worker.postMessage({ id, kind, ...extra });
      } catch (error) {
        clearTimeout(timeout);
        pending.delete(id);
        reject(error);
      }
    });
  }

  function addScript(src, ready) {
    if (ready()) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = () => {
        script.remove();
        reject(
          Error("General AI library unavailable. Connect to Wi-Fi and retry."),
        );
      };
      document.head.append(script);
    });
  }

  async function prepare(target = profile) {
    if (target !== "general") {
      await workerRequest("prepare");
      return;
    }
    if (!genericPromise)
      genericPromise = (async () => {
        await addScript(
          "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js",
          () => !!window.tf,
        );
        await addScript(
          "https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js",
          () => !!window.cocoSsd,
        );
        return window.cocoSsd.load({ base: "lite_mobilenet_v2" });
      })().catch((error) => {
        genericPromise = null;
        throw error;
      });
    return genericPromise;
  }

  function controls() {
    const general = profile === "general";
    $("scan").disabled = scanning || photoLoading || (!hasFrame && !live);
    $("start").disabled = live || loading || scanning || photoLoading;
    $("prepare").disabled = loading || scanning || photoLoading;
    $("stop").disabled = !live && !scanning && !photoLoading && !loading;
    $("freeze").disabled = !live || !general;
    $("freeze").textContent = frozen ? "Resume live count" : "Freeze count";
    $("scan").textContent = live ? "Scan current view" : "Rescan photo";
    $("typeLabel").hidden = !general;
    $("profileHelp").textContent = general
      ? "General objects: the original COCO model. Not a bread rack or tray detector. Live counts refresh; freeze before correcting."
      : `${PROFILES[profile].label} search: OWL-ViT text-guided detection on this device. The first model download is large; use Wi-Fi. Scans can be slow on phones; accuracy is experimental. Photos are not uploaded.`;
    $("rackWarning").hidden = profile !== "racks";
    $("trayWarning").hidden = profile !== "trays";
    $("apply").disabled = !hasResult || !current || profile === "racks";
    $("applyUnit").disabled = profile === "racks" || !current;
    $("mark").disabled = !hasResult;
    $("mark").setAttribute(
      "aria-pressed",
      $("mark").classList.contains("selected") ? "true" : "false",
    );
  }

  window.updateCameraUnits = function () {
    const previous = $("applyUnit").value;
    $("applyUnit").replaceChildren();
    const units =
      profile === "trays"
        ? Object.keys(current?.units || {}).filter((unit) => unit === "Tray")
        : Object.keys(current?.units || {});
    for (const unit of units) {
      const option = new Option(unit, unit);
      $("applyUnit").append(option);
    }
    if (units.includes(previous)) $("applyUnit").value = previous;
    if (!units.length)
      $("applyUnit").append(new Option("No compatible unit", ""));
    controls();
    if (!units.length) $("apply").disabled = true;
  };

  function selectedPredictions() {
    const type = $("type").value;
    return predictions.filter((p) => type === "all" || p.class === type);
  }

  function render() {
    if (!hasFrame) return;
    canvas.width = frame.width;
    canvas.height = frame.height;
    canvas.style.display = "block";
    ctx.drawImage(frame, 0, 0);
    const displayWidth = canvas.getBoundingClientRect().width || frame.width;
    const shown = selectedPredictions(),
      fontSize = Math.max((14 * frame.width) / displayWidth, frame.width / 42);
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.lineWidth = Math.max(
      (2 * frame.width) / displayWidth,
      frame.width / 240,
    );
    for (const [i, p] of [...shown, ...marks].entries()) {
      const [x, y, w, h] = p.bbox;
      ctx.strokeStyle = p.manual
        ? "#9ce9c5"
        : p.excluded
          ? "#ad9cbe"
          : "#d1b1ff";
      ctx.setLineDash(p.excluded ? [8, 6] : []);
      ctx.strokeRect(x, y, w, h);
      const label = p.manual
        ? `${i + 1} manual`
        : p.excluded
          ? "Excluded"
          : `${i + 1}: ${p.score.toFixed(2)}`;
      const textWidth = Math.min(
        frame.width,
        ctx.measureText(label).width + 12,
      );
      const labelX = Math.min(x, frame.width - textWidth);
      const labelY = Math.max(0, y - fontSize - 8);
      ctx.fillStyle = "#241b33";
      ctx.fillRect(labelX, labelY, textWidth, fontSize + 8);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(label, labelX + 6, labelY + fontSize + 1);
    }
    ctx.setLineDash([]);
    canvas.style.display = "block";
    const count = shown.filter((p) => !p.excluded).length + marks.length;
    if (hasResult) {
      $("cameraResult").textContent =
        `${count} ${profile === "general" ? ($("type").value === "all" ? "recognized objects" : $("type").value) : count === 1 ? PROFILES[profile].label.toLowerCase() : PROFILES[profile].plural} marked for review`;
      $("detectionDetail").textContent =
        count === 0
          ? "No matching detections. This is not proof the scene is empty. Try another angle, adjust sensitivity, or mark objects manually."
          : "Boxes show model scores, not verified accuracy. Tap a box to exclude it or empty space to add a missed object in correction mode.";
      if (!estimateTouched) $("estimate").value = String(count);
    }
    controls();
  }

  function refilter(preserveCorrection = false) {
    if (!hasFrame || !hasResult) return;
    predictions = normalize(
      raw,
      frame.width,
      frame.height,
      profile,
      Number($("threshold").value),
    );
    const before = $("type").value;
    $("type").replaceChildren(new Option("All recognized objects", "all"));
    for (const name of [...new Set(predictions.map((p) => p.class))].sort())
      $("type").append(new Option(name, name));
    $("type").value = [...$("type").options].some((o) => o.value === before)
      ? before
      : "all";
    if (!preserveCorrection) estimateTouched = false;
    marks = [];
    render();
  }

  function capture(source) {
    const w = source.videoWidth || source.naturalWidth || source.width;
    const h = source.videoHeight || source.naturalHeight || source.height;
    if (!w || !h)
      throw Error(
        "Image is not ready. Wait for the camera or choose a valid photo.",
      );
    // Limit memory consumption without stretching the source aspect ratio.
    const scale = Math.min(1, 1280 / Math.max(w, h));
    frame.width = Math.round(w * scale);
    frame.height = Math.round(h * scale);
    frameCtx.drawImage(source, 0, 0, frame.width, frame.height);
    hasFrame = true;
  }

  function resetResult() {
    raw = [];
    predictions = [];
    marks = [];
    estimateTouched = false;
    hasResult = false;
    $("estimate").value = "0";
    $("cameraResult").textContent = "No reviewed scan yet";
    $("detectionDetail").textContent = "";
    $("mark").classList.remove("selected");
    canvas.classList.remove("correcting");
    $("type").replaceChildren(new Option("All recognized objects", "all"));
    controls();
  }

  async function detect(source, token = epoch) {
    if (scanning) return;
    const target = profile;
    scanning = true;
    hasResult = false;
    try {
      if (source) capture(source);
      controls();
      render();
      setStatus("Preparing detector, then scanning. Keep this page open…");
      let result;
      if (target === "general") {
        const model = await prepare(target);
        if (token !== epoch) return;
        result = await model.detect(frame, 100, 0.05);
      } else {
        const pixels = frameCtx.getImageData(
          0,
          0,
          frame.width,
          frame.height,
        ).data;
        result = await workerRequest("scan", {
          width: frame.width,
          height: frame.height,
          pixels: pixels.buffer,
          prompts: PROFILES[target].prompts,
        });
      }
      if (token !== epoch) return;
      raw = result;
      hasResult = true;
      refilter(live && target === "general");
      setStatus(
        target === "racks"
          ? "Rack scan complete. Review the boxes. A rack count cannot tell you how many trays or buns it holds."
          : "Scan complete. Review every marked object and correct the count before applying.",
      );
    } catch (error) {
      if (token === epoch) {
        hasResult = false;
        $("cameraResult").textContent = "Scan failed; no count applied";
        setStatus(
          `Detection unavailable: ${error.message}. Manual inventory still works. Try a smaller photo or the General objects detector.`,
        );
      }
    } finally {
      scanning = false;
      controls();
    }
  }

  function stop(invalidate = true) {
    if (invalidate) epoch++;
    live = false;
    frozen = false;
    clearTimeout(timer);
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    video.srcObject = null;
    video.style.display = "none";
    controls();
  }

  async function cycle() {
    if (!live || frozen || profile !== "general") return;
    if (!busy && video.videoWidth) {
      busy = true;
      try {
        await detect(video);
      } finally {
        busy = false;
      }
    }
    if (live && !frozen) timer = setTimeout(cycle, 1000);
  }

  $("prepare").onclick = async () => {
    const token = epoch,
      target = profile;
    loading = true;
    controls();
    setStatus(
      "Preparing selected detector. First setup needs internet; keep this page open…",
    );
    try {
      await prepare(target);
      if (token === epoch)
        setStatus(
          "Detector ready. Choose a photo or start the camera. Offline availability must be tested on your device; browsers may evict model files.",
        );
    } catch (error) {
      if (token === epoch)
        setStatus(
          `Could not prepare AI: ${error.message}. Manual counts remain available.`,
        );
    } finally {
      loading = false;
      controls();
    }
  };

  $("detector").onchange = () => {
    stop();
    profile = $("detector").value;
    $("threshold").value = String(PROFILES[profile].threshold);
    $("thresholdValue").textContent = Number($("threshold").value).toFixed(2);
    resetResult();
    window.updateCameraUnits();
    render();
    setStatus(
      "Target changed. Rescan the photo or start the camera; previous detections were cleared.",
    );
  };

  $("start").onclick = async () => {
    stop();
    resetResult();
    const token = epoch;
    loading = true;
    controls();
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw Error("Camera requires a supported HTTPS browser.");
      const acquired = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
        audio: false,
      });
      if (token !== epoch) {
        acquired.getTracks().forEach((t) => t.stop());
        return;
      }
      stream = acquired;
      video.srcObject = stream;
      await video.play();
      if (token !== epoch) return;
      live = true;
      frozen = false;
      canvas.style.display = "none";
      video.style.display = "block";
      setStatus(
        profile === "general"
          ? "Live general detection starting…"
          : "Point at the racks or trays, then tap Scan current view. Review the still scan below the live view.",
      );
      if (profile === "general") cycle();
    } catch (error) {
      if (token === epoch) {
        stop();
        setStatus(
          `Camera unavailable: ${error.message}. You can still select a photo.`,
        );
      }
    } finally {
      loading = false;
      controls();
    }
  };
  $("stop").onclick = () => {
    stop();
    setStatus("Camera stopped. Any unfinished scan was discarded.");
  };
  $("freeze").onclick = () => {
    frozen = !frozen;
    if (frozen) clearTimeout(timer);
    else cycle();
    controls();
  };
  $("scan").onclick = () => {
    resetResult();
    detect(live ? video : null);
  };

  $("photo").onchange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = "";
    if (scanning || loading || photoLoading) {
      setStatus(
        "Wait for the current operation to finish before selecting another photo.",
      );
      return;
    }
    stop();
    resetResult();
    hasFrame = false;
    canvas.style.display = "none";
    photoLoading = true;
    controls();
    const token = epoch,
      url = URL.createObjectURL(file),
      image = new Image();
    image.crossOrigin = "anonymous";
    try {
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () =>
          reject(
            Error(
              "This photo format could not be read. Choose a JPG or PNG photo.",
            ),
          );
        image.src = url;
      });
      if (token !== epoch) return;
      capture(image);
      render();
      await detect(null, token);
    } catch (error) {
      if (token === epoch) setStatus(error.message);
    } finally {
      URL.revokeObjectURL(url);
      photoLoading = false;
      controls();
    }
  };

  $("threshold").oninput = () => {
    $("thresholdValue").textContent = Number($("threshold").value).toFixed(2);
    refilter();
  };
  $("type").onchange = () => {
    marks = [];
    estimateTouched = false;
    render();
  };
  $("mark").onclick = () => {
    if (live && profile === "general" && !frozen) {
      frozen = true;
      clearTimeout(timer);
    }
    $("mark").classList.toggle("selected");
    controls();
    canvas.classList.toggle(
      "correcting",
      $("mark").classList.contains("selected"),
    );
  };
  canvas.addEventListener("click", (event) => {
    if (!hasResult || !$("mark").classList.contains("selected")) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) * frame.width) / rect.width;
    const y = ((event.clientY - rect.top) * frame.height) / rect.height;
    const manualIndex = marks.findIndex(
      (p) =>
        Math.abs(p.bbox[0] + p.bbox[2] / 2 - x) < frame.width * 0.045 &&
        Math.abs(p.bbox[1] + p.bbox[3] / 2 - y) < frame.height * 0.045,
    );
    if (manualIndex >= 0) marks.splice(manualIndex, 1);
    else {
      const hit = selectedPredictions()
        .filter((p) => {
          const [u, v, w, h] = p.bbox;
          return x >= u && x <= u + w && y >= v && y <= v + h;
        })
        .sort((a, b) => a.bbox[2] * a.bbox[3] - b.bbox[2] * b.bbox[3])[0];
      if (hit) hit.excluded = !hit.excluded;
      else {
        const side = Math.max(16, Math.min(frame.width, frame.height) * 0.055);
        marks.push({
          bbox: [
            Math.max(0, Math.min(frame.width - side, x - side / 2)),
            Math.max(0, Math.min(frame.height - side, y - side / 2)),
            side,
            side,
          ],
          manual: true,
        });
      }
    }
    estimateTouched = false;
    render();
  });
  function correct(delta) {
    if (live && profile === "general" && !frozen) {
      frozen = true;
      clearTimeout(timer);
    }
    estimateTouched = true;
    $("estimate").value = String(
      Math.max(0, (Number($("estimate").value) || 0) + delta),
    );
    controls();
  }
  $("plus").onclick = () => correct(1);
  $("minus").onclick = () => correct(-1);
  $("estimate").oninput = () => {
    estimateTouched = true;
    if (live && profile === "general") {
      frozen = true;
      clearTimeout(timer);
      controls();
    }
  };
  $("apply").onclick = () => {
    if (profile === "racks" || !current || !hasResult) return;
    const n = Number($("estimate").value),
      unit = $("applyUnit").value;
    if (!Number.isSafeInteger(n) || n < 0) {
      alert("Enter a valid whole-number estimate.");
      return;
    }
    if (!(unit in current.units)) {
      alert("Choose a compatible unit for this item.");
      return;
    }
    if (
      !confirm(
        `Apply ${n} ${unit} to ${current.name}? Verify every object matches this item${unit === "Tray" ? " and count only FULL trays. Enter buns from partial trays separately as Each" : ""}.`,
      )
    )
      return;
    const input = [...document.querySelectorAll("#countGrid input")].find(
      (x) => x.dataset.unit === unit,
    );
    if (input) {
      input.value = String(n);
      calc();
      setStatus(
        `Reviewed camera estimate entered as ${unit}. Not saved until you tap Save this item.`,
      );
    }
  };
  window.addEventListener("pagehide", () => {
    stop();
    worker?.terminate();
    worker = null;
    for (const request of pending.values()) {
      clearTimeout(request.timeout);
      request.reject(Error("Page closed."));
    }
    pending.clear();
  });
  window.addEventListener("resize", () => {
    if (hasFrame) requestAnimationFrame(render);
  });
  window.updateCameraUnits();
})();
