import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import AuthService from '@/src/services/auth.service';

import {
  LoginRequest,
  RegisterRequest,
} from '@/src/api/auth.api';

import {
  AuthenticatedUser,
} from '@/src/types/auth';

interface AuthContextType {
  user: AuthenticatedUser | null;

  accessToken: string | null;

  loading: boolean;

  isAuthenticated: boolean;

  login(
    payload: LoginRequest,
  ): Promise<void>;

  register(
    payload: RegisterRequest,
  ): Promise<void>;

  logout(): Promise<void>;

  refreshUser(): Promise<void>;
}

const AuthContext =
  createContext<AuthContextType | null>(null);

export function AuthProvider({
  children,
}: React.PropsWithChildren) {
  const [user, setUser] =
    useState<AuthenticatedUser | null>(null);

  const [accessToken, setAccessToken] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const [token, storedUser] =
        await Promise.all([
          AuthService.getAccessToken(),
          AuthService.getCurrentUser(),
        ]);

      if (token && storedUser) {
        setAccessToken(token);
        setUser(storedUser);
      }
    } catch (error) {
      console.error(
        'Failed to restore session',
        error,
      );

      await AuthService.clearSession();
    } finally {
      setLoading(false);
    }
  }

  async function login(
    payload: LoginRequest,
  ) {
    const result =
      await AuthService.login(payload);

    setAccessToken(result.accessToken);

    setUser(result.user);
  }

  async function register(
    payload: RegisterRequest,
  ) {
    const result =
      await AuthService.register(payload);

    setAccessToken(result.accessToken);

    setUser(result.user);
  }

  async function refreshUser() {
    const user =
      await AuthService.me();

    setUser(user);
  }

  async function logout() {
    await AuthService.logout();

    setAccessToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,

      accessToken,

      loading,

      isAuthenticated:
        !!accessToken,

      login,

      register,

      logout,

      refreshUser,
    }),
    [
      user,
      accessToken,
      loading,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider',
    );
  }

  return context;
}