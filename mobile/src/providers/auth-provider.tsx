import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import AuthService from '@/src/services/auth.service';
import UserStorage from '@/src/storage/user.storage';

import {
  LoginRequest,
  RegisterRequest,
} from '@/src/api/auth.api';

import {
  AuthenticatedUser,
} from '@/src/types/auth';
import { useRouter } from 'expo-router';

interface AuthContextType {
  user: AuthenticatedUser | null;

  accessToken: string | null;

  loading: boolean;

  isAuthenticated: boolean;

  login(
    payload: LoginRequest,
  ): Promise<AuthenticatedUser>;

  register(
    payload: RegisterRequest,
  ): Promise<AuthenticatedUser>;

  logout(): Promise<void>;

  refreshUser(): Promise<void>;

  setUser(user: AuthenticatedUser | null): void;
}

const AuthContext =
  createContext<AuthContextType | null>(null);

export function AuthProvider({
  children,
}: React.PropsWithChildren) {
  const router = useRouter();
  const [user, setUser] =
    useState<AuthenticatedUser | null>(null);

  const [accessToken, setAccessToken] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  function persistUser(user: AuthenticatedUser) {
    void UserStorage.saveCurrentUser(user);
  }

  function updateUser(user: AuthenticatedUser | null) {
    setUser(user);
    if (user) {
      persistUser(user);
    }
  }

  async function restoreSession() {
    try {
      const token = await AuthService.getAccessToken();

      if (!token) {
        return;
      }

      setAccessToken(token);

      try {
        const freshUser = await AuthService.me();
        setUser(freshUser);
      } catch {
        const storedUser = await AuthService.getCurrentUser();
        if (storedUser) {
          setUser(storedUser);
        } else {
          await AuthService.clearSession();
          setAccessToken(null);
          setUser(null);
        }
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

    updateUser(result.user);
    return result.user;
  }

  async function register(
    payload: RegisterRequest,
  ) {
    const result =
      await AuthService.register(payload);

    setAccessToken(result.accessToken);

    updateUser(result.user);
    return result.user;
  }

  async function refreshUser() {
    const user =
      await AuthService.me();

    updateUser(user);
  }

  async function logout() {
    await AuthService.logout();

    setAccessToken(null);
    setUser(null);

    router.replace(
      '/(auth)/login',
    )
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

      setUser: updateUser,
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