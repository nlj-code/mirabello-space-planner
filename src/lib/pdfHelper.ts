import * as pdfjsLib from 'pdfjs-dist';

// Set worker source (Vite-compatible; recommended by pdfjs-dist docs).
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString();

const MAX_CANVAS_DIMENSION = 8000;

// FIX #2.4 (code quality audit): wrap the whole PDF flow so worker-fetch
// failures (e.g. subpath deploy where the asset path is wrong) produce a
// clear error instead of a silent hang.
export async function renderPdfToBase64(file: File): Promise<{ dataUrl: string; width: number; height: number }> {
  const arrayBuffer = await file.arrayBuffer();
  let pdf;
  try {
    pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/worker/i.test(msg) || /fetch/i.test(msg)) {
      throw new Error('PDF renderer failed to load. Try refreshing the page or upload a JPG/PNG instead.');
    }
    throw new Error(`Could not read PDF: ${msg}`);
  }
  const page = await pdf.getPage(1);

  const baseViewport = page.getViewport({ scale: 1 });
  const desiredScale = 2.0;
  const longestSide = Math.max(baseViewport.width, baseViewport.height) * desiredScale;
  const scale = longestSide > MAX_CANVAS_DIMENSION
    ? (MAX_CANVAS_DIMENSION / Math.max(baseViewport.width, baseViewport.height))
    : desiredScale;

  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const ctx = canvas.getContext('2d')!;
  await page.render({ canvasContext: ctx, viewport }).promise;

  return {
    dataUrl: canvas.toDataURL('image/jpeg', 0.85),
    width: viewport.width,
    height: viewport.height,
  };
}

export async function readImageFile(file: File): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => resolve({ dataUrl, width: img.width, height: img.height });
      img.onerror = reject;
      img.src = dataUrl;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
