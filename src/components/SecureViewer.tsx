import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Shield, AlertTriangle, Lock, Maximize, Minimize } from 'lucide-react';
import { useSecurityProtection } from '@/hooks/useSecurityProtection';

interface SecureViewerProps {
  lectureId: string;
  slides: { id: string; slide_number: number; storage_path: string }[];
}

const SecureViewer = ({ lectureId, slides }: SecureViewerProps) => {
  const { user } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideUrls, setSlideUrls] = useState<Record<number, string>>({});
  const [zoom, setZoom] = useState(1);
  const [isBlurred, setIsBlurred] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [warningType, setWarningType] = useState<'warning' | 'error'>('warning');
  const viewerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageCache = useRef<Map<number, HTMLImageElement>>(new Map());

  // Sort slides by slide_number
  const sortedSlides = useMemo(
    () => [...slides].sort((a, b) => a.slide_number - b.slide_number),
    [slides]
  );

  // Security warning handler
  const showSecurityWarning = useCallback((message: string, type: 'warning' | 'error' = 'warning') => {
    setWarningMessage(message);
    setWarningType(type);
    setTimeout(() => setWarningMessage(''), 3000);
  }, []);

  // Use security protection hook
  useSecurityProtection({
    onSecurityWarning: (msg) => showSecurityWarning(msg, 'error'),
    onBlurChange: setIsBlurred,
  });

  // Generate signed URLs for slides with short expiry
  const getSignedUrl = useCallback(async (storagePath: string, slideIndex: number) => {
    const { data, error } = await supabase.storage
      .from('lecture-slides')
      .createSignedUrl(storagePath, 30); // 30 second expiry for security

    if (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }

    setSlideUrls((prev) => ({ ...prev, [slideIndex]: data.signedUrl }));
    return data.signedUrl;
  }, []);

  // Render slide to canvas (prevents direct image access)
  const renderSlideToCanvas = useCallback(
    (imageUrl: string, slideIndex: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Check if image is already cached
      let img = imageCache.current.get(slideIndex);
      
      if (!img) {
        img = new Image();
        img.crossOrigin = 'anonymous';
        imageCache.current.set(slideIndex, img);
      }

      img.onload = () => {
        // Set canvas size to match image aspect ratio
        const containerWidth = canvas.parentElement?.clientWidth || 800;
        const containerHeight = canvas.parentElement?.clientHeight || 450;
        
        const imgRatio = img!.width / img!.height;
        const containerRatio = containerWidth / containerHeight;

        let drawWidth, drawHeight;
        if (imgRatio > containerRatio) {
          drawWidth = containerWidth;
          drawHeight = containerWidth / imgRatio;
        } else {
          drawHeight = containerHeight;
          drawWidth = containerHeight * imgRatio;
        }

        canvas.width = drawWidth;
        canvas.height = drawHeight;

        // Clear and draw
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img!, 0, 0, drawWidth, drawHeight);

        // Add watermark directly on canvas
        const watermarkText = `${user?.email || 'Protected'} • ${new Date().toISOString()}`;
        ctx.save();
        ctx.globalAlpha = 0.06;
        ctx.font = '14px monospace';
        ctx.fillStyle = '#000000';
        ctx.rotate(-15 * Math.PI / 180);

        // Draw watermark pattern
        for (let y = -200; y < canvas.height + 200; y += 80) {
          for (let x = -200; x < canvas.width + 400; x += 350) {
            ctx.fillText(watermarkText, x, y);
          }
        }
        ctx.restore();
      };

      img.src = imageUrl;
    },
    [user?.email]
  );

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

  // Render current slide to canvas when URL is available
  useEffect(() => {
    if (slideUrls[currentSlide]) {
      renderSlideToCanvas(slideUrls[currentSlide], currentSlide);
    }
  }, [currentSlide, slideUrls, renderSlideToCanvas]);

  // Refresh signed URLs periodically (every 25 seconds to avoid expiry)
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (sortedSlides[currentSlide]) {
        getSignedUrl(sortedSlides[currentSlide].storage_path, currentSlide);
      }
    }, 25000);

    return () => clearInterval(refreshInterval);
  }, [currentSlide, sortedSlides, getSignedUrl]);

  // Navigation handlers
  const goToNextSlide = useCallback(() => {
    if (currentSlide < sortedSlides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    }
  }, [currentSlide, sortedSlides.length]);

  const goToPrevSlide = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  }, [currentSlide]);

  // Keyboard navigation (only for arrow keys, security handled by hook)
  useEffect(() => {
    const handleNavigation = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevSlide();
      } else if (e.key === 'ArrowRight') {
        goToNextSlide();
      }
    };

    document.addEventListener('keydown', handleNavigation);
    return () => document.removeEventListener('keydown', handleNavigation);
  }, [goToNextSlide, goToPrevSlide]);

  const zoomIn = () => setZoom(Math.min(zoom + 0.25, 3));
  const zoomOut = () => setZoom(Math.max(zoom - 0.25, 0.5));

  // Fullscreen handlers
  const toggleFullscreen = async () => {
    if (!viewerRef.current) return;

    try {
      if (!isFullscreen) {
        if (viewerRef.current.requestFullscreen) {
          await viewerRef.current.requestFullscreen();
        } else if ((viewerRef.current as any).webkitRequestFullscreen) {
          await (viewerRef.current as any).webkitRequestFullscreen();
        } else if ((viewerRef.current as any).msRequestFullscreen) {
          await (viewerRef.current as any).msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      ));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Dynamic watermark text
  const watermarkText = useMemo(
    () => `${user?.email || 'Protected'} • ${new Date().toLocaleString()}`,
    [user?.email]
  );

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
      className={`relative bg-card rounded-xl border border-border shadow-medium overflow-hidden secure-viewer ${
        isFullscreen ? 'fixed inset-0 z-[9999] rounded-none' : ''
      }`}
      onDragStart={(e) => e.preventDefault()}
      onDrop={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
    >
      {/* Security Warning Overlay */}
      {warningMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg ${
              warningType === 'error'
                ? 'bg-destructive text-destructive-foreground'
                : 'bg-yellow-500 text-white'
            }`}
          >
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
          <Lock className="w-3 h-3 text-muted-foreground" />
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
          <Button variant="ghost" size="icon" onClick={toggleFullscreen} title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          Slide {currentSlide + 1} of {sortedSlides.length}
        </div>
      </div>

      {/* Slide Display - Using Canvas for security */}
      <div
        className={`relative ${isFullscreen ? 'h-[calc(100vh-120px)]' : 'aspect-[16/9]'} bg-background overflow-hidden transition-all duration-300 ${
          isBlurred ? 'blur-xl' : ''
        }`}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
        >
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full secure-canvas"
            style={{
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Loading indicator */}
        {!slideUrls[currentSlide] && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Additional Watermark Overlay (HTML layer) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden watermark-overlay">
          <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-20 -rotate-12 opacity-[0.04]">
            {Array.from({ length: 30 }).map((_, i) => (
              <span
                key={i}
                className="text-foreground text-xs font-mono whitespace-nowrap"
                style={{ userSelect: 'none' }}
              >
                {watermarkText}
              </span>
            ))}
          </div>
        </div>

        {/* Blur overlay for content protection */}
        {isBlurred && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-3xl cursor-pointer z-10"
            onClick={() => setIsBlurred(false)}
          >
            <div className="text-center">
              <Shield className="w-16 h-16 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Content Protected</h3>
              <p className="text-muted-foreground mb-4">Click to continue viewing</p>
              <Button variant="outline" size="sm">
                Resume Viewing
              </Button>
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

        <div className="flex items-center gap-1 max-w-md overflow-x-auto py-2">
          {sortedSlides.length <= 15 ? (
            sortedSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all flex-shrink-0 ${
                  index === currentSlide
                    ? 'bg-primary w-4'
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
              />
            ))
          ) : (
            <span className="text-sm text-muted-foreground">
              {currentSlide + 1} / {sortedSlides.length}
            </span>
          )}
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

      {/* Invisible overlay to block interactions */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
};

export default SecureViewer;
