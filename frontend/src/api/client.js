// VITE_API_URL is the backend address (set on Render for staging).
// When it is empty the app runs on the built-in mock data.
const BASE = import.meta.env.VITE_API_URL || "";

export const USE_MOCKS = !BASE;

export async function request(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}
