// Preserve the installed app's existing storage key and record format.
// The private hosted preview substitutes an in-memory-only adapter.
window.InventoryStore = {
  get(key) {
    return localStorage.getItem(key);
  },
  set(key, value) {
    localStorage.setItem(key, value);
  },
};
