import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import CategoryCard from '@/components/CategoryCard';
import { Button } from '@/components/ui/button';
import { BookOpen, Shield, Eye, Lock, ArrowRight, Loader2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
}

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCategories();
    }
  }, [user]);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data) setCategories(data);
    setLoadingCategories(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero">
      <Navbar />

      {!user ? (
        // Landing page for unauthenticated users
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center animate-slide-up">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl gradient-primary shadow-glow mb-8">
              <BookOpen className="w-10 h-10 text-primary-foreground" />
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Secure Lecture Notes for
              <span className="text-gradient-primary"> Serious Learners</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Access premium lecture materials for GATE CS, ML/AI, Freelancing, and more. 
              View-only protection ensures your learning materials stay exclusive.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button variant="hero" size="xl" onClick={() => navigate('/auth')}>
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button variant="glass" size="xl" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-6 mt-16">
              <div className="p-6 rounded-2xl gradient-card border border-border/50 shadow-soft">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Protected Content</h3>
                <p className="text-sm text-muted-foreground">
                  Advanced anti-screenshot and download protection keeps your materials secure.
                </p>
              </div>

              <div className="p-6 rounded-2xl gradient-card border border-border/50 shadow-soft">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                  <Eye className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">View-Only Access</h3>
                <p className="text-sm text-muted-foreground">
                  Students can view slides online but cannot download, print, or copy.
                </p>
              </div>

              <div className="p-6 rounded-2xl gradient-card border border-border/50 shadow-soft">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Watermarked</h3>
                <p className="text-sm text-muted-foreground">
                  Dynamic watermarks with user email and timestamp on every slide.
                </p>
              </div>
            </div>
          </div>
        </main>
      ) : (
        // Dashboard for authenticated users
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back{user.email ? `, ${user.email.split('@')[0]}` : ''}!
            </h1>
            <p className="text-muted-foreground">Browse lecture categories below</p>
          </div>

          {loadingCategories ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {categories.map((cat, index) => (
                <div key={cat.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                  <CategoryCard {...cat} />
                </div>
              ))}
            </div>
          )}

          {categories.length === 0 && !loadingCategories && (
            <div className="text-center py-12 text-muted-foreground">
              No categories available yet. Check back soon!
            </div>
          )}
        </main>
      )}
    </div>
  );
};

export default Index;
