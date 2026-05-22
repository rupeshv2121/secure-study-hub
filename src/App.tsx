import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import MyPurchases from "./pages/MyPurchases";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Lectures from "./pages/Lectures";
import Subjects from "./pages/Subjects";
import Viewer from "./pages/Viewer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
