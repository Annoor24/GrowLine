import { accessToken } from "./session.js";

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

// options: { method, body, auth (default true), token (use this token instead of the saved one) }
export async function request(path, options = {}) {
  const { method = "GET", body, auth = true, token } = options;

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
    // A saved token that the server rejects means the session ended: tell the app to sign out.
    if (response.status === 401 && auth && !token) {
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
