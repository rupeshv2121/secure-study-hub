import apiFetch from '@/api/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ChevronDown, CircleSlash, Loader2, MessageSquare, RefreshCw, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type FeedbackRecord = {
  id: string;
  name?: string | null;
  email?: string | null;
  rating: number;
  message: string;
  subjectId?: string | null;
  isPublic: boolean;
  approved: boolean;
  createdAt: string;
};

const getStatusLabel = (feedback: FeedbackRecord) => {
  if (feedback.approved && feedback.isPublic) return 'Approved';
  if (!feedback.approved && feedback.isPublic) return 'Pending';
  return 'Hidden';
};

const getStatusVariant = (feedback: FeedbackRecord) => {
  if (feedback.approved && feedback.isPublic) return 'default';
  if (!feedback.approved && feedback.isPublic) return 'secondary';
  return 'destructive';
};

const renderStars = (rating: number) => {
  return Array.from({ length: 5 }, (_, index) => index + 1).map((value) => (
    <Star key={value} className={`h-4 w-4 ${value <= rating ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground/30'}`} />
  ));
};

const AdminFeedback = () => {
  const [items, setItems] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/feedbacks');
      const body = await res.json();
      setItems(body?.data || []);
      setExpandedId((current) => current && body?.data?.some((item: FeedbackRecord) => item.id === current) ? current : null);
    } catch (error) {
      console.error('Failed to load feedback', error);
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const aPending = a.approved ? 1 : 0;
      const bPending = b.approved ? 1 : 0;
      if (aPending !== bPending) return aPending - bPending;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [items]);

  const reviewFeedback = async (id: string, approved: boolean) => {
    setBusyId(id);
    try {
      const res = await apiFetch(`/feedbacks/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.message || 'Failed to update feedback');
      }

      setItems((prev) => prev.map((item) => (item.id === id ? body.data : item)));
      toast.success(approved ? 'Feedback approved' : 'Feedback hidden');
    } catch (error) {
      console.error('Failed to review feedback', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update feedback');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading feedback...
      </div>
    );
  }

  if (sortedItems.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No feedback submissions yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Feedback Approval</h2>
          <p className="text-sm text-muted-foreground">Review student feedback and publish the best submissions.</p>
        </div>

        <Button variant="outline" onClick={fetchFeedback} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {sortedItems.map((feedback) => (
          <Card key={feedback.id} className="overflow-hidden">
            <CardHeader className="space-y-3">
              <button
                type="button"
                onClick={() => setExpandedId((current) => (current === feedback.id ? null : feedback.id))}
                className="flex w-full flex-wrap items-start justify-between gap-3 text-left"
              >
                <div>
                  <CardTitle className="text-lg">{feedback.name || 'Anonymous student'}</CardTitle>
                  <p className="text-sm text-muted-foreground">{feedback.email || 'No email provided'}</p>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant={getStatusVariant(feedback) as any}>{getStatusLabel(feedback)}</Badge>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedId === feedback.id ? 'rotate-180' : ''}`} />
                </div>
              </button>

              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">{renderStars(feedback.rating)}</div>
                <span>•</span>
                <span>{new Date(feedback.createdAt).toLocaleString()}</span>
              </div>
            </CardHeader>

            {expandedId === feedback.id && (
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    Feedback message
                  </div>
                  <p className="text-sm leading-7 text-muted-foreground">{feedback.message}</p>
                  {feedback.subjectId && (
                    <p className="mt-3 text-xs text-muted-foreground">Subject ID: {feedback.subjectId}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => reviewFeedback(feedback.id, true)}
                    disabled={busyId === feedback.id || (feedback.approved && feedback.isPublic)}
                    className="gap-2"
                  >
                    {busyId === feedback.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Approve
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => reviewFeedback(feedback.id, false)}
                    disabled={busyId === feedback.id || (!feedback.approved && !feedback.isPublic)}
                    className="gap-2"
                  >
                    {busyId === feedback.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CircleSlash className="h-4 w-4" />}
                    Hide
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminFeedback;