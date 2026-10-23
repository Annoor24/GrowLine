import { accessToken, readSession, writeSession } from "./session.js";

// VITE_API_URL is the backend address, e.g. https://growlineapi.example.com
// When it is empty the app runs on the built-in sample data.
const BASE = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

export const USE_MOCKS = !BASE;

export class ApiError extends Error {
  constructor(status, data) {
    super(`Request failed with status ${status}`);
    this.status = status; // 0 means the server could not be reached
    this.data = data;
  }
}

// When the 1-day access token expires, swap the saved refresh token for a new pair (POST /refresh/).
// Several requests can fail at once, so they all wait for the same renewal.
let renewal = null;

function renewTokens() {
  const current = readSession();
  if (!current?.refresh) return Promise.resolve(false);
  if (!renewal) {
    renewal = (async () => {
      try {
        const response = await fetch(`${BASE}/refresh/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh: current.refresh }),
        });
        if (!response.ok) return false;
        const data = await response.json();
        if (!data?.access) return false;
        writeSession({ ...readSession(), access: data.access, refresh: data.refresh || current.refresh });
        return true;
      } catch {
        return false;
      } finally {
        renewal = null;
      }
    })();
  }
  return renewal;
}

// options: { method, body, auth (default true), token (use this token instead of the saved one) }
export async function request(path, options = {}) {
  const { method = "GET", body, auth = true, token, retried = false } = options;

  const headers = { "Content-Type": "application/json" };
  const bearer = token || (auth ? accessToken() : null);
  if (bearer) headers.Authorization = `Bearer ${bearer}`;

  let response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, null);
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Some responses (such as errors from a proxy) are not JSON.
  }

  if (!response.ok) {
    if (response.status === 401 && auth && !token) {
      // Try once to renew the tokens, then repeat the request.
      if (!retried && (await renewTokens())) {
        return request(path, { ...options, retried: true });
      }
      // Renewal failed: the session has ended, so tell the app to sign out.
      window.dispatchEvent(new Event("growline:unauthorized"));
    }
    throw new ApiError(response.status, data);
  }
  return data;
}

// Paged lists look like { count, next, previous, results }. Follow "next" to collect every row.
export async function fetchAllPages(path, maxPages = 10) {
  const rows = [];
  let first = null;
  let next = path;
  for (let i = 0; i < maxPages && next; i += 1) {
    const page = await request(next);
    if (!first) first = page;
    rows.push(...(page.results || []));
    // "next" is an absolute address; keep only the path and query so the request goes via BASE.
    next = page.next ? new URL(page.next).pathname + new URL(page.next).search : null;
  }
  return { rows, first };
}
