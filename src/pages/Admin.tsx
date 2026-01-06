import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FolderOpen, FileText, BarChart3 } from 'lucide-react';
import AdminCategories from '@/components/admin/AdminCategories';
import AdminLectures from '@/components/admin/AdminLectures';
import AdminStats from '@/components/admin/AdminStats';

const Admin = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('lectures');

  useEffect(() => {
    if (!loading && (!user || !profile?.is_admin)) {
      navigate('/');
    }
  }, [user, profile, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!profile?.is_admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your lectures, categories, and view analytics</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="lectures" className="gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Lectures</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <FolderOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Categories</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Stats</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lectures" className="space-y-6">
            <AdminLectures />
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <AdminCategories />
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <AdminStats />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
