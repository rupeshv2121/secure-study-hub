import apiFetch from '@/api/client';
import BackButton from '@/components/BackButton';
import Navbar from '@/components/Navbar';
import SecureViewer from '@/components/SecureViewer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import type { LectureViewerLecture as Lecture, Slide } from '@/interfaces/pages/viewer';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';


const Viewer = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && id) {
      fetchLecture();
      logView();
    }
  }, [user, id]);

  const fetchLecture = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/lectures/${id}`);
      const body = await res.json();
      const lec = body?.data || null;
      if (lec) setLecture(lec);

      const slidesRes = await apiFetch(`/lecture-slides?lectureId=${encodeURIComponent(String(id))}`);
      const slidesBody = await slidesRes.json();
      setSlides(slidesBody?.data || []);
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

  if (authLoading || loading) {
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
          <Button onClick={() => navigate('/lectures')}>Back to Lectures</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero no-print">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <BackButton to="/lectures" label="Back to Lectures" className="mb-4" />

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
