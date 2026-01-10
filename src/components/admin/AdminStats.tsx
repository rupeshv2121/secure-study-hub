import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, FolderOpen, Eye } from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalLectures: number;
  totalCategories: number;
  totalViews: number;
  recentViews: { lecture_title: string; user_email: string; viewed_at: string }[];
}

const AdminStats = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalLectures: 0,
    totalCategories: 0,
    totalViews: 0,
    recentViews: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch counts - use select with count
        const [usersRes, lecturesRes, categoriesRes, viewsRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('lectures').select('id', { count: 'exact', head: true }),
          supabase.from('categories').select('id', { count: 'exact', head: true }),
          supabase.from('view_logs').select('id', { count: 'exact', head: true }),
        ]);

        // Also get total views from lectures table (sum of view_count) - this is more accurate
        const { data: lecturesData } = await supabase
          .from('lectures')
          .select('view_count');

        const totalViewsFromLectures = lecturesData?.reduce((sum, lec) => sum + (lec.view_count || 0), 0) || 0;
        const totalViewsFromLogs = viewsRes.count || 0;
        // Use logs count (actual view events) or lectures view_count (whichever is higher)
        const finalViewCount = Math.max(totalViewsFromLogs, totalViewsFromLectures);

        // Fetch recent views - get lecture titles
        const { data: recentViewsData } = await supabase
          .from('view_logs')
          .select(`
            viewed_at,
            lecture_id,
            user_id,
            lectures(title)
          `)
          .order('viewed_at', { ascending: false })
          .limit(10);

        // Fetch user emails for recent views
        const recentViewsWithEmails = await Promise.all(
          (recentViewsData || []).map(async (v: any) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('email')
              .eq('id', v.user_id)
              .single();
            
            return {
              lecture_title: v.lectures?.title || 'Unknown',
              user_email: profile?.email || 'Unknown',
              viewed_at: v.viewed_at,
            };
          })
        );

        setStats({
          totalUsers: usersRes.count || 0,
          totalLectures: lecturesRes.count || 0,
          totalCategories: categoriesRes.count || 0,
          totalViews: finalViewCount,
          recentViews: recentViewsWithEmails,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Fallback: simpler queries without joins
        const [usersRes, lecturesRes, categoriesRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('lectures').select('id', { count: 'exact', head: true }),
          supabase.from('categories').select('id', { count: 'exact', head: true }),
        ]);

        // Get view count from lectures table
        const { data: lecturesWithViews } = await supabase
          .from('lectures')
          .select('view_count');

        const totalViews = lecturesWithViews?.reduce((sum, lec) => sum + (lec.view_count || 0), 0) || 0;

        setStats({
          totalUsers: usersRes.count || 0,
          totalLectures: lecturesRes.count || 0,
          totalCategories: categoriesRes.count || 0,
          totalViews: totalViews,
          recentViews: [],
        });
      }
      setLoading(false);
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-muted-foreground">Loading stats...</div>;
  }

  const statCards = [
    { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500' },
    { title: 'Total Lectures', value: stats.totalLectures, icon: FileText, color: 'text-green-500' },
    { title: 'Categories', value: stats.totalCategories, icon: FolderOpen, color: 'text-purple-500' },
    { title: 'Total Views', value: stats.totalViews, icon: Eye, color: 'text-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Analytics Overview</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Views</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentViews.length === 0 ? (
            <p className="text-muted-foreground text-sm">No views yet</p>
          ) : (
            <div className="space-y-3">
              {stats.recentViews.map((view, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div>
                    <p className="font-medium text-sm">{view.lecture_title}</p>
                    <p className="text-xs text-muted-foreground">{view.user_email}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(view.viewed_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStats;
