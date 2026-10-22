import { ApiError } from "../api/client.js";

// Thrown by login() for cases the server itself does not report.
export class LoginProblem extends Error {
  constructor(code) {
    super(code);
    this.code = code; // "invalid" | "not-admin" | "is-admin"
  }
}

// Returns { credentials: boolean, text } so the admin page can count wrong-password attempts.
export function describeLoginError(err) {
  if (err instanceof LoginProblem) {
    if (err.code === "invalid") {
      return { credentials: true, text: "Email or password is incorrect. Please try again." };
    }
    if (err.code === "not-admin") {
      return { credentials: false, text: "This account is not a Super Admin. Use the Extension Agent sign-in instead." };
    }
    if (err.code === "is-admin") {
      return { credentials: false, text: "This is a Super Admin account. Use the Super Admin sign-in instead." };
    }
  }
  if (err instanceof ApiError) {
    if (err.status === 0) {
      return { credentials: false, text: "We could not reach the server. Check your connection and try again." };
    }
    if (err.status === 400 || err.status === 401) {
      return { credentials: true, text: "Email or password is incorrect. Please try again." };
    }
    if (err.status === 429) {
      return { credentials: false, text: "Too many attempts. Please wait a moment and try again." };
    }
  }
  return { credentials: false, text: "Something went wrong while signing in. Please try again." };
}
