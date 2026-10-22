// The signed-in session (role, name and the login tokens) is kept in localStorage so a refresh
// keeps you signed in. Every read and write is wrapped because storage can be blocked
// (private windows) or hold broken data.
const STORAGE_KEY = "growline.session";

export function readSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function writeSession(value) {
  try {
    if (value) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage is unavailable; the session then lasts until the page reloads.
  }
}

export function accessToken() {
  return readSession()?.access || null;
}
