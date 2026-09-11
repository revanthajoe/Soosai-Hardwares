const isBrowser = typeof window !== 'undefined';

// Privacy modes (Edge Tracking Prevention, Brave Shields, Safari private
// browsing) do not return null for blocked storage - they throw a SecurityError
// on the *access itself*. Every read and write has to be guarded or a blocked
// browser takes the whole app down on first render.
export const safeGetItem = (storage, key) => {
  if (!isBrowser) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
};

export const safeSetItem = (storage, key, value) => {
  if (!isBrowser) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

export const safeRemoveItem = (storage, key) => {
  if (!isBrowser) return false;
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

const notify = (key) => {
  if (!isBrowser) return;
  window.dispatchEvent(new CustomEvent('localstorage', { detail: { key } }));
};

export const loadJSON = (key, fallback) => {
  if (!isBrowser) return fallback;
  const raw = safeGetItem(window.localStorage, key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

export const saveJSON = (key, value) => {
  if (!isBrowser) return;
  safeSetItem(window.localStorage, key, JSON.stringify(value));
  // Notify regardless: in-memory listeners should still resync even when the
  // write was rejected, so the UI stays consistent within the session.
  notify(key);
};

export const getStorageData = (key, fallback) => loadJSON(key, fallback);

export const setStorageData = (key, value) => saveJSON(key, value);

export const subscribeStorage = (handler) => {
  if (!isBrowser) return () => {};

  const onStorage = (event) => {
    if (event.key) {
      handler(event.key);
    }
  };

  const onCustom = (event) => {
    handler(event.detail?.key);
  };

  window.addEventListener('storage', onStorage);
  window.addEventListener('localstorage', onCustom);

  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('localstorage', onCustom);
  };
};
