export interface ConvertedPage {
  pageNumber: number;
  blob: Blob;
}

// Maximum pages to convert - browser memory limitation
export const MAX_PDF_PAGES = 200;

// Dynamically load PDF.js from CDN with Subresource Integrity (SRI) verification
const PDFJS_VERSION = '3.11.174';
const PDFJS_SRI = 'sha512-shD8t+M2bMch8MCS6QQYpoYjPRYuQUw8XfUbXVNqJxxycaqQ+bzj1uw3y3+laTfvk/lzaQYO+W86xKxKKAfjPg==';
const PDFJS_WORKER_SRI = 'sha512-Eq0Tzoy5kfQ/zwo7epfTBzPlt9Hmpx/I+JpLwAj+CMfXGsbCxA9C+yY0nQ8FlIa8sUjvBHikb6ZRtCQEYn4QyA==';

const loadPdfJs = async () => {
  if ((window as any).pdfjsLib) {
    return (window as any).pdfjsLib;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;
    script.integrity = PDFJS_SRI;
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;
      resolve(pdfjsLib);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

export interface PdfInfo {
  totalPages: number;
  willProcess: number;
  isLimited: boolean;
}

export const getPdfPageCount = async (file: File): Promise<PdfInfo> => {
  const pdfjsLib = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;
  const willProcess = Math.min(totalPages, MAX_PDF_PAGES);
  
  return {
    totalPages,
    willProcess,
    isLimited: totalPages > MAX_PDF_PAGES
  };
};

export const convertPdfToImages = async (
  file: File,
  onProgress?: (current: number, total: number) => void,
  maxPages: number = MAX_PDF_PAGES
): Promise<ConvertedPage[]> => {
  const pdfjsLib = await loadPdfJs();
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = Math.min(pdf.numPages, maxPages);
  const pages: ConvertedPage[] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    onProgress?.(pageNum, totalPages);
    
    const page = await pdf.getPage(pageNum);
    const scale = 2; // Higher scale for better quality
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob(
        (b) => resolve(b!),
        'image/png',
        1.0
      );
    });

    pages.push({ pageNumber: pageNum, blob });
    
    // Clean up canvas to free memory
    canvas.width = 0;
    canvas.height = 0;
  }

  return pages;
};
