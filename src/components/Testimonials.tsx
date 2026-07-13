import { Quote, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

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
        const res = await fetch('/api/feedbacks/public');
        const json = await res.json();
        if (!mounted) return;
        if (json?.success && Array.isArray(json.data)) {
          setItems(json.data.slice(0, 6));
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Hide the section entirely while loading or when there is nothing to show.
  if (loading || !items.length) return null;

  return (
    <section className="container mx-auto max-w-6xl px-4 py-20">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <span className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Loved by learners
        </span>
        <h2 className="mt-3 text-3xl font-bold text-foreground md:text-4xl">
          What students are saying
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <figure
            key={it.id}
            className="flex h-full flex-col rounded-2xl border border-border/50 bg-background/60 p-6 shadow-soft backdrop-blur-sm"
          >
            <Quote className="h-7 w-7 text-primary/30" />
            <blockquote className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">
              {it.message}
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-3 border-t border-border/50 pt-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary font-semibold text-primary-foreground">
                {(it.name || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-foreground">
                  {it.name || 'Anonymous'}
                </div>
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${i < it.rating ? 'fill-current' : 'text-muted-foreground/30'}`}
                    />
                  ))}
                </div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;
