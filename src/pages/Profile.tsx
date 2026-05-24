import apiFetch from '@/api/client';
import BackButton from '@/components/BackButton';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { BadgeCheck, CalendarDays, Loader2, Lock, Mail, Phone, Save, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Profile = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const displayName = fullName || profile?.full_name || user?.email?.split('@')[0] || 'Learner';
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setEmail(profile.email || '');
      setPhoneNumber(profile.phone_number || '');
    }
  }, [profile, user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdating(true);
    try {
      // Update user name via backend
      const res = await apiFetch('/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fullName, phoneNumber }),
      });
      const body = await res.json();
      if (!body?.success) throw new Error(body?.message || 'Failed to update profile');

      if (body?.data) {
        setFullName(body.data.name || fullName);
        setEmail(body.data.email || email);
        setPhoneNumber(body.data.phoneNumber || '');
      }

      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await apiFetch('/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      const body = await res.json();
      if (!body?.success) throw new Error(body?.message || 'Failed to change password');

      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen gradient-hero">
      <Navbar />
      <main className="container mx-auto max-w-[78rem] px-4 py-8 md:py-10">
        <div className="mb-6">
          <BackButton className="mb-6" />
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">Profile</p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">Account settings</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
              Keep your name, contact info, and password up to date in one clean place.
            </p>
          </div>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-background/85 p-4 shadow-soft">
            <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Status</div>
            <div className="mt-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <User className="h-4 w-4 text-primary" />
              Active account
            </div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/85 p-4 shadow-soft">
            <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Verified</div>
            <div className="mt-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <BadgeCheck className="h-4 w-4 text-primary" />
              {user.email_confirmed_at ? 'Email verified' : 'Email pending'}
            </div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/85 p-4 shadow-soft">
            <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Member since</div>
            <div className="mt-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <CalendarDays className="h-4 w-4 text-primary" />
              {memberSince}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
          <Card className="border-border/60 bg-background/85 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Profile details
              </CardTitle>
              <CardDescription>Update the details shown on your account.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email address
                  </Label>
                  <Input id="email" type="email" value={email} disabled className="bg-muted" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>

                <Button type="submit" disabled={isUpdating} className="w-full gap-2 sm:w-auto">
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save changes
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-background/85 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Password
              </CardTitle>
              <CardDescription>Use a new password to secure your account.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                  />
                </div>

                <Button type="submit" variant="outline" disabled={isChangingPassword} className="w-full gap-2">
                  {isChangingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Change password
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;
