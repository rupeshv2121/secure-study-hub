import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface SecureViewerProps {
  lectureId: string;
  slides: { id: string; slide_number: number; storage_path: string }[];
}

const SecureViewer = ({ lectureId, slides }: SecureViewerProps) => {
  const { user, profile } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideUrls, setSlideUrls] = useState<Record<number, string>>({});
  const [zoom, setZoom] = useState(1);
  const [isBlurred, setIsBlurred] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const viewerRef = useRef<HTMLDivElement>(null);

  // Sort slides by slide_number
  const sortedSlides = [...slides].sort((a, b) => a.slide_number - b.slide_number);

  // Generate signed URLs for slides
  const getSignedUrl = useCallback(async (storagePath: string, slideIndex: number) => {
    const { data, error } = await supabase.storage
      .from('lecture-slides')
      .createSignedUrl(storagePath, 60); // 60 second expiry

    if (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }

    setSlideUrls((prev) => ({ ...prev, [slideIndex]: data.signedUrl }));
    return data.signedUrl;
  }, []);

  // Preload current and adjacent slides
  useEffect(() => {
    const loadSlides = async () => {
      const indicesToLoad = [currentSlide - 1, currentSlide, currentSlide + 1].filter(
        (i) => i >= 0 && i < sortedSlides.length
      );

      for (const index of indicesToLoad) {
        if (!slideUrls[index] && sortedSlides[index]) {
          await getSignedUrl(sortedSlides[index].storage_path, index);
        }
      }
    };

    loadSlides();
  }, [currentSlide, sortedSlides, slideUrls, getSignedUrl]);

  // Block keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Ctrl+S, Ctrl+P, Ctrl+C, Ctrl+U, PrintScreen
      if (
        (e.ctrlKey && ['s', 'p', 'c', 'u'].includes(e.key.toLowerCase())) ||
        e.key === 'PrintScreen' ||
        (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase()))
      ) {
        e.preventDefault();
        showSecurityWarning('This action is disabled for content protection.');
        return false;
      }

      // Navigation with arrow keys
      if (e.key === 'ArrowLeft') {
        goToPrevSlide();
      } else if (e.key === 'ArrowRight') {
        goToNextSlide();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, sortedSlides.length]);

  // Detect visibility changes (tab switch, minimize)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsBlurred(true);
        showSecurityWarning('Content hidden. Return to view.');
      } else {
        setTimeout(() => setIsBlurred(false), 500);
      }
    };

    const handleBlur = () => {
      setIsBlurred(true);
      showSecurityWarning('Content hidden. Click here to view.');
    };

    const handleFocus = () => {
      setTimeout(() => setIsBlurred(false), 300);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Block right-click
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      showSecurityWarning('Right-click is disabled for content protection.');
      return false;
    };

    const viewer = viewerRef.current;
    if (viewer) {
      viewer.addEventListener('contextmenu', handleContextMenu);
      return () => viewer.removeEventListener('contextmenu', handleContextMenu);
    }
  }, []);

  const showSecurityWarning = (message: string) => {
    setWarningMessage(message);
    setTimeout(() => setWarningMessage(''), 3000);
  };

  const goToNextSlide = () => {
    if (currentSlide < sortedSlides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const goToPrevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const zoomIn = () => setZoom(Math.min(zoom + 0.25, 3));
  const zoomOut = () => setZoom(Math.max(zoom - 0.25, 0.5));

  const watermarkText = `${user?.email || 'Protected'} • ${new Date().toLocaleString()}`;

  if (sortedSlides.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-muted rounded-xl">
        <p className="text-muted-foreground">No slides available for this lecture.</p>
      </div>
    );
  }

  return (
    <div
      ref={viewerRef}
      className="relative bg-card rounded-xl border border-border shadow-medium overflow-hidden no-select no-drag"
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Security Warning Overlay */}
      {warningMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg shadow-lg">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">{warningMessage}</span>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/50">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">Protected Content</span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={zoomOut} disabled={zoom <= 0.5}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[4rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="ghost" size="icon" onClick={zoomIn} disabled={zoom >= 3}>
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          Slide {currentSlide + 1} of {sortedSlides.length}
        </div>
      </div>

      {/* Slide Display */}
      <div
        className={`relative aspect-[16/9] bg-background overflow-hidden transition-all duration-300 ${
          isBlurred ? 'blur-xl' : ''
        }`}
      >
        {slideUrls[currentSlide] ? (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
          >
            <img
              src={slideUrls[currentSlide]}
              alt={`Slide ${currentSlide + 1}`}
              className="max-w-full max-h-full object-contain no-select no-drag"
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Watermark Overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-16 -rotate-12 opacity-[0.08]">
            {Array.from({ length: 20 }).map((_, i) => (
              <span
                key={i}
                className="text-foreground text-sm font-mono whitespace-nowrap select-none"
              >
                {watermarkText}
              </span>
            ))}
          </div>
        </div>

        {/* Blur overlay for content protection */}
        {isBlurred && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-2xl cursor-pointer"
            onClick={() => setIsBlurred(false)}
          >
            <div className="text-center">
              <Shield className="w-12 h-12 text-primary mx-auto mb-3" />
              <p className="text-muted-foreground">Click to continue viewing</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 p-4 border-t border-border bg-muted/50">
        <Button
          variant="outline"
          size="icon"
          onClick={goToPrevSlide}
          disabled={currentSlide === 0}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-1">
          {sortedSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide
                  ? 'bg-primary w-4'
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={goToNextSlide}
          disabled={currentSlide === sortedSlides.length - 1}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default SecureViewer;
