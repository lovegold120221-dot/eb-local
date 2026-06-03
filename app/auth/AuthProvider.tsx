import React, {createContext, useEffect, useState, useContext, useCallback} from 'react';
import {getCurrentUser} from './localAuth';
import type {LocalUser} from './localAuth';

export type {LocalUser};

export const AuthContext = createContext<{
  user: LocalUser | null;
  initializing: boolean;
  logout: () => void;
}>({user: null, initializing: true, logout: () => {}});

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    getCurrentUser()
      .then(stored => {
        if (stored) setUser(stored);
        else setUser(null);
      })
      .catch(() => setUser(null))
      .finally(() => setInitializing(false));
  }, [tick]);

  const logout = useCallback(() => {
    setUser(null);
    setTick(t => t + 1);
  }, []);

  return (
    <AuthContext.Provider value={{user, initializing, logout}}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
