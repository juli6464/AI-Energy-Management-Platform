import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

const STORAGE_KEY = 'ai-energy-auth';

// Demo-only credentials. There is no backend auth — this is a lightweight gate
// for the technical-test demo flow (Login -> Dashboard), not real security.
const VALID_USERNAME = 'admin';
const VALID_PASSWORD = 'abc-123';

interface AuthContextValue {
  isAuthenticated: boolean;
  username: string | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setUsername(stored);
    } catch {
      // ignore storage access errors (e.g. private browsing)
    }
  }, []);

  function login(user: string, password: string): boolean {
    if (user === VALID_USERNAME && password === VALID_PASSWORD) {
      setUsername(user);
      try {
        localStorage.setItem(STORAGE_KEY, user);
      } catch {
        // ignore storage access errors
      }
      return true;
    }
    return false;
  }

  function logout() {
    setUsername(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore storage access errors
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated: username !== null, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
