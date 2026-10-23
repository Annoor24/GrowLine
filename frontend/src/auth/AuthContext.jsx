import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ApiError, request, USE_MOCKS } from "../api/client.js";
import { readSession, writeSession } from "../api/session.js";
import { LoginProblem } from "./loginErrors.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession);

  // role: "agent" | "admin" (which sign-in page was used)
  const login = useCallback(async (role, email, password) => {
    if (USE_MOCKS) {
      // Sample mode: any email works; the password "wrong" simulates a failed login.
      if (!email || !password || password === "wrong") throw new LoginProblem("invalid");
      const next = { role, email, name: role === "admin" ? "Super Admin" : "Amina Yusuf" };
      writeSession(next);
      setSession(next);
      return;
    }

    const tokens = await request("/login/", { method: "POST", body: { email, password }, auth: false });

    // The login response says "admin" or "agent". If an older backend leaves it out,
    // ask the admin-only stats endpoint instead: 200 for an admin, 403 for anyone else.
    let isAdmin = tokens.role === "admin";
    if (!tokens.role) {
      try {
        await request("/superadmin/farmers/stats/", { token: tokens.access });
        isAdmin = true;
      } catch (err) {
        if (!(err instanceof ApiError) || err.status !== 403) throw err;
      }
    }

    if (role === "admin" && !isAdmin) throw new LoginProblem("not-admin");
    if (role === "agent" && isAdmin) throw new LoginProblem("is-admin");

    const next = {
      role,
      email,
      name: tokens.fullname || email,
      access: tokens.access,
      refresh: tokens.refresh,
    };
    writeSession(next);
    setSession(next);
  }, []);

  const signOut = useCallback(() => {
    const current = readSession();
    if (!USE_MOCKS && current?.refresh) {
      // Ask the server to retire the refresh token. If this fails the user is still signed out here.
      request("/logout/", { method: "POST", body: { refresh: current.refresh } }).catch(() => {});
    }
    writeSession(null);
    setSession(null);
  }, []);

  // The request helper fires this when the server rejects the saved token (it expired).
  useEffect(() => {
    function handleUnauthorized() {
      writeSession(null);
      setSession(null);
    }
    window.addEventListener("growline:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("growline:unauthorized", handleUnauthorized);
  }, []);

  const value = useMemo(() => ({ session, login, signOut }), [session, login, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
