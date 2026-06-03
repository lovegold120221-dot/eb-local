import React, {createContext, useEffect, useState, useContext} from 'react';
import {auth, onAuthStateChanged, User} from '../firebase/firebase';

export const AuthContext = createContext<{
  user: User | null;
  initializing: boolean;
}>({user: null, initializing: true});

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, nextUser => {
      setUser(nextUser);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{user, initializing}}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
