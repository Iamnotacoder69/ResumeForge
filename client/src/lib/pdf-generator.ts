import { CompleteCV } from '@shared/types';

/**
 * Configuration for PDF generation
 */
export interface PDFGenerationOptions {
  fileName?: string;
  showProgress?: boolean;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Generates a PDF from an HTML element
 * @param element The HTML element to capture
 * @param data The CV data (for filename)
 * @returns Promise that resolves when PDF generation is complete
 */
export async function generatePDFFromHTML(
  element: HTMLElement,
  data: CompleteCV,
  options: PDFGenerationOptions = {}
): Promise<void> {
  // Set default options
  const fileName = options.fileName || `${data.personal.firstName}_${data.personal.lastName}_CV.pdf`;
  const showProgress = options.showProgress !== false;
  
  try {
    if (showProgress && options.onProgress) {
      options.onProgress(10);
    }
    
    // Get the HTML content
    const htmlContent = element.outerHTML;
    
    if (showProgress && options.onProgress) {
      options.onProgress(30);
    }
    
    // Create API request to generate PDF
    const response = await fetch('/api/print-cv', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        htmlContent,
        cvData: data,
      }),
    });
    
    if (showProgress && options.onProgress) {
      options.onProgress(70);
    }
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to generate PDF: ${errorData.message || response.statusText}`);
    }
    
    // Get the PDF blob from the response
    const pdfBlob = await response.blob();
    
    if (showProgress && options.onProgress) {
      options.onProgress(90);
    }
    
    // Create a download link and trigger download
    const downloadUrl = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    setTimeout(() => {
      window.URL.revokeObjectURL(downloadUrl);
    }, 100);
    
    if (showProgress && options.onProgress) {
      options.onProgress(100);
    }
    
    if (options.onComplete) {
      options.onComplete();
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    
    if (options.onError) {
      options.onError(error instanceof Error ? error : new Error('Unknown error generating PDF'));
    }
  }
}