import apiFetch from '@/api/client';
import BackButton from '@/components/BackButton';
import Navbar from '@/components/Navbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import type { Purchase } from '@/interfaces/pages/mypurchases';
import { Calendar, ChevronDown, ChevronUp, Loader2, Package, ScanSearch, ShieldCheck, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type RawCategory = {
  id?: string;
  name?: string;
  color?: string | null;
};

type RawSubject = {
  id?: string;
  name?: string;
  title?: string;
  description?: string | null;
  category?: RawCategory | null;
  categories?: RawCategory | null;
};

type RawPurchase = {
  id?: string;
  userId?: string;
  status?: string;
  createdAt?: string;
  purchased_at?: string;
  created_at?: string;
  amount?: number | string;
  amount_paid?: number | string;
  screenshotUrl?: string | null;
  screenshot_url?: string | null;
  adminNote?: string | null;
  admin_note?: string | null;
  reviewedAt?: string | null;
  reviewed_at?: string | null;
  reviewedBy?: { id?: string; name?: string; email?: string | null } | null;
  reviewed_by?: { id?: string; name?: string; email?: string | null } | null;
  subjectId?: string;
  subject?: RawSubject | null;
  lecture?: { subjectId?: string; subject?: RawSubject | null } | null;
};

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

const getStatusAccent = (status: Purchase['status']) => {
  switch (status) {
    case 'APPROVED':
    case 'COMPLETED':
      return 'border-emerald-300/60';
    case 'REJECTED':
      return 'border-red-400/60';
    default:
      return 'border-amber-300/60';
  }
};

const MyPurchases = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPurchaseId, setExpandedPurchaseId] = useState<string | null>(null);

  const toggleCard = (id: string) => {
    setExpandedPurchaseId((prev) => (prev === id ? null : id));
  };

  const fetchPurchases = useCallback(async () => {
    try {
      const currentUserId = user?.id;
      const res = await apiFetch('/purchases');
      const body = await res.json();
      const data = (body?.data || []) as RawPurchase[];

      const subjectsRes = await apiFetch('/subjects');
      const subjectsBody = await subjectsRes.json();
      const subjects = (subjectsBody?.data || []) as RawSubject[];
      const subjectMap = new Map<string, RawSubject>();

      subjects.forEach((subject) => {
        if (subject.id) {
          subjectMap.set(subject.id, subject);
        }
      });

      const normalized = data
        .map((purchase) => {
          if (!purchase?.id) return null;
          if (currentUserId && purchase.userId && purchase.userId !== currentUserId) return null;

          const subjectId = purchase.subjectId || purchase.subject?.id || purchase.lecture?.subjectId;
          const subject = subjectId
            ? subjectMap.get(subjectId) || purchase.subject || purchase.lecture?.subject || null
            : purchase.subject || purchase.lecture?.subject || null;

          return {
            id: purchase.id,
            status: String(purchase.status || 'PENDING').toUpperCase() as Purchase['status'],
            purchased_at: purchase.createdAt || purchase.purchased_at || purchase.created_at || new Date().toISOString(),
            amount_paid: Number(purchase.amount || purchase.amount_paid || 0),
            screenshot_url: purchase.screenshotUrl || purchase.screenshot_url || null,
            admin_note: purchase.adminNote || purchase.admin_note || null,
            reviewed_at: purchase.reviewedAt || purchase.reviewed_at || null,
            reviewed_by: purchase.reviewedBy || purchase.reviewed_by || null,
            subjects: subject && subject.id
              ? {
                  id: subject.id,
                  name: subject.name || subject.title || 'Subject',
                  description: subject.description || null,
                  categories: subject.categories || subject.category || null,
                }
              : null,
          } as Purchase;
        })
        .filter((item): item is Purchase => Boolean(item));

      setPurchases(normalized);
    } catch (error) {
      console.error('Failed to fetch purchases', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

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
  }, [user, fetchPurchases]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

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
          <BackButton to="/" label="Back to Home" className="mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">My Purchases</h1>
          <p className="text-muted-foreground">Track your payment proofs and see when access has been approved</p>
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
            {purchases.map((purchase, index) => {
              const isExpanded = expandedPurchaseId === purchase.id;
              const subjectId = purchase.subjects?.id;

              return (
                <Card
                  key={purchase.id}
                  className={`animate-slide-up overflow-hidden border-l-4 ${getStatusAccent(purchase.status)}`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <CardTitle className="text-lg">{purchase.subjects?.name || 'Subject purchase'}</CardTitle>
                          {purchase.subjects?.categories && (
                            <Badge
                              variant="secondary"
                              style={{
                                backgroundColor: purchase.subjects.categories.color ? `${purchase.subjects.categories.color}20` : undefined,
                                color: purchase.subjects.categories.color || undefined,
                              }}
                            >
                              {purchase.subjects.categories.name}
                            </Badge>
                          )}
                          <Badge variant={getStatusTone(purchase.status)}>{getStatusLabel(purchase.status)}</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Purchased: {formatDate(purchase.purchased_at)}
                          </span>
                          <span>₹{Number.isFinite(purchase.amount_paid) ? purchase.amount_paid.toLocaleString('en-IN') : 0}</span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleCard(purchase.id)}
                        aria-expanded={isExpanded}
                        className="shrink-0 gap-2 rounded-full border border-border/60 bg-background/80 px-3"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="border-t bg-muted/30 space-y-4">
                      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start mt-4">
                        <div className="space-y-3 text-sm text-muted-foreground">
                          <p className="flex items-center gap-2 text-foreground font-medium">
                            {purchase.status === 'REJECTED' ? (
                              <XCircle className="w-4 h-4 text-red-500" />
                            ) : purchase.status === 'APPROVED' || purchase.status === 'COMPLETED' ? (
                              <ShieldCheck className="w-4 h-4 text-green-500" />
                            ) : (
                              <ScanSearch className="w-4 h-4 text-amber-500" />
                            )}
                            <span>{getStatusLabel(purchase.status)}</span>
                          </p>

                          <p className="text-muted-foreground">
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
                            <p className="text-xs text-muted-foreground">
                              Reviewed by {purchase.reviewed_by.name} on {formatDate(purchase.reviewed_at)}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-2 pt-1">
                            <Button
                              variant="hero"
                              size="sm"
                              onClick={() => {
                                if (subjectId) {
                                  navigate(`/lectures?subject=${encodeURIComponent(subjectId)}`);
                                } else {
                                  navigate('/subjects');
                                }
                              }}
                            >
                              Open Subject
                            </Button>

                            {purchase.status === 'REJECTED' && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  if (subjectId) {
                                    navigate(`/subjects?purchaseSubject=${encodeURIComponent(subjectId)}`);
                                  } else {
                                    navigate('/subjects');
                                  }
                                }}
                              >
                                Resubmit Proof
                              </Button>
                            )}
                          </div>
                        </div>

                        {purchase.screenshot_url && (
                          <a href={purchase.screenshot_url} target="_blank" rel="noreferrer" className="block w-44 md:w-48 ml-0 md:ml-4">
                            <img
                              src={purchase.screenshot_url}
                              alt="Payment screenshot"
                              className="w-44 h-32 md:w-48 md:h-36 object-cover rounded-xl border shadow-sm"
                            />
                          </a>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyPurchases;
