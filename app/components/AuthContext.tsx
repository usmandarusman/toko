
"use client";

import { createContext, useContext } from "react";

export type ShopIdentity = {
  shopName: string;
  shopLogo: string;
};

type AuthContextValue = ShopIdentity & {
  logout: () => Promise<void>;
  updateShopIdentity: (identity: ShopIdentity) => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth harus digunakan di dalam AuthGate.");
  }

  return context;
}
