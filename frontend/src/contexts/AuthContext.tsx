/**
 * Authentication Context
 * Manages Google OAuth authentication and user state
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

interface APIConfig {
  textGeneration: {
    provider: 'openai' | 'gemini' | 'anthropic' | 'custom';
    apiKey: string;
    model?: string;
    endpoint?: string;
  };
  imageGeneration?: {
    provider: 'dalle' | 'stable-diffusion' | 'custom';
    apiKey: string;
    endpoint?: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  picture: string;
  apiConfig?: APIConfig;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => void;
  updateAPIConfig: (config: APIConfig) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GOOGLE_CLIENT_ID = '613639905191-p9t43qobpn0cmoj2f0idjp4i1998uovn.apps.googleusercontent.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('finxan_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('finxan_user');
      }
    }
  }, []);

  // Load Google Sign-In script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const login = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof window.google === 'undefined') {
        reject(new Error('Google Sign-In not loaded'));
        return;
      }

      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        callback: async (response: any) => {
          if (response.access_token) {
            try {
              // Fetch user info from Google
              const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: {
                  Authorization: `Bearer ${response.access_token}`,
                },
              });

              const userInfo = await userInfoResponse.json();

              const newUser: User = {
                id: userInfo.id,
                name: userInfo.name,
                email: userInfo.email,
                picture: userInfo.picture,
              };

              setUser(newUser);
              setIsAuthenticated(true);
              localStorage.setItem('finxan_user', JSON.stringify(newUser));
              resolve();
            } catch (error) {
              console.error('Failed to fetch user info:', error);
              reject(error);
            }
          } else {
            reject(new Error('No access token received'));
          }
        },
      });

      client.requestAccessToken();
    });
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('finxan_user');
  };

  const updateAPIConfig = (config: APIConfig) => {
    if (user) {
      const updatedUser = { ...user, apiConfig: config };
      setUser(updatedUser);
      localStorage.setItem('finxan_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, updateAPIConfig }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Type declaration for Google Sign-In
declare global {
  interface Window {
    google: any;
  }
}
