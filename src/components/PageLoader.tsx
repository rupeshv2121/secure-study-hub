import { cn } from '@/lib/utils';

interface PageLoaderProps {
  /** Optional label shown under the spinner. */
  label?: string;
  /** When true, fills the viewport height and centers (page-level loading). */
  fullScreen?: boolean;
  className?: string;
}

/**
 * Modern in-page loader. Use for genuine data-loading states inside a page,
 * where the surrounding chrome (navbar) may already be visible. For a blocking
 * app boot, use SiteLoader instead.
 */
const PageLoader = ({ label, fullScreen = true, className }: PageLoaderProps) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4',
        fullScreen ? 'min-h-[60vh] w-full' : 'py-16',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="loader-ring loader-ring--sm h-11 w-11 rounded-full" aria-hidden="true" />
      {label ? (
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      ) : null}
      <span className="sr-only">Loading…</span>
    </div>
  );
};

export default PageLoader;
