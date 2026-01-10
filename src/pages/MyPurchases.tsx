import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import BackButton from '@/components/BackButton';
import { Badge } from '@/components/ui/badge';
import { Loader2, BookOpen, Calendar, ChevronRight, Package } from 'lucide-react';

interface Purchase {
  id: string;
  purchased_at: string;
  amount_paid: number;
  subjects: {
    id: string;
    name: string;
    description: string | null;
    categories: {
      name: string;
      color: string | null;
    } | null;
  } | null;
}

interface Lecture {
  id: string;
  title: string;
  description: string | null;
  is_free_preview: boolean;
  created_at: string;
}

const MyPurchases = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [subjectLectures, setSubjectLectures] = useState<Record<string, Lecture[]>>({});
  const [loadingLectures, setLoadingLectures] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchPurchases();
    }
  }, [user]);

  const fetchPurchases = async () => {
    const { data, error } = await supabase
      .from('user_subject_purchases')
      .select(`
        id,
        purchased_at,
        amount_paid,
        subjects (
          id,
          name,
          description,
          categories (
            name,
            color
          )
        )
      `)
      .eq('user_id', user!.id)
      .eq('payment_status', 'completed')
      .order('purchased_at', { ascending: false });

    if (!error && data) {
      setPurchases(data);
    }
    setLoading(false);
  };

  const fetchLecturesForSubject = async (subjectId: string) => {
    if (subjectLectures[subjectId]) {
      setExpandedSubject(expandedSubject === subjectId ? null : subjectId);
      return;
    }

    setLoadingLectures(subjectId);
    setExpandedSubject(subjectId);

    const { data } = await supabase
      .from('lectures')
      .select('id, title, description, is_free_preview, created_at')
      .eq('subject_id', subjectId)
      .eq('is_published', true)
      .order('created_at', { ascending: true });

    if (data) {
      setSubjectLectures((prev) => ({ ...prev, [subjectId]: data }));
    }
    setLoadingLectures(null);
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
            Access all subjects you've purchased with their lectures
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
              <p className="text-muted-foreground mb-4">You haven't purchased any subjects yet.</p>
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
                <CardHeader
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => purchase.subjects && fetchLecturesForSubject(purchase.subjects.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">{purchase.subjects?.name}</CardTitle>
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
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Purchased: {formatDate(purchase.purchased_at)}
                        </span>
                        <span>₹{purchase.amount_paid}</span>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 text-muted-foreground transition-transform ${
                        expandedSubject === purchase.subjects?.id ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                </CardHeader>

                {expandedSubject === purchase.subjects?.id && (
                  <CardContent className="border-t bg-muted/30">
                    {loadingLectures === purchase.subjects?.id ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="space-y-2 py-2">
                        {subjectLectures[purchase.subjects?.id || '']?.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No lectures available for this subject yet.
                          </p>
                        ) : (
                          subjectLectures[purchase.subjects?.id || '']?.map((lecture, idx) => (
                            <div
                              key={lecture.id}
                              className="flex items-center justify-between p-3 rounded-lg bg-background hover:bg-accent transition-colors cursor-pointer"
                              onClick={() => navigate(`/viewer/${lecture.id}`)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                                  {idx + 1}
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">{lecture.title}</p>
                                  {lecture.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-1">
                                      {lecture.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {lecture.is_free_preview && (
                                  <Badge variant="outline" className="text-xs">
                                    Free
                                  </Badge>
                                )}
                                <BookOpen className="w-4 h-4 text-muted-foreground" />
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyPurchases;
