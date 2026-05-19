import apiFetch from '@/api/client';
import BackButton from '@/components/BackButton';
import LectureCard from '@/components/LectureCard';
import Navbar from '@/components/Navbar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useSubjectAccess } from '@/hooks/useSubjectAccess';
import type { CategoryPageItem as Category, LecturePageItem as Lecture, SubjectPageItem as Subject } from '@/interfaces/pages/lectures';
import { Loader2, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';



const Lectures = () => {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const { hasAccess, loading: accessLoading } = useSubjectAccess();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const categoryFilter = searchParams.get('category') || 'all';
  const subjectFilter = searchParams.get('subject') || 'all';

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, categoryFilter, subjectFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catsRes, subsRes] = await Promise.all([apiFetch('/categories'), apiFetch('/subjects')]);
      const catsBody = await catsRes.json();
      const subsBody = await subsRes.json();
      setCategories(catsBody?.data || []);
      setSubjects((subsBody?.data || []).filter((s: any) => s.is_active === true || s.isActive === true || s.is_active === undefined));

      // Fetch lectures (optionally filtered by subject)
      const lecturesPath = subjectFilter !== 'all' ? `/lectures?subjectId=${encodeURIComponent(subjectFilter)}` : '/lectures';
      const lecturesRes = await apiFetch(lecturesPath);
      const lecturesBody = await lecturesRes.json();
      let lecturesData = (lecturesBody?.data || []).map((l: any) => ({
        ...l,
        category_id: l.categoryId ?? l.category_id ?? l.subject?.category?.id ?? l.subject?.categoryId ?? l.subject?.category_id,
        categories: l.categories ?? l.subject?.category,
        subject_id: l.subjectId ?? l.subject_id ?? l.subject?.id,
        subjects: l.subjects ?? l.subject,
        created_at: l.createdAt ?? l.created_at,
        view_count: l.viewCount ?? l.view_count ?? 0,
        is_free_preview: l.isFreePreview ?? l.is_free_preview ?? false,
      }));

      // Apply category filter client-side if needed
      if (categoryFilter !== 'all') {
        lecturesData = lecturesData.filter(
          (l: any) =>
            l.category_id === categoryFilter ||
            l.categories?.id === categoryFilter ||
            l.subject?.category?.id === categoryFilter ||
            l.subject?.categoryId === categoryFilter,
        );
      }

      setLectures(lecturesData);
    } catch (e) {
      console.error('Failed to load lectures data', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredLectures = lectures.filter((lec) =>
    lec.title.toLowerCase().includes(search.toLowerCase()) ||
    lec.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleClearFilters = () => {
    setSearchParams({});
  };

  if (authLoading || accessLoading) {
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
            {subjectFilter !== 'all' && (
              <BackButton 
                to={categoryFilter !== 'all' ? `/subjects?category=${categoryFilter}` : '/subjects'} 
                label="Back to Subjects" 
              />
            )}
            {subjectFilter === 'all' && categoryFilter === 'all' && (
              <BackButton to="/" label="Back to Categories" />
            )}
            {subjectFilter === 'all' && categoryFilter !== 'all' && (
              <BackButton to={`/subjects?category=${categoryFilter}`} label="Back to Subjects" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Browse Lectures</h1>
          <p className="text-muted-foreground">
            {subjectFilter !== 'all' 
              ? `Viewing lectures for selected subject` 
              : 'Find and view protected lecture materials'}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search lectures..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select
            value={categoryFilter}
            onValueChange={(val) => {
              const newParams = new URLSearchParams(searchParams);
              newParams.set('category', val);
              setSearchParams(newParams);
            }}
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

          <Select
            value={subjectFilter}
            onValueChange={(val) => {
              const newParams = new URLSearchParams(searchParams);
              newParams.set('subject', val);
              setSearchParams(newParams);
            }}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map((sub) => (
                <SelectItem key={sub.id} value={sub.id}>
                  {sub.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lectures Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredLectures.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLectures.map((lec, index) => {
              const canView = hasAccess(lec.subject_id, lec.is_free_preview);
              return (
                <div key={lec.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                  <LectureCard
                    id={lec.id}
                    title={lec.title}
                    description={lec.description}
                    categoryName={lec.categories?.name || lec.subject?.category?.name || 'Uncategorized'}
                    categoryColor={lec.categories?.color || lec.subject?.category?.color || null}
                    viewCount={lec.view_count}
                    createdAt={lec.created_at}
                    isLocked={!canView}
                    isFreePreview={lec.is_free_preview}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            {search ? 'No lectures match your search.' : 'No lectures available yet.'}
          </div>
        )}
      </main>
    </div>
  );
};

export default Lectures;
