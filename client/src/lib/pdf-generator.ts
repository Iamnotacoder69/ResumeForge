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
    letterRendering: true,
    allowTaint: true,
    foreignObjectRendering: true, // Helps with bullet points and special characters
  },
  jsPDF: { 
    unit: 'mm', 
    format: 'a4', 
    orientation: 'portrait' as 'portrait' // Explicit type casting
  },
  pagebreak: { 
    mode: ['avoid-all', 'css', 'legacy'],
    before: '.page-break'
  },
  fontFaces: [
    { family: 'Arial', style: 'normal' }
  ]
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

    // Log the process for debugging
    console.log('Starting PDF generation process');
    
    // Generate the filename from user data
    const firstName = data.personal.firstName || 'CV';
    const lastName = data.personal.lastName || '';
    const filename = `${firstName}_${lastName}_CV.pdf`.replace(/\s+/g, '_');
    
    // Fix the styling issues with bullet points in the CV content
    // Convert Tailwind classes to inline styles for better PDF rendering
    const fixListStyles = (node: HTMLElement) => {
      const lists = node.querySelectorAll('ul');
      lists.forEach(list => {
        list.style.listStyleType = 'disc';
        list.style.paddingLeft = '1.5rem';
        list.style.marginBottom = '0.5rem';
      });

      // Process list items with manually added bullets
      const bulletItems = node.querySelectorAll('.relative.pl-4');
      bulletItems.forEach(item => {
        const bulletSpan = item.querySelector('span.absolute.left-0');
        if (bulletSpan) {
          bulletSpan.textContent = '•';
        }
      });

      return node;
    };

    // Get element styles and create a clone with fixed styles
    const getElementWithStyles = (sourceElement: HTMLElement) => {
      const clone = sourceElement.cloneNode(true) as HTMLElement;
      
      // Process list styles
      fixListStyles(clone);
      
      // Set explicit dimensions for PDF rendering
      clone.style.width = '210mm';
      clone.style.margin = '0';
      clone.style.padding = '10mm';
      clone.style.boxSizing = 'border-box';
      clone.style.backgroundColor = 'white';
      clone.style.color = 'black';
      clone.style.fontSize = '11pt';
      
      // Ensure SVG icons are rendered properly
      const svgs = clone.querySelectorAll('svg');
      svgs.forEach(svg => {
        svg.setAttribute('width', '16');
        svg.setAttribute('height', '16');
        svg.style.display = 'inline-block';
        svg.style.verticalAlign = 'middle';
      });
      
      return clone;
    };
    
    // Prepare the element for conversion with proper styles
    const elementToConvert = getElementWithStyles(element);
    
    // Append the clone to the body but make it invisible for PDF generation
    elementToConvert.style.position = 'absolute';
    elementToConvert.style.left = '-9999px';
    elementToConvert.style.top = '0';
    elementToConvert.style.opacity = '1';
    document.body.appendChild(elementToConvert);
    
    // Wait a brief moment for rendering
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Set custom options with dynamic filename
    const options = {
      ...PDF_CONFIG,
      filename: filename,
      html2canvas: {
        ...PDF_CONFIG.html2canvas,
        logging: true, // Enable logging for debugging
        scale: 3,      // Higher scale for better quality
        width: 795,    // A4 width in pixels at 96 DPI
        height: 1123,  // A4 height in pixels at 96 DPI
        useCORS: true,
      }
    };
    
    try {
      console.log('Starting html2pdf conversion with options:', options);
      
      // Convert HTML to PDF with proper error handling
      await html2pdf()
        .set(options)
        .from(elementToConvert)
        .save()
        .then(() => console.log('PDF conversion successful'))
        .catch(err => {
          console.error('PDF conversion error:', err);
          throw err;
        });
      
      console.log('PDF generation complete');
      
      // Cleanup
      if (elementToConvert.parentNode) {
        elementToConvert.parentNode.removeChild(elementToConvert);
      }
      if (loadingEl.parentNode) {
        loadingEl.parentNode.removeChild(loadingEl);
      }
      
    } catch (pdfError) {
      console.error('Error in html2pdf conversion:', pdfError);
      // Cleanup in case of error
      if (elementToConvert.parentNode) {
        elementToConvert.parentNode.removeChild(elementToConvert);
      }
      if (loadingEl.parentNode) {
        loadingEl.parentNode.removeChild(loadingEl);
      }
      throw pdfError;
    }
  } catch (error) {
    // Ensure cleanup of any elements that might remain
    const loadingEl = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
    if (loadingEl && loadingEl.parentNode) {
      loadingEl.parentNode.removeChild(loadingEl);
    }
    
    // Also try to remove any clones
    const cloneNodes = document.querySelectorAll('div[style*="position: absolute; left: -9999px;"]');
    cloneNodes.forEach(node => {
      if (node.parentNode) {
        node.parentNode.removeChild(node);
      }
    });
    
    // Handle error
    console.error('Error generating PDF:', error);
    
    // Show error message
    const errorMessage = 
      error instanceof Error ? error.message : 'Unknown error generating PDF';
    
    alert(`Failed to generate PDF: ${errorMessage}`);
  }
}