import apiFetch from '@/api/client';
import { BookOpen, Eye, FileText, GraduationCap } from 'lucide-react';
import { useEffect, useState } from 'react';

type Stats = {
  students: number;
  subjects: number;
  lectures: number;
  views: number;
};

// Rounds down to a friendly marketing figure: 7 -> "7", 43 -> "40+",
// 1,234 -> "1,200+", 15,600 -> "15k+". Never overstates the real count.
const formatCount = (n: number): string => {
  if (n < 10) return String(n);
  if (n < 1000) {
    const step = n < 100 ? 10 : 50;
    return `${Math.floor(n / step) * step}+`;
  }
  if (n < 10_000) return `${(Math.floor(n / 100) * 100).toLocaleString('en-IN')}+`;
  return `${Math.floor(n / 1000)}k+`;
};

const PublicStats = () => {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/stats/public');
        if (!res.ok) return;
        const body = await res.json();
        if (!cancelled && body?.data) setStats(body.data);
      } catch {
        // Decorative section: stay hidden if the API is unreachable.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!stats) return null;

  const items = [
    { label: 'Students', value: stats.students, icon: GraduationCap },
    { label: 'Subjects', value: stats.subjects, icon: BookOpen },
    { label: 'Lectures', value: stats.lectures, icon: FileText },
    { label: 'Lecture views', value: stats.views, icon: Eye },
  ].filter((item) => item.value > 0);

  if (items.length === 0) return null;

  return (
    <section aria-label="Platform statistics" className="container mx-auto max-w-[78rem] px-4 pt-4">
      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-4 rounded-2xl border border-border/50 bg-background/60 p-5 shadow-soft backdrop-blur-sm"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <item.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <dd className="text-2xl font-bold tabular-nums text-foreground">{formatCount(item.value)}</dd>
              <dt className="text-sm text-muted-foreground">{item.label}</dt>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
};

export default PublicStats;
