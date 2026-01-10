import BackButton from '@/components/BackButton';
import Navbar from '@/components/Navbar';
import SecureViewer from '@/components/SecureViewer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface Lecture {
  id: string;
  title: string;
  description: string | null;
  categories: { name: string } | null;
}

interface Slide {
  id: string;
  slide_number: number;
  storage_path: string;
}

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

    const { data: lec } = await supabase
      .from('lectures')
      .select('*, categories(name)')
      .eq('id', id)
      .single();

    if (lec) {
      setLecture(lec);

      const { data: slideData } = await supabase
        .from('lecture_slides')
        .select('*')
        .eq('lecture_id', id)
        .order('slide_number');

      if (slideData) setSlides(slideData);
    }

    setLoading(false);
  };

  const logView = async () => {
    if (user && id) {
      // Log view to view_logs table
      await supabase.from('view_logs').insert({ lecture_id: id, user_id: user.id });
      
      // Increment view_count in lectures table
      const { data: lecture } = await supabase
        .from('lectures')
        .select('view_count')
        .eq('id', id)
        .single();
      
      if (lecture) {
        await supabase
          .from('lectures')
          .update({ view_count: (lecture.view_count || 0) + 1 })
          .eq('id', id);
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
