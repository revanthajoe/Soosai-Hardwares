const TOKEN_KEY = 'shop_admin_token';
const USER_KEY = 'shop_admin_user';

export const auth = {
  setSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  getToken() {
    return localStorage.getItem(TOKEN_KEY) || '';
  },
  getUser() {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  isLoggedIn() {
    return Boolean(localStorage.getItem(TOKEN_KEY));
  },
};
