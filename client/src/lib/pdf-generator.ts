import html2pdf from 'html2pdf.js';
import { CompleteCV } from '@shared/types';

/**
 * Configuration for PDF generation
 */
const PDF_CONFIG = {
  margin: [10, 10, 10, 10], // Margins [top, right, bottom, left] in mm
  filename: 'cv.pdf',
  image: { 
    type: 'jpeg', 
    quality: 0.98 
  },
  html2canvas: { 
    scale: 2, // Scale factor for better quality
    useCORS: true,
    letterRendering: true
  },
  jsPDF: { 
    unit: 'mm', 
    format: 'a4', 
    orientation: 'portrait' as 'portrait' // Explicit type casting
  },
  pagebreak: { 
    mode: ['avoid-all', 'css', 'legacy'],
    before: '.page-break'
  }
};

/**
 * Generates a PDF directly from an HTML element using html2pdf.js
 * @param element The HTML element to convert to PDF
 * @param data The CV data (for filename)
 * @returns Promise that resolves when PDF generation is complete
 */
export async function generatePDFFromHTML(
  element: HTMLElement,
  data: CompleteCV
): Promise<void> {
  try {
    // Show a loading indicator
    const loadingEl = document.createElement('div');
    loadingEl.className = 
      'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    loadingEl.innerHTML = `
      <div class="bg-white p-4 rounded-md shadow-xl">
        <div class="flex items-center space-x-3">
          <div class="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full"></div>
          <p class="text-lg font-medium">Generating PDF...</p>
        </div>
      </div>
    `;
    document.body.appendChild(loadingEl);

    // Get the node instead of using the React ref directly
    const node = element;
    
    // Generate the filename from user data
    const firstName = data.personal.firstName || 'CV';
    const lastName = data.personal.lastName || '';
    const filename = `${firstName}_${lastName}_CV.pdf`.replace(/\s+/g, '_');
    
    // Clone the node to avoid modifying the original
    const cloneNode = node.cloneNode(true) as HTMLElement;
    
    // Append the clone to the body but make it invisible
    cloneNode.style.position = 'absolute';
    cloneNode.style.left = '-9999px';
    cloneNode.style.width = '210mm'; // A4 width
    cloneNode.style.margin = '0';
    cloneNode.style.padding = '0';
    document.body.appendChild(cloneNode);

    // Set custom options with dynamic filename
    const options = {
      ...PDF_CONFIG,
      filename: filename
    };
    
    try {
      // Convert HTML to PDF
      await html2pdf().set(options).from(cloneNode).save();
      
      // Remove clone after PDF generation
      document.body.removeChild(cloneNode);
      
      // Remove loading indicator
      document.body.removeChild(loadingEl);
    } catch (pdfError) {
      console.error('Error in html2pdf conversion:', pdfError);
      throw pdfError;
    }
  } catch (error) {
    // Remove loading indicator in case of error
    const loadingEl = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
    if (loadingEl && loadingEl.parentNode) {
      loadingEl.parentNode.removeChild(loadingEl);
    }
    
    // Also try to remove the clone if it exists
    const cloneNode = document.querySelector('div[style*="position: absolute; left: -9999px;"]');
    if (cloneNode && cloneNode.parentNode) {
      cloneNode.parentNode.removeChild(cloneNode);
    }
    
    // Handle error
    console.error('Error generating PDF:', error);
    
    // Show error message
    const errorMessage = 
      error instanceof Error ? error.message : 'Unknown error generating PDF';
    
    alert(`Failed to generate PDF: ${errorMessage}`);
  }
}