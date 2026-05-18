import apiFetch from '@/api/client';
import BackButton from '@/components/BackButton';
import Navbar from '@/components/Navbar';
import SubjectCard from '@/components/SubjectCard';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import type { CategoryPageItem as Category, SubjectPageItem as Subject } from '@/interfaces/pages/subjects';
import { CheckCircle, IndianRupee, Loader2, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';


const Subjects = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [purchasedSubjects, setPurchasedSubjects] = useState<Set<string>>(new Set());
  const [lectureCounts, setLectureCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Purchase dialog state
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  const categoryFilter = searchParams.get('category') || 'all';
  const selectedCategoryId = searchParams.get('category');
  const [selectedCategory, setSelectedCategory] = useState<{ name: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, categoryFilter]);

  useEffect(() => {
    // Update selected category name when categories are loaded
    if (categories.length > 0 && selectedCategoryId && categoryFilter !== 'all') {
      const cat = categories.find(c => c.id === categoryFilter);
      if (cat) {
        setSelectedCategory({ name: cat.name });
      } else {
        setSelectedCategory(null);
      }
    } else {
      setSelectedCategory(null);
    }
  }, [categories, selectedCategoryId, categoryFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catsRes, subsRes] = await Promise.all([apiFetch('/categories'), apiFetch('/subjects')]);
      const catsBody = await catsRes.json();
      const subsBody = await subsRes.json();
      const cats = catsBody?.data || [];
      let subs = subsBody?.data || [];

      setCategories(cats);

      if (categoryFilter !== 'all') {
        subs = subs.filter((s: any) => s.category_id === categoryFilter || s.categories?.id === categoryFilter);
      }
      subs = subs.filter((s: any) => s.is_active === true || s.isActive === true || s.is_active === undefined);
      setSubjects(subs);

      // Fetch user's purchases
      if (user) {
        const purchasesRes = await apiFetch('/purchases');
        const purchasesBody = await purchasesRes.json();
        const purchases = purchasesBody?.data || [];
        const purchased = new Set<string>();
        purchases.forEach((p: any) => {
          const sid = p.subjectId || p.subjects?.id || p.lecture?.subjectId;
          if (sid) purchased.add(sid);
        });
        setPurchasedSubjects(purchased);
      }

      // Lecture counts per subject
      const lecturesRes = await apiFetch('/lectures');
      const lecturesBody = await lecturesRes.json();
      const lectures = lecturesBody?.data || [];
      const counts = new Map<string, number>();
      lectures.forEach((l: any) => {
        const sid = l.subject_id || l.subjectId || l.subjects?.id;
        if (sid) counts.set(sid, (counts.get(sid) || 0) + 1);
      });
      setLectureCounts(counts);
    } catch (e) {
      console.error('Failed to load subjects data', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = subjects.filter((sub) =>
    sub.name.toLowerCase().includes(search.toLowerCase()) ||
    sub.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handlePurchase = (subjectId: string, price: number) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (subject) {
      setSelectedSubject(subject);
      setPurchaseDialogOpen(true);
    }
  };

  const confirmPurchase = async () => {
    if (!selectedSubject || !user) return;
    
    setPurchasing(true);
    
    // Payment integration required - direct inserts are blocked for security
    // This should integrate with a payment gateway (Stripe/Razorpay) via edge function
    toast.info('Payment integration coming soon. Please contact support to complete your purchase.');
    setPurchaseDialogOpen(false);
    
    setPurchasing(false);
  };

  const handleViewLectures = (subjectId: string) => {
    const params = new URLSearchParams();
    params.set('subject', subjectId);
    if (categoryFilter !== 'all') {
      params.set('category', categoryFilter);
    }
    navigate(`/lectures?${params.toString()}`);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-4 mb-4">
            {selectedCategoryId && categoryFilter !== 'all' && (
              <BackButton to="/" label="Back to Categories" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {selectedCategory ? `${selectedCategory.name} - Subjects` : 'Browse Subjects'}
          </h1>
          <p className="text-muted-foreground">
            {selectedCategory 
              ? `Purchase subjects to unlock all lectures within them`
              : 'Purchase subjects to unlock all lectures within them'}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search subjects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select
            value={categoryFilter}
            onValueChange={(val) => setSearchParams({ category: val })}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Subjects Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredSubjects.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSubjects.map((sub, index) => (
              <div key={sub.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                <SubjectCard
                  id={sub.id}
                  name={sub.name}
                  description={sub.description}
                  price={sub.price}
                  categoryName={sub.categories?.name || 'Uncategorized'}
                  categoryColor={sub.categories?.color || null}
                  isPurchased={purchasedSubjects.has(sub.id)}
                  lectureCount={lectureCounts.get(sub.id) || 0}
                  onPurchase={handlePurchase}
                  onView={handleViewLectures}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            {search ? 'No subjects match your search.' : 'No subjects available yet.'}
          </div>
        )}
      </main>

      {/* Purchase Confirmation Dialog */}
      <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Purchase</DialogTitle>
            <DialogDescription>
              You are about to purchase access to this subject.
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubject && (
            <div className="py-4">
              <div className="p-4 rounded-lg bg-muted">
                <h3 className="font-semibold text-lg mb-1">{selectedSubject.name}</h3>
                {selectedSubject.description && (
                  <p className="text-sm text-muted-foreground mb-3">{selectedSubject.description}</p>
                )}
                <div className="flex items-center gap-2 text-2xl font-bold text-primary">
                  <IndianRupee className="w-6 h-6" />
                  {selectedSubject.price}
                </div>
              </div>
              
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Lifetime access to all lectures
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Secure, view-only content
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  One-time payment, no subscription
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPurchaseDialogOpen(false)} disabled={purchasing}>
              Cancel
            </Button>
            <Button onClick={confirmPurchase} disabled={purchasing} className="gap-2">
              {purchasing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <IndianRupee className="w-4 h-4" />
                  Confirm Purchase
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Subjects;
