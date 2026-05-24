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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import type { CategoryPageItem as Category, SubjectPageItem as Subject } from '@/interfaces/pages/subjects';
import { AlertCircle, CheckCircle, IndianRupee, Loader2, QrCode, Search, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import paymentQrImage from '../../public/paymentQrImage.jpeg';
 
const paymentUpiId = import.meta.env.VITE_PAYMENT_UPI_ID as string | undefined;


const Subjects = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [approvedSubjects, setApprovedSubjects] = useState<Set<string>>(new Set());
  const [pendingSubjects, setPendingSubjects] = useState<Set<string>>(new Set());
  const [lectureCounts, setLectureCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Purchase dialog state
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [paymentNote, setPaymentNote] = useState('');

  const categoryFilter = searchParams.get('category') || 'all';
  const selectedCategoryId = searchParams.get('category');
  const [selectedCategory, setSelectedCategory] = useState<{ name: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    setApprovedSubjects(new Set());
    setPendingSubjects(new Set());

    if (user) {
      fetchData();
    }
  }, [user?.id, categoryFilter]);

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
    const activeUserId = user?.id;
    try {
      const [catsRes, subsRes] = await Promise.all([apiFetch('/categories'), apiFetch('/subjects')]);
      const catsBody = await catsRes.json();
      const subsBody = await subsRes.json();
      const cats = catsBody?.data || [];
      let subs = subsBody?.data || [];

      setCategories(cats);

      if (categoryFilter !== 'all') {
        subs = subs.filter((s: any) =>
          s.categoryId === categoryFilter ||
          s.category_id === categoryFilter ||
          s.category?.id === categoryFilter ||
          s.categories?.id === categoryFilter,
        );
      }
      subs = subs.filter((s: any) => s.is_active === true || s.isActive === true || s.is_active === undefined);
      setSubjects(
        subs.map((s: any) => ({
          ...s,
          name: s.name ?? s.title ?? '',
          category_id: s.categoryId ?? s.category_id ?? s.category?.id ?? s.categories?.id,
          categories: s.category ?? s.categories,
          price: typeof s.price === 'number' ? s.price : parseFloat(s.price || '') || 0,
        })),
      );

      // Fetch user's purchases
      if (activeUserId) {
        const purchasesRes = await apiFetch('/purchases');
        const purchasesBody = await purchasesRes.json();
        const purchases = purchasesBody?.data || [];
        const approved = new Set<string>();
        const pending = new Set<string>();
        purchases.forEach((p: any) => {
          if (p.userId && p.userId !== activeUserId) return;
          const sid = p.subjectId || p.subject?.id || p.lecture?.subjectId;
          if (!sid) return;
          const status = String(p.status || '').toUpperCase();
          if (status === 'APPROVED' || status === 'COMPLETED') {
            approved.add(sid);
          } else if (status === 'PENDING') {
            pending.add(sid);
          }
        });
        setApprovedSubjects(approved);
        setPendingSubjects(pending);
      }

      // Lecture counts per subject
      const lecturesRes = await apiFetch('/lectures');
      const lecturesBody = await lecturesRes.json();
      const lectures = lecturesBody?.data || [];
      const counts = new Map<string, number>();
      lectures.forEach((l: any) => {
        const sid = l.subject_id || l.subjectId || l.subjects?.id;
        if (sid) {
          counts.set(sid, (counts.get(sid) || 0) + 1);
        }
      });
      setLectureCounts(counts);

      // subject cards use the persisted subject price
      setSubjects((prev) => prev.map((s) => ({ ...s, price: s.price ?? 0 })));

      // If a purchaseSubject query param is present, auto-open the purchase dialog for that subject
      const purchaseSubjectId = searchParams.get('purchaseSubject');
      if (purchaseSubjectId) {
        const target = (subs || []).find((ss: any) => ss.id === purchaseSubjectId || ss.id === decodeURIComponent(purchaseSubjectId));
        if (target) {
          const subjectObj = {
            ...target,
            name: target.name ?? target.title ?? '',
            category_id: target.categoryId ?? target.category_id ?? target.category?.id ?? target.categories?.id,
            categories: target.category ?? target.categories,
            price: typeof target.price === 'number' ? target.price : parseFloat(target.price || '') || 0,
          };
          setSelectedSubject(subjectObj);
          setPaymentScreenshot(null);
          setPaymentNote('');
          setPurchaseDialogOpen(true);

          // remove the query param so it doesn't reopen repeatedly
          const newParams = new URLSearchParams(searchParams);
          newParams.delete('purchaseSubject');
          setSearchParams(newParams);
        }
      }
    } catch (e) {
      console.error('Failed to load subjects data', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = subjects.filter((sub) =>
    (sub.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    sub.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handlePurchase = (subjectId: string, price: number) => {
    if (approvedSubjects.has(subjectId)) {
      toast.info('This subject is already approved.');
      return;
    }

    if (pendingSubjects.has(subjectId)) {
      toast.info('Your payment proof is already under review.');
      return;
    }

    const subject = subjects.find(s => s.id === subjectId);
    if (subject) {
      setSelectedSubject(subject);
      setPaymentScreenshot(null);
      setPaymentNote('');
      setPurchaseDialogOpen(true);
    }
  };

  const confirmPurchase = async () => {
    if (!selectedSubject || !user) return;
    if (!paymentScreenshot) {
      toast.error('Please upload the payment screenshot.');
      return;
    }

    setPurchasing(true);

    try {
      const formData = new FormData();
      formData.append('subjectId', selectedSubject.id);
      formData.append('amount', String(selectedSubject.price || 0));
      formData.append('currency', 'INR');
      if (paymentNote.trim()) {
        formData.append('note', paymentNote.trim());
      }
      formData.append('screenshot', paymentScreenshot);

      const res = await apiFetch('/purchases', {
        method: 'POST',
        body: formData,
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.message || 'Failed to submit payment proof');
      }

      const subjectId = body?.data?.subjectId || selectedSubject.id;
      setPendingSubjects((prev) => new Set(prev).add(subjectId));
      setPurchaseDialogOpen(false);
      setSelectedSubject(null);
      setPaymentScreenshot(null);
      setPaymentNote('');
      toast.success('Payment proof submitted for admin review.');
    } catch (error) {
      console.error('Failed to submit payment proof', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit payment proof');
    } finally {
      setPurchasing(false);
    }
  };

  const closePurchaseDialog = () => {
    if (purchasing) return;
    setPurchaseDialogOpen(false);
    setSelectedSubject(null);
    setPaymentScreenshot(null);
    setPaymentNote('');
  };

  const handleViewLectures = (subjectId: string) => {
    const params = new URLSearchParams({ subject: subjectId });
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

      <main className="container mx-auto px-4 py-8 max-w-[78rem]">
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
                  purchaseState={approvedSubjects.has(sub.id) ? 'approved' : pendingSubjects.has(sub.id) ? 'pending' : 'available'}
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

      {/* Purchase Request Dialog */}
      <Dialog open={purchaseDialogOpen} onOpenChange={(open) => (open ? setPurchaseDialogOpen(true) : closePurchaseDialog())}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send Payment Proof</DialogTitle>
            <DialogDescription>
              Pay using the QR code below, upload the screenshot, and we will ask admin to verify it before access is unlocked.
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubject && (
            <div className="py-3 space-y-4">
              <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
                <div className="p-3 rounded-xl border bg-muted/40">
                  <h3 className="font-semibold text-lg mb-1">{selectedSubject.name}</h3>
                  {selectedSubject.description && (
                    <p className="text-sm text-muted-foreground mb-3">{selectedSubject.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-2xl font-bold text-primary">
                    <IndianRupee className="w-6 h-6" />
                    {selectedSubject.price}
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    After verification, admin will approve this subject and unlock all lectures.
                  </p>
                </div>
                <div className="p-3 rounded-xl border bg-background flex flex-col items-center justify-center text-center gap-2">
                  <div className="w-40 h-40 rounded-2xl border bg-muted/30 flex items-center justify-center overflow-hidden">
                    {paymentQrImage ? (
                      <img src={paymentQrImage} alt="Payment QR code" className="w-full h-full object-cover" />
                    ) : (
                      <div className="px-4">
                        <QrCode className="w-12 h-12 text-muted-foreground mx-auto " />
                        <p className="text-xs text-muted-foreground">
                          UPI id : rupesh2108@cnrb
                        </p>
                      </div>
                    )}
                  </div>
                  {paymentUpiId && (
                    <p className="text-xs text-muted-foreground">
                      UPI ID: <span className="font-medium text-foreground">{paymentUpiId}</span>
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Make the payment, then upload the receipt screenshot below.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="paymentScreenshot">Payment screenshot</Label>
                  <Input
                    id="paymentScreenshot"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPaymentScreenshot(e.target.files?.[0] || null)}
                  />
                  {paymentScreenshot && (
                    <p className="text-xs text-muted-foreground">Selected file: {paymentScreenshot.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentNote">Note for admin</Label>
                  <Textarea
                    id="paymentNote"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    placeholder="Transaction ID, payment time, or any extra detail"
                    rows={3}
                  />
                </div>

                <div className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground space-y-1.5">
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <AlertCircle className="w-4 h-4 text-primary" />
                    Before submitting
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Admin reviews the screenshot manually.
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Access is unlocked only after approval.
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closePurchaseDialog} disabled={purchasing}>
              Cancel
            </Button>
            <Button onClick={confirmPurchase} disabled={purchasing} className="gap-2">
              {purchasing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Submit Proof
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
