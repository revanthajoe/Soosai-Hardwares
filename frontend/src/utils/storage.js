const isBrowser = typeof window !== 'undefined';

const notify = (key) => {
  if (!isBrowser) return;
  window.dispatchEvent(new CustomEvent('localstorage', { detail: { key } }));
};

export const loadJSON = (key, fallback) => {
  if (!isBrowser) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

export const saveJSON = (key, value) => {
  if (!isBrowser) return;
  window.localStorage.setItem(key, JSON.stringify(value));
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
