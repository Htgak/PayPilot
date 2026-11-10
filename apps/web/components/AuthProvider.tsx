"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const TOKEN_KEY = "paypilot-access-token";
const EMAIL_KEY = "paypilot-account-email";
interface AuthContextValue { email: string; ready: boolean; signIn: (token: string, email: string) => void; signOut: () => void; }
const AuthContext = createContext<AuthContextValue>({ email: "", ready: false, signIn: () => {}, signOut: () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    const storedEmail = typeof window !== "undefined" ? localStorage.getItem(EMAIL_KEY) || "" : "";
    setEmail(storedEmail);
    setIsAuthenticated(!!token);

    if (!token && pathname !== "/login") router.replace("/login");
    if (token && pathname === "/login") router.replace("/dashboard");
    setReady(true);
  }, [pathname, router]);

  const signIn = (token: string, accountEmail: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(EMAIL_KEY, accountEmail);
    setEmail(accountEmail);
    setIsAuthenticated(true);
    router.replace("/dashboard");
  };

  const signOut = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    setEmail("");
    setIsAuthenticated(false);
    router.replace("/login");
  };

  const publicPage = pathname === "/login";

  return (
    <AuthContext.Provider value={{ email, ready, signIn, signOut }}>
      {!ready && !publicPage ? (
        <div className="grid min-h-screen place-items-center bg-[#f6f7fb] text-sm text-slate-500 dark:bg-[#111827] dark:text-slate-400">
          Loading your workspace…
        </div>
      ) : publicPage || isAuthenticated ? (
        children
      ) : null}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
