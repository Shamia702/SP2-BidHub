const USER_KEY = "bidhub_user";
const TOKEN_KEY = "bidhub_token";

export function saveAuth(data) {
  if (!data) return;

  const { accessToken, ...user } = data;

  if (accessToken) {
    localStorage.setItem(TOKEN_KEY, accessToken);
  }

  if (Object.keys(user).length > 0) {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error("Failed to save user to storage", error);
    }
  }
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearAuth() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export function updateUser(partial) {
  const existing = getUser() || {};
  const updated = { ...existing, ...partial };

  try {
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to update user in storage", error);
  }
}
