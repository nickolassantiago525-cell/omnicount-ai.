// Dedicated worker keeps large-model setup and inference off the inventory UI.
import {
  pipeline,
  env,
  RawImage,
} from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2/dist/transformers.min.js";

env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1;
let detectorPromise;

self.onmessage = async ({ data }) => {
  const { id, kind, prompts, width, height, pixels } = data;
  try {
    if (!detectorPromise) {
      detectorPromise = pipeline(
        "zero-shot-object-detection",
        "Xenova/owlvit-base-patch32",
        {
          device: "wasm",
          dtype: "q8",
          progress_callback: (progress) => {
            self.postMessage({ kind: "progress", progress });
          },
        },
      ).catch((error) => {
        detectorPromise = null;
        throw error;
      });
    }
    const detector = await detectorPromise;
    if (kind === "prepare") {
      self.postMessage({ id, kind: "ready" });
      return;
    }
    const image = new RawImage(new Uint8ClampedArray(pixels), width, height, 4);
    // Filtering and cross-prompt suppression happen in detection-utils.js.
    const predictions = await detector(image, prompts, { threshold: 0.01 });
    self.postMessage({ id, kind: "result", predictions });
  } catch (error) {
    self.postMessage({
      id,
      kind: "error",
      message: error.message || String(error),
    });
  }
};
