import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserSession {
  username: string;
  email: string;
  institution?: string;
  isGuest: boolean;
  loggedInAt: string;
}

interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  login: (username: string, email?: string, isGuest?: boolean, institution?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('neurodecode_user_session');
        if (stored) {
          return JSON.parse(stored);
        }
      } catch {
        // ignore parse error
      }
    }
    return null;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem('neurodecode_user_session', JSON.stringify(user));
      } else {
        localStorage.removeItem('neurodecode_user_session');
      }
    }
  }, [user]);

  const login = (
    username: string,
    email: string = 'researcher@neurodecode.org',
    isGuest: boolean = false,
    institution: string = 'Computational Neuroscience Lab'
  ) => {
    const session: UserSession = {
      username: username.trim() || 'Scientist',
      email: email.trim() || 'researcher@neurodecode.org',
      institution,
      isGuest,
      loggedInAt: new Date().toISOString(),
    };
    setUser(session);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
