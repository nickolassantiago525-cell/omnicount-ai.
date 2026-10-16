# OmniCount AI — free prototype, iPhone Home Screen web app

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
5. With Wi-Fi, open the installed app once. For AI, tap **Prepare offline AI**, which downloads free TensorFlow.js libraries and model weights. Reload once if necessary so the service worker controls the page, tap Prepare again, then turn on Airplane Mode and test. Manual inventory works offline after web app assets are cached.

## Limitations and privacy
- Requires HTTPS to access live camera (GitHub Pages provides HTTPS).
- The AI model is generic and may fail to detect sauces, cartons, bags, stacked cases and bun trays, even when it detects boxes or people. Detection counts objects visible in the CURRENT frame, and does not track objects between frames. Camera counts must be verified and manually corrected.
- External TensorFlow.js library/model downloads occur on the first AI setup; their caching in iOS Safari is not guaranteed, and iOS may evict cached files. Do not rely on live offline AI until tested on your device.
- Data is stored in localStorage, which may be cleared; export CSV often. No server for inventory data or photo uploads in this prototype.
- Unit conversions need validation against up-to-date printed inventory forms. For weight-based inventory we display pounds, not fictional numbers of patties. Packaging quantities are editable only in the source starter catalog (catalog.js) for now.
- App is not yet deployed or tested on a physical iPhone.

## v3 updates
- Save & next item button for faster sheet counts.
- Editable AI estimate with +/− buttons to correct generic detections before applying to EACH.
- JSON backup/restore for local records; CSV export remains available.
- Confirmation for saving zero quantities.
- Versioned service-worker cache update.
- Original offline AI limitations remain; product-specific recognition is not solved by this update.
