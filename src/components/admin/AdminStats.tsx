import apiFetch from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, FileText, FolderOpen, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { AdminStats as Stats } from '@/interfaces/admin';

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
        const [lecturesRes, categoriesRes] = await Promise.all([apiFetch('/lectures'), apiFetch('/categories')]);
        const lbody = await lecturesRes.json();
        const cbody = await categoriesRes.json();
        const lectures = lbody?.data || [];
        const categories = cbody?.data || [];
        const totalViews = lectures.reduce((sum: number, l: any) => sum + (l.viewCount ?? l.view_count ?? 0), 0);
        setStats({
          totalUsers: 0,
          totalLectures: lectures.length,
          totalCategories: categories.length,
          totalViews,
          recentViews: [],
        });
      } catch (e) {
        console.error('Error fetching stats:', e);
        setStats((s) => ({ ...s, recentViews: [] }));
      } finally {
        setLoading(false);
      }
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
