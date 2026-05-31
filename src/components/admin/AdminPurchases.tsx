import apiFetch from '@/api/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import type { AdminPurchaseRequest } from '@/interfaces/admin';
import { CheckCircle2, ChevronDown, CircleSlash, Loader2, ScanSearch, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

const getStatusLabel = (status: AdminPurchaseRequest['status']) => {
  switch (status) {
    case 'APPROVED':
    case 'COMPLETED':
      return 'Approved';
    case 'REJECTED':
      return 'Rejected';
    default:
      return 'Pending';
  }
};

const getStatusVariant = (status: AdminPurchaseRequest['status']) => {
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

const AdminPurchases = () => {
  const [requests, setRequests] = useState<AdminPurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [zoomedScreenshot, setZoomedScreenshot] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/purchases');
      const body = await res.json();
      const requestsData = body?.data || [];
      // Try to enrich requests with subject data when the API doesn't include it.
      try {
        const subsRes = await apiFetch('/subjects?includeInactive=true');
        const subsBody = await subsRes.json();
        const subs = subsBody?.data || [];
        const subjectMap = new Map<string, any>();
        subs.forEach((s: any) => {
          if (s) {
            if (s.id != null) subjectMap.set(String(s.id), s);
            if ((s as any)._id != null) subjectMap.set(String((s as any)._id), s);
          }
        });

        // helper to extract any likely subject id variant from a request
        const extractSubjectId = (r: any) => {
          const candidates = [
            r.subjectId,
            r.subject_id,
            r.subject?.id,
            r.subject?._id,
            r.lecture?.subjectId,
            r.lecture?.subject_id,
            r.lecture?.subject?.id,
            r.lecture?.subject?._id,
            r.lecture?.subjects?.id,
            r.lecture?.subjects?._id,
          ];
          for (const c of candidates) {
            if (c != null) return String(c);
          }
          return null;
        };

        const enriched = requestsData.map((r: any) => {
          if (!r.subject) {
            const subId = extractSubjectId(r);
            if (subId && subjectMap.has(subId)) {
              return { ...r, subject: subjectMap.get(subId) };
            }
            // Log unresolved mapping to help debugging in the browser console
            console.debug('AdminPurchases: could not resolve subject for request', { request: r, extractedSubjectId: subId });
          }
          return r;
        });

        console.debug('AdminPurchases: purchases fetched', { requestsData });
        console.debug('AdminPurchases: subjects fetched', { subsCount: subs.length });
        setRequests(enriched);
      } catch (e) {
        // If subjects fetch fails, fall back to raw requests
        console.error('Failed to enrich requests with subjects', e);
        setRequests(requestsData);
      }
      setExpandedId((current) => current && body?.data?.some((item: AdminPurchaseRequest) => item.id === current) ? current : null);
    } catch (error) {
      console.error('Failed to load purchase requests', error);
      toast.error('Failed to load purchase requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const sortedRequests = useMemo(() => {
    return [...requests].sort((a, b) => {
      const aPending = a.status === 'PENDING' ? 0 : 1;
      const bPending = b.status === 'PENDING' ? 0 : 1;
      if (aPending !== bPending) return aPending - bPending;
      return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
    });
  }, [requests]);

  const reviewRequest = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setBusyId(id);
    try {
      const res = await apiFetch(`/purchases/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNote: notes[id] || '' }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.message || 'Failed to review request');
      }

      setRequests((prev) => prev.map((item) => (item.id === id ? body.data : item)));
      toast.success(status === 'APPROVED' ? 'Request approved' : 'Request rejected');
    } catch (error) {
      console.error('Failed to review purchase request', error);
      toast.error(error instanceof Error ? error.message : 'Failed to review request');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading purchase requests...
      </div>
    );
  }

  if (sortedRequests.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No purchase requests yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Purchase Reviews</h2>
          <p className="text-sm text-muted-foreground">Approve or reject student payment screenshots.</p>
        </div>
        <Button variant="outline" onClick={fetchRequests} className="gap-2">
          <ScanSearch className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {sortedRequests.map((request) => (
          <Card key={request.id} className="overflow-hidden">
            <CardHeader className="space-y-3">
              <button
                type="button"
                onClick={() => setExpandedId((current) => (current === request.id ? null : request.id))}
                className="flex w-full flex-wrap items-start justify-between gap-3 text-left"
              >
                <div>
                  <CardTitle className="text-lg">{request.user?.name || 'Unknown student'}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {request.user?.email ? request.user.email : 'No email'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={getStatusVariant(request.status)}>{getStatusLabel(request.status)}</Badge>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedId === request.id ? 'rotate-180' : ''}`} />
                </div>
              </button>
              <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                <span>Amount: ₹{request.amount}</span>
                {request.currency && <span>Currency: {request.currency}</span>}
                {request.reviewedBy?.name && <span>Reviewed by: {request.reviewedBy.name}</span>}
              </div>
            </CardHeader>

            {expandedId === request.id && (
              <CardContent className="grid gap-4 lg:grid-cols-[280px_1fr]">
                <div className="space-y-3">
                  <div className="rounded-xl border bg-muted/30 p-4 mb-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Subject</p>
                    <p className="mt-1 text-base font-semibold text-foreground">
                      {request.subject?.name || request.subject?.title || request.subject || request.lecture?.title || 'Unknown subject'}
                    </p>
                  </div>
                  {request.screenshotUrl ? (
                    <button
                      type="button"
                      onClick={() => setZoomedScreenshot(request.screenshotUrl || null)}
                      className="block w-full overflow-hidden rounded-xl border text-left transition-transform hover:scale-[1.01]"
                    >
                      <img
                        src={request.screenshotUrl}
                        alt="Payment screenshot"
                        className="h-56 w-full object-cover"
                      />
                    </button>
                  ) : (
                    <div className="flex h-56 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
                      No screenshot available
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      Review checklist
                    </div>
                    <p className="mt-2">Confirm the screenshot, verify the amount, then approve to unlock subject access.</p>
                    {request.adminNote && (
                      <p className="mt-3 rounded-lg border bg-background p-3 text-foreground">
                        Existing note: {request.adminNote}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3">
                     <Textarea
                    placeholder="Admin note"
                    value={notes[request.id] ?? request.adminNote ?? ''}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [request.id]: e.target.value }))}
                    rows={4}
                  />
                    <Button
                      onClick={() => reviewRequest(request.id, 'APPROVED')}
                      disabled={busyId === request.id || request.status === 'APPROVED'}
                      className="gap-2"
                    >
                      {busyId === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => reviewRequest(request.id, 'REJECTED')}
                      disabled={busyId === request.id || request.status === 'REJECTED'}
                      className="gap-2"
                    >
                      {busyId === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CircleSlash className="w-4 h-4" />}
                      Reject
                    </Button>

                   
                  </div>

                  {request.reviewedAt && (
                    <p className="text-xs text-muted-foreground">
                      Reviewed on {new Date(request.reviewedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <Dialog open={Boolean(zoomedScreenshot)} onOpenChange={(open) => !open && setZoomedScreenshot(null)}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden sm:rounded-2xl">
          <DialogHeader className="border-b px-4 py-3 text-left">
            <DialogTitle>Payment Screenshot</DialogTitle>
          </DialogHeader>
          <div className="max-h-[80vh] overflow-auto bg-black/90 p-4">
            {zoomedScreenshot && (
              <img
                src={zoomedScreenshot}
                alt="Zoomed payment screenshot"
                className="mx-auto max-h-[75vh] w-auto max-w-full rounded-lg shadow-2xl"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPurchases;