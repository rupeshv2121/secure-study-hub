import apiFetch from '@/api/client';
import BackButton from '@/components/BackButton';
import Navbar from '@/components/Navbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import type { Purchase } from '@/interfaces/pages/mypurchases';
import { Calendar, Loader2, Package, ScanSearch, ShieldCheck, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const getStatusLabel = (status: Purchase['status']) => {
  switch (status) {
    case 'APPROVED':
    case 'COMPLETED':
      return 'Approved';
    case 'REJECTED':
      return 'Rejected';
    default:
      return 'Pending review';
  }
};

const getStatusTone = (status: Purchase['status']) => {
  switch (status) {
    case 'APPROVED':
    case 'COMPLETED':
      return 'default';
    case 'REJECTED':
      return 'destructive';
    default:
      return 'secondary';
  }
};


const MyPurchases = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    setPurchases([]);

    if (user) {
      fetchPurchases();
    }
  }, [user?.id]);

  const fetchPurchases = async () => {
    try {
      const currentUserId = user?.id;
      const res = await apiFetch('/purchases');
      const body = await res.json();
      const data = body?.data || [];

      // Fetch subjects map to enrich purchases
      const subjectsRes = await apiFetch('/subjects');
      const subjectsBody = await subjectsRes.json();
      const subjects = subjectsBody?.data || [];
      const subjectMap = new Map(subjects.map((s: any) => [s.id, s]));

      const normalized = data.map((p: any) => {
        if (currentUserId && p.userId && p.userId !== currentUserId) {
          return null;
        }
        const subjectId = p.subjectId || p.subject?.id || p.lecture?.subjectId;
        const subject = subjectMap.get(subjectId) || p.subject || p.lecture?.subject || null;
        return {
          id: p.id,
          status: String(p.status || 'PENDING').toUpperCase(),
          purchased_at: p.createdAt || p.purchased_at || p.created_at,
          amount_paid: p.amount || p.amount_paid || 0,
          screenshot_url: p.screenshotUrl || p.screenshot_url || null,
          admin_note: p.adminNote || p.admin_note || null,
          reviewed_at: p.reviewedAt || p.reviewed_at || null,
          reviewed_by: p.reviewedBy || p.reviewed_by || null,
          subjects: subject
            ? {
                id: subject.id,
                name: subject.name || subject.title || 'Subject',
                description: subject.description || null,
                categories: subject.categories || subject.category || null,
              }
            : null,
        };
          }).filter(Boolean) as Purchase[];

      setPurchases(normalized);
    } catch (e) {
      console.error('Failed to fetch purchases', e);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
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
          <BackButton to="/" label="Back to Home" className="mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">My Purchases</h1>
          <p className="text-muted-foreground">
            Track your payment proofs and see when access has been approved
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : purchases.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">You haven't submitted any purchase requests yet.</p>
              <Button onClick={() => navigate('/subjects')}>Browse Subjects</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {purchases.map((purchase, index) => (
              <Card
                key={purchase.id}
                className="animate-slide-up overflow-hidden"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">{purchase.subjects?.name || 'Subject purchase'}</CardTitle>
                        {purchase.subjects?.categories && (
                          <Badge
                            variant="secondary"
                            style={{
                              backgroundColor: purchase.subjects.categories.color
                                ? `${purchase.subjects.categories.color}20`
                                : undefined,
                              color: purchase.subjects.categories.color || undefined,
                            }}
                          >
                            {purchase.subjects.categories.name}
                          </Badge>
                        )}
                        <Badge variant={getStatusTone(purchase.status)}>
                          {getStatusLabel(purchase.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Purchased: {formatDate(purchase.purchased_at)}
                        </span>
                        <span>₹{purchase.amount_paid}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="border-t bg-muted/30 space-y-4">
                  <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2 text-foreground font-medium">
                        {purchase.status === 'REJECTED' ? (
                          <XCircle className="w-4 h-4 text-red-500" />
                        ) : purchase.status === 'APPROVED' || purchase.status === 'COMPLETED' ? (
                          <ShieldCheck className="w-4 h-4 text-green-500" />
                        ) : (
                          <ScanSearch className="w-4 h-4 text-amber-500" />
                        )}
                        {getStatusLabel(purchase.status)}
                      </p>
                      <p>
                        {purchase.status === 'APPROVED' || purchase.status === 'COMPLETED'
                          ? 'Your payment proof has been verified and access is unlocked.'
                          : purchase.status === 'REJECTED'
                            ? 'Admin rejected this request. Check the note below and submit again if needed.'
                            : 'Admin has not reviewed this proof yet.'}
                      </p>
                      {purchase.admin_note && (
                        <p className="rounded-lg border bg-background px-3 py-2 text-foreground">
                          {purchase.admin_note}
                        </p>
                      )}
                      {purchase.reviewed_by && purchase.reviewed_at && (
                        <p>
                          Reviewed by {purchase.reviewed_by.name} on {formatDate(purchase.reviewed_at)}
                        </p>
                      )}
                    </div>
                    {purchase.screenshot_url && (
                      <a href={purchase.screenshot_url} target="_blank" rel="noreferrer" className="block w-40">
                        <img src={purchase.screenshot_url} alt="Payment screenshot" className="w-40 h-28 object-cover rounded-xl border" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyPurchases;
