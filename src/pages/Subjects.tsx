import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import SubjectCard from '@/components/SubjectCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import BackButton from '@/components/BackButton';
import { Search, Loader2, IndianRupee, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Subject {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string;
  categories: { name: string; color: string | null } | null;
}

interface Category {
  id: string;
  name: string;
}

interface LectureCount {
  subject_id: string;
  count: number;
}

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

    // Fetch categories
    const { data: cats } = await supabase.from('categories').select('id, name').order('name');
    if (cats) {
      setCategories(cats);
    }

    // Fetch subjects
    let query = supabase
      .from('subjects')
      .select('*, categories(name, color)')
      .eq('is_active', true)
      .order('name');

    if (categoryFilter !== 'all') {
      query = query.eq('category_id', categoryFilter);
    }

    const { data: subjectsData } = await query;
    if (subjectsData) setSubjects(subjectsData);

    // Fetch user's purchases
    if (user) {
      const { data: purchases } = await supabase
        .from('user_subject_purchases')
        .select('subject_id')
        .eq('user_id', user.id)
        .eq('payment_status', 'completed');
      
      if (purchases) {
        setPurchasedSubjects(new Set(purchases.map(p => p.subject_id)));
      }
    }

    // Fetch lecture counts per subject
    const { data: lectures } = await supabase
      .from('lectures')
      .select('subject_id')
      .eq('is_published', true)
      .not('subject_id', 'is', null);
    
    if (lectures) {
      const counts = new Map<string, number>();
      lectures.forEach(l => {
        if (l.subject_id) {
          counts.set(l.subject_id, (counts.get(l.subject_id) || 0) + 1);
        }
      });
      setLectureCounts(counts);
    }

    setLoading(false);
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
    
    // For now, we'll simulate a successful payment
    // In production, you'd integrate with a payment gateway here
    const { error } = await supabase.from('user_subject_purchases').insert({
      user_id: user.id,
      subject_id: selectedSubject.id,
      amount_paid: selectedSubject.price,
      payment_status: 'completed',
    });

    if (error) {
      toast.error('Purchase failed. Please try again.');
    } else {
      toast.success(`Successfully purchased ${selectedSubject.name}!`);
      setPurchasedSubjects(prev => new Set([...prev, selectedSubject.id]));
      setPurchaseDialogOpen(false);
    }
    
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
