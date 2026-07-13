import { Download, FolderTree, Smartphone, Youtube } from 'lucide-react';

const features = [
  {
    title: 'Download & keep',
    desc: 'Buy once and download your notes as PDFs. Study offline whenever you like — they stay yours.',
    icon: Download,
  },
  {
    title: 'Curated by subject',
    desc: 'Every lecture and note is sorted into clear categories and subjects, so you always know what to study next.',
    icon: FolderTree,
  },
  {
    title: 'Free lectures on YouTube',
    desc: 'Preview recorded sessions from paid batches on our channel before you ever spend a rupee.',
    icon: Youtube,
  },
  {
    title: 'Learn on any device',
    desc: 'The library and viewer adapt to desktop, tablet, and phone so you can pick up right where you left off.',
    icon: Smartphone,
  },
];

const FeatureGrid = () => {
  return (
    <section id="features" className="container mx-auto max-w-6xl px-4 py-20">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <span className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Why students choose us
        </span>
        <h2 className="mt-3 text-3xl font-bold text-foreground md:text-4xl">
          Everything you need to study, nothing in the way
        </h2>
        <p className="mt-3 text-muted-foreground">
          Straightforward access to quality material — buy what you need and keep it.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(({ title, desc, icon: Icon }) => (
          <div
            key={title}
            className="group rounded-2xl border border-border/50 bg-background/60 p-6 shadow-soft backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-medium"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
            <p className="text-sm leading-6 text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeatureGrid;
