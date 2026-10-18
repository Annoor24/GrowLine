import { createContext, useCallback, useContext, useMemo, useState } from "react";

// MOCK SESSION: replace signIn/signOut with real API calls once the backend login exists.
// The session is only kept in localStorage so a page refresh keeps you signed in.
const STORAGE_KEY = "growline.session";

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

function writeSession(value) {
  try {
    if (value) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage can be blocked (private windows); the session then lasts until reload.
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession);

  const signIn = useCallback((role, email) => {
    const name = role === "admin" ? "Super Admin" : "Amina Yusuf";
    const next = { role, email, name };
    writeSession(next);
    setSession(next);
  }, []);

  const signOut = useCallback(() => {
    writeSession(null);
    setSession(null);
  }, []);

  const value = useMemo(() => ({ session, signIn, signOut }), [session, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
