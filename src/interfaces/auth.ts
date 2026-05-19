export type User = {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: string | null;
  user_metadata?: {
    phone_number?: string | null;
    [key: string]: unknown;
  } | null;
};
export type Session = { user?: User | null } | null;

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    phoneNumber?: string,
  ) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  sendOtp: (
    email: string,
    type?: "signup" | "reset",
  ) => Promise<{ error: Error | null }>;
  verifyOtp: (
    email: string,
    token: string,
    type?: "signup" | "reset",
    newPassword?: string,
  ) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePasswordWithOtp: (
    email: string,
    token: string,
    newPassword: string,
  ) => Promise<{ error: Error | null }>;
}

export default {};
