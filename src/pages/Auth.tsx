import apiFetch from '@/api/client';
import BackButton from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, BookOpen, KeyRound, Loader2, Lock, Mail, Phone, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

const emailSchema = z.string().email({ message: 'Please enter a valid email address' });

const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

const signUpSchema = z.object({
  fullName: z.string().min(1, { message: 'Full name is required' }),
  email: emailSchema,
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  phoneNumber: z.string().optional(),
});

const otpSchema = z.object({
  otp: z.string().min(6, { message: 'OTP must be at least 6 digits' }).max(8, { message: 'OTP is too long' }),
});

const forgotPasswordSchema = z.object({
  email: emailSchema,
});

const resetPasswordSchema = z
  .object({
    otp: z.string().min(6, { message: 'OTP must be at least 6 digits' }),
    newPassword: z.string().min(6, { message: 'Password must be at least 6 characters' }),
    confirmPassword: z.string().min(6, { message: 'Confirm password is required' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPasswordForm, setShowResetPasswordForm] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signUp, signIn, user, sendOtp, verifyOtp, resetPassword, updatePasswordWithOtp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const validateForm = () => {
    if (showResetPasswordForm) {
      const result = resetPasswordSchema.safeParse({ otp, newPassword, confirmPassword });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        return false;
      }
      setErrors({});
      return true;
    }

    if (showOtpVerification) {
      const result = otpSchema.safeParse({ otp });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        return false;
      }
      setErrors({});
      return true;
    }

    if (showForgotPassword) {
      const result = forgotPasswordSchema.safeParse({ email: forgotPasswordEmail });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        return false;
      }
      setErrors({});
      return true;
    }

    const schema = isSignUp ? signUpSchema : signInSchema;
    const data = isSignUp ? { fullName, email, password, phoneNumber: phoneNumber || undefined } : { email, password };

    const result = schema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (showResetPasswordForm) {
        const { error } = await updatePasswordWithOtp(forgotPasswordEmail, otp, newPassword);
        if (error) {
          toast.error(error.message || 'Failed to reset password. Please try again.');
        } else {
          toast.success('Password reset successful! Please sign in with your new password.');
          setNewPassword('');
          setConfirmPassword('');
          setOtp('');
          setShowForgotPassword(false);
          setShowResetPasswordForm(false);
          setIsSignUp(false);
        }
      } else if (showOtpVerification) {
        if (!password) {
          toast.error('Signup session expired. Please sign up again to get a new OTP.');
          setShowOtpVerification(false);
          setIsSignUp(true);
          return;
        }

        const { error: verifyError } = await verifyOtp(email, otp, 'signup', password);
        if (verifyError) {
          toast.error(verifyError.message || 'Invalid OTP. Please try again.');
        } else {
          toast.success('Email verified! Your account is now active.');
          // Sync user to backend DB
          try {
            await apiFetch('/auth/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, name: fullName }),
            });
          } catch (e) {
            console.warn('Failed to sync user to backend:', e);
          }

          setPassword('');
          navigate('/');
        }
      } else if (showForgotPassword) {
        const { error } = await resetPassword(forgotPasswordEmail);
        if (error) {
          if (error.message.includes('User not found') || error.message.includes('no user')) {
            toast.error('No account found with this email address.');
          } else {
            toast.error(error.message || 'Failed to send reset OTP. Please try again.');
          }
        } else {
          toast.success('Verification code sent to your email! Enter the OTP to continue.');
          setShowForgotPassword(false);
          setShowResetPasswordForm(true);
          setOtp('');
        }
      } else if (isSignUp) {
        const { error: signUpError } = await signUp(email, password, fullName, phoneNumber);
        if (signUpError) {
          if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
            toast.error('This email is already registered. Please sign in instead.');
          } else {
            toast.error(signUpError.message);
          }
        } else {
          toast.success('Account created! Enter the OTP sent to your email to activate your account.');
          setShowOtpVerification(true);
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Invalid email or password. Please try again.');
          } else if (error.message.includes('Email not confirmed')) {
            toast.error('Please verify your email using the OTP sent to your inbox before signing in.');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Welcome back!');
          navigate('/');
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      const { error } = showResetPasswordForm 
        ? await resetPassword(forgotPasswordEmail)
        : await sendOtp(email, 'signup');
      if (error) {
        toast.error(error.message || 'Failed to resend the email.');
      } else {
        toast.success(showResetPasswordForm ? 'Verification code resent successfully!' : 'Verification code resent successfully!');
      }
    } catch (error) {
      toast.error('Failed to resend the email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4 relative">
      <div className="absolute top-4 left-4">
        <BackButton to="/" label="Back to Home" />
      </div>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-glow mb-4">
            <BookOpen className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">LectureVault</h1>
          <p className="text-muted-foreground mt-1">Secure Lecture Platform</p>
        </div>

        <Card className="shadow-medium animate-slide-up border-border/50">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">
              {showResetPasswordForm
                ? 'Reset your password'
                : showForgotPassword 
                  ? 'Forgot password?'
                  : showOtpVerification
                    ? 'Verify your email'
                    : isSignUp 
                      ? 'Create your account' 
                      : 'Welcome back'}
            </CardTitle>
            <CardDescription>
              {showResetPasswordForm
                ? 'Enter the OTP and your new password'
                : showForgotPassword
                  ? 'Enter your email to receive a reset code'
                  : showOtpVerification
                    ? 'Check your inbox for the verification code'
                    : isSignUp
                      ? 'Start learning with secure lecture notes'
                      : 'Sign in to access your lectures'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {showResetPasswordForm ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="text-center mb-4">
                  <KeyRound className="w-12 h-12 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Enter the OTP code sent to <strong>{forgotPasswordEmail}</strong>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resetOtp">OTP Code</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="resetOtp"
                      type="text"
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      className="pl-10 text-center text-2xl tracking-widest font-mono"
                      maxLength={8}
                    />
                  </div>
                  {errors.otp && (
                    <p className="text-sm text-destructive">{errors.otp}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Min. 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {errors.newPassword && (
                    <p className="text-sm text-destructive">{errors.newPassword}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Resetting password...
                    </>
                  ) : (
                    <>
                      Reset Password
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-sm"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                >
                  Didn't receive code? Resend OTP
                </Button>

                <Button
                  type="button"
                  variant="hero"
                  className="w-full"
                  onClick={() => {
                    setShowResetPasswordForm(false);
                    setOtp('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setErrors({});
                  }}
                >
                  Back to Sign In
                </Button>
              </form>
            ) : showForgotPassword ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgotEmail">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="forgotEmail"
                      type="email"
                      placeholder="Enter your email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending code...
                    </>
                  ) : (
                    <>
                      Send reset code
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordEmail('');
                    setErrors({});
                  }}
                >
                  Back to Sign In
                </Button>
              </form>
            ) : showOtpVerification ? (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <KeyRound className="w-12 h-12 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    We sent a verification code to <strong>{email}</strong>. Enter the OTP below to activate your account.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">OTP Code</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="otp"
                        type="text"
                        placeholder="Enter OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                        className="pl-10 text-center text-2xl tracking-widest font-mono"
                        maxLength={8}
                      />
                    </div>
                    {errors.otp && (
                      <p className="text-sm text-destructive">{errors.otp}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    variant="hero"
                    size="lg"
                    className="w-full"
                    disabled={isLoading || otp.length < 6}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify OTP
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>

                <Button
                  type="button"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Resending code...
                    </>
                  ) : (
                    <>
                      Resend verification code
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setShowOtpVerification(false);
                    setOtp('');
                    setErrors({});
                  }}
                >
                  Back
                </Button>
                </form>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {errors.fullName && (
                      <p className="text-sm text-destructive">{errors.fullName}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phoneNumber"
                        type="tel"
                        placeholder="+1234567890"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {errors.phoneNumber && (
                      <p className="text-sm text-destructive">{errors.phoneNumber}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Include country code (e.g., +91 for India)
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder={isSignUp ? 'Min. 6 characters' : 'Your password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>

                {!isSignUp && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isSignUp ? 'Creating account...' : 'Signing in...'}
                    </>
                  ) : (
                    <>
                      {isSignUp ? 'Create account' : 'Sign In'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrors({});
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isSignUp
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
