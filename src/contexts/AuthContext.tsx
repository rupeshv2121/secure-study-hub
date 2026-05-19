import { getMe as apiGetMe, login as apiLogin, register as apiRegister } from '@/api/auth';
import apiFetch from '@/api/client';
import { supabase } from '@/integrations/supabase/client';
import type { AuthContextType, Profile, Session, User } from '@/interfaces/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const toOtpFriendlyError = (message: string): Error => {
  if (message.toLowerCase().includes('magic link')) {
    return new Error('Failed to send OTP. Please try again in a moment.');
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
        setProfile({ id: u.id, email: u.email, full_name: u.name ?? null });
        setUser({ id: u.id, email: u.email, name: u.name, role: u.role });
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
      // Use Supabase OTP to send verification code for signup. We'll defer creating
      // the backend user and issuing a JWT until the OTP is verified.
      // Clear any existing token to avoid accidental auto-login
      localStorage.removeItem('auth_token');

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      } as any);

      if (error) return { error: toOtpFriendlyError((error as any).message) };

      // Store pending signup details so verify step can complete registration
      localStorage.setItem('pending_signup', JSON.stringify({ email, password, fullName, phoneNumber }));
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
        setUser({ id: u.id, email: u.email, name: u.name, role: u.role });
        setProfile({ id: u.id, email: u.email, full_name: u.name ?? null });
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

  const verifyOtp = async (email: string, token: string, type: 'signup' | 'reset' = 'signup', newPassword?: string) => {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: type === 'signup' ? 'email' : 'recovery',
    } as any);

    if (verifyError) {
      return { error: new Error((verifyError as any).message) };
    }

    if (type === 'signup') {
      // For signup, set the user's password (Supabase requires this step), then
      // create the backend user and obtain a JWT so the frontend can be logged in.
      const pending = localStorage.getItem('pending_signup');
      const pendingData = pending ? JSON.parse(pending) : null;
      const pw = newPassword ?? pendingData?.password;
      if (!pw) return { error: new Error('Password is required to complete signup.') };

      const { error: updateError } = await supabase.auth.updateUser({ password: pw } as any);
      if (updateError) {
        return { error: new Error((updateError as any).message) };
      }

      // Now create or sync the backend user and sign in to get a token
      try {
        // If backend has a dedicated register endpoint that expects password,
        // use it; otherwise use the /auth/sync route which creates user from Supabase.
        // Prefer register to get a JWT immediately.
        let token: string | null = null;
        let userObj: any = null;

        if (pendingData) {
          const { email: pEmail, fullName, phoneNumber } = pendingData;
          const { ok, body } = await apiRegister({ name: fullName, email: pEmail, password: pw, phoneNumber });
          if (ok) {
            token = body?.data?.token || body?.token || null;
            userObj = body?.data?.user || body?.user || null;
          }
        }

        // Fallback: call sync endpoint then login
        if (!token) {
          try {
            await apiFetch('/auth/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email }),
            });
          } catch (e) {
            // ignore
          }

          // Attempt login to get token
          const { ok: okLogin, body: loginBody } = await apiLogin({ email, password: pw });
          if (okLogin) {
            token = loginBody?.data?.token || loginBody?.token || null;
            userObj = loginBody?.data?.user || loginBody?.user || null;
          }
        }

        if (token && userObj) {
          localStorage.removeItem('pending_signup');
          localStorage.setItem('auth_token', token);
          setUser({ id: userObj.id, email: userObj.email, name: userObj.name, role: userObj.role });
          setProfile({ id: userObj.id, email: userObj.email, full_name: userObj.name ?? null });
          setSession({ user: userObj, token } as any);
          setIsAdmin((userObj as any).role === 'ADMIN');
        }
      } catch (e: any) {
        return { error: new Error(e?.message || 'Failed to finalize signup') };
      }
    }

    return { error: null };
  };

  const resetPassword = async (email?: string) => {
    if (!email) return { error: new Error('Email is required') };
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    } as any);

    return { error: error ? toOtpFriendlyError((error as any).message) : null };
  };

  const updatePasswordWithOtp = async (email: string, token: string, newPassword: string) => {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'recovery',
    } as any);

    if (verifyError) {
      return { error: new Error((verifyError as any).message) };
    }

    // Then update the password (user is now authenticated after verifyOtp)
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    } as any);

    // Sign out after password update so user can sign in with new password
    if (!updateError) {
      await supabase.auth.signOut();
    }

    return { error: updateError ? new Error((updateError as any).message) : null };
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
