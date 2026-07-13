import { Button } from '@/components/ui/button';
import { ArrowRight, BadgeCheck, Download, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import previewImage from '../public/preview.jpg';

const stats = [
  { value: 'Curated', label: 'Notes by subject' },
  { value: 'Download', label: 'Keep them offline' },
  { value: '24h', label: 'Approval window' },
];

const LandingHero = () => {
  return (
    <section id="home" className="relative overflow-hidden">
      {/* decorative background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
      </div>

      <div className="container mx-auto max-w-[78rem] px-4 py-16 md:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Copy */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary shadow-soft">
              <BadgeCheck className="h-4 w-4" />
              Curated notes • Buy once • Keep them
            </div>

            <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Learn smarter.{' '}
              <span className="text-gradient-primary">Keep every note.</span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-muted-foreground lg:mx-0">
              Exam-focused notes and recorded lectures, organised by subject. Purchase what you
              need, download your PDFs, and study offline — anytime, on any device.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link to="/auth">
                <Button variant="hero" size="lg" className="px-7">
                  Get Started
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/subjects">
                <Button variant="glass" size="lg" className="px-7">
                  Browse Subjects
                </Button>
              </Link>
            </div>

            <dl className="mx-auto mt-12 grid max-w-lg grid-cols-3 gap-4 lg:mx-0">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-border/50 bg-background/60 px-3 py-4 text-center shadow-soft backdrop-blur-sm lg:text-left"
                >
                  <dt className="text-xl font-bold text-foreground sm:text-2xl">{stat.value}</dt>
                  <dd className="mt-1 text-xs text-muted-foreground">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Visual */}
          <div className="relative mx-auto w-full max-w-lg pt-6 sm:pt-0">
            <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-tr from-primary/25 via-accent/15 to-transparent blur-2xl" />

            {/* App window mockup */}
            <div className="overflow-hidden rounded-3xl border border-border/50 bg-background/80 shadow-medium backdrop-blur-xl">
              <div className="flex items-center gap-2 border-b border-border/50 bg-background/60 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-red-400/80" />
                <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
                <span className="ml-3 truncate text-xs font-medium text-muted-foreground">
                  Out from Cumfurt — Study Hub
                </span>
              </div>
              <div className="p-3">
                <img
                  src={previewImage}
                  alt="Preview of the notes and lectures library"
                  className="h-auto w-full rounded-xl"
                />
              </div>
            </div>

            {/* Floating badges — offset to the card's outer corners so they don't cover content */}
            <div className="absolute -right-2 -top-3 z-10 hidden items-center gap-2 rounded-2xl border border-border/50 bg-background/95 px-3 py-2 shadow-medium backdrop-blur-md sm:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Download className="h-4 w-4" />
              </span>
              <div className="leading-tight">
                <div className="text-xs font-semibold text-foreground">Downloadable PDF</div>
                <div className="text-[11px] text-muted-foreground">Yours to keep</div>
              </div>
            </div>

            <div className="absolute -bottom-4 -left-2 z-10 hidden items-center gap-2 rounded-2xl border border-border/50 bg-background/95 px-3 py-2 shadow-medium backdrop-blur-md sm:flex">
              <div className="flex text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
              <span className="text-xs font-semibold text-foreground">Loved by students</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingHero;
