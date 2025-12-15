// js/utils/storage.js

// js/utils/storage.js

const USER_KEY = "bidhub_user";
const TOKEN_KEY = "bidhub_token";

// ... saveAuth, getUser, getToken, clearAuth are already here

export function updateUser(partial) {
  const existing = getUser() || {};
  const updated = { ...existing, ...partial };

  try {
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to update user in storage", error);
  }
}


// Save token + user after login
export function saveAuth(data) {
  try {
    const { accessToken, ...user } = data;

    if (accessToken) {
      localStorage.setItem(TOKEN_KEY, accessToken);
    }

    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error("Failed to save auth", error);
  }
}

// Get current user object (or null if not logged in)
export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to parse user from storage", error);
    return null;
  }
}

// Get token for authenticated API calls
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

// Clear everything on logout
export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
