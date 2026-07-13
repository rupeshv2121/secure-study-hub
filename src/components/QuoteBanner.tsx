import { Quote as QuoteIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { getRandomQuote, type Quote } from '@/data/quotes';

interface QuoteBannerProps {
  /** Auto-rotate interval in ms. Set to 0 to disable rotation. */
  interval?: number;
  className?: string;
}

/**
 * A tasteful, auto-rotating motivational quote for the marketing/landing
 * surface. Fades between quotes and respects reduced-motion.
 */
const QuoteBanner = ({ interval = 8000, className }: QuoteBannerProps) => {
  const [quote, setQuote] = useState<Quote>(() => getRandomQuote());
  const [visible, setVisible] = useState(true);
  const quoteRef = useRef(quote);
  quoteRef.current = quote;

  useEffect(() => {
    if (!interval) return;

    const id = window.setInterval(() => {
      // fade out, swap, fade in
      setVisible(false);
      window.setTimeout(() => {
        setQuote(getRandomQuote(quoteRef.current));
        setVisible(true);
      }, 450);
    }, interval);

    return () => window.clearInterval(id);
  }, [interval]);

  return (
    <section className={cn('container mx-auto max-w-4xl px-4 py-14', className)}>
      <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-primary/[0.07] via-background to-accent/[0.07] px-6 py-10 text-center shadow-soft sm:px-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-accent/10 blur-3xl"
        />

        <span className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <QuoteIcon className="h-5 w-5" />
        </span>

        <div
          className={cn(
            'transition-all duration-500 ease-out',
            visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
          )}
        >
          <blockquote className="mx-auto max-w-2xl text-balance text-xl font-medium leading-relaxed text-foreground sm:text-2xl">
            &ldquo;{quote.text}&rdquo;
          </blockquote>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            {quote.author}
          </p>
        </div>
      </div>
    </section>
  );
};

export default QuoteBanner;
