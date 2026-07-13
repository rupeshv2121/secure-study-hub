import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import PageLoader from "@/components/PageLoader";
import SiteLoader from "@/components/SiteLoader";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

// Route-level code splitting: each page loads as its own chunk on demand,
// keeping the initial bundle small (heavy deps like charts/PDF tooling only
// download when their page is actually visited).
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Subjects = lazy(() => import("./pages/Subjects"));
const Lectures = lazy(() => import("./pages/Lectures"));
const MyPurchases = lazy(() => import("./pages/MyPurchases"));
const Profile = lazy(() => import("./pages/Profile"));
const Viewer = lazy(() => import("./pages/Viewer"));
const Admin = lazy(() => import("./pages/Admin"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const AppShell = () => {
  const { loading: authLoading } = useAuth();
  // Keep the boot loader up for a brief minimum so it never flashes, but tie it
  // strictly to auth resolution — not to every route change.
  const [minElapsed, setMinElapsed] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMinElapsed(true), 600);
    return () => window.clearTimeout(timer);
  }, []);

  const showBootLoader = authLoading || !minElapsed;

  if (showBootLoader) {
    return <SiteLoader />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
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
    </Suspense>
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
