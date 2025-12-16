// js/utils/storage.js

const USER_KEY = "bidhub_user";
const TOKEN_KEY = "bidhub_token";

/**
 * Save auth response from API (user + accessToken)
 */
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

/**
 * Get current user object from storage
 */
export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Get access token from storage
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Clear user + token (logout)
 */
export function clearAuth() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Update user object in storage (merge current + updates)
 */
export function updateUser(updates) {
  try {
    const current = getUser() || {};
    const next = { ...current, ...updates };
    localStorage.setItem(USER_KEY, JSON.stringify(next));
  } catch (error) {
    console.error("Failed to update user in storage", error);
  }
}
