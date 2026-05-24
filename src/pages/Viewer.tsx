import apiFetch from '@/api/client';
import BackButton from '@/components/BackButton';
import Navbar from '@/components/Navbar';
import SecureViewer from '@/components/SecureViewer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useSubjectAccess } from '@/hooks/useSubjectAccess';
import type { LectureViewerLecture as Lecture, Slide } from '@/interfaces/pages/viewer';
import { Loader2, Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';


const Viewer = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, loading: accessLoading } = useSubjectAccess();
  const navigate = useNavigate();
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && id && !accessLoading) {
      fetchLecture();
    }
  }, [user, id, accessLoading]);

  const fetchLecture = async () => {
    setLoading(true);
    setAccessDenied(false);
    try {
      const res = await apiFetch(`/lectures/${id}`);
      const body = await res.json();
      const lec = body?.data || null;
      if (lec) {
        const subjectId = lec.subjectId || lec.subject_id || lec.subject?.id || null;
        const canView = hasAccess(subjectId, lec.isFreePreview || lec.is_free_preview || false);
        if (!canView) {
          setLecture(lec);
          setSlides([]);
          setAccessDenied(true);
          return;
        }

        setLecture(lec);
        await logView();
      }

      const slidesRes = await apiFetch(`/lecture-slides?lectureId=${encodeURIComponent(String(id))}`);
      if (!slidesRes.ok) {
        if (slidesRes.status === 403) {
          setSlides([]);
          setAccessDenied(true);
          return;
        }
        throw new Error('Failed to load lecture slides');
      }
      const slidesBody = await slidesRes.json();
      setSlides((slidesBody?.data || []).map((slide: any) => ({
        ...slide,
        storage_path: slide.storage_path ?? slide.storagePath,
        slide_number: slide.slide_number ?? slide.slideNumber,
      })));
    } catch (e) {
      console.error('Failed to fetch lecture or slides', e);
    } finally {
      setLoading(false);
    }
  };

  const logView = async () => {
    if (user && id) {
      try {
        await apiFetch('/view-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lectureId: id }),
        });
      } catch (e) {
        console.error('Failed to log view', e);
      }
    }
  };

  if (authLoading || accessLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="min-h-screen gradient-hero">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Lecture not found</h1>
          <Button onClick={() => navigate('/subjects')}>Back to Subjects</Button>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen gradient-hero">
        <Navbar />
        <main className="container mx-auto px-4 py-16 max-w-lg">
          <div className="mx-auto max-w-lg rounded-2xl border bg-background/80 p-8 text-center shadow-soft">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
              <Lock className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Access pending</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              This lecture is locked until your subject purchase request is approved.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button onClick={() => navigate('/subjects')}>Go to Subjects</Button>
              <Button variant="outline" onClick={() => navigate('/my-purchases')}>View Requests</Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero no-print">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <BackButton to="/subjects" label="Back to Subjects" className="mb-4" />

        <div className="mb-6 animate-fade-in">
          <p className="text-sm text-primary font-medium mb-1">
            {lecture.categories?.name || 'Uncategorized'}
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{lecture.title}</h1>
          {lecture.description && (
            <p className="text-muted-foreground mt-2">{lecture.description}</p>
          )}
        </div>

        <div className="animate-scale-in">
          <SecureViewer lectureId={lecture.id} slides={slides} />
        </div>
      </main>
    </div>
  );
};

export default Viewer;
