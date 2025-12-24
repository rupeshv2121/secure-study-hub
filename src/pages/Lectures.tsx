import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import LectureCard from '@/components/LectureCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Loader2 } from 'lucide-react';

interface Lecture {
  id: string;
  title: string;
  description: string | null;
  category_id: string;
  view_count: number;
  created_at: string;
  categories: { name: string; color: string | null } | null;
}

interface Category {
  id: string;
  name: string;
}

const Lectures = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const categoryFilter = searchParams.get('category') || 'all';

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, categoryFilter]);

  const fetchData = async () => {
    setLoading(true);

    // Fetch categories
    const { data: cats } = await supabase.from('categories').select('id, name').order('name');
    if (cats) setCategories(cats);

    // Fetch lectures
    let query = supabase
      .from('lectures')
      .select('*, categories(name, color)')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (categoryFilter !== 'all') {
      query = query.eq('category_id', categoryFilter);
    }

    const { data } = await query;
    if (data) setLectures(data);

    setLoading(false);
  };

  const filteredLectures = lectures.filter((lec) =>
    lec.title.toLowerCase().includes(search.toLowerCase()) ||
    lec.description?.toLowerCase().includes(search.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold text-foreground mb-2">Browse Lectures</h1>
          <p className="text-muted-foreground">Find and view protected lecture materials</p>
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

        {/* Lectures Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredLectures.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLectures.map((lec, index) => (
              <div key={lec.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                <LectureCard
                  id={lec.id}
                  title={lec.title}
                  description={lec.description}
                  categoryName={lec.categories?.name || 'Uncategorized'}
                  categoryColor={lec.categories?.color || null}
                  viewCount={lec.view_count}
                  createdAt={lec.created_at}
                />
              </div>
            ))}
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
