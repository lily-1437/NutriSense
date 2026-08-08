// src/hooks/useAuth.jsx
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = createContext({ user: null, loading: true, logout: () => {} });

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 1 day
const LOGIN_TIMESTAMP_KEY = 'authLoginTimestamp';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const checkIntervalRef = useRef(null);

  const logout = async () => {
    localStorage.removeItem(LOGIN_TIMESTAMP_KEY);
    await signOut(auth);
  };

  const isSessionExpired = () => {
    const loginTimestamp = localStorage.getItem(LOGIN_TIMESTAMP_KEY);
    if (!loginTimestamp) return false; // no timestamp recorded yet, don't force expire
    return Date.now() - Number(loginTimestamp) > SESSION_DURATION_MS;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // If no timestamp exists yet (fresh login), set one now
        if (!localStorage.getItem(LOGIN_TIMESTAMP_KEY)) {
          localStorage.setItem(LOGIN_TIMESTAMP_KEY, String(Date.now()));
        }

        // Check expiry immediately on load
        if (isSessionExpired()) {
          logout();
          setUser(null);
          setLoading(false);
          return;
        }

        setUser(firebaseUser);
      } else {
        localStorage.removeItem(LOGIN_TIMESTAMP_KEY);
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Periodically check for expiry while the app is open
  useEffect(() => {
    checkIntervalRef.current = setInterval(() => {
      if (auth.currentUser && isSessionExpired()) {
        logout();
      }
    }, 60 * 1000); // check every minute

    return () => clearInterval(checkIntervalRef.current);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}