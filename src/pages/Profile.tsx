import apiFetch from '@/api/client';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, BadgeCheck, CalendarDays, Loader2, Mail, Phone, Save, ShieldCheck, Sparkles, User } from 'lucide-react';
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
  const [currentPassword, setCurrentPassword] = useState('');
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
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Button variant="hero" size="sm" onClick={() => navigate(-1)} className="mb-6 gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <section className="mb-8 rounded-3xl border border-border/60 bg-background/80 p-6 shadow-soft backdrop-blur-xl md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Profile center
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                Manage your account details and security settings
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                Keep your profile up to date, review your account status, and change your password from one clean dashboard.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 md:min-w-[340px]">
              <div className="rounded-2xl border border-border/60 bg-muted/40 p-4 text-center shadow-soft">
                <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Status</div>
                <div className="mt-2 flex items-center justify-center gap-2 text-sm font-semibold text-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Active
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/40 p-4 text-center shadow-soft">
                <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Verified</div>
                <div className="mt-2 flex items-center justify-center gap-2 text-sm font-semibold text-foreground">
                  <BadgeCheck className="h-4 w-4 text-primary" />
                  {user.email_confirmed_at ? 'Email yes' : 'Pending'}
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/40 p-4 text-center shadow-soft">
                <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Member since</div>
                <div className="mt-2 flex items-center justify-center gap-2 text-sm font-semibold text-foreground">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  {memberSince}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="overflow-hidden border-border/60 bg-background/85 shadow-soft">
            <CardHeader className="border-b bg-gradient-to-br from-primary/10 via-background to-background">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-soft">
                  <User className="h-7 w-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-xl">{displayName}</CardTitle>
                  <CardDescription className="mt-1">{email || user.email}</CardDescription>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Learner account</span>
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">ID {user.id.slice(0, 8)}...</span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-5 p-6">
              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                <div className="text-sm font-medium text-foreground">Quick summary</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-background p-3 shadow-soft">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      Email
                    </div>
                    <div className="mt-2 break-all text-sm font-medium text-foreground">{email || user.email}</div>
                  </div>
                  <div className="rounded-xl bg-background p-3 shadow-soft">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      Phone
                    </div>
                    <div className="mt-2 text-sm font-medium text-foreground">
                      {phoneNumber || 'Not added yet'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Security notes
                </div>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li>• Email updates are managed by the auth system and stay locked here.</li>
                  <li>• Keep your password strong to protect purchased study material access.</li>
                  <li>• Phone number helps with account recovery and profile personalization.</li>
                </ul>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button variant="hero" onClick={() => navigate('/subjects')} className="gap-2">
                  Browse Subjects
                </Button>
                <Button variant="outline" onClick={() => navigate('/my-purchases')} className="gap-2">
                  My Purchases
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-border/60 bg-background/85 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </Label>
                    <Input id="email" type="email" value={email} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter your phone number"
                    />
                    <p className="text-xs text-muted-foreground">Used for recovery and contact purposes.</p>
                  </div>

                  <Button type="submit" disabled={isUpdating} className="w-full gap-2">
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-background/85 shadow-soft">
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your password to keep your account secure</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
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
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                    />
                  </div>

                  <Button type="submit" variant="outline" disabled={isChangingPassword} className="w-full">
                    {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Change Password
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
