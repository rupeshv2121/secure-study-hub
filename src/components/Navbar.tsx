import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, LogOut, Package, Settings, Shield, Sparkles, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const publicLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'FAQ', href: '#faq' },
];

const appLinks = [
  {label: 'Categories', href: '/' },
  { label: 'Subjects', href: '/subjects' },
  { label: 'Lectures', href: '/lectures' },
];

const Navbar = () => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-b from-background/85 to-background/55 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 ">
        <Link to="/" className="group flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/15 to-primary/5 text-primary shadow-soft transition-transform group-hover:-translate-y-0.5 group-hover:shadow-glow">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">Out from Cumfurt</span>
            </div>
            <div className="text-xs text-muted-foreground">Modern Notes delivery</div>
          </div>
        </Link>

        <div className="hidden items-center rounded-full border border-border/70 bg-background/80 p-1 shadow-soft md:flex">
          {(user ? appLinks : publicLinks).map((item) =>
            item.href.startsWith('/') ? (
              <Link
                key={item.label}
                to={item.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.label}
                href={item.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
              >
                {item.label}
              </a>
            ),
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="glass" size="sm" className="gap-2 rounded-full border border-border/70 bg-background/85 px-4">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {profile?.full_name || user.email?.split('@')[0]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {isAdmin && (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Shield className="w-4 h-4 mr-2" />
                      Admin Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}

                <DropdownMenuItem onClick={() => navigate('/my-purchases')}>
                  <Package className="w-4 h-4 mr-2" />
                  My Purchases
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <Settings className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/auth')} className="hidden rounded-full px-4 text-foreground md:inline-flex">
                Sign In
              </Button>
              <Button variant="hero" size="sm" onClick={() => navigate('/auth')} className="rounded-full px-4 shadow-glow">
                Get Started
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
