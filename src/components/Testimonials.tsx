import { useEffect, useState } from "react";

type Testimonial = {
  id: string;
  name?: string | null;
  rating: number;
  message: string;
  createdAt: string;
};

const Testimonials = () => {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/feedbacks/public");
        const json = await res.json();
        if (!mounted) return;
        if (json?.success && Array.isArray(json.data)) {
          setItems(json.data.slice(0, 7));
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, []);

  if (loading) return <div className="mt-8">Loading testimonials…</div>;
  if (!items.length) return <div className="mt-8 text-muted-foreground">No testimonials yet.</div>;

  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2">
      {items.map((it) => (
        <div key={it.id} className="rounded-lg border bg-white/60 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">{it.name || "Anonymous"}</div>
            <div className="text-sm text-amber-600">{'★'.repeat(it.rating)}{'☆'.repeat(5-it.rating)}</div>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{it.message}</p>
        </div>
      ))}
    </div>
  );
};


import { Star } from 'lucide-react';

const Card = ({ quote, name, subtitle }: { quote: string; name: string; subtitle: string }) => (
  <div className="p-6 rounded-2xl border border-border/50 bg-background/50 shadow-soft">
    <div className="flex items-center gap-2 mb-3">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      ))}
    </div>
    <p className="text-muted-foreground mb-4">{quote}</p>
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold">{name[0]}</div>
      <div>
        <div className="font-semibold text-foreground">{name}</div>
        <div className="text-sm text-muted-foreground">{subtitle}</div>
      </div>
    </div>
  </div>
);

const StaticTestimonials = () => (
  <section className="container mx-auto px-4 py-20 max-w-6xl">
    <div className="max-w-4xl mx-auto text-center mb-10">
      <h2 className="text-3xl md:text-4xl font-bold text-foreground">Loved by learners</h2>
      <p className="mt-3 text-muted-foreground">Hear from students and professionals who use our secure learning tools.</p>
    </div>

    <div className="grid md:grid-cols-3 gap-6">
      <Card quote="Top-notch content protection and excellent notes for quick revision." name="Amit Kumar" subtitle="GATE Aspirant" />
      <Card quote="Perfect for upskilling — the view-only player is spot on." name="Priya Sharma" subtitle="Freelancer" />
      <Card quote="I can access my lectures without worrying about leaks." name="Raj Patel" subtitle="Student" />
    </div>
  </section>
);

export default Testimonials;
