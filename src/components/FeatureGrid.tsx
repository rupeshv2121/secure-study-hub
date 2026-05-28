import { Eye, Lock, Shield } from 'lucide-react';

const Feature = ({ title, desc, icon }: { title: string; desc: string; icon: React.ReactNode }) => (
  <div className="p-6 rounded-2xl border border-border/50 bg-background/50 shadow-soft backdrop-blur-xl hover:shadow-glow transition-all">
    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">{icon}</div>
    <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground">{desc}</p>
  </div>
);

const FeatureGrid = () => {
  return (
    <section className="container mx-auto px-4 py-20 max-w-6xl">
      <div className="max-w-4xl mx-auto text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">Secure learning</h2>
        <p className="mt-3 text-muted-foreground">Maintain control of your content while giving learners frictionless access.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Feature
          title="Protected Content"
          desc="Anti-screenshot, download prevention, and print blocking keep your materials safe."
          icon={<Shield className="w-5 h-5 text-primary" />}
        />
        <Feature
          title="View-Only Access"
          desc="Students can study online without the ability to save or copy content."
          icon={<Eye className="w-5 h-5 text-primary" />}
        />
        <Feature
          title="Dynamic Watermarks"
          desc="Identify users with subtle, tamper-resistant watermarks on each slide."
          icon={<Lock className="w-5 h-5 text-primary" />}
        />
      </div>
    </section>
  );
};

export default FeatureGrid;
