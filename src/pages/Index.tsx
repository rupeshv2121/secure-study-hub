import apiFetch from '@/api/client';
import CategoryCard from '@/components/CategoryCard';
import LottieHero from '@/components/LottieHero';
import Navbar from '@/components/Navbar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import type { IndexCategory as Category } from '@/interfaces/pages/index';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Eye,
  FileText,
  Loader2,
  Lock,
  Shield,
  Star,
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
    if (user) {
      fetchCategories();
    }
  }, [user]);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await apiFetch('/categories');
      const body = await res.json();
      const categoriesData = body?.data || [];

      const res2 = await apiFetch('/subjects');
      const body2 = await res2.json();
      const subjectsData = ((body2?.data || []) as SubjectRecord[]).filter((subject) => subject.is_active === true || subject.isActive === true || subject.is_active === undefined);

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
        // Landing page for unauthenticated users
        <main id="home" className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
           
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                'linear-gradient(rgba(15, 23, 42, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.05) 1px, transparent 1px)',
              backgroundSize: '72px 72px',
            }}
          />

          <section className="container relative mx-auto px-4 py-16 md:py-8 max-w-[78rem]">
            <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
              <div className="mx-auto max-w-2xl lg:mx-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/85 px-4 text-sm font-medium text-foreground shadow-soft backdrop-blur-xl">
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  Learn with focus — secure, curated resources
                </div>

                <h1 className="mt-6 text-4xl font-semibold leading-[1.02] tracking-tight text-foreground md:text-6xl">
                  Concise notes and secure lectures for focused learning.
                </h1>

                <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
                  Clean notes, chapter-wise content and protected viewers — all in one place.
                </p>

                <div className="mt-8 flex gap-4">
                  <Button
                    variant="hero"
                    size="lg"
                    onClick={() => navigate('/auth')}
                    className="group bg-gradient-to-r from-[hsl(175,80%,35%)] to-[hsl(195,90%,45%)] text-white shadow-glow px-6 py-3"
                  >
                    Get Started Free
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-[420px] lg:max-w-none">
                <LottieHero className="absolute inset-0 -z-10" />
                <div className="absolute -inset-6 rounded-2xl bg-white/60 blur-sm" aria-hidden="true" />

                <div className="relative z-10 mx-auto max-w-[420px] rounded-2xl border border-foreground/6 bg-white/70 p-6 shadow-soft backdrop-blur-md md:p-6">
                  <div className="text-sm font-medium text-muted-foreground">Preview</div>
                  <div className="mt-3 h-48 rounded-lg bg-slate-950" />
                </div>
              </div>
            </div>
          </section>

          <section id="features" className="container mx-auto px-4 py-20 bg-transparent">
            <div className="max-w-6xl mx-auto">
              <div className="landing-section-heading mx-auto mb-16 max-w-3xl text-center">
                <h2 className="text-4xl md:text-5xl font-bold mb-4">
                  Why Choose <span className="text-gradient-primary">Out from Cumfurt?</span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Advanced security features protect your premium content while providing seamless access for learners.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                <div className="group p-8 rounded-2xl border border-border/50 bg-background/50 shadow-soft backdrop-blur-xl hover:shadow-glow transition-all hover:-translate-y-1">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Shield className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Protected Content</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Advanced anti-screenshot and download protection keeps your materials secure. Multiple layers of defense ensure content remains exclusive.
                  </p>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-center text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary mr-2" />
                      Screenshot detection
                    </li>
                    <li className="flex items-center text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary mr-2" />
                      Download prevention
                    </li>
                    <li className="flex items-center text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary mr-2" />
                      Print blocking
                    </li>
                  </ul>
                </div>

                <div className="group p-8 rounded-2xl border border-border/50 bg-background/50 shadow-soft backdrop-blur-xl hover:shadow-glow transition-all hover:-translate-y-1">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Eye className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">View-Only Access</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Students can view slides online but cannot download, print, or copy. Perfect for protecting your intellectual property.
                  </p>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-center text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary mr-2" />
                      Online viewing only
                    </li>
                    <li className="flex items-center text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary mr-2" />
                      Right-click disabled
                    </li>
                    <li className="flex items-center text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary mr-2" />
                      Text selection blocked
                    </li>
                  </ul>
                </div>

                <div className="group p-8 rounded-2xl border border-border/50 bg-background/50 shadow-soft backdrop-blur-xl hover:shadow-glow transition-all hover:-translate-y-1">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Lock className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Dynamic Watermarks</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Dynamic watermarks with user email and timestamp on every slide. Track usage and deter unauthorized sharing.
                  </p>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-center text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary mr-2" />
                      User identification
                    </li>
                    <li className="flex items-center text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary mr-2" />
                      Timestamp tracking
                    </li>
                    <li className="flex items-center text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary mr-2" />
                      Tamper-proof
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <section id="how-it-works" className="container mx-auto px-4 py-20 bg-transparent">
            <div className="max-w-5xl mx-auto">
              <div className="landing-section-heading mx-auto mb-16 max-w-3xl text-center">
                <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                  How It <span className="text-gradient-primary">Works</span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Get started in minutes. Access premium content with complete security and peace of mind.
                </p>
              </div>

              <div className="space-y-8">
                <div className="flex flex-col md:flex-row gap-8 items-center p-8 rounded-2xl border border-border/50 bg-background/50 shadow-soft backdrop-blur-xl hover:shadow-medium transition-all">
                  <div className="flex-shrink-0 w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground shadow-glow">
                    1
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-semibold text-foreground mb-2">Create Your Account</h3>
                    <p className="text-muted-foreground">
                      Sign up for free and get instant access to browse our extensive library of premium lecture materials.
                    </p>
                  </div>
                  <Users className="w-12 h-12 text-primary/30 flex-shrink-0" />
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-center p-8 rounded-2xl border border-border/50 bg-background/50 shadow-soft backdrop-blur-xl hover:shadow-medium transition-all">
                  <div className="flex-shrink-0 w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground shadow-glow">
                    2
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-semibold text-foreground mb-2">Browse Categories</h3>
                    <p className="text-muted-foreground">
                      Explore subjects like GATE CS, Machine Learning, AI, Freelancing, and more. Find exactly what you need.
                    </p>
                  </div>
                  <FileText className="w-12 h-12 text-primary/30 flex-shrink-0" />
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-center p-8 rounded-2xl border border-border/50 bg-background/50 shadow-soft backdrop-blur-xl hover:shadow-medium transition-all">
                  <div className="flex-shrink-0 w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground shadow-glow">
                    3
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-semibold text-foreground mb-2">Purchase & Access</h3>
                    <p className="text-muted-foreground">
                      Purchase the lectures you need and access them securely through our protected viewer. Your content is always safe.
                    </p>
                  </div>
                  <Shield className="w-12 h-12 text-primary/30 flex-shrink-0" />
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-center p-8 rounded-2xl border border-border/50 bg-background/50 shadow-soft backdrop-blur-xl hover:shadow-medium transition-all">
                  <div className="flex-shrink-0 w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground shadow-glow">
                    4
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-semibold text-foreground mb-2">Learn Securely</h3>
                    <p className="text-muted-foreground">
                      Study with confidence knowing your materials are protected. Access from any device, anywhere, anytime.
                    </p>
                  </div>
                  <BookOpen className="w-12 h-12 text-primary/30 flex-shrink-0" />
                </div>
              </div>
            </div>
          </section>

          {/* Testimonials Section */}
          <section id="testimonials" className="container mx-auto px-4 py-20 bg-transparent">
            <div className="max-w-6xl mx-auto">
              <div className="landing-section-heading mx-auto mb-16 max-w-3xl text-center">
                <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                  Loved by <span className="text-gradient-primary">Thousands</span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  See what students are saying about their learning experience.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl border border-border/50 bg-background/50 shadow-soft backdrop-blur-xl">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    "The best platform for GATE CS preparation. The security features are impressive and the content quality is outstanding."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold">
                      A
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">Amit Kumar</div>
                      <div className="text-sm text-muted-foreground">GATE Aspirant</div>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl border border-border/50 bg-background/50 shadow-soft backdrop-blur-xl">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    "Perfect for freelancers learning new skills. The ML/AI courses are comprehensive and the view-only protection is seamless."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold">
                      P
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">Priya Sharma</div>
                      <div className="text-sm text-muted-foreground">Freelancer</div>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl border border-border/50 bg-background/50 shadow-soft backdrop-blur-xl">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    "The secure viewing system is brilliant. I can access my lectures on any device without worrying about content security."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold">
                      R
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">Raj Patel</div>
                      <div className="text-sm text-muted-foreground">Student</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section id="faq" className="container mx-auto px-4 py-20 bg-transparent">
            <div className="max-w-3xl mx-auto">
              <div className="landing-section-heading mx-auto mb-16 max-w-3xl text-center">
                <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                  Frequently Asked <span className="text-gradient-primary">Questions</span>
                </h2>
                <p className="text-lg text-muted-foreground">
                  Everything you need to know about Out from Cumfurt.
                </p>
              </div>

              <Accordion type="single" collapsible className="w-full space-y-4">
                <AccordionItem value="item-1" className="rounded-xl border border-border/50 px-6 bg-background/50 shadow-soft backdrop-blur-xl">
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-semibold">How does the security protection work?</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Our platform uses multiple layers of security including anti-screenshot detection, download prevention, 
                    print blocking, and dynamic watermarks. Content is displayed in a secure viewer that prevents copying, 
                    saving, or sharing materials outside the platform.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="rounded-xl border border-border/50 px-6 bg-background/50 shadow-soft backdrop-blur-xl">
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-semibold">Can I access lectures on mobile devices?</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Yes! Out from Cumfurt is fully responsive and works seamlessly on desktop, tablet, and mobile devices. 
                    All security features are maintained across all platforms to ensure your content remains protected.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="rounded-xl border border-border/50 px-6 bg-background/50 shadow-soft backdrop-blur-xl">
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-semibold">What subjects are available?</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    We offer a wide range of subjects including GATE Computer Science, Machine Learning, Artificial Intelligence, 
                    Freelancing, Web Development, and more. New subjects and lectures are added regularly based on student demand.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="rounded-xl border border-border/50 px-6 bg-background/50 shadow-soft backdrop-blur-xl">
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-semibold">Is there a free trial available?</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Yes! You can sign up for free and browse our catalog. Some lectures offer free previews so you can 
                    experience the quality before making a purchase. Create your account today to get started.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="rounded-xl border border-border/50 px-6 bg-background/50 shadow-soft backdrop-blur-xl">
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-semibold">How do watermarks work?</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Each slide is dynamically watermarked with your registered email address and a timestamp when you access it. 
                    This helps track usage and deters unauthorized sharing. Watermarks are subtle but persistent, ensuring your 
                    content identity is always visible.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </section>

          {/* CTA Section */}
          <section className="container mx-auto px-4 py-20 bg-transparent">
            <div className="max-w-4xl mx-auto text-center p-12 rounded-3xl border border-border/40 bg-background/55 shadow-soft backdrop-blur-2xl">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Ready to Start Learning?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of students already learning on Out from Cumfurt. Get started today and access premium content securely.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="hero" 
                  size="xl" 
                  onClick={() => navigate('/auth')}
                  className="text-white hover:bg-background/70"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="xl" 
                  onClick={() => navigate('/auth')}
                  className="text-black hover:text-muted-foreground hover:bg-background/70"
                >
                  Sign In
                </Button>
              </div>
            </div>
          </section>

          {/* Footer */}
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
                  <p className="text-sm text-muted-foreground">
                    Secure lecture notes platform for serious learners. Protecting your premium content.
                  </p>
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
              <div className="pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
                © 2026 Out from Cumfurt. All rights reserved. Built for secure learning.
              </div>
            </div>
            </div>
          </footer>
        </main>
      ) : (
        // Dashboard for authenticated users
        <main className="container mx-auto px-4 py-8 max-w-[78rem]">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back{user.name ? `, ${user.name}` : ''}
            </h1>
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
