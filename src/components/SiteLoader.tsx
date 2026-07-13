import { BookOpen, Quote as QuoteIcon } from 'lucide-react';
import { useMemo } from 'react';
import { getRandomQuote } from '@/data/quotes';

interface SiteLoaderProps {
  /** Optional heading shown under the mark. Defaults to a friendly boot message. */
  label?: string;
  /** Optional supporting line under the label. */
  subtitle?: string;
}

/**
 * Full-screen brand loader. Reserved for genuine, blocking boot states
 * (resolving the session) — not for every route change. Shows a random
 * motivational quote so the wait feels purposeful.
 */
const SiteLoader = ({
  label = 'Setting up your study space',
  subtitle = 'Securely loading your account and content.',
}: SiteLoaderProps) => {
  const quote = useMemo(() => getRandomQuote(), []);

  return (
    <div className="site-loader fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden px-6">
      {/* Animated aurora background */}
      <div className="site-loader__aurora" aria-hidden="true" />
      <div className="site-loader__grid" aria-hidden="true" />

      <div className="relative flex w-full max-w-md flex-col items-center text-center">
        {/* Spinning conic ring around the brand mark */}
        <div className="relative mb-9 flex h-28 w-28 items-center justify-center">
          <div className="loader-ring absolute inset-0 rounded-full" aria-hidden="true" />
          <div className="loader-ring loader-ring--reverse absolute inset-[6px] rounded-full opacity-70" aria-hidden="true" />
          <div className="loader-mark relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-glow">
            <BookOpen className="h-7 w-7" />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
          Secure Study Hub
        </div>

        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {label}
        </h1>
        <p className="mt-2.5 max-w-sm text-sm leading-6 text-muted-foreground">
          {subtitle}
        </p>

        {/* Indeterminate progress bar with shimmer */}
        <div className="loader-track mt-8 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-primary/10">
          <div className="loader-track__fill h-full rounded-full" />
        </div>

        {/* Motivational quote */}
        <figure className="mt-9 max-w-sm rounded-2xl border border-border/60 bg-background/60 px-5 py-4 backdrop-blur-sm">
          <QuoteIcon className="mx-auto mb-2 h-4 w-4 text-primary/70" aria-hidden="true" />
          <blockquote className="text-sm italic leading-6 text-foreground/90">
            &ldquo;{quote.text}&rdquo;
          </blockquote>
          <figcaption className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            — {quote.author}
          </figcaption>
        </figure>
      </div>
    </div>
  );
};

export default SiteLoader;
