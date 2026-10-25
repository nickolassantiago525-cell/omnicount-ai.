# OmniCount AI — free prototype, iPhone Home Screen web app

## V5 detection repair

Released to the existing GitHub Pages site on October 25, 2026.
Open [OmniCount AI](https://nickolassantiago525-cell.github.io/omnicount-ai./).
The installed app keeps the same inventory storage key and record format as V4.
If an installed copy still shows V4, open it while online, close it, then reopen it
to let the new service worker and app assets activate. Do not clear website data
to update: clearing website data can erase saved inventory.

The original fixed-class COCO detector remains available under **General objects**.
It is no longer used as a stand-in for bread rack recognition.

- **Bread racks** and **Bread trays** now use OWL-ViT open-vocabulary detection with explicit text queries. The model runs locally in a dedicated Web Worker; photos are not sent to a server. First setup downloads a large model from Hugging Face and the Transformers.js runtime from jsDelivr, and may not fit or run acceptably on older phones.
- Rack/tray mode scans a selected photo or an explicit camera snapshot instead of pretending to provide fast live tracking.
- Overlapping predictions for different descriptions of the same object are suppressed. Adjustable model-score filtering, numbered boxes, tap-to-exclude and tap-to-mark corrections support visual review. Scores are model outputs, not measured reliability.
- Rack counts cannot be applied to inventory quantities. Tray estimates can only be applied to an item that supports Tray, after confirmation of the item and full-tray count. The model does not determine tray fullness or bun type.
- Each new image or target clears stale estimates. Failed or superseded scans do not apply counts. General live mode retains freeze/resume and editable estimates.
- Inventory conversions, the existing local-storage key and JSON backup compatibility are preserved. Saving in a browser that denies storage explicitly warns that data is only in memory.
- The service worker caches the additional app files and only removes older OmniCount caches. Model caching is managed separately by Transformers.js, and must be tested on each device. Manual inventory remains usable without AI.

### Verification and remaining limitations

Run `node --test tests/*.test.cjs` for detection normalization and suppression tests.
Browser integration checks cover photo review, inventory calculations, corrections,
unit safety, backup/restore and model/network failures.

Real WASM model inference was tested in desktop Chromium on one public product
photo containing a metal bakery rack, a two-rack composite made from that same
photo, and a negative astronaut photo. At the default rack model-score threshold of
0.05, the results were 1 rack, 2 racks and 0 racks respectively. These are smoke
tests, not a benchmark or proof of performance on the user's racks. Plastic
stacked bread crates, busy storage rooms, occlusion, partial trays and physical
iPhone performance remain unverified. No automatic color-to-bun-type mapping is
claimed. Photos of the actual racks and trays are needed for representative testing.
An orange plastic tray product photo returned one tray at the tray profile's
default score threshold of 0.03; lowering the threshold increases false-positive risk.

Model documentation and examples:
[OWL-ViT model](https://huggingface.co/Xenova/owlvit-base-patch32) and
[Transformers.js pipeline documentation](https://huggingface.co/docs/transformers.js/api/pipelines).
The smoke-test product image came from
[this bakery-rack product page](https://www.amazon.com/clp/B0CPBM7N5Z);
the negative image came from the
[Transformers.js documentation dataset](https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/astronaut.png).
The tray smoke test used
[this orange plastic bread tray product photo](https://eastppnw.com/products/food-grade-plastic-stackable-bakery-food-bread-crate-basket).
Test photos are not bundled into the app.

## What's included

- Daily/weekly inventory starter catalog transcribed from the supplied photos (not a complete or officially verified catalog).
- Cooler, Dry Storage, Freezer and V-Supplies filters; sheet order or alphabetical selection.
- Editable decimal quantities for cases, trays, bags, sleeves, packs, individual units, etc.; automatic conversion to appropriate BASE units (EACH only for items counted individually).
- Offline local saving and CSV export.
- Experimental COCO-SSD on-device camera recognition, continuously re-counting current frame, freeze count, plus photo mode. COCO-SSD does **not reliably recognize specific Wendy's inventory products**. It's a demonstration, not a completed inventory AI.

## Free hosting on GitHub Pages

1. Create a PUBLIC GitHub repository (public GitHub Pages hosting is free).
2. Upload all contents of this folder into the repository root. Never upload work credentials or proprietary internal documents.
3. Settings → Pages → Deploy from branch → main → /(root) → Save.
4. Visit the Pages URL using Safari on your iPhone. Share → Add to Home Screen.
5. With Wi-Fi, open the installed app once. Select **Bread racks**, **Bread trays**, or **General objects**, then tap **Prepare selected AI**. Rack/tray mode downloads the larger OWL-ViT model; General objects downloads TensorFlow.js and COCO-SSD. Reload once if necessary so the service worker controls the page, prepare the model again, then test offline on your device. Manual inventory works offline after web app assets are cached; offline model retention is not guaranteed.

## Limitations and privacy

- Requires HTTPS to access live camera (GitHub Pages provides HTTPS).
- All detector profiles are experimental and may miss inventory or return false positives. General objects uses COCO-SSD; Bread racks and Bread trays use text-guided OWL-ViT searches. Counts refer to the current photo or frame and do not track objects between frames. Camera counts must be verified and manually corrected.
- External TensorFlow.js library/model downloads occur on the first AI setup; their caching in iOS Safari is not guaranteed, and iOS may evict cached files. Do not rely on live offline AI until tested on your device.
- Data is stored in localStorage, which may be cleared; export CSV often. No server for inventory data or photo uploads in this prototype.
- Unit conversions need validation against up-to-date printed inventory forms. For weight-based inventory we display pounds, not fictional numbers of patties. Packaging quantities are editable only in the source starter catalog (catalog.js) for now.
- The app is deployed on GitHub Pages. Physical iPhone performance and actual store-rack accuracy remain unverified.

## v3 updates

- Save & next item button for faster sheet counts.
- Editable AI estimate with +/− buttons to correct generic detections before applying to EACH.
- JSON backup/restore for local records; CSV export remains available.
- Confirmation for saving zero quantities.
- Versioned service-worker cache update.
- Original offline AI limitations remain; product-specific recognition is not solved by this update.

## V4 bun counting

- Regular buns: orange full tray 6, bag 12, each 1.
- Premium buns: brown full tray 5, bag 12, each 1.
- Freezer and Dry Storage remain distinct catalog items and are displayed separately in the bun totals panel.
- For partial trays, enter their actual bun quantity as Each, not as a full Tray.
- Totals sum saved records within the selected Daily or Weekly mode. Multiple saves of the same item are additive; delete mistaken entries.
- At V4, the camera used only generic COCO-SSD. V5 adds text-guided rack/tray searches, not a store-specific trained detector. Offline AI may require a prior online load and iOS can evict caches.
