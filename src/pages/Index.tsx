import apiFetch from '@/api/client';
import CategoryCard from '@/components/CategoryCard';
import FAQSection from '@/components/FAQSection';
import FeatureGrid from '@/components/FeatureGrid';
import FeedbackFab from '@/components/FeedbackFab';
import LandingHero from '@/components/LandingHero';
import Navbar from '@/components/Navbar';
import Testimonials from '@/components/Testimonials';
import { Button } from '@/components/ui/button';
import YouTubeSection from '@/components/YouTubeSection';
import { useAuth } from '@/contexts/AuthContext';
import type { IndexCategory as Category } from '@/interfaces/pages/index';
import { ArrowRight, BookOpen, CreditCard, Download, Loader2, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const steps = [
  {
    icon: Search,
    title: 'Browse & pick',
    desc: 'Explore subjects by category and choose the notes or lectures you need.',
  },
  {
    icon: CreditCard,
    title: 'Purchase',
    desc: 'Complete your purchase — it is reviewed and approved within 24 hours.',
  },
  {
    icon: Download,
    title: 'Download & study',
    desc: 'Your content unlocks in your account. Download it and study offline, anytime.',
  },
];

type SubjectRecord = {
  is_active?: boolean;
  isActive?: boolean;
  categoryId?: string;
  category_id?: string;
  category?: { id?: string | null } | null;
  categories?: { id?: string | null } | null;
};

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    if (user) fetchCategories();
  }, [user]);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await apiFetch('/categories');
      const body = await res.json();
      const categoriesData = body?.data || [];

      const res2 = await apiFetch('/subjects');
      const body2 = await res2.json();
      const subjectsData = ((body2?.data || []) as SubjectRecord[]).filter(
        (subject) => subject.is_active === true || subject.isActive === true || subject.is_active === undefined
      );

      const subjectCounts = new Map<string, number>();
      subjectsData.forEach((subject) => {
        const cid = subject.categoryId || subject.category_id || subject.category?.id || subject.categories?.id;
        const count = subjectCounts.get(cid) || 0;
        subjectCounts.set(cid, count + 1);
      });

      const categoriesWithCounts = categoriesData.map((category: Category) => ({
        ...category,
        subject_count: subjectCounts.get(category.id) || 0,
      }));

      setCategories(categoriesWithCounts);
    } catch (e) {
      console.error('Failed to fetch categories', e);
    } finally {
      setLoadingCategories(false);
    }
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
        <main className="animate-fade-in">
          <LandingHero />
          <FeatureGrid />

          {/* How it works */}
          <section id="how-it-works" className="container mx-auto max-w-6xl px-4 py-20">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                How it works
              </span>
              <h2 className="mt-3 text-3xl font-bold text-foreground md:text-4xl">
                From browsing to studying in three steps
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className="relative rounded-2xl border border-border/50 bg-background/60 p-8 text-center shadow-soft backdrop-blur-sm"
                >
                  <span className="absolute right-5 top-4 text-5xl font-bold text-primary/10">
                    {index + 1}
                  </span>
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{step.title}</h3>
                  <p className="text-sm leading-6 text-muted-foreground">{step.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <YouTubeSection />
          <Testimonials />
          <FAQSection />

          {/* Final CTA */}
          <section className="container mx-auto px-4 py-20">
            <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl gradient-primary p-10 text-center shadow-medium sm:p-14">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl"
              />
              <div className="relative">
                <h2 className="text-3xl font-bold text-primary-foreground md:text-4xl">
                  Ready to start learning?
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/85">
                  Join students already learning on Out from Cumfurt. Get started today, purchase the
                  notes you need, and download them to keep.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                  <Button
                    variant="glass"
                    size="xl"
                    onClick={() => navigate('/auth')}
                    className="bg-white text-primary hover:bg-white/90"
                  >
                    Get Started Free
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="xl"
                    onClick={() => navigate('/auth')}
                    className="border-white/60 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
                  >
                    Sign In
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <footer className="site-footer">
            <div className="container mx-auto px-4 py-12 border-t border-border/30">
              <div className="max-w-6xl mx-auto">
                <div className="grid md:grid-cols-4 gap-8 mb-8">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <span className="font-bold text-lg text-foreground">Out from Cumfurt</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Curated notes and recorded lectures for serious learners. Buy what you need and download it to keep.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-4">Platform</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
                      <li><a href="#" className="hover:text-foreground transition-colors">Security</a></li>
                      <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-4">Resources</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                      <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
                      <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-4">Legal</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                      <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
                      <li><a href="#" className="hover:text-foreground transition-colors">Cookie Policy</a></li>
                    </ul>
                  </div>
                </div>
                <div className="pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">© 2026 Out from Cumfurt. All rights reserved.</div>
              </div>
            </div>
          </footer>
        </main>
      ) : (
        <main className="container mx-auto px-4 py-8 max-w-[78rem]">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back{user.name ? `, ${user.name}` : ''}</h1>
            <p className="text-muted-foreground">Browse categories below</p>
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
            <div className="text-center py-12 text-muted-foreground">No categories available yet. Check back soon!</div>
          )}
        </main>
      )}
      <FeedbackFab />
    </div>
  );
};

export default Index;
                        

