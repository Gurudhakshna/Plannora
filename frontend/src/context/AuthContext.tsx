import { createContext } from "react";
import type { AuthUser } from "../services/authService";

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signInWithEmail: (email: string, password?: string) => Promise<AuthUser>;
  registerWithEmail: (name: string, email: string, password?: string) => Promise<AuthUser>;
  requestPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
