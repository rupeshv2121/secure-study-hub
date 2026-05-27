import { useEffect, useRef } from 'react';

type Props = {
  src?: string;
  className?: string;
};

const defaultSrc = 'https://assets10.lottiefiles.com/packages/lf20_touohxv0.json';

const LottieHero = ({ src = defaultSrc, className = '' }: Props) => {
  const container = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    let anim: any = null;
    let mounted = true;

    import('lottie-web').then((lottie) => {
      if (!mounted || !container.current) return;
      try {
        anim = lottie.loadAnimation({
          container: container.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          path: src,
        });
      } catch (e) {
        // ignore
        console.warn('Lottie load failed', e);
      }
    });

    return () => {
      mounted = false;
      try {
        if (anim) anim.destroy();
      } catch (e) {}
    };
  }, [src]);

  return (
    <div className={`pointer-events-none ${className}`}>
      <div ref={container} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default LottieHero;
