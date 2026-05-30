import BackButton from '@/components/BackButton';
import Navbar from '@/components/Navbar';
import AdminCategories from '@/components/admin/AdminCategories';
import AdminFeedback from '@/components/admin/AdminFeedback';
import AdminLectures from '@/components/admin/AdminLectures';
import AdminPurchases from '@/components/admin/AdminPurchases';
import AdminStats from '@/components/admin/AdminStats';
import AdminSubjects from '@/components/admin/AdminSubjects';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart3, BookOpen, FileText, FolderOpen, MessageSquare } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('lectures');

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/');
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-[78rem]">
        <div className="mb-8">
          <BackButton to="/" label="Back to Home" className="mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your lectures, subjects, categories, and view analytics</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-4xl grid-cols-6">
            <TabsTrigger value="lectures" className="gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Lectures</span>
            </TabsTrigger>
            <TabsTrigger value="subjects" className="gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Subjects</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <FolderOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Categories</span>
            </TabsTrigger>
            <TabsTrigger value="purchases" className="gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Purchases</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="feedback" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Feedback</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lectures" className="space-y-6">
            <AdminLectures />
          </TabsContent>

          <TabsContent value="subjects" className="space-y-6">
            <AdminSubjects />
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <AdminCategories />
          </TabsContent>

          <TabsContent value="purchases" className="space-y-6">
            <AdminPurchases />
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <AdminStats />
          </TabsContent>

          <TabsContent value="feedback" className="space-y-6">
            <AdminFeedback />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
