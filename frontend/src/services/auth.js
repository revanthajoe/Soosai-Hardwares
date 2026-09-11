import { safeGetItem, safeRemoveItem, safeSetItem } from '../utils/storage';

const TOKEN_KEY = 'shop_admin_token';
const USER_KEY = 'shop_admin_user';

const store = () => (typeof window === 'undefined' ? null : window.localStorage);

// Every access goes through the safe helpers: browsers with storage blocked
// throw on plain localStorage reads, and Navbar calls getUser() during render,
// so an unguarded read here crashes the entire app before it paints.
export const auth = {
  setSession(token, user) {
    const storage = store();
    if (!storage) return;
    safeSetItem(storage, TOKEN_KEY, token);
    safeSetItem(storage, USER_KEY, JSON.stringify(user));
  },
  getToken() {
    const storage = store();
    if (!storage) return '';
    return safeGetItem(storage, TOKEN_KEY) || '';
  },
  getUser() {
    const storage = store();
    if (!storage) return null;

    const raw = safeGetItem(storage, USER_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  clearSession() {
    const storage = store();
    if (!storage) return;
    safeRemoveItem(storage, TOKEN_KEY);
    safeRemoveItem(storage, USER_KEY);
  },
  isLoggedIn() {
    return Boolean(auth.getToken());
  },
};
