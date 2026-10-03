import {
  forgotPassword as apiForgotPassword,
  getMe as apiGetMe,
  login as apiLogin,
  register as apiRegister,
  resetPassword as apiResetPassword,
} from '@/api/auth';
import { AUTH_EXPIRED_EVENT } from '@/api/client';
import type { AuthContextType, Profile, Session, User } from '@/interfaces/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const clearSession = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
  };

  const fetchProfile = async () => {
    try {
      const { ok, status, body } = await apiGetMe();
      if (status === 401) {
        clearSession();
        return;
      }
      const u = body?.user ?? body?.data?.user ?? null;
      if (ok && u) {
        setProfile({ id: u.id, email: u.email, full_name: u.name ?? null, phone_number: u.phoneNumber ?? u.phone_number ?? null });
        setUser({ id: u.id, email: u.email, name: u.name, role: u.role, created_at: u.createdAt ?? u.created_at ?? null });
        setSession({ user: u, token: (body?.data?.token) || null } as any);
        setIsAdmin((u as any).role === 'ADMIN');
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          await fetchProfile();
        }
      } catch (e) {
        console.error('Failed to restore session', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    // Any API call rejected with 401 means the stored token is dead; drop the
    // session so protected pages redirect to /auth.
    const onExpired = () => clearSession();
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);

    return () => {
      mounted = false;
      window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string, phoneNumber?: string) => {
    try {
      localStorage.removeItem('auth_token');

      const { ok, body } = await apiRegister({
        name: fullName,
        email,
        password,
        phoneNumber,
      });

      if (!ok) {
        return { error: new Error(body?.message || 'Registration failed') };
      }

      const token = body?.data?.token || body?.token || null;
      const userObj = body?.data?.user || body?.user || null;

      if (token && userObj) {
        localStorage.setItem('auth_token', token);
        setUser({
          id: userObj.id,
          email: userObj.email,
          name: userObj.name,
          role: userObj.role,
          created_at: userObj.createdAt ?? userObj.created_at ?? null,
        });
        setProfile({
          id: userObj.id,
          email: userObj.email,
          full_name: userObj.name ?? null,
          phone_number: userObj.phoneNumber ?? userObj.phone_number ?? null,
        });
        setSession({ user: userObj, token } as any);
        setIsAdmin((userObj as any).role === 'ADMIN');
      }

      return { error: null };
    } catch (e: any) {
      return { error: new Error(e?.message || 'Registration failed') };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { ok, body } = await apiLogin({ email, password });
      if (!ok) return { error: new Error(body?.message || 'Login failed') };
      const token = body?.data?.token || body?.token || null;
      const u = body?.data?.user || body?.user || null;
      if (token && u) {
        localStorage.setItem('auth_token', token);
        setUser({ id: u.id, email: u.email, name: u.name, role: u.role, created_at: u.createdAt ?? u.created_at ?? null });
        setProfile({ id: u.id, email: u.email, full_name: u.name ?? null, phone_number: u.phoneNumber ?? u.phone_number ?? null });
        setSession({ user: u, token } as any);
        setIsAdmin((u as any).role === 'ADMIN');
      }
      return { error: null };
    } catch (e: any) {
      return { error: e };
    }
  };

  const signOut = async () => {
    clearSession();
  };

  const resetPassword = async (email?: string) => {
    if (!email) return { error: new Error('Email is required') };
    try {
      const { ok, body } = await apiForgotPassword(email);
      if (!ok) return { error: new Error(body?.message || 'Failed to send reset link') };
      return { error: null };
    } catch (e) {
      return { error: new Error(e instanceof Error ? e.message : 'Failed to send reset link') };
    }
  };

  const completePasswordReset = async (token: string, newPassword: string) => {
    try {
      const { ok, body } = await apiResetPassword(token, newPassword);
      if (!ok) return { error: new Error(body?.message || 'Failed to reset password') };
      return { error: null };
    } catch (e) {
      return { error: new Error(e instanceof Error ? e.message : 'Failed to reset password') };
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        session, 
        profile, 
        isAdmin, 
        loading, 
        signUp, 
        signIn, 
        signOut,
        resetPassword,
        completePasswordReset,
      }}
    >
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
