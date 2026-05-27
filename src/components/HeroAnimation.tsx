import { BookOpen, FileText, Users, Shield, Lock, Star } from 'lucide-react';

const IconBubble = ({ children, size = 56, className = '' }: any) => (
  <div
    className={`flex items-center justify-center rounded-full bg-white/90 text-primary shadow-accent-glow ${className}`}
    style={{ width: size, height: size }}
  >
    {children}
  </div>
);

const HeroAnimation = () => {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="absolute -top-10 -left-10 w-[420px] h-[420px] rounded-full bg-gradient-to-br from-primary/20 to-cyan-200/12 blur-3xl opacity-40 loader-orbit loader-orbit-slow" style={{mixBlendMode: 'screen'}} />

      <div className="absolute right-2 top-8 flex flex-col gap-6">
        <div className="animate-float animate-glow-pulse" style={{ animationDuration: '7s' }}>
          <IconBubble className="bg-white p-3 shadow-accent-glow" size={64}>
            <BookOpen className="w-6 h-6 text-primary" />
          </IconBubble>
        </div>

        <div className="animate-float-delayed animate-glow-pulse" style={{ animationDuration: '8.2s', animationDelay: '0.2s' }}>
          <IconBubble className="bg-white p-3 shadow-accent-glow" size={56}>
            <FileText className="w-5 h-5 text-primary" />
          </IconBubble>
        </div>

        <div className="animate-float" style={{ animationDelay: '0.8s', animationDuration: '6.6s' }}>
          <IconBubble className="bg-white p-3 shadow-accent-glow" size={48}>
            <Users className="w-5 h-5 text-primary" />
          </IconBubble>
        </div>
      </div>

      <div className="absolute left-8 bottom-6 flex gap-6 items-end">
        <div className="animate-float" style={{ animationDuration: '8s' }}>
          <div className="rounded-2xl bg-white/85 p-3 shadow-soft">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary" />
              <div className="text-xs text-muted-foreground">Secure</div>
            </div>
          </div>
        </div>

        <div className="animate-float-delayed" style={{ animationDuration: '9s' }}>
          <div className="rounded-2xl bg-white/85 p-3 shadow-soft">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-primary" />
              <div className="text-xs text-muted-foreground">Protected</div>
            </div>
          </div>
        </div>

        <div className="animate-float animate-glow-pulse" style={{ animationDuration: '7s' }}>
          <div className="rounded-2xl bg-white p-3 shadow-accent-glow">
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-primary" />
              <div className="text-xs text-muted-foreground">Trusted</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroAnimation;
