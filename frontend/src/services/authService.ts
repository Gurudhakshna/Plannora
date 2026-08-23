export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface AuthService {
  signInWithEmail(email: string, password?: string): Promise<AuthUser>;
  registerWithEmail(name: string, email: string, password?: string): Promise<AuthUser>;
  requestPasswordReset(email: string): Promise<void>;
  signOut(): Promise<void>;
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void;
  getCurrentUser(): AuthUser | null;
}

const AUTH_STORAGE_KEY = "plannora_auth_user";

function generateUid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function loadStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AuthUser;
      if (parsed && typeof parsed.uid === "string") {
        return parsed;
      }
    }
  } catch {
    // Corrupted data
  }
  return null;
}

function storeUser(user: AuthUser | null): void {
  if (user) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

type Listener = (user: AuthUser | null) => void;

const listeners: Set<Listener> = new Set();
let currentUser: AuthUser | null = loadStoredUser();

function notifyListeners(): void {
  listeners.forEach((cb) => cb(currentUser));
}

export function createAuthService(): AuthService {
  return {
    async signInWithEmail(email: string, _password?: string): Promise<AuthUser> {
      // Simulate network latency for authentic SaaS feedback
      await new Promise((resolve) => setTimeout(resolve, 400));
      
      const cleanEmail = email.trim().toLowerCase();
      const derivedName = cleanEmail.split("@")[0] || "Student";
      const formattedName = derivedName.charAt(0).toUpperCase() + derivedName.slice(1);

      const user: AuthUser = {
        uid: currentUser?.uid || generateUid(),
        displayName: formattedName,
        email: cleanEmail,
        photoURL: null,
      };

      currentUser = user;
      storeUser(user);
      notifyListeners();
      return user;
    },

    async registerWithEmail(name: string, email: string, _password?: string): Promise<AuthUser> {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const cleanEmail = email.trim().toLowerCase();
      const user: AuthUser = {
        uid: generateUid(),
        displayName: name.trim() || cleanEmail.split("@")[0],
        email: cleanEmail,
        photoURL: null,
      };

      currentUser = user;
      storeUser(user);
      notifyListeners();
      return user;
    },

    async requestPasswordReset(_email: string): Promise<void> {
      await new Promise((resolve) => setTimeout(resolve, 400));
      // Password reset simulated successfully
    },

    async signOut(): Promise<void> {
      currentUser = null;
      storeUser(null);
      notifyListeners();
    },

    onAuthStateChanged(callback: Listener): () => void {
      listeners.add(callback);
      callback(currentUser);
      return () => {
        listeners.delete(callback);
      };
    },

    getCurrentUser(): AuthUser | null {
      return currentUser;
    },
  };
}
