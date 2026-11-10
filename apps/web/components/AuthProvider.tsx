"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const TOKEN_KEY = "paypilot-access-token";
const EMAIL_KEY = "paypilot-account-email";

interface AuthContextValue {
  email: string;
  ready: boolean;
  signIn: (token: string, email: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  email: "alex@pixelcraft.studio",
  ready: true,
  signIn: () => {},
  signOut: () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState("alex@pixelcraft.studio");
  const [ready] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedEmail = localStorage.getItem(EMAIL_KEY);
      if (storedEmail) setEmail(storedEmail);
    }
  }, []);

  const signIn = (token: string, accountEmail: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(EMAIL_KEY, accountEmail);
    }
    setEmail(accountEmail);
    router.replace("/dashboard");
  };

  const signOut = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(EMAIL_KEY);
    }
    setEmail("alex@pixelcraft.studio");
  };

  return (
    <AuthContext.Provider value={{ email, ready, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
