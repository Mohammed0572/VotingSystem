import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface AuthState {
  role: string | null;
  voter_id: string | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  setAuth: (role: string, voter_id: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = 'http://127.0.0.1:8000';
const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // Refresh every 10 minutes

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    role: null,
    voter_id: null,
    isLoading: true,
  });

  // Hydrate session from cookie on mount
  useEffect(() => {
    fetch(`${API_BASE}/auth/me`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then(data => {
        setState({ role: data.role, voter_id: data.voter_id, isLoading: false });
      })
      .catch(() => {
        setState({ role: null, voter_id: null, isLoading: false });
      });
  }, []);

  // Auto-refresh token while authenticated
  useEffect(() => {
    if (!state.role) return;

    const interval = setInterval(() => {
      fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })
        .then(res => {
          if (!res.ok) throw new Error('Refresh failed');
          return res.json();
        })
        .then(data => {
          setState(prev => ({ ...prev, role: data.role, voter_id: data.voter_id }));
        })
        .catch(() => {
          // Token expired or invalid — clear session
          setState({ role: null, voter_id: null, isLoading: false });
        });
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [state.role]);

  const setAuth = useCallback((role: string, voter_id: string) => {
    setState({ role, voter_id, isLoading: false });
  }, []);

  const logout = useCallback(async () => {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});
    setState({ role: null, voter_id: null, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
