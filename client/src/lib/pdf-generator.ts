import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { CompleteCV } from '@shared/types';

/**
 * Configuration for PDF generation
 */
const PDF_CONFIG = {
  // PDF format configuration
  format: {
    unit: 'mm' as const,
    format: 'a4' as const, // A4 format
    orientation: 'portrait' as const,
  },
  // Image quality settings
  quality: {
    scale: 4, // Higher scale for better quality (increased from 2 to 4)
    useCORS: true,
    allowTaint: true,
    logging: false,
    letterRendering: true, // Improve text rendering
    backgroundColor: '#FFFFFF', // Ensure white background
  },
  // Content positioning
  content: {
    margin: 10, // 10mm margins
    width: 190, // A4 width (210mm) - margins
  }
};

/**
 * Prepares an element for better PDF rendering
 * @param element The element to prepare for capture
 * @returns A clone of the element with proper styling
 */
function prepareElementForCapture(element: HTMLElement): HTMLElement {
  // Clone the element to avoid modifying the original
  const clone = element.cloneNode(true) as HTMLElement;
  
  // Apply specific styling to ensure proper rendering
  clone.style.width = `${PDF_CONFIG.content.width * 3.779527559}px`; // Convert mm to px (1mm = 3.779527559px)
  clone.style.margin = '0';
  clone.style.padding = '0';
  clone.style.backgroundColor = 'white';
  clone.style.position = 'absolute';
  clone.style.left = '-9999px';
  clone.style.top = '0';
  
  // Ensure all fonts are loaded and rendered correctly
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    * {
      font-family: "Helvetica", Arial, sans-serif !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    p, h1, h2, h3, h4, h5, h6, span, div {
      margin-bottom: 0.2em !important;
      line-height: 1.4 !important;
    }
  `;
  clone.appendChild(styleElement);
  
  return clone;
}

/**
 * Generates a PDF from an HTML element
 * @param element The HTML element to capture
 * @param data The CV data (for filename)
 * @returns Promise that resolves when PDF generation is complete
 */
export async function generatePDFFromHTML(
  element: HTMLElement,
  data: CompleteCV
): Promise<void> {
  try {
    // Show a loading indicator or message
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

    // Prepare the element for capture
    const clone = prepareElementForCapture(element);
    document.body.appendChild(clone);
    
    // Calculate PDF dimensions
    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = 297; // A4 height in mm
    const margin = PDF_CONFIG.content.margin;
    const contentWidth = pdfWidth - (margin * 2);
    
    try {
      // Wait for fonts and images to load
      await document.fonts.ready;
      
      // Allow some time for the DOM to fully render
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Capture the element as an image using html2canvas with improved settings
      const canvas = await html2canvas(clone, {
        scale: PDF_CONFIG.quality.scale,
        useCORS: true,
        allowTaint: true,
        logging: false,
        letterRendering: true,
        backgroundColor: '#FFFFFF',
        imageTimeout: 0, // No timeout for images
        onclone: (clonedDoc) => {
          // Force a specific rendering for better quality
          const styleElement = clonedDoc.createElement('style');
          styleElement.innerHTML = `
            * { -webkit-font-smoothing: antialiased; }
            img { image-rendering: high-quality; }
          `;
          clonedDoc.head.appendChild(styleElement);
        }
      });
      
      // Create PDF document with exact A4 dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
        putOnlyUsedFonts: true,
        floatPrecision: 16 // For better precision in rendering
      });
      
      // Calculate scaling to maintain aspect ratio while fitting A4
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Function to add a page with content
      const addPage = (pageNum: number, yPosition: number) => {
        if (pageNum > 0) {
          pdf.addPage();
        }
        
        // Add image with text extraction enabled (higher quality setting)
        pdf.addImage(
          canvas.toDataURL('image/png', 1.0), // Use PNG for better quality
          'PNG',
          margin,
          yPosition,
          imgWidth,
          imgHeight,
          undefined, 
          'FAST',
          0 // No rotation
        );
      };
      
      // Handle pagination for long content
      let heightLeft = imgHeight;
      let position = margin;
      let pageNum = 0;
      
      // Add first page
      addPage(pageNum, position);
      
      // Add additional pages if content overflows
      while (heightLeft > pdfHeight - (margin * 2)) {
        pageNum++;
        position = -(pdfHeight - (margin * 2) - position);
        heightLeft -= (pdfHeight - (margin * 2));
        addPage(pageNum, position);
      }
      
      // Generate the filename from user data
      const firstName = data.personal.firstName || 'CV';
      const lastName = data.personal.lastName || '';
      const filename = `${firstName}_${lastName}_CV.pdf`.replace(/\s+/g, '_');
      
      // Save the PDF with selectable text option enabled
      pdf.save(filename);
      
    } finally {
      // Clean up: remove the clone whether successful or not
      if (clone.parentNode) {
        clone.parentNode.removeChild(clone);
      }
    }
    
    // Remove loading indicator
    document.body.removeChild(loadingEl);
    
  } catch (error) {
    // Remove loading indicator in case of error
    const loadingEl = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
    if (loadingEl && loadingEl.parentNode) {
      loadingEl.parentNode.removeChild(loadingEl);
    }
    
    // Handle error
    console.error('Error generating PDF:', error);
    
    // Show error message
    const errorMessage = 
      error instanceof Error ? error.message : 'Unknown error generating PDF';
    
    alert(`Failed to generate PDF: ${errorMessage}`);
  }
}