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
    scale: 2, // Higher scale for better quality
    useCORS: true,
    allowTaint: true,
    logging: false,
  }
};

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

    // Create a clone of the element to avoid modifying the original
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Temporarily append the clone to the body but make it invisible
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.top = '0';
    document.body.appendChild(clone);
    
    // Calculate PDF dimensions
    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = 297; // A4 height in mm
    
    // Capture the element as an image using html2canvas
    const canvas = await html2canvas(clone, {
      scale: PDF_CONFIG.quality.scale,
      useCORS: PDF_CONFIG.quality.useCORS,
      allowTaint: PDF_CONFIG.quality.allowTaint,
      logging: PDF_CONFIG.quality.logging,
    });
    
    // Calculate scaling factor to fit the canvas to PDF page
    const imgWidth = pdfWidth - 20; // 10mm margins on each side
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Create PDF document
    const pdf = new jsPDF({
      orientation: PDF_CONFIG.format.orientation,
      unit: PDF_CONFIG.format.unit,
      format: PDF_CONFIG.format.format,
    });
    
    // Add the image to the PDF
    pdf.addImage(
      canvas.toDataURL('image/jpeg', 0.95),
      'JPEG',
      10, // x position (10mm margin)
      10, // y position (10mm margin)
      imgWidth,
      imgHeight
    );
    
    // Handle multi-page PDF if content is too long
    let heightLeft = imgHeight;
    let position = 10; // Initial position
    
    while (heightLeft > pdfHeight - 20) { // 20mm total margin (10mm top + 10mm bottom)
      // Add a new page
      pdf.addPage();
      
      // Calculate remaining height
      position = -(pdfHeight - 20 - position);
      
      // Add the image to the new page, shifted upward
      pdf.addImage(
        canvas.toDataURL('image/jpeg', 0.95),
        'JPEG',
        10,
        position,
        imgWidth,
        imgHeight
      );
      
      // Update the remaining height
      heightLeft -= (pdfHeight - 20);
    }
    
    // Cleanup: remove the temporary clone
    document.body.removeChild(clone);
    
    // Generate the filename from user data
    const firstName = data.personal.firstName || 'CV';
    const lastName = data.personal.lastName || '';
    const filename = `${firstName}_${lastName}_CV.pdf`.replace(/\s+/g, '_');
    
    // Download the PDF
    pdf.save(filename);
    
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