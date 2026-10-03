import { useEffect, useRef, useState } from 'react';
// Legacy build ships polyfills for older mobile Safari / Android WebViews.
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

type PdfDocument = Awaited<ReturnType<typeof pdfjs.getDocument>['promise']>;

interface PdfCanvasViewerProps {
  url: string;
  watermarkText: string;
  zoom: number;
}

// Cap pixel density so large PDFs don't exhaust memory on phones.
const MAX_PIXEL_RATIO = 2;

const drawWatermark = (ctx: CanvasRenderingContext2D, width: number, height: number, text: string) => {
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.font = '14px monospace';
  ctx.fillStyle = '#000000';
  ctx.rotate((-15 * Math.PI) / 180);
  for (let y = -200; y < height + 200; y += 80) {
    for (let x = -200; x < width + 400; x += 350) {
      ctx.fillText(text, x, y);
    }
  }
  ctx.restore();
};

/**
 * Renders a PDF page-by-page onto canvases with pdf.js. Unlike an <iframe>, this works on
 * phones and tablets (mobile browsers can't display PDFs inline) and never hands the raw
 * PDF to the browser's built-in viewer, so there is no download/print toolbar.
 */
const PdfCanvasViewer = ({ url, watermarkText, zoom }: PdfCanvasViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<PdfDocument | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setDoc(null);
    setError('');
    const task = pdfjs.getDocument({ url });
    task.promise.then(setDoc).catch((e: unknown) => {
      console.error('Error loading PDF:', e);
      setError('Could not load this PDF. Please try again.');
    });
    return () => {
      task.destroy();
    };
  }, [url]);

  useEffect(() => {
    const container = containerRef.current;
    if (!doc || !container) return;

    const width = container.clientWidth * zoom;
    const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    const rendered = new Set<number>();
    container.replaceChildren();

    // Lay out placeholder canvases sized from page 1, then render each page only when it
    // scrolls near the viewport.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const canvas = entry.target as HTMLCanvasElement;
          const pageNumber = Number(canvas.dataset.page);
          if (rendered.has(pageNumber)) continue;
          rendered.add(pageNumber);
          observer.unobserve(canvas);

          doc.getPage(pageNumber).then(async (page) => {
            const base = page.getViewport({ scale: 1 });
            const viewport = page.getViewport({ scale: width / base.width });
            canvas.width = Math.floor(viewport.width * ratio);
            canvas.height = Math.floor(viewport.height * ratio);
            canvas.style.height = `${viewport.height}px`;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            await page.render({
              canvas,
              canvasContext: ctx,
              viewport,
              transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined,
            }).promise;
            ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
            drawWatermark(ctx, viewport.width, viewport.height, watermarkText);
          }).catch((e: unknown) => console.error(`Error rendering PDF page ${pageNumber}:`, e));
        }
      },
      { root: container, rootMargin: '200% 0px' },
    );

    let cancelled = false;
    doc.getPage(1).then((first) => {
      if (cancelled) return;
      const base = first.getViewport({ scale: 1 });
      const placeholderHeight = (width / base.width) * base.height;
      for (let i = 1; i <= doc.numPages; i++) {
        const canvas = document.createElement('canvas');
        canvas.dataset.page = String(i);
        canvas.className = 'secure-canvas block mx-auto mb-2 bg-white shadow-sm';
        canvas.style.width = `${width}px`;
        canvas.style.height = `${placeholderHeight}px`;
        canvas.style.pointerEvents = 'none';
        container.appendChild(canvas);
        observer.observe(canvas);
      }
    });

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [doc, watermarkText, zoom]);

  return (
    <>
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-auto overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y pinch-zoom' }}
      />
      {!doc && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-muted-foreground">
          {error}
        </div>
      )}
    </>
  );
};

export default PdfCanvasViewer;
