import apiFetch from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';
import { Activity, CalendarDays, CreditCard, Eye, FileText, FolderOpen, UserPlus, Users, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { AdminStats as Stats } from '@/interfaces/admin';

type StatCard = {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  hint?: string;
};

const StatTile = ({ stat }: { stat: StatCard }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {stat.title}
      </CardTitle>
      <stat.icon className={`w-4 h-4 ${stat.color}`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold tabular-nums">{stat.value.toLocaleString('en-IN')}</div>
      {stat.hint && <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>}
    </CardContent>
  </Card>
);

const AdminStats = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeUsers24h: 0,
    activeUsers7d: 0,
    activeUsers30d: 0,
    newUsers30d: 0,
    payingUsers: 0,
    totalLectures: 0,
    totalCategories: 0,
    totalViews: 0,
    recentViews: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiFetch('/admin/stats');
        const body = await res.json();
        const data = body?.data || {};
        setStats({
          totalUsers: data.totalUsers ?? 0,
          activeUsers24h: data.activeUsers24h ?? 0,
          activeUsers7d: data.activeUsers7d ?? 0,
          activeUsers30d: data.activeUsers30d ?? 0,
          newUsers30d: data.newUsers30d ?? 0,
          payingUsers: data.payingUsers ?? 0,
          totalLectures: data.totalLectures ?? 0,
          totalCategories: data.totalCategories ?? 0,
          totalViews: data.totalViews ?? 0,
          recentViews: data.recentViews ?? [],
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

  // "Active" means the user opened at least one lecture in the window.
  const userCards: StatCard[] = [
    { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500', hint: 'All registered accounts' },
    { title: 'Active Today', value: stats.activeUsers24h, icon: Zap, color: 'text-emerald-500', hint: 'Viewed a lecture in the last 24 hours' },
    { title: 'Active This Week', value: stats.activeUsers7d, icon: Activity, color: 'text-emerald-500', hint: 'Viewed a lecture in the last 7 days' },
    { title: 'Active This Month', value: stats.activeUsers30d, icon: CalendarDays, color: 'text-emerald-500', hint: 'Viewed a lecture in the last 30 days' },
    { title: 'New Sign-ups', value: stats.newUsers30d, icon: UserPlus, color: 'text-violet-500', hint: 'Joined in the last 30 days' },
    { title: 'Paying Users', value: stats.payingUsers, icon: CreditCard, color: 'text-amber-500', hint: 'Have an approved purchase' },
  ];

  const contentCards: StatCard[] = [
    { title: 'Total Lectures', value: stats.totalLectures, icon: FileText, color: 'text-green-500' },
    { title: 'Categories', value: stats.totalCategories, icon: FolderOpen, color: 'text-primary' },
    { title: 'Total Views', value: stats.totalViews, icon: Eye, color: 'text-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Analytics Overview</h2>

      <section className="space-y-3">
        <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Users</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {userCards.map((stat) => <StatTile key={stat.title} stat={stat} />)}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Content</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contentCards.map((stat) => <StatTile key={stat.title} stat={stat} />)}
        </div>
      </section>

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
