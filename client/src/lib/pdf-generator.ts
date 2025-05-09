import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { CompleteCV } from '@shared/types';

/**
 * Generates a PDF from an HTML element using html2canvas and jsPDF
 * @param element The HTML element to render to PDF
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

    // Log the process
    console.log('Starting PDF generation process');
    
    // Generate the filename from user data
    const firstName = data.personal.firstName || 'CV';
    const lastName = data.personal.lastName || '';
    const filename = `${firstName}_${lastName}_CV.pdf`.replace(/\s+/g, '_');
    
    // Fix styling issues and clone the element
    const prepareElement = (sourceElement: HTMLElement): HTMLElement => {
      // Create a clone
      const clone = sourceElement.cloneNode(true) as HTMLElement;
      
      // Fix list styling
      const lists = clone.querySelectorAll('ul');
      lists.forEach(list => {
        list.style.listStyleType = 'disc';
        list.style.paddingLeft = '1.5rem';
      });
      
      // Fix bullet points in text
      const bulletItems = clone.querySelectorAll('.relative.pl-4');
      bulletItems.forEach(item => {
        const bulletSpan = item.querySelector('span.absolute.left-0');
        if (bulletSpan) {
          bulletSpan.textContent = '•';
        }
      });
      
      // Fix SVG icons
      const svgs = clone.querySelectorAll('svg');
      svgs.forEach(svg => {
        svg.setAttribute('width', '16');
        svg.setAttribute('height', '16');
      });
      
      return clone;
    };
    
    // Prepare element for PDF generation
    const preparedElement = prepareElement(element);
    
    // Temporarily append to body with correct styling for A4 paper
    preparedElement.style.position = 'absolute';
    preparedElement.style.left = '-9999px';
    preparedElement.style.width = '210mm';
    preparedElement.style.padding = '10mm';
    preparedElement.style.margin = '0';
    preparedElement.style.backgroundColor = 'white';
    document.body.appendChild(preparedElement);
    
    try {
      // Allow element to render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Make sure fonts and images are properly loaded before capturing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Capture as canvas with high quality settings
      const canvas = await html2canvas(preparedElement, {
        scale: 3, // Higher quality
        useCORS: true,
        allowTaint: true,
        logging: true,
        backgroundColor: '#ffffff',
        imageTimeout: 15000, // Longer timeout for images
        onclone: (clonedDoc) => {
          console.log('Document cloned for canvas capture');
          const clonedElement = clonedDoc.body.querySelector('[style*="position: absolute"]');
          if (clonedElement) {
            clonedElement.classList.add('preparing-for-pdf');
          }
          return clonedDoc;
        }
      });
      
      // PDF dimensions (A4)
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Create PDF document
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Add canvas as PNG image for better quality (especially for text)
      pdf.addImage(
        canvas.toDataURL('image/png', 1.0),
        'PNG',
        0,
        0,
        imgWidth,
        imgHeight
      );
      
      // Handle multi-page if content exceeds page height
      let heightLeft = imgHeight;
      let position = 0;
      const pageHeight = 295; // A4 height in mm (297mm minus some margin)
      
      while (heightLeft > pageHeight) {
        position = -pageHeight;
        pdf.addPage();
        pdf.addImage(
          canvas.toDataURL('image/png', 1.0),
          'PNG',
          0,
          position,
          imgWidth,
          imgHeight
        );
        heightLeft -= pageHeight;
      }
      
      // Save the PDF
      pdf.save(filename);
      
      console.log('PDF generation completed successfully');
      
      // Clean up
      document.body.removeChild(preparedElement);
      document.body.removeChild(loadingEl);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      // Clean up in case of error
      if (preparedElement.parentNode) {
        preparedElement.parentNode.removeChild(preparedElement);
      }
      document.body.removeChild(loadingEl);
      
      throw error;
    }
    
  } catch (error) {
    // Final error handling
    const loadingEl = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
    if (loadingEl && loadingEl.parentNode) {
      loadingEl.parentNode.removeChild(loadingEl);
    }
    
    // Try to clean up any leftover elements
    const cloneNodes = document.querySelectorAll('div[style*="position: absolute; left: -9999px;"]');
    cloneNodes.forEach(node => {
      if (node.parentNode) {
        node.parentNode.removeChild(node);
      }
    });
    
    console.error('PDF generation failed:', error);
    
    // Show appropriate error message
    const errorMessage = 
      error instanceof Error ? error.message : 'Unknown error generating PDF';
    
    alert(`Failed to generate PDF: ${errorMessage}`);
  }
}