import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BookOpen, Loader2, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import Lectures from "./pages/Lectures";
import MyPurchases from "./pages/MyPurchases";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Subjects from "./pages/Subjects";
import Viewer from "./pages/Viewer";

const queryClient = new QueryClient();

const SiteLoader = ({ label, subtitle }: { label: string; subtitle: string }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden px-6">
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(circle at top, hsl(175 80% 35% / 0.22), transparent 42%), linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--background)) 100%)',
        }}
      />

      <div className="absolute inset-0 opacity-60" aria-hidden="true">
        <div className="absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2">
          <div className="loader-orbit loader-orbit-slow h-full w-full rounded-full bg-primary/10 blur-3xl" />
        </div>
        <div className="absolute left-1/2 top-1/2 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2">
          <div className="loader-orbit loader-orbit-fast h-full w-full rounded-full border border-primary/15" />
        </div>
      </div>

      <div className="relative flex w-full max-w-md flex-col items-center rounded-[2rem] border border-white/10 bg-background/75 p-8 text-center shadow-[0_30px_120px_-40px_hsl(220_25%_10%/_0.55)] backdrop-blur-2xl">
        <div className="relative mb-8 flex h-24 w-24 items-center justify-center">
          <div className="loader-pulse absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 via-primary/10 to-accent/30 blur-xl" />
          <div className="loader-orbit loader-spin-slow absolute inset-0 rounded-full border border-primary/20" />
          <div className="loader-orbit loader-spin-reverse absolute inset-2 rounded-full border border-primary/20" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-glow">
            <BookOpen className="h-7 w-7" />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Secure study hub
        </div>

        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {label}
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground sm:text-base">
          {subtitle}
        </p>

        <div className="mt-8 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Getting things ready for you
        </div>

        <div className="mt-7 flex w-full max-w-xs items-center gap-2">
          <span className="loader-bar h-1.5 flex-1 rounded-full bg-primary/25" />
          <span className="loader-bar loader-bar-delay-1 h-1.5 flex-[1.4] rounded-full bg-primary/45" />
          <span className="loader-bar loader-bar-delay-2 h-1.5 flex-[0.8] rounded-full bg-primary/25" />
        </div>
      </div>
    </div>
  );
};

const AppShell = () => {
  const { loading: authLoading } = useAuth();
  const location = useLocation();
  const previousPathRef = useRef(location.pathname + location.search + location.hash);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [bootElapsed, setBootElapsed] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setBootElapsed(true), 900);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const currentPath = location.pathname + location.search + location.hash;

    if (previousPathRef.current !== currentPath) {
      setIsRouteLoading(true);

      const timer = window.setTimeout(() => {
        setIsRouteLoading(false);
      }, 650);

      previousPathRef.current = currentPath;

      return () => window.clearTimeout(timer);
    }

    previousPathRef.current = currentPath;
    return undefined;
  }, [location]);

  const loadingCopy = useMemo(() => {
    if (authLoading || !bootElapsed) {
      return {
        label: 'Opening your study space',
        subtitle: 'Loading your account, syncing access, and setting up the interface.',
      };
    }

    return {
      label: 'Preparing your study session',
      subtitle: 'Loading content and settings for a smooth, focused learning experience.',
    };
  }, [authLoading, bootElapsed]);

  const showLoader = authLoading || !bootElapsed || isRouteLoading;

  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/subjects" element={<Subjects />} />
        <Route path="/lectures" element={<Lectures />} />
        <Route path="/my-purchases" element={<MyPurchases />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/viewer/:id" element={<Viewer />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      {showLoader ? <SiteLoader label={loadingCopy.label} subtitle={loadingCopy.subtitle} /> : null}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
