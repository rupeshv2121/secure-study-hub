import Testimonials from '@/components/Testimonials';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import previewImage from '../public/preview.jpg';

const LandingHero = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="container mx-auto px-4 py-20 max-w-[78rem]">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-background/80 px-4 py-1 text-sm font-medium text-foreground shadow-soft">
              Secure • Curated • Focused
            </div>

            <h1 className="mt-6 text-4xl md:text-6xl font-extrabold leading-tight text-foreground">
              Learn securely. Retain more.
            </h1>

            <p className="mt-4 text-lg text-muted-foreground max-w-xl">
              Bite-sized notes, protected lectures, and a distraction-free viewer designed
              for serious learners. Access content anywhere — with privacy and integrity built in.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/auth">
                <Button className="bg-gradient-to-r from-[hsl(175,80%,35%)] to-[hsl(195,90%,45%)] text-white px-6 py-3" size="lg">
                  Get Started — Free
                </Button>
              </Link>
              <Link to="/subjects">
                <Button variant="outline" className="px-6 py-3" size="lg">
                  Browse Subjects
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-2xl border border-foreground/6 bg-white/60 p-6 shadow-soft backdrop-blur-md">
              <div className="text-sm font-medium text-muted-foreground">Live preview</div>
              <div className="mt-3 h-60 rounded-lg bg-slate-100/100 flex items-center justify-center text-white">
                <img src={previewImage} alt="" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 max-w-[78rem]">
        {Testimonials.length > 0 && <Testimonials />}
      </div>
    </section>
  );
};

export default LandingHero;
