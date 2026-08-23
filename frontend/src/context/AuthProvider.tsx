import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { createAuthService } from "../services/authService";
import type { AuthUser } from "../services/authService";
import { AuthContext } from "./AuthContext";

const authService = createAuthService();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => authService.getCurrentUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((authUser) => {
      setUser(authUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function signInWithEmail(email: string, password?: string): Promise<AuthUser> {
    return await authService.signInWithEmail(email, password);
  }

  async function registerWithEmail(name: string, email: string, password?: string): Promise<AuthUser> {
    return await authService.registerWithEmail(name, email, password);
  }

  async function requestPasswordReset(email: string): Promise<void> {
    await authService.requestPasswordReset(email);
  }

  async function logout(): Promise<void> {
    await authService.signOut();
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithEmail,
        registerWithEmail,
        requestPasswordReset,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
