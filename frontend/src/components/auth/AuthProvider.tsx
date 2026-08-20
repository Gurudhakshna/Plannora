import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { createAuthService } from "../../services/authService";
import { AuthContext } from "../../context/AuthContext";

const authService = createAuthService();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((authUser) => {
      setUser(authUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function signInWithGoogle() {
    await authService.signInWithGoogle();
  }

  async function logout() {
    await authService.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
