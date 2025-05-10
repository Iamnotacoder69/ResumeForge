import { CompleteCV } from '@shared/types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
    
    // Clone the element to avoid modifying the original
    const elementClone = element.cloneNode(true) as HTMLElement;
    
    // Set styles for better rendering
    const originalStyle = window.getComputedStyle(element);
    elementClone.style.width = originalStyle.width;
    elementClone.style.margin = '0';
    
    // Temporarily add to body but hidden
    elementClone.style.position = 'absolute';
    elementClone.style.left = '-9999px';
    elementClone.style.top = '-9999px';
    document.body.appendChild(elementClone);
    
    if (showProgress && options.onProgress) {
      options.onProgress(20);
    }
    
    // Set up PDF document - A4 size
    const pdfWidth = 210; // mm
    const pdfHeight = 297; // mm
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    if (showProgress && options.onProgress) {
      options.onProgress(30);
    }
    
    // Render the element to canvas
    const canvas = await html2canvas(elementClone, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      logging: false,
      allowTaint: true,
      backgroundColor: '#ffffff', // White background
    });
    
    if (showProgress && options.onProgress) {
      options.onProgress(70);
    }
    
    // Calculate the proper width and height ratio
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Add the image to the PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    
    // If content height exceeds page, add more pages
    if (imgHeight > pdfHeight) {
      let heightLeft = imgHeight - pdfHeight;
      let position = -pdfHeight; // Starting position for each new page
      
      while (heightLeft > 0) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
    }
    
    if (showProgress && options.onProgress) {
      options.onProgress(90);
    }
    
    // Clean up the temporary element
    document.body.removeChild(elementClone);
    
    // Save and download the PDF
    pdf.save(fileName);
    
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