import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

import AuthService from '../services/auth.service';
import {
    LoginRequest,
} from '../api/auth.api';

import {
    AuthenticatedUser,
} from '../storage/user.storage';

import { router } from 'expo-router';

interface AuthContextType {
    user: AuthenticatedUser | null;

    accessToken: string | null;

    loading: boolean;

    isAuthenticated: boolean;

    login(
        payload: LoginRequest,
    ): Promise<void>;

    logout(): Promise<void>;
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


console.log('TOKEN:', token);
console.log('USER:', storedUser);

            if (token && storedUser) {
                setAccessToken(token);
                setUser(storedUser);
            }
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
                !!accessToken && !!user,

            login,

            logout,
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
            'useAuth must be used within AuthProvider',
        );
    }

    return context;
}