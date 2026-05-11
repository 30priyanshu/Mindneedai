import html2pdf from 'html2pdf.js';

const PDF_GENERATION_TIMEOUT_MS = 60_000;

export class PdfElementNotFoundError extends Error {
  constructor(elementId: string) {
    super(`Element with id "${elementId}" not found`);
    this.name = 'PdfElementNotFoundError';
  }
}

export class PdfGenerationTimeoutError extends Error {
  constructor() {
    super('PDF generation timeout');
    this.name = 'PdfGenerationTimeoutError';
  }
}

/** Single responsibility: client-side PDF export from a DOM subtree via html2pdf. */
export const generatePDF = async (elementId: string, filename: string): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new PdfElementNotFoundError(elementId);
  }

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new PdfGenerationTimeoutError()), PDF_GENERATION_TIMEOUT_MS);
  });

  const pdfPromise = html2pdf()
    .set({
      margin: [8, 8, 8, 8],
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false,
        removeContainer: true,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    })
    .from(element)
    .save();

  await Promise.race([pdfPromise, timeoutPromise]);
};

/** Single responsibility: filesystem-safe filename tokens for exports. */
export const sanitizeFilename = (filename: string): string =>
  filename
    .replace(/[^a-z0-9_-\s]/gi, '')
    .replace(/\s+/g, '_')
    .replace(/_{2,}/g, '_')
    .trim()
    .toLowerCase();
