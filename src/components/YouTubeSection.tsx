import { Play } from 'lucide-react';

const YouTubeSection = () => {
  return (
    <section className="container mx-auto max-w-5xl px-4 py-12">
      <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-background/60 p-8 shadow-soft backdrop-blur-xl sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-red-500/10 blur-3xl"
        />
        <div className="relative flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white shadow-medium">
            <Play className="h-7 w-7 fill-current" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-semibold text-foreground">Free lectures on YouTube</h3>
            <p className="mt-2 text-muted-foreground">
              Follow our channel for free lectures and recorded sessions from paid batches — a
              perfect way to try before you buy.
            </p>
          </div>
          <a
            href="https://www.youtube.com/@outfromcumfurt"
            target="_blank"
            rel="noreferrer"
            className="inline-flex flex-shrink-0 items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-medium text-white shadow-soft transition-all hover:bg-red-700 hover:shadow-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.5 6.2s-.2-1.7-.8-2.4c-.8-.9-1.7-.9-2.1-1-3-.2-7.5-.2-7.5-.2h-.1s-4.6 0-7.5.2c-.4.1-1.4.1-2.1 1-.6.7-.8 2.4-.8 2.4S0 8 0 9.8v1.5C0 13.9.6 15.6.6 15.6s.2 1.6.8 2.4c.8.9 1.9.9 2.4 1 1.7.1 7.3.2 7.3.2s4.6 0 7.5-.2c.4-.1 1.4-.1 2.1-1 .6-.7.8-2.4.8-2.4s.6-1.7.6-3.5v-1.5c0-1.8-.6-3.6-.6-3.6z" />
            </svg>
            <span>Visit channel</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default YouTubeSection;
