import { getMe as apiGetMe, login as apiLogin, register as apiRegister } from '@/api/auth';
import apiFetch from '@/api/client';
import { supabase } from '@/integrations/supabase/client';
import type { AuthContextType, Profile, Session, User } from '@/interfaces/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const toOtpFriendlyError = (message: string): Error => {
  if (message.toLowerCase().includes('magic link')) {
    return new Error('Failed to create account. Please try again in a moment.');
  }

  return new Error(message);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const { ok, body } = await apiGetMe();
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
    return () => { mounted = false; };
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
        return { error: toOtpFriendlyError(body?.message || 'Registration failed') };
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
    localStorage.removeItem('auth_token');
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
  };

  const sendOtp = async (email?: string, type: 'signup' | 'reset' = 'signup') => {
    if (!email) return { error: new Error('Email is required') };
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: type === 'signup',
      },
    } as any);

    return { error: error ? toOtpFriendlyError((error as any).message) : null };
  };

  const verifyOtp = async (email: string, token: string, type: 'reset' = 'reset') => {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'recovery',
    } as any);

    if (verifyError) {
      return { error: new Error((verifyError as any).message) };
    }

    return { error: null };
  };

  const resetPassword = async (email?: string) => {
    if (!email) return { error: new Error('Email is required') };
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset`,
    });

    return { error: error ? toOtpFriendlyError(error.message) : null };
  };

  const updatePasswordWithOtp = async (newPassword: string) => {
    // Ensure we have a session. If the user landed on the page via the recovery
    // link, Supabase places tokens in the URL and `getSessionFromUrl` will
    // parse and store them. Try to parse URL if no session exists yet.
    let { data } = await supabase.auth.getSession();

    if (!data.session) {
      try {
        const authHelper = supabase.auth as unknown as { getSessionFromUrl?: () => Promise<unknown> };
        const fromUrl = authHelper.getSessionFromUrl ? await authHelper.getSessionFromUrl() : null;
        if (fromUrl && typeof fromUrl === 'object') {
          const maybeData = (fromUrl as Record<string, unknown>)['data'];
          if (maybeData && typeof maybeData === 'object' && 'session' in maybeData) {
            data = maybeData as unknown as typeof data;
          }
        }
      } catch (e) {
        // ignore; we'll return a helpful error below
      }
    }

    if (!data.session) {
      return { error: new Error('Open the password reset link from your email first.') };
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

    if (!updateError) {
      await supabase.auth.signOut();
    }

    return { error: updateError ? new Error(updateError.message) : null };
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
        sendOtp,
        verifyOtp,
        resetPassword,
        updatePasswordWithOtp,
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
